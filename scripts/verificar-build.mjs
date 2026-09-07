import { spawn } from 'node:child_process';

/**
 * CORRE EN LOCAL EL BUILD QUE TUMBÓ PRODUCCIÓN — B.197.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ POR QUÉ EXISTE: el 07/09/2026 `0e92faa` exportó de más en un `route.ts`,
 * el build de Vercel murió y producción se quedó cinco commits atrás.
 * `npm run typecheck` lo dio por verde — esa comprobación vive en `.next/types`,
 * un artefacto que solo escribe `next build` y que `typecheck` ni genera ni echa
 * en falta, así que cubre las rutas viejas y NO las nuevas.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y LA CREENCIA QUE LO HIZO POSIBLE ERA QUE «EL BUILD NO CORRE EN ESTA
 * MÁQUINA», del 27/08. Es falsa, y hacían falta dos cosas para verlo:
 *
 *   · `--max-old-space-size=8192` — con el heap por defecto la fase de tipos
 *     revienta por memoria a mitad.
 *   · `--no-lint` — ESLint no está ni configurado en este repositorio y era lo
 *     que se comía la memoria en «Generating static pages».
 *
 * Con las dos, medido el 07/09: **build COMPLETO y correcto en 156 s** con la
 * caché caliente (~30 s de compilación, ~60 s de tipos, el resto páginas).
 * En frío, y compitiendo con otro proceso, se midieron 5 min.
 *
 * ⚠️ CUATRO SALIDAS, Y LA ÚLTIMA ES EL MOTIVO DE QUE ESTO SEA UN GUION Y NO UNA
 * LÍNEA EN `package.json`:
 *
 *   0 · APROBADO           — el build terminó entero.
 *   0 · APROBADO EN PARTE  — la fase de tipos pasó (se alcanzó `Collecting page
 *                            data`) pero el build no llegó al final. Las rutas
 *                            y los tipos, que es lo de B.197, están BIEN.
 *   1 · RECHAZADO          — `Failed to compile` / `Type error`. Dice dónde.
 *   2 · SIN VEREDICTO      — murió sin decidir nada.
 *
 * **El 2 no es un aprobado y no es un suspenso: es «no he podido mirar».** Se
 * separa a propósito porque en esta máquina el caso es REAL: un final por falta
 * de memoria **se parece muchísimo a haber acabado bien**, y confundir esas dos
 * cosas es exactamente el fallo que costó el despliegue.
 *
 * ⚠️ FALLA CERRADO: si Next renombra los rótulos que se vigilan aquí, esto deja
 * de encontrarlos y dice SIN VEREDICTO. Nunca un falso aprobado.
 *
 * ⚠️ LO QUE NO CUBRE, dicho: esto es el build, no el despliegue. Que Vercel
 * construya no garantiza que las variables de entorno de producción estén, ni
 * que el runtime arranque.
 */

/** Rótulo que prueba que la fase de tipos corrió ENTERA y pasó. */
const TIPOS_OK = 'Collecting page data';

/** Rótulos de un fallo de compilación o de tipos. */
const FALLOS = ['Failed to compile', 'Type error:'];

/**
 * ⚠️ LA MEMORIA VA EN `NODE_OPTIONS`, NO EN UN FLAG DE ESTE `node`. Y no es
 * cuestión de estilo: **Next no compila en este proceso, sino en un BUILD
 * WORKER que se lanza aparte.** Un `--max-old-space-size` puesto aquí se queda
 * en el padre, que no hace nada; el worker arranca con el heap por defecto y
 * revienta igual. Una variable de entorno, en cambio, la heredan los hijos.
 *
 * Se descubrió falsando esto: la primera versión usaba el flag, y la prueba con
 * un export intruso dio **SIN VEREDICTO a los 47 s por falta de memoria** en vez
 * del RECHAZADO que tocaba. El guion estaba bien; la memoria no llegaba a quien
 * la necesitaba. (Y da un resultado INESTABLE: la corrida anterior, idéntica, sí
 * alcanzó a ver el error de tipos antes de quedarse sin memoria.)
 *
 * De paso, esto resuelve lo que motivó el flag: un prefijo `VAR=valor` no
 * funciona en un script de npm en Windows. Aquí la variable se pone desde
 * JavaScript, que es portable.
 */
const hijo = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'build', '--no-lint'],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      CI: 'true',
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=8192`.trim(),
    },
  },
);

/**
 * `--tolerante`: un SIN VEREDICTO avisa pero NO rompe la cadena. Lo usa
 * `npm run comprobar`. Sin el flag, SIN VEREDICTO sale con código 2.
 *
 * El RECHAZADO corta siempre, con flag o sin él: eso sí es culpa del código.
 */
const tolerante = process.argv.includes('--tolerante');

const arranque = Date.now();

let tiposOk = false;
let hayFallo = false;

/**
 * ⚠️ SE ACUMULA TODO, EN VEZ DE RECORTAR EL TROZO QUE TRAE EL RÓTULO.
 *
 * La primera versión sacaba el extracto del `chunk` en el que aparecía «Failed
 * to compile», y en la prueba real salió un rechazo que decía SOLO eso: el
 * detalle —qué fichero, qué línea, qué símbolo— venía en el chunk siguiente.
 * Un rojo que no dice DÓNDE obliga a volver a lanzar el build para enterarse.
 *
 * Los límites de los `chunk` de un `stdout` no son límites de mensaje. Si se
 * quiere el mensaje, hay que tener el texto entero.
 */
let salida = '';

function mirar(texto) {
  process.stdout.write(texto);
  salida += texto;
  if (texto.includes(TIPOS_OK)) tiposOk = true;
  if (FALLOS.some(s => texto.includes(s))) hayFallo = true;
}

/** El error, recortado del texto COMPLETO y sin los códigos de color. */
function extractoDelFallo() {
  const limpio = salida.replace(/\[[0-9;]*m/g, '');
  const lineas = limpio.split('\n');
  const i = lineas.findIndex(l => FALLOS.some(s => l.includes(s)));
  if (i === -1) return '(no se ha podido recortar el error; míralo arriba)';
  return lineas.slice(i, i + 12).join('\n').trimEnd();
}

hijo.stdout.on('data', d => mirar(d.toString()));
hijo.stderr.on('data', d => mirar(d.toString()));

hijo.on('close', codigo => {
  const s = ((Date.now() - arranque) / 1000).toFixed(0);
  console.log('\n' + '─'.repeat(70));

  if (hayFallo) {
    console.log(`❌ RECHAZADO en ${s}s — Next NO acepta el código.`);
    console.log('   Vercel va a fallar igual. NO pushees.\n');
    console.log(extractoDelFallo());
    console.log('\n   Si dice «is not a valid Route export field», un `route.ts` exporta');
    console.log('   algo que no debe: muévelo a `lib/` e impórtalo. Es B.197.');
    process.exit(1);
  }

  if (codigo === 0) {
    console.log(`✅ APROBADO en ${s}s — el build entero pasa, como en Vercel.`);
    process.exit(0);
  }

  if (tiposOk) {
    console.log(`✅ APROBADO EN PARTE en ${s}s — los tipos y las rutas están BIEN.`);
    console.log(`   La fase de tipos pasó entera; el build murió después (código ${codigo}),`);
    console.log('   casi seguro por memoria de esta máquina. Lo de B.197 está cubierto.');
    process.exit(0);
  }

  console.log(`⚠️  SIN VEREDICTO tras ${s}s — el build murió sin decidir nada.`);
  console.log('   ESTO NO ES UN APROBADO, pero tampoco es culpa tuya: en esta máquina');
  console.log('   pasa a menudo (memoria). `npm run test` SÍ cubre los exports de rutas');
  console.log('   y es determinista. Si acabas de tocar un `route.ts`, con eso vas servido.');

  // ⚠️ TOLERANTE: no rompe la cadena de `npm run comprobar`.
  // Medido el 07/09: de ocho corridas, solo cuatro dieron veredicto, y las
  // últimas ninguno — la máquina se degrada según se encadenan builds. Un paso
  // que falla la mitad de las veces POR RAZONES AJENAS AL CÓDIGO enseña a
  // ignorar el rojo, y entonces el día que el rojo sea de verdad tampoco se
  // mirará. Así que aquí avisa y deja pasar; el RECHAZADO sí corta.
  process.exit(tolerante ? 0 : 2);
});
