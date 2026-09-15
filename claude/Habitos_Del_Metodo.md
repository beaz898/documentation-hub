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

⚠️ **11/09/2026 — UNA TERCERA ESPECIE, Y LA FALLÉ: LA PREDICCIÓN SOBRE UN
LECTOR.**

| fecha | predicho | real | cómo falló |
|---|---|---|---|
| 11/09 · el ancho del editor | ~95-99 caracteres por línea **incomodarían**; haría falta tope de columna | **se lee bien** | de plano, y con una medición correcta detrás |

**Lo que hace que esta valga la pena guardar es que la MEDIDA no estaba mal.** El
cálculo era bueno —~643 px de texto a 13 px de Inter son ~95-99 caracteres— y la
banda que cité es la que cita toda la tipografía: 45-75, óptimo en 66. Lo que
falló fue **deducir una experiencia a partir de un número correcto y una norma
correcta**.

La hipótesis de por qué, y va como hipótesis: la banda de 45-75 describe **prosa
continua**, y esto es un documento que se revisa A SALTOS, buscando el fragmento
que el panel de al lado señala. Nadie lo ha medido; puede ser otra cosa.

⚠️ **Y LA LECCIÓN NO ES «MIDE MEJOR», porque la medida estaba bien: es que una
norma de diseño no es un dato sobre TU usuario.** Las dos especies que ya estaban
aquí —población y comportamiento— se comprueban contra el código. Ésta solo se
comprueba enseñándosela a alguien, y **eso cuesta un minuto y yo no lo pedí: lo
deduje**. La regla operativa que saco: cuando una predicción sea sobre lo que
alguien va a SENTIR, no se escribe como conclusión sino como pregunta, y se
pregunta antes de proponer el arreglo.

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

---

# EL BALANCE DE LA SEMANA — 15/09/2026

**TRES datos sin verificar del arquitecto se convirtieron en investigación. Los
tres los paró una medición, y ninguno llegó al código.** Se cuentan aquí porque
una racha que no se cuenta se recuerda como «alguna vez pasó».

| # | lo que se afirmó | qué lo falsificó | qué costó |
|---|---|---|---|
| 1 | «el reemplazo deja los vectores VIEJOS» | los hashes se comparan antes de reindexar | una lectura |
| 2 | «los vectores huérfanos son el residuo benigno» **y se ordenó invertir un borrado sobre eso** | `rag.ts:336-370` los reconstruye y los cita | **la orden no se ejecutó**; el arreglo real era otro |
| 3 | «sólo intentó conectar Drive» → se montó un caso de pérdida de trabajo | sólo hay un camino que borra así, y pide confirmación | **el director paró sin necesidad** |

⚠️ **LOS TRES TIENEN LA MISMA FORMA, Y NO ES LA QUE PARECE.** No son errores de
juicio: son **premisas sobre el objeto emitidas sin mirarlo**. La 2 ya está
promovida a regla —los juicios de inocuidad son universales sobre consumidores—;
la 3 enseña su hermana **más barata de todas**:

> **Antes de investigar qué salió mal, preguntar qué se hizo.** El tercer caso se
> resolvía con una pregunta al director —«¿desconectaste antes?»— y en su lugar
> se escribió una hipótesis de pérdida de datos. La medición la desmontó, pero la
> pregunta habría costado un mensaje.

**Y la mitad que funcionó, que es la que hay que conservar**: las tres veces la
regla del indicativo hizo su trabajo en el lado de quien tiene el repositorio —
verificar antes de actuar—. El sistema no depende de que nadie se equivoque:
depende de que **las afirmaciones sin evidencia no tengan por dónde circular**.

---

# ⚠️ 15/09/2026 · EL CASO MÁS CARO DE LA SEMANA: EVIDENCIA REAL LEÍDA DE MÁS

Los tres fallos anteriores de la semana fueron **premisas sin verificar**. Éste no:
**el dato era real y estaba bien medido**. Lo que falló fue la inferencia.

**Cinco pasadas de análisis de estilo dieron 8. Las leímos como ESTABILIDAD**, y
sobre esa lectura se concluyó que el 7 de la otra puerta era una anomalía y que
las dos puertas coincidían. **Cuatro pasadas más dieron 9 · 7 · 8 · 7.** El rango
normal era 7–9; los cinco ochos fueron suerte.

**LA REGLA QUE YA LO CUBRÍA, y por eso duele:** *un cero sólo vale si el sistema
puede demostrar que buscó*. Aquí no era un cero, era una **constancia** — y
necesita exactamente el mismo control: **el control positivo de la estabilidad es
una pasada que dé otra cosa.** No se buscó. Se tomaron cinco muestras iguales y se
llamó mecanismo a lo que era una racha.

> **Una repetición sin varianza observada no demuestra estabilidad: demuestra que
> aún no se ha visto variar.** Antes de llamar estable a algo, hay que poder decir
> cuántas veces se miró y qué haría falta para verlo moverse.

⚠️ **Y SU COROLARIO OPERATIVO, que es lo accionable**: comparar dos caminos por un
AGREGADO —un recuento— exige conocer su dispersión primero, y eso suele costar
decenas de muestras. **Comparar los ELEMENTOS cuesta tres o cuatro.** Cuando un
sistema guarda el número y tira el contenido, obliga al método caro y encima
inconcluyente — que es por qué «se guarda el recuento y no el detalle» no es una
carencia de registro: **es una carencia de instrumento**.
