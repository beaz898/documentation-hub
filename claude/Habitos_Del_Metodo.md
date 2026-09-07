# Hábitos del método — lo que falla en cómo trabajo, contado

**Abierto el 07/09/2026.** No es una lista de fallos del sistema: es de fallos
**míos** que se repiten. Existe porque un fallo que se repite deja de ser un
descuido y pasa a ser un hábito, y un hábito se corrige con una regla — pero
**solo cuando hay casos suficientes para saber cuál**.

⚠️ **El criterio para promover una entrada de aquí a `CLAUDE.md`: tres casos
distintos, con fecha, y al menos uno que costara algo.** Antes de eso es una
sospecha, y una regla escrita sobre una sospecha es peor que ninguna: la casa se
llena de avisos que nadie ejerce.

---

# 1 · LA PREDICCIÓN DE POBLACIÓN — la quinta pieza, que es la que se me olvida

**Estado: SEIS FALLOS, y una vez sin escribirla.**

La predicción tiene cinco piezas —predicado, universos, casos a cada lado,
comportamiento en vacío y **población**— y las cuatro primeras las escribo
siempre. La quinta no.

| fecha | predicho | real | cómo falló |
|---|---|---|---|
| varias, 03–06/09 | — | — | cuatro fallos altos, dos aciertos |
| 07/09 · el lote | 12-16 casos nuevos | **19** | corta |
| 07/09 · B.195 | 630-645 | **622** | larga, y **alta a propósito por haberme quedado corto la vez anterior** |
| 07/09 · el catálogo | **no la escribí** | 628 | ⚠️ no se puede decir si habría acertado |
| 07/09 · los denominadores | 640-650 | **640** | ✅ acertada, por el borde |

**LO QUE ENSEÑA EL PATRÓN, y no es «calcula mejor»:** estimo la POBLACIÓN mucho
peor que el COMPORTAMIENTO. Las predicciones de conducta —qué caso se pone rojo,
qué mutación muere— llevan una racha larga de acertar; las de cuántos casos van a
salir, no. Y la corrección instintiva —«ayer me quedé corto, hoy tiro alto»— es
exactamente cómo se falla al otro lado, que es lo que pasó con B.195.

**LO QUE SE HACE MIENTRAS TANTO:** escribirla igual. Su valor no es acertar — es
que **fallarla obliga a mirar por qué salieron más casos de los que pensaba**, y
esa pregunta ha destapado cosas (un `it.each` sin contar, una batería que crecía
sola). Una predicción que no se escribe no puede fallar, y por eso no enseña
nada.

---

# 2 · ⚠️ LA GUARDA QUE SOBREVIVE A LA MUTACIÓN ES LA QUE NO TIENE CASO QUE LA EJERZA

⚠️ **EL ENUNCIADO SE AFINÓ EL 07/09, y la corrección importa.** Se abrió como «la
guarda preventiva es un hábito que produce código muerto», y eso acusa al hábito
equivocado: el problema no es escribir guardas —una que se dispara es lo que
impide un fallo— sino escribir una **que ninguna entrada puede hacer saltar**. La
mutación no dice «esto sobra por preventivo»: dice **«esto no tiene caso»**, que
es una propiedad comprobable en vez de un juicio sobre la intención.

**Estado: DOS CASOS, los dos del 07/09. Falta uno para ser regla.**

| caso | la guarda | qué pasó |
|---|---|---|
| `arranqueEnFrontera` | `if (desde <= 0 \|\| desde >= hasta) return desde;` | **las dos mitades sobrevivieron** a la batería, cada una por su razón: una inalcanzable, la otra sin diferencia observable |
| `versionDelCatalogo` | el ternario del catálogo vacío | **sobrevivió**: el bucle ya devolvía lo mismo |

Las dos las escribí yo, el mismo día, «por si acaso». Ninguna podía dispararse.
Y las dos veces **lo destapó una mutación, no una revisión** — leyéndolas parecen
razonables, que es justo lo que las hace duraderas.

## Lo que habría que comprobar antes de convertirlo en regla

· **¿Es un hábito o son dos casualidades?** Dos casos en un día, en el mismo tipo
  de trabajo (funciones puras nuevas con aritmética de índices). Puede ser el
  contexto y no el hábito.
· **La regla candidata, ya afinada:** **«toda guarda nace con el caso que la
  dispara, o no nace»**. Si no se puede escribir la entrada que la hace saltar,
  la guarda no tiene por qué existir — y el que no se pueda escribir es un hecho
  que se comprueba, no una opinión sobre si era preventiva.
· **⚠️ Y el riesgo de aplicarla de más**, que es lo que obliga a esperar al tercer
  caso: hay guardas cuyo caso NO se puede escribir hoy y que aun así deben estar
  —las que protegen de datos que solo un cliente real puede producir—. Esta casa
  ya tiene contadores así (`rechazadas_por_escritura`, cero en el corpus por
  construcción). Una regla mal recortada los borraría.

**Se anota, no se promueve. El tercer caso decide.**
