import { describe, expect, it } from 'vitest';

import { esDelFondo } from './es-del-fondo';
import { ESTADO_DEL_CORPUS } from '@/lib/documents/estado';

/**
 * EL PREDICADO DEL FONDO — la rama que la costura del examen añadió a
 * `contarElFondo` (26/09/2026). Misma forma que la batería de
 * `elegirFiltroDeCorpus` en `corpus-del-examen.test.ts`.
 */

type Doc = { id: string; estado: string | null };

/** 44 `analizado`, los 8 del examen en `pendiente`, y dos que no son del corpus. */
const LOS_OCHO = ['NOR-10', 'CLI-12', 'NOR-11', 'CLI-13', 'OPE-10', 'OPE-11', 'RRHH-08', 'OPE-13'];
const UNIVERSO: Doc[] = [
  ...Array.from({ length: 44 }, (_, i) => ({ id: `piloto-${i}`, estado: ESTADO_DEL_CORPUS })),
  ...LOS_OCHO.map(id => ({ id, estado: 'pendiente' })),
  { id: 'descartado-1', estado: 'descartado' },
  { id: 'sin-estado', estado: null },
];

/** El predicado TAL COMO ERA antes de la costura (`termometro.ts`, `b67b0819`),
 *  copiado aquí a propósito: es la referencia fija de «el mismo resultado que hoy». */
function antes(d: Doc, batchDocumentIds: string[] | undefined, excludeDocumentId?: string): boolean {
  const deLaTanda = new Set(batchDocumentIds ?? []);
  return (d.estado === ESTADO_DEL_CORPUS || deLaTanda.has(d.id)) && d.id !== excludeDocumentId;
}

const ahora = (args: { exacto?: string[]; tanda?: string[]; excluido?: string }) =>
  UNIVERSO.filter(d => esDelFondo(d, {
    exacto: args.exacto ? new Set(args.exacto) : null,
    deLaTanda: new Set(args.tanda ?? []),
    excludeDocumentId: args.excluido,
  })).map(d => d.id);

describe('sin exacto: el mismo fondo que antes de la costura', () => {
  const TANDAS: Array<string[] | undefined> = [undefined, [], ['NOR-10', 'CLI-12']];
  const EXCLUIDOS: Array<string | undefined> = [undefined, 'piloto-3', 'NOR-10'];

  it('⚠️ CASO DECISIVO — sobre el mismo universo, idéntico para cada tanda y cada excluido', () => {
    for (const tanda of TANDAS) {
      for (const excluido of EXCLUIDOS) {
        const esperado = UNIVERSO.filter(d => antes(d, tanda, excluido)).map(d => d.id);
        expect(ahora({ tanda, excluido })).toEqual(esperado);
      }
    }
  });
});

describe('con exacto: esos y ninguno más, sin mirar el estado', () => {
  it('⚠️ salen EXACTAMENTE los 8, y ni uno de los 44 analizados', () => {
    const salen = ahora({ exacto: LOS_OCHO });
    expect([...salen].sort()).toEqual([...LOS_OCHO].sort());
    expect(salen.filter(id => id.startsWith('piloto-'))).toEqual([]);
  });

  it('el estado no cuenta: descartado o sin estado entran si la lista los nombra', () => {
    expect(ahora({ exacto: ['descartado-1', 'sin-estado', 'piloto-0'] }).sort())
      .toEqual(['descartado-1', 'piloto-0', 'sin-estado']);
  });

  it('el documento analizado sale del fondo también con exacto', () => {
    expect(ahora({ exacto: ['NOR-10', 'CLI-12'], excluido: 'NOR-10' })).toEqual(['CLI-12']);
  });

  it('⚠️ CONTROL POSITIVO — con exacto el fondo CAMBIA respecto al del producto', () => {
    // Sin esta mitad, un predicado que ignorase `exacto` pasaría el bloque de
    // arriba sólo si el universo coincidiera por casualidad; aquí no puede.
    expect(ahora({ exacto: LOS_OCHO })).not.toEqual(ahora({}));
    expect(ahora({})).toHaveLength(44);
  });
});
