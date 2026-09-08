import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * LOS FICHEROS DEL HARNESS SIGUEN EXISTIENDO Y SIGUEN NOMBRADOS IGUAL.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ POR QUÉ EXISTE, y es un caso real: **OPE-10 desapareció del corpus y no lo
 * vio NADA.** Ni el censo —que cuenta lo que existe, así que un documento que
 * falta le es invisible—, ni las tandas, ni el harness. Se descubrió por
 * casualidad, al preguntar por qué una consulta de `.xlsx` devolvía ocho y no
 * nueve, y volvió solo en la siguiente sincronización.
 *
 * Y no era un documento cualquiera: **OPE-10 es la mitad del par que produce las
 * 15 discrepancias del caso 6.** Sin él esa cifra no se puede volver a medir, y
 * nada lo habría dicho.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LO QUE ESTE CASO **NO** CAZA, Y VA ANTES QUE LO QUE SÍ CAZA: **no caza lo
 * que le pasó a OPE-10.** Aquello fue una desaparición del CORPUS en producción,
 * con el fichero intacto en `corpus-pruebas/`. Esto corre sin credenciales y sin
 * red, así que habría seguido verde durante toda la ausencia. Creer lo contrario
 * sería el fallo de esta casa —una verificación correcta sobre una población más
 * estrecha que la afirmación—, así que se dice aquí y no en una nota al pie.
 *
 * **La comprobación del corpus vivo es una consulta y vive en el propio
 * `Casos_Harness.md`.** Necesita base de datos; esto no la sustituye.
 *
 * LO QUE SÍ CAZA: que las listas del documento y los ficheros del repositorio se
 * separen, en las dos direcciones. Importa porque **la consulta viva toma sus
 * nombres de esas listas: si una se pudre, pregunta por los documentos
 * equivocados y contesta que sí.** Este caso guarda la ENTRADA de la consulta.
 *
 * ⚠️ SON TRES LISTAS Y NO UNA, y se descubrió al escribir esto: el documento
 * repite el rótulo «Nombres de fichero exactos» tres veces —piloto, ampliado y
 * superficies—. La primera versión leyó la primera y comparó el corpus ampliado
 * contra el del piloto. **Once documentos, no cuatro**, y los once son
 * igual de perdibles.
 */

/**
 * ⚠️ ESCRITAS A MANO Y NO LEÍDAS DEL DOCUMENTO. Extraerlas con un regex haría
 * que editar el `.md` cambiara A LA VEZ lo esperado y lo comprobado: el caso
 * pasaría siempre, comparando el documento consigo mismo. Escribirlas aquí es lo
 * que convierte esto en una ATADURA entre dos sitios en vez de un espejo.
 */
const GRUPOS = {
  piloto: [
    'RRHH-06_evaluacion-del-desempeno.xlsx',
    'OPE-02_agenda-y-gestion-de-citas.xlsx',
    'CLI-03_historia-clinica-consentimiento-informado.txt',
    'NOR-01_rgpd-proteccion-datos-pacientes.pdf',
    'MKT-01_manual-identidad-corporativa.docx',
  ],
  ampliado: [
    'NOR-10_protocolo-esterilizacion-instrumental.docx',
    'CLI-12_manual-calidad-clinica.docx',
    'OPE-10_tarifario-tratamientos-2026.xlsx',
    'OPE-11_tarifario-tratamientos-seguros.xlsx',
  ],
  superficies: [
    'NOR-11_gestion-de-residuos-sanitarios.docx',
    'CLI-13_instrucciones-clinicas-residuos.docx',
  ],
} as const;

/**
 * ⚠️ EL CUARTO GRUPO — los que tienen registro de siembra PROPIO y no salen en
 * ninguna de las tres listas de `Casos_Harness.md`.
 *
 * Van aparte y no repartidos entre los otros tres a propósito: OPE-13 y RRHH-08
 * comparten un registro conjunto y OPE-15 tiene el suyo, así que meterlos en las
 * listas existentes obligaría a decidir a cuál pertenece cada uno **sin que la
 * respuesta sea evidente**. Un grupo propio dice lo que son sin forzar nada.
 *
 * Su atadura es la misma que la de los otros, contra otro sitio: cada uno tiene
 * que estar nombrado en algún `corpus-pruebas/SIEMBRA_*.md`. Un fichero de
 * referencia sin registro de siembra es material del que nadie sabe qué prueba.
 */
const CON_REGISTRO_PROPIO = [
  'OPE-13_cobertura-por-clinica.xlsx',
  'RRHH-08_asignacion-de-guardias.xlsx',
  'OPE-15_tarifario-mutua-2026.xlsx',
] as const;

const DOC = 'claude/Casos_Harness.md';
const TODOS = [...Object.values(GRUPOS).flat(), ...CON_REGISTRO_PROPIO];

/** Los bloques cercados que siguen a cada rótulo, en orden de aparición. */
function listasDelDocumento(): string[][] {
  const doc = readFileSync(DOC, 'utf8');
  const listas: string[][] = [];
  let desde = 0;
  for (;;) {
    const marca = doc.indexOf('**Nombres de fichero exactos**', desde);
    if (marca === -1) break;
    const abre = doc.indexOf('```', marca);
    const cierra = doc.indexOf('```', abre + 3);
    if (abre === -1 || cierra === -1) throw new Error(`bloque sin cerrar en ${DOC}`);
    listas.push(doc.slice(abre + 3, cierra).split('\n').map(l => l.trim()).filter(Boolean));
    desde = cierra + 3;
  }
  return listas;
}

describe('los ficheros del harness siguen ahí (OPE-10)', () => {
  /**
   * ⚠️ EL CONTROL YA NO CUENTA: EXIGE QUE NO SOBRE NADA.
   *
   * Antes decía «hay once». Un número se pudre en cuanto llega un fichero nuevo,
   * y —peor— **un fichero nuevo sin declarar lo dejaba pasar**: el caso seguía
   * verde con material de referencia que nadie sabía que existía.
   *
   * Ahora se compara contra el DIRECTORIO. Falla en las dos direcciones: si
   * desaparece un fichero declarado, y si aparece uno sin declarar. La segunda
   * es la que no se pudre — es OPE-10 al revés: allí faltaba lo que debía estar,
   * aquí sobra lo que nadie declaró.
   *
   * Los `SIEMBRA_*.md` se excluyen porque son los REGISTROS, no el material.
   */
  it('nada en corpus-pruebas se queda sin declarar', () => {
    const enDisco = readdirSync('corpus-pruebas')
      .filter(n => !n.startsWith('.') && !n.startsWith('SIEMBRA'))
      .sort();
    expect(
      enDisco,
      'Un fichero de "corpus-pruebas" no está en ninguno de los cuatro grupos de ' +
      'este caso. Si es material de referencia nuevo, declaralo en su grupo y ' +
      'dale registro de siembra; si no lo es, no debería estar aquí.',
    ).toEqual([...TODOS].sort());
  });

  it.each(TODOS)('%s existe en corpus-pruebas', fichero => {
    expect(
      existsSync(join('corpus-pruebas', fichero)),
      `Falta "corpus-pruebas/${fichero}". Es material de referencia del harness: ` +
      `sin él, el caso que lo usa no se puede volver a medir. Si se renombró, hay ` +
      `que cambiarlo también en ${DOC} y en este fichero.`,
    ).toBe(true);
  });

  it.each(CON_REGISTRO_PROPIO)('%s tiene registro de siembra', fichero => {
    const registros = readdirSync('corpus-pruebas').filter(n => n.startsWith('SIEMBRA'));
    const nombrado = registros.some(r =>
      readFileSync(join('corpus-pruebas', r), 'utf8').includes(fichero));
    expect(
      nombrado,
      `"${fichero}" no aparece en ningún corpus-pruebas/SIEMBRA_*.md. Es material ` +
      `de referencia del que nadie sabe qué prueba ni con qué cifra.`,
    ).toBe(true);
  });

  /**
   * ⚠️ SE COMPARA LISTA CONTRA LISTA, no `includes` sobre el documento — y lo
   * destapó una mutación, no el diseño. Con `includes` sobre todo el fichero,
   * borrar un nombre de la lista buena seguía dando VERDE, porque la consulta
   * SQL de más abajo repite los mismos nombres. Un `includes` sobre un documento
   * que menciona lo mismo en dos sitios comprueba que la palabra existe, no que
   * la lista sea correcta.
   */
  it('las tres listas del documento son EXACTAMENTE las de aquí', () => {
    const enElDoc = listasDelDocumento();
    expect(enElDoc, `${DOC} ya no tiene tres listas de ficheros`).toHaveLength(3);
    expect(
      enElDoc.map(l => [...l].sort()),
      `Las listas de "${DOC}" y las de este caso se han separado. La consulta que ` +
      `comprueba el corpus VIVO toma sus nombres de ahí: si se pudren, preguntará ` +
      `por los documentos equivocados y contestará que sí.`,
    ).toEqual([
      [...GRUPOS.piloto].sort(),
      [...GRUPOS.ampliado].sort(),
      [...GRUPOS.superficies].sort(),
    ]);
  });
});
