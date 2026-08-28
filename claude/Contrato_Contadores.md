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

Todo nombre lleva la etapa que lo emite: `diff.clave.*`, `diff.celdas.*`,
`seleccion.*`, `verificador.*`. Un contador sin apellido no se sabe de quién es,
y lo que no se sabe de quién es no se puede retirar: para comprobar que
`discardedFindings` no lo lee nadie hubo que recorrer el repositorio entero.

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

## 3. LO QUE SE DESCARTÓ, dicho para que no se vuelva a proponer

**Retención y versionado del esquema de contadores.** Es lo primero que apetece
añadir a un contrato así, y es **humo hasta que haya algo que lea los
contadores**. Versionar un formato que ningún consumidor interpreta es ceremonia:
se añade el día que exista el primer lector y su versión signifique algo para
él. Anotado aquí como descartado, no como olvidado.
