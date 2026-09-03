# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run lint     # Lint + type-check
```

## Architecture

**Doclity** is a multi-tenant SaaS for document management and AI-powered analysis. Users upload documents, ask questions, and receive answers grounded in their document content. The system also detects contradictions, duplicates, and quality issues across documents.

### Stack

- **Frontend**: Next.js 15 (React 19, Tailwind CSS)
- **LLM**: Claude Haiku 4.5 (chat + query rewriting) / Claude Sonnet 4.6 (analysis)
- **Vector DB**: Pinecone — multilingual-e5-large embeddings (1024 dims)
- **Auth & Data**: Supabase (PostgreSQL + Row Level Security)
- **Billing**: Stripe (credit-based consumption model, plans + credit packs)
- **Worker**: Node.js on Railway (exhaustive analysis jobs > 30s)

### Multi-Tenant Model

Users belong to organizations (`memberships` table: `user_id`, `org_id`, `role`). All documents, Pinecone namespaces, and credit pools are scoped to `org_id`. Always use `resolveOrg()` from `lib/org.ts` to get the authoritative org — never user metadata.

### Document Ingestion Flow

```
Upload → Text extraction (PDF/docx/md/txt) → Chunking (2000 chars, 200 overlap)
       → Pinecone Inference API embeddings (batch 20, rate-limited)
       → Pinecone (vectors, namespace=orgId) + Supabase (metadata + full_text)
```

`app/api/ingest/route.ts` handles validation and collision detection (manual uploads reject duplicate filenames; Drive docs with `source='google_drive'` or `source='onedrive'` are exempt).

**Upload lock**: before indexing, `checkUploadLock()` from `lib/upload-lock.ts` ensures only one user per org uploads at a time (60-min TTL). Returns HTTP 423 if locked.

### RAG Query Flow (`lib/rag.ts`)

1. **Query rewriting** (if conversation history exists): Haiku rewrites the user question into a standalone search query with enough keywords for Pinecone. Non-billable internal call.
2. Embed search query → Pinecone search (top 15 chunks, min score 0.3)
3. Deduplicate to ≤4 source documents; track which `chunkIndex` values matched per doc
4. **Fetch full document text from Supabase** (not just chunks) — avoids context loss from bad chunk boundaries
5. Pass full docs + conversation history to Claude Haiku
6. Return answer + source citations, with `chunks: number[]` and `totalChunks` per source (used for coverage analytics)

### Analysis Pipeline (`lib/analysis/pipeline.ts`)

When requested, the system runs multi-step analysis against existing docs:
- Claim extraction → Pinecone retrieval → **Rerank** (Haiku filters noisy candidates, max 6 quick / 10 exhaustive) → Contradiction/duplicate verification → Synthesis
- Each step calls Claude via `lib/analysis/llm-client.ts`
- Results are confidence-scored findings users can accept/reject before saving improvements

**Severity tiers** (as of May 2026):
- `contradiction` — confirmed by both Haiku and Sonnet; shown in main discrepancies list
- `minor_inconsistency` — real difference but both statements can coexist; shown in separate section
- `none` — not a contradiction

**Detection taxonomy** (judge.ts, verify-claims.ts, double-check.ts):
- OMISIÓN SIGNIFICATIVA — incomplete list vs corpus
- DISTORSIÓN CONCEPTUAL / SUSTITUCIÓN — wrong technical term
- EXAGERACIÓN — absolute claim where corpus uses qualifiers
- DEGRADACIÓN — downgrades something the corpus marks as fundamental

**Double-check** (`lib/analysis/double-check.ts`): Sonnet verifies Haiku candidates in batches of 15, max 50 total. Exhaustive mode verifies all candidates in successive batches. `excludeFingerprints` skips already-dismissed contradictions from prior re-analyses.

### Credits & Billing

Every AI endpoint atomically deducts credits via Supabase RPC `consume_credits(p_org_id, p_amount)`. Never decrement credits directly — parallel requests can overdraw. Use `refundCredits()` for post-operation partial refunds (exhaustive analysis).

| Endpoint | Cost |
|---|---|
| `/api/ask` | 1 credit |
| `/api/analyze-v2` (regular) | 5 credits |
| `/api/analyze-v2` (exhaustive) | 30 credits upfront — partial refund may apply |
| `/api/analyze-style` | 2 credits |
| `/api/improve` | 1 credit |

**Exhaustive refund logic** (applied by worker after completion):
- Re-analysis (non-empty `excludeFingerprints`) with <2 confirmed contradictions → refund 20 cr (all plans, final cost 10)
- Business/Business+/Enterprise variable pricing: light (<10 contradictions) refund 10, medium (10-30) refund 5, heavy no refund

**Plans** (`lib/stripe.ts`): free (50 cr, 1 user), starter (400 cr, 3), pro (1500 cr, 5, Drive), business (4000 cr, 15, Drive+Analytics+VariablePricing), business_plus (10000 cr, unlimited). Use `getOrgFeatures(supabase, orgId)` from `lib/plan-features.ts` to gate Drive, analytics panel, and variable pricing — never hardcode plan names in feature checks.

Stripe webhooks update `organizations.subscription_id`, `canceled_at`, and `grace_period_ends_at` (90-day grace after cancellation). On grace period expiry, `purgeOrganization()` deletes all Supabase data, Pinecone vectors, and the Auth user.

### LLM Client (`lib/analysis/llm-client.ts`)

Wraps the Anthropic SDK with:
- **Retry**: 5 attempts, exponential backoff (2→5→10→15→20s) for 429/529/5xx
- **JSON repair**: sanitizes and reconstructs truncated LLM responses
- **Prompt caching**: supports `cacheSystem` flag for ephemeral cache on system prompts
- **Usage tracking**: returns token counts including cache hits

### Standard API Route Pattern

```typescript
const { data: { user } } = await supabase.auth.getUser(token);
const org = await resolveOrg(supabase, user.id);           // auth + org resolution
const rateCheck = await checkRateLimit(supabase, userId, endpoint);
if (!rateCheck.allowed) return 429;
const creditResult = await consumeCredits(supabase, orgId, endpoint);
if (!creditResult.success) return 402;
// ... do work ...
await logUsage(supabase, { userId, orgId, endpoint, model, inputTokens, ... });
```

### Pinecone Namespace Isolation

All vector queries are scoped to the org's namespace:
```typescript
const ns = getIndex().namespace(orgId);
await ns.query({ vector, topK: 15, includeMetadata: true });
```

### Persistence (`lib/persist-analysis.ts`)

Every completed analysis and chat query is persisted to Supabase for analytics:
- `saveAnalysisResult()` — called from `/api/analyze-v2` and `/api/analyze-style`
- `saveChatQuery()` — called fire-and-forget from `/api/ask` with full sources (including `chunks[]` and `totalChunks`)

Run `supabase-analysis-persistence.sql` to create `analysis_results` and `chat_queries` tables.

### Usage Analytics (`app/settings/usage/`)

Admin-only page at `/settings/usage` with two tabs:
- **Calidad documental** — analysis history, document ranking, recommendation distribution
- **Uso del chat** — query history, top/never-used documents, corpus coverage per document

Coverage: `chat_queries.documents_used` stores `chunks: number[]` and `totalChunks` per source. The analytics route aggregates these across all queries in the period to compute what % of each document's chunks have actually been retrieved.

### Key Files

| File | Purpose |
|---|---|
| `lib/org.ts` | `resolveOrg()` — user → org + role |
| `lib/rag.ts` | Core RAG engine + query rewriting + chunk coverage tracking |
| `lib/credits.ts` | `consumeCredits()`, `refundCredits()`, `CREDIT_COSTS` |
| `lib/chunking.ts` | Text extraction + chunking |
| `lib/embeddings.ts` | Pinecone Inference API with rate limiting |
| `lib/stripe.ts` | Stripe client, `PLAN_CONFIG`, `PLAN_FEATURES`, price IDs |
| `lib/plan-features.ts` | `getOrgFeatures()` — feature gates by plan |
| `lib/upload-lock.ts` | `checkUploadLock()` — concurrent upload semaphore |
| `lib/persist-analysis.ts` | Save analysis results and chat queries to Supabase |
| `lib/drive/registry.ts` | Drive provider registry (`getProvider()`) |
| `lib/drive/google.ts` | Google Drive implementation |
| `lib/drive/onedrive.ts` | OneDrive implementation (implemented, UI disabled) |
| `lib/analysis/pipeline.ts` | Multi-step document analysis orchestration |
| `lib/analysis/llm-client.ts` | Robust Claude API wrapper |
| `app/api/ingest/route.ts` | File upload + indexing |
| `app/api/ask/route.ts` | Chat endpoint |
| `app/api/analyze-v2/route.ts` | Document quality analysis (quick + creates exhaustive job) |
| `app/api/analysis-jobs/[id]/route.ts` | Exhaustive job status polling |
| `app/api/usage/analytics/route.ts` | Usage analytics for admins |
| `app/api/billing/` | Stripe: webhook + checkout + portal + buy-credits |
| `app/api/drive/` | Drive OAuth + sync + disconnect |
| `worker/src/index.ts` | Railway worker for exhaustive analysis jobs |
| `supabase-setup.sql` | Core DB schema + RLS policies |
| `supabase-analysis-persistence.sql` | analytics tables: analysis_results, chat_queries |

### Gotchas

- Older documents may lack `full_text` in Supabase — fallback to reconstructing from chunks.
- Pinecone free tier rate-limits at 250K tokens/min; `lib/embeddings.ts` auto-waits 60s on 429.
- RLS policies enforce `org_id` on all tables; use the service role client server-side.
- `chat_queries.documents_used` records made before commit `b71dd5e` (May 2026) lack `chunks`/`totalChunks` — coverage section only shows for queries made after that deploy.
- Duplicity resolution in `ImprovementModal` is intentionally local (no API call, no credit cost) — `handleSolveOne`/`handleSolveGroup` generate the replacement proposal by finding the surrounding paragraph with `findParagraphContaining()`.
- Exhaustive analysis credit refund is applied by the Railway worker after completion — if the worker fails, credits are not automatically refunded.
- Always gate Drive and analytics panel features via `getOrgFeatures()`, never hardcode plan names. A free-plan org must not reach `/settings/usage` or see Drive options.
- Upload lock (HTTP 423) blocks `/api/analyze-v2` too, not just `/api/ingest`. Check `checkUploadLock()` before any document operation.

## Reglas de trabajo con el usuario

### Perfil del usuario
El dueño del proyecto NO es programador. Vercel deploya automáticamente al hacer push.

### Quién sube qué
- **Los commits los pushea Claude directamente** con `git push`. NO hay que dar ficheros completos ni fragmentos para que el usuario los pegue a mano en GitHub: el repositorio está delante y se sube desde aquí. La regla antigua —«el usuario sube los archivos a mano copiando y pegando»— es anterior a tener el repo local y ya NO aplica.
- **El SQL lo ejecuta el usuario en Supabase, y ANTES del push.** Es lo único que no pasa por Claude. Si un commit depende de un cambio de esquema, se le entrega el SQL al usuario y se espera a que confirme que lo ha ejecutado antes de subir el código que lo necesita.
- **El fichero `supabase-*.sql` del repo nace diciendo PENDIENTE DE EJECUTAR**, y solo pasa a EJECUTADO cuando el usuario lo confirma. Un documento no puede afirmar un hecho antes de que ocurra, ni aunque sea seguro que va a ocurrir en cinco minutos: si el usuario decide no ejecutarlo, el fichero se queda mintiendo en el repositorio. Es la misma clase de fallo que B.113 (el protocolo decía tener 403 líneas cuando tenía 466). La corrección va en el mismo commit que se pushea.

### Reglas obligatorias
- Archivos completos siempre, no diffs ni fragmentos, salvo archivos largos con cambios mínimos e inequívocos.
- Cambios pequeños con build verde entre medias. Nunca encadenar fixes sin verificar.
- Cuando falle la build, pedir log completo antes de diagnosticar.
- Datos antes que hipótesis.
- Antes de cualquier cambio grande, plan completo aprobado por el usuario.
- Ningún archivo debería superar 400 líneas. Si crece, dividir.
- TypeScript estricto, sin any salvo justificación.
- Toda integración externa pasa por función intermedia.
- **Un criterio se implementa UNA VEZ. Quien lo necesita PREGUNTA a quien lo
  decidió, no lo recalcula.** Si una etapa ya decidió algo —qué fila va con
  cuál, qué identidad tiene un hallazgo, qué columna es la clave— la siguiente
  le pregunta el resultado en vez de volver a derivarlo con sus propias reglas.
  Dos implementaciones del mismo criterio no se mantienen sincronizadas: se
  separan, y el día que se separan nadie se entera porque las dos siguen
  pareciendo correctas por su cuenta.
  Casos del proyecto: el `groupId` es OPACO y no derivado del contenido, para
  que no exista una segunda identidad paralela a la huella (F-88 P3); y R2
  comprueba si dos filas son la misma fila PREGUNTANDO al emparejamiento en vez
  de recomparar la clave (F-89 P2), lo que además cubre gratis el caso de una
  fila sin pareja ninguna.
- **Un comentario que justifica un ORDEN cita el INVARIANTE del que depende.**
  Si una etapa va antes que otra por una razón, la razón se escribe nombrando
  la pieza concreta de la que depende —un contador, un campo, una garantía— para
  que el día que esa pieza muera, un `grep` la encuentre.
  El caso: la supresión del juez se puso antes de R2 porque «decidirlo primero
  contaría un `confirmado.por_estructura` que nadie va a ver». Era verdad al
  escribirlo. El punto 4 del frente 1 retiró ese contador, y la única aparición
  de esa cadena en `pipeline.ts` pasó a ser **el comentario que la invocaba** —
  un orden sostenido por un invariante muerto, y nadie se enteró hasta que hizo
  falta reordenar. Regla promovida en F-93.
- **UNA IDENTIDAD POR ESPECIE, CALCULADA EN UN SITIO.** Y nunca se añade la
  nueva sin retirar la vieja — es la única forma de que no queden dos. Si dos
  caminos pueden identificar el mismo hallazgo, se comportarán distinto según
  por dónde entre, y el día que se separen nadie se entera.
  El caso: al llevar los descartes a las tablas había ya una huella de PROSA
  calculada sobre el texto renderizado de la fila, esperando en el endpoint.
  Nadie la diseñó, y por eso nadie declaró que era frágil — incluía todas las
  columnas y el índice de fila, así que reordenar un Excel habría borrado todos
  los descartes de golpe. Se estrenó la huella tabular y se retiró aquélla, que
  es la parte que no se salta: añadir la nueva sin quitar la vieja deja dos.
  Promovida en F-94 P1.
- **LECTURA DUAL CON CADUCIDAD, desde el primer cliente real.** Ningún cambio de
  identidad entra sin camino de reconocimiento doble ACOTADO: se lee la vieja y
  la nueva durante una ventana CON FECHA, y se escribe solo la nueva. No son dos
  identidades vivas: es una migración con reloj.
  ⚠️ HOY NO HACE FALTA, Y EL 01/09 CASI LA APLICAMOS DE MÁS: F-94 planificó un
  corte con fecha para migrar la identidad vieja de los descartes tabulares, y
  al implementarlo resultó que NO HABÍA IDENTIDAD VIEJA — el botón nunca se
  pintó, así que no hay un solo descarte guardado. Se retiró por inexistente.
  Lo que hizo que saliera gratis fue haber suprimido las acciones en F-88 P2 en
  vez de dejarlas funcionando a medias: la deuda que no se contrae no se migra.
  Es la última vez que sale gratis. Promovida en F-94 P1.
- **DATOS DEL CLIENTE: se persisten donde se MUESTRAN, y se envían a un modelo
  solo donde DECIDEN. Ninguna copia sin lector.**
  Es la regla que separa dos casos que parecían el mismo: cincuenta filas ajenas
  en el jsonb son EL RESULTADO —el usuario las ve, y sin ellas el análisis no
  sería consultable después—; las mismas filas volcadas en la descripción de un
  solapamiento que nadie pinta eran una FUGA, ~2.200 caracteres a tres prompts.
  Promovida en F-94 P3.
- **UNA EXPLORACIÓN QUE VERIFICA EL PRODUCTOR NO HA VERIFICADO LA
  FUNCIONALIDAD.** El grifo y la tubería: que algo se calcule, se guarde y viaje
  no dice NADA sobre si alguien lo consume. Antes de afirmar que una
  funcionalidad existe —o que no existe— se abre el CONSUMIDOR: quién llama a
  esa función, qué componente pinta ese campo.
  Los dos casos, el mismo día y los dos nuestros: dijimos que descartar una fila
  de tabla «ya funciona hoy» tras leer el endpoint, y `mostrarAccionesDeFila`
  nunca pintó el botón; y dijimos que las variantes de escritura «no las pinta
  nadie» tras leer el cálculo y los contadores, y se pintaban desde el mismo
  commit que supuestamente las retiró.
  ⚠️ LO QUE LO HACE ACCIONABLE, y es lo que distingue este patrón del anterior:
  **las dos veces la pieza EXISTÍA**. El patrón de los seis casos de «lo que
  Fable da por existente» era que el modelo daba por hecha una pieza que no
  estaba; éste es el INVERSO y es NUESTRO — damos por inexistente algo que sí
  está, y proponemos construir lo construido. Se caza igual y solo así: abriendo
  el consumidor antes de escribir la premisa. Promovida el 01/09/2026 (F-94).
- **UN TIPO QUE NO PUEDE EXPRESAR EL FALLO OBLIGA A INVENTARSE UN VALOR QUE LO
  SIGNIFIQUE, Y ESE VALOR YA SIGNIFICA OTRA COSA.** Si una función puede fallar,
  el fallo va EN EL TIPO DE RETORNO. Lo que no cabe en la firma lo acaba
  representando el vecino: la lista vacía, el cero, la cadena vacía, el `null`
  — valores que ya tenían dueño, y que aguas abajo se leen como lo que
  significaban antes.
  El caso: `DriveProvider.listFiles(): Promise<DriveFile[]>` no tenía sitio para
  «falló», así que las dos implementaciones devolvían la lista vacía ante un
  error. Doce líneas más abajo, lista vacía significa «el usuario vació la
  carpeta» — o sea BORRAR EL CORPUS. Un 500 de un segundo bastaba (B.138).
  Y la firma no solo escondía el fallo: lo habría hecho repetir. Con ella, el
  siguiente proveedor no tenía forma de enterarse de que había un caso que
  atender. Promovida el 01/09/2026.
- **ANTES DE METER ESPERAS EN UN SITIO, PREGUNTAR: ¿CUÁNTO TIEMPO TENGO AQUÍ, Y
  CUÁNTO CONSUME LO QUE VOY A METER?** Un arreglo puede empeorar lo que arregla
  si no cabe en el presupuesto de tiempo del sitio donde va.
  El caso: copiar los seis reintentos de la indexación —61 s solo en esperas— a
  `/api/ask`, que tiene `maxDuration: 30` en `vercel.json`. Habría convertido un
  error limpio en un TIMEOUT DE PLATAFORMA: sin `catch`, sin registro de uso,
  sin mensaje al usuario y con el crédito ya cobrado.
  El presupuesto se mira en `vercel.json` (o en el worker, que no lo tiene) y se
  cuenta ENTERO: en esos mismos 30 s corre también la llamada al modelo con su
  propio retry. De ahí que los reintentos de embeddings sean DOS presupuestos
  con nombre y no uno. Promovida el 01/09/2026.
- **TODA OPERACIÓN DESTRUCTIVA CUYA CONDICIÓN DE DISPARO DEPENDA DE UNA
  RESPUESTA AJENA VERIFICA QUE LA RESPUESTA ES VÁLIDA ANTES DE ACTUAR.** La
  ausencia de datos POR FALLO no es ausencia de datos: un listado que no llegó no
  significa «no hay nada», y leerlo así convierte un error de red en un borrado.
  Y SU HERMANA PERMISIVA: una guarda cuya condición dependa de una respuesta
  ajena **falla CERRADA por defecto**; si falla abierta, se declara y se cuenta.
  Los dos casos, y son la misma forma con el signo cambiado: el listado de Drive
  devolvía lista vacía ante un fallo y se borraba el corpus entero (B.138); el
  veto por hash devuelve «no es duplicado» ante un fallo y el duplicado entra
  (B.149). Promovida en F-95 P3.
  ⚠️ Y EL PELIGRO NO ES LA RESPUESTA VACÍA, ES LA INCOMPLETA: un fallo de
  subcarpeta o de página devuelve contenido AL QUE LE FALTAN COSAS, y una guarda
  de «si viene vacío, aborta» no lo caza.
- **CADA LÍMITE DECLARADO LLEVA SU CONTADOR.** Lo escrito documenta que lo
  sabíamos; el contador es lo que avisa el día que ocurra. «Declarado» tiene tres
  grados —ESCRITO, CONTADO, EJERCIDO— y el segundo es exigible a todos sin
  excepción: un declarado sin contador es callar con permiso. El tercero es
  obligatorio para lo que guarde una operación destructiva o un camino de
  pérdida, y desde B.126 «no se puede provocar sin romper producción» ya no vale
  como excusa. Promovida en F-95 P5.
- **NINGÚN ENDPOINT ACEPTA COMO ENTRADA UN OBJETO DEL QUE SE DERIVEN COLUMNAS DE
  NEGOCIO.** Se aceptan referencias e identificadores; el servidor reconstruye.
  El caso: un endpoint de «reintentar el guardado» tendría que aceptar el objeto
  de análisis del cliente, y de él se derivan siete columnas —contradicciones,
  duplicados, solapamientos, estilo, recomendación—. Cualquiera con sesión
  escribiría filas fabricadas que alimentan la analítica, la bandeja y **los
  contadores con los que este proyecto se mide a sí mismo**. Contaminar el
  instrumento de medida es el coste inaceptable, no el abuso hipotético.
  Promovida en F-95 P1.
- **UN DATO QUE GOBIERNA CUOTA SE TRATA COMO CUOTA, NO COMO ANALÍTICA.**
  `usage_logs` parece un registro de uso y es lo que el limitador cuenta para
  saber cuántas llamadas lleva hoy un usuario: cada fila perdida es una llamada
  regalada, y regalada justo cuando la base va peor. Antes de tocar una tabla,
  mirar quién la LEE — no qué nombre tiene. Promovida en F-95 P2 (B.145).
- **UN DOCUMENTO EN REVISIÓN ES UN CANDIDATO A ENTRAR EN EL CORPUS, no un
  miembro con etiqueta que lo excluya.** Su exclusión no depende de que un filtro
  esté bien escrito, sino de que NO HAYA NADA QUE FILTRAR.
  La razón de fondo: `analysisStatus` no es un estado duplicado, es una
  PARTICIÓN — `'analizado'` es elegible y todo lo demás no, y el filtro no
  distingue entre los «demás». Y un documento en revisión no necesita estar en el
  índice: **se compara CONTRA el corpus, no el corpus contra él.** Promovida en
  F-96.
- **LA PERTENENCIA AL CORPUS SE ESCRIBE EN UN SOLO SITIO.** La función que indexa
  la escribe al crear los vectores; la que promociona la actualiza en los dos
  sistemas —VECTORES PRIMERO, y solo si TODOS van bien, la fila después— y falla
  ruidosamente si el primero falla. Nadie más la toca.
  Es el patrón EFECTO-ESPEJO, y sus tres piezas son la conjunción: (1) efecto
  antes que registro —se escribe primero donde la escritura DECIDE y después
  donde INFORMA, porque un espejo atrasado es el error benigno y una pantalla que
  promete lo que el corpus no cumple es el grave—; (2) todo-o-nada en el efecto;
  (3) fallo ruidoso, jamás continuar al registro. Promovida en F-96 P4.
- **DOS SISTEMAS QUE DEBEN COINCIDIR NECESITAN UN PUNTO QUE COMPRUEBE QUE
  COINCIDEN.** Sin verificación, la consistencia es una promesa. Promovida en
  F-96 P3.
- Retry con backoff y fallback determinista.
- Cero dependencias nuevas sin razón.
- Idioma del proyecto: español.

### Lo que NUNCA hacer
- Nunca inventar APIs, nombres de archivos o rutas. Si no sabes algo del repo, pregunta.
- Nunca usar localStorage ni sessionStorage.
- Nunca mezclar frontend y backend en el mismo commit sin motivo.
- resolveOrg en todos los endpoints: nunca usar user.user_metadata?.org_id || user.id.
- Créditos se descuentan ANTES de la operación.
