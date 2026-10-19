/**
 * Los identificadores de modelo que se mandan a la API de Anthropic, en un solo sitio
 * (19/10/2026, F-128). Los leen el cliente (`anthropic-client.ts`), el interruptor del
 * modelo del juez (`lib/analysis/modelo-del-juez.ts`) y la prueba de la tabla de precios,
 * que exige que cada uno tenga precio: un modelo sin precio apunta coste 0 en silencio.
 * Sin dependencias, para que se pueda importar desde cualquier prueba.
 */

/** El modelo por defecto de todo el análisis, el chat y la mejora. */
export const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

/** El double-check del exhaustivo y el agente. */
export const SONNET_MODEL = 'claude-sonnet-4-6';

/** Sólo el juez, y sólo si lo enciende `ANALYSIS_JUDGE_MODEL` (F-128). */
export const HAIKU_55_MODEL = 'claude-haiku-5-5';
