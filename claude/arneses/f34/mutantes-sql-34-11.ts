import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_11. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-11.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_11_el_codigo_del_exhaustivo.sql',
  arnes: 'claude/arneses/f34/sql-34-11-el-codigo-del-exhaustivo.test.ts',
  proyecto: 'arneses',
  tests: 6,
  mutantes: [
    { nombre: 'la resolución no exige UNA pertenencia', ancla: '         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org', cambio: '         min(m.org_id::text) AS org' },
    { nombre: 'análisis de cualquier organización', ancla: '  WHERE ar.org_id = (SELECT org FROM resolucion) AND ar.created_at', cambio: '  WHERE true AND ar.created_at' },
    { nombre: 'el marcador 1 sin mirar su tipo', ancla: "coalesce(jsonb_typeof(ar.analysis->'lecturaDeLasParejas') = 'array', false) AS m1", cambio: 'true AS m1' },
    { nombre: 'el marcador 2 sin mirar su tipo', ancla: "coalesce(jsonb_typeof(ar.analysis->'llamadasAlModelo') = 'object', false) AS m2", cambio: 'true AS m2' },
    { nombre: 'el marcador 3 sin mirar la clave', ancla: "AND (ar.analysis->'pipelineCounters') ? 'verificador.confirmados_solo_por_cumplimiento', false) AS m3", cambio: ", false) AS m3" },
    { nombre: 'el «desde» de cualquier análisis, no sólo de los rápidos', ancla: "(SELECT min(created_at) FROM analisis WHERE analysis_type = 'quick' AND m3) AS d3", cambio: '(SELECT min(created_at) FROM analisis WHERE m3) AS d3' },
    { nombre: 'el «desde» del marcador 2 con el del 1', ancla: "(SELECT min(created_at) FROM analisis WHERE analysis_type = 'quick' AND m2) AS d2", cambio: "(SELECT min(created_at) FROM analisis WHERE analysis_type = 'quick' AND m1) AS d2" },
    { nombre: 'falta el 1 aunque el análisis sea anterior a su «desde»', ancla: "CASE WHEN d.d1 IS NOT NULL AND a.created_at > d.d1 AND NOT a.m1", cambio: 'CASE WHEN NOT a.m1' },
    { nombre: 'falta el 3 aunque el análisis sea anterior a su «desde»', ancla: "CASE WHEN d.d3 IS NOT NULL AND a.created_at > d.d3 AND NOT a.m3", cambio: 'CASE WHEN NOT a.m3' },
    { nombre: 'sólo exhaustivos: cualquiera vale', ancla: "  WHERE a.analysis_type = 'exhaustive'\n", cambio: '\n' },
    { nombre: 'el control 3 no mira', ancla: '         (SELECT d3 FROM desde) IS NOT NULL\n)', cambio: '         true\n)' },
    { nombre: 'el caso 1 sin mirar el marcador', ancla: '              WHEN (SELECT bool_and(m3) FROM exhaustivos WHERE despues_del_3)', cambio: '              WHEN true' },
    { nombre: 'posterior al contador, sin mirar la hora', ancla: '         d.d3 IS NOT NULL AND a.created_at > d.d3 AS despues_del_3', cambio: '         d.d3 IS NOT NULL AS despues_del_3' },
    { nombre: 'la hora en UTC y no de Madrid', ancla: "to_char(e.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI')", cambio: "to_char(e.created_at, 'DD/MM/YYYY HH24:MI')" },
    { nombre: 'la organización leída deja de ir primera', ancla: "ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;", cambio: 'ORDER BY bloque, o1, o2;' },
  ],
};
