import { NextRequest } from 'next/server';
import { medirConElProducto } from '../producto-ruta';

/**
 * POST /api/admin/medida-f130/d4 — EL JUEZ DEL PRODUCTO SOBRE LA PAREJA DE D, CON EL PROMPT DEL PRODUCTO Y LOS DOS DOCUMENTOS
 * ENTEROS, TEMPORAL. Toda la lógica, las negativas duras y el dato declarado, en `../producto-ruta.ts`; su gemela con los trozos es
 * `../d4c/route.ts`. Con `?ensayo=1`, el prompt recortado sin modelo; con `?sondeo=1`, una sola llamada.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return medirConElProducto(req, 'documentos');
}
