/**
 * F-61: extraída de judge.ts a su propio fichero — sin cambiar una línea de
 * su cuerpo ni de su doctrina — porque table-structure.ts pasa a necesitarla
 * (para `alignQuoteToCells`) y judge.ts ya importa de table-structure.ts
 * (`getOrderedColumns`, `groupChunksByTable`, `renderTableBlock`): que
 * table-structure.ts importara `normalize` desde judge.ts habría cerrado un
 * ciclo (judge -> table-structure -> judge). judge.ts sigue exportando
 * `normalize` desde el mismo sitio de siempre (`export { normalize }`), así
 * que ningún import existente (`from './judge'`, en retrieval.ts y
 * finding-rules.ts) cambia.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ 25/09/2026 — EL CUERPO DE LAS TRES SE MUDÓ A `normalize-core.mjs` Y ESTE
 * FICHERO PASA A SER SU PUERTA. Ni un carácter de su comportamiento cambia:
 * son las mismas funciones, con su doctrina entera, en un fichero que **un
 * `.mjs` también puede importar**.
 *
 * EL MOTIVO, en una frase: el examen tenía su propia respuesta a «¿existe esta
 * frase en este texto?» —`includes` exacto en `lib/examen/discriminantes.mjs`,
 * que es `.mjs` porque `scripts/examen.mjs` lo necesita— y **las dos ya habían
 * divergido**: el 25/09 dio AUSENTES dos frases que estaban en sus documentos,
 * partidas por un salto de línea. Un criterio se implementa UNA VEZ, y la única
 * forma de que el `.mjs` pregunte en vez de recalcular era que el criterio
 * viviera donde los dos llegan.
 *
 * ⚠️ SE MUDARON LAS TRES, NO UNA, y ésa es la decisión que salva el invariante
 * en vez de romperlo (arquitecto, 25/09/2026): con `normalize` fuera y
 * `esVarianteDeEscritura` aquí, el aviso de «no se pueden leer por separado»
 * habría quedado mintiendo. Con las tres al otro lado, el invariante **se
 * traslada intacto y no se reescribe para justificar una excepción**. Su texto
 * completo vive ahora en la cabecera de `normalize-core.mjs`, junto al censo de
 * consumidores que enseñó a quién protege de verdad.
 *
 * LO QUE ESTE FICHERO SIGUE HACIENDO, y por eso no se borra: **es la puerta por
 * la que entra todo el mundo.** Los seis consumidores de producción importan de
 * aquí (o de `judge.ts`, que re-exporta), así que la mudanza no tocó ni un
 * import. Y es donde miraría quien busque «dónde está normalize»: un fichero que
 * desaparece manda a leer un `git log`; uno que apunta, no.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export { normalize, esVarianteDeEscritura, claveSegura } from './normalize-core.mjs';
