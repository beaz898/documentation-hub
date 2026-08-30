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
