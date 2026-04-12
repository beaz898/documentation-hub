# Pipeline de análisis documental v2

Arquitectura en 4 etapas, cada una en su módulo:

1. **retrieval.ts** — recupera candidatos amplios de Pinecone (embeddings). Umbral bajo, no decide.
2. **rerank.ts** — (pendiente) LLM filtra los candidatos reales.
3. **judge.ts** — (pendiente) LLM emite juicio por documento finalista.
4. **synthesize.ts** — (pendiente) LLM genera recomendación final.

El orquestador es `pipeline.ts`. El endpoint `/api/analyze-v2` lo llama.

## Migración a providers de pago

Cambiar solo:
- `retrieval.ts` → función `generateEmbeddings` de Voyage en lugar de Pinecone.
- `gemini-client.ts` → body de `callLLM` para apuntar a Claude.
- Opcionalmente añadir `lib/analysis/rerank-cohere.ts` cuando se implemente rerank.

El resto del pipeline NO cambia.
