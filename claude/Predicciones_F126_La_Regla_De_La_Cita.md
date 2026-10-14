# Predicciones y medida de F-126 — la regla de la cita

> **De dónde sale este fichero.** Lo escribió el arquitecto en el proyecto de Claude el 14/10/2026 y
> se trae al repositorio el mismo día porque es el registro de la medida que cerró el frente de la
> puerta de citas: la salida de `SQL_F126_01_la_medida_de_la_regla_nueva.sql`, ejecutada por el
> director sobre las siete pasadas de NOR-11 de la mañana del 14/10. Es reproducible —el SQL está en
> el repositorio y los análisis en la base—, pero se archiva igual. **Compactación declarada** donde
> las filas se repiten palabra por palabra. Texto tal como lo pasó el arquitecto.
>
> Las predicciones escritas antes de medir están en la sección (e) del archivo de F-126
> (`claude/consultas-fable/F-126_2026-10-13_la-regla-de-la-cita.md`) y en el encargo de
> `SQL_F126_01`. La calificación del arquitecto, del 14/10: **siete de las ocho aciertan; falla la de
> la mediana (182,5 → 167,0, no bajó de 150), y falla porque toda la bajada venía de LUGAR: PLAZO
> quedó en 141,0 y NEGACIÓN en 190,0, idénticas, porque el juez ya las citaba bien.**

---

CONTROLES: todos OK. 7 pasadas en la ventana nueva, 7 en la vieja, **0 en el hueco de la noche**,
los seis contadores presentes en las siete, y contradictions_found = publicadas en las siete (3=3).

CENSO (14/10, hora de Madrid, todas 3/3 con LUGAR + NEGACIÓN + PLAZO):
  nueva 1 · 08:28:55 · 1785474f-f8bb-43e5-874c-9d7c412c52da
  nueva 2 · 08:29:57 · c60f25ac-9b63-4e7d-8c6e-781405791361
  nueva 3 · 08:33:12 · 2588e8c6-4633-4e7f-a18c-1750ec57938e
  nueva 4 · 08:37:24 · 5a2b8379-c59b-457c-9d0e-9eb1c7bdcdae
  nueva 5 · 08:38:08 · 34b1fedf-f6a0-4442-b6e8-f53443f7c6ce
  nueva 6 · 08:39:58 · 65bfe61c-347d-4ab7-b011-0c90153a0259
  nueva 7 · 08:46:38 · fbd0bf7e-ba9b-4271-821c-da21a69b31f0

PUBLICADAS · compactación declarada: las tres salen palabra por palabra iguales en las siete
pasadas, todas con `confirmedBy: juicio` y `marca recompuesta: no`.
  PLAZO · longitudes nuevo 154, existente 128
    NUEVO: «los contenedores de residuos del grupo III no pueden permanecer en el área de
    almacenamiento intermedio más de 72 horas desde el momento en que se cierran»
    EXISTENTE: «ningún contenedor de residuos del grupo III debe permanecer en el almacén
    intermedio más de 7 días naturales desde que se cierra»
  LUGAR · longitudes nuevo 133, existente 180
    NUEVO: «El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada
    centralizado, ubicado en la clínica de Chamberí»
    EXISTENTE: «El punto de retirada centralizado para las tres clínicas de la red se encuentra en
    la clínica de Retiro, que es el centro de referencia logística de residuos sanitarios de
    Dentavia»
  NEGACIÓN · longitudes nuevo 185, existente 195
    NUEVO: «el resto de residuos biosanitarios especiales no punzantes (gasas, guantes, apósitos),
    que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de cada
    gabinete»
    EXISTENTE: «Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado
    en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado
    en cada gabinete»

CONTADORES DEL TRAMO: los seis a CERO en las siete pasadas. Compactación declarada: filas idénticas.

citasAlTramo: «ninguna cita llegó al tramo, en ninguna de las pasadas de la ventana nueva».

MEDIANA de las citas publicadas (contradicciones, los dos lados, por ventana):
  vieja  TODAS: n 30 · mediana 182,5 · mínimo 128 · máximo 267
  nueva  TODAS: n 42 · mediana 167,0 · mínimo 128 · máximo 195
  vieja  LUGAR: n 2 · 223,5 (180-267) · NEGACIÓN: n 14 · 190,0 · PLAZO: n 14 · 141,0
  nueva  LUGAR: n 14 · 156,5 (133-180) · NEGACIÓN: n 14 · 190,0 · PLAZO: n 14 · 141,0
  ⚠️ La predicción de Fable era «baja de 150» y FALLA. Toda la bajada viene de LUGAR: PLAZO y
  NEGACIÓN no movieron un carácter porque el juez ya las citaba bien. Un indicador agregado puede
  fallar mientras el mecanismo acierta.

CITA PUBLICADA MÁS CORTA: 128 caracteres, el lado existente de PLAZO, en las siete pasadas. No
apareció ningún fragmento de 40: el riesgo de publicar citas correctas pero ilegibles no se
materializó en esta pareja.

SOLAPAMIENTOS PUBLICADOS (puntos del juez por pasada):
  vieja: 9, 8, 7, 8, 9, 9, 8 → mediana 8, suma 58
  nueva: 8, 7, 7, 8, 8, 8, 7 → mediana 8, suma 53
  No bajan de forma clara; el estrechamiento (9 máximo a 8) queda anotado.

TRAMPAS DE paso: `paso=recompuesta` 0 · `paso=segmentos_de_fila` 0 · 10 lados de descarte leídos.
