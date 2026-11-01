import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_08. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-08.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_08_lo_que_recibio_el_juez.sql',
  arnes: 'claude/arneses/f34/sql-34-08-lo-que-recibio-el-juez.test.ts',
  proyecto: 'arneses',
  tests: 7,
  mutantes: [
    { nombre: 'la resolución no exige UNA pertenencia', ancla: '         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org', cambio: '         min(m.org_id::text) AS org' },
    { nombre: 'la organización leída deja de ir primera', ancla: "ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;", cambio: 'ORDER BY bloque, o1, o2;' },
    { nombre: 'pasadas de cualquier organización', ancla: 'JOIN public.analysis_results ar ON ar.org_id = (SELECT org FROM resolucion) AND', cambio: 'JOIN public.analysis_results ar ON true AND' },
    { nombre: 'pasadas de cualquier documento', ancla: " AND ar.document_name LIKE m.documento || '%'", cambio: '' },
    { nombre: 'sin la ventana', ancla: '                                 AND ar.created_at >= m.desde AND ar.created_at < m.hasta', cambio: '' },
    { nombre: 'la lectura de cualquier pareja', ancla: "         ON l->>'documentId' IN (SELECT id FROM cli12)\n  GROUP BY pa.orden, pa.n", cambio: '         ON true\n  GROUP BY pa.orden, pa.n' },
    { nombre: 'el analizado entero sin mirar lo que dejó fuera', ancla: 'le.a_mostrados = le.a_caracteres AND NOT coalesce(le.a_fuera, true)) AS analizado_entero', cambio: 'le.a_mostrados = le.a_caracteres) AS analizado_entero' },
    { nombre: 'el analizado entero sin mirar los caracteres', ancla: '(le.a_mostrados = le.a_caracteres AND NOT', cambio: '(NOT' },
    { nombre: 'CLI-12 entero sin mirar los trozos', ancla: '\n          AND le.c_trozos = (SELECT activos FROM trozos_cli12)) AS cli12_entero', cambio: ') AS cli12_entero' },
    { nombre: 'CLI-12 entero sin mirar lo que dejó fuera', ancla: 'le.c_mostrados = le.c_caracteres AND le.c_fuera = false', cambio: 'le.c_mostrados = le.c_caracteres' },
    { nombre: 'CLI-12 entero sin mirar los caracteres', ancla: '(le.lecturas = 1 AND le.c_mostrados = le.c_caracteres AND', cambio: '(le.lecturas = 1 AND' },
    { nombre: 'un «dejoFuera» ausente cuenta como que no dejó nada', ancla: "bool_or(coalesce((l->'candidato'->>'dejoFuera')::boolean, true))", cambio: "bool_or(coalesce((l->'candidato'->>'dejoFuera')::boolean, false))" },
    { nombre: 'los trozos de cualquier generación', ancla: 'JOIN cli12 c ON ch.document_id::text = c.id AND ch.generation = c.generacion) AS activos', cambio: 'JOIN cli12 c ON ch.document_id::text = c.id) AS activos' },
    { nombre: 'dos lecturas cuentan como una', ancla: '(le.lecturas = 1 AND le.c_mostrados', cambio: '(le.lecturas >= 1 AND le.c_mostrados' },
    { nombre: 'sin la rama de dos lecturas', ancla: "              WHEN v.lecturas > 1 THEN '⚠️ ' || v.lecturas || ' LECTURAS DE CLI-12'\n", cambio: '' },
    { nombre: 'el control de las lecturas no mira', ancla: 'ELSE (SELECT count(*) FROM veredicto WHERE lecturas <> 1) = 0 END', cambio: 'ELSE true END' },
    { nombre: 'el control positivo no mira CLI-12', ancla: 'ELSE (SELECT count(*) FROM veredicto WHERE lecturas = 1 AND c_caracteres IS DISTINCT FROM (SELECT n FROM caracteres_cli12)) = 0\n', cambio: 'ELSE true\n' },
    { nombre: 'el control positivo no mira el analizado', ancla: 'v.lecturas = 1 AND m.caracteres_analizado IS NOT NULL AND v.a_caracteres IS DISTINCT FROM m.caracteres_analizado) = 0 END', cambio: 'false) = 0 END' },
    { nombre: 'el control del modo rápido no mira', ancla: "              ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END", cambio: '              ELSE true END' },
    { nombre: 'el control de CLI-12 no mira', ancla: '         (SELECT count(*) FROM cli12) = 1', cambio: '         true' },
    { nombre: 'el control de las esperadas no mira', ancla: '         (SELECT count(*) FROM pasadas pa WHERE pa.orden = m.orden) = m.esperado', cambio: '         true' },
    { nombre: 'el total cuenta las cortadas como enteras', ancla: "|| count(v.n) FILTER (WHERE v.analizado_entero AND v.cli12_entero) || ' de '", cambio: "|| count(v.n) || ' de '" },
    { nombre: 'el total da la premisa por buena siempre', ancla: 'CASE WHEN count(v.n) > 0 AND count(v.n) FILTER (WHERE v.analizado_entero AND v.cli12_entero) = count(v.n)', cambio: 'CASE WHEN true' },
  ],
};
