# Contrato de contadores de pipeline (F-82)

*Escrito el 28/08/2026, **antes** del `ALTER TABLE` que crea el campo y antes de
que ningún contador se persista.*

---

## 0. Por qué este fichero existe, y por qué existe ANTES que la columna

La condición 3 de la regla de entrada (`Protocolo_Harness_Tasas.md`, §regla de
entrada) exige que **todo cambio deje contador en producción**. B.110 dice que
esos contadores **no tienen hoy dónde volcarse**. Este fichero es el contrato
del sitio donde van a volcarse, y se escribe antes de crearlo por un motivo que
no es ceremonia:

> Lo que hizo nacer mal a `discardedFindings` **no fue construir poco: fue
> construir SIN CONTRATO.** Un cajón que aceptaba cualquier cosa bajo un nombre
> que prometía otra. El contrato es barato; el sistema grande es caro. Se
> escribe el contrato, se construye lo mínimo. *(Fable, F-82.)*

Y el orden importa por algo concreto: la **cláusula 5** cambia lo que el diff de
tablas puede emitir. Escrita después del código, ya habría en `main` una fase 2
que la incumple — que es exactamente cómo empezó `discardedFindings`:
construyendo primero y nombrando después.

Este fichero es del mismo tipo que `Descarte_Filas_Ajenas.md`: una
especificación de código, escrita antes de tocarlo. No va dentro del protocolo
porque aquel es el método de las **tandas** —cómo se mide con modelos— y esto es
un contrato para el **código de producción**, con otro público y otra vida. El
protocolo remite aquí desde la condición 3, que es quien lo exige.

---

## 1. EL DIAGNÓSTICO, porque es el que explica las cláusulas

`DiscardedFindings` es `Record<string, number>` y se llama «descartados». Dentro
tiene hoy `confirmado.por_estructura`, `confirmado.por_juicio`,
`verificado.por_localizacion` y `verificado.por_celdas` — cuatro cosas que **no
se descartaron**. El pendiente del renombrado lleva abierto desde la sesión 47
(24/08) por esto.

**La pregunta que importa no es cómo se llaman, sino cómo llegaron ahí.** Y la
respuesta está en dos líneas:

```ts
// pipeline.ts:419
for (const [key, n] of Object.entries(counts)) mergedDiscarded[key] = (mergedDiscarded[key] ?? 0) + n;
// synthesize.ts:231
for (const [reason, count] of Object.entries(j.discarded)) discardedFindings[reason] = ... + count;
```

Dos fusiones **ciegas**. `verificado.por_celdas` no llegó a `discardedFindings`
porque alguien decidiera persistirlo ahí: llegó porque lo metieron en la misma
bolsa y **la bolsa se vuelca entera**. El destino de un contador lo decide el
CONTENEDOR, no su autor. Y el punto de entrada no pide nada:

```ts
// pipeline.ts:154
function bumpCount(counts: DiscardedFindings, key: string): void
```

`key: string`. Cualquier cadena. No hay un solo punto del recorrido donde
alguien tenga que declarar qué es lo que está contando.

**Consecuencia para el contrato**: tres de las cinco cláusulas regulan el
NOMBRE, el SIGNIFICADO y la LECTURA de un contador. Ninguna de las tres habría
impedido nada de lo anterior. Por eso hacen falta la 4 y la 5.

---

## 2. LAS CINCO CLÁUSULAS

### 1 — Prefijo de etapa y namespace en todo contador. Nada sin apellido.

Todo nombre lleva la etapa que lo emite: `diff.tablas.*`, `diff.clave.*`,
`diff.celdas.*`, `diff.clasificacion.*`, `seleccion.*`, `verificador.*`. Un
contador sin apellido no se sabe de quién es, y lo que no se sabe de quién es no
se puede retirar: para comprobar que `discardedFindings` no lo lee nadie hubo
que recorrer el repositorio entero.

**Abrir una etapa es una decisión, no el efecto de escribir una cadena.** La
lista de etapas vive en el tipo `Stage` de `lib/analysis/counters.ts` y está
CERRADA; ampliarla se hace ahí y se justifica aquí. Registro de las que se han
abierto después del contrato:

- **`diff.tablas` — abierta el 30/08/2026 (F-88 paso 1), con el emparejador de
  tablas.** Ninguna de las que había podía alojar sus contadores, y el motivo
  es de fronteras, no de gusto: `diff.clave` cuenta lo que decide el
  descubrimiento de clave DENTRO de un par de tablas ya elegido, `diff.celdas`
  compara celdas y `diff.clasificacion` reparte filas ya emparejadas. El par de
  TABLAS no tenía etapa porque hasta F-88 nadie elegía pares: la fase 1 recibía
  dos tablas ya escogidas y el repositorio no tenía quién las escogiera.
  La etapa nace con la pieza que la necesita.
  Sus cuatro contadores sostienen una invariante que su batería vigila:
  `candidatos === sin_clave + sin_interseccion + emitidos`. Es lo que hace
  cierta la regla de F-88 «todo lo demás se cuenta» — un par evaluado no puede
  desaparecer sin dejar rastro en exactamente uno de los tres destinos.

### 2 — Solo recuentos de decisión.

Un contador dice **cuántas veces se tomó un camino**. No dice qué se encontró
(eso es el resultado, y va en el hallazgo) ni que algo se rompió (eso es una
avería). **Las averías llevan su propio namespace** y no se mezclan con las
decisiones: un fallo de etapa contado junto a un descarte legítimo hace que la
suma no signifique nada, y esa suma es justo lo que alguien mirará dentro de
tres meses.

### 3 — Se leen por nombre, nunca por posición ni orden.

El orden de las claves de un jsonb no está garantizado —lo mismo que ya obligó a
`getOrderedColumns` (F-51)— y el conjunto de contadores crece. Ningún consumidor
puede depender de que un contador esté, de que esté en un sitio, ni de cuántos
hay.

### 4 — LA FUSIÓN SOLO TRANSPORTA LO DECLARADO.

Ésta es la que responde al diagnóstico de §1, y es la que faltaba.

> **Hoy lo predeterminado es «todo viaja». El contrato lo invierte: nada viaja
> si no se declaró.**

Existe **un catálogo único de nombres declarados**. La fusión entre etapas
transporta lo que está en el catálogo y **descarta —con aviso en el log— lo que
no**. Un contador nuevo se añade al catálogo primero y se emite después; al
revés no llega arriba, y esa es la garantía.

Y el prefijo de la cláusula 1 deja de ser convención: con **tipos de plantilla**
(`` `diff.clave.${string}` | `verificador.${string}` | … ``) un nombre sin
apellido **no compila**. Refuerza la cláusula 1 gratis, en tiempo de
compilación, que es donde una convención deja de depender de que alguien se
acuerde.

### 5 — LA CLAVE NUNCA LLEVA DATOS DEL CLIENTE.

El vocabulario de nombres es **cerrado y conocido, fijado en el código**. Lo
variable va en el VALOR, o se agrupa en cubos. Dos motivos, los dos concretos:

1. Un espacio de claves ilimitado hace el campo **inagregable entre
   organizaciones** — que es exactamente para lo que existe. «¿Cuántas veces
   actuó esta pieza en cincuenta clientes?» no se puede responder si cada
   cliente inventa sus propias claves.
2. Mete **contenido del cliente en telemetría**, algo que este proyecto ya
   vigila: `lib/agent/tools/usage-stats.ts:14` dice literalmente «Campos de
   analysis_results — sin texto de usuario».

**LA REGLA, EN UNA FRASE, para que no vuelva a dudarse:**

> **Las CLAVES de un contador son vocabulario cerrado del sistema. Los
> IDENTIFICADORES DE DATOS —nombres de columna, de documento, valores de
> celda— derivan del contenido del cliente y viven en el VALOR.**

Cuando dudes de dónde va algo, la pregunta es: *¿puedo sumar esto entre
cincuenta clientes sin conocer sus documentos?* Si la respuesta es no, es un
identificador de datos y su casa es el resultado del análisis, no
`pipeline_counters`.

**SU VÍCTIMA, DECLARADA Y RESUELTA:** `porColumna: Record<string, number>` de
`TableDiffCounts` (`lib/analysis/table-diff.ts`, commit `beaf075f`) incumplía
esta cláusula. Estaba indexado por **nombre de columna**, o sea por contenido
del documento del cliente.

**Resuelto en F-83 (28/08/2026)**, y el arreglo fue de **DOMICILIO, no de
formato**: el dato no se pierde ni cambia de forma, cambia de sitio. `porColumna`
sale de `counts` y pasa al nivel superior de `TableDiffResult` —el resultado de
ESE análisis, que es donde el contrato siempre dijo que va lo variable— y en
`pipeline_counters` queda lo agregable con vocabulario cerrado:
`diff.clasificacion.identicas`, `.discrepantes`, `.columnas_afectadas` (el
NÚMERO, no los nombres), `.solo_en_a` y `.solo_en_b`.

Nótese que `solo_en_a`/`solo_en_b` son **posicionales** —a es el documento
analizado, b el candidato— y no llevan el nombre ni el id de ningún documento:
la identidad de cada lado va en el valor del hallazgo. Es la misma regla
aplicada a un sitio donde apetecía saltársela.

**LA CORRECCIÓN DE UN DATO, para que el registro no mienta**: mientras estuvo
abierta, esta víctima se describió como si `porColumna` ya estuviera dentro de
`pipeline_counters`. No lo estaba: vivía en `TableDiffCounts`, una estructura de
la fase 2 que **no se persiste en ninguna parte** (ver B.110) y que nunca llegó
al catálogo. El incumplimiento era real pero **futuro** — se habría consumado el
día que la fase 3 conectara el diff, y se sanea antes de que eso ocurra, que es
lo que la nota original pedía.

---

## 2-bis. UNA CLASE APARTE: LOS CONTADORES CENTINELA (F-91)

*Añadida el 30/08/2026, cuando F-91 P2 le puso nombre a algo que el proyecto ya
tenía sin nombrar. **Con una corrección nuestra a su lista**, abajo.*

> **Un contador centinela vigila un INVARIANTE DECLARADO. Su valor esperado es
> cero, no porque se haya observado cero, sino porque hay una afirmación escrita
> que su movimiento REFUTARÍA. Leerlo a cero es leerlo funcionando; que se mueva
> es la noticia.**

**El invariante es lo que define la clase, NO el cero observado.** Es la
distinción que hay que tener clara antes de usar la palabra, y se ganó
corrigiendo la lista de F-91 (ver abajo): un contador puede llevar meses a cero
sin ser centinela — está a cero porque todavía no ha pasado, no porque no pueda
pasar. Confundir las dos cosas convierte «no lo hemos visto» en «no ocurre», que
es exactamente el error que este proyecto lleva un mes persiguiendo.

**Por qué la clase necesita estar escrita y no basta un comentario.** El cero de
un contador normal y el cero de un centinela **se escriben igual y significan lo
contrario**: en el primero dice «este camino no se recorre» —candidato a
retirar—; en el segundo dice «el supuesto aguanta», que es justo lo que se quería
saber. Sin la clase declarada, el segundo se lee como el primero y alguien lo
borra por código muerto. **Borrar un centinela es quitar la alarma, no limpiar el
panel.**

Y responde con el signo corregido a una duda que se planteó al revés: se preguntó
si una rama que casi nunca se activa merece contador propio. Sí — **un contador
que casi siempre vale cero no es un contador que falla: es un invariante
vigilado.**

### Los dos fundacionales

| Contador | Tipo | El invariante que vigila | Dónde vive hoy |
|---|---|---|---|
| `verificador.confirmados_por_estructura` | **CENTINELA PURO** — moverse **es** un bug | Desde F-91 P3 el juez no tiene NINGÚN camino al sello `'estructura'`: es exclusivo del diff. Si se mueve, alguien está firmando sin derecho | Catálogo (`lib/analysis/counters.ts`) |
| `r2.sin_ancla` | **CASI-CENTINELA** — puede moverse legítimamente, poco | Dos filas sin un solo valor compartido no exhiben identidad, y se descartan sin gastar modelo. Que ocurra es raro, no imposible | `DiscardedFindings` (`lib/analysis/pipeline.ts`) |

**La distinción puro/casi no es decorativa.** Un centinela puro que se mueve es un
fallo del sistema y se investiga. Un casi-centinela que se mueve es un caso raro
que ocurrió, y se anota. Confundirlos produce las dos averías simétricas:
perseguir un fantasma, o no perseguir nada.

### ⚠️ EL QUE NO ES: `narracionEnCita`, y por eso la clase se entiende

F-91 propuso **tres** fundacionales, y el tercero era `narracionEnCita` — «cero
descartes en 351 filas, en observación desde entonces». **Las dos mitades son
ciertas y la conclusión no.**

- La observación existe: `Bitacora_Sesiones.txt:4646`, verificada. Pero lo que
  dice es **una pregunta abierta**, no un invariante: *«sin dato nuevo todavía
  sobre si el patrón está muerto o llega en una forma que los tres regex no
  reconocen»*. Nadie afirmó nunca que el juez no narrara. **B.107 afirma lo
  contrario**, y es su pendiente.
- Y la pregunta **se contestó el 30/08**: en las dos pasadas rápidas de OPE-11 el
  juez escribió «No aparece EST-03 en el documento nuevo» donde iba una cita, el
  patrón lo cazó y **el contador se movió** — primera aparición de B.107 fuera
  del laboratorio (`claude/Tandas_Harness.md`, 30/08).

F-91 no podía saberlo: esa medición es del día anterior a la consulta y la
consulta no se la llevaba. **Lo que se corrige no es su criterio —la clase es
buena— sino un miembro de su lista.**

Y de paso deja el mejor ejemplo posible de la frontera: `narracionEnCita` estuvo
351 filas a cero **y nunca fue un centinela**, porque su cero era provisional. Un
contador en observación mide una pregunta; un centinela custodia una respuesta.

### La regla

**Un centinela NO se retira por estar a cero, nunca.** Se retira el día que
desaparece el invariante que vigila, y ese día se retiran los dos juntos. Y quien
lea la columna de contadores tiene que poder distinguir un cero de otro: por eso
la lista de arriba vive **aquí** y no solo en un comentario del código.

### ⚠️ EL HUECO: este contrato solo gobierna a UNO de los dos

F-91 dio por hecho que la clase «se resuelve donde se resuelven estas cosas: en el
contrato de contadores». **La cláusula 4 solo obliga a lo que pasa por
`COUNTER_CATALOGUE`**, y de los dos fundacionales solo
`verificador.confirmados_por_estructura` está ahí.

`r2.sin_ancla` vive en `DiscardedFindings`, la bolsa de cadena libre que este
mismo fichero señala en §1 como lo que NO hay que repetir —`bumpCount(counts,
key: string)`, «ahí estuvo el agujero»—. Para él, **esta sección es DESCRIPCIÓN,
no garantía**: nada impide hoy renombrarlo, duplicarlo o perderlo en una fusión
ciega. Un centinela sin garantía de transporte es un centinela que puede
desaparecer sin que nadie se entere — que es precisamente lo que no queremos de
un centinela.

**No se arregla aquí**, y por una razón concreta: el vocabulario entero de la
cascada (`descartado.*`, `a_juicio.*`) vive en esa bolsa, así que mover un solo
nombre al catálogo dejaría la cascada contando en dos sitios distintos — peor que
contar mal en uno. Es exactamente el territorio de **B.110**, y allí queda
anotado.

---

## 2-ter. EL MOTIVO LITERAL: un descarte dice EL PREDICADO QUE SE VERIFICÓ (F-92 P2)

*Añadida el 31/08/2026. Nace de encontrar en producción un motivo de descarte
que era falso — y de que nadie lo hubiera notado en dos días, porque los
motivos de descarte no los lee nadie.*

> **El motivo de un descarte es el predicado que se comprobó, literal. Ninguna
> cadena de log afirma más de lo que el código verificó.**

Es la regla del sello —`'estructura'` significa exactamente lo verificado
(F-89 P1)— aplicada a los logs. Y responde a algo que el proyecto ya tenía como
doctrina hacia fuera y no hacia dentro: **«lo mostrado es real» vale también
para lo que TIRAMOS.** Un motivo de descarte que no es verdad es una mentira
interna, y las internas son peores **porque nadie las revisa**.

### El caso que la funda

`descartado.cubierto_por_diff` escribía:

    el diff ya comparó esas dos tablas celda a celda

Y era falso para toda columna que existiera en un solo documento: **el diff
compara la intersección de nombres menos la clave, y no mira las demás nunca**.
En RRHH-06/OPE-02 eso son **dieciocho columnas de veinte** sobre las que el
mensaje mentía. Ver B.128 y F-92.

**Cómo se arregla, y es la forma general**: no se acota la frase — se hace que
el predicado del código coincida con lo que la frase dice. La supresión pasó a
comprobar la tripleta entera (par emitido ∧ filas emparejadas ∧ columnas ⊆
comparadas), y entonces el motivo **vuelve a ser verdad por construcción**.

Cuando eso no sea posible, la salida es la contraria: **cambiar la frase hasta
que diga solo lo comprobado**, aunque quede fea. Un motivo feo y cierto es
mejor que uno elegante y falso.

### Qué comprobar al escribir un descarte nuevo

Leer la cadena del log **como si fuera una afirmación bajo juramento** y
preguntarse qué condición del código la respalda. Si hay alguna palabra que el
`if` no comprueba —«ya», «todas», «celda a celda»—, sobra o falta código.

---

## 3. LO QUE SE DESCARTÓ, dicho para que no se vuelva a proponer

**Retención y versionado del esquema de contadores.** Es lo primero que apetece
añadir a un contrato así, y es **humo hasta que haya algo que lea los
contadores**. Versionar un formato que ningún consumidor interpreta es ceremonia:
se añade el día que exista el primer lector y su versión signifique algo para
él. Anotado aquí como descartado, no como olvidado.
