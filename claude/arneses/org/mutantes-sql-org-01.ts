import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_ORG_01. Se lanzan con: node claude/herramientas/mutar-cli.mts claude/arneses/org/mutantes-sql-org-01.ts
export const definicion: Definicion = {
  fichero: 'SQL_ORG_01_las_organizaciones_del_director.sql',
  arnes: 'claude/arneses/org',
  proyecto: 'arneses',
  tests: 4,
  mutantes: [
    { nombre: 'el correo guardado sin pasar a minúsculas', ancla: 'WHERE lower(au.email) = p.correo', cambio: 'WHERE au.email = p.correo' },
    { nombre: 'la constante sin trim', ancla: "lower(trim('')) AS correo", cambio: "lower('') AS correo" },
    { nombre: 'las pertenencias de todos los usuarios', ancla: 'JOIN public.memberships m ON m.user_id = u.id', cambio: 'JOIN public.memberships m ON true' },
    { nombre: 'la suscripción al revés', ancla: '(o.stripe_subscription_id IS NOT NULL) AS suscripcion_de_stripe_guardada', cambio: '(o.stripe_subscription_id IS NULL) AS suscripcion_de_stripe_guardada' },
    { nombre: 'los créditos extra en lugar de los del plan', ancla: 'o.credits_remaining AS creditos, o.credits_extra AS creditos_extra', cambio: 'o.credits_extra AS creditos, o.credits_extra AS creditos_extra' },
    { nombre: 'el vacío sale vacío', ancla: 'WHERE NOT EXISTS (SELECT 1 FROM filas)', cambio: 'WHERE false' },
    { nombre: 'sin usuario se confunde con sin pertenencias', ancla: "CASE WHEN (SELECT count(*) FROM u) = 0 THEN 'NINGÚN USUARIO con ese correo'", cambio: "CASE WHEN (SELECT count(*) FROM u) > 0 THEN 'NINGÚN USUARIO con ese correo'" },
    { nombre: 'la fecha de purga no sale', ancla: "to_char(purgada AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS purgada", cambio: 'NULL AS purgada' },
  ],
};
