import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * ALCANCE DE VITEST EN ESTE PROYECTO — decidido antes de instalarlo, para que
 * la herramienta no defina su propio uso.
 *
 * Vitest existe aquí para EJECUTAR BATERÍAS DETERMINISTAS: código puro,
 * entrada conocida, salida conocida. Es la casa que le faltaba a la mitad
 * determinista de la regla de F-59/F-61 —lo que un MODELO lee se mide con
 * tandas; lo determinista, con su batería— y a la regla de F-75, que manda que
 * las baterías vivan en el repositorio.
 *
 * NO se testean aquí: componentes de React, rutas de API, hooks, nada que
 * necesite Supabase, Pinecone o Anthropic, ni mocks de ninguno de los tres.
 * Para lo que necesita estado real hay endpoints de diagnóstico
 * (app/api/admin/diagnose-vectors es el precedente). Para lo que lee un
 * modelo hay tandas (claude/Protocolo_Harness_Tasas.md).
 *
 * Si un día alguien quiere testear otra cosa, que sea una decisión discutida y
 * escrita, no una consecuencia de que la herramienta ya esté ahí.
 *
 * Este mismo alcance está escrito en el protocolo del repositorio, §1-bis de
 * claude/Protocolo_Harness_Tasas.md. Si cambia uno, cambian los dos.
 *
 * DÓNDE VIVEN LOS TESTS: al lado de su módulo (`lib/analysis/x.test.ts` junto a
 * `lib/analysis/x.ts`), no en una carpeta propia. Agrupar por dominio, no por
 * tipo de fichero — y así el módulo y su batería se borran juntos el día que
 * se retiren.
 *
 * LOS FIXTURES son los documentos de `corpus-pruebas/`, que ya están
 * versionados con sus registros de siembra. No se duplican datos de prueba.
 *
 * TIPOS: los tests importan `describe`/`it`/`expect` explícitamente desde
 * 'vitest'. No se declaran globals ni se toca `tsconfig.json`: así los tests
 * entran en `npm run typecheck` como cualquier otro .ts, que es donde deben
 * estar, y el type-check de `next build` no se rompe por símbolos sin declarar.
 */
export default defineConfig({
  test: {
    // La guarda de red: hace cumplir el alcance declarado arriba en vez de
    // dejarlo escrito y sin vigilar. Ver vitest.setup.ts.
    setupFiles: ["./vitest.setup.ts"],
    /**
     * ⚠️ EL TOPE DE TIEMPO POR CASO — subido de los 5.000 ms por defecto el
     * 23/09/2026, y la razón es el ALCANCE declarado arriba.
     *
     * Lo que vitest mide con `testTimeout` es **RELOJ DE PARED**, no trabajo. En
     * una suite cuyos casos cuestan 1-2 ms, con los workers compitiendo por CPU,
     * un caso puede quedarse sin turno y cruzar el tope sin haber hecho nada
     * raro: pasó el 23/09 con el primer caso de
     * `lib/documents/nombre-corregido.test.ts` —45 ms de trabajo, 5.173 ms de
     * pared— y puso en ROJO una pasada entera de 1.288 casos. **Un tope de pared
     * sobre código determinista mide la máquina, no el código.**
     *
     * ⚠️ POR QUÉ ESTO NO TAPA UN CUELGUE DE VERDAD, que es el riesgo normal de
     * subir un timeout: **aquí no hay nada que pueda colgarse.** El alcance
     * declarado son funciones puras deterministas —ni React, ni rutas, ni
     * Supabase, Pinecone o Anthropic, ni mocks de los tres— y la guarda de red de
     * `vitest.setup.ts` lo hace cumplir cerrando el paso a `fetch`. Sin E/S y sin
     * esperas, un caso que tardara 15 s tendría que estar en un bucle infinito de
     * CPU, y eso no lo esconde ningún tope: lo canta la duración total.
     *
     * ⚠️ Y NO SUSTITUYE AL CALENTAMIENTO de `Intl` de `vitest.setup.ts`: aquél
     * quita el coste fijo del camino de los tests, esto da margen al resto. Se
     * pusieron en el MISMO commit a propósito — uno solo de los dos deja la mitad
     * del problema, y la mitad que deja es la que no se ve.
     */
    testTimeout: 15_000,
  },
  resolve: {
    alias: [
      // tsconfig.json tiene `"paths": { "@/*": ["./*"] }` y Vitest no lee
      // `paths`. Tres líneas aquí en vez de una dependencia más
      // (vite-tsconfig-paths) que haría lo mismo.
      { find: /^@\//, replacement: fileURLToPath(new URL('./', import.meta.url)) },
    ],
  },
});
