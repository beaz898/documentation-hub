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
/**
 * ⚠️ EL CALENTAMIENTO DE `Intl` — 23/09/2026. NO SE BORRA SIN LEER ESTO.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ HACE Y POR QUÉ ESTÁ AQUÍ. La **primera** llamada a un formateador de
 * `Intl` con una localización no trivial carga los datos de ICU de esa
 * localización. Medido en este mismo Node (v24, `icu full`): **41,40 ms la
 * primera; 0,24 ms de media las mil siguientes.** Es un coste de UNA VEZ por
 * worker, y lo paga quien llame primero.
 *
 * Quien llamaba primero era **el primer caso de
 * `lib/documents/nombre-corregido.test.ts`**, porque su función compone el
 * nombre con `toLocaleDateString('es-ES', …)`. Ese caso costaba **~45 ms
 * medidos en aislamiento** —cinco pasadas: 44, 48, 49, 48, 46— frente a **1-2 ms**
 * de los once casos siguientes del MISMO fichero, que ya lo encontraban
 * caliente.
 *
 * ⚠️ QUÉ PASABA, Y ES UN FALLO DEL INSTRUMENTO Y NO DEL CÓDIGO: el
 * `testTimeout` de vitest es **RELOJ DE PARED**. Con los workers compitiendo por
 * CPU, esos 45 ms de trabajo se estiraron a **5.173 ms de pared** y cruzaron el
 * tope de 5.000 ms por 173 ms. El test es puro, síncrono, con fechas fijas y sin
 * estado compartido: **no puede dar un resultado distinto.** Lo único que varió
 * fue cuánto tardó.
 *
 * ⚠️ POR QUÉ ERA ÉSE Y NO OTRO, que es la parte que hay que conservar: con 1-2 ms
 * de coste, a cualquier otro caso le hace falta un estiramiento de ~2.500× para
 * cruzar los 5 s. A éste le bastaba **115×**. Era **el único caso de la suite con
 * un coste fijo de decenas de milisegundos**, o sea el único con margen pequeño.
 * No fue mala suerte: fue el eslabón corto.
 *
 * ⚠️ SI ALGUIEN BORRA ESTAS LÍNEAS, el coste fijo vuelve al camino de los tests y
 * **el primer caso del primer fichero que toque `Intl` vuelve a ser el eslabón
 * corto** — y no será necesariamente el mismo de antes, así que el síntoma
 * reaparecerá en otro sitio y costará volver a encontrarlo. Se tardó una pasada
 * en cazarlo con `--reporter=verbose` y cuatro mediciones en explicarlo.
 *
 * LO QUE SE CALIENTA, y es lo que hace falta y nada más: **las dos formas que el
 * alcance de vitest alcanza** — una fecha en `es-ES` (`nombre-corregido.ts:41`) y
 * un número en `es` (`chunking-tamano-segmentos.test.ts:72`). Lo caro es el
 * PRIMER contacto con ICU, no la forma concreta del formateador.
 * ═══════════════════════════════════════════════════════════════════════════
 */
new Date(0).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
(0).toLocaleString('es');

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
