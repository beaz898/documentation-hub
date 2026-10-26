# Histórico de generadores de mutantes

*Archivado el 26/10/2026 (arquitecto: «si el scratchpad se va, se va la prueba de cómo medimos»).*

Hasta el 26/10 cada medición improvisaba su generador de mutantes en la carpeta temporal de la sesión, y esas carpetas
se vacían solas: las de las sesiones del 16/09, 25/09 y 27/09 ya estaban vacías el 26/10. Aquí está todo lo que se
pudo recuperar, **tal cual se ejecutó**, con la extensión `.txt` añadida para que nadie lo lance por accidente:
varios escriben en ficheros del repositorio y algunos lo hacen sin comprobar antes el ancla. Desde el 26/10 los
mutantes se escriben como definiciones y se lanzan con `claude/herramientas/mutar-cli.mts`.

## De dónde sale cada carpeta

- **`sesion-2026-08-29_a_09-07/`**: los 23 generadores `mutar*.cjs` de la sesión `63cfd963`, sacados de su
  transcripción con `recuperar_generadores.cjs.txt`, **todas las versiones escritas** (`.v1`, `.v2`…). Lo que se
  hiciera después con `node -e` no queda en la transcripción como fichero y no está aquí.
- **`sesion-2026-10-20_a_10-26/`**: los 19 generadores de la sesión `914469ea`. Los 18 que seguían en disco se copian
  del disco, porque reflejan también las ediciones hechas desde el shell; `mutantes_f128.cjs` ya no estaba en disco y
  sale de la transcripción (escrito el 20/10 a las 09:12 UTC).

## El censo del 26/10: mutantes cuyo cambio contiene a su ancla

El comando: `censo_del_ancla_dentro_del_cambio.cjs.txt` (se renombra a `.cjs` y se lanza con la carpeta y los
ficheros). Corre cada generador en un entorno aislado donde escribir en disco o lanzar un proceso lo detiene, lee su
lista de mutantes y mira si algún cambio contiene a su ancla.

**336 pares analizados** (187 de la sesión de octubre y 149 de la de agosto-septiembre, contando todas las versiones),
**6 con el defecto**, y **ninguno sostiene una conclusión falsa**:

| Generador | Mutante | Resultado entonces |
|---|---|---|
| `mutantes_311` | la etiqueta viaja a la API | ROJO, 1 fallo de 35 y de 37 |
| `mutantes_sujeto` | la excepción, ANTES del ejemplo de F-126 | ROJO, 3 fallos de 9 |
| `mutantes_esc` | también se vacía purged_at | ROJO, 3 fallos de 5 (reescrito el 26/10 en la definición) |
| `mutar-f88` y `mutar-f88b` | M1, el bucle se queda con el primer emparejamiento | ROJO, 3 fallos, compilando |
| `mutar-f88` | M4, los pares se cuentan pero no se devuelven | **no compilaba** y dio 10 de 10 en verde. Se vio el 30/08 («no probaba nada») y se reescribió en `mutar-f88b` como «se devuelve la lista vacía», que cayó con 7 casos |

**POR QUÉ UN ROJO VALE AUNQUE EL CAMBIO CONTENGA AL ANCLA**: un mutante que no se aplica deja el árbol igual que el
original, que pasa en verde. Así que un rojo no puede venir de un mutante sin aplicar. El defecto sólo engaña cuando
el mutante sale VIVO: entonces no se sabe si sobrevivió o si nunca se aplicó. Ninguno de los seis salió vivo por ese
motivo. ⚠️ Corrige a Code: el 26/10 escribió que el de `esc` «salía rojo sin distinguirse de no aplicarlo», y era
falso.

Lo que el censo no cubre: las mutaciones hechas con `node -e` sin fichero, y las sesiones cuyo generador no llevaba
«mutant» ni «mutar» en el nombre.
