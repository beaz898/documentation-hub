/**
 * EL PERMISO DE LANZAR (arquitecto, 28/09/2026): `--lanzar=<créditos>`, y el
 * número tiene que ser EXACTAMENTE el coste que declara el modo seco para los
 * casos y pasadas seleccionados. Un «¿seguro?» no lleva información; esto sí:
 * quien lanza ha tenido que leer el coste. Ya nos mordió una vez: 45 pasadas
 * contra una URL inventada.
 *
 * Falla CERRADO: sin número, con un número que no es entero, repetido o
 * distinto, no se lanza, y el error imprime el dado y el calculado.
 *
 * Devuelve `{ lanzar: false }` (seco), `{ lanzar: true }` o `{ error }`.
 */
export function permisoDeLanzar(argv, creditosCalculados) {
  const pedidos = argv.filter(a => a === '--lanzar' || a.startsWith('--lanzar='));
  if (pedidos.length === 0) return { lanzar: false };
  const calculado = `el coste calculado para esta selección es ${creditosCalculados}`;
  if (pedidos.length > 1) return { error: `\`--lanzar\` repetido (${pedidos.join(' ')}); ${calculado}` };
  const m = /^--lanzar=(\d+)$/.exec(pedidos[0]);
  if (!m) return { error: `hace falta \`--lanzar=<créditos>\` y se dio «${pedidos[0]}»; ${calculado}` };
  const dado = Number(m[1]);
  if (dado !== creditosCalculados) return { error: `se dio --lanzar=${dado} y ${calculado}` };
  return { lanzar: true };
}
