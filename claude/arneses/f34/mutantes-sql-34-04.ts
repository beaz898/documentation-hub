import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_04. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-04.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_04_el_texto_de_los_dos_trozos.sql',
  arnes: 'claude/arneses/f34',
  proyecto: 'arneses',
  tests: 28,
  mutantes: [
    { nombre: 'la resolución no exige UNA pertenencia', ancla: '         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org', cambio: '         min(m.org_id::text) AS org' },
    { nombre: 'la organización leída deja de ir primera', ancla: "ORDER BY (bloque <> 'organización leída'), bloque, o1;", cambio: 'ORDER BY bloque, o1;' },
    { nombre: 'el límite una hora más tarde', ancla: "timestamptz '2026-10-29 18:30:00+00' AS limite", cambio: "timestamptz '2026-10-29 19:30:00+00' AS limite" },
    { nombre: 'documentos de cualquier organización', ancla: 'JOIN public.documents d ON d.org_id = (SELECT org FROM parametros) AND d.name LIKE', cambio: 'JOIN public.documents d ON true AND d.name LIKE' },
    { nombre: 'el código en cualquier parte del nombre', ancla: "d.name LIKE pe.codigo || '%'", cambio: "d.name LIKE '%' || pe.codigo || '%'" },
    { nombre: 'sin la generación activa por defecto', ancla: 'coalesce(d.active_generation, 1) AS generacion', cambio: 'd.active_generation AS generacion' },
    { nombre: 'dos documentos para un código se aceptan', ancla: 'JOIN cuenta k ON k.codigo = c.codigo AND k.n = 1', cambio: 'JOIN cuenta k ON k.codigo = c.codigo' },
    { nombre: 'el trozo de cualquier organización', ancla: 'JOIN public.document_chunks ch ON ch.document_id = u.id AND ch.org_id = (SELECT org FROM parametros)', cambio: 'JOIN public.document_chunks ch ON ch.document_id = u.id' },
    { nombre: 'el trozo de cualquier generación', ancla: '                                AND ch.generation = u.generacion AND ch.chunk_index = pe.trozo', cambio: '                                AND ch.chunk_index = pe.trozo' },
    { nombre: 'cualquier trozo del documento', ancla: ' AND ch.chunk_index = pe.trozo', cambio: '' },
    { nombre: 'la frase no se mira', ancla: "              WHEN NOT t.con_frase\n", cambio: "              WHEN false\n" },
    { nombre: 'la fecha del trozo no se mira', ancla: 'WHEN t.created_at < p.limite AND u.updated_at < p.limite', cambio: 'WHEN u.updated_at < p.limite' },
    { nombre: 'la fecha del documento no se mira', ancla: 'WHEN t.created_at < p.limite AND u.updated_at < p.limite', cambio: 'WHEN t.created_at < p.limite' },
    { nombre: 'el límite incluido en el trozo', ancla: 'WHEN t.created_at < p.limite AND u.updated_at < p.limite', cambio: 'WHEN t.created_at <= p.limite AND u.updated_at < p.limite' },
    { nombre: 'el límite incluido en el documento', ancla: 'WHEN t.created_at < p.limite AND u.updated_at < p.limite', cambio: 'WHEN t.created_at < p.limite AND u.updated_at <= p.limite' },
    { nombre: 'un documento sin fecha cuenta como no tocado', ancla: 'WHEN t.created_at < p.limite AND u.updated_at < p.limite', cambio: 'WHEN t.created_at < p.limite AND coalesce(u.updated_at, p.limite - interval \'1 day\') < p.limite' },
    { nombre: 'el motivo no dice que el documento no tiene fecha', ancla: "CASE WHEN u.updated_at IS NULL THEN 'el documento no tiene fecha de última modificación'\n                             WHEN", cambio: 'CASE WHEN' },
    { nombre: 'las generaciones de cualquier organización', ancla: 'FROM public.document_chunks WHERE org_id = (SELECT org FROM parametros)', cambio: 'FROM public.document_chunks' },
    { nombre: 'sin la versión en espera', ancla: 'FROM unico u JOIN public.document_staged s ON s.document_id = u.id', cambio: 'FROM unico u JOIN public.document_staged s ON false' },
    { nombre: 'la huella no es del texto', ancla: 'md5(ch.text) AS huella', cambio: 'md5(ch.chunk_index::text) AS huella' },
  ],
};
