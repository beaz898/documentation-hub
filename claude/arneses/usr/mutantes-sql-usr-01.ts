import type { Definicion } from '../../herramientas/mutar';

// Los mutantes de SQL_USR_01. Se lanzan con: node claude/herramientas/mutar-cli.mts claude/arneses/usr/mutantes-sql-usr-01.ts
export const definicion: Definicion = {
  fichero: 'SQL_USR_01_quien_es_3c628122.sql',
  arnes: 'claude/arneses/usr',
  proyecto: 'arneses',
  tests: 2,
  mutantes: [
    { nombre: 'el que no existe sale vacío', ancla: 'FROM u LEFT JOIN auth.users au ON au.id = u.id;', cambio: 'FROM u JOIN auth.users au ON au.id = u.id;' },
    { nombre: 'sale el usuario de cualquiera', ancla: 'LEFT JOIN auth.users au ON au.id = u.id;', cambio: 'LEFT JOIN auth.users au ON true;' },
    { nombre: 'la última sesión es el alta', ancla: "to_char(au.last_sign_in_at AT TIME ZONE 'Europe/Madrid'", cambio: "to_char(au.created_at AT TIME ZONE 'Europe/Madrid'" },
    { nombre: 'la hora sin pasar a Madrid', ancla: "to_char(au.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS alta", cambio: "to_char(au.created_at, 'DD/MM/YYYY HH24:MI') AS alta" },
  ],
};
