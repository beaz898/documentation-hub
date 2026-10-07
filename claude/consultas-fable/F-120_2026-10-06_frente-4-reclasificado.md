---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-120
Asunto: Frente 4 fue declarado post-MVP, y el dato lo reclasifica
Fecha de envío: 06/10/2026
Fecha de respuesta: 06/10/2026
Fuente: archivada el 07/10/2026 desde el historial de la conversación de Code con
        el arquitecto, NO desde un texto pegado para archivar. Lo que consta y lo
        que no:
        · ⚠️ EL DICTAMEN DE FABLE NO CONSTA. No se pegó nunca en esa conversación:
          buscado el 07/10 en todos sus mensajes, sólo aparecen REFERENCIAS a él.
          No se reconstruye: ver (d).
        · ⚠️ LA CONSULTA ENVIADA NO CONSTA COMO UN SOLO TEXTO. Constan, literales,
          (1) la última versión COMPLETA que vio Code, pegada por el arquitecto el
          06/10 a las 08:12 UTC, y (2) un párrafo de sustitución pegado a las
          08:58 UTC. Lo que se envió a Fable es, PROBABLEMENTE, la versión (1) con
          su punto «1 lado / 1 cita — JUNTÓ DOS SITIOS…» cambiado por el párrafo
          (2); no consta que se enviara así ni que no hubiera otros cambios. Por
          eso van separados y no se funden: ver (c).
Estado: ARCHIVADA INCOMPLETA (07/10/2026). Contestada el 06/10/2026. Su P1 (el
        diseño del puntero: segmentador, etiquetas, ancla) se convirtió en el
        PLAN B de F-121; su P2 sigue sin medir (el coste de la segunda pasada del
        juez, y la lista de datos compartidos para que las pérdidas dejen rastro).
        Cotejo de integridad, 07/10/2026, con el mismo método que F-121: sha256
        del texto tal como queda archivado aquí (saltos LF, sin salto final), 16
        primeros hexadecimales; caracteres = puntos de código; palabras = trozos
        separados por espacio en blanco. Ninguno de los dos textos tiene espacios
        que no sean ASCII. Los 60 primeros y últimos van entre comillas con
        escapes JSON: \" es una comilla del texto y \n un salto de línea.
        · CONSULTA, versión de las 08:12 UTC: huella cc777e20f086704e · 15.025
          caracteres (17.558 bytes UTF-8) · 244 líneas · 209 no
          vacías · 2359 palabras.
          60 primeros: "CONSULTA F-120 — FRENTE 4 FUE DECLARADO POST-MVP, Y EL DATO "
          60 últimos:  "nálisis antes de\n  enseñar el producto a un cliente de pago."
        · PÁRRAFO DE SUSTITUCIÓN, 08:58 UTC: huella 616b42e5a6763a8a · 1336
          caracteres (1381 bytes UTF-8) · 17 líneas · 17 no
          vacías · 224 palabras.
          60 primeros: "  · 1 lado / 1 cita — LA CITA NO EXISTE COMO PASAJE SEGUIDO "
          60 últimos:  "or, no contra el bloque exacto que se\n    armó para el juez."
        · DICTAMEN: no consta, no hay cifras.
Superada por: — (su P1 queda como plan B de F-121)
---

# (a) CABECERA

**F-120 · Frente 4 fue declarado post-MVP, y el dato lo reclasifica**

- Fecha de envío: 06/10/2026. Fecha de respuesta: 06/10/2026.
- Quién escribe la consulta: el arquitecto. Code la cruzó con el código dos veces antes del
  envío (06/10, 07:43 y 08:13 UTC). El director la envía y pega la respuesta.
- Estado: **ARCHIVADA INCOMPLETA.** Falta el dictamen entero; la consulta, en dos piezas.
- Archivada con un día de retraso: faltaba desde el 06/10, y se detectó al archivar F-121.

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **Continúa F-22, F-80 y F-89 P6**, como dice la propia consulta. F-80 y F-22 no tienen texto
  archivado; la consulta lo declara en su sección 0.
- **Los datos nuevos son los del 05 y el 06/10**: la medición de los descartes de cita
  (SQL_B331, SQL_B332, SQL_B333; B.332 de `claude/Estado_Del_MVP.md`), la comparación a mano de
  las once citas enteras que hizo Code el 06/10 y la contradicción sembrada de LUGAR publicada 0
  de 4 pasadas.
- **Las correcciones de Code antes del envío** (06/10): la cabeza y la cola de la puerta son
  min(20, 40 %) y no 15 (corregido en B.332, `bd5fa647`); `entregado_texto` es contiguo, no
  entero; el arreglo del rerank de P5 no está construido; y son TRES, no dos, las citas literales
  de las cuatro mal atribuidas. La versión de las 08:12 ya las recoge.

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — LO QUE CONSTA DEL TEXTO ENVIADO

⚠️ **No consta como un solo texto** (ver la cabecera). Van las dos piezas, literales y sin
fundir.

## (c.1) Versión completa del 06/10/2026, 08:12 UTC — la última que vio Code

Tal como la pegó el arquitecto. No se ha tocado. Su punto «1 lado / 1 cita — JUNTÓ DOS SITIOS
DEL MISMO DOCUMENTO…» (líneas 129-140 de este texto) es el que el párrafo de (c.2)
venía a sustituir.

CONSULTA F-120 — FRENTE 4 FUE DECLARADO POST-MVP, Y EL DATO LO RECLASIFICA
Fecha: 06/10/2026 · Continúa F-22, F-80 y F-89 P6

════════════════════════════════════════════════════════════════
0. PROCEDENCIA Y PROTOCOLO
════════════════════════════════════════════════════════════════

ÚLTIMA RESPUESTA RECIBIDA: F-119 (30/09/2026). Su cabecera dice «ARCHIVADA. Sin
decisión del director. Nada iniciado», y consta como par incompleto. Esta consulta no
depende de ella.

⚠️ DOS LÍMITES DE FIDELIDAD, DECLARADOS ANTES DE EMPEZAR:
  · El texto de F-80 NO está archivado: el índice lo da como «pendiente de archivar»
    y dice que F-71, F-73, F-74 y F-76 a F-80 existen «solo como REFERENCIAS y
    resúmenes». Todo lo que esta consulta atribuye a F-80 sale del resumen de esta
    casa en B.107. Si alguna atribución es infiel, se corrige.
  · El texto de la respuesta de F-22 tampoco está archivado (pendiente en B.118). Lo
    que se le atribuye sale del resumen de la bitácora.
Lo de F-89 P6 sí es texto literal, citado desde la cabecera de
Puntos_Pendientes_Doclity.txt y desde claude/consultas-fable/F-89.md:294.

REGLA DE F-118 CUMPLIDA EN LA SECCIÓN 1. Cifras comprobadas en el código el
06/10/2026.

⚠️ AVISO: la tabla «Qué recibe el juez por cada lado» de CLAUDE.md está desfasada —no
menciona Escalón 1 ni los cuatro regímenes, y tiene cuatro referencias de línea
desplazadas— y está pendiente de corregir. Esta consulta usa el código, no esa tabla.

════════════════════════════════════════════════════════════════
1. QUÉ RECIBE EL JUEZ POR CADA LADO (regla de F-118)
════════════════════════════════════════════════════════════════

Escalón 1 rige SOLO en modo rápido: el interruptor es ANALYSIS_PAREJA_ENTERA
(judge.ts:1149), lo lee interruptorParejaEntera (:1175-1182) y solo se enciende con el
valor exacto '1'. Todas las mediciones de abajo son del rápido, que es el que ve el
cliente. El tipo está en types.ts:201 y la decisión en leerLaPareja (judge.ts:1221):

┌──────────────────┬────────────┬──────────────────────┬──────────────────────────┐
│ Régimen          │ Línea      │ ANALIZADO            │ CANDIDATO                │
├──────────────────┼────────────┼──────────────────────┼──────────────────────────┤
│ tijera_vieja     │ :1261      │ recortado a 6.000    │ bloque por relevancia    │
│ sin_fuente_comun │ :1262-1266 │ recortado a 6.000    │ bloque por relevancia;   │
│ (un lado sin     │            │ MEDIDO 6000/14704    │ llega SIN CONTEXTO solo  │
│  trozos)         │            │                      │ si el que no tiene       │
│                  │            │                      │ trozos es el candidato   │
│ pareja_entera    │ :1273-1284 │ ENTERO 14704/14704   │ ENTERO 9817/9817         │
│ corte_honesto    │ :1286-1306 │ entero, suelo 6.000  │ entero si cabe dejando   │
│                  │            │ MEDIDO 14704/14704   │ ese suelo; si no, su     │
│                  │            │                      │ bloque. MEDIDO 2959/55135│
└──────────────────┴────────────┴──────────────────────┴──────────────────────────┘

PRESUPUESTO_PAREJA_CARACTERES judge.ts:1158-1160 — 40.000 · NEW_DOC_LIMIT_QUICK
judge.ts:37 — 6000, aplicado en recortarAnalizado :1094-1098 con slice(0,6000) ·
SUELO_DEL_ANALIZADO judge.ts:1167 · MAX_SELECTED_QUICK rerank.ts:28 — 6 ·
MAX_SELECTED_EXHAUSTIVE rerank.ts:31 — 25 · MAX_FRAGMENTS_PER_DOC_QUICK
retrieval.ts:110 — 25 · FRAGMENT_BUDGET_CHARS_QUICK retrieval.ts:104 — 3000 ·
temperatura judge.ts:858 — 0,1 · el log recorta las citas a 200 caracteres
judge.ts:449.

LA CABEZA Y LA COLA DE UNA CITA, en la puerta de citas: min(20, 40 % de la cita
normalizada) — coincidencia-de-cita.ts:152-155. En cualquier cita de más de 50
caracteres son 20. (El «15» que circuló en notas internas es de findTolerant, el
salto del editor, y es otra pieza.)

CONSECUENCIA QUE NO ESTABA EN F-22: en pareja_entera la asimetría de B.81 NO EXISTE.
En corte_honesto se mantiene. En sin_fuente_comun SE INVIERTE: es el ANALIZADO el que
llega recortado. Ninguna medida de recall es comparable con otra si no dice el
régimen.

════════════════════════════════════════════════════════════════
2. LO QUE YA ESTÁ DECIDIDO, Y NO SE PREGUNTA
════════════════════════════════════════════════════════════════

La doctrina de F-80, según B.107: «son la misma enfermedad. El error de diseño es que
el TEXTO de la cita lo escriba el modelo. Mientras lo escriba, habrá una familia
infinita de formas de escribirlo mal, y cada parche cubre una.» Y la solución: «citas
POR REFERENCIA — el modelo devuelve {fragmentId, ancla} y el CÓDIGO extrae el texto
del documento. La cita deja de poder ser incorrecta porque deja de ser generada.»

Decidido, y no se discute. Lo que esta consulta trae es CUÁNDO.

ESTADO DE CONSTRUCCIÓN, comprobado el 06/10: para prosa, NADA. No existe ningún tipo,
campo ni función con fragmentId en lib/analysis/. Tampoco el «módulo interino» de
B.107. Lo único emparentado es el puntero de fila de tablas, «[F3]», del que
table-structure.ts:179 dice que «es la cita por referencia que F-80 P2 pedía,
ocurriendo sola».

Y la clasificación, de F-89 P6, texto literal: «Frente 4 — prosa […] citas por
referencia […]. Este frente es post-MVP», con el criterio «Es bloqueante todo lo que
hace falso lo mostrado o pierde un juicio del usuario; es declarable todo lo que sea
límite de cobertura contado y dicho», y la condición de que Frente 4 «vive declarado
CON SUS CONTADORES Y SUS AVISOS — y ojo, sin ellos no está declarado y entonces sí
bloquea».

════════════════════════════════════════════════════════════════
3. LO MEDIDO EL 05 Y EL 06/10, QUE ES LO NUEVO
════════════════════════════════════════════════════════════════

3.1 · LOS 42 DESCARTES DE PROSA, COMPARADOS UNO A UNO CONTRA EL TEXTO REAL.
Sobre 52 análisis guardados desde el 02/10: 75 hallazgos descartados, 33 por filas de
tabla de Word (otro frente) y 42 de prosa. Los 42 entraron con pajar `entregado_texto`
— que significa que ese lado se entregó como texto CONTIGUO y no por piezas
(coincidencia-de-cita.ts:334-345), no que fuera entero— y los 42 son .docx. Ninguno
fue `entregado_piezas`, así que queda descartada la causa de una frase real que cruza
dos trozos seguidos.

Las 11 citas distintas, comparadas con la frase real del documento:

  · 23 lados / 5 citas — EL JUEZ REESCRIBE la frase, en el documento correcto:
      – el documento dice «El gestor autorizado recoge los residuos de las tres
        clínicas EN un punto de retirada centralizado, ubicado en la clínica de
        Chamberí»; el juez escribe «El punto de retirada centralizado CONCENTRA EL
        MATERIAL DE las tres clínicas, ubicado en la clínica de Chamberí». Sujeto
        cambiado, verbo inventado, y desde «ubicado» idéntica.
      – el documento dice «Dirección de Operaciones, A NIVEL DE RED, es responsable
        de…»; el juez omite «, a nivel de red,». Lo demás idéntico.
      – el documento dice «…incluida LA FIRMA DE los registros de auditoría
        trimestral…»; el juez escribe «…QUIEN FIRMA los registros de auditoría
        trimestral…». Idéntica después.
  · 11 lados / 4 citas — LA CITA ESTÁ EN EL DOCUMENTO EQUIVOCADO. TRES de las cuatro
    son literales letra por letra y se tiran solo porque el juez dijo que estaban en
    el otro documento del par. La cuarta, además, cambia «Todo el personal clínico y
    auxiliar» por «El personal clínico y auxiliar»: dos palabras.
  · 7 lados / 1 cita — LA GLOSA ENTRE CORCHETES. Es el FALLO 1 de B.107, medido el
    27/08, y es LA MISMA FRASE: «…no es delegable y recae siempre sobre esta figura
    [el Director Clínico]». ⚠️ COMPROBADO EN EL DOCUMENTO: en NOR-10 2.1 «esta
    figura» ES el Director Clínico. La glosa era CORRECTA. El producto destruyó un
    hallazgo verdadero por una aclaración acertada.
  · 1 lado / 1 cita — JUNTÓ DOS SITIOS DEL MISMO DOCUMENTO, y el mecanismo se ve
    entero. La cita es «Papel, cartón, envases sin contaminar no van a ningún
    contenedor específico del gabinete: se llevan al contenedor de basura
    convencional de la zona común del centro». Su cabeza normalizada, «papel cartón
    envases», solo existe en la chuleta del apartado 8 de CLI-13, en la posición
    7.939; su cola, «ona común del centro», solo existe en el apartado 3.4, en la
    posición 3.090 —ANTES de la cabeza—, porque el 3.4 dice «Papel, cartón Y envases».
    La puerta busca la cola detrás de la cabeza y no la encuentra. LA CITA NO EXISTE
    COMO PASAJE SEGUIDO EN NINGÚN SITIO DEL DOCUMENTO: el juez cosió el principio de
    un apartado con el cuerpo de otro. Es lo que el prompt prohíbe con esas palabras.
    Reserva: medido contra el texto del extractor, no contra el bloque exacto que se
    armó para el juez.

Una de las 11, la de 363 caracteres del Coordinador de Calidad, no se ha comparado
contra el documento todavía: queda en el grupo de las reescritas sin confirmar.

3.2 · UNA CONTRADICCIÓN SEMBRADA, PUBLICADA 0 DE 4 PASADAS.
`corpus-pruebas/SIEMBRA_caso_control.md` declara exactamente 3 contradicciones entre
NOR-11 y CLI-13, «ni una más ni una menos». La número 2 —el punto de retirada:
Chamberí en NOR-11, Retiro en CLI-13— es verdadera y escrita de antemano. Cuatro
pasadas del modo rápido (horas de Madrid; el log de Vercel va en UTC):

  05/10 12:01 · el juez la dice (ebe45632) · MUERE en la puerta · cita de 206
  05/10 12:07 · el juez NO la dice
  06/10 08:59 · el juez la dice (976f6174) · MUERE en la puerta · cita de 111
  06/10 09:02 · el juez la dice (9a276005) · MUERE en la puerta · cita de 244

Emitida en 3 de 4; muerta en 3 de 3; PUBLICADA 0 DE 4. Y tres longitudes distintas: la
misma frase del documento, tres reformulaciones, tres fallos. Las otras dos sembradas
se publican bien. El producto va a 2 de 3 en su mejor pasada, y lo que falla no es la
detección: es la copia.

3.3 · EL «NO ES ERROR» DEL USUARIO NO SOBREVIVE A UNA PARÁFRASIS.
La huella permanente del descarte (huellaDeDescarte → huellaDeProsa,
huella-hallazgo.ts:248-258) es un sha256 de los dos ids de documento MÁS LAS DOS CITAS
EN CRUDO, sin normalizar ni recortar. La de sesión (makeDiscrepancyFingerprint,
double-check.ts:310-319) usa los primeros 80 caracteres de la cita nueva, así que una
diferencia al principio —«El» por «Todo el», «quien firma» por «incluida la firma
de»— también la rompe.
Luego: si el juez escribe la misma contradicción con otras palabras, el «no es error»
que el usuario guardó NO CASA y el hallazgo le vuelve a aparecer.
El código ya lo declara (huella-hallazgo.ts): «una paráfrasis del modelo […] produce
OTRA huella. El usuario vería volver algo que ya cerró. SE DECLARA, NO SE RESUELVE
HOY, y tiene sucesor conocido: cuando las citas pasen a ser POR REFERENCIA».
LO QUE NO ESTABA MEDIDO, Y AHORA SÍ: que la paráfrasis OCURRE, entre pasadas del mismo
día y sobre la misma contradicción. Los tres identificadores de 3.2 son de
hashCitationPair (llm-boundary.ts), el id de 8 caracteres del log, no la huella del
descarte; pero las dos salen de las mismas citas, así que la deriva es la misma.

3.4 · Y EL JUEZ PIERDE HALLAZGOS QUE SÍ VE, aguas arriba de todo filtro. En la pasada
del 05/10 a las 12:07 emitió 1 contradicción donde las otras tres emitieron 3. Lo
perdido no lo mató ninguna puerta: no se dijo. El verificador de hallazgos —la cura
que F-22 fijó, en producción desde el 23/08— filtra lo que el juez DICE mal; no puede
recuperar lo que NO DICE.

3.5 · RESERVAS, declaradas: los 52 análisis son casi todos repeticiones del mismo
documento, así que la mezcla mide nuestras pruebas y no un corpus de cliente. Y el
corpus de pruebas no trae comillas curvas ni apenas tablas de Word, porque lo
fabricamos nosotros: es la cuarta vez que el instrumento no puede fallar donde debería
(B.121, B.125, B.129).

════════════════════════════════════════════════════════════════
4. LAS PREGUNTAS
════════════════════════════════════════════════════════════════

P1 — APLICANDO TU PROPIO CRITERIO DE P6, ¿PARTE DE FRENTE 4 DEJA DE SER DECLARABLE?
El criterio dice: bloqueante todo lo que hace falso lo mostrado O PIERDE UN JUICIO DEL
USUARIO. El 3.3 es exactamente eso: el usuario marca «no es error», el juez parafrasea
en el siguiente análisis y el producto le devuelve lo que ya cerró. No es un límite de
cobertura: es olvidar una decisión suya.
Y la declaración exigía contadores y avisos —«sin ellos no está declarado y entonces
sí bloquea»—. No existen: nada cuenta las contradicciones verdaderas que se tiran, y
el usuario no ve aviso alguno.
La pregunta no es si las citas por referencia son la cura, que ya lo decidiste. Es si,
con 3.2 y 3.3 encima de la mesa, Frente 4 sigue siendo post-MVP, o si al menos la
mitad de identidad —que la huella del descarte deje de depender de las palabras del
modelo— se adelanta.

P2 — ¿SE ACTIVA EL MÓDULO INTERINO QUE B.107 YA AUTORIZÓ?
B.107 lo contempla: «MÓDULO INTERINO, si hace falta antes: una normalización de
BÚSQUEDA DE CITAS (solo findBestMatch, nunca el normalize global — regla de F-46) que
agrupe las glosas entre corchetes y el quince/15 de F-77, con batería conjunta.
ETIQUETADO COMO DESTINADO A MORIR.» Y manda cruzarlo con F-77 commit 1, que quedó sin
hacer.
Recuperaría los 7 lados de la glosa, que es un hallazgo verdadero con la glosa
acertada. ¿Hace falta ahora, o sigue siendo andamio que no toca poner?
NO se pide ampliar NARRATION_PATTERNS, que B.107 rechaza explícitamente.

P3 — LA API DE CITATIONS DE ANTHROPIC: B.107 dice «evaluar si encaja antes de
construir lo propio», y esa evaluación NO SE HA HECHO. ¿Sigue siendo el primer paso de
Frente 4, o se descartó por algo que no está escrito?

P4 — LO QUE EL JUEZ NO DICE (3.4). Las citas por referencia curan lo que escribe mal;
no curan lo que no escribe. La salida obvia —dos pasadas del juez y unión— duplica el
coste por análisis, y es decisión comercial del director. ¿Hay otra, o al menos una
forma de que la pérdida deje rastro para poder medirla?

P5 — ¿ESTÁ DESBLOQUEADO EL ARREGLO DEL RERANK? B.89 fijó que saltárselo cuando hay
menos candidatos que plazas tenía que ir DESPUÉS del verificador de hallazgos. El
verificador está en producción desde el 23/08, y comprobado el 06/10:
rerankCandidates solo se salta con cero candidatos (rerank.ts:33-45), así que el
arreglo no está construido. Es donde B.83 localizó que muere un verdadero positivo:
«Retrieval: 2 candidatos. Rerank: 0 seleccionados».

════════════════════════════════════════════════════════════════
5. LO QUE NO SE PREGUNTA, PARA NO ABRIR FRENTES
════════════════════════════════════════════════════════════════

- Las tablas de Word sin estructura de fila: van al paso 5, con el criterio de cierre
  de B.92.
- La cuarta forma de B.107 (el prefijo «[F0]» copiado): su ficha dice que no necesita
  Frente 4 y que no se toca hasta medir cuánto pesa. Sigue así.
- Los 14 documentos del corpus del piloto sin trozos: limpieza, y reindexar cambia la
  línea base.
- La prioridad del director es CERRAR el frente de la calidad del análisis antes de
  enseñar el producto a un cliente de pago.

## (c.2) Párrafo de sustitución, 06/10/2026, 08:58 UTC

Pegado por el arquitecto tras la propuesta de Code de las 08:13 UTC, que pedía no afirmar que
el juez «cosió» dos apartados porque lo medido no lo distingue de una «y» cambiada por una
coma. Code contestó a las 08:59 que el párrafo estaba bien y se podía enviar así. No se ha
tocado.

  · 1 lado / 1 cita — LA CITA NO EXISTE COMO PASAJE SEGUIDO EN EL DOCUMENTO. Es
    «Papel, cartón, envases sin contaminar no van a ningún contenedor específico del
    gabinete: se llevan al contenedor de basura convencional de la zona común del
    centro», atribuida a CLI-13. En CLI-13 coincide con la chuleta del apartado 8 en
    sus 38 primeros caracteres —«Papel, cartón, envases sin contaminar »— y con el
    apartado 3.4 desde «envases» hasta «del centro», porque el 3.4 dice «Papel,
    cartón Y envases». Es tanto el 3.4 con la «y» cambiada por una coma como el
    principio de un apartado cosido al cuerpo de otro, y lo medido NO DISTINGUE CUÁL.
    EL EFECTO SÍ ESTÁ MEDIDO: la cabeza normalizada «papel cartón envases» solo
    aparece en la posición 7.939 (la chuleta) y la cola «ona común del centro» solo en
    la 3.090 (el 3.4), ANTES de la cabeza. La puerta busca la cola detrás de la cabeza,
    no la encuentra, y la cita no existe seguida en ninguna parte del documento.
    Y el prompt lo prohíbe con esas palabras — judge.ts:834: «PROHIBIDO unir trozos
    que vengan de sitios distintos del documento», y en la misma línea «PROHIBIDO
    cortarla por dentro, resumirla, quitarle palabras del medio».
    Reserva: medido contra el texto del extractor, no contra el bloque exacto que se
    armó para el juez.

---

# (d) RESPUESTA RECIBIDA — NO CONSTA

⚠️ **El dictamen de Fable a F-120 no está en el repositorio ni en el historial de la
conversación.** No se reconstruye: una falta declarada vale más que un texto inventado.

Lo único que consta de él son **referencias de terceros**, que NO son texto de Fable y se
listan sólo para que quien lo recupere sepa qué buscar:
- **Su P1, según la consulta F-121** (punto 5, escrito por el arquitecto): un segmentador
  determinista que parte los dos documentos en pedazos etiquetados [A.n] y [C.n]; el juez
  señala en vez de copiar; un ancla de 4 o 5 palabras; el sistema toma el texto de su propio
  fichero; si etiqueta y ancla no coinciden, se repara preguntando otra vez; la glosa en un
  campo aparte. «Menos del 8 % más de tokens de entrada», y el argumento de que «los modelos no
  cuentan caracteres» (entre comillas en F-121, atribuido a Fable).
- **Tres encargos de medición**, según el encargo del arquitecto a Code del 06/10 a las 09:10
  UTC: uno en P2 (¿pérdida o reclasificación?, con la predicción «SÍ aparecerán, como examinadas
  o como solapamientos reclasificados»), uno en P3 (la alarma del rerank, predicción «más de
  uno») y uno en P1 (el grupo `sin_cabeza` por similitud, predicción «la mayoría son paráfrasis
  de una frase real, no invenciones»). Ver (h).
- **Su P2, según F-121**: la extracción de afirmaciones por documento al indexar («F-120 P2
  respuesta 3») y «lo barato de F-120 P2»: que el juez entregue la lista de datos compartidos
  que comprobó, y medir el coste de la segunda pasada con caché de prompt.
- **Su P5**: el arreglo del rerank sigue sin construir (B.344 de `Puntos_Pendientes_Doclity.txt`
  lo cita como «F-120, P5»).
- **La predicción de las 11 citas etiquetadas por el director** («7 o más verdaderas»): F-121
  la da como «pendiente desde F-120» (su P-F121-10).

---

# (e) PREDICCIONES REGISTRADAS

⚠️ **No constan como texto de Fable.** Las tres que se conocen llegan por el encargo del
arquitecto del 06/10 (ver (d)), y la cuarta por F-121:

- **P2 · pérdida o reclasificación**: las dos contradicciones que faltan en la pasada del 05/10
  a las 12:07 de Madrid aparecerán como examinadas o como solapamientos reclasificados, no como
  ausentes. *Estado*: sin medir; `SQL_F120_P2_perdida_o_reclasificacion.sql`, sin resultado que
  conste.
- **P3 · la alarma del rerank**: más de un análisis desde el 02/10 con el rerank a cero y
  candidatos. *Estado*: sin medir; `SQL_F120_P3_rerank_a_cero.sql`, sin resultado que conste.
- **P1 · el grupo `sin_cabeza`**: la mayoría son paráfrasis de una frase real, no invenciones.
  *Estado*: **medida por Code el 06/10 (ver (h))**, con veredicto pendiente del arquitecto: de las
  4 citas que se pudieron medir, ninguna es invención, pero tampoco paráfrasis: las cuatro son
  frases reales del OTRO documento del par.
- **Las 11 citas etiquetadas por el director: 7 o más verdaderas.** Sigue en F-121 como
  P-F121-10. *Estado*: sin medir.

---

# (f) PRECISIONES

- **Las citas literales de las cuatro mal atribuidas son TRES**, como dice la versión de las
  08:12. El «DOS» del borrador de las 07:41 pasó por error a B.358 y de ahí a la consulta F-121;
  B.358 está corregida (07/10/2026) y F-121 (f) lo anota.
- **El texto de (c.1) dice «La cuarta, además, cambia «Todo el personal clínico y auxiliar» por
  «El personal clínico y auxiliar»»**: es la cita (i) de la comparación de Code.

---

# (g) MEDICIONES CANDIDATAS

Las tres de (e) que dependen de la base: **P2 y P3 escritas como SQL y PENDIENTES DE EJECUTAR**
(sin resultado que conste a 07/10/2026); **P1 hecha** por Code. Lo de P2 que F-121 recoge como
«lo barato» (la lista de datos compartidos y el coste de la segunda pasada) está en el plan de
F-121 (B.362) y **NO INICIADO**.

---

# (h) ENCARGOS DE FABLE, CONTESTADOS POR CODE

**1 · El grupo `sin_cabeza`, por similitud aproximada de palabras** (encargo en P1). ✅
**CONTESTADO por Code el 06/10/2026 a las 09:12 UTC**, en la conversación y sin registro en
ningún fichero hasta hoy. Resultado, en cifras: de las 5 citas del grupo se midieron 4 (la quinta
no estaba disponible). Las cuatro están **al 100 % en el OTRO documento del par** —tres literales
y una con «El» donde el documento dice «Todo el»— y entre un **27 % y un 50 %** en el documento
donde el juez las puso, por palabras sueltas del tema: (h) 27 %, (c) 32 %, (j) 38 %, (i) 50 %.
El mecanismo es el documento equivocado, no la paráfrasis.

**2 · ¿Pérdida o reclasificación?** (encargo en P2). Code no pudo contestarlo sin la base: dejó la
consulta, que pasó a `SQL_F120_P2_perdida_o_reclasificacion.sql` (`6fdbb48c`). **Sin resultado que
conste.**

**3 · La alarma del rerank** (encargo en P3). Igual: `SQL_F120_P3_rerank_a_cero.sql`
(`6fdbb48c`). **Sin resultado que conste.**
