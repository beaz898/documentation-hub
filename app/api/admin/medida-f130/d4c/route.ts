import { NextRequest } from 'next/server';
import { medirConElProducto } from '../producto-ruta';

/**
 * POST /api/admin/medida-f130/d4c — LA GEMELA DE d4 CON LOS DOS TROZOS (NOR-10·4 y CLI-12·6) EN VEZ DE LOS DOCUMENTOS ENTEROS,
 * TEMPORAL. Lo único que cambia respecto a d4 es qué texto entra; todo lo demás, en `../producto-ruta.ts`. Con `?ensayo=1`, el prompt
 * recortado sin modelo; con `?sondeo=1`, una sola llamada.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return medirConElProducto(req, 'trozos');
}
