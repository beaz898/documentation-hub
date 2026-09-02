import { describe, expect, it } from 'vitest';

import { lineaDePerdida, MARCADOR_DE_PERDIDA } from './perdidas';

/**
 * QUE LO MUDO SE PUEDA CONTAR (regla 6, memoria del fallo, 02/09/2026).
 *
 * Los dos escritores de uso se tragaban su fallo con prefijos distintos, sin
 * org, sin endpoint y sin distinguir el error de consulta de la excepción.
 * Grepear eso no daba un número, así que NADIE SABÍA cuántas filas de uso se
 * pierden.
 *
 * ⚠️ ESTO NO ARREGLA LA PÉRDIDA, y el commit no finge lo contrario: ningún
 * búfer, ninguna tabla, ningún reintento, ningún cambio de comportamiento.
 *
 * ⚠️ Y EL RECUENTO TIENE QUE SERVIR PARA DOS PREGUNTAS:
 *   · la nuestra — ¿búfer, reintento o nada? La contesta la CAUSA;
 *   · la del negocio — CUÁNTA CUOTA SE REGALA. `usage_logs` es lo que el
 *     limitador cuenta, así que cada fila perdida ahí es una llamada regalada.
 *     La contesta la TABLA.
 * Un marcador que no separase las dos tablas serviría para la mitad.
 */

describe('lineaDePerdida — un solo grep cuenta las dos pérdidas', () => {
  /**
   * ⚠️ EL MARCADOR ES EL MISMO EN LAS DOS, y ésa es toda su función. Si cada
   * escritor pusiera el suyo habría que conocer los dos para contar, y contar
   * de menos sería lo fácil.
   */
  it('el marcador es idéntico venga de donde venga', () => {
    const a = lineaDePerdida({ tabla: 'usage_logs', causa: 'consulta_fallida' });
    const b = lineaDePerdida({ tabla: 'llm_usage', causa: 'excepcion' });

    expect(a.startsWith(MARCADOR_DE_PERDIDA)).toBe(true);
    expect(b.startsWith(MARCADOR_DE_PERDIDA)).toBe(true);
  });

  /**
   * ⚠️ LA PREGUNTA DEL NEGOCIO: sin la tabla dentro de la línea, el recuento no
   * puede separar la cuota regalada (`usage_logs`, que es lo que cuenta el
   * limitador) de un número que hoy no lee nadie (`llm_usage`). Es la mutación
   * que este commit existe para hacer caer.
   */
  it('la tabla va dentro, y las dos se distinguen', () => {
    expect(lineaDePerdida({ tabla: 'usage_logs', causa: 'excepcion' })).toContain('tabla=usage_logs');
    expect(lineaDePerdida({ tabla: 'llm_usage', causa: 'excepcion' })).toContain('tabla=llm_usage');
  });

  /**
   * LA PREGUNTA NUESTRA: `consulta_fallida` es «la base contestó y dijo que no»
   * —lo que un reintento arreglaría— y `excepcion` es «no hubo respuesta». Si
   * las dos causas fueran el mismo texto, el registro existiría y no serviría
   * para decidir la pieza siguiente. Es el criterio del limitador, aplicado.
   */
  it('las dos causas se distinguen', () => {
    const consulta = lineaDePerdida({ tabla: 'usage_logs', causa: 'consulta_fallida' });
    const excepcion = lineaDePerdida({ tabla: 'usage_logs', causa: 'excepcion' });

    expect(consulta).toContain('causa=consulta_fallida');
    expect(excepcion).toContain('causa=excepcion');
    expect(consulta).not.toBe(excepcion);
  });

  it('las coordenadas viajan en la línea', () => {
    const l = lineaDePerdida({
      tabla: 'usage_logs', causa: 'consulta_fallida',
      orgId: 'org-7', referencia: '/api/ask', detalle: 'column does not exist',
    });

    expect(l).toContain('org=org-7');
    expect(l).toContain('ref=/api/ask');
    expect(l).toContain('detalle=column does not exist');
  });

  /**
   * ⚠️ SIN ORG SE EMITE IGUAL. Perder la línea entera por no tener una
   * coordenada sería cambiar un silencio por otro — y precisamente en el caso
   * raro, que es el que más interesa ver. La ausencia va marcada de forma
   * explícita y no como cadena vacía: una cadena vacía en el sitio de un dato se
   * lee como un dato.
   */
  it('sin org, y sin referencia, la línea sale igual y lo dice', () => {
    const l = lineaDePerdida({ tabla: 'llm_usage', causa: 'excepcion' });

    expect(l).toContain(MARCADOR_DE_PERDIDA);
    expect(l).toContain('org=desconocida');
    expect(l).toContain('ref=desconocida');
    expect(l).not.toContain('org= ');
  });

  /**
   * EL DETALLE ES OPCIONAL Y NO DEJA HUECO. Sin él la línea no lleva el campo,
   * en vez de llevarlo vacío: un `detalle=` a secas en un recuento se lee como
   * un error sin mensaje, que es otra cosa.
   */
  it('sin detalle no hay campo de detalle', () => {
    expect(lineaDePerdida({ tabla: 'llm_usage', causa: 'excepcion' })).not.toContain('detalle=');
  });
});
