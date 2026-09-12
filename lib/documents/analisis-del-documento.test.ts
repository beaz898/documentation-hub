import { describe, expect, it } from 'vitest';

import {
  analisisMasRecientePorDocumento,
  bloquesDeLaFila,
  casaConElCriterio,
  criterioDeAnalisisDelDocumento,
  type FilaDeAnalisis,
} from './analisis-del-documento';

/**
 * B.112 — EL BORRADO SE LLEVA LO SUYO Y DEJA EN PAZ LO AJENO.
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, DECLARADO: que `deleteDocument` llame a este
 * criterio, y que lo haga antes de borrar la fila. Eso habla con Supabase y se
 * comprueba por lectura — por eso el orden va escrito y razonado en el propio
 * `delete-document.ts`. Lo que sí se prueba aquí es EL MISMO OBJETO que viaja a
 * la base, no una imitación suya.
 *
 * ⚠️ Y LO QUE ESTE COMMIT NO CORRIGE, para que nadie lo lea al revés: hasta hoy
 * NO SE BORRABA NINGÚN ANÁLISIS, ni por nombre ni por id — verificado sobre los
 * 26 `.delete()` del repo, sobre el esquema (no hay clave foránea ni cascada) y
 * sobre los triggers. No se pasa de nombre a id: se pasa de no borrar a borrar
 * por id.
 */

const fila = (over: Partial<FilaDeAnalisis> = {}): FilaDeAnalisis => ({
  org_id: 'org-1',
  document_id: 'doc-1',
  document_name: 'tarifa.pdf',
  ...over,
});

describe('el criterio es cerrado: id y organización, y nada más', () => {
  /**
   * ⚠️ EL CASO DEL COMMIT. Con `document_name` dentro, borrar un documento se
   * llevaría por delante los análisis de todos sus HOMÓNIMOS vivos. El nombre no
   * identifica: colisiona. Se comprueba sobre las CLAVES y no sobre el efecto
   * porque es el objeto entero el que viaja a `.match()`.
   */
  it('lleva exactamente org_id y document_id', () => {
    expect(criterioDeAnalisisDelDocumento('org-1', 'doc-1')).toEqual({
      org_id: 'org-1',
      document_id: 'doc-1',
    });
  });

  /** MITAD CONTRARIA de la anterior, dicha por su nombre. */
  it('NO lleva document_name', () => {
    expect(Object.keys(criterioDeAnalisisDelDocumento('org-1', 'doc-1'))).not.toContain('document_name');
  });
});

describe('se lleva lo suyo', () => {
  it('alcanza un análisis del documento que se borra', () => {
    expect(casaConElCriterio(criterioDeAnalisisDelDocumento('org-1', 'doc-1'), fila())).toBe(true);
  });

  it('lo alcanza sea cual sea el nombre con el que se guardó', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    for (const nombre of ['tarifa.pdf', 'tarifa (corregido).pdf', '']) {
      expect(casaConElCriterio(c, fila({ document_name: nombre }))).toBe(true);
    }
  });
});

describe('DEJA EN PAZ LO AJENO', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA QUE PIDIÓ EL ENCARGO. Un documento vivo que se llama
   * igual que el que se borra tiene sus propios análisis, y no se tocan. Es la
   * diferencia entre borrar lo de uno y hacer limpieza en casa ajena.
   */
  it('un homónimo VIVO con otro id conserva sus análisis', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ document_id: 'doc-2' }))).toBe(false);
  });

  /**
   * ⚠️ Y EL PARQUE VIEJO, que es la otra mitad y la que no se puede resolver
   * desde el código: los análisis de subida nacen con `document_id = null`
   * porque el documento no existía al guardarlos. El criterio NO los alcanza, y
   * NO debe intentar adivinarlos por nombre — adivinar en una operación
   * destructiva es cómo se borra lo que no se quería borrar. Se limpian aparte,
   * en SQL, mirándolos antes.
   */
  it('un análisis sin id, aunque se llame igual, sobrevive', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ document_id: null }))).toBe(false);
  });

  /** El aislamiento entre organizaciones, que en esta casa no se salta nadie. */
  it('el mismo id en otra organización no se toca', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ org_id: 'org-2' }))).toBe(false);
  });

  /** Todas las claves tienen que casar, no alguna: es lo que hace `.match()`. */
  it('casar solo una clave no basta', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ org_id: 'org-2', document_id: 'doc-1' }))).toBe(false);
    expect(casaConElCriterio(c, fila({ org_id: 'org-1', document_id: 'doc-9' }))).toBe(false);
  });
});

describe('el criterio no arrastra estado entre llamadas', () => {
  it('dos documentos distintos dan criterios distintos', () => {
    const a = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    const b = criterioDeAnalisisDelDocumento('org-1', 'doc-2');
    expect(a).not.toEqual(b);
    expect(casaConElCriterio(a, fila({ document_id: 'doc-2' }))).toBe(false);
    expect(casaConElCriterio(b, fila({ document_id: 'doc-2' }))).toBe(true);
  });
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * B.212 — LA BANDEJA PREGUNTA POR ID, Y LOS CUATRO CAMINOS DE ENTRADA.
 *
 * ⚠️ POR QUÉ ESTOS CASOS NO PUEDEN «FALLAR CON EL CÓDIGO DE HOY», y se dice en
 * vez de fingirlo: prueban una función que hasta este commit no existía, así que
 * antes de él no había nada que ponerse rojo. Lo que demuestra que muerden es la
 * MUTACIÓN — volver a emparejar por nombre, o vaciar la rama del staged— y los
 * dos resultados están anotados abajo, ejecutados.
 *
 * LOS CUATRO CAMINOS por los que un documento entra en la bandeja:
 *   A · manual cuyo análisis del chat no se completó      → `pendiente`
 *   B · fichero nuevo de Drive                            → `pendiente`
 *   C · fichero de Drive que cambia y NO estaba analizado → sobrescrito, `pendiente`
 *   D · fichero de Drive que cambia y SÍ estaba analizado → versión staged
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface FilaConFecha extends FilaDeAnalisis {
  created_at: string;
}

const ORG = 'org-1';
const analisisDe = (
  document_id: string | null,
  document_name: string,
  created_at: string,
  org_id = ORG,
): FilaConFecha => ({ org_id, document_id, document_name, created_at });

describe('B.212 · los cuatro caminos de entrada a la bandeja', () => {
  it('A · manual sin ningún análisis: no trae bloque', () => {
    const r = analisisMasRecientePorDocumento(ORG, ['doc-A'], []);
    expect(r.get('doc-A')).toBeUndefined();
  });

  it('A · manual CON su propio análisis adoptado: trae el suyo', () => {
    const suyo = analisisDe('doc-A', 'informe.pdf', '2026-09-11T10:00:00Z');
    const r = analisisMasRecientePorDocumento(ORG, ['doc-A'], [suyo]);
    expect(r.get('doc-A')).toBe(suyo);
  });

  it('B · fichero nuevo de Drive: no hay análisis suyo, no trae nada ajeno', () => {
    // Hay un análisis en la organización, pero de otro documento.
    const ajeno = analisisDe('doc-otro', 'nuevo.xlsx', '2026-09-11T10:00:00Z');
    const r = analisisMasRecientePorDocumento(ORG, ['doc-B'], [ajeno]);
    expect(r.get('doc-B')).toBeUndefined();
  });

  it('C · Drive sobrescrito en el sitio: trae SU análisis anterior — y es el residuo declarado', () => {
    // ⚠️ ESTE CASO DOCUMENTA UN LÍMITE, NO UNA VIRTUD: el contenido cambió y el
    // análisis es de antes. Que sea del documento no lo hace reciente.
    const viejo = analisisDe('doc-C', 'tarifas.xlsx', '2026-06-24T09:00:00Z');
    const r = analisisMasRecientePorDocumento(ORG, ['doc-C'], [viejo]);
    expect(r.get('doc-C')).toBe(viejo);
  });

  it('D · la versión staged NO pasa por aquí: su análisis se trae por id exacto', () => {
    // La bandeja resuelve el staged con `.in('id', stagedPtrIds)`, no con esta
    // función. Si alguien «simplifica» metiéndolo aquí, este caso se entera:
    // el análisis apuntado por el staged tiene el id del documento, pero el
    // bloque del staged NO debe salir de este mapa.
    const delStaged = analisisDe('doc-D', 'contrato.docx', '2026-09-12T08:00:00Z');
    const r = analisisMasRecientePorDocumento(ORG, [], [delStaged]);
    expect(r.size).toBe(0);
  });
});

describe('B.212 · lo que ya no se cuela', () => {
  it('⚠️ un análisis de fichero suelto con el MISMO nombre no se cuela', () => {
    // Es la población medida: once filas así, sobre tres documentos.
    const huerfano = analisisDe(null, 'OPE-02_agenda-y-gestion-de-citas.xlsx', '2026-09-10T12:00:00Z');
    const suyo = analisisDe('doc-02', 'OPE-02_agenda-y-gestion-de-citas.xlsx', '2026-06-24T09:00:00Z');
    const r = analisisMasRecientePorDocumento(ORG, ['doc-02'], [huerfano, suyo]);
    expect(r.get('doc-02')).toBe(suyo);
  });

  it('⚠️ dos documentos INDEXADOS con el mismo nombre no se cruzan', () => {
    // Sin ningún huérfano: es lo que pasa al subir a Drive un fichero que ya
    // tienes como manual, que crea un SEGUNDO documento con el mismo nombre.
    const delManual = analisisDe('doc-manual', 'catalogo.pdf', '2026-09-01T10:00:00Z');
    const delDrive = analisisDe('doc-drive', 'catalogo.pdf', '2026-09-11T10:00:00Z');
    const r = analisisMasRecientePorDocumento(
      ORG, ['doc-manual', 'doc-drive'], [delManual, delDrive],
    );
    expect(r.get('doc-manual')).toBe(delManual);
    expect(r.get('doc-drive')).toBe(delDrive);
  });

  it('el mismo id en OTRA organización no se cuela', () => {
    const ajeno = analisisDe('doc-A', 'informe.pdf', '2026-09-11T10:00:00Z', 'org-2');
    const r = analisisMasRecientePorDocumento(ORG, ['doc-A'], [ajeno]);
    expect(r.get('doc-A')).toBeUndefined();
  });

  it('entre dos análisis del mismo documento gana el más reciente', () => {
    const viejo = analisisDe('doc-A', 'informe.pdf', '2026-09-01T10:00:00Z');
    const nuevo = analisisDe('doc-A', 'informe.pdf', '2026-09-11T10:00:00Z');
    // En los dos órdenes: sin esto, un `if` que solo mire el primero pasaría.
    expect(analisisMasRecientePorDocumento(ORG, ['doc-A'], [viejo, nuevo]).get('doc-A')).toBe(nuevo);
    expect(analisisMasRecientePorDocumento(ORG, ['doc-A'], [nuevo, viejo]).get('doc-A')).toBe(nuevo);
  });

  it('un documento que no está en la lista no recibe nada', () => {
    const suyo = analisisDe('doc-Z', 'z.pdf', '2026-09-11T10:00:00Z');
    const r = analisisMasRecientePorDocumento(ORG, ['doc-A'], [suyo]);
    expect(r.has('doc-Z')).toBe(false);
  });
});

describe('B.212 · los dos bloques salen de fuentes distintas, y se matan por separado', () => {
  const propio = new Map([['doc-D', analisisDe('doc-D', 'contrato.docx', '2026-06-01T09:00:00Z')]]);
  const apuntados = new Map([['an-nuevo', analisisDe('doc-D', 'contrato.docx', '2026-09-12T08:00:00Z')]]);

  it('con puntero, el bloque del staged sale del id EXACTO y no del documento', () => {
    const r = bloquesDeLaFila('doc-D', propio, 'an-nuevo', apuntados);
    expect(r.staged).toBe(apuntados.get('an-nuevo'));
    // Y el propio sigue siendo el suyo, aunque sea más viejo que el del staged.
    expect(r.propio).toBe(propio.get('doc-D'));
  });

  it('sin puntero no hay bloque de staged, aunque el documento tenga análisis', () => {
    const r = bloquesDeLaFila('doc-D', propio, null, apuntados);
    expect(r.staged).toBeUndefined();
    expect(r.propio).toBe(propio.get('doc-D'));
  });

  it('⚠️ vaciar la fuente del staged NO toca lo propio', () => {
    // Es la mitad que este caso existe para sujetar: si alguien «simplifica»
    // sacando el análisis del staged del mismo mapa que el propio, esto muere.
    const r = bloquesDeLaFila('doc-D', propio, 'an-nuevo', new Map());
    expect(r.staged).toBeUndefined();
    expect(r.propio).toBe(propio.get('doc-D'));
  });

  it('⚠️ vaciar lo propio NO toca el bloque del staged', () => {
    const r = bloquesDeLaFila('doc-D', new Map(), 'an-nuevo', apuntados);
    expect(r.propio).toBeUndefined();
    expect(r.staged).toBe(apuntados.get('an-nuevo'));
  });
});
