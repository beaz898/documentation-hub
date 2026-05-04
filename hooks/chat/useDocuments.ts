'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { SessionInfo, Document, Message, PendingAnalysis, ImprovementTarget } from './types';

export function useDocuments(
  session: SessionInfo | null,
  addMessage: (msg: Message) => void,
  loadCredits: () => Promise<void>,
) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysis | null>(null);
  const [improvementTarget, setImprovementTarget] = useState<ImprovementTarget | null>(null);
  const [improvementLoading, setImprovementLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState('');
  const supabase = createClient();

  const loadDocuments = useCallback(async () => {
    if (!session) return;
    setDocsLoading(true);
    try {
      const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) { console.error('Error loading documents:', err); }
    finally { setDocsLoading(false); }
  }, [session]);

  async function indexDocument(storagePath: string, fileName: string, fileSize: number, force = false) {
    if (!session) return;
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ storagePath, fileName, fileSize, force }),
    });

    if (res.status === 409) {
      const data = await res.json();
      if (data.collision) {
        const confirmed = window.confirm(
          `Ya existe un documento manual llamado "${fileName}".\n\n` +
          `¿Quieres reemplazarlo por el nuevo?\n\n` +
          `(Los documentos de Google Drive con el mismo nombre NO se tocarán.)`
        );
        if (confirmed) {
          return indexDocument(storagePath, fileName, fileSize, true);
        } else {
          await supabase.storage.from('documents').remove([storagePath]);
          addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `Subida de **${fileName}** cancelada.` });
          return;
        }
      }
    }

    if (!res.ok) {
      const data = await res.json();
      await supabase.storage.from('documents').remove([storagePath]);
      addMessage({ id: crypto.randomUUID(), role: 'error', content: data.error || 'Error procesando' });
      return;
    }
    const data = await res.json();
    addMessage({
      id: crypto.randomUUID(), role: 'assistant',
      content: data.replaced
        ? `Documento **${data.document.name}** actualizado (${data.document.chunks} fragmentos).`
        : `Documento **${data.document.name}** indexado (${data.document.chunks} fragmentos).`,
    });
    await loadDocuments();
  }

  async function handleUpload(file: File) {
    if (!session) return;

    setAnalysisProgress(5);
    setAnalysisPhase('Subiendo documento...');

    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file);

    if (uploadError) {
      setAnalysisProgress(0);
      setAnalysisPhase('');
      addMessage({ id: crypto.randomUUID(), role: 'error', content: `Error subiendo archivo: ${uploadError.message}` });
      throw new Error(uploadError.message);
    }

    setAnalysisProgress(15);

    if (documents.length > 0) {
      setAnalysisPhase('Buscando documentos relacionados...');

      let currentProgress = 15;
      const progressInterval = setInterval(() => {
        currentProgress += 1;
        if (currentProgress >= 30 && currentProgress < 35) setAnalysisPhase('Comparando contenido...');
        if (currentProgress >= 75 && currentProgress < 80) setAnalysisPhase('Generando informe...');
        if (currentProgress >= 92) { clearInterval(progressInterval); return; }
        setAnalysisProgress(currentProgress);
      }, 350);

      try {
        const analyzeRes = await fetch('/api/analyze-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ storagePath, fileName: file.name }),
        });

        clearInterval(progressInterval);

        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          setAnalysisProgress(95);
          setAnalysisPhase('Análisis completado');

          if (analyzeData.hasIssues) {
            await new Promise(r => setTimeout(r, 500));
            setAnalysisProgress(100);
            await new Promise(r => setTimeout(r, 300));
            setAnalysisProgress(0);
            setAnalysisPhase('');

            setPendingAnalysis({
              fileName: file.name, storagePath, fileSize: file.size,
              analysis: analyzeData.analysis, documentSources: analyzeData.documentSources,
            });
            loadCredits();
            return;
          } else {
            setAnalysisProgress(100);
            setAnalysisPhase('Sin problemas detectados');
            await new Promise(r => setTimeout(r, 500));
            setAnalysisProgress(0);
            setAnalysisPhase('');
            addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `Análisis completado: sin problemas. Indexando...` });
            loadCredits();
          }
        } else {
          setAnalysisProgress(0);
          setAnalysisPhase('');
        }
      } catch (e) {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        setAnalysisPhase('');
        console.error('Analysis failed:', e);
      }
    }

    setAnalysisProgress(0);
    setAnalysisPhase('');
    await indexDocument(storagePath, file.name, file.size);
  }

  async function handleAnalysisConfirm() {
    if (!pendingAnalysis) return;
    const { storagePath, fileName, fileSize } = pendingAnalysis;
    setPendingAnalysis(null);
    await indexDocument(storagePath, fileName, fileSize);
  }

  async function handleAnalysisCancel() {
    if (!pendingAnalysis) return;
    await supabase.storage.from('documents').remove([pendingAnalysis.storagePath]);
    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `Subida de **${pendingAnalysis.fileName}** cancelada.` });
    setPendingAnalysis(null);
  }

  async function handleAnalysisImprove() {
    if (!pendingAnalysis || !session) return;
    const { storagePath, fileName, analysis, documentSources } = pendingAnalysis;
    setImprovementLoading(true);
    try {
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ storagePath, fileName }),
      });
      if (!res.ok) {
        const err = await res.json();
        addMessage({ id: crypto.randomUUID(), role: 'error', content: `No se pudo abrir el modo mejora: ${err.error}` });
        return;
      }
      const data = await res.json();
      const existing = documents.find(d => d.name === fileName && d.source !== 'google_drive');

      // Si viene de análisis rápido, quitar contradicciones sin verificar.
      // El chat de mejora solo debe trabajar con duplicidades (overlaps).
      // Las contradicciones se verifican y trabajan desde el análisis exhaustivo.
      const analysisForImprovement = analysis.analysisMode === 'quick'
        ? { ...analysis, discrepancies: [] }
        : analysis;

      setImprovementTarget({
        fileName, storagePath, initialText: data.text,
        analysis: analysisForImprovement, documentSources,
        existingDocWithSameName: existing ? { id: existing.id, name: existing.name } : null,
      });
      setPendingAnalysis(null);
    } catch {
      addMessage({ id: crypto.randomUUID(), role: 'error', content: 'Error de conexión al abrir el modo mejora.' });
    } finally {
      setImprovementLoading(false);
    }
  }

  async function handleExhaustiveAnalysis() {
    if (!pendingAnalysis || !session) return;
    const { storagePath, fileName, fileSize } = pendingAnalysis;
    const savedDocumentSources = pendingAnalysis.documentSources;
    const savedAnalysis = pendingAnalysis.analysis;
    setPendingAnalysis(null);

    setAnalysisProgress(5);
    setAnalysisPhase('Iniciando análisis exhaustivo...');

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += 0.5;
      if (currentProgress >= 15 && currentProgress < 16) setAnalysisPhase('Analizando todos los fragmentos...');
      if (currentProgress >= 40 && currentProgress < 41) setAnalysisPhase('Comparando contra el corpus...');
      if (currentProgress >= 65 && currentProgress < 66) setAnalysisPhase('Verificando contradicciones...');
      if (currentProgress >= 85 && currentProgress < 86) setAnalysisPhase('Generando informe exhaustivo...');
      if (currentProgress >= 92) { clearInterval(progressInterval); return; }
      setAnalysisProgress(Math.round(currentProgress));
    }, 600);

    try {
      const analyzeRes = await fetch('/api/analyze-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ storagePath, fileName, exhaustive: true }),
      });

      clearInterval(progressInterval);

      if (analyzeRes.ok) {
        const analyzeData = await analyzeRes.json();
        setAnalysisProgress(95);
        setAnalysisPhase('Análisis exhaustivo completado');
        await new Promise(r => setTimeout(r, 500));
        setAnalysisProgress(100);
        await new Promise(r => setTimeout(r, 300));
        setAnalysisProgress(0);
        setAnalysisPhase('');

        setPendingAnalysis({
          fileName, storagePath, fileSize,
          analysis: analyzeData.analysis,
          documentSources: analyzeData.documentSources ?? savedDocumentSources,
        });
        loadCredits();
      } else {
        setAnalysisProgress(0);
        setAnalysisPhase('');
        const errData = await analyzeRes.json().catch(() => ({ error: 'Error desconocido' }));
        addMessage({ id: crypto.randomUUID(), role: 'error', content: `Error en análisis exhaustivo: ${errData.error || `Error ${analyzeRes.status}`}` });
        setPendingAnalysis({ fileName, storagePath, fileSize, analysis: savedAnalysis, documentSources: savedDocumentSources });
      }
    } catch {
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setAnalysisPhase('');
      addMessage({ id: crypto.randomUUID(), role: 'error', content: 'Error de conexión al ejecutar el análisis exhaustivo.' });
      setPendingAnalysis({ fileName, storagePath, fileSize, analysis: savedAnalysis, documentSources: savedDocumentSources });
    }
  }

  async function handleImprovementClose() {
    if (!improvementTarget) return;
    const path = improvementTarget.storagePath;
    const name = improvementTarget.fileName;
    setImprovementTarget(null);
    try { await supabase.storage.from('documents').remove([path]); } catch { /* ignore */ }
    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `Subida de **${name}** descartada.` });
  }

  async function handleImprovementIndexed(finalName: string, wasReplaced: boolean) {
    setImprovementTarget(null);
    addMessage({
      id: crypto.randomUUID(), role: 'assistant',
      content: wasReplaced
        ? `Versión corregida indexada, reemplazando el documento original **${finalName}**.`
        : `Versión corregida indexada como **${finalName}**.`,
    });
    await loadDocuments();
  }

  async function handleDelete(id: string) {
    if (!session) return;
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error'); }
    await loadDocuments();
  }

  return {
    documents, docsLoading, loadDocuments,
    pendingAnalysis, improvementTarget, improvementLoading,
    analysisProgress, analysisPhase,
    handleUpload, handleDelete,
    handleAnalysisConfirm, handleAnalysisCancel, handleAnalysisImprove, handleExhaustiveAnalysis,
    handleImprovementClose, handleImprovementIndexed,
  };
}
