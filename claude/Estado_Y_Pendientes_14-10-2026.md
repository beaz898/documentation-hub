# ESTADO Y PENDIENTES — 14/10/2026

> **Sustituye a `Puntos_Pendientes_Doclity.txt`**, que tiene cosas desfasadas. Escrito por el
> arquitecto el 14/10/2026, después de cerrar la medida de F-126. Cada pendiente dice **de qué
> consulta de Fable sale**, para que una entrada suelta se pueda rastrear dentro de un mes.
> Las consultas están archivadas con sus dos mitades en `claude/consultas-fable/`.

---

## 1. Dónde estamos: el marcador del caso de control

Tres contradicciones sembradas en NOR-11 ↔ CLI-13, con verdad documentada en
`SIEMBRA_caso_control.md`: **PLAZO** (72 h vs 7 días), **LUGAR** (Chamberí vs Retiro) y
**NEGACIÓN** (bolsa amarilla con prohibición expresa del negro vs contenedor negro).

| fecha | qué había | PLAZO | NEGACIÓN | LUGAR | marcador |
|---|---|---|---|---|---|
| 06-08/10 | línea base (10 pasadas, B.357) | 10/10 | 3/10 | 0/10 | 1 de 3 |
| 11/10 | corpus limpio (5 pasadas) | 5/5 | 0/5 | 0/5 | 1 de 3 |
| 12/10 | fase 1.0, la caja definida (6 pasadas) | 6/6 | 6/6 | 0/6 | 2 de 3 |
| 13/10 | fase 3.1, el empalme (7 pasadas) | 7/7 | 7/7 | 1/7 | 2 de 3, y 3 de 3 una vez |
| **14/10** | **F-126, la regla de la cita (7 pasadas)** | **7/7** | **7/7** | **7/7** | **3 DE 3, LAS SIETE** |

Cero falsos positivos en todas las ventanas. Lo que publica LUGAR hoy es un tramo **contiguo y
literal** de 133 caracteres («…ubicado en la clínica de Chamberí»), con `marca recompuesta: no`:
el juez dejó de fabricar la frase y **copia**.

---

## 2. Lo que está hecho

### Fase 0 — limpieza y línea base · F-123 (10/10)
Los 14 restos fuera del corpus (`SQL_F123_05`, ejecutado el 11/10), contadores y línea base nueva.
La línea base anterior se perdió al borrar NOR-11 y NOR-10 de la aplicación: su única copia es
`claude/Medida_B357_destino_contradicciones_NOR11_CLI13.md`, que desde el 13/10 también está en el
repositorio.

### Fase 1.0 — la caja, DEFINIDA Y ACOTADA EN EL PROMPT · F-124 (12/10) · commit `00ed4235`
`uniqueToNewDoc` definida en el prompt del juez, con ejemplo positivo y negativo y el tope de 10
escrito en el prompt. Subió el marcador de 1 a 2 de 3.
El hallazgo que lo motivó: el juez emitía LUGAR dentro de esa caja, con el conflicto escrito por él
mismo, en una lista que no pasaba por la puerta ni se publicaba
(`claude/Hallazgo_LUGAR_en_uniqueToNewDoc.md`, la única copia de las salidas de `SQL_F123_07` y
`SQL_F123_08`, traída al repositorio el 14/10). Lo que falta de esa decisión está en el punto 3.13.

### Fase 3.1 — el empalme · F-125 (12-13/10) · 13 commits, `0ab6e7d6`
**13 commits** (del 0 al 11, contando 3a y 3b). El push `1671465a..0ab6e7d6` lleva 14 porque el
primero, `83a5160b`, es el archivo de F-125.
La puerta de citas anclada por el **tramo literal más largo** en vez de por los 20 primeros
caracteres. (B) sólo en las contradicciones, lo publicado es siempre la **frase real** y nunca el
empalme, los trozos de las dos frases al verificador, dos guardas y seis contadores.
Decisiones en tres sitios del repositorio: el archivo de F-125
(`claude/consultas-fable/F-125_2026-10-12_el-empalme.md`), `CLAUDE.md` (la descripción de la
puerta de citas) y `claude/Estado_Del_MVP.md` (fase 3.1).
**Medida: LUGAR 1 de 7.** (B) hizo lo correcto las siete veces —rescató una y se negó seis, porque
en la cita corta no había nada que rescatar—. El techo no lo ponía la puerta: lo ponía el juez.

### F-126 — la regla de la cita (13-14/10) · 7 commits, `2fe72b4e`
**7 commits.** El push `0ab6e7d6..2fe72b4e` lleva 8 porque el primero, `c070438a`, es el SQL de la
medida de la fase 3.1.
Hallazgo: el prompt **ya prohibía** empalmar, en mayúsculas y en cuatro sitios, y el juez lo
incumplía sólo en la frase larga con el dato en una subordinada lejos del sujeto.
Fable corrigió la dirección que proponía el arquitecto: no «tan largo como haga falta» sino **«el
tramo contiguo más CORTO que contenga el dato, aunque empiece y acabe a mitad de frase, normalmente
entre 40 y 200 caracteres»**, con ejemplo de subordinada sin sujeto y moldes del JSON realistas.
Más **«prompt estricto, puerta tolerante»** (ley de Postel) escrito en `CLAUDE.md`, con la regla de
que tolerar no es autorizar y que la tolerancia sólo vale con contador.
**Medida: 7 de 7.** Siete de las ocho predicciones aciertan; falla la de la mediana, y por una razón
sabida: toda la bajada venía de LUGAR porque PLAZO y NEGACIÓN ya se citaban bien
(`claude/Predicciones_F126_La_Regla_De_La_Cita.md`).

---

## 3. Lo que queda, en orden, con su origen

### 3.1 · EL CAMINO CRÍTICO: el presupuesto de lectura · F-123, fase 1.2
**Esto es lo siguiente, y no es una idea nueva: es un pendiente viejo que acaba de volverse el
cuello de botella.**

Lo medido hoy (inventario de Code, 14/10): la **única** pareja con verdad documentada que pone a
prueba el caso difícil —frases largas con subordinadas— es **NOR-10 ↔ CLI-12**
(`SIEMBRA_corpus_ampliado.md`, tres contradicciones sembradas más una no sembrada). Y son los dos
documentos con más frases largas del corpus: NOR-10 tiene 149 frases de más de 200 caracteres y
CLI-12 tiene 118.

El problema: **NOR-10 mide 60.038 caracteres y CLI-12 50.797**, contra los **40.000** del
presupuesto por pareja. CLI-12 ya entraba recortado frente a NOR-11 (2.959 de 55.135). Una
contradicción sembrada que no llegue al juez fallaría **por lectura, no por la regla de la cita**,
y eso haría la medición inservible para lo que queremos saber.

Así que: o se resuelve el presupuesto de lectura, o la validación de F-126 en otra pareja no se
puede hacer limpia. Dictaminado en F-123 como fase 1.2 y sin construir.

### 3.2 · El caso de empalme falso sembrado · F-125, confirmado en F-126
Control **positivo** de (B): dos fragmentos literales que, pegados, afirman algo que ninguna de las
dos frases reales afirma. Sin él, los ceros de `juez.recompuestas_bloqueadas_al_reclasificar` y
`juez.recompuestas_sin_contexto_del_resto` son **ceros de población**, no pruebas.
Se siembra fuera de una medición en curso, nunca en medio de una.

### 3.3 · Fase 2 = F-119 · F-123 · ⚠️ DICTAMINADA SIN COMMIT
El frente más antiguo abierto, y Fable lo señaló en la cabecera de F-126 por la regla de los 7 días.
Recortada por F-123 a cuatro movimientos con medida en sombra. **Dictaminada y sin empezar.** Fable
la contaba con 13 días sin commit el 13/10 por su regla de los 7 días; la cuenta la lleva él, aquí
no se guarda un número que envejece.

### 3.4 · «Norma contra práctica» · F-125
Extender la definición de contradicción. En espera **por decisión del arquitecto, contra la
recomendación de Fable**, con la condición de que fuera después de medir (B). **(B) ya está medida,
así que esta condición se ha cumplido y queda desbloqueada.** Commit propio.

### 3.5 · «Si no puedes copiar una frase literal, no emitas» · F-121 P7, reafirmado en F-126
Fable la señaló como un acoplamiento entre emisión y copia y sigue pensando que está mal, pero
pidió no mezclarla con el cambio de F-126. **Se mide sola, después.** Hoy ya se puede.

### 3.6 · Fase 3.2, el verificador ciego · F-123 / F-125
Sin construir. ⚠️ **Aviso de registro**: el verificador que confirma hoy los hallazgos **no es
ciego** —es `verifyFindings` con Haiku, y confirma «por juicio»—. El arquitecto lo llamó ciego dos
veces el 13/10 y era falso; está corregido en la precisión 4 del archivo de F-126.

### 3.7 · Fase 3.3, la segunda vuelta · F-123 / F-125
Sin construir.

### 3.8 · Fase 3.4, la vía 2: los punteros · F-125, con disparador nuevo del 14/10
Que el juez **señale en vez de copiar** —devuelva un localizador y la máquina extraiga la frase—.
`unidades-de-cita.ts` está construido desde el 08/10 y sin conectar, y eso no cuesta nada.
El disparador de F-126 era «si LUGAR no llega a 5 de 7»; llegó a 7, **así que NO se activa**.
No ganan velocidad ni coste de forma apreciable: lo que cuesta es leer los dos documentos. Ganan
otra cosa: **eliminan la transcripción como clase de fallo para cualquier documento**, mientras lo
de hoy es un arreglo comprobado en tres casos de una pareja.
**Disparador nuevo, escrito el 14/10:** la primera vez que un caso sembrado falle en **otro**
documento porque el juez no copió, se activa la 3.4.

### 3.9 · La segunda llamada dirigida para la omisión · F-124
«La ausencia de evidencia es ausencia de cita» → segunda llamada que pida las dos citas, y de ahí a
la puerta; nunca publicar prosa del juez. Decidido y **sin construir**. Su urgencia ha bajado:
NEGACIÓN se publica 7 de 7 desde la fase 1.0.

### 3.10 · La guarda 1.1 del rerank · F-124
Archivada **con condición de reapertura**. No se toca hasta que la condición se cumpla.

### 3.11 · Acotar la salida del juez por construcción · B.366, medido el 09/10
Con dos documentos casi duplicados el juez escribió **22 solapamientos** pese al «máximo 10» del
prompt, y **48 entradas en `uniqueToNewDoc`**, que entonces no tenía tope. El tope de la caja se
puso en la fase 1.0; el de los solapamientos sigue sin cumplirse.

### 3.12 · Por qué el juez es exhaustivo unas veces y mínimo otras · B.357, punto 5
Era el frente principal: cinco pasadas idénticas el 07/10, sólo la primera emitió las tres.
**F-126 parece haberlo resuelto para esta pareja**: las siete pasadas del 14/10 dan la misma salida
con las mismas citas. Queda abierto para otras parejas, y es parte de lo que mide 3.1.

### 3.13 · Lo que falta de la fase 1.0 · F-124
El tope de la caja EN CÓDIGO, no sólo en el prompt; el consumidor, que es enseñar «sólo en el
nuevo» en pantalla; y el contador. En F-125 el rescate se archivó y quedó sólo el contador-alarma
`caja_con_candidato`, que tampoco está construido: ni él ni `rescatadas_de_caja` aparecen en
`lib/`. Decidido en F-124 y sin construir.

---

## 4. Lo que hoy NO se puede medir, y por qué

Del inventario de Code (14/10), sobre las copias locales y el último censo del corpus (10/10):

- **OPE-14 ↔ OPE-11**: OPE-14 no está en `corpus-pruebas/` ni en el censo. No se puede.
- **OPE-15 ↔ OPE-11**: OPE-15 está en local pero no en la aplicación. Exige subirlo.
- **Los pares de `SIEMBRA_falsos_de_agosto.md`** (MKT-01↔RRHH-05, RRHH-04↔RRHH-06, NOR-04↔OPE-01,
  OPE-01↔CLI-01): los siete documentos estaban `pendiente` el 10/10, así que ningún lado está en el
  corpus. Y CLI-01 está duplicado (B.373).
- **OPE-10 ↔ OPE-11** y **RRHH-08 ↔ OPE-13** sí son medibles, pero van por tablas: el primero por
  el diff determinista y el segundo citando filas. **Ninguno pone a prueba la regla nueva de la
  cita en prosa.**
- ⚠️ **El censo del corpus es del 10/10.** Saber qué hay hoy exige una consulta de sólo lectura que
  el arquitecto no ha autorizado todavía. Code se paró ahí, y bien.
- RRHH-08 se llama distinto en la aplicación —**«RRHH-08 .xlsx»**, con un espacio antes del punto—
  que en la copia local (`RRHH-08_asignacion-de-guardias.xlsx`), y no está comprobado que su
  contenido sea el de la copia local.

---

## 5. Deuda técnica anotada, con su origen

| deuda | de dónde sale |
|---|---|
| `pipeline.ts` pasa de 1.515 líneas y hay que partirlo, en su propio commit | fase 3.1, excepción consciente del 13/10 |
| Un titular de menos de 25 caracteres se pega a la frase que titula, y la «frase real» sale con «## 6. Retirada» delante | fase 3.1, commit 2 |
| El solape entre trozos: una frase puede estar en dos trozos y el tramo se atribuye a la copia donde cae | fase 3.1 |
| `normalize()` no quita las comillas tipográficas, ni `¿` ni `¡` | B.317 |
| Dos vectores sin documento en el namespace | B.375 |
| CLI-01 duplicado | B.373 |
| Defecto real de código sin evidencia de que haya ocurrido | B.374 |
| `formatos-con-tablas.test.ts` es inestable por tiempo de disco | conocida |
| Avisos de Next.js «Unsupported metadata viewport» | vistos el 14/10, inocuos |
| El SQL escrito antes del 13/10 no contempla `paso='recompuesta'` | F-126, commit 10 |
| `estado: 'cruza'` puede venir de una unión recompuesta, no sólo de una cita que cruza trozos | fase 3.1, commit 8 |

---

## 6. Reglas de método vigentes, y de dónde vienen

1. **Las predicciones se escriben ANTES de medir, con nombre, y no se reescriben después.** Una que
   falla es información. (F-124 en adelante; hoy ha fallado la de la mediana y queda anotada.)
2. **El verde por commit incluye `tsc` sobre todo el proyecto, después de escribir las pruebas**,
   porque `next build` no comprueba los tipos de las pruebas. (13/10)
3. **Una prueba que lee «la última llamada» al modelo simulado puede pasar en falso.** Hay que
   exigir una llamada nueva antes de leer. (13/10, pasaba de verdad)
4. **Lo que se pierde en silencio se busca a propósito**: todo `?? null`, todo `catch` vacío, todo
   filtro que pueda no filtrar, todo `return` dentro de un bucle. (13/10)
5. **Un cero permanente es indistinguible de «no ocurrió»**: un contador necesita prueba de que su
   dato llega de punta a punta. (F-82, reafirmado el 13/10)
6. **Un ejemplo del prompt no puede contener la respuesta del caso que se va a medir.** (12/10, el
   caso Chamberí/Retiro)
7. **Las decisiones se atribuyen a quien las tomó y al día en que se tomaron.**
8. **El proyecto de Claude y el repositorio son dos sitios distintos.** Lo que sólo vive en el
   proyecto se pierde para Code y para git. (13/10, el fichero de B.357)
   **Operativa:** antes de escribir una ruta en cualquier cosa que vaya al repositorio, se comprueba
   que esa ruta existe EN EL REPOSITORIO. Una referencia a un fichero del proyecto de Claude dentro
   de un documento del repositorio es una referencia muerta, y Code la caza; el arquitecto la
   escribió tres veces el 14/10 antes de aprender a comprobarla.
   **Y la regla de qué se trae**: un documento se trae al repositorio si guarda evidencia o una
   medida que no existe en ningún otro sitio. Si su contenido ya está en el repositorio en otra
   forma, se REDIRIGE la referencia en vez de duplicarla, porque dos copias divergen.
9. **Una cita tiene que ser literal.** Un error de transcripción del arquitecto en la consulta
   F-126 («poner» por «usar») pasó al dictamen de Fable y de ahí al prompt del producto.
10. **No se abren frentes nuevos sobre algo ya decidido y sin construir**, y los frentes se cierran
    con un disparador escrito. (F-123 P5; F-126 cerró el de la puerta)
