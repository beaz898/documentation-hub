import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { extractText, chunkText } from '@/lib/chunking';

export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const ANALYSIS_PROMPT = `Eres un auditor de documentación corporativa. Tu trabajo es comparar UN DOCUMENTO NUEVO contra TODOS los fragmentos de DOCUMENTOS EXISTENTES que te damos (pueden venir de Google Drive o de subidas manuales — ambos son igual de importantes).

REGLAS DE ORO:
1. NUNCA ignores un documento existente solo porque sea de otra fuente. Trata los de Drive y los manuales por igual.
2. Para CADA documento existente con fragmentos relacionados, evalúa explícitamente si hay duplicado, solapamiento o contradicción. No te saltes ninguno.
3. Si varios fragmentos del documento nuevo coinciden o se contradicen con el MISMO documento existente, agrupa esos hallazgos bajo ese documento.
4. Sé exhaustivo: si un fragmento del nuevo es MUY parecido a uno existente (aunque no sea idéntico), repórtalo como solapamiento.
5. Si detectas datos numéricos, fechas, plazos, cantidades o nombres que no coinciden entre el nuevo y un existente, repórtalo como discrepancia — siempre.

QUÉ DETECTAR:
- DUPLICADO: el documento nuevo es sustancialmente el mismo (>80%) que otro ya existente. Da el nombre exacto.
- SOLAPAMIENTO: partes del nuevo coinciden con partes de otros docs. Lista TODOS los docs con los que solapa, no solo uno.
- DISCREPANCIAS: datos concretos (cifras, fechas, nombres, plazos) que se contradicen entre el nuevo y uno existente.
- INFORMACIÓN NUEVA: qué aporta que no exista ya.
- ACCIONES RECOMENDADAS: sugiere acciones concretas para cada problema detectado.

IMPORTANTE: Responde SOLO con un JSON válido, sin markdown, sin explicaciones fuera del JSON. Las descripciones deben ser breves pero precisas (máximo 25 palabras cada una). Siempre incluye el nombre exacto del documento afectado.

{"isDuplicate":true/false,"duplicateOf":"nombre o null","duplicateConfidence":0-100,"overlaps":[{"existingDocument":"nombre","description":"breve","severity":"alta/media/baja"}],"discrepancies":[{"topic":"tema","newDocSays":"breve","existingDocSays":"breve","existingDocument":"nombre"}],"newInformation":"breve resumen","recommendation":"INDEXAR/REVISAR/NO_INDEXAR","suggestedActions":[{"action":"REEMPLAZAR/FUSIONAR/CORREGIR_EXISTENTE/CORREGIR_NUEVO/IGNORAR","target":"nombre del doc afectado","reason":"breve explicación"}],"summary":"2 frases máximo"}`;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const orgId = user.user_metadata?.org_id || user.id;

    const body = await req.json();
    const { storagePath, fileName } = body;

    if (!storagePath || !fileName) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // 1. Download and extract text from new file
    console.log(`[ANALYZE] Downloading ${fileName} from storage`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Error descargando archivo' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, fileName);

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'No se pudo extraer texto suficiente' }, { status: 400 });
    }

    // 2. Sample the new document (more samples for bigger docs)
    const chunks = chunkText(text, 'temp', fileName, orgId);
    const sampleCount = Math.min(8, Math.max(5, Math.floor(chunks.length / 4)));
    const sampleIndices = getSampleIndices(chunks.length, sampleCount);
    const sampleChunks = sampleIndices.map(i => chunks[i]);
    const sampleTexts = sampleChunks.map(c => c.text);

    console.log(`[ANALYZE] Document has ${chunks.length} chunks, sampling ${sampleTexts.length} for analysis`);

    // 3. Embed samples
    const sampleEmbeddings = await generateEmbeddings(sampleTexts);

    // 4. Search Pinecone — broader search to catch Drive AND manual matches
    const index = getIndex();

    // First, figure out which doc IDs belong to the org so we can filter out
    // self-matches when the user is re-uploading a manual with the same name.
    const { data: orgDocs } = await supabase
      .from('documents')
      .select('id, name, source')
      .eq('org_id', orgId);

    // Build a map: docName + source => doc row (so we can distinguish Drive vs Manual with same name)
    // We only want to EXCLUDE self-matches when the existing doc is ALSO a manual with the same name.
    // Manuals with the same name AS the new file (different source) should still be compared.
    const manualsWithSameName = new Set(
      (orgDocs || [])
        .filter(d => d.name === fileName && d.source !== 'google_drive')
        .map(d => d.id)
    );

    const allSimilarFragments: Array<{
      documentName: string;
      documentId: string;
      source: string;
      text: string;
      score: number;
    }> = [];

    for (let i = 0; i < sampleEmbeddings.length; i++) {
      const queryResponse = await index.namespace(orgId).query({
        vector: sampleEmbeddings[i],
        topK: 8,                           // WAS 3 — expanded to catch multi-doc similarity
        includeMetadata: true,
      });

      const matches = queryResponse.matches || [];
      for (const match of matches) {
        if (match.metadata && match.score && match.score > 0.28) {   // WAS 0.35
          const docName = String(match.metadata.documentName || '');
          const docId = String(match.metadata.documentId || '');
          const source = String(match.metadata.source || 'manual');

          // Only skip if this match is literally the same manual doc we're replacing
          // (same name, same source = manual). We DO allow matching against a Drive doc
          // with the same name — they're different documents on purpose.
          if (manualsWithSameName.has(docId)) continue;

          allSimilarFragments.push({
            documentName: docName,
            documentId: docId,
            source,
            text: String(match.metadata.text || ''),
            score: match.score,
          });
        }
      }
    }

    console.log(`[ANALYZE] Raw matches: ${allSimilarFragments.length} fragments`);

    if (allSimilarFragments.length === 0) {
      console.log(`[ANALYZE] No similar documents found, safe to index`);
      return NextResponse.json({
        success: true,
        analysis: {
          isDuplicate: false,
          duplicateOf: null,
          duplicateConfidence: 0,
          overlaps: [],
          discrepancies: [],
          newInformation: 'Todo el contenido es nuevo para el sistema.',
          recommendation: 'INDEXAR',
          summary: `No se encontraron documentos similares. "${fileName}" aporta información completamente nueva al sistema.`,
        },
        hasIssues: false,
      });
    }

    // 5. Deduplicate by (documentId) and keep the best fragments per document
    // Use documentId (not name) because Drive and Manual can share a name.
    const uniqueByDocId = new Map<string, typeof allSimilarFragments>();
    for (const frag of allSimilarFragments) {
      const existing = uniqueByDocId.get(frag.documentId) || [];
      if (existing.length < 4) {
        existing.push(frag);
        uniqueByDocId.set(frag.documentId, existing);
      }
    }

    // Flatten, sort by score, cap
    const topSimilarFragments = Array.from(uniqueByDocId.values()).flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    // How many DISTINCT documents did we find?
    const distinctDocs = new Set(topSimilarFragments.map(f => f.documentId));
    console.log(`[ANALYZE] Found ${topSimilarFragments.length} top fragments from ${distinctDocs.size} distinct documents`);

    // Log per-document stats
    for (const [docId, frags] of uniqueByDocId.entries()) {
      const docName = frags[0]?.documentName || '?';
      const src = frags[0]?.source || '?';
      const maxScore = Math.max(...frags.map(f => f.score));
      console.log(`[ANALYZE]   - ${docName} [${src}] (id=${docId.slice(0, 8)}): ${frags.length} frags, maxScore=${maxScore.toFixed(3)}`);
    }

    const avgScore = topSimilarFragments.reduce((sum, f) => sum + f.score, 0) / topSimilarFragments.length;
    const maxScore = Math.max(...topSimilarFragments.map(f => f.score));

    // 6. Build context for Gemini — include source label for each fragment
    const newDocContext = sampleTexts
      .map((t, i) => `[Fragmento ${i + 1} del documento nuevo "${fileName}"]\n${t}`)
      .join('\n\n---\n\n');

    const existingContext = topSimilarFragments
      .map((f, i) => {
        const srcLabel = f.source === 'google_drive' ? 'Google Drive' : 'Manual';
        return `[Fragmento ${i + 1} — "${f.documentName}" (fuente: ${srcLabel}, similitud: ${Math.round(f.score * 100)}%)]\n${f.text}`;
      })
      .join('\n\n---\n\n');

    const userMessage = `DOCUMENTO NUEVO: "${fileName}"

${newDocContext}

---

DOCUMENTOS EXISTENTES CON CONTENIDO SIMILAR (${distinctDocs.size} documento${distinctDocs.size !== 1 ? 's' : ''} distinto${distinctDocs.size !== 1 ? 's' : ''} encontrado${distinctDocs.size !== 1 ? 's' : ''}):

${existingContext}

---

INSTRUCCIÓN FINAL: Analiza el documento nuevo contra TODOS los ${distinctDocs.size} documentos existentes listados arriba. No ignores ninguno. Para cada documento existente con contenido relacionado, decide si hay duplicado, solapamiento o discrepancia y repórtalo en el JSON.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ANALYSIS_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          maxOutputTokens: 3072,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[ANALYZE] Gemini error:', errorData);
      return NextResponse.json({
        success: true,
        analysis: {
          isDuplicate: false,
          overlaps: [],
          discrepancies: [],
          recommendation: 'INDEXAR',
          summary: 'No se pudo completar el análisis automático. Se recomienda indexar y revisar manualmente.',
        },
        hasIssues: false,
        analysisError: true,
      });
    }

    const data = await response.json();
    const rawAnswer = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || '';

    console.log(`[ANALYZE] Raw AI response length: ${rawAnswer.length} chars`);

    let analysis;
    let parseSuccess = false;
    try {
      let cleaned = rawAnswer.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      if (!cleaned.endsWith('}')) {
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace > 0) {
          cleaned = cleaned.substring(0, lastBrace + 1);
        }
      }
      analysis = JSON.parse(cleaned);
      parseSuccess = true;
      console.log(`[ANALYZE] JSON parsed successfully`);
    } catch (parseError) {
      console.error('[ANALYZE] Failed to parse JSON. Raw response:', rawAnswer.substring(0, 500));

      const similarDocNames = [...new Set(topSimilarFragments.map(f => f.documentName))];

      analysis = {
        isDuplicate: maxScore > 0.85,
        duplicateOf: maxScore > 0.85 ? similarDocNames[0] : null,
        duplicateConfidence: Math.round(maxScore * 100),
        overlaps: similarDocNames.map(name => ({
          existingDocument: name,
          description: `Contenido muy similar detectado (${Math.round(maxScore * 100)}% similitud)`,
          severity: maxScore > 0.8 ? 'alta' : maxScore > 0.6 ? 'media' : 'baja',
        })),
        discrepancies: [],
        newInformation: 'No se pudo determinar (análisis parcial)',
        recommendation: maxScore > 0.8 ? 'REVISAR' : 'INDEXAR',
        summary: `Se detectó contenido similar a ${similarDocNames.join(', ')} con ${Math.round(maxScore * 100)}% de similitud. Se recomienda revisar antes de indexar.`,
      };
    }

    // Enrich the analysis with the source of each mentioned document, so the UI
    // can show "[drive]" or "[manual]" badges next to each problem.
    // Build a name -> sources[] map. If a name exists in multiple sources we still
    // provide both.
    const sourcesByName = new Map<string, Set<string>>();
    for (const f of topSimilarFragments) {
      if (!sourcesByName.has(f.documentName)) sourcesByName.set(f.documentName, new Set());
      sourcesByName.get(f.documentName)!.add(f.source);
    }
    const documentSources: Record<string, string[]> = {};
    for (const [name, sources] of sourcesByName.entries()) {
      documentSources[name] = Array.from(sources);
    }

    const hasIssues = analysis.isDuplicate ||
      analysis.recommendation === 'REVISAR' ||
      analysis.recommendation === 'NO_INDEXAR' ||
      (analysis.discrepancies && analysis.discrepancies.length > 0) ||
      (analysis.overlaps && analysis.overlaps.length > 0);

    console.log(`[ANALYZE] Complete: recommendation=${analysis.recommendation}, hasIssues=${hasIssues}, parseSuccess=${parseSuccess}, avgScore=${avgScore.toFixed(3)}`);

    return NextResponse.json({
      success: true,
      analysis,
      hasIssues,
      documentSources,
    });

  } catch (error: unknown) {
    console.error('Error in /api/analyze:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Selecciona índices representativos distribuidos por el documento */
function getSampleIndices(total: number, count: number): number[] {
  if (total <= count) return Array.from({ length: total }, (_, i) => i);
  const indices: number[] = [0];
  const step = (total - 1) / (count - 1);
  for (let i = 1; i < count - 1; i++) {
    indices.push(Math.round(step * i));
  }
  indices.push(total - 1);
  return [...new Set(indices)].sort((a, b) => a - b);
}
