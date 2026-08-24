# F-47 — Cierre del frente de recuperacion y adelanto del paso 5

## Veredicto de Fable

La asimetria de presentacion es la explicacion, y ahora es la UNICA en pie —
esa es la diferencia con F-37, cuando era una hipotesis entre tres. Tres
semanas de mediciones han eliminado a los demas candidatos uno a uno, cada
uno con su numero. Lo que queda no es la hipotesis favorita: es la
superviviente.

El dato que la firma: 2,3 segundos contra 10 de la direccion inversa. Es un
modelo que no encontro nada que comparar, no uno que comparo y dudo.

El mecanismo: la direccion funciona cuando la fila discrepante esta del lado
ETIQUETADO (las preguntas) y falla cuando esta diluida en el bloque corrido
(donde se busca). RRHH-06 como analizado funciona no por sus 5.061
caracteres, sino porque su fila de Reyes no necesita ser encontrada — la del
candidato OPE-02 llega senalizada.

No se declara probado: lo declara la prueba ya definida. Si tras la simetria
el par se detecta en ambas direcciones con 1 candidato, era esto. Si no,
habra por primera vez un fallo con todas las demas causas excluidas por
medicion.

## El frente de recuperacion, entregado

Prometia una cosa: que la evidencia llegue al juez. Medido que llega. Que el
juez la reconozca nunca fue recuperacion.

Lo conseguido, que es mas que el caso: el reparto por unidades con niveles
declarados, el colapso de identicas, el solapamiento estructural con
porcentaje calculado, la pertenencia por valor, y un retrieval que dice que
decide.

El par queda como banco de pruebas del paso 5, con su condicion dura:
AMBAS DIRECCIONES, PAR AISLADO, 1 CANDIDATO.

## El paso 5 se adelanta

Orden nuevo: paso 5 → remedicion y cierre de B.81 → 4c → B.83 → paso 6.

El orden anterior (4c → B.83 → paso 5) se fijo cuando el paso 5 era la pieza
grande sin urgencia. Ha cambiado un punto: hay un defecto VISIBLE PARA EL
CLIENTE cuya unica explicacion restante espera al paso 5. Una contradiccion
real que aparece o no segun que documento abras es el tipo de incoherencia
que un piloto comercial no puede ensenar. 4c mejora al agente y B.83 ahorra
una llamada: ninguno arregla nada que un cliente vea roto.

Es la regla de siempre: causa antes que sintoma, lo visible antes que lo
interno.

## Especificacion del paso 5, acumulada por el camino

- **Simetria de presentacion** (F-37/F-38): el documento analizado como
  chunks etiquetados desde `newDocumentChunks`, con seleccion por
  presupuesto en vez del truncado a 6.000.
- **Citas estructuradas** `{sheet, rowKey, cells}` con verificacion contra
  celdas y retirada de la localizacion por texto (F-19/F-30). CRITERIO DE
  CIERRE: no esta terminado hasta que se borre `splitTabularSegments` y la
  via por segmentos de `verifyQuote`.
- **Localizacion de chunk para el camino atomico** (F-34).
- **Prompt en system + datos**, con el breakpoint de cache tras el documento
  nuevo y cebado del primer juicio (F-33).
- **Regla explicita sobre fragmentos no citables** (F-46) — hoy la marca
  `[CONTEXTO — no citar]` vive en un vacio normativo.
- **Frontera de `llm-boundary`** para los campos nuevos (F-39).

## Tests del paso 5

1. El par en ambas direcciones, aislado, 1 candidato.
2. La bateria del harness completa.
3. Remedicion contra la linea de base, con atribucion limpia.

Es el paso mas grande del plan, pero por primera vez no tiene ninguna
incognita de diseno delante: solo ejecucion, por fases y con build verde.

## Restriccion vigente hasta el primer commit del paso 5

No tocar el prompt a trozos. A partir del primer commit, tocarlo entero es
el trabajo.
