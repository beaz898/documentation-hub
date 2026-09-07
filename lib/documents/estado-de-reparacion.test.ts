import { describe, it, expect } from 'vitest';
import { estadoDeReparacion, recuentoPorEstado } from './estado-de-reparacion';
import type { FilaParaSello } from './estado-de-reparacion';
import { soloCambioElTroceado, CAMBIOS_POR_VERSION, EXTRACTOR_VERSION } from '@/lib/chunking';
import { ORIGENES_SINCRONIZADOS } from './origen';

/**
 * EL LECTOR DEL SELLO — la batería.
 *
 * El criterio se escribió ANTES que los casos, por lo que enseñó B.182: sin
 * criterio previo, un primer test congela lo que el código hace y lo bendice.
 * Aquí el criterio es el de la cabecera del módulo y estos casos lo verifican;
 * no al revés.
 *
 * ⚠️ EL CASO QUE ATA ESTE MÓDULO AL DE ORIGEN, y es el que más vale de la
 * batería: la lista de proveedores NO se repite aquí — se recorre
 * `ORIGENES_SINCRONIZADOS`. Si mañana entra un tercer proveedor, este caso lo
 * prueba solo; y si alguien decidiera aquí por su cuenta qué es «de la nube», se
 * pondría rojo. Es el mismo mecanismo con el que `origen.ts` se ata al registro.
 */

const VIGENTE = 3;

function fila(over: Partial<FilaParaSello> = {}): FilaParaSello {
  return {
    extractorVersion: VIGENTE,
    source: null,
    providerFileId: null,
    tieneSegmentos: false,
    ...over,
  };
}

describe('estadoDeReparacion — al día', () => {
  it('la versión vigente no necesita nada', () => {
    expect(estadoDeReparacion(fila(), VIGENTE)).toEqual({ estado: 'al_dia' });
  });

  it('⚠️ una versión MAYOR no es un cuarto estado, pero no se calla', () => {
    expect(estadoDeReparacion(fila({ extractorVersion: VIGENTE + 1 }), VIGENTE))
      .toEqual({ estado: 'al_dia', anomalia: 'version_futura' });
  });
});

describe('estadoDeReparacion — atrasados', () => {
  it('⚠️ `null` NO es al día: es una fila anterior a la columna', () => {
    expect(estadoDeReparacion(fila({ extractorVersion: null }), VIGENTE).estado)
      .toBe('reparable_resubiendo');
  });

  it('un manual atrasado se repara resubiendo', () => {
    expect(estadoDeReparacion(fila({ extractorVersion: 2, source: 'manual' }), VIGENTE))
      .toEqual({ estado: 'reparable_resubiendo' });
  });

  /**
   * ⚠️ EL CASO QUE CAMBIÓ DE SIGNO EL 07/09 (B.195), Y ANTES DECÍA LO CONTRARIO.
   *
   * Se llamaba «TODOS los orígenes sincronizados con id son automáticos», y era
   * falso en la práctica: el escritor les respondía **501** porque `reprocesar`
   * no está construido. El lector prometía una vía inexistente a quince
   * documentos, durante una semana.
   *
   * Ahora venir de la nube NO basta: sin segmentos no hay reparación posible hoy,
   * y eso se dice con estado y anomalía en vez de callarlo.
   */
  it('⚠️ de la nube SIN segmentos: no es automático, y la deuda se declara', () => {
    for (const source of ORIGENES_SINCRONIZADOS) {
      expect(
        estadoDeReparacion(fila({ extractorVersion: 2, source, providerFileId: 'abc123' }), VIGENTE),
      ).toEqual({ estado: 'reparable_resubiendo', anomalia: 'via_no_construida' });
    }
  });

  /**
   * ⚠️⚠️ LA POLÍTICA, EN UN CASO: **la condición es tener segmentos, no de dónde
   * viene.** Un `.xlsx` de OneDrive con su estructura guardada se repara igual que
   * uno subido a mano — de los segmentos salen las celdas otra vez.
   *
   * Es el caso de RRHH-06, que dio 501 teniendo segmentos, gen 2 y sello 2.
   */
  it('CON segmentos es automático, venga de donde venga', () => {
    for (const source of [...ORIGENES_SINCRONIZADOS, 'manual']) {
      expect(
        estadoDeReparacion(
          fila({ extractorVersion: 2, source, providerFileId: 'abc123', tieneSegmentos: true }),
          VIGENTE,
        ),
        `${source} con segmentos debería repararse por la vía barata`,
      ).toEqual({ estado: 'reparable_automaticamente' });
    }
  });

  /**
   * ⚠️ Y LA MITAD QUE PROTEGE, que es la que cierra la trampa: tener segmentos NO
   * basta si no se puede afirmar que solo cambió el troceado. Con el sello a
   * `null` —las filas anteriores a la columna— no se sabe qué cambió, y no saber
   * no es lo mismo que saber que fue poco.
   *
   * Si este caso muriera, un documento antiguo se repararía a medias y saldría
   * sellado como al día. Eso es el lector mintiendo, que es lo que este commit
   * vino a quitar.
   */
  it('⚠️ con segmentos pero sin saber qué cambió, NO se promete la vía barata', () => {
    expect(
      estadoDeReparacion(
        fila({ extractorVersion: null, source: 'onedrive', providerFileId: 'x', tieneSegmentos: true }),
        VIGENTE,
      ),
    ).toEqual({ estado: 'reparable_resubiendo', anomalia: 'via_no_construida' });
  });

  it('⚠️ sincronizado SIN identificador cae en el humano, y se marca', () => {
    for (const providerFileId of [null, '', '   ']) {
      expect(
        estadoDeReparacion(fila({ extractorVersion: 2, source: 'google_drive', providerFileId }), VIGENTE),
      ).toEqual({ estado: 'reparable_resubiendo', anomalia: 'sincronizado_sin_id' });
    }
  });

  it('un origen con errata no se promete automático', () => {
    expect(
      estadoDeReparacion(fila({ extractorVersion: 2, source: 'google-drive', providerFileId: 'x' }), VIGENTE).estado,
    ).toBe('reparable_resubiendo');
  });

  it('todo ausente a la vez cae en el defecto, no revienta', () => {
    expect(
      estadoDeReparacion({ extractorVersion: null, source: null, providerFileId: null, tieneSegmentos: false }, VIGENTE),
    ).toEqual({ estado: 'reparable_resubiendo' });
  });
});

describe('soloCambioElTroceado — el mapa que hace decidible la vía', () => {
  it('del sello 2 al 3 solo cambió el troceado', () => {
    expect(soloCambioElTroceado(2, 3)).toBe(true);
    expect(soloCambioElTroceado(1, 3)).toBe(true);
  });

  it('sin sello no se puede afirmar nada: falla CERRADA', () => {
    for (const sello of [null, undefined, NaN, Infinity]) {
      expect(soloCambioElTroceado(sello, 3)).toBe(false);
    }
  });

  /**
   * ⚠️ EL CASO QUE VIGILA LA TRAMPA DECLARADA. Hoy no hay ninguna versión de
   * extracción, así que se simula la de mañana: una versión que no está en el
   * mapa se comporta como un cambio que no sabemos leer, y cierra la vía barata.
   *
   * Si mañana se añade una versión al mapa marcada `'extraccion'`, este caso ya
   * está probando lo que hará: negarse, en vez de sellar de más.
   */
  it('una versión que el mapa no clasifica cierra la vía barata', () => {
    expect(soloCambioElTroceado(3, 4)).toBe(false);
    expect(soloCambioElTroceado(2, 4)).toBe(false);
  });

  it('un sello que ya alcanza a la vigente no tiene cambios que clasificar', () => {
    expect(soloCambioElTroceado(3, 3)).toBe(true);
    expect(soloCambioElTroceado(4, 3)).toBe(true);
  });

  /**
   * El mapa tiene que cubrir TODA versión viva. Si alguien sube
   * `EXTRACTOR_VERSION` sin clasificarla, este caso lo dice — y lo dice antes de
   * que un documento se quede sin poder repararse por lo barato sin motivo.
   */
  it('el mapa cubre todas las versiones hasta la vigente', () => {
    for (let v = 2; v <= EXTRACTOR_VERSION; v++) {
      expect(CAMBIOS_POR_VERSION[v], `falta clasificar la versión ${v} en CAMBIOS_POR_VERSION`)
        .toBeDefined();
    }
  });
});

describe('recuentoPorEstado', () => {
  it('reparte cada fila en su estado y suma el total', () => {
    const filas: FilaParaSello[] = [
      fila(),
      fila({ extractorVersion: 2, source: 'google_drive', providerFileId: 'a', tieneSegmentos: true }),
      fila({ extractorVersion: 2, source: 'onedrive', providerFileId: 'b' }),
      fila({ extractorVersion: 2 }),
      fila({ extractorVersion: null }),
    ];
    const r = recuentoPorEstado(filas, VIGENTE);

    expect(r.al_dia).toBe(1);
    expect(r.reparable_automaticamente).toBe(1);
    expect(r.reparable_resubiendo).toBe(3);
    expect(r.al_dia + r.reparable_automaticamente + r.reparable_resubiendo).toBe(filas.length);
  });

  it('⚠️ un corpus vacío devuelve las TRES claves a cero, no un objeto vacío', () => {
    const r = recuentoPorEstado([], VIGENTE);
    expect(r).toEqual({
      al_dia: 0,
      reparable_automaticamente: 0,
      reparable_resubiendo: 0,
      anomalias: { version_futura: 0, sincronizado_sin_id: 0, via_no_construida: 0 },
    });
  });

  it('las anomalías se cuentan aparte y no restan de su estado', () => {
    const r = recuentoPorEstado(
      [
        fila({ extractorVersion: VIGENTE + 1 }),
        fila({ extractorVersion: 2, source: 'onedrive', providerFileId: null }),
        fila({ extractorVersion: 2, source: 'onedrive', providerFileId: 'c' }),
      ],
      VIGENTE,
    );
    expect(r.al_dia).toBe(1);
    expect(r.reparable_resubiendo).toBe(2);
    expect(r.anomalias).toEqual({ version_futura: 1, sincronizado_sin_id: 1, via_no_construida: 1 });
  });
});
