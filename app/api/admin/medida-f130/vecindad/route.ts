import { NextRequest, NextResponse } from 'next/server';
import { buildVectorId, fetchVectors, parseVectorId, queryVectors } from '@/lib/pinecone/vectors';
import { autorizar, leerTrozos, type TrozoLeido } from '../leer-de-la-base';
import { contarFiguras, coseno, correspondencia, puestos } from '../medida-f130';

/**
 * POST /api/admin/medida-f130/vecindad — P-F130-9, TEMPORAL (cabecera de `../medida-f130.ts`).
 *
 * ¿Son vecinos vectoriales el trozo 4 de NOR-10 y los trozos 3 y 6 de CLI-12, y comparten las dos figuras? SOLO LEE:
 * la base y Pinecone (un `fetch` de tres vectores y tres consultas acotadas a un documento). Ningún modelo, ningún
 * embebido, ningún crédito. Informativa, no decisiva (arquitecto, 28/10): el enumerador tiene dos vías.
 * Comprueba la correspondencia de cada vector por su TEXTO, no sólo por su número.
 */
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const a = await autorizar(req);
  if (!a.ok) return a.respuesta;
  const { supabase, orgId } = a;

  const leidos = await leerTrozos(supabase, orgId, ['nor10_4', 'cli12_3', 'cli12_6']);
  if (!leidos.ok) return NextResponse.json({ error: leidos.error }, { status: 409 });
  const t = leidos.trozos;
  const idDe = (x: TrozoLeido) => buildVectorId(x.documentId, x.generacion, x.chunkIndex);

  try {
    const vectores = await fetchVectors(orgId, Object.values(t).map(idDe));
    const porTrozo = Object.fromEntries(Object.values(t).map(x => {
      const v = vectores[idDe(x)];
      return [x.clave, {
        documento: x.nombre, trozo: x.chunkIndex, vectorId: idDe(x),
        enPinecone: Boolean(v),
        // el texto que guarda el vector frente al de la base: así se sabe si el número de trozo corresponde
        correspondencia: v ? correspondencia(v.metadata?.text, x.texto) : null,
        figuras: contarFiguras(x.texto),
      }];
    }));

    const valores = (x: TrozoLeido) => vectores[idDe(x)]?.values ?? [];
    const parecido = {
      nor10_4__cli12_3: coseno(valores(t.nor10_4), valores(t.cli12_3)),
      nor10_4__cli12_6: coseno(valores(t.nor10_4), valores(t.cli12_6)),
    };

    // Las dos direcciones, acotadas al otro documento: en qué puesto sale el trozo esperado entre los de ese documento.
    const consultar = async (desde: TrozoLeido, hacia: TrozoLeido[]) => {
      if (valores(desde).length === 0) return { error: 'sin vector de origen' };
      const r = await queryVectors(orgId, { vector: valores(desde), topK: 200, includeMetadata: false, filter: { documentId: { $eq: hacia[0].documentId } } });
      const deLaGeneracion = r.filter(m => parseVectorId(m.id)?.generation === hacia[0].generacion);
      const ids = deLaGeneracion.map(m => m.id);
      return {
        trozosDelOtroDocumento: deLaGeneracion.length,
        deOtrasGeneraciones: r.length - deLaGeneracion.length,
        puestos: puestos(ids, hacia.map(idDe)),
        puntuaciones: Object.fromEntries(hacia.map(h => [idDe(h), deLaGeneracion.find(m => m.id === idDe(h))?.score ?? null])),
        primeros: deLaGeneracion.slice(0, 5).map(m => ({ trozo: parseVectorId(m.id)?.chunkIndex ?? null, score: m.score })),
      };
    };

    return NextResponse.json({
      medida: 'P-F130-9 · vecindad del trozo 4 de NOR-10 con los trozos 3 y 6 de CLI-12',
      cuando: new Date().toISOString(),
      porTrozo,
      parecido,
      desdeNor10_4: await consultar(t.nor10_4, [t.cli12_3, t.cli12_6]),
      desdeCli12_3: await consultar(t.cli12_3, [t.nor10_4]),
      desdeCli12_6: await consultar(t.cli12_6, [t.nor10_4]),
    });
  } catch (err) {
    return NextResponse.json({ error: `Pinecone falló: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
  }
}
