# Predicciones de las pasadas de NOR-11 — F-125 fase 3.1

Escritas el 13/10/2026 a las 11:42, ANTES de lanzar la primera pasada. Despliegue de 0ab6e7d6 en
verde a las 11:37 Madrid. Resultado añadido el 13/10 a las 12:40, sin tocar una sola palabra de lo
predicho.

Se escribieron antes para que ninguna pudiera reinterpretarse después de ver el resultado. Una
predicción que falla es información; una predicción que se reescribe no es nada.

## Condiciones de la medición

Mismo documento (NOR-11), misma dirección, sin cambiar nada entre pasadas, corpus intacto. Pareja
con CLI-13 en pareja_entera, 14.704/14.704 y 9.817/9.817, modo rápido. Fueron SIETE pasadas, no
seis (11:43:20 a 11:56:43 Madrid); el control del SQL lo cazó y lo dijo: «esperado 6, medido 7».

## El marcador

| | PLAZO | NEGACIÓN | LUGAR | marcador |
|---|---|---|---|---|
| Pasada 1 · 11:43:20 | sí | sí | sí | 3/3 |
| Pasadas 2 a 7 | sí | sí | no | 2/3 |

LUGAR: 1 de 7. PLAZO y NEGACIÓN: 7 de 7. Falsos positivos: 0.

NEGACIÓN es el caso del color del contenedor, confirmado leyendo SIEMBRA_caso_control.md: son tres
casos sembrados, no cuatro, y cualquier otra contradicción entre esos dos documentos sería un falso
positivo.

## Las siete predicciones

| | Qué decía | Resultado |
|---|---|---|
| P-ARQ-F125-1 | LUGAR 5 de 6 o más, con las frases reales, nunca el empalme | FALLA en el número (1 de 7). ACIERTA en lo demás: cuando salió, salió con las dos frases reales y nunca el empalme |
| P-ARQ-F125-2 | PLAZO y NEGACIÓN 6 de 6 | ACIERTA · 7 de 7 las dos |
| P-ARQ-F125-3 | cero falsos positivos | ACIERTA · 0 en siete pasadas |
| P-ARQ-F125-4 | citas_recompuestas >= 1 por pasada, en_trozos_distintos = 0 | FALLA la primera mitad (1 en la pasada 1, 0 en las otras seis). ACIERTA la segunda: 0 en las siete |
| P-ARQ-F125-5 | mis guardas de D4 a cero | ACIERTA 7/7 · bloqueadas_al_reclasificar 0 y sin_contexto_del_resto 0 siempre. No es la protección la que mata a LUGAR |
| P-ARQ-F125-6 | el registro no miente | ACIERTA · el log dice paso=recompuesta; 0 filas con segmentos_de_fila sobre 18 lados de descarte leídos |
| P-ARQ-F125-7 | tres de tres en 5 de 6 o más | FALLA · tres de tres en 1 de 7 |

## El censo, literal

  1 · 11:43:20 Madrid · 612a9301-676a-45c7-a195-75cc30b229de · cf 3 · LUGAR+NEGACIÓN+PLAZO · 3/3
  2 · 11:51:41 · 5a6ca9c5-9637-409c-bfb5-8c0eecec1142 · cf 2 · NEGACIÓN+PLAZO · 2/3
  3 · 11:53:24 · e4063c85-79a3-434f-a024-4504b674e17a · cf 2 · NEGACIÓN+PLAZO · 2/3
  4 · 11:54:19 · 652ec549-1c6c-45af-8688-74171247079f · cf 2 · NEGACIÓN+PLAZO · 2/3
  5 · 11:55:10 · 154d591e-06f5-4c85-adc3-ce0accc9b699 · cf 2 · NEGACIÓN+PLAZO · 2/3
  6 · 11:55:54 · 4642eb9d-0ec2-4f3b-bf1a-e158893a3833 · cf 2 · NEGACIÓN+PLAZO · 2/3
  7 · 11:56:43 · dd7e41ae-1bcc-47ca-bdfd-8d39f5e1d668 · cf 2 · NEGACIÓN+PLAZO · 2/3
  Resto del control: OK en todo lo demás — los seis contadores presentes en las siete pasadas, la
  columna buena presente en las siete, y contradictions_found = publicadas en las siete.

## citasAlTramo, el registro que manda, literal y entero

  1 · recompuesta · hash ebe45632 · lado nuevo · longitud de la cita 206 ·
      ancla 7555-7683 · resto 8277-8353 · distancia 722 · trozos 8/8
      FRASE DEL ANCLA: «El gestor autorizado recoge los residuos de las tres clínicas en un punto
      de retirada centralizado, ubicado en la clínica de Chamberí, desde donde se coordina y
      documenta el transporte del material recogido en Salamanca y Retiro hasta su destino final de
      tratamiento.»
      FRASE DEL RESTO: «Dado que el punto de retirada centralizado concentra el material de las
      tres clínicas, cada centro coordina con antelación la fecha de solicitud de retirada con
      Dirección de Operaciones, evitando que dos clínicas soliciten transporte del material
      recogido en el mismo día si ello satura la capacidad logística del gestor autorizado.»
  2 · resto_insuficiente · hash 976f6174 · nuevo · longitud 111 · ancla 8277-8353 · resto 33
  3 · resto_insuficiente · hash 976f6174 · nuevo · longitud 111 · ancla 8277-8353 · resto 33
  4 · resto_insuficiente · hash d6fb570d · nuevo · longitud 111 · ancla 8277-8353 · resto 33
  5 · resto_insuficiente · hash 976f6174 · nuevo · longitud 111 · ancla 8277-8353 · resto 33
  6 · resto_insuficiente · hash 976f6174 · nuevo · longitud 111 · ancla 8277-8353 · resto 33
  7 · resto_insuficiente · hash 976f6174 · nuevo · longitud 111 · ancla 8277-8353 · resto 33

Las posiciones 8277-8353 que en la pasada 1 son el RESTO son el ANCLA en las otras seis, y su frase
real es la de «coordinar fechas», que no menciona Chamberí.

## Los contadores del tramo

  Pasada 1: recompuestas 1 · en_trozos_distintos 0 · empalme_multiple 0 · sin_tramo_literal 0 ·
            bloqueadas_al_reclasificar 0 · sin_contexto_del_resto 0
  Pasadas 2 a 7: los seis a CERO. Compactación declarada: las seis filas son idénticas.

## Las citas publicadas

Compactación declarada: PLAZO y NEGACIÓN salen palabra por palabra iguales en las siete pasadas y
se transcriben una vez. LUGAR sale solo en la pasada 1 y va entera.

  PLAZO · confirmedBy juicio · marca recompuesta: no
    NUEVO (154 car.): «los contenedores de residuos del grupo III no pueden permanecer en el área
    de almacenamiento intermedio más de 72 horas desde el momento en que se cierran»
    EXISTENTE: «ningún contenedor de residuos del grupo III debe permanecer en el almacén
    intermedio más de 7 días naturales desde que se cierra»
  NEGACIÓN · confirmedBy juicio · marca recompuesta: no
    NUEVO (185 car.): «el resto de residuos biosanitarios especiales no punzantes (gasas, guantes,
    apósitos), que se depositan en bolsa de color amarillo dentro del contenedor correspondiente de
    cada gabinete»
    EXISTENTE: «Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado
    en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado
    en cada gabinete»
  LUGAR · solo pasada 1 · confirmedBy juicio · marca recompuesta: SÍ (lado nuevo)
    NUEVO publicado: la FRASE REAL entera con Chamberí (la del ancla, arriba)
    EXISTENTE publicado: «El punto de retirada centralizado para las tres clínicas de la red se
    encuentra en la clínica de Retiro, que es el centro de referencia logística de residuos
    sanitarios de Dentavia»
    CITA DEL JUEZ (nuevo), la que NO se publicó: «El punto de retirada centralizado concentra el
    material de las tres clínicas, ubicado en la clínica de Chamberí, desde donde se coordina y
    documenta el transporte del material recogido en Salamanca y Retiro»

## Las trampas de paso

  paso=recompuesta: 0 · paso=segmentos_de_fila: 0 · lados de descarte leídos: 18.
  El 0 de paso=recompuesta es correcto y no un fallo: el lado recompuesto de la pasada 1 se
  PUBLICÓ, y descartesPorCita solo guarda lados de hallazgos descartados.

## La lectura, corregida

La primera lectura del arquitecto fue que el suelo de 40 caracteres mataba a LUGAR y había que
bajarlo. Es falsa, y la corrige el propio dato: en la cita de 111 el ancla es el trozo de 76
caracteres, cuya frase real es la de coordinar fechas. Bajar el suelo habría publicado esa frase
—que no dice nada del lugar— como prueba de la contradicción de ubicación, seis veces de siete.

La conclusión honesta es la contraria de la que parecía: (B) hizo lo correcto las siete veces.
Rescató una vez, bien, con la frase buena; y se negó seis veces, bien, porque en la cita de 111 no
había nada que rescatar: ninguna frase de NOR-11 dice lo que esa cita afirma. El juez la fabricó
soldando dos sitios que no tienen relación.

El techo de 1 de 7 no lo pone la puerta. Lo pone el juez.

## Lo que esta medición no cierra

El caso de empalme falso sembrado, que exige el criterio de Fable, sigue sin existir en el corpus.
La fase 3.1 queda cerrada a falta de ese caso, y se dice así.
