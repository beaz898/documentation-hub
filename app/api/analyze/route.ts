import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { extractText, chunkText } from '@/lib/chunking';

export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const ANALYSIS_PROMPT = `Eres un auditor de documentación. Compara el DOCUMENTO NUEVO con los DOCUMENTOS EXISTENTES.

Detecta:
1. DUPLICADO: ¿Es el mismo contenido con otro nombre? (>80% igual)
2. SOLAPAMIENTO: ¿Qué partes ya están en otros documentos?
3. DISCREPANCIAS: ¿Hay datos que se contradigan entre documentos?
4. INFORMACIÓN NUEVA: ¿Qué aporta que no existía?

IMPORTANTE: Responde SOLO con un JSON válido, sin markdown, sin explicaciones fuera del JSON. Las descripciones deben ser MUY BREVES (máximo 15 palabras cada una). El JSON debe ser compacto.

{"isDuplicate":true/false,"duplicateOf":"nombre o null","duplicateConfidence":0-100,"overlaps":[{"existingDocument":"nombre","description":"breve","severity":"alta/media/baja"}],"discrepancies":[{"topic":"tema","newDocSays":"breve","existingDocSays":"breve","existingDocument":"nombre"}],"newInformation":"breve resumen","recommendation":"INDEXAR/REVISAR/NO_INDEXAR","summary":"2 frases máximo"}`;

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
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

    // 1. Descargar y extraer texto del archivo nuevo
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

    // 2. Tomar fragmentos representativos del documento nuevo (inicio, medio, final)
    const chunks = chunkText(text, 'temp', fileName, orgId);
    const sampleIndices = getSampleIndices(chunks.length, 5);
    const sampleChunks = sampleIndices.map(i => chunks[i]);
    const sampleTexts = sampleChunks.map(c => c.text);

    console.log(`[ANALYZE] Document has ${chunks.length} chunks, sampling ${sampleTexts.length} for analysis`);

    // 3. Generar embeddings de los fragmentos muestra
    const sampleEmbeddings = await generateEmbeddings(sampleTexts);

    // 4. Buscar fragmentos similares en documentos existentes
    const index = getIndex();
    const allSimilarFragments: Array<{
      documentName: string;
      text: string;
      score: number;
    }> = [];

    for (let i = 0; i < sampleEmbeddings.length; i++) {
      const queryResponse = await index.namespace(orgId).query({
        vector: sampleEmbeddings[i],
        topK: 3,
        includeMetadata: true,
      });

      const matches = queryResponse.matches || [];
      for (const match of matches) {
        if (match.metadata && match.score && match.score > 0.35) {
          const docName = String(match.metadata.documentName || '');
          // No comparar con sí mismo si ya existe con el mismo nombre
          if (docName !== fileName) {
            allSimilarFragments.push({
              documentName: docName,
              text: String(match.metadata.text || ''),
              score: match.score,
            });
          }
        }
      }
    }

    // Si no hay documentos existentes similares, no hace falta análisis profundo
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

    // 5. Deduplicar fragmentos similares (quedarnos con los más relevantes por documento)
    const uniqueByDoc = new Map<string, typeof allSimilarFragments>();
    for (const frag of allSimilarFragments) {
      const existing = uniqueByDoc.get(frag.documentName) || [];
      if (existing.length < 3) {
        existing.push(frag);
        uniqueByDoc.set(frag.documentName, existing);
      }
    }

    const topSimilarFragments = Array.from(uniqueByDoc.values()).flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log(`[ANALYZE] Found ${topSimilarFragments.length} similar fragments from ${uniqueByDoc.size} documents`);

    // Detección rápida: si la similitud media es muy alta, es casi seguro un duplicado
    const avgScore = topSimilarFragments.reduce((sum, f) => sum + f.score, 0) / topSimilarFragments.length;
    const maxScore = Math.max(...topSimilarFragments.map(f => f.score));
    const mostSimilarDoc = topSimilarFragments[0]?.documentName || '';

    console.log(`[ANALYZE] Similarity stats: avgScore=${avgScore.toFixed(3)}, maxScore=${maxScore.toFixed(3)}, mostSimilar="${mostSimilarDoc}"`);

    // 6. Enviar a la IA para análisis
    const newDocContext = sampleTexts
      .map((t, i) => `[Fragmento ${i + 1} del documento nuevo "${fileName}"]\n${t}`)
      .join('\n\n---\n\n');

    const existingContext = topSimilarFragments
      .map((f, i) => `[Fragmento ${i + 1} - "${f.documentName}" (similitud: ${Math.round(f.score * 100)}%)]\n${f.text}`)
      .join('\n\n---\n\n');

    const userMessage = `DOCUMENTO NUEVO: "${fileName}"

${newDocContext}

---

DOCUMENTOS EXISTENTES CON CONTENIDO SIMILAR:

${existingContext}`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: ANALYSIS_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[ANALYZE] Gemini error:', errorData);
      // Si falla el análisis, permitir indexar de todas formas
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

    // Parsear el JSON de la respuesta
    let analysis;
    let parseSuccess = false;
    try {
      let cleaned = rawAnswer.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      // Intentar arreglar JSON truncado: si no termina en }, añadirlo
      if (!cleaned.endsWith('}')) {
        // Buscar el último } válido
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

      // Fallback: si hay fragmentos similares con alta puntuación, marcar como problema
      const maxScore = topSimilarFragments.length > 0
        ? Math.max(...topSimilarFragments.map(f => f.score))
        : 0;
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

    const hasIssues = analysis.isDuplicate ||
      analysis.recommendation === 'REVISAR' ||
      analysis.recommendation === 'NO_INDEXAR' ||
      (analysis.discrepancies && analysis.discrepancies.length > 0) ||
      (analysis.overlaps && analysis.overlaps.some((o: { severity: string }) => o.severity === 'alta'));

    console.log(`[ANALYZE] Complete: recommendation=${analysis.recommendation}, hasIssues=${hasIssues}, parseSuccess=${parseSuccess}`);

    return NextResponse.json({
      success: true,
      analysis,
      hasIssues,
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
  const indices: number[] = [0]; // siempre el primero
  const step = (total - 1) / (count - 1);
  for (let i = 1; i < count - 1; i++) {
    indices.push(Math.round(step * i));
  }
  indices.push(total - 1); // siempre el último
  return [...new Set(indices)].sort((a, b) => a - b);
}
