import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_INV_01. Se lanzan con: node claude/herramientas/mutar-cli.mts claude/arneses/inv/mutantes-sql-inv-01.ts
export const definicion: Definicion = {
  fichero: 'SQL_INV_01_inventario_del_corpus.sql',
  arnes: 'claude/arneses/inv',
  proyecto: 'arneses',
  tests: 6,
  mutantes: [
    { nombre: 'documentos de otra organización', ancla: 'FROM public.documents d, p WHERE d.org_id = p.org', cambio: 'FROM public.documents d, p WHERE true' },
    { nombre: 'análisis por documento sin filtrar organización', ancla: 'WHERE ar.org_id = p.org AND ar.document_id = d.id', cambio: 'WHERE ar.document_id = d.id' },
    { nombre: 'trozos de cualquier generación', ancla: 'WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos,', cambio: 'WHERE c.document_id = d.id) AS trozos,' },
    { nombre: 'prefijo sin la guarda del dígito', ancla: "d.name ~ ('^' || l.prefijo || '([^0-9]|$)')\nGROUP BY", cambio: "d.name ~ ('^' || l.prefijo)\nGROUP BY" },
    { nombre: 'todo análisis con documento cuenta como vivo', ancla: "WHEN EXISTS (SELECT 1 FROM docs WHERE docs.id = ar.document_id) THEN 'vivo'", cambio: "WHEN true THEN 'vivo'" },
    { nombre: 'duplicado exige tres copias', ancla: '(SELECT name FROM docs GROUP BY name HAVING count(*) > 1) r', cambio: '(SELECT name FROM docs GROUP BY name HAVING count(*) > 2) r' },
    { nombre: 'con trozos sin mirar los análisis', ancla: 'FROM docs WHERE trozos > 0 AND analisis = 0', cambio: 'FROM docs WHERE trozos > 0' },
    { nombre: 'la purga programada no se ve', ancla: 'WHEN grace_period_ends_at IS NOT NULL\n', cambio: 'WHEN false\n' },
    { nombre: 'filas de análisis de otra organización', ancla: 'FROM public.analysis_results ar, p WHERE ar.org_id = p.org\n),', cambio: 'FROM public.analysis_results ar, p\n),' },
    { nombre: 'lápidas de otra organización', ancla: 'FROM public.document_tombstones t, p WHERE t.org_id = p.org\nUNION ALL', cambio: 'FROM public.document_tombstones t, p\nUNION ALL' },
    { nombre: 'conexión de Drive de otra organización', ancla: 'WHERE dc.org_id = p.org', cambio: 'WHERE true' },
    { nombre: 'el control compara con todas las filas', ancla: "(SELECT coalesce(sum(analisis), 0) FROM docs) = (SELECT count(*) FROM ana WHERE dueno = 'vivo')", cambio: '(SELECT coalesce(sum(analisis), 0) FROM docs) = (SELECT count(*) FROM ana)' },
  ],
};
