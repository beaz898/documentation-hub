import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * LA CONFIGURACIÓN PARA LAS HERRAMIENTAS DE UN SOLO USO (arquitecto, 22/10/2026).
 *
 * Una herramienta de un solo uso —una prueba temporal de vitest que mide algo— no vive en el árbol del
 * producto: vive en la carpeta temporal de quien la escribe (13/10/2026). Hasta el 21/10 se lanzaba con
 * `--root E:/Doc-Hub --dir <carpeta>`; desde que `vitest.config.mts` tiene dos proyectos (`suite` y
 * `arneses`, cada uno con su `include`), ESO YA NO RECOGE NADA de fuera del repositorio. Es un efecto
 * secundario de la separación de los arneses, y costó diez minutos redescubrirlo. Ésta es la salida:
 *
 *   HERRAMIENTAS=<carpeta> npx vitest run --config claude/herramientas/vitest.herramientas.mts <filtro>
 *
 * desde la raíz del repositorio, con las pruebas en `<carpeta>/herramientas/*.test.ts`. Lo que hace:
 *   · `root` es la carpeta de las herramientas, no el repositorio: si no, vite monta la ruta del fichero de
 *     prueba mal cuando está en otra unidad (`/@id/E:/C:/…`);
 *   · `@/` apunta al repositorio, como en el producto;
 *   · y `vitest` también, porque desde una carpeta de fuera no se resuelve: sin el alias, el `import` de la
 *     prueba busca un `node_modules` que no existe allí.
 * No usa `defineConfig`, que es la identidad: así no depende de nada más que de node.
 */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..').replace(/\\/g, '/');
const carpeta = process.env.HERRAMIENTAS;
if (!carpeta) throw new Error('falta HERRAMIENTAS=<carpeta con herramientas/*.test.ts>');

export default {
  root: carpeta.replace(/\\/g, '/'),
  test: { include: ['herramientas/**/*.test.ts'], testTimeout: 300_000 },
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${REPO}/` },
      { find: /^vitest$/, replacement: `${REPO}/node_modules/vitest/dist/index.js` },
    ],
  },
};
