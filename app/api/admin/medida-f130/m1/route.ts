import { NextRequest } from 'next/server';
import { medirConElProducto } from '../producto-ruta';

/**
 * POST /api/admin/medida-f130/m1 — EL CAMBIO CANDIDATO m1: prosa y luego la casilla, sobre los documentos enteros, por la costura
 * del juez, TEMPORAL. Qué cambia y qué no, en `../cambio-m1.ts`; todo lo demás, en `../producto-ruta.ts`. Con `?ensayo=1`, los dos prompts
 * recortados y el registro de las supresiones, sin modelo; con `?sondeo=1`, una sola vez (dos llamadas).
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return medirConElProducto(req, 'documentos', 'm1');
}
