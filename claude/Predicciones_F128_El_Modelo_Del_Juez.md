# Predicciones de F-128 — el modelo del juez: Haiku 5.5 frente a Haiku 4.5

> **Escritas por el arquitecto el 19/10/2026, ANTES de construir el interruptor y antes de lanzar
> ninguna pasada.** No se reescriben después: una que falla se califica como fallada y se explica
> debajo, con su fecha.
>
> **Qué se mide.** El juez con `claude-haiku-5-5` en lugar de `claude-haiku-4-5-20251001`, y **sólo
> el juez**: el rerank, el verificador, la síntesis, el double-check y el agente siguen con su modelo
> de hoy, para que si el resultado se mueve se sepa qué lo movió. El dial de esfuerzo de Haiku 5.5,
> fijado y escrito en el código antes de medir (estado vivo, 3.1.8, advertencia 3): `medium`.
>
> **Cómo se enciende.** La variable de entorno `ANALYSIS_JUDGE_MODEL=claude-haiku-5-5` en Vercel, y
> un despliegue. Las pasadas rápidas corren en Vercel, así que no hace falta tocar Railway. Para
> volver a Haiku 4.5, quitar la variable y desplegar. Cada pareja guarda con qué modelo se juzgó en
> `lecturaDeLasParejas[].modelo`.
>
> ⚠️ **CONFUNDIDO DECLARADO, ANTES DE MEDIR (arquitecto, 19/10/2026): la prueba NO es un A/B
> limpio.** Haiku 4.5 corre a `temperature` 0,1, y Haiku 5.5 no puede correr a 0,1: la API sólo
> admite 1 o nada, y se manda nada (guía de migración de Haiku 5.5, documentación de Anthropic). Así
> que no se compara «mismo prompt, otro modelo», sino **«otro modelo y otra temperatura»**. La
> temperatura baja es precisamente lo que hoy hace que el juez varíe poco entre pasadas, y la
> varianza entre las siete pasadas es parte de lo que se mide. **Si 5.5 varía más, no se podrá
> atribuir al modelo.** No tiene arreglo, y por eso se escribe antes.
>
> Lo demás que cambia con el modelo, también antes de medir: `max_tokens` pasa de 4.096 a 16.000,
> porque con 5.5 los tokens de pensamiento cuentan dentro (guía de migración); y el dial de esfuerzo
> va en `medium`. Los tokens de salida de cada llamada del juez quedan en
> `lecturaDeLasParejas[].tokensDeSalida`.
>
> **Las dos líneas base, las dos sobre Haiku 4.5:**
> - **NOR-11 ↔ CLI-13, 14/10**: siete pasadas, 3 de 3 en las siete, LUGAR con cita literal contigua de
>   133 caracteres, los seis contadores a cero, cero falsos
>   (`claude/Predicciones_F126_La_Regla_De_La_Cita.md`);
> - **NOR-10 ← CLI-12, 16/10**: tres pasadas, la contradicción del autoclave publicada en las tres,
>   citas literales y contiguas, mediana 281, los seis contadores a cero
>   (`claude/Predicciones_F127_NOR10_Documento_Largo.md`).
>
> **PASADA 0, EL CONTROL DEL INTERRUPTOR APAGADO** (arquitecto, 19/10/2026). **Antes de poner la
> variable**: desplegar F-128 **sin** `ANALYSIS_JUDGE_MODEL` y lanzar **una pasada de NOR-11**. F-128
> toca el cliente de la API y el juez; las pruebas dicen que sin la variable el cuerpo de la petición
> es idéntico al de antes, y esto lo comprueba contra la realidad. Qué tiene que salir:
> - las tres trampas publicadas, citas literales y contiguas, los seis contadores a cero;
> - `lecturaDeLasParejas[].modelo` = `claude-haiku-4-5-20251001` en todas las parejas;
> - los tokens de salida, **análisis contra análisis en `llm_usage`** (`SQL_F127_02`): la fila de
>   Haiku 4.5 de la pasada 0 en el orden de la línea base del 14/10, que dio **entre 2.885 y 3.183 de
>   salida por análisis**; y la suma de `tokensDeSalida` de sus parejas, **por debajo** de esa cifra.
>
> **Si esa pasada no reproduce la línea base, el problema es F-128 y no el modelo, y no se enciende
> nada hasta entenderlo.** Sin este control, cualquier diferencia que se vea luego con 5.5 no se podrá
> atribuir.
> - **Por qué análisis contra análisis** (regla 12; precisión de Code del 19/10, que el arquitecto
>   hace suya: «esta vez el que la pisó fui yo»): los ~3.000 de la línea base salen de `llm_usage`,
>   que suma rerank, juez, verificador y síntesis; `tokensDeSalida` es sólo del juez y nace con F-128,
>   así que en la línea base no existe la cifra por pareja.
> - Cómo se lee: con `SQL_F128_01` y los cuatro valores de «la pasada 0» de la tabla de su cabecera.
>   **Ningún control debe fallar; si alguno falla, es que pasó algo.**
>
> **Cómo se mide** (arquitecto, 19/10/2026). **No se lanzan las diez pasadas seguidas.** Se lanza
> UNA de NOR-11 —la pareja pequeña, la del arnés más conocido— y se miran tres cosas antes de seguir:
> - que no haya **ningún 400** en el log de Vercel;
> - que el **JSON del juez salga bien formado**, sin reintento y sin caída al fallback;
> - **`tokensDeSalida` de cada pareja**: si se acerca a 16.000, el pensamiento se está comiendo el
>   margen y hay que pararse a pensar antes de gastar nueve pasadas más.
>
> Si las tres salen bien, se lanzan las seis restantes de NOR-11 y después las tres de NOR-10. **Si
> alguna falla, se para, se quita la variable y se cuenta qué pasó.**
>
> ⚠️ **ANOMALÍA DECLARADA: EL PRODUCTO CAMBIÓ ENTRE LA PASADA 1 Y LA 2** (arquitecto, 19/10/2026). La
> norma es que el producto no se mueve entre pasadas; aquí se movió, y se deja pasar porque partir
> los commits ahora sería peor remedio. La pasada 1 con Haiku 5.5 corrió con una build cuya **única
> diferencia** con la de las pasadas 2 a 7 es el lector de la respuesta (`b8f97a37`): avisaba en el
> log de los bloques de pensamiento, y en las 2 a 7 ya no avisa. **El texto leído es el mismo en las
> dos builds**: el lector ya elegía los bloques por tipo y no por posición, y lo prueban
> `lib/llm/texto-de-la-respuesta.test.ts` y sus dos mutaciones. **Si al final alguna diferencia cae
> justo entre la pasada 1 y las demás, hay que sospechar de esto antes que del modelo.**
>
> **Cómo se lee.** NOR-11 con `SQL_F128_01_nor11_con_haiku55.sql` y NOR-10 con
> `SQL_F128_02_nor10_con_haiku55.sql`: son `SQL_F126_01` y `SQL_F127_01` con la misma lógica, y
> las originales se quedan como están porque son los instrumentos con los que se midieron las dos
> líneas base. Lo único que toca el director en cada una son **dos marcas de tiempo**, la de antes de
> la primera pasada y la de después de la última, con el formato que dice su cabecera. Las dos sacan
> además el **modelo** y los **tokens de salida** de cada pareja, junto a las citas, para que la
> salida no se pueda confundir con la línea base. El coste, con `SQL_F127_02`. Las pasadas las lanza
> el director.
>
> **Criterio de reversión, escrito antes** (estado vivo, 3.1.8): si PLAZO, LUGAR o NEGACIÓN bajan de
> 7 de 7, o si cualquiera de los seis contadores de la puerta deja de ser cero, se vuelve a Haiku 4.5
> y se archiva por qué. Y eso mismo **reabre la fase 3.4** (los punteros), con el disparador reescrito
> el 19/10 (estado vivo, 3.8).

---

## Predicciones del arquitecto

**P-1** · Las tres trampas de NOR-11 (PLAZO, LUGAR, NEGACIÓN) se publican 7 de 7, igual que el 14/10.

**P-2** · Los seis contadores de la puerta siguen a cero en las 7 pasadas.

**P-3** · Cero falsos positivos: ninguna cita publicada que no esté literal en lo entregado.

**P-4** · En NOR-10, la contradicción del autoclave se publica en 3 de 3, con cita literal y contigua.

**P-5** · La mediana de las citas sube respecto a Haiku 4.5. **Confianza baja**: un modelo más capaz
tiende a dar contexto de más, y si la mediana se dispara hay que mirarlo aunque la cita siga siendo
literal.

**P-6** · El coste por análisis baja a menos de la cuarta parte del medido en `SQL_F127_02`.
**Confianza media**: el precio es la décima parte, pero la salida puede alargarse.
- *Añadido antes de medir (arquitecto, 19/10)*: **los tokens de pensamiento se facturan como
  salida**, y el pensamiento adaptativo puede multiplicar los tokens de salida. Aun así, con la
  salida a 0,50 $ por millón contra 5 $, hay mucho margen. **Si el coste NO baja de la cuarta
  parte, lo primero que hay que mirar son los tokens de salida** (`tokensDeSalida` de cada
  pareja), no el precio.

**P-7** · La latencia total baja. **Confianza media**: Box reporta la mitad, pero nuestro cuello de
botella no es sólo el juez.

---

## Notas añadidas después de escribir las predicciones

> **REGLA DE ESTE FICHERO (arquitecto, 19/10/2026): un fichero de predicciones no se retoca nunca.**
> Lo de arriba se queda como se escribió, también lo que el tiempo deje desfasado o resulte falso. Si
> algo queda desfasado, va una nota fechada aquí debajo, que dice qué línea es y qué es lo que vale
> hoy.

- **19/10/2026, la línea 80** («Lo único que toca el director en cada una son **dos marcas de
  tiempo**»): ha quedado desfasada. Desde el 19/10, `SQL_F128_01` y `SQL_F128_02` tienen **cuatro
  valores** cada uno, los que dice la tabla de su cabecera. En `SQL_F128_01` son DESDE, HASTA, COMIENZO
  DEL HUECO y ESPERADO. En `SQL_F128_02` son DESDE, HASTA, INICIO DE LA FRANJA PREVIA y EXIGIR MODELO.

- **19/10/2026, la calificación** (arquitecto). Las cifras son del arquitecto, sacadas de las salidas
  de `SQL_F128_01`, `SQL_F128_02` y `SQL_F127_02` que ejecutó el director. Code no ha visto esas
  salidas.
  - **P-1: ACERTADA.** PLAZO, LUGAR y NEGACIÓN, 7 de 7 por el registro de siembra. En cuatro pasadas,
    NEGACIÓN se citó por su mitad negativa, «En ningún caso se depositan en el contenedor negro…»,
    que es la Versión 1 sembrada. El clasificador de entonces la contó como OTRA; el defecto era del
    medidor (`841c50c6`).
  - **P-2: ACERTADA.** Los seis contadores de la puerta, a cero en las siete pasadas.
  - **P-3: ACERTADA.** Cero falsos positivos.
  - **P-4: ACERTADA.** En NOR-10, A publicada en las tres pasadas, y desglosada en tres: autorizar
    excepciones, firmar auditorías y retirar el autoclave.
  - **P-5: FALLADA.** La mediana de las citas no subió, bajó: de 167 a 100 en NOR-11 y de 281 a 83
    en NOR-10.
  - **P-6: FALLADA.** El coste por análisis bajó de 0,04633 a 0,02280 $, a la mitad y no por debajo
    de la cuarta parte.
  - **P-7: FALLADA.** La latencia subió de 19 s a entre 31 y 43 s.
