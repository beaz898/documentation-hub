# MEDIDA B.357 — El destino de las tres contradicciones sembradas (NOR-11 ↔ CLI-13)

> ⚠️ **EVIDENCIA RESCATADA DE UNA FUENTE QUE YA NO EXISTE.**
> Esta tabla se obtuvo de `analysis_results` el **10/10/2026 a las 00:11 (hora de Madrid)**.
> Minutos después, el director borró `NOR-11` y `NOR-10` de la aplicación —los había
> indexado sin querer y los volvió a subir a Drive para tenerlos en la bandeja de
> revisión—, y **al borrar el documento se borraron en cascada todos sus análisis**.
> Las diez filas de abajo **ya no se pueden volver a consultar**. Este fichero es la
> única copia. No se modifica: si hay que corregir algo, se añade debajo con su fecha.

## De dónde sale

SQL ejecutado por el director sobre `public.analysis_results` de la organización del
piloto, desplegando `analysis->'judgments'` y quedándose con las parejas cuyo
`documentName` empieza por `CLI-13`. Ventana: 06/10/2026 00:00 UTC a 10/10/2026 00:00 UTC.

Control de la consulta: `parejas_con_cli13 = 10`, `analisis_distintos = 10`,
primera `2026-10-06 07:00:06.819384`, última `2026-10-08 21:48:07.68479`.

## La tabla, literal

| hora UTC | análisis | sobreviven | temas | puerta mató | puerta temas | discarded (crudo) | solapamientos | exclusivo | publicadas |
|---|---|---|---|---|---|---|---|---|---|
| 06/10 07:00:06 | 07270f02 | 2 | Plazo máximo de almacenamiento de residuos grupo III \|\| Color del contenedor para residuos grupo III no punzantes | 1 | Ubicación del punto de retirada centralizado [falló nuevo] | `{"citaNoVerificable": 1, "confirmado.por_juicio": 2, "verificado.por_localizacion": 14}` | 5 | 13 | PLAZO \|\| NEGACIÓN |
| 06/10 07:02:31 | 7f1e9abe | 2 | Plazo máximo … \|\| Color del contenedor … | 1 | Ubicación del punto de retirada centralizado [falló nuevo] | `{"citaNoVerificable": 1, "confirmado.por_juicio": 2, "verificado.por_localizacion": 14}` | 5 | 8 | PLAZO \|\| NEGACIÓN |
| 06/10 10:29:47 | e5413b2d | 1 | Plazo máximo … | 0 | — | `{"confirmado.por_juicio": 1, "verificado.por_localizacion": 12}` | 5 | 10 | PLAZO |
| 06/10 10:31:28 | 0f2a4f14 | 1 | Plazo máximo … | 0 | — | `{"confirmado.por_juicio": 1, "verificado.por_localizacion": 12}` | 5 | 10 | PLAZO |
| 07/10 08:54:11 | c30f0d82 | 2 | Plazo máximo … \|\| Contenedor para residuos grupo III no punzantes | 1 | Ubicación del punto de retirada centralizado [falló nuevo] | `{"citaNoVerificable": 2, "confirmado.por_juicio": 2, "verificado.por_localizacion": 18}` | 7 | 10 | PLAZO \|\| NEGACIÓN |
| 07/10 08:55:54 | 8a27c1e9 | 1 | Plazo máximo … | 0 | — | `{"confirmado.por_juicio": 1, "verificado.por_localizacion": 18}` | 8 | 10 | PLAZO |
| 07/10 08:56:39 | c55f3a0c | 1 | Plazo máximo … | 0 | — | `{"confirmado.por_juicio": 1, "verificado.por_localizacion": 22}` | 10 | 9 | PLAZO |
| 07/10 08:57:28 | 666dc781 | 1 | Plazo máximo … | 0 | — | `{"citaNoVerificable": 1, "confirmado.por_juicio": 1, "verificado.por_localizacion": 20}` | 9 | 10 | PLAZO |
| 07/10 08:58:34 | fe328628 | 1 | Plazo máximo … | 0 | — | `{"confirmado.por_juicio": 1, "verificado.por_localizacion": 22}` | 10 | 11 | PLAZO |
| 08/10 21:48:07 | 594b5ad6 | 1 | Plazo máximo … | 0 | — | `{"citaNoVerificable": 1, "confirmado.por_juicio": 1, "verificado.por_localizacion": 16}` | 7 | 10 | PLAZO |

`sobreviven` = contradicciones del juicio guardado. `publicadas` = las de
`analysis->'discrepancies'` con `existingDocument` = CLI-13. Las tres trampas son
PLAZO (plazo de almacenamiento, 72 h vs 7 días), LUGAR (punto de retirada, Chamberí vs
Retiro) y NEGACIÓN (color del contenedor, amarillo con prohibición expresa vs negro).

## Lo que dice, y es medida, no interpretación

**Son DIEZ pasadas, no ocho.** Cuatro el 06/10, cinco el 07/10 y una el 08/10. Las
cifras que el arquitecto venía repitiendo (PLAZO 8/8, LUGAR 4/8, NEGACIÓN 2/8) eran un
recuento equivocado. Las reales:

| trampa | el juez la dice | la mata la puerta | se publica |
|---|---|---|---|
| PLAZO | 10 de 10 | nunca | **10 de 10** |
| NEGACIÓN | **3 de 10** | nunca | 3 de 10 |
| LUGAR | 3 de 10 | **3 de 3** | **0 de 10** |

1. **Es todo o nada.** Las 3 pasadas con NEGACIÓN son exactamente las 3 con LUGAR
   (06/10 07:00, 06/10 07:02, 07/10 08:54). En las otras 7 no hay rastro de ninguna de
   las dos en ninguna etapa. El juez no gradúa por dificultad: o emite las tres, o
   emite solo la fácil.
2. **La cascada no mata nada.** `discarded` llega como objeto en las 10, así que los
   ceros son ceros reales. No hay ni una clave de descarte: solo `confirmado.*`,
   `verificado.*` y `citaNoVerificable`. La frontera tampoco tira nada y nada se
   reclasifica a solapamiento.
3. **La síntesis no pierde nada.** `sobreviven` y `publicadas` coinciden tema por tema
   en las 10 filas. Etapa que nunca se había mirado, y está limpia.
4. **LUGAR muere siempre con `ladoFallido = nuevo`**: falla la cita del documento
   NUEVO, no la del existente. Es el dato que justifica la vía 2 con medida: con
   etiquetas numeradas en vez de copia literal, esas 3 se habrían publicado.
5. **Inestabilidad del juez, y es la pérdida dominante.** El 07/10 hubo cinco pasadas
   en cinco minutos (08:54 a 08:58), con el corpus y el documento sin cambiar. La
   primera emitió las tres; las cuatro siguientes, solo PLAZO. No es dificultad de la
   trampa ni profundidad en el texto: es varianza entre ejecuciones idénticas.

## La cuenta que descarta el atajo

Si una pasada emite las tres el 30 % de las veces, dos pasadas dan 51 %, tres dan 66 %,
y para llegar al 80 % que pide el criterio de cierre harían falta **cinco llamadas al
juez por pareja**. Repetir a lo bruto cuesta cinco veces y no alcanza el criterio.

## Lo que queda abierto

- Por qué el juez es exhaustivo unas veces y mínimo otras, con la misma entrada. Es el
  frente principal y es prompt y estrategia, no código.
- Cómo acotar la salida del juez por construcción (B.366), medido el 09/10: con dos
  documentos casi duplicados escribió 22 solapamientos pese al «máximo 10» del prompt,
  y 48 entradas en `uniqueToNewDoc`, que no tiene tope.
- **La línea base ya no existe.** Para volver a comparar hay que reindexar NOR-11 y
  medir una línea base nueva antes de cambiar nada.

## Lección de proceso (10/10/2026)

**Borrar un documento en la aplicación borra en cascada todo su historial de análisis.**
Hoy se perdieron diez pasadas que eran la línea base de toda la investigación del juez.
Antes de borrar un documento que haya servido para medir, hay que extraer y guardar sus
medidas. La aplicación no avisa de esto.

---

> **Añadido el 13/10/2026 (arquitecto).** Este fichero se escribió en el proyecto de Claude el
> 09-10/10/2026 y hasta hoy NO estaba en el repositorio. Se trae aquí porque es la única copia de
> diez pasadas que no se pueden volver a consultar. Code comprobó el 13/10 que no existía ni en el
> árbol ni en el historial de git. Su punto 5 —la primera de cinco pasadas idénticas emite las tres
> y las cuatro siguientes solo PLAZO— es el mismo patrón que la medida de la fase 3.1 del 13/10:
> la primera de siete emite las tres y las seis siguientes dos. Queda anotado como observación a
> medir, no como causa.
