import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractText } from '@/lib/chunking';
import { findBestMatch, describirDescarte } from './coincidencia-de-cita';

/**
 * B.318 — LA PUERTA DE CABEZA Y COLA ERA UN SELLO DE GOMA (puesto 1, 02/10/2026).
 * Deja de ACEPTAR y sigue DESCRIBIENDO. Contra el texto real de los documentos
 * del corpus: la cita de 434 caracteres del autoclave, publicada dos veces, que
 * hoy pasa y después no; y las dos citas literales enteras que tenemos de la
 * misma medida, que tienen que seguir pasando.
 *
 * Lee disco: lleva su tope propio, como guarda contra cuelgues y no como
 * requisito de rendimiento (vitest.config.mts).
 */
const textos: Record<string, string> = {};
beforeAll(async () => {
  for (const n of ['NOR-10_protocolo-esterilizacion-instrumental.docx', 'CLI-12_manual-calidad-clinica.docx', 'CLI-13_instrucciones-clinicas-residuos.docx']) {
    textos[n.slice(0, 6)] = await extractText(readFileSync(`corpus-pruebas/${n}`), n);
  }
}, 120_000);

const AUTOCLAVE = 'El Director Clínico quien autoriza cualquier excepción documentada al procedimiento y quien responde ante Dirección de Operaciones en caso de incidencia grave relacionada con la esterilización del instrumental. La responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre esta figura.';
const LITERAL_CLI12 = 'El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico.';
const LITERAL_CLI13 = 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro';

describe('B.318 · la puerta de cabeza y cola deja de aceptar', { timeout: 120_000 }, () => {
  it('ROJO antes, VERDE después: la cita cosida del autoclave (434) YA NO pasa contra NOR-10', () => {
    expect(AUTOCLAVE.length).toBe(434);
    expect(findBestMatch(textos['NOR-10'], AUTOCLAVE)).toBeNull();
  });

  it('y el descarte la NOMBRA: cabeza y cola sigue siendo el diagnóstico', () => {
    expect(describirDescarte([textos['NOR-10']], AUTOCLAVE)).toBe('longitud=434, paso=cabeza_y_cola');
  });

  it('CONTROL: la cita literal de CLI-12 de la misma medida (341) sigue pasando', () => {
    expect(LITERAL_CLI12.length).toBe(341);
    expect(findBestMatch(textos['CLI-12'], LITERAL_CLI12)).not.toBeNull();
  });

  it('CONTROL: la cita literal de CLI-13 de Chamberí (103) sigue pasando', () => {
    expect(LITERAL_CLI13.length).toBe(103);
    expect(findBestMatch(textos['CLI-13'], LITERAL_CLI13)).not.toBeNull();
  });

  it('CONTROL: la frase 32 de NOR-10 entera, la que el puesto 2 pide copiar, pasa', () => {
    const f32 = 'El Director Clínico puede delegar funciones operativas del día a día en el personal auxiliar de esterilización, pero la responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre esta figura.';
    expect(findBestMatch(textos['NOR-10'], f32)).not.toBeNull();
  });
});
