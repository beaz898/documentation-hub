import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { getOrgFeatures } from '@/lib/plan-features';

/**
 * GET /api/usage/analytics?tab=quality|chat&days=7|14|30
 * Solo accesible para admins.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden ver analytics.' }, { status: 403 });
    }

    const features = await getOrgFeatures(supabase, org.orgId);
    if (!features.hasAnalyticsPanel) {
      return NextResponse.json(
        { error: 'Panel de inteligencia documental disponible en el plan Business' },
        { status: 403 }
      );
    }

    const tab = req.nextUrl.searchParams.get('tab') || 'quality';
    const days = Math.max(1, parseInt(req.nextUrl.searchParams.get('days') || '30', 10));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString();
    const orgId = org.orgId;

    // ── Calidad documental ────────────────────────────────────
    if (tab === 'quality') {
      const { data: rows } = await supabase
        .from('analysis_results')
        .select('document_name, analysis_type, contradictions_found, contradictions_confirmed, duplicates_found, overlaps_found, style_problems_found, recommendation, created_at')
        .eq('org_id', orgId)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: true });

      const data = rows || [];

      const totalContradictions = data.reduce((s, r) => s + (r.contradictions_found ?? 0), 0);
      const totalConfirmed     = data.reduce((s, r) => s + (r.contradictions_confirmed ?? 0), 0);
      const totalDuplicates    = data.reduce((s, r) => s + (r.duplicates_found ?? 0), 0);
      const totalOverlaps      = data.reduce((s, r) => s + (r.overlaps_found ?? 0), 0);
      const totalStyle         = data.reduce((s, r) => s + (r.style_problems_found ?? 0), 0);

      const byType: Record<string, number> = { quick: 0, exhaustive: 0, style: 0 };
      const recommendations: Record<string, number> = { INDEXAR: 0, REVISAR: 0, NO_INDEXAR: 0, sin_dato: 0 };
      const docMap: Record<string, { contradictions: number; duplicates: number; overlaps: number; style: number }> = {};
      const dayMap: Record<string, { analyses: number; issues: number }> = {};

      for (const r of data) {
        byType[r.analysis_type] = (byType[r.analysis_type] ?? 0) + 1;

        const recKey = r.recommendation ?? 'sin_dato';
        recommendations[recKey] = (recommendations[recKey] ?? 0) + 1;

        if (!docMap[r.document_name]) docMap[r.document_name] = { contradictions: 0, duplicates: 0, overlaps: 0, style: 0 };
        docMap[r.document_name].contradictions += r.contradictions_found ?? 0;
        docMap[r.document_name].duplicates     += r.duplicates_found ?? 0;
        docMap[r.document_name].overlaps       += r.overlaps_found ?? 0;
        docMap[r.document_name].style          += r.style_problems_found ?? 0;

        const day = (r.created_at as string).slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { analyses: 0, issues: 0 };
        dayMap[day].analyses++;
        dayMap[day].issues += (r.contradictions_found ?? 0) + (r.duplicates_found ?? 0) + (r.overlaps_found ?? 0) + (r.style_problems_found ?? 0);
      }

      const documentRanking = Object.entries(docMap)
        .map(([name, v]) => ({ name, total: v.contradictions + v.duplicates + v.overlaps + v.style, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const byDay = Object.entries(dayMap)
        .map(([day, v]) => ({ day, ...v }))
        .sort((a, b) => a.day.localeCompare(b.day));

      return NextResponse.json({
        success: true, days, totalAnalyses: data.length,
        totalContradictions, totalConfirmed, totalDuplicates, totalOverlaps, totalStyle,
        byType, recommendations, documentRanking, byDay,
      });
    }

    // ── Uso del chat ──────────────────────────────────────────
    if (tab === 'chat') {
      const [queriesResult, docsResult] = await Promise.all([
        supabase
          .from('chat_queries')
          .select('question, documents_used, answer_length, created_at')
          .eq('org_id', orgId)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('name')
          .eq('org_id', orgId),
      ]);

      const queries = queriesResult.data || [];
      const allDocs = docsResult.data || [];

      const totalQueries = queries.length;
      const avgAnswerLength = totalQueries > 0
        ? Math.round(queries.reduce((s, q) => s + (q.answer_length ?? 0), 0) / totalQueries)
        : 0;

      // Apariciones + cobertura por documento
      const docCount: Record<string, number> = {};
      const dayMap: Record<string, number> = {};
      const coverageMap: Record<string, { documentId: string; documentName: string; chunks: Set<number>; totalChunks: number }> = {};

      for (const q of queries) {
        const docs = q.documents_used as Array<{ documentId?: string; documentName: string; score?: number; chunks?: number[]; totalChunks?: number }> | null;
        if (Array.isArray(docs)) {
          for (const d of docs) {
            if (d.documentName) docCount[d.documentName] = (docCount[d.documentName] ?? 0) + 1;
            if (d.documentId && Array.isArray(d.chunks) && typeof d.totalChunks === 'number' && d.totalChunks > 0) {
              if (!coverageMap[d.documentId]) {
                coverageMap[d.documentId] = { documentId: d.documentId, documentName: d.documentName, chunks: new Set(), totalChunks: d.totalChunks };
              }
              for (const c of d.chunks) coverageMap[d.documentId].chunks.add(c);
              if (d.totalChunks > coverageMap[d.documentId].totalChunks) coverageMap[d.documentId].totalChunks = d.totalChunks;
            }
          }
        }
        const day = (q.created_at as string).slice(0, 10);
        dayMap[day] = (dayMap[day] ?? 0) + 1;
      }

      const documentCoverage = Object.values(coverageMap)
        .map(({ documentId, documentName, chunks, totalChunks }) => ({
          documentId,
          documentName,
          totalChunks,
          chunksUsados: chunks.size,
          percentage: Math.round((chunks.size / totalChunks) * 100),
        }))
        .sort((a, b) => a.percentage - b.percentage);

      const topDocuments = Object.entries(docCount)
        .map(([documentName, appearances]) => ({ documentName, appearances }))
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 10);

      const usedNames = new Set(Object.keys(docCount));
      const neverUsed = allDocs.filter(d => !usedNames.has(d.name)).map(d => d.name);

      // Consultas recientes deduplicadas
      const seen = new Set<string>();
      const recentQuestions: Array<{ question: string; documentsCount: number; created_at: string }> = [];
      for (const q of queries) {
        const norm = (q.question as string).toLowerCase().trim().replace(/\?$/, '');
        if (!seen.has(norm)) {
          seen.add(norm);
          recentQuestions.push({
            question: q.question as string,
            documentsCount: Array.isArray(q.documents_used) ? q.documents_used.length : 0,
            created_at: q.created_at as string,
          });
        }
        if (recentQuestions.length >= 15) break;
      }

      const byDay = Object.entries(dayMap)
        .map(([day, count]) => ({ day, queries: count }))
        .sort((a, b) => a.day.localeCompare(b.day));

      return NextResponse.json({
        success: true, days, totalQueries, avgAnswerLength,
        topDocuments, neverUsed, recentQuestions, byDay, documentCoverage,
      });
    }

    return NextResponse.json({ error: 'tab inválido' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[usage/analytics]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
