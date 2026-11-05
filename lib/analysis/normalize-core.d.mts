// LOS TIPOS DE normalize-core.mjs (05/11/2026), copiados de su propio JSDoc (normalize-core.mjs:78-79, 140-142 y 171-172).
// Por qué existe: desde el 25/09 (2b6d7002, la mudanza de las tres funciones a .mjs) el typecheck del WORKER fallaba con
// TS7016 en normalize.ts:42, porque worker/tsconfig.json no tiene allowJs y no acepta un import de .mjs sin declaración; la
// raíz pasaba porque sí lo tiene. Sin efecto en tiempo de ejecución: sólo lo lee tsc. Si cambia una firma en el .mjs, se
// cambia aquí en el mismo commit (lo vigila el typecheck de la raíz, que con este fichero lee estos tipos y no los del JSDoc).
export function normalize(s: string): string;
export function esVarianteDeEscritura(a: string, b: string): boolean;
export function claveSegura(s: string): string;
