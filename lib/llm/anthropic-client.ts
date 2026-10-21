import type { AnthropicToolDefinition } from '../agent/tools/types';
import type {
  LLMUsage,
  LLMResponseWithUsage,
  ContentBlock,
  AgentLLMResponse,
  AgentMessage,
  SystemBlock,
} from './types';
import {
  acquireRateLimit,
  recordUsage,
  currentWindowStart,
  EST_OUTPUT_TOKENS,
} from './rate-limiter';
import { recordToContext } from '@/lib/observability/usage-context';
import { apuntarPeticion, type DatosDeLaLlamada, type EtiquetaDeLlamada } from '@/lib/observability/registro-de-llamadas';
import { leerTextoDeLaRespuesta } from './texto-de-la-respuesta';
import { HAIKU_MODEL, SONNET_MODEL } from './modelos';

// ── Constantes ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages';

// F-128 (19/10/2026): los identificadores viven en ./modelos.ts.
export const AGENT_MODEL = SONNET_MODEL;

// 5 reintentos, backoff progresivo. Red de seguridad tras el rate limiter.
const MAX_RETRIES  = 5;
const RETRY_DELAYS = [2000, 5000, 10000, 15000, 20000];

// ── Tipos internos ─────────────────────────────────────────────────────────────

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  model?: 'haiku' | 'sonnet';
  system?: string | SystemBlock[];
  messages?: MessageItem[];
  cacheSystem?: boolean;
  /** F-128: el identificador EXACTO del modelo. Prevalece sobre `model`. Hoy sólo lo usa el juez
   *  (`lib/analysis/modelo-del-juez.ts`); sin él, todo sigue con `model` como siempre. */
  modeloExacto?: string;
  /** F-128: el campo `output_config` de la API. Sólo para los modelos que lo admiten: hoy, el juez
   *  con Haiku 5.5. Sin él, el cuerpo de la petición no lleva el campo. */
  outputConfig?: { effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max' };
  /** F-128: el cuerpo NO lleva `temperature`. Hoy sólo el juez con Haiku 5.5, que rechaza con un
   *  400 cualquier temperatura que no sea 1. Sin esto, se manda `temperature` como siempre. */
  sinTemperatura?: boolean;
  /** F-128: se llama con los tokens de salida de CADA respuesta de la API de esta llamada (dos si
   *  hubo reintento por JSON mal formado). Hoy sólo lo usa el juez, para guardarlos en su lectura. */
  alTerminar?: (uso: { outputTokens: number }) => void;
  /** 3.1.1 (21/10/2026): qué etapa hace la llamada, para el registro por llamada
   *  (`lib/observability/registro-de-llamadas.ts`). NO VIAJA A LA API: `buildPayload` y
   *  `buildHeaders` no lo leen, y la prueba de cuerpo lo vigila byte a byte. */
  etiqueta?: EtiquetaDeLlamada;
}

/** F-128: el modelo de una llamada, decidido en UN sitio (antes eran cinco copias de la misma
 *  línea). Lo leen el cuerpo de la petición, las etiquetas del log y el acumulador de uso, así que
 *  el modelo que se paga y el que se apunta no pueden separarse. */
function modeloDe(opts: CallOptions): string {
  return opts.modeloExacto ?? (opts.model === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL);
}

interface RawResult {
  body: unknown;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

interface TextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

// ── Constructores de payload / headers ─────────────────────────────────────────

function buildMessages(prompt: string, opts: CallOptions): MessageItem[] {
  if (opts.messages && opts.messages.length > 0) return opts.messages;
  return [{ role: 'user', content: prompt }];
}

function buildSystemBlocks(opts: CallOptions): SystemBlock[] | null {
  if (!opts.system) return null;
  if (Array.isArray(opts.system)) {
    const blocks = [...opts.system];
    if (opts.cacheSystem && blocks.length > 0) {
      blocks[blocks.length - 1] = {
        ...blocks[blocks.length - 1],
        cache_control: { type: 'ephemeral' },
      };
    }
    return blocks;
  }
  const block: SystemBlock = { type: 'text', text: opts.system };
  if (opts.cacheSystem) block.cache_control = { type: 'ephemeral' };
  return [block];
}

function buildPayload(prompt: string, opts: CallOptions): Record<string, unknown> {
  const { maxOutputTokens = 4096, temperature = 0 } = opts;
  const modelId  = modeloDe(opts);
  const messages = buildMessages(prompt, opts);
  const payload: Record<string, unknown> = {
    model: modelId,
    max_tokens: maxOutputTokens,
    ...(opts.sinTemperatura ? {} : { temperature }),
    messages,
  };
  const systemBlocks = buildSystemBlocks(opts);
  if (systemBlocks) payload.system = systemBlocks;
  if (opts.outputConfig) payload.output_config = opts.outputConfig;
  return payload;
}

function buildHeaders(opts: CallOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };
  if (opts.cacheSystem) headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
  return headers;
}

// ── Núcleo de retry ────────────────────────────────────────────────────────────

const SIN_TOKENS = { entrada: 0, salida: 0, escrituraCache: 0, lecturaCache: 0 };

async function callAnthropicRaw(
  payload: Record<string, unknown>,
  headers: Record<string, string>,
  datos: DatosDeLaLlamada,
): Promise<RawResult> {
  let lastError = 'unknown';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }
    // 3.1.1: la latencia de ESTA petición, sin la espera de antes. Lo que se apunta no altera nada
    // de lo que se manda ni de lo que se devuelve.
    const t0 = Date.now();
    let estado: number | undefined;
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      estado = res.status;
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        apuntarPeticion(datos, { intento: attempt + 1, resultado: 'http', estadoHttp: res.status, latenciaMs: Date.now() - t0, tokens: SIN_TOKENS });
        // Incluir el body en lastError para que llegue a error_message en BD y logs del runner
        lastError = `HTTP ${res.status}: ${errBody || '(sin body)'}`;
        console.error(`[anthropic ${res.status} body]`, errBody || '(sin body)');
        if (res.status !== 429 && res.status !== 529 && res.status < 500) break;
        continue;
      }
      const body = await res.json();
      const usageRaw = (body as Record<string, unknown>)?.usage as Record<string, number> | undefined;
      const resultado = {
        body,
        inputTokens:         usageRaw?.input_tokens                ?? 0,
        outputTokens:        usageRaw?.output_tokens               ?? 0,
        cacheCreationTokens: usageRaw?.cache_creation_input_tokens ?? 0,
        cacheReadTokens:     usageRaw?.cache_read_input_tokens     ?? 0,
      };
      apuntarPeticion(datos, { intento: attempt + 1, resultado: 'ok', estadoHttp: res.status, latenciaMs: Date.now() - t0, tokens: {
        entrada: resultado.inputTokens, salida: resultado.outputTokens,
        escrituraCache: resultado.cacheCreationTokens, lecturaCache: resultado.cacheReadTokens } });
      return resultado;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // sin respuesta de la API ('red'), o con respuesta pero sin cuerpo legible ('http' con su estado)
      apuntarPeticion(datos, estado === undefined
        ? { intento: attempt + 1, resultado: 'red', latenciaMs: Date.now() - t0, tokens: SIN_TOKENS }
        : { intento: attempt + 1, resultado: 'http', estadoHttp: estado, latenciaMs: Date.now() - t0, tokens: SIN_TOKENS });
    }
  }

  throw new Error(`Anthropic API call failed after retries: ${lastError}`);
}

// ── Helpers de texto ───────────────────────────────────────────────────────────

async function callAnthropicTextWithTokens(
  prompt: string,
  opts: CallOptions,
  via: 'json' | 'texto',
  vuelta: number = 1,
  entradaEstimada?: number,
): Promise<TextResult> {
  const { body, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens } = await callAnthropicRaw(
    buildPayload(prompt, opts),
    buildHeaders(opts),
    { etiqueta: opts.etiqueta, modelo: modeloDe(opts), vuelta, entradaEstimada },
  );
  // F-122 P5: todos los bloques de texto, no sólo el primero (texto-de-la-respuesta.ts).
  const text = leerTextoDeLaRespuesta(body, `${via} · ${modeloDe(opts)}`);
  if (!text) throw new Error('Empty text response from Anthropic');
  return { text, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens };
}

// ── Respuestas de texto — sin rate limiting (función interna) ──────────────────

export async function callAnthropicText(
  prompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const { text } = await callAnthropicTextWithTokens(prompt, opts, 'texto');
  return text;
}

// ── Respuestas con usage — record-only fire-and-forget (RAG, improve, style) ──

export async function callAnthropicWithUsage(
  prompt: string,
  opts: CallOptions = {},
): Promise<LLMResponseWithUsage> {
  // Capturar la ventana antes de la llamada para contabilizar en el minuto correcto
  const windowStart = currentWindowStart();

  const { body, inputTokens, outputTokens } = await callAnthropicRaw(
    buildPayload(prompt, opts),
    buildHeaders(opts),
    { etiqueta: opts.etiqueta, modelo: modeloDe(opts), vuelta: 1 },
  );

  const d    = body as Record<string, unknown>;
  // F-122 P5: todos los bloques de texto, no sólo el primero (texto-de-la-respuesta.ts).
  const text = leerTextoDeLaRespuesta(body, `con_uso · ${modeloDe(opts)}`);
  if (!text) throw new Error('Empty text response from Anthropic');

  const usageRaw = d?.usage as Record<string, number> | undefined;
  const usage: LLMUsage = {
    inputTokens,
    outputTokens,
    cacheCreationTokens: usageRaw?.cache_creation_input_tokens ?? 0,
    cacheReadTokens:     usageRaw?.cache_read_input_tokens     ?? 0,
  };

  // Fire-and-forget: registra consumo para que análisis/agente vean el total real.
  // El error se loguea como warning; nunca bloquea la respuesta al usuario.
  recordUsage({
    windowStart,
    reqDelta:    1,
    inputDelta:  inputTokens,
    outputDelta: outputTokens,
  }).catch(err => console.warn('[rate-limiter] Error registrando uso RAG:', err));

  // Acumular en el contexto de la operación activa (si existe).
  const modelId = modeloDe(opts);
  recordToContext(modelId, {
    inputTokens,
    outputTokens,
    cacheCreationTokens: usage.cacheCreationTokens ?? 0,
    cacheReadTokens:     usage.cacheReadTokens     ?? 0,
  });

  return { text, usage };
}

// ── Respuestas JSON — blocking (pipeline de análisis) ─────────────────────────

function sanitizeJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```[^\n]*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  const candidates = [cleaned.indexOf('{'), cleaned.indexOf('[')].filter(i => i !== -1);
  const firstBrace = candidates.length > 0 ? Math.min(...candidates) : -1;
  const lastBrace  = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let result   = '';
  let inString = false;
  let escape   = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape)      { result += ch; escape = false; continue; }
    if (ch === '\\') { result += ch; escape = true;  continue; }
    if (ch === '"')  { inString = !inString; result += ch; continue; }
    if (inString) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }
    result += ch;
  }
  return result;
}

function repairTruncatedJson(sanitized: string): string {
  let repaired = sanitized;
  let inString = false;
  let escape   = false;
  const stack: Array<'{' | '['> = [];

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escape)      { escape = false; continue; }
    if (ch === '\\') { escape = true;  continue; }
    if (ch === '"')  { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' && stack[stack.length - 1] === '{') stack.pop();
    if (ch === ']' && stack[stack.length - 1] === '[') stack.pop();
  }

  if (inString) repaired += '"';
  while (stack.length > 0) {
    repaired += stack.pop() === '{' ? '}' : ']';
  }
  return repaired.replace(/,(\s*[}\]])/g, '$1');
}

function tryParseJson<T>(raw: string): T {
  const sanitized = sanitizeJsonResponse(raw);
  try { return JSON.parse(sanitized) as T; } catch { /* continúa */ }
  try { return JSON.parse(repairTruncatedJson(sanitized)) as T; } catch { /* continúa */ }
  for (let end = sanitized.length; end > 0; end--) {
    if (sanitized[end - 1] === '}' || sanitized[end - 1] === ']') {
      try { return JSON.parse(sanitized.slice(0, end)) as T; } catch { continue; }
    }
  }
  throw new Error('No valid JSON could be extracted from LLM response');
}

export async function callAnthropicJson<T = unknown>(
  prompt: string,
  opts: CallOptions = {},
): Promise<T> {
  const strictSuffix = `\n\nIMPORTANTE: Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin texto antes ni después, sin bloques de código, sin explicaciones. El JSON debe ser parseable directamente con JSON.parse().`;

  let adjustedPrompt = prompt;
  let adjustedOpts   = { ...opts };

  if (opts.messages && opts.messages.length > 0) {
    const msgs        = [...opts.messages];
    const lastUserIdx = msgs.reduce((acc, m, i) => m.role === 'user' ? i : acc, -1);
    if (lastUserIdx >= 0) {
      msgs[lastUserIdx] = { ...msgs[lastUserIdx], content: msgs[lastUserIdx].content + strictSuffix };
    }
    adjustedOpts   = { ...opts, messages: msgs };
    adjustedPrompt = '';
  } else {
    adjustedPrompt = prompt + strictSuffix;
  }

  const payload     = buildPayload(adjustedPrompt, adjustedOpts);
  const estInput    = Math.ceil(JSON.stringify(payload).length / 4);
  const windowStart = await acquireRateLimit(estInput, EST_OUTPUT_TOKENS.json);

  // Inicializar con estimados para que el finally tenga valores correctos incluso en error
  let finalInput:  number = estInput;
  let finalOutput: number = EST_OUTPUT_TOKENS.json;

  const jsonModelId = modeloDe(adjustedOpts);

  try {
    const r1 = await callAnthropicTextWithTokens(adjustedPrompt, adjustedOpts, 'json', 1, estInput);
    finalInput  = r1.inputTokens;
    finalOutput = r1.outputTokens;
    adjustedOpts.alTerminar?.({ outputTokens: r1.outputTokens });
    recordToContext(jsonModelId, {
      inputTokens:         r1.inputTokens,
      outputTokens:        r1.outputTokens,
      cacheCreationTokens: r1.cacheCreationTokens,
      cacheReadTokens:     r1.cacheReadTokens,
    });

    try {
      return tryParseJson<T>(r1.text);
    } catch {
      console.warn('[callAnthropicJson] Parse failed, retrying. head:', r1.text.slice(0, 200));
      await new Promise(r => setTimeout(r, 1500));

      const r2 = await callAnthropicTextWithTokens(adjustedPrompt, adjustedOpts, 'json', 2, estInput);
      finalInput  = r2.inputTokens;
      finalOutput = r2.outputTokens;
      adjustedOpts.alTerminar?.({ outputTokens: r2.outputTokens });
      recordToContext(jsonModelId, {
        inputTokens:         r2.inputTokens,
        outputTokens:        r2.outputTokens,
        cacheCreationTokens: r2.cacheCreationTokens,
        cacheReadTokens:     r2.cacheReadTokens,
      });

      try {
        return tryParseJson<T>(r2.text);
      } catch (err2) {
        console.warn('[callAnthropicJson] Retry parse also failed. head:', r2.text.slice(0, 200));
        throw err2;
      }
    }
  } finally {
    recordUsage({
      windowStart,
      reqDelta:    0,
      inputDelta:  finalInput  - estInput,
      outputDelta: finalOutput - EST_OUTPUT_TOKENS.json,
    }).catch(err => console.warn('[rate-limiter] Error ajustando uso de análisis:', err));
  }
}

// ── Respuestas del agente — blocking (tool_use) ────────────────────────────────

export async function callAnthropicAgent(
  systemBlocks: SystemBlock[],
  messages: AgentMessage[],
  tools: AnthropicToolDefinition[],
): Promise<AgentLLMResponse> {
  // Marca el último tool con cache_control para cachear todas las definiciones de herramienta.
  // Admin y member producen listas distintas → dos entradas de caché independientes (correcto).
  const toolsWithCache = tools.length > 0
    ? [
        ...tools.slice(0, -1),
        { ...tools[tools.length - 1], cache_control: { type: 'ephemeral' as const } },
      ]
    : tools;

  const payload = {
    model:       AGENT_MODEL,
    max_tokens:  8192,
    temperature: 0,
    system:      systemBlocks,
    tools:       toolsWithCache,
    messages,
  };
  const headers = {
    'Content-Type':      'application/json',
    'x-api-key':         ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-beta':    'prompt-caching-2024-07-31',
  };

  const estInput    = Math.ceil(JSON.stringify(payload).length / 4);
  const windowStart = await acquireRateLimit(estInput, EST_OUTPUT_TOKENS.agent);

  let finalInput:  number = estInput;
  let finalOutput: number = EST_OUTPUT_TOKENS.agent;

  try {
    const { body, inputTokens, outputTokens } = await callAnthropicRaw(
      payload as Record<string, unknown>,
      headers,
      { modelo: AGENT_MODEL, vuelta: 1, entradaEstimada: estInput },
    );
    finalInput  = inputTokens;
    finalOutput = outputTokens;

    const d = body as {
      stop_reason: string;
      content:     ContentBlock[];
      usage: {
        input_tokens:                number;
        output_tokens:               number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens:     number;
      };
    };

    const cacheCreation = d.usage?.cache_creation_input_tokens ?? 0;
    const cacheRead     = d.usage?.cache_read_input_tokens     ?? 0;
    if (cacheCreation > 0) console.log(`[agent-llm] cache write: ${cacheCreation}t`);
    if (cacheRead     > 0) console.log(`[agent-llm] cache read:  ${cacheRead}t (saved ~${Math.round(cacheRead * 0.9)}t)`);

    recordToContext(AGENT_MODEL, {
      inputTokens:         inputTokens,
      outputTokens:        outputTokens,
      cacheCreationTokens: cacheCreation,
      cacheReadTokens:     cacheRead,
    });

    return {
      stop_reason: d.stop_reason ?? 'end_turn',
      content:     Array.isArray(d.content) ? d.content : [],
      usage: {
        input_tokens:  inputTokens,
        output_tokens: outputTokens,
      },
    };
  } finally {
    recordUsage({
      windowStart,
      reqDelta:    0,
      inputDelta:  finalInput  - estInput,
      outputDelta: finalOutput - EST_OUTPUT_TOKENS.agent,
    }).catch(err => console.warn('[rate-limiter] Error ajustando uso del agente:', err));
  }
}
