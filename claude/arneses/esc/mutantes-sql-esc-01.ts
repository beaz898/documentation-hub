import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_ESC_01 (archivada sin ejecutar). Se lanzan con:
// node claude/herramientas/mutar-cli.mts claude/arneses/esc/mutantes-sql-esc-01.ts
export const definicion: Definicion = {
  fichero: 'SQL_ESC_01_volver_a_la_organizacion_del_piloto.sql',
  arnes: 'claude/arneses/esc',
  proyecto: 'arneses',
  tests: 5,
  mutantes: [
    { nombre: 'la membresía se mueve sin mirar las guardas', ancla: 'WHERE ok.todo AND t.id = (SELECT id FROM m)', cambio: 'WHERE t.id = (SELECT id FROM m)' },
    { nombre: 'la organización se reactiva sin mirar las guardas', ancla: 'WHERE ok.todo AND t.id = p.org', cambio: 'WHERE t.id = p.org' },
    { nombre: 'se mueven TODAS las membresías', ancla: 'WHERE ok.todo AND t.id = (SELECT id FROM m)', cambio: 'WHERE ok.todo' },
    { nombre: 'se reactivan TODAS las organizaciones', ancla: 'WHERE ok.todo AND t.id = p.org', cambio: 'WHERE ok.todo' },
    // la columna va EN MEDIO: añadida al final, el cambio contendría al ancla y no se distinguiría de no aplicarlo
    { nombre: 'también se vacía purged_at', ancla: 'SET canceled_at = NULL, grace_period_ends_at = NULL', cambio: 'SET canceled_at = NULL, purged_at = NULL, grace_period_ends_at = NULL' },
    { nombre: 'se vacía sólo la cancelación y no la gracia', ancla: 'SET canceled_at = NULL, grace_period_ends_at = NULL', cambio: 'SET canceled_at = NULL' },
    { nombre: 'guarda: una membresía o más', ancla: '(SELECT count(*) FROM m) = 1 AS una_membresia', cambio: '(SELECT count(*) FROM m) >= 1 AS una_membresia' },
    { nombre: 'guarda: no mira los documentos de la nueva', ancla: 'NOT EXISTS (SELECT 1 FROM public.documents d JOIN m ON d.org_id = m.org_id::text) AS la_nueva_sin_documentos', cambio: 'true AS la_nueva_sin_documentos' },
    { nombre: 'guarda: no mira purged_at', ancla: 'EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = p.org AND o.purged_at IS NOT NULL) AS piloto_purgado', cambio: 'true AS piloto_purgado' },
    { nombre: 'guarda: no mira los miembros del piloto', ancla: 'NOT EXISTS (SELECT 1 FROM public.memberships mm WHERE mm.org_id = p.org) AS piloto_sin_miembros', cambio: 'true AS piloto_sin_miembros' },
    { nombre: 'guarda: no mira si ya es del piloto', ancla: 'NOT EXISTS (SELECT 1 FROM m WHERE m.org_id = p.org) AS no_es_ya_el_piloto', cambio: 'true AS no_es_ya_el_piloto' },
    { nombre: 'guarda: no exige un único usuario', ancla: '(SELECT count(*) FROM u) = 1 AS un_usuario', cambio: '(SELECT count(*) FROM u) <= 1 AS un_usuario' },
    { nombre: 'estado: el aviso del worker no mira purged_at', ancla: "CASE WHEN o.grace_period_ends_at < now() AND o.purged_at IS NULL THEN '⚠️ SÍ, EN MENOS DE SEIS HORAS'", cambio: "CASE WHEN o.grace_period_ends_at < now() THEN '⚠️ SÍ, EN MENOS DE SEIS HORAS'" },
    { nombre: 'estado: el aviso del cobro al revés', ancla: "CASE WHEN o.canceled_at IS NOT NULL AND o.grace_period_ends_at < now() THEN 'SÍ'", cambio: "CASE WHEN o.canceled_at IS NOT NULL AND o.grace_period_ends_at > now() THEN 'SÍ'" },
  ],
};
