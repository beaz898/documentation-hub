import { describe, it, expect, vi } from 'vitest';
import { recorrerElLote, MAXIMO_DE_RONDAS } from './bucle-del-lote';
import type { RondaDelLote } from './bucle-del-lote';

/**
 * LA BATERÍA DEL BUCLE — B.199.
 *
 * Es lo único de la pantalla de reparación que se prueba, y a propósito: el
 * resto se ve al mirarlo, y esto no. `LIMITE_POR_LLAMADA` vale 8, así que una
 * versión que pulse una sola vez repara ocho documentos y **parece terminada**.
 * Un verde falso aquí no se distingue de un corpus reparado.
 *
 * Ninguna toca la red ni la base: `llamada` se recibe como parámetro.
 */

const ronda = (r: Partial<RondaDelLote>): RondaDelLote => ({
  reparados: 0, bloqueados: 0, fallidos: 0, hay_mas: false, ...r,
});

/** Devuelve las rondas dadas, en orden, y luego falla si alguien pide de más. */
function guion(rondas: RondaDelLote[]) {
  let i = 0;
  return () => {
    if (i >= rondas.length) throw new Error('el bucle pidió más rondas de las previstas');
    return Promise.resolve(rondas[i++]);
  };
}

describe('recorrerElLote — pulsar hasta que no quede nada', () => {
  it('una ronda que ya lo dice todo termina en una', async () => {
    const r = await recorrerElLote(guion([ronda({ reparados: 3, hay_mas: false })]));
    expect(r).toMatchObject({ rondas: 1, reparados: 3, motivo: 'completo' });
  });

  /**
   * ⚠️ EL CASO QUE JUSTIFICA EL FICHERO. Tres rondas de ocho: una versión que
   * pulse una sola vez devolvería 8 y `completo`, que es indistinguible de un
   * corpus reparado. Aquí tiene que dar 20 y tres rondas.
   */
  it('sigue pulsando mientras hay_mas, y acumula', async () => {
    const r = await recorrerElLote(guion([
      ronda({ reparados: 8, hay_mas: true, para_reintentar: 12 }),
      ronda({ reparados: 8, hay_mas: true, para_reintentar: 4 }),
      ronda({ reparados: 4, hay_mas: false }),
    ]));
    expect(r.rondas).toBe(3);
    expect(r.reparados).toBe(20);
    expect(r.motivo).toBe('completo');
  });

  it('los bloqueados y los fallidos también se acumulan', async () => {
    const r = await recorrerElLote(guion([
      ronda({ reparados: 8, bloqueados: 1, fallidos: 2, hay_mas: true }),
      ronda({ reparados: 5, bloqueados: 3, fallidos: 1, hay_mas: false }),
    ]));
    expect(r).toMatchObject({ reparados: 13, bloqueados: 4, fallidos: 3 });
  });

  /**
   * ⚠️ UN DOCUMENTO QUE FALLA NO PARA NADA — la decisión del 09/09. Se sigue con
   * los demás y se declara al final; bloquear a los buenos por uno malo sería lo
   * contrario de para qué existe el lote.
   */
  it('un fallido no corta el bucle', async () => {
    const r = await recorrerElLote(guion([
      ronda({ reparados: 7, fallidos: 1, hay_mas: true }),
      ronda({ reparados: 6, hay_mas: false }),
    ]));
    expect(r).toMatchObject({ rondas: 2, reparados: 13, fallidos: 1, motivo: 'completo' });
  });

  /** ⚠️ MITAD CONTRARIA: dice que quedan y no repara ninguno. Repetir da lo
   *  mismo — lo que queda está bloqueado o falla. */
  it('corta si una ronda no progresa aunque diga hay_mas', async () => {
    const r = await recorrerElLote(guion([
      ronda({ reparados: 8, hay_mas: true }),
      ronda({ reparados: 0, bloqueados: 4, hay_mas: true }),
    ]));
    expect(r).toMatchObject({ rondas: 2, reparados: 8, motivo: 'sin_progreso' });
  });

  /** ⚠️ MITAD CONTRARIA: un `hay_mas` que nunca baja no puede dejar la pestaña
   *  girando para siempre. */
  it('el tope de rondas se respeta y se dice', async () => {
    const r = await recorrerElLote(
      () => Promise.resolve(ronda({ reparados: 8, hay_mas: true })),
      { maximoDeRondas: 4 },
    );
    expect(r).toMatchObject({ rondas: 4, reparados: 32, motivo: 'tope' });
  });

  it('el tope por defecto existe y es finito', () => {
    expect(MAXIMO_DE_RONDAS).toBeGreaterThan(0);
    expect(Number.isFinite(MAXIMO_DE_RONDAS)).toBe(true);
  });

  /** Un corte devuelve lo ACUMULADO: ocho reparados y un corte se lee muy
   *  distinto de cero reparados y un corte. */
  it('un error a mitad devuelve lo ya reparado', async () => {
    let i = 0;
    const r = await recorrerElLote(() => {
      if (i++ === 0) return Promise.resolve(ronda({ reparados: 8, hay_mas: true }));
      return Promise.reject(new Error('la red se cayó'));
    });
    expect(r).toMatchObject({ rondas: 1, reparados: 8, motivo: 'error' });
    expect(r.error).toContain('la red');
  });

  it('cancelar se consulta ANTES de pedir otra ronda', async () => {
    const llamada = vi.fn(() => Promise.resolve(ronda({ reparados: 8, hay_mas: true })));
    const r = await recorrerElLote(llamada, { cancelado: () => llamada.mock.calls.length >= 2 });
    expect(llamada).toHaveBeenCalledTimes(2);
    expect(r.reparados).toBe(16);
  });

  it('`truncado` de cualquier ronda se propaga', async () => {
    const r = await recorrerElLote(guion([
      ronda({ reparados: 8, hay_mas: true, truncado: true }),
      ronda({ reparados: 1, hay_mas: false }),
    ]));
    expect(r.truncado).toBe(true);
  });

  it('avisa entre rondas para que la pantalla pinte el avance', async () => {
    const vistos: number[] = [];
    await recorrerElLote(guion([
      ronda({ reparados: 8, hay_mas: true }),
      ronda({ reparados: 8, hay_mas: true }),
      ronda({ reparados: 1, hay_mas: false }),
    ]), { alAvanzar: p => vistos.push(p.reparados) });
    // Solo entre rondas: la última no avisa, devuelve.
    expect(vistos).toEqual([8, 16]);
  });
});
