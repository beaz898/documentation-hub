import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_SEG_02. Se lanzan con: node claude/herramientas/mutar-cli.mts claude/arneses/seg/mutantes-sql-seg-02.ts
const filtro = (tabla: string, cond: string) => ({
  nombre: tabla + ' sin organización',
  ancla: 'FROM public.' + tabla + ' t, p\nWHERE ' + cond,
  cambio: 'FROM public.' + tabla + ' t, p\nWHERE true',
});

export const definicion: Definicion = {
  fichero: 'SQL_SEG_02_las_tablas_de_la_medida.sql',
  arnes: 'claude/arneses/seg/sql-seg-02',
  proyecto: 'arneses',
  tests: 7,
  mutantes: [
    filtro('documents', 't.org_id = p.org_del_piloto'),
    filtro('document_chunks', 't.org_id = p.org_del_piloto'),
    filtro('document_staged', 't.org_id = p.org_del_piloto'),
    filtro('analysis_jobs', 't.org_id::text = p.org_del_piloto'),
    filtro('finding_dismissals', 't.org_id = p.org_del_piloto'),
    filtro('llm_usage', 't.org_id::text = p.org_del_piloto'),
    filtro('usage_logs', 't.org_id = p.org_del_piloto'),
    { nombre: 'organizations sin la fila del piloto', ancla: 'WHERE t.id::text = p.org_del_piloto', cambio: 'WHERE true' },
    { nombre: 'trozos al revés', ancla: 'ORDER BY t.document_id, t.generation, t.chunk_index;', cambio: 'ORDER BY t.document_id, t.generation, t.chunk_index DESC;' },
    { nombre: 'trozos: total por índice y no de todo', ancla: 'count(*) OVER () AS total_filas,\n       length(t.text)', cambio: 'count(*) OVER (PARTITION BY t.chunk_index) AS total_filas,\n       length(t.text)' },
    { nombre: 'documents: huella del nombre', ancla: 'md5(t.full_text) AS huella_del_texto,\n       t.*\nFROM public.documents', cambio: 'md5(t.name) AS huella_del_texto,\n       t.*\nFROM public.documents' },
    { nombre: 'staged: huella de otra cosa', ancla: 'md5(t.full_text) AS huella_del_texto,\n       t.*\nFROM public.document_staged', cambio: "md5('x') AS huella_del_texto,\n       t.*\nFROM public.document_staged" },
    { nombre: 'jobs: caracteres de un resultado recortado', ancla: 'length(t.result::text) AS caracteres_del_resultado', cambio: 'length(left(t.result::text, 100)) AS caracteres_del_resultado' },
    { nombre: 'jobs: huella del documento sobre el estado', ancla: 'md5(t.document_text) AS huella_del_documento', cambio: 'md5(t.status) AS huella_del_documento' },
    { nombre: 'llm_usage al revés de fecha', ancla: 'FROM public.llm_usage t, p\nWHERE t.org_id::text = p.org_del_piloto\nORDER BY t.created_at, t.id;', cambio: 'FROM public.llm_usage t, p\nWHERE t.org_id::text = p.org_del_piloto\nORDER BY t.created_at DESC, t.id;' },
  ],
};
