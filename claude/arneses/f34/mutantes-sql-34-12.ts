import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_12. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-12.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_12_el_precio_del_candidato_entero.sql',
  arnes: 'claude/arneses/f34/sql-34-12-el-precio-del-candidato-entero.test.ts',
  proyecto: 'arneses',
  tests: 6,
  mutantes: [
    { nombre: 'filas de cualquier organización', ancla: '  WHERE t.org_id::text = p.org_del_piloto', cambio: '  WHERE true' },
    { nombre: 'la hora en UTC y no de Madrid', ancla: "(t.created_at AT TIME ZONE 'Europe/Madrid') AS madrid", cambio: "(t.created_at AT TIME ZONE 'UTC') AS madrid" },
    { nombre: 'cualquier día', ancla: "  WHERE f.madrid >= timestamp '2026-09-28 00:00:00' AND f.madrid < timestamp '2026-09-29 00:00:00'\n", cambio: '  WHERE true\n' },
    { nombre: 'cualquier operación', ancla: "    AND f.operation IN ('analyze_quick', 'analyze_exhaustive')", cambio: '    AND true' },
    { nombre: 'la ventana empieza un minuto antes', ancla: "WHEN f.madrid < timestamp '2026-09-28 13:20:00' THEN", cambio: "WHEN f.madrid < timestamp '2026-09-28 13:19:00' THEN" },
    { nombre: 'la ventana acaba a las 13:26:00', ancla: "WHEN f.madrid < timestamp '2026-09-28 13:27:00' THEN", cambio: "WHEN f.madrid < timestamp '2026-09-28 13:26:00' THEN" },
    { nombre: 'un análisis por fila y no por hora', ancla: '  GROUP BY d.created_at, d.madrid, d.operation, d.ventana', cambio: '  GROUP BY d.id, d.created_at, d.madrid, d.operation, d.ventana' },
    { nombre: 'el coste sin sumar el segundo modelo', ancla: 'sum(d.cost_usd) AS coste', cambio: 'max(d.cost_usd) AS coste' },
    { nombre: 'por ventana también los rápidos', ancla: "  WHERE a.operation = 'analyze_exhaustive'\n  GROUP BY a.ventana", cambio: '  WHERE true\n  GROUP BY a.ventana' },
    { nombre: 'el control del día no mira', ancla: "CASE WHEN EXISTS (SELECT 1 FROM filas WHERE madrid >= timestamp '2026-09-28 00:00:00'", cambio: "CASE WHEN true OR EXISTS (SELECT 1 FROM filas WHERE madrid >= timestamp '2026-09-28 00:00:00'" },
    { nombre: 'el control de cero filas no avisa', ancla: "CASE WHEN count(*) = 0 THEN ' — ⚠️ NINGUNA", cambio: "CASE WHEN false THEN ' — ⚠️ NINGUNA" },
  ],
};
