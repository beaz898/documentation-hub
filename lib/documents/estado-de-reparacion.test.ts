import { describe, it, expect } from 'vitest';
import { estadoDeReparacion, recuentoPorEstado } from './estado-de-reparacion';
import type { FilaParaSello } from './estado-de-reparacion';
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

  it('TODOS los orígenes sincronizados con id son automáticos', () => {
    for (const source of ORIGENES_SINCRONIZADOS) {
      expect(
        estadoDeReparacion(fila({ extractorVersion: 2, source, providerFileId: 'abc123' }), VIGENTE),
      ).toEqual({ estado: 'reparable_automaticamente' });
    }
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
      estadoDeReparacion({ extractorVersion: null, source: null, providerFileId: null }, VIGENTE),
    ).toEqual({ estado: 'reparable_resubiendo' });
  });
});

describe('recuentoPorEstado', () => {
  it('reparte cada fila en su estado y suma el total', () => {
    const filas: FilaParaSello[] = [
      fila(),
      fila({ extractorVersion: 2, source: 'google_drive', providerFileId: 'a' }),
      fila({ extractorVersion: 2, source: 'onedrive', providerFileId: 'b' }),
      fila({ extractorVersion: 2 }),
      fila({ extractorVersion: null }),
    ];
    const r = recuentoPorEstado(filas, VIGENTE);

    expect(r.al_dia).toBe(1);
    expect(r.reparable_automaticamente).toBe(2);
    expect(r.reparable_resubiendo).toBe(2);
    expect(r.al_dia + r.reparable_automaticamente + r.reparable_resubiendo).toBe(filas.length);
  });

  it('⚠️ un corpus vacío devuelve las TRES claves a cero, no un objeto vacío', () => {
    const r = recuentoPorEstado([], VIGENTE);
    expect(r).toEqual({
      al_dia: 0,
      reparable_automaticamente: 0,
      reparable_resubiendo: 0,
      anomalias: { version_futura: 0, sincronizado_sin_id: 0 },
    });
  });

  it('las anomalías se cuentan aparte y no restan de su estado', () => {
    const r = recuentoPorEstado(
      [
        fila({ extractorVersion: VIGENTE + 1 }),
        fila({ extractorVersion: 2, source: 'onedrive', providerFileId: null }),
      ],
      VIGENTE,
    );
    expect(r.al_dia).toBe(1);
    expect(r.reparable_resubiendo).toBe(1);
    expect(r.anomalias).toEqual({ version_futura: 1, sincronizado_sin_id: 1 });
  });
});
