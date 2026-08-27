# CONSULTA A FABLE — F-81

**Asunto:** el orden que fijó F-80 se para en dos sitios. El criterio de clave
de F-78 se rinde en el caso central del corpus, y no hay dónde medir la fase 1.

**Protocolo:** F-80 fijó «tanda NOR-11/CLI-13 → diff fase 1 (descubrimiento de
clave, solo y medido) → fases 2 y 3 → remedición», con la prosa en paralelo y
sin commits. La tanda está hecha y la fase 1 está **explorada antes de
escribir**. Esta consulta continúa ese frente.

**Qué se pide:** dos decisiones de método y una de orden. El segundo hallazgo
no es sobre el diff: toca al proyecto entero.

---

## 1 — LA TANDA DEL CASO DE CONTROL: EL BLOQUE GENERALIZA

NOR-11/CLI-13, tres siembras de superficie distinta al caso de cargos:

| Contradicción | Superficie | Resultado |
|---|---|---|
| 72 h vs 7 días | plazo | CONFIRMADA |
| Chamberí vs Retiro | lugar | CONFIRMADA |
| contenedor amarillo con prohibición del negro / negro | negación categórica | EL JUEZ NUNCA LA EMITE |

Dos superficies nuevas, ninguna sobre roles, confirmadas por mecanismo. La
circularidad que temíamos en P3 de F-79 queda descartada: el bloque no aplica
el ejemplo, aplica la regla.

Y un techo nuevo, que anotamos como B.106: en documentos de 4 y 5 páginas —los
más pequeños del corpus, con tres siembras— el juez devuelve exactamente
«1 contradicciones» en el log crudo, ANTES de cualquier filtro, y cada dirección
devuelve una DISTINTA. Nunca dos.

NO ES LA SELECCIÓN: entran 4 fragmentos de 16 y 4 de 11, y el descarte de un
solapamiento cita literalmente «contenedor negro habilitado en cada gabinete».
El material de la tercera estaba delante del juez.

Si con cinco páginas emite una de tres, los dos techos —cuánto llega y cuánto
devuelve— se multiplican en documentos de dieciocho.

---

## 2 — EL CRITERIO DE CLAVE DE F-78 SE RINDE EN EL CASO CENTRAL

Medido sobre OPE-10/OPE-11 leyendo las hojas enteras, antes de escribir una
línea:

| Columna | % único OPE-10 | % único OPE-11 | ¿≥90% en las dos? |
|---|---|---|---|
| Código | 100% | 100% | SÍ |
| Tratamiento | 100% | 100% | SÍ |
| Precio con seguro | 71,7% | 68,3% | no |
| Precio base | 61,7% | 71,7% | no |
| Duración | 20,0% | 23,3% | no |
| Categoría | 16,7% | 16,7% | no |
| Profesional | 13,3% | 15,0% | no |
| Clínica / Revisión | 5,0% | 5,0% | no |

Dos candidatas, y el desempate NO desempata:

- **Cardinalidad conjunta**: Código 85, Tratamiento 85. Empate exacto.
- **Nombre idéntico sobre parecido**: las dos se llaman igual en los dos
  ficheros. No discrimina.
- Luego: `diff.clave_ambigua` → sin emparejar → las 15 discrepancias que este
  corpus existe para medir se quedan sin diff.

Y NO ES MALA SUERTE DEL CORPUS, es estructural. El 85 sale de la aritmética del
diseño: 35 comunes + 25 propias de cada lado. Tratamiento da lo mismo porque es
la etiqueta 1:1 de Código. Eso pasa en CUALQUIER tabla bien formada: una clave
natural casi siempre viene con su descripción, y la descripción tiene su misma
cardinalidad por construcción. Código/Tratamiento, NIF/Nombre,
Referencia/Descripción. **El desempate por cardinalidad conjunta no puede
romper ese empate nunca, porque son biyectivas.**

### 2.1 — LA BIYECCIÓN ESTÁ MEDIDA, NO SUPUESTA

Esto entró en la consulta como «nuestra lectura, que puede estar equivocada».
Ya no lo es: se ha comprobado leyendo los dos ficheros enteros.

**La propiedad**, sobre la unión de las dos tablas:

```
codigos distintos               : 85
tratamientos distintos          : 85
un codigo con DOS tratamientos  : ninguno
un tratamiento con DOS codigos  : ninguno
=> BIYECTIVAS: SI
```

**La consecuencia, que es lo que decide:**

```
parejas por Codigo           : 35
parejas por Tratamiento      : 35
parejas SOLO por Codigo      : ninguna
parejas SOLO por Tratamiento : ninguna
=> MISMAS PAREJAS: SI
```

Emparejar por `Código` o por `Tratamiento` produce **exactamente las mismas 35
parejas**, sin una sola diferencia. El empate no oculta una decisión: **no hay
decisión que tomar.**

### 2.2 — LO QUE NO BUSCÁBAMOS, Y QUE REENCUADRA LA CONSULTA

Emparejando por cualquiera de las dos candidatas, de esas 35 parejas salen:

```
identicas: 20   con alguna diferencia: 15
columnas donde difieren: {"Precio base":4, "Duración (min)":4,
                          "Profesional asignado":4, "Clínica":3}
```

**Es exactamente el registro de siembra**, con el reparto por columna clavado.

Dicho con todas las letras: **la fase 2 NO es una incógnita sobre este corpus.
El diff reproduce el ground truth completo. Lo único que lo separa del
resultado correcto es que la fase 1 no llega a entregar clave.**

Lo que reencuadra el problema:

> **`clave_ambigua` no está protegiendo de un emparejamiento malo. Está
> bloqueando uno perfecto.**

### P1 — reformulada a la vista de lo anterior

La primera mitad de esta pregunta ha dejado de ser una pregunta: la biyección
está medida y las parejas son idénticas. Lo que queda:

**P1.a — ¿Cómo se DETECTA la biyección de forma estructural?** Suponemos que
comprobando que el mapeo valor-a-valor es 1:1 en los dos sentidos sobre la
unión de las dos tablas —que es como lo hemos medido nosotros—, pero
confírmalo o corrígelo: es lo que se va a implementar.

**P1.b — ¿Y qué se hace cuando dos candidatas pasan el umbral y NO son
biyectivas?** Esta sigue entera, y es la que importa, porque es donde la
ambigüedad sí es real. **Ese caso no existe en este corpus** —lo hemos
comprobado—, así que es exactamente lo que hay que preguntarte a ti en vez de
medirlo: aquí no hay dato que medir.

---

## 3 — Y NO HAY DÓNDE MEDIR LA FASE 1

«Un módulo que se mide antes de que nada use su salida» no es ejecutable hoy.
El repositorio no tiene NINGUNA infraestructura de pruebas: ni jest, ni vitest,
ni mocha, ni tsx, ni ts-node. Cero ficheros de test. Los scripts de
`package.json` son `dev`, `build`, `start`, `lint`, `typecheck`.

**La única puerta es `typecheck`, que comprueba tipos y nada más.** Y una
precisión para que no se proponga como puerta lo que no lo es: **`lint` está en
`package.json` pero `next lint` NO está configurado en este repositorio** —
lanza un asistente interactivo, así que no hay ahí ningún gate del que colgar
nada.

Así que la única forma de ejercitar una función es lanzar un análisis completo
desde la bandeja: gasta créditos, tarda, llama a tres modelos, y mete el ruido
de retrieval, rerank, juez y cascada entre nosotros y la pieza que queremos
medir. Para una función determinista que solo lee celdas, eso es absurdo.

Es B.105 otra vez, y aquí duele más por una diferencia que conviene ver: un
prompt al menos SE PUEDE medir contra el modelo. El descubrimiento de clave es
determinista —mismas celdas, misma clave, siempre—, es la clase de cosa que se
mide en milisegundos y sin red, y es justo la que este repositorio no puede
ejecutar.

Las tres opciones, sin elegir:

- **(a) Endpoint de diagnóstico** (`/api/admin/table-key`, dos `documentId`,
  devuelve la clave y el porqué). Precedente en el repo (`diagnose-vectors`),
  cero dependencias. Pero exige documentos subidos e indexados y no corre sin
  Supabase.
- **(b) Script suelto** que lea los `.xlsx` de `corpus-pruebas/` y ejercite la
  función sin base de datos. Mide contra el ground truth versionado, en un
  segundo. Pero necesita un intérprete de TypeScript: dependencia nueva, que la
  regla del proyecto obliga a justificar.
- **(c) Nada**, y medirlo por el log de una tanda. Es lo que se ha venido
  haciendo, y es por lo que la fase 1 «sin consumidores» no se puede validar:
  sin consumidor no hay log.

**P2 — ¿Cuál?** Y la pregunta de fondo: ¿debería este proyecto tener una forma
de ejecutar código determinista sin desplegar? Llevamos cuatro días midiendo
todo por tandas de producción —caras, lentas y con tres modelos de ruido— para
verificar cosas que son aritmética. La regla de «cero dependencias nuevas sin
razón» existe por buenos motivos, pero empezamos a sospechar que aquí la razón
existe. Nos frena que sería el primer cambio de infraestructura del proyecto y
no queremos abrirlo por comodidad.

---

## 4 — UNA CAUTELA DEL DIRECTOR SOBRE CÓMO LEEMOS LAS MEDICIONES

Y esto nos parece importante que quede fijado como criterio, porque afecta a
todo lo que hemos decidido esta semana.

Su planteamiento, literal: «que no haya mejoría en el caso de prueba no quiere
decir al cien por cien que esa mejora no funcione, sino que para el caso de
prueba no funciona. Puede ser que no funcione para ningún caso, pero eso no lo
podemos certificar. Algo que ahora no da mejoría, cuando tengamos cincuenta
documentos de otra dimensión o de otro tipo, puede cambiar — para bien o para
mal.»

Es la asimetría de la evidencia negativa, y creemos que hoy la estamos tratando
mal en las dos direcciones:

- Hemos APLAZADO el commit de normalización de citas porque no movía ninguna de
  las tres siembras. Correcto según el método — pero el fallo que arregla está
  diagnosticado y es real; lo que medimos es que este corpus no lo pisa.
- Y al revés: el bloque del verificador FUNCIONA en cinco documentos de prueba.
  Eso no dice qué hará con cincuenta documentos de un cliente real.

**P3 — ¿Cómo se escribe esto como regla operativa sin que se convierta en
coartada para meter cambios sin medir?** Nos preocupan los dos extremos: «no lo
mide el corpus, así que no entra» descarta arreglos reales; «no lo mide el
corpus pero yo creo que sirve» es fe con otro nombre. ¿Hay una tercera posición
—algo como «entra declarado como no medido, con su caso de prueba pendiente de
existir»— o eso es simplemente deuda con mejor nombre?

---

## P4 — EL ORDEN

Con todo lo anterior: ¿sigue el diff por delante, o P2 y P3 se resuelven antes
porque condicionan cómo se construye y cómo se lee todo lo que venga después?
