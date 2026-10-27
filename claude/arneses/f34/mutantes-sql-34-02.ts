import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_02. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-02.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_02_el_material_del_diagnostico_de_d.sql',
  arnes: 'claude/arneses/f34',
  proyecto: 'arneses',
  tests: 16,
  mutantes: [
    { nombre: 'la resolución no exige UNA pertenencia', ancla: '         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org', cambio: '         min(m.org_id::text) AS org' },
    { nombre: 'la organización leída deja de ir primera', ancla: "ORDER BY (bloque <> 'organización leída'), bloque,", cambio: 'ORDER BY bloque,' },
    { nombre: 'sin la ventana', ancla: 'AND ar.created_at >= p.desde AND ar.created_at < p.hasta', cambio: 'AND true' },
    { nombre: 'el control de la ventana no mira', ancla: '         p.desde IS NOT NULL AND p.hasta IS NOT NULL', cambio: '         true' },
    { nombre: 'el control del esperado no mira', ancla: 'ELSE (SELECT count(*) FROM pasadas) = p.esperado_nor10 END', cambio: 'ELSE true END' },
    { nombre: 'pasadas de cualquier organización', ancla: "WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'", cambio: "WHERE true AND ar.document_name ILIKE 'NOR-10%'" },
    { nombre: 'pasadas de cualquier documento', ancla: "WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'", cambio: 'WHERE ar.org_id = p.org' },
    { nombre: 'la contradicción, por el lado nuevo', ancla: "d->>'existingDocSays' AS cita", cambio: "d->>'newDocSays' AS cita" },
    { nombre: 'el solapamiento, por el lado nuevo', ancla: "o->>'evidence'", cambio: "o->>'evidenceInNewDoc'" },
    { nombre: 'el descarte de la puerta, por el lado nuevo', ancla: "x->>'tema', x->>'citaExistente'", cambio: "x->>'tema', x->>'citaNuevo'" },
    { nombre: 'la cita sin quitar tildes', ancla: "(SELECT translate(lower(regexp_replace(coalesce(c.cita, ''), '\\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal)", cambio: "(SELECT lower(regexp_replace(coalesce(c.cita, ''), '\\s+', ' ', 'g')) AS normal)" },
    { nombre: 'la cita sin juntar los espacios', ancla: "(SELECT translate(lower(regexp_replace(coalesce(c.cita, ''), '\\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal)", cambio: "(SELECT translate(lower(coalesce(c.cita, '')), 'áéíóúü', 'aeiouu') AS normal)" },
    { nombre: 'sin el mínimo de 20 caracteres en §3.5', ancla: 'length(k.normal) >= 20 AND position(k.normal IN t.p35) > 0 AS de35', cambio: 'position(k.normal IN t.p35) > 0 AS de35' },
    { nombre: '§3.1 contado contra §3.5', ancla: 'length(k.normal) >= 20 AND position(k.normal IN t.p31) > 0 AS de31', cambio: 'length(k.normal) >= 20 AND position(k.normal IN t.p35) > 0 AS de31' },
    { nombre: 'la frase del principio, sólo si la cita empieza dentro', ancla: 'position(k.normal IN t.p31) + length(k.normal) - 1 >= tr.ini AS del_principio', cambio: 'position(k.normal IN t.p31) >= tr.ini AS del_principio' },
    { nombre: 'la frase del principio, mal copiada', ancla: "translate(lower('Esta asignación responde a un criterio", cambio: "translate(lower('Esa asignación responde a un criterio" },
    { nombre: 'el control de citas no mira', ancla: 'ELSE (SELECT count(*) FROM citas) > 0 END', cambio: 'ELSE true END' },
    { nombre: 'los contadores no se leen', ancla: "THEN pa.analysis->'discardedFindings' ELSE '{}'::jsonb END", cambio: "THEN '{}'::jsonb ELSE '{}'::jsonb END" },
    { nombre: 'DENTRO sin exigir los documentos enteros', ancla: "\n                   AND (l->'analizado'->>'mostrados') = (l->'analizado'->>'caracteres') AND (l->'candidato'->>'mostrados') = (l->'candidato'->>'caracteres')", cambio: '' },
    { nombre: 'el final de §2.4 en cero', ancla: '4267 AS fin_24', cambio: '0 AS fin_24' },
    { nombre: 'el final de §3.5 en cero', ancla: '6991 AS fin_35', cambio: '0 AS fin_35' },
  ],
};
