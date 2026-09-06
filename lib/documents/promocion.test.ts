import { describe, it, expect } from 'vitest';
import { camposDePromocion } from './promocion';
import type { DatosDelStaged } from './promocion';

/**
 * ⚠️ LO QUE ESTA BATERÍA VIGILA es una PÉRDIDA SILENCIOSA DE PERTENENCIA: con la
 * conmutación de antes, reparar el troceado de un documento `pendiente` lo
 * habría promovido a `analizado` — metiéndolo en el corpus sin que nadie lo
 * revisara— y le habría borrado a un documento ya revisado su procedencia.
 * Ningún error, ninguna traza: un documento más en el corpus.
 *
 * Por eso los casos se escriben por CAMPO AUSENTE y no solo por valor: lo que
 * importa del retroceado no es qué escribe, es qué NO escribe.
 */

const STAGED: DatosDelStaged = {
  full_text: 'texto',
  content_hash: 'hash-nuevo',
  chunk_count: 7,
  size_bytes: 1234,
  source_modified_at: null,
  segments: [{ type: 'text', text: 'contenido' }],
};

describe('camposDePromocion — lo común a los dos motivos', () => {
  it('el troceado y el texto se escriben siempre', () => {
    for (const motivo of ['contenido_validado', 'mismo_contenido_retroceado'] as const) {
      const c = camposDePromocion(STAGED, 4, 3, motivo);
      expect(c.full_text).toBe('texto');
      expect(c.content_hash).toBe('hash-nuevo');
      expect(c.chunk_count).toBe(7);
      expect(c.size_bytes).toBe(1234);
      expect(c.active_generation).toBe(4);
      expect(c.extractor_version).toBe(3);
    }
  });
});

describe('camposDePromocion — contenido validado', () => {
  it('promueve, sella lo analizado y resetea la procedencia de revisión', () => {
    const c = camposDePromocion(STAGED, 4, 3, 'contenido_validado');
    expect(c.analysis_status).toBe('analizado');
    expect(c.analyzed_content_hash).toBe('hash-nuevo');
    expect(c.reviewed_at).toBeNull();
    expect(c.reviewed_by).toBeNull();
  });
});

describe('camposDePromocion — mismo contenido, otro troceado', () => {
  it('⚠️ NO promueve: un retroceado no mete un documento en el corpus', () => {
    const c = camposDePromocion(STAGED, 4, 3, 'mismo_contenido_retroceado');
    expect('analysis_status' in c).toBe(false);
  });

  it('⚠️ NO toca la procedencia de revisión: no devuelve a la bandeja lo revisado', () => {
    const c = camposDePromocion(STAGED, 4, 3, 'mismo_contenido_retroceado');
    expect('reviewed_at' in c).toBe(false);
    expect('reviewed_by' in c).toBe(false);
  });

  it('⚠️ NO mueve el hash de lo analizado: no ha analizado nada', () => {
    const c = camposDePromocion(STAGED, 4, 3, 'mismo_contenido_retroceado');
    expect('analyzed_content_hash' in c).toBe(false);
  });

  it('las cuatro afirmaciones sobre el contenido se omiten JUNTAS', () => {
    // Van juntas a propósito: dejar una sola dentro bastaría para mentir sobre
    // el contenido, y separarlas invitaría a «solo esta, que es inofensiva».
    const c = camposDePromocion(STAGED, 4, 3, 'mismo_contenido_retroceado');
    expect(Object.keys(c).sort()).toEqual([
      'active_generation', 'chunk_count', 'content_hash',
      'extractor_version', 'full_text', 'segments', 'size_bytes',
      'source_modified_at',
    ]);
  });
});

describe('⚠️ F-105 paso 0 — los segmentos viajan en la promoción', () => {
  /**
   * Van con LOS DOS motivos, y por eso hay caso en las dos direcciones: los
   * segmentos describen EL CONTENIDO, y ninguno de los dos motivos lo cambia.
   * Si un retroceado no los promoviera, un documento PERDERÍA sus segmentos
   * justo al repararlo — el revés exacto de lo que la reparación hace.
   */
  it('con contenido validado', () => {
    const c = camposDePromocion(STAGED, 4, 3, 'contenido_validado');
    expect(c.segments).toEqual([{ type: 'text', text: 'contenido' }]);
  });

  it('y con mismo contenido retroceado', () => {
    const c = camposDePromocion(STAGED, 4, 3, 'mismo_contenido_retroceado');
    expect(c.segments).toEqual([{ type: 'text', text: 'contenido' }]);
  });

  /**
   * ⚠️ Un staged de ANTES de hoy no los tiene, y eso es legítimo durante la
   * ventana. Se promueve un `null` explícito y no `undefined`: la columna queda
   * escrita diciendo «no hay», que es lo que el lector dual espera.
   */
  it('un staged sin segmentos promueve null, no undefined', () => {
    const sinSeg = { ...STAGED, segments: undefined };
    const c = camposDePromocion(sinSeg, 4, 3, 'contenido_validado');
    expect(c.segments).toBeNull();
    expect('segments' in c).toBe(true);
  });
});
