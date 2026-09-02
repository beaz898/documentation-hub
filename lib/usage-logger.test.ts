import { describe, expect, it } from 'vitest';

import { filaDeAveriaDeLimitador, filaDeIncidenciaDeSync } from './usage-logger';

/**
 * EL LIMITADOR DEJA DE SER MUDO (regla 6, memoria del fallo, 02/09/2026).
 *
 * ⚠️ FALLAR ABIERTO ES LEGÍTIMO Y NO SE TOCA: cuando la consulta del limitador
 * falla, se deja pasar al usuario en vez de bloquearlo por un error nuestro.
 * Es una decisión de disponibilidad (F-94 P4). Lo ilegítimo era que nadie
 * supiera cuántas veces el limitador dejó de limitar.
 *
 * ⚠️ LO QUE NO SE PUEDE CONTAR, Y SE DECLARA: `checkRateLimit` LEE `usage_logs`
 * con el mismo cliente con el que esto ESCRIBE en `usage_logs`. Con Supabase
 * entero caído, el registro falla por la misma razón que la avería. Queda
 * cubierto el caso común —la consulta que falla con la base viva: un cambio de
 * esquema, una RLS, un timeout— y no el apagón completo, invisible desde
 * dentro por construcción.
 */

const COORDENADAS = {
  orgId: 'org-1',
  userId: 'user-1',
  endpoint: '/api/ask',
};

describe('filaDeAveriaDeLimitador — solo se registra lo que hay que registrar', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA, y es la que decide si esto sirve o estorba: un
   * limitador que funciona no escribe NADA. Sin este caso, un registro que
   * emitiera siempre pasaría verde y metería una fila por CADA llamada del
   * sistema — más ruido que el silencio que se viene a arreglar.
   */
  it('sin avería: ninguna fila', () => {
    expect(filaDeAveriaDeLimitador({ ...COORDENADAS })).toBeNull();
    expect(filaDeAveriaDeLimitador({ ...COORDENADAS, averia: undefined })).toBeNull();
  });

  it('consulta fallida: fila con éxito en falso y el motivo escrito', () => {
    const fila = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'consulta_fallida' });

    expect(fila).not.toBeNull();
    expect(fila!.success).toBe(false);
    expect(fila!.endpoint).toBe('/api/ask');
    expect(fila!.orgId).toBe('org-1');
    expect(fila!.errorMessage).toContain('limitador');
  });

  it('error inesperado: su propia fila', () => {
    const fila = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'error_inesperado' });

    expect(fila!.success).toBe(false);
    expect(fila!.errorMessage).toContain('limitador');
  });

  /**
   * ⚠️ LOS DOS MOTIVOS TIENEN QUE SER DISTINGUIBLES. Si fueran el mismo texto, la
   * fila existiría pero no diría cuál de los dos caminos se tomó — y entonces no
   * sirve para lo que se hace, que es saber POR QUÉ el limitador dejó de
   * limitar. Un registro que no distingue es silencio con más pasos.
   */
  it('los dos motivos no son el mismo texto', () => {
    const a = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'consulta_fallida' });
    const b = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'error_inesperado' });

    expect(a!.errorMessage).not.toBe(b!.errorMessage);
  });

  /**
   * TOKENS Y CRÉDITOS A CERO, y no es relleno: la avería ocurre ANTES de cobrar.
   * Una fila que dijera otra cosa mentiría en la analítica de costes, que lee
   * esta misma tabla.
   */
  it('no inventa consumo: cero tokens y cero créditos', () => {
    const fila = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'consulta_fallida' });

    expect(fila!.inputTokens).toBe(0);
    expect(fila!.outputTokens).toBe(0);
    expect(fila!.creditsConsumed).toBe(0);
  });
});

/**
 * EL SYNC DEJA DE TIRAR EL NOMBRE (regla 6, 02/09/2026).
 *
 * El sync de Drive contaba sus fallos en tres variables locales y los devolvía
 * como números. «1 failed» no dice CUÁL, y el sync es por donde entra todo al
 * corpus: un documento que no entraba solo se sabía mirando el log en el
 * momento. Pasó con OPE-13 el 01/09 y se vio porque estábamos delante.
 *
 * ⚠️ Y SON TRES ESPECIES DISTINTAS, no tres recuentos de lo mismo: un fichero
 * ilegible es un hecho sobre el DOCUMENTO —lo arregla el usuario—, un fallo al
 * procesar es un hecho sobre la EJECUCIÓN, y un borrado fallido es un hecho
 * sobre el ESTADO. Mezclarlas era parte de por qué el recuento no servía.
 *
 * ⚠️ MITAD CONTRARIA: una sincronización sin fallos no escribe NADA. En la parte
 * pura eso es que nadie llama a esta función —solo se la llama dentro de las
 * tres ramas de fallo—, así que se comprueba leyendo la ruta. Se dice en vez de
 * fingirse.
 */

const SYNC = {
  orgId: 'org-1',
  userId: 'user-1',
  endpoint: '/api/drive/sync',
};

describe('filaDeIncidenciaDeSync — con el nombre, que es lo que faltaba', () => {
  /**
   * ⚠️ EL CASO. Los recuentos daban un número; esto da el documento. Sin el
   * nombre, el registro es el mismo silencio con otra forma.
   */
  it('el nombre del documento va en la fila, en las tres especies', () => {
    for (const especie of ['ilegible', 'fallo_al_procesar', 'fallo_al_borrar'] as const) {
      const fila = filaDeIncidenciaDeSync({ ...SYNC, especie, documento: 'RRHH-08.xlsx' });
      expect(fila.userQuery, especie).toBe('RRHH-08.xlsx');
    }
  });

  /**
   * LOS TRES MOTIVOS SE DISTINGUEN. Si fueran el mismo texto habríamos vuelto a
   * «1 failed» con más pasos: el registro existiría y no diría de cuál de las
   * tres cosas habla.
   */
  it('los tres motivos son distintos entre sí', () => {
    const motivos = (['ilegible', 'fallo_al_procesar', 'fallo_al_borrar'] as const).map(
      especie => filaDeIncidenciaDeSync({ ...SYNC, especie, documento: 'd.xlsx' }).errorMessage,
    );

    expect(new Set(motivos).size).toBe(3);
  });

  /** Y el ilegible dice que NO entró al corpus, que es lo que el usuario
   *  necesita saber: no que algo se rompió, sino que su documento no está. */
  it('el ilegible no se disfraza de avería', () => {
    const fila = filaDeIncidenciaDeSync({
      ...SYNC, especie: 'ilegible', documento: 'escaneado.pdf', detalle: '12 caracteres',
    });

    expect(fila.errorMessage).toContain('no se pudo leer');
    expect(fila.errorMessage).toContain('no entró al corpus');
    expect(fila.errorMessage).toContain('12 caracteres');
  });

  /**
   * ⚠️ `success: false` NO ES COSMÉTICO (B.145): `usage_logs` es lo que
   * `checkRateLimit` cuenta, y solo cuenta las filas con `success: true`. Con
   * `true`, un documento que NO entró al corpus le gastaría al usuario una
   * llamada de su cuota diaria.
   */
  it('no gasta cuota: success en falso y sin consumo', () => {
    const fila = filaDeIncidenciaDeSync({ ...SYNC, especie: 'fallo_al_procesar', documento: 'd.xlsx' });

    expect(fila.success).toBe(false);
    expect(fila.inputTokens).toBe(0);
    expect(fila.outputTokens).toBe(0);
    expect(fila.creditsConsumed).toBe(0);
  });

  /** El endpoint es el mismo en las tres: un solo filtro las saca todas, y el
   *  motivo las separa dentro. */
  it('un solo filtro las saca todas', () => {
    const fila = filaDeIncidenciaDeSync({ ...SYNC, especie: 'fallo_al_borrar', documento: 'd.xlsx' });
    expect(fila.endpoint).toBe('/api/drive/sync');
  });

  /** Sin detalle, el motivo va solo — no queda un guion colgando que en un
   *  recuento se lea como un mensaje vacío. */
  it('sin detalle no queda un separador huérfano', () => {
    const fila = filaDeIncidenciaDeSync({ ...SYNC, especie: 'ilegible', documento: 'd.xlsx' });
    expect(fila.errorMessage?.endsWith('—')).toBe(false);
    expect(fila.errorMessage).not.toContain('— undefined');
  });
});
