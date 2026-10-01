# Plan · contadores en los tres topes ciegos

*Escrito por Code el 01/10/2026 como respuesta al encargo del arquitecto («PLAN DE LOS
CONTADORES EN LOS TRES TOPES CIEGOS. SIN ESCRIBIR CÓDIGO»). Se perdió una vez en el relevo, y
por eso vive aquí y no sólo en una conversación.*

## Estado

- **APROBADO por el arquitecto el 01/10/2026, tal como está escrito**, con dos condiciones y
  un añadido:
  1. **(g7) va a ficha propia ANTES de implementar nada.** Hecho: `claude/Estado_Del_MVP.md`,
     B.309.
  2. **No se empieza todavía.** Primero L-12 y B.299, que es el puesto 1 del tablero. Los
     contadores entran justo detrás, y **nunca en el mismo commit ni en el mismo despliegue**
     que el arreglo de B.299.
  3. **Añadido: el mejor score por documento**, junto a `consultas_que_lo_alcanzaron`. Con los
     dos se puede evaluar en sombra la ordenación de Fable —amplitud, con desempate por
     máximo— sin trabajo adicional. **No estaba en el plan**, y entra en (c).
- **NO IMPLEMENTADO.** No se ha tocado código.

## Tres conclusiones, primero

- **Ninguno de los tres topes ciegos deja fuera DOCUMENTOS.** Los que sí dejan fuera documentos
  son el corte de 25 y el rerank, y esos ya cuentan cuántos, pero no cuáles. **El hueco de
  auditoría es «quiénes», no «cuántos»** (anotado en F-119 como corrección de Code al dictamen).
- **Del tope 2 no se puede saber quién quedó fuera sin coste.**
- **El tope 4 destapó un hallazgo**: B.309.

## a) Los tres topes, y qué deja fuera cada uno

| Tope | Dónde | Qué deja fuera de verdad | Qué ya se cuenta |
|---|---|---|---|
| **2** · 25 resultados por consulta, compartidos entre documentos | `retrieval.ts:142`, `:332` | Lo que queda por debajo del puesto 25 de cada consulta. Pinecone no lo devuelve: quiénes eran es invisible | Sólo el valor del tope (`termometro.topK`) y el número de consultas |
| **4** · deduplicación por documento | `retrieval.ts:454`, `:645-655` | **Ningún documento.** Quita apariciones repetidas del mismo trozo, y con ellas su score y su consulta | El total sí (`denominadores.candidatos_con_repeticion` y `unicos`); falta el desglose por documento |
| **7** · entrada del rerank | `rerank.ts:73` (3.000 caracteres del analizado, por posición) y `:54` (300 por fragmento) | **Ningún documento.** Recorta texto | Nada |

**Qué contaría cada uno, en la unidad que corta:**
- **Tope 2**:
  - plazas por documento y consultas que lo alcanzaron (la amplitud, medida);
  - consultas que llenaron sus 25 plazas;
  - los documentos del fondo que ninguna consulta alcanzó. Esto sale gratis: `contarElFondo`
    ya tiene sus ids en memoria (`termometro.ts:302-330`). Se llama **«no alcanzado»**, no
    «desplazado».
- **Tope 4**: fragmentos que entraron, que salieron y repetidos, y cuántas veces el descarte
  tiró un score mayor que el conservado (B.309).
- **Tope 7**:
  - del analizado, `{caracteres, mostrados, dejoFuera}`, la forma de `LecturaDeLaPareja`;
  - por candidato, fragmentos enviados, recortados y caracteres cortados.
- **Supervivencia por documento** al corte de 25 y al rerank, con datos ya en memoria. Es «dónde
  se pierde el candidato verdadero» (F-119 § 7). Cubre también el descarte del rerank por
  criterio con sitio libre (B.306): cuando el tope no se llena, todo lo descartado es por
  criterio.

## b) Ficheros y líneas, aproximadas

| Fichero | Cambio | Líneas |
|---|---|---|
| `lib/analysis/topes-ciegos.ts` **(nuevo)** | Funciones puras que miden, y sus tipos | ~230 |
| `lib/analysis/retrieval.ts` (ya en 1.180) | Guardar los resultados por consulta y llamar a las medidas (`:336`, `:455`, `:568`) | +15 |
| `lib/analysis/pipeline.ts` (ya en 1.516) | Medir la entrada del rerank, marcar la supervivencia y unir al termómetro | +15 |
| `lib/analysis/rerank.ts` | Sacar los literales 3000 y 300 a constantes exportadas; el comportamiento no cambia | +4 |
| `lib/analysis/termometro.ts` (388) | Campo `topes`, `version: 2`, y `topes: null` en «no recuperado» | +10 (~398) |
| `lib/analysis/topes-ciegos.test.ts` **(nuevo)** | Pruebas | ~260 |
| `lib/analysis/termometro.test.ts` | La prueba que fija `version` | ~5 |

`judge.ts` no se toca (B.296).

## c) El tipo

```ts
/** Extensión del termómetro (F-119 §7). Sólo ids, nunca nombres ni texto (cláusula 5). */
export interface TopesCiegos {
  consultas: {
    topK: number;
    consultas: number;
    saturadas: number;
    documentos_alcanzados: number;
    del_fondo_no_alcanzados: number | null;
    ids_del_fondo_no_alcanzados: string[]; // como mucho MAXIMO_DE_IDS_REGISTRADOS (20)
  };
  dedup: { entraron: number; salieron: number; repetidos: number; repetidos_con_score_mayor: number };
  rerank: {
    analizado: { caracteres: number; mostrados: number; dejoFuera: boolean };
    fragmentos_enviados: number;
    fragmentos_recortados: number;
    caracteres_de_fragmentos: number;
    caracteres_mostrados: number;
  } | null;
  documentos: DocumentoEnLosTopes[]; // ordenados por plazas, como mucho 20
  documentos_no_listados: number;
}
export interface DocumentoEnLosTopes {
  documentId: string;
  plazas: number;
  consultas_que_lo_alcanzaron: number;
  /** AÑADIDO el 01/10: el máximo DE VERDAD, sobre todas las apariciones, antes del dedup. */
  mejor_score: number;
  /** El `maxScore` con el que hoy se ordena: el de las primeras apariciones (B.309). */
  score_que_ordena: number;
  trozos_unicos: number;
  repetidos: number;
  repetidos_con_score_mayor: number;
  /** null = ese corte no llegó a juzgarlo (salida temprana). */
  sobrevivio_al_corte_de_25: boolean | null;
  sobrevivio_al_rerank: boolean | null;
}
// En el Termometro: version: 2; topes: TopesCiegos | null; topes_motivo: string | null.
```

- **`mejor_score` y `score_que_ordena` van los dos.** El primero es el que pide el arquitecto
  para evaluar en sombra la ordenación de Fable. El segundo es el que hoy ordena de verdad.
  Poner sólo el primero haría parecer que el código ya ordena por él, y no es así (B.309). Su
  diferencia es el efecto de B.309, documento a documento.
- Si la medida falla, `topes: null` con su motivo, y el análisis sigue igual (regla 2). El «no
  puede contestar» va en el tipo (§2-quinquies).

## d) Dónde se guarda y cómo se consulta

- En `analysis_results.analysis->'termometro'->'topes'`, por `saveAnalysisResult`, en rápido y
  en el worker.
- **No se envía al cliente.** Las listas de `app/api/analyze-v2/route.ts:852` y de
  `worker/src/index.ts:186` lo excluyen a propósito.
- Se consulta por SQL, y los nombres se ponen con un JOIN a `documents` al leer:
  ```sql
  SELECT d.name, x->>'plazas', x->>'consultas_que_lo_alcanzaron', x->>'mejor_score',
         x->>'score_que_ordena', x->>'sobrevivio_al_rerank'
  FROM analysis_results ar,
       jsonb_array_elements(ar.analysis->'termometro'->'topes'->'documentos') x
  JOIN documents d ON d.id::text = x->>'documentId'
  WHERE ar.id = '…';
  ```

## e) ¿Mueve la línea de base del arnés? **No.**

- El examen lee `discrepancies`, `overlaps`, `tableDiffs` y `pipelineCounters`
  (`lib/examen/veredicto.mjs:33`). **Nunca lee el termómetro.**
- **No se añade nada a `pipelineCounters`.**
- **Ninguna decisión cambia.**

## f) Pruebas, cada una ROJA si el contador mintiera

1. **Tope 2.** Un documento que ocupa 20 de las 25 plazas tiene que dar 20. Uno que aparece en
   3 consultas tiene que dar amplitud 3.
   - Invariante: la suma de plazas por documento = `crudos`.
   - Un documento del fondo no alcanzado tiene que salir listado.
2. **Tope 4.** Un repetido con más score tiene que dar `repetidos_con_score_mayor = 1`, y su
   `mejor_score` tiene que ser mayor que su `score_que_ordena`.
   - Invariante: `entraron = salieron + repetidos`.
3. **Corte de 25.** Con 27 candidatos, exactamente 2 salen con `false`, y coincide con
   `seleccion.candidatos_cortados_por_tope_de_recuperacion`.
4. **Tope 7.** 5.000 caracteres dan 3.000 mostrados. Un fragmento de 450 da 150 cortados.
   - Invariante: caracteres = mostrados + cortados.
   - La prueba usa la constante exportada de `rerank.ts`, no un 300 copiado.
5. **Fallo.** Si la medida lanza, `topes: null` con su motivo, y el resto no cambia.
6. **Mutantes**: alterar cada cuenta en uno, y alguna prueba tiene que ponerse roja.
7. **Tope de la lista.** Con 25 documentos se listan 20, y `documentos_no_listados = 5`.

## g) Lo que choca con el código o con las reglas

1. Saber quiénes quedaron fuera en el tope 2 exige una consulta más (regla 5). Se cuenta lo
   observable: plazas, saturación y «no alcanzados». *(Aceptado.)*
2. «Entraron = salieron + fuera» por documentos no puede fallar en los topes 4 y 7. El
   invariante va en la unidad que cada tope corta. *(Aceptado.)*
3. **Nombres**: el termómetro se declara «sólo números… ni un nombre de documento»
   (`termometro.ts:24-29`, cláusula 5). Se guardan ids, y los nombres con un JOIN al leer.
4. **Tipos**: en el fichero nuevo, porque `types.ts` va por 605 líneas.
5. `rerank.ts` cambia, aunque sea para sacar dos constantes.
6. `version: 2`. Nadie lee hoy ese campo.
7. **Hallazgo**: `deduplicateFragments` conserva la primera aparición, no la de más score. Va a
   ficha antes de implementar (B.309). Se instrumenta sin arreglar.
