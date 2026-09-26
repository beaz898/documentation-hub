/**
 * EL VERIFICADOR DE DISCRIMINANTES, SOBRE LOS FRAGMENTOS (25/09/2026).
 *
 * ⚠️ POR QUÉ EXISTE: la corrección de Fable del 25/09. «El grep se hizo sobre el
 * documento, no sobre los fragmentos. **Si el trozado parte una frase
 * discriminante en dos fragmentos, el juez no puede citarla aunque acierte.**
 * Repetid el grep sobre la tabla de fragmentos, y repetidlo EN CADA PASADA,
 * porque un cambio de trozado lo rompería en silencio.»
 *
 * El troceado va POR SECCIONES, con objetivo de 1.200 caracteres y subdivisión
 * por encima de 1.500 (`lib/chunking.ts:26-28`) — no los ~2.000 que decía esta
 * cabecera copiándolo de `CLAUDE.md`, que llevaba equivocado desde `a297b8c5`
 * (19/08/2026) y se corrigió el 25/09. Los trozos reales del corpus van de 300
 * a 1.100 caracteres, así que una frase de 40-60 cerca de una costura puede
 * quedar partida. La comprobación que hicimos el 25/09 —`grep -c` sobre el
 * texto extraído del `.docx`— medía el DOCUMENTO y no dice nada sobre esto.
 *
 * ⚠️ COMPARA CON EL `normalize` DEL PRODUCTO, Y ES LA MISMA PREGUNTA QUE HACE EL
 * MARCADOR (26/09/2026). Hasta entonces comparaba con `includes` exacto mientras
 * `marcador.mjs` empareja con `normalize(…).includes(normalize(…))`: la
 * comprobación era MÁS ESTRICTA que el emparejamiento, así que podía abortar
 * como `NO_MEDIBLE` un caso que el marcador sí sabría puntuar — y entonces la
 * tanda no mide. Medido el 25/09: los discriminantes de los falsos 1 y 5 salían
 * `AUSENTE` por un salto de línea de la maquetación (`SIEMBRA_falsos_de_agosto.md`,
 * fragilidad 3).
 * ⚠️ Cambia qué casos salen MEDIBLE: por eso entró antes de fijar las líneas de
 * base de N3 y N6, no después.
 *
 * ⚠️ POR QUÉ EN `.mjs` Y NO EN `.ts`: el ejecutor es `scripts/examen.mjs` y
 * necesita esta misma función. Un criterio se implementa UNA VEZ y quien lo
 * necesita pregunta, así que vive donde los dos pueden importarlo. El `include`
 * de `tsconfig.json` sólo cubre los patrones de `.ts` y `.tsx`, así que esto no
 * entra en `tsc` — y su batería es `discriminantes.test.mjs`, que vitest sí
 * recoge por su patrón por defecto.
 *
 * ⚠️ Y POR QUÉ ES CÓDIGO PURO: entra texto, sale un veredicto. Ni red, ni
 * Supabase, ni Pinecone, ni modelo. Cabe en el alcance declarado de vitest
 * (`claude/Protocolo_Harness_Tasas.md:748`) sin pedir ninguna excepción, y eso
 * es deliberado: el criterio del examen tiene que ser falsable sin gastar un
 * céntimo.
 */

import { normalize } from '../analysis/normalize-core.mjs';

/** Los tres veredictos. `NO_MEDIBLE` NO es rojo: es «arregla el discriminante». */
export const MEDIBLE = 'MEDIBLE';
export const NO_MEDIBLE = 'NO_MEDIBLE';
export const SIN_FRAGMENTOS = 'SIN_FRAGMENTOS';

/** Cuántos caracteres de cada mitad se imprimen al reportar una frase partida.
 *  ⚠️ Se IMPRIME, no se persiste: el crudo guarda `chunkIndex` + hash del texto
 *  (decisión del director del 25/09/2026). Imprimir no es archivar, y así la
 *  regla ya está escrita el día que un caso use un documento de cliente. */
const MITAD_IMPRESA = 60;

const recorta = s => (s.length <= MITAD_IMPRESA ? s : `${s.slice(0, MITAD_IMPRESA)}…`);

/**
 * Busca la costura por la que cae una frase que no está entera en ningún
 * fragmento: el par de fragmentos consecutivos donde un prefijo de la frase
 * termina uno y el resto empieza el siguiente.
 *
 * ⚠️ Devuelve `null` si no encuentra costura, y ESO ES INFORMACIÓN, no un fallo
 * del buscador: significa que la frase **no está en el documento en absoluto**
 * —alguien la editó, o el discriminante se escribió mal— que es un problema
 * distinto de estar partida, y el mensaje tiene que decir cuál de los dos es.
 */
function costuraDe(frase, fragmentos) {
  // Sobre textos normalizados, como la búsqueda entera. Un corte que cae en un
  // espacio deja espacio al final de la cabeza o al principio de la cola, y
  // `normalize` los recorta en los fragmentos: de ahí el `trim` de cada mitad.
  const n = normalize(frase);
  for (let i = 0; i < fragmentos.length - 1; i++) {
    const a = normalize(fragmentos[i].text);
    const b = normalize(fragmentos[i + 1].text);
    // El corte puede caer en cualquier punto interior de la frase.
    for (let corte = 1; corte < n.length; corte++) {
      const cabeza = n.slice(0, corte).trim();
      const cola = n.slice(corte).trim();
      if (cabeza && cola && a.endsWith(cabeza) && b.startsWith(cola)) {
        return {
          entre: [fragmentos[i].chunkIndex, fragmentos[i + 1].chunkIndex],
          cabeza: recorta(cabeza),
          cola: recorta(cola),
        };
      }
    }
  }
  return null;
}

/** Los fragmentos donde la frase aparece ENTERA, con el criterio del marcador. */
function fragmentosConLaFrase(frase, fragmentos) {
  const n = normalize(frase);
  return fragmentos.filter(f => normalize(f.text).includes(n)).map(f => f.chunkIndex);
}

/**
 * Comprueba los discriminantes de un caso contra los fragmentos que el endpoint
 * devolvió — **los mismos que el análisis va a leer**, no una consulta aparte
 * (decisión 1 del camino B, aprobada el 25/09/2026).
 *
 * `fragmentosPorDocumento`: { [nombreDelDocumento]: [{ chunkIndex, text }] }
 *
 * Devuelve `{ estado, fallos, comprobados }`:
 *   · `MEDIBLE`        — todos íntegros en un fragmento y aislados del resto.
 *   · `NO_MEDIBLE`     — al menos uno partido, ausente o no aislado. El caso
 *                        NO se lanza: no es rojo, es «arregla el discriminante».
 *   · `SIN_FRAGMENTOS` — el endpoint no devolvió fragmentos de algún documento.
 *                        ⚠️ Va aparte de `NO_MEDIBLE` a propósito: uno dice que
 *                        el discriminante está mal y el otro que no hemos podido
 *                        mirar. Fundirlos mandaría a arreglar frases cuando el
 *                        problema es que el documento no está indexado.
 */
export function verificarDiscriminantesEnFragmentos(caso, fragmentosPorDocumento) {
  const fallos = [];
  let comprobados = 0;

  // Todo lo que lleva discriminante: los esperados y los NO esperados. Los dos
  // se emparejan por discriminante, así que los dos tienen que ser citables.
  const conDiscriminante = [...(caso.debenSalir ?? []), ...(caso.noDebenSalir ?? [])];

  const documentos = [caso.analizado, ...(caso.corpusExacto ?? [])];
  const faltan = documentos.filter(d => !Array.isArray(fragmentosPorDocumento?.[d]));
  if (faltan.length > 0) {
    return {
      estado: SIN_FRAGMENTOS,
      comprobados: 0,
      fallos: faltan.map(d => ({
        tipo: 'SIN_FRAGMENTOS',
        documento: d,
        mensaje: `El endpoint no devolvió fragmentos de "${d}". No se puede ` +
                 `comprobar ningún discriminante contra él, así que el caso no ` +
                 `se lanza. Comprueba que está indexado en la organización.`,
      })),
    };
  }

  for (const h of conDiscriminante) {
    for (const [lado, cita, documento] of [
      ['analizado', h.citaEnElAnalizado, caso.analizado],
      ['corpus', h.citaEnElCorpus, caso.corpusExacto?.[0]],
    ]) {
      const frase = cita?.discriminante;
      if (!frase || !documento) continue;
      comprobados++;

      const propios = fragmentosPorDocumento[documento] ?? [];
      const donde = fragmentosConLaFrase(frase, propios);

      // 1 · INTEGRIDAD — ¿está entera dentro de UN fragmento?
      if (donde.length === 0) {
        const costura = costuraDe(frase, propios);
        fallos.push(costura
          ? {
              tipo: 'PARTIDO_POR_UNA_COSTURA',
              id: h.id, lado, documento, frase: recorta(frase),
              entre: costura.entre,
              mensaje:
                `NO MEDIBLE — la frase discriminante de ${h.id} (${lado}) está ` +
                `PARTIDA por una costura del troceado en "${documento}": cae ` +
                `entre los fragmentos ${costura.entre[0]} y ${costura.entre[1]}. ` +
                `El fragmento ${costura.entre[0]} termina en «${costura.cabeza}» y ` +
                `el ${costura.entre[1]} empieza por «${costura.cola}». ` +
                `El juez no puede citarla entera aunque acierte. ` +
                `ARREGLA EL DISCRIMINANTE: elige una frase que quepa en un solo ` +
                `fragmento. Esto NO es un fallo del sistema.`,
            }
          : {
              tipo: 'AUSENTE',
              id: h.id, lado, documento, frase: recorta(frase),
              mensaje:
                `NO MEDIBLE — la frase discriminante de ${h.id} (${lado}) NO ` +
                `APARECE en ningún fragmento de "${documento}", ni entera ni ` +
                `partida por una costura. O el documento cambió, o el ` +
                `discriminante se escribió mal. ⚠️ Las dos cosas invalidan la ` +
                `línea de base, no sólo este caso.`,
            });
        continue;
      }

      // ⚠️ APARECER EN DOS FRAGMENTOS **NO** ES UN FALLO, y decirlo importa
      // porque la intuición dice lo contrario: el troceado lleva 200 caracteres
      // de solape, así que una frase cerca de una costura sale legítimamente en
      // dos fragmentos consecutivos. El juez puede citarla desde cualquiera de
      // los dos. Lo que se exige es UNO O MÁS, no exactamente uno.

      // 2 · AISLAMIENTO — no debe aparecer en los fragmentos de los OTROS
      // documentos del caso. Es la mitad que impide que el marcador confunda
      // dos hallazgos vecinos (el caso A/D de P1, a 7 líneas uno de otro).
      const ajenos = documentos.filter(d => d !== documento);
      for (const otro of ajenos) {
        const tambien = fragmentosConLaFrase(frase, fragmentosPorDocumento[otro] ?? []);
        if (tambien.length > 0) {
          fallos.push({
            tipo: 'NO_AISLA',
            id: h.id, lado, documento, frase: recorta(frase),
            tambienEn: { documento: otro, fragmentos: tambien },
            mensaje:
              `NO MEDIBLE — la frase discriminante de ${h.id} (${lado}) también ` +
              `aparece en "${otro}", fragmentos ${tambien.join(', ')}. No aísla: ` +
              `una cita del otro documento podría satisfacer esta expectativa y ` +
              `el marcador saldría verde por casualidad. ARREGLA EL DISCRIMINANTE.`,
          });
        }
      }
    }
  }

  return { estado: fallos.length === 0 ? MEDIBLE : NO_MEDIBLE, fallos, comprobados };
}
