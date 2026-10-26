import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de la RESOLUCIÓN de la organización en SQL_F128_02_nor10_con_haiku55.sql (26/10/2026). Los demás, en el histórico.
// Se lanzan con: node claude/herramientas/mutar-cli.mts <esta definición>
export const definicion: Definicion = {
  fichero: "SQL_F128_02_nor10_con_haiku55.sql",
  arnes: "claude/arneses/f128/sql-f128-02",
  proyecto: 'arneses',
  tests: 13,
  mutantes: [
    { nombre: "la resolución no exige UNA pertenencia", ancla: "         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org", cambio: "         min(m.org_id::text) AS org" },
    { nombre: "la primera fila no mira qué organización se lee", ancla: "  SELECT CASE WHEN r.org IS NOT NULL", cambio: "  SELECT CASE WHEN true" },
    { nombre: "se UNIFICA: el id del piloto vuelve a leerse como organización", ancla: "  SELECT (SELECT org FROM resolucion) AS org,   -- ← la organización RESUELTA por el USUARIO (arriba)", cambio: "  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← la organización RESUELTA por el USUARIO (arriba)" },
    { nombre: "la organización leída deja de ir primera (el orden)", ancla: "ORDER BY (bloque <> 'organización leída'), bloque, o1, o2, pasada;", cambio: "ORDER BY bloque, o1, o2, pasada;" },
  ],
};
