import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * NINGÚN `route.ts` EXPORTA NADA QUE NEXT NO ACEPTE — B.197.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ POR QUÉ EXISTE ESTE FICHERO, y no es teoría: el 07/09/2026 el commit
 * `0e92faa` **tumbó el build de Vercel y dejó producción desactualizada**. La
 * causa fue un `export function respuestaDeReparacion` dentro de
 * `app/api/admin/reindexar/route.ts`.
 *
 *   Type error: Route "app/api/admin/reindexar/route.ts" does not match the
 *   required types of a Next.js Route.
 *     "respuestaDeReparacion" is not a valid Route export field.
 *
 * **`tsc --noEmit` pasó en verde.** Y la razón NO es que TypeScript no sepa ver
 * esto — es más incómoda: **lo ve por un artefacto de build que nadie regenera.**
 *
 * La comprobación la escribe `next build` en `.next/types/app/…/route.ts`, que
 * `tsconfig.json` incluye en su `include`. Ahí hay un `checkFields` por ruta
 * contra `typeof import(la ruta)`. Medido el 07/09 volviendo a meter el export
 * a propósito:
 *
 *   · con `.next/types/.../reindexar/route.ts` PRESENTE → `tsc --noEmit` ROJO.
 *   · con ese mismo fichero AUSENTE                     → **VERDE, con el fallo dentro.**
 *
 * `npm run typecheck` no genera ese artefacto ni comprueba que exista. O sea:
 * **el gate cubre las rutas que ya existían la última vez que alguien construyó,
 * y tiene un agujero con la forma exacta de una ruta NUEVA.** `app/api/admin/
 * reindexar/route.ts` se creó ese mismo día. El agujero no estaba en el tipo:
 * estaba en que la comprobación no llegó a escribirse.
 *
 * Y `next typegen` no lo tapa: en Next 15.1 produce un validador más flojo que
 * NO mira los exports de un route handler — mismo intruso, verde.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Por eso este fichero **lee la fuente** y no depende de ningún artefacto de
 * build: es la única forma de que el caso valga igual el día que la ruta se
 * acaba de crear, que es justo el día en que hace falta.
 *
 * No sustituye al build —hay mil cosas que el build ve y esto no— pero convierte
 * ESTA clase de error, que ya nos costó un despliegue, en un caso que corre en
 * segundos y en local.
 *
 * ⚠️ LA LISTA VA ESCRITA A MANO Y ES CERRADA, con el mismo criterio que el
 * catálogo de contadores: si mañana Next admite un campo nuevo, añadirlo tiene
 * que ser una edición deliberada que pase por aquí.
 */

/** Los verbos HTTP que un Route Handler puede exportar. */
const VERBOS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

/** La configuración de segmento que Next acepta en un `route.ts`. */
const CONFIGURACION = [
  'dynamic', 'dynamicParams', 'revalidate', 'fetchCache', 'runtime',
  'preferredRegion', 'maxDuration', 'generateStaticParams',
];

const PERMITIDOS = new Set([...VERBOS, ...CONFIGURACION]);

/**
 * Todos los `route.ts` de `app/`, sin excepciones.
 *
 * ⚠️ ES A PROPÓSITO MÁS ESTRICTO QUE NEXT, y conviene saberlo: una carpeta que
 * empieza por `_` es PRIVADA en el App Router —Next no la enruta— así que un
 * `app/api/_lo_que_sea/route.ts` no rompería ningún build y aquí sí falla.
 *
 * Se descubrió el 07/09 por accidente y de la peor manera: **la primera sonda
 * para falsar todo esto se llamó `_prueba_b197`, y por eso un build local con
 * el export intruso dentro pasó la fase de tipos tan campante.** El caso no
 * medía lo que yo creía que medía. Se rehízo con un nombre sin guion bajo.
 *
 * Se deja estricto porque errar hacia el lado seguro no cuesta nada: nadie
 * guarda ayudantes en un fichero llamado `route.ts`. Si algún día molesta, la
 * decisión de aflojarlo se toma aquí y no por descuido.
 */
function rutas(raiz: string): string[] {
  const salida: string[] = [];
  const pila = [raiz];
  while (pila.length > 0) {
    const dir = pila.pop()!;
    for (const entrada of readdirSync(dir)) {
      const ruta = join(dir, entrada);
      if (statSync(ruta).isDirectory()) pila.push(ruta);
      else if (entrada === 'route.ts' || entrada === 'route.tsx') salida.push(ruta);
    }
  }
  return salida;
}

/**
 * Los nombres exportados de un fichero, leyendo la fuente. Cubre las dos formas
 * que este repositorio usa: `export function X` / `export async function X` y
 * `export const X`. Un `export {}` o un `export default` no aparecen por aquí, y
 * se vigilan aparte.
 */
function exportados(fuente: string): string[] {
  return [...fuente.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/gm)]
    .map(m => m[1]);
}

const FICHEROS = rutas('app');

describe('los route.ts solo exportan lo que Next admite (B.197)', () => {
  /**
   * El control positivo del barrido: sin ficheros, todo lo de abajo pasaría sin
   * comprobar nada — que es la forma exacta de un cero sin denominador.
   */
  it('el barrido encuentra rutas de verdad', () => {
    expect(FICHEROS.length).toBeGreaterThan(10);
  });

  it.each(FICHEROS)('%s', fichero => {
    const nombres = exportados(readFileSync(fichero, 'utf8'));
    const intrusos = nombres.filter(n => !PERMITIDOS.has(n));

    expect(
      intrusos,
      `"${fichero}" exporta ${intrusos.join(', ')}, que Next NO admite en un route.ts. ` +
      `TUMBA EL BUILD DE VERCEL: es lo que pasó el 07/09/2026 con "respuestaDeReparacion". ` +
      `Y "npm run typecheck" NO avisa si la ruta es NUEVA: lo comprueba a través de ` +
      `".next/types", que solo escribe "next build". Muévelo a "lib/" e impórtalo aquí.`,
    ).toEqual([]);
  });

  /**
   * ⚠️ Y LAS DOS FORMAS QUE EL REGEX NO VE, vigiladas por separado en vez de
   * darlas por imposibles: `export { x }` y `export default`. Ninguna se usa hoy
   * en las rutas, y las dos romperían igual.
   */
  it.each(FICHEROS)('%s — sin export default ni re-exportaciones', fichero => {
    const fuente = readFileSync(fichero, 'utf8');
    expect(/^export\s+default\b/m.test(fuente), `"${fichero}" tiene un export default`).toBe(false);
    expect(/^export\s*\{/m.test(fuente), `"${fichero}" re-exporta con llaves`).toBe(false);
  });
});
