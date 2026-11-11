import { NextRequest } from 'next/server';
import { medirConElProducto } from '../producto-ruta';

/**
 * POST /api/admin/medida-f130/d4c — EL BRAZO MEDIANO SIN COMPETENCIA: el trozo de D y trozos NEUTROS hasta el tamaño de d4b, de cada
 * lado, TEMPORAL. Qué trozos y por qué, en `../brazos.ts`; todo lo demás, en `../producto-ruta.ts`. Con `?ensayo=1`, el prompt
 * recortado y cada trozo con sus marcas, sin modelo; con `?sondeo=1`, una sola llamada.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return medirConElProducto(req, 'neutros');
}
