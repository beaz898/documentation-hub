import { readFileSync } from 'node:fs';

/**
 * VERIFICADOR DE CLI-20 — el fichero de control del análisis de estilo (15/09/2026).
 *
 * ⚠️ NO GENERA NADA: el fichero es la autoridad. Esto comprueba que sigue siendo
 * lo que su registro de siembra dice que es.
 *
 * ⚠️ Y AQUÍ IMPORTA MÁS QUE EN OTROS CONTROLES: lo sembrado son ERRATAS, y
 * cualquier corrector automático —un editor, un copiar-pegar por otra
 * herramienta, un «arreglar ortografía»— las quitaría **sin avisar**. Un control
 * cuyos errores han desaparecido no da cero porque el sistema esté ciego: da cero
 * porque ya no hay nada que ver, y las dos cosas se leen igual desde fuera.
 *
 * Uso:  node scripts/verificar-cli20.mjs [ruta]
 */

const RUTA = process.argv[2] ?? 'corpus-pruebas/CLI-20_protocolo-urgencias-dentales.txt';

/** El recorte del analizador (style-check.ts:83). Si el fichero lo supera, la
 *  cifra que salga sería sobre un denominador desconocido. */
const RECORTE_DEL_ANALIZADOR = 20000;

const SEMBRADOS = [
  { id: 'O1', tipo: 'ortografia',  literal: 'Las consulltas telefónicas' },
  { id: 'O2', tipo: 'ortografia',  literal: 'Los paciente con cita programada' },
  { id: 'O3', tipo: 'ortografia',  literal: 'La prescipción de analgésicos' },
  { id: 'O4', tipo: 'ortografia',  literal: 'a sido subsanada' },
  { id: 'A1', tipo: 'ambiguedad',  literal: 'por la mañana o por la tarde deberá comer ligero' },
  { id: 'A2', tipo: 'ambiguedad',  literal: 'Se avisará al responsable cuando el tratamiento haya terminado' },
  { id: 'A3', tipo: 'ambiguedad',  literal: 'es de 24 horas desde la última revisión' },
  { id: 'S1', tipo: 'sugerencia',  literal: 'Es totalmente y completamente obligatorio' },
  { id: 'S2', tipo: 'sugerencia',  literal: 'En el caso de que se dé el caso de que' },
  { id: 'S3', tipo: 'sugerencia',  literal: 'Toda urgencia atendida se registra en la historia clínica el mismo día.' },
];

const texto = readFileSync(RUTA, 'utf-8');

/**
 * ⚠️ SE COMPARA CON LOS ESPACIOS COLAPSADOS, Y ESO NO ES RELAJAR EL CONTROL.
 *
 * El fichero está ajustado a 80 columnas, así que varios de los literales
 * sembrados CRUZAN UN SALTO DE LÍNEA. El analizador recibe el texto entero y al
 * modelo el ajuste de línea no le dice nada: comparar carácter a carácter contra
 * el fichero haría fallar el control por un reajuste de párrafo, que no es un
 * cambio de contenido.
 *
 * Lo que NO se colapsa es nada más: ni mayúsculas, ni acentos, ni puntuación.
 * Una errata «arreglada» por un corrector sigue cazándose, que es el caso que
 * este verificador existe para ver.
 *
 * ⚠️ Y ESTO LO DESTAPÓ EL PROPIO VERIFICADOR la primera vez que se ejecutó:
 * tres de mis diez literales estaban escritos de corrido en el registro de
 * siembra y partidos en el fichero. Los cazó antes de gastar un crédito.
 */
const plano = texto.replace(/\s+/g, ' ');

console.log(`Fichero: ${RUTA}`);
console.log(`Caracteres: ${texto.length} (recorte del analizador: ${RECORTE_DEL_ANALIZADOR})`);

let fallos = 0;

if (texto.length > RECORTE_DEL_ANALIZADOR) {
  console.log(`✗ SUPERA EL RECORTE por ${texto.length - RECORTE_DEL_ANALIZADOR} caracteres: el final no se analizaría`);
  fallos++;
} else {
  const margen = RECORTE_DEL_ANALIZADOR - texto.length;
  const uso = ((texto.length / RECORTE_DEL_ANALIZADOR) * 100).toFixed(1);
  console.log(`✓ Cabe entero: usa el ${uso} % del recorte, margen de ${margen} caracteres`);
}

console.log('');

for (const s of SEMBRADOS) {
  // ⚠️ SE CUENTAN LAS APARICIONES, no sólo si está. S3 es un párrafo DUPLICADO:
  // su gracia es que aparezca DOS veces, y si alguien borrara una copia el
  // fichero seguiría conteniendo el literal mientras el error sembrado habría
  // desaparecido.
  const veces = plano.split(s.literal.replace(/\s+/g, ' ')).length - 1;
  const esperadas = s.id === 'S3' ? 2 : 1;
  if (veces === esperadas) {
    console.log(`✓ ${s.id} (${s.tipo}) — ${veces}×`);
  } else {
    console.log(`✗ ${s.id} (${s.tipo}) — esperadas ${esperadas} apariciones, encontradas ${veces}: «${s.literal}»`);
    fallos++;
  }
}

console.log('');
if (fallos === 0) {
  console.log(`✓ CLI-20 íntegro: los ${SEMBRADOS.length} sembrados siguen ahí.`);
  process.exit(0);
}
console.log(`✗ CLI-20 NO es un control válido: ${fallos} comprobación(es) fallida(s).`);
console.log('  No se lance ninguna tanda con él hasta arreglarlo: un cero podría ser del fichero y no del sistema.');
process.exit(1);
