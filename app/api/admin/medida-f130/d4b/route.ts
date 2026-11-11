import { NextRequest } from 'next/server';
import { medirConElProducto } from '../producto-ruta';

/**
 * POST /api/admin/medida-f130/d4b — EL BRAZO MEDIANO CON COMPETENCIA: el trozo de D y los de A, B y C, de cada lado, TEMPORAL. Qué
 * trozos y por qué, en `../brazos.ts`; todo lo demás, en `../producto-ruta.ts`. Con `?ensayo=1`, el prompt recortado y cada trozo
 * con sus marcas, sin modelo; con `?sondeo=1`, una sola llamada.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return medirConElProducto(req, 'competencia');
}
