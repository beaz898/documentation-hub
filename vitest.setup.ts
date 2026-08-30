import { afterEach, beforeEach } from 'vitest';

/**
 * LA GUARDA DE RED — nace de un falso verde, y conviene contar cuál.
 *
 * Un caso de `cascada-emparejamiento.test.ts` empezó a alcanzar `verifyFindings`
 * sin que nadie lo hubiera querido. La llamada salió DE VERDAD a
 * api.anthropic.com, volvió 401 «invalid x-api-key», el fail-open del cliente
 * se la tragó —que es lo CORRECTO en producción— y el caso PASÓ EN VERDE.
 *
 * Un test que llama al modelo, falla con 401 y pasa igual es un test que NO
 * PUEDE FALLAR POR LA RAZÓN QUE VIGILA. Vigilaba un descarte determinista y lo
 * daba por bueno porque el modelo no había contestado.
 *
 * ⚠️ POR QUÉ NO BASTA CON LANZAR UNA EXCEPCIÓN: porque el código de producción
 * está DISEÑADO para tragarse los fallos de red —retry, fail-open, fallback
 * determinista— y haría exactamente lo mismo con la de la guarda. Por eso la
 * violación se ANOTA y el caso se rompe DESDE `afterEach`, fuera del alcance de
 * cualquier `catch`. Que un test no pueda silenciar a su propia guarda es la
 * única forma de que la guarda sirva de algo.
 *
 * ESTO NO INVENTA UNA REGLA: hace CUMPLIR la que ya estaba escrita en
 * vitest.config.mts y en el §1-bis del protocolo — «nada que necesite Supabase,
 * Pinecone o Anthropic». Estaba declarada y no vigilada, y por eso se rompió sin
 * que saltara nada. Los tres pasan por `fetch`, así que aquí se cierra el paso a
 * los tres de una vez.
 *
 * LÍMITE, declarado antes de que alguien se apoye de más en esto: la guarda ve
 * la llamada que SALE, no la intención de llamar. Supabase revienta al
 * CONSTRUIR el cliente («supabaseUrl is required») antes de tocar `fetch`, así
 * que un caso que solo pisara el rate-limiter no sería detectado — se tragaría
 * su propio fallo y pasaría en verde igual. Hoy no hay ninguno: verificado
 * pasando la batería entera y buscando rastro de Supabase y Pinecone, cero.
 * Queda escrito por si mañana lo hay. *
 * SI TU TEST ROMPE AQUÍ, la salida no es apagar la guarda ni añadir un mock: es
 * que el caso se salió del alcance de la herramienta. O se recorta hasta el
 * trozo determinista, o se mide donde se miden los modelos, que es una tanda.
 */
type Violacion = { url: string; caso: string };
const violaciones: Violacion[] = [];
let casoActual = '(fuera de un caso)';

const fetchReal = globalThis.fetch;

globalThis.fetch = ((entrada: unknown, ...resto: unknown[]) => {
  const url =
    typeof entrada === 'string' ? entrada
    : entrada instanceof URL ? entrada.href
    : entrada instanceof Request ? entrada.url
    : String(entrada);

  violaciones.push({ url, caso: casoActual });

  // Se lanza igualmente —para que la llamada no llegue a salir— sabiendo que
  // el código de producción probablemente se la trague. Quien decide es el
  // afterEach, no esta excepción.
  return Promise.reject(
    new Error(`[guarda-de-red] llamada externa bloqueada: ${url}`)
  );
}) as typeof globalThis.fetch;

void fetchReal;

beforeEach((ctx) => {
  casoActual = ctx.task.name;
  violaciones.length = 0;
});

afterEach(() => {
  if (violaciones.length === 0) return;

  const detalle = violaciones
    .map((v) => `  · ${v.url}`)
    .join('\n');
  const n = violaciones.length;
  violaciones.length = 0;

  throw new Error(
    `[guarda-de-red] este caso hizo ${n} llamada(s) externa(s):\n${detalle}\n\n` +
    `Vitest solo ejecuta código determinista (vitest.config.mts, §1-bis del ` +
    `protocolo). El caso ha salido de ese alcance — y si estaba en verde, lo ` +
    `estaba porque el fail-open se tragó el fallo de red, no porque la ` +
    `propiedad se cumpliera.`
  );
});
