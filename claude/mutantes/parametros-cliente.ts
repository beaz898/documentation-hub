import type { Definicion } from '../herramientas/mutar';

// 28/10: las condiciones de la llamada, leídas del cuerpo enviado. node claude/herramientas/mutar-cli.mts claude/mutantes/parametros-cliente.ts
export const definicion: Definicion = {
  fichero: 'lib/llm/anthropic-client.ts',
  arnes: 'lib/llm/parametros-enviados.test.ts',
  proyecto: 'suite',
  tests: 3,
  mutantes: [
    { nombre: 'la temperatura nunca se apunta', ancla: "temperatura: typeof payload.temperature === 'number' ? payload.temperature : 'sin_enviar',", cambio: "temperatura: 'sin_enviar'," },
    { nombre: 'la temperatura 0 pasa por «sin_enviar»', ancla: "temperatura: typeof payload.temperature === 'number' ? payload.temperature : 'sin_enviar',", cambio: "temperatura: payload.temperature ? Number(payload.temperature) : 'sin_enviar'," },
    { nombre: 'el esfuerzo nunca se apunta', ancla: "esfuerzo: typeof config?.effort === 'string' ? config.effort : 'sin_enviar',", cambio: "esfuerzo: 'sin_enviar'," },
    { nombre: 'max_tokens deducido y no leído', ancla: 'maxTokens: Number(payload.max_tokens),', cambio: 'maxTokens: 4096,' },
    { nombre: 'el registro sin los parámetros', ancla: 'const datos: DatosDeLaLlamada = { ...datosDeLaLlamada, parametros };', cambio: 'const datos: DatosDeLaLlamada = { ...datosDeLaLlamada };' },
    { nombre: 'alTerminar sin los parámetros de la respuesta', ancla: 'adjustedOpts.alTerminar?.({ outputTokens: r1.outputTokens, parametros: r1.parametros });', cambio: 'adjustedOpts.alTerminar?.({ outputTokens: r1.outputTokens, parametros: parametrosEnviados({}) });' },
  ],
};
