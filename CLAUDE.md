# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm run lint     # Lint + type-check
```

## Architecture

**Documentation Hub** is a multi-tenant SaaS for document management and AI-powered analysis. Users upload documents, ask questions, and receive answers grounded in their document content. The system also detects contradictions, duplicates, and quality issues across documents.

### Stack

- **Frontend**: Next.js 15 (React 19, Tailwind CSS)
- **LLM**: Claude Haiku 4.5 (chat) / Claude Sonnet 4.6 (analysis)
- **Vector DB**: Pinecone — multilingual-e5-large embeddings (1024 dims)
- **Auth & Data**: Supabase (PostgreSQL + Row Level Security)
- **Billing**: Stripe (credit-based consumption model)

### Multi-Tenant Model

Users belong to organizations (`memberships` table: `user_id`, `org_id`, `role`). All documents, Pinecone namespaces, and credit pools are scoped to `org_id`. Always use `resolveOrg()` from `lib/org.ts` to get the authoritative org — never user metadata.

### Document Ingestion Flow

```
Upload → Text extraction (PDF/docx/md/txt) → Chunking (2000 chars, 200 overlap)
       → Pinecone Inference API embeddings (batch 20, rate-limited)
       → Pinecone (vectors, namespace=orgId) + Supabase (metadata + full_text)
```

`app/api/ingest/route.ts` handles validation and collision detection (manual uploads reject duplicate filenames; Google Drive docs with `source='google_drive'` are exempt).

### RAG Query Flow (`lib/rag.ts`)

1. Embed user question → Pinecone search (top 15 chunks, min score 0.3)
2. Deduplicate to ≤4 source documents
3. **Fetch full document text from Supabase** (not just chunks) — avoids context loss from bad chunk boundaries
4. Pass full docs + conversation history to Claude Haiku
5. Return answer + source citations

### Analysis Pipeline (`lib/analysis/pipeline.ts`)

When requested, the system runs multi-step analysis against existing docs:
- Claim extraction → Pinecone retrieval → Contradiction/duplicate verification → Synthesis
- Each step calls Claude via `lib/analysis/llm-client.ts`
- Results are confidence-scored findings users can accept/reject before saving improvements

### Credits & Billing

Every AI endpoint atomically deducts credits via Supabase RPC `consume_credits(p_org_id, p_amount)`. Never decrement credits directly — parallel requests can overdraw.

| Endpoint | Cost |
|---|---|
| `/api/ask` | 1 credit |
| `/api/analyze-v2` (regular) | 5 credits |
| `/api/analyze-v2` (exhaustive) | 20 credits |
| `/api/analyze-style` | 2 credits |
| `/api/improve` | 1 credit |

Stripe webhooks update `organizations.subscription_id`, `canceled_at`, and `grace_period_ends_at` (90-day grace after cancellation).

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

### Key Files

| File | Purpose |
|---|---|
| `lib/org.ts` | `resolveOrg()` — user → org + role |
| `lib/rag.ts` | Core RAG engine |
| `lib/credits.ts` | `consumeCredits()`, `CREDIT_COSTS` |
| `lib/chunking.ts` | Text extraction + chunking |
| `lib/embeddings.ts` | Pinecone Inference API with rate limiting |
| `lib/analysis/pipeline.ts` | Multi-step document analysis orchestration |
| `lib/analysis/llm-client.ts` | Robust Claude API wrapper |
| `app/api/ingest/route.ts` | File upload + indexing |
| `app/api/ask/route.ts` | Chat endpoint |
| `app/api/billing/` | Stripe webhook + checkout + portal |
| `app/api/drive/` | Google Drive OAuth + sync |
| `supabase-setup.sql` | DB schema + RLS policies |

### Gotchas

- Older documents may lack `full_text` in Supabase — fallback to reconstructing from chunks.
- Pinecone free tier rate-limits at 250K tokens/min; `lib/embeddings.ts` auto-waits 60s on 429.
- RLS policies enforce `org_id` on all tables; use the service role client server-side.

## Reglas de trabajo con el usuario

### Perfil del usuario
El dueño del proyecto NO es programador. Sube archivos a GitHub manualmente copiando y pegando. Vercel deploya automáticamente al hacer commit.

### Reglas obligatorias
- Archivos completos siempre, no diffs ni fragmentos, salvo archivos largos con cambios mínimos e inequívocos.
- Cambios pequeños con build verde entre medias. Nunca encadenar fixes sin verificar.
- Cuando falle la build, pedir log completo antes de diagnosticar.
- Datos antes que hipótesis.
- Antes de cualquier cambio grande, plan completo aprobado por el usuario.
- Ningún archivo debería superar 400 líneas. Si crece, dividir.
- TypeScript estricto, sin any salvo justificación.
- Toda integración externa pasa por función intermedia.
- Retry con backoff y fallback determinista.
- Cero dependencias nuevas sin razón.
- Idioma del proyecto: español.

### Lo que NUNCA hacer
- Nunca inventar APIs, nombres de archivos o rutas. Si no sabes algo del repo, pregunta.
- Nunca usar localStorage ni sessionStorage.
- Nunca mezclar frontend y backend en el mismo commit sin motivo.
- resolveOrg en todos los endpoints: nunca usar user.user_metadata?.org_id || user.id.
- Créditos se descuentan ANTES de la operación.
