import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_SEG_01. Se lanzan con: node claude/herramientas/mutar-cli.mts claude/arneses/seg/mutantes-sql-seg-01.ts
export const definicion: Definicion = {
  fichero: 'SQL_SEG_01_las_mediciones_en_csv.sql',
  arnes: 'claude/arneses/seg/sql-seg-01',
  proyecto: 'arneses',
  tests: 3,
  mutantes: [
    { nombre: 'sin el filtro de la organización', ancla: 'WHERE ar.org_id = p.org', cambio: 'WHERE true' },
    { nombre: 'la descarga cortada a dos filas', ancla: 'ORDER BY ar.created_at, ar.id;', cambio: 'ORDER BY ar.created_at, ar.id LIMIT 2;' },
    { nombre: 'al revés de fecha', ancla: 'ORDER BY ar.created_at, ar.id;', cambio: 'ORDER BY ar.created_at DESC, ar.id;' },
    { nombre: 'el total por documento y no de todo', ancla: 'count(*) OVER () AS total_filas', cambio: 'count(*) OVER (PARTITION BY ar.document_name) AS total_filas' },
    { nombre: 'los caracteres de un análisis recortado', ancla: 'length(ar.analysis::text) AS caracteres_del_analisis', cambio: 'length(left(ar.analysis::text, 1000)) AS caracteres_del_analisis' },
    { nombre: 'la huella del análisis sobre los contadores', ancla: 'md5(ar.analysis::text) AS huella_del_analisis', cambio: 'md5(ar.pipeline_counters::text) AS huella_del_analisis' },
    { nombre: 'el registro por llamada con otra clave', ancla: "(ar.analysis ? 'llamadasAlModelo')", cambio: "(ar.analysis ? 'llamadas')" },
    { nombre: 'columnas escogidas en vez de la fila entera', ancla: '       ar.*\n', cambio: '       ar.id, ar.org_id, ar.user_id, ar.document_name, ar.analysis_type, ar.created_at, ar.analysis\n' },
  ],
};
