import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_01. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-01.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_01_la_tanda_del_conflicto_normativo.sql',
  arnes: 'claude/arneses/f34',
  proyecto: 'arneses',
  tests: 22,
  mutantes: [
    { nombre: 'la resolución no exige UNA pertenencia', ancla: '         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org', cambio: '         min(m.org_id::text) AS org' },
    { nombre: 'la organización leída deja de ir primera', ancla: "ORDER BY (bloque <> 'organización leída'), bloque,", cambio: 'ORDER BY bloque,' },
    { nombre: 'sin la ventana', ancla: 'AND ar.created_at >= p.desde AND ar.created_at < p.hasta', cambio: 'AND true' },
    { nombre: 'pasadas de cualquier organización', ancla: "WHERE ar.org_id = p.org AND (ar.document_name ILIKE 'NOR-10%'", cambio: "WHERE true AND (ar.document_name ILIKE 'NOR-10%'" },
    { nombre: 'la especie ausente no dice «sin especie»', ancla: "coalesce(nullif(pu.especie, ''), 'sin especie')", cambio: "coalesce(pu.especie, '')" },
    { nombre: 'el criterio de abandono en 8 y no en 7', ancla: "AND pu.candidato ILIKE 'CLI-12%') > 7", cambio: "AND pu.candidato ILIKE 'CLI-12%') > 8" },
    { nombre: 'un contador ausente sale como 0 sin decirlo', ancla: "'0 (ausente)'", cambio: "'0'" },
    { nombre: 'el desglose deja pasar cualquier descarte', ancla: "FROM contadores co WHERE co.clave LIKE 'descartado.%.norma_contra_%'", cambio: "FROM contadores co WHERE co.clave LIKE 'descartado.%'" },
    { nombre: 'la coincidencia con la palabra en una sola cita', ancla: "            AND translate(lower(pu.cita_nuevo), 'áéíóúü', 'aeiouu') LIKE '%' || ci.palabra || '%'\n", cambio: '' },
    { nombre: 'el control del modo rápido no mira', ancla: "ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END", cambio: 'ELSE true END' },
    { nombre: 'el control del registro no mira', ancla: "ELSE (SELECT count(*) FROM pasadas WHERE jsonb_typeof(analysis->'llamadasAlModelo') IS DISTINCT FROM 'object') = 0 END", cambio: 'ELSE true END' },
    { nombre: 'los tokens sin la caché', ancla: '(pe.te + pe.tw + pe.tr)', cambio: '(pe.te)' },
    { nombre: 'los marcados descartados no cuentan como llegados', ancla: "coalesce((SELECT sum(co.valor) FROM contadores co WHERE co.doc = pa.doc AND co.n = pa.n AND co.clave LIKE 'descartado.%.norma_contra_%'), 0)", cambio: '0' },
    { nombre: 'las llamadas de cualquier etapa como del juez', ancla: "WHERE pe.etapa = 'juez'", cambio: 'WHERE true' },
  ],
};
