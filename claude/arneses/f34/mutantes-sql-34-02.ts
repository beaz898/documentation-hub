import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_34_02. node claude/herramientas/mutar-cli.mts claude/arneses/f34/mutantes-sql-34-02.ts
export const definicion: Definicion = {
  fichero: 'SQL_34_02_el_material_del_diagnostico_de_d.sql',
  arnes: 'claude/arneses/f34',
  proyecto: 'arneses',
  tests: 15,
  mutantes: [
    { nombre: 'la resolución no exige UNA pertenencia', ancla: '         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org', cambio: '         min(m.org_id::text) AS org' },
    { nombre: 'la organización leída deja de ir primera', ancla: "ORDER BY (bloque <> 'organización leída'), bloque,", cambio: 'ORDER BY bloque,' },
    { nombre: 'sin la ventana', ancla: 'AND ar.created_at >= p.desde AND ar.created_at < p.hasta', cambio: 'AND true' },
    { nombre: 'pasadas de cualquier organización', ancla: "WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'", cambio: "WHERE true AND ar.document_name ILIKE 'NOR-10%'" },
    { nombre: 'pasadas de cualquier documento', ancla: "WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'", cambio: 'WHERE ar.org_id = p.org' },
    { nombre: 'la contradicción, por el lado nuevo', ancla: "d->>'existingDocSays' AS cita", cambio: "d->>'newDocSays' AS cita" },
    { nombre: 'el solapamiento, por el lado nuevo', ancla: "o->>'evidence'", cambio: "o->>'evidenceInNewDoc'" },
    { nombre: 'el descarte de la puerta, por el lado nuevo', ancla: "x->>'tema', x->>'citaExistente'", cambio: "x->>'tema', x->>'citaNuevo'" },
    { nombre: 'la cita sin normalizar', ancla: "position(translate(lower(c.cita), 'áéíóúü', 'aeiouu') IN p.parrafo_35)", cambio: 'position(c.cita IN p.parrafo_35)' },
    { nombre: 'sin el mínimo de 20 caracteres', ancla: "length(coalesce(c.cita, '')) >= 20", cambio: 'true' },
    { nombre: 'el control 2 no mira', ancla: 'ELSE (SELECT count(*) FROM citas) > 0 END', cambio: 'ELSE true END' },
    { nombre: 'los contadores no se leen', ancla: "THEN pa.analysis->'discardedFindings' ELSE '{}'::jsonb END", cambio: "THEN '{}'::jsonb ELSE '{}'::jsonb END" },
    { nombre: 'DENTRO sin exigir los documentos enteros', ancla: "\n                   AND (l->'analizado'->>'mostrados') = (l->'analizado'->>'caracteres') AND (l->'candidato'->>'mostrados') = (l->'candidato'->>'caracteres')", cambio: '' },
    { nombre: 'el final de §2.4 en cero', ancla: '4267 AS fin_24', cambio: '0 AS fin_24' },
    { nombre: 'el final de §3.5 en cero', ancla: '6991 AS fin_35', cambio: '0 AS fin_35' },
  ],
};
