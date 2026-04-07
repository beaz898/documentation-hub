'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import ChatMessage from '@/components/ChatMessage';
import DocumentsSidebar from '@/components/DocumentsSidebar';
import AnalysisModal from '@/components/AnalysisModal';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'loading' | 'error';
  content: string;
  sources?: Array<{ documentName: string; score: number }>;
}

interface Document {
  id: string;
  name: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
  status: string;
  source?: string;
}

interface DriveStatus {
  connected: boolean;
  email?: string;
  folderName?: string;
  lastSynced?: string;
  folders?: Array<{ id: string; name: string; fileCount: number }>;
}

interface PendingAnalysis {
  fileName: string;
  storagePath: string;
  fileSize: number;
  analysis: Record<string, unknown>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<{ access_token: string; user: { email?: string; id: string } } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<PendingAnalysis | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ connected: false });
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Detect mobile
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ access_token: s.access_token, user: { email: s.user.email, id: s.user.id } });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) router.replace('/login');
    });
    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  // Handle Drive OAuth callback
  useEffect(() => {
    if (searchParams.get('drive_connected') === 'true') {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Google Drive conectado correctamente. Pulsa **Sincronizar** para indexar los documentos.' }]);
      loadDriveStatus();
      // Clean URL
      window.history.replaceState({}, '', '/chat');
    }
    if (searchParams.get('drive_error')) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: `Error conectando Google Drive: ${searchParams.get('drive_error')}` }]);
      window.history.replaceState({}, '', '/chat');
    }
  }, [searchParams]);

  // Load documents
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

  // Load Drive status
  const loadDriveStatus = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/drive/sync', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setDriveStatus(data);
      }
    } catch (err) { console.error('Error loading drive status:', err); }
  }, [session]);

  useEffect(() => { if (session) { loadDocuments(); loadDriveStatus(); } }, [session, loadDocuments, loadDriveStatus]);

  // Connect Google Drive
  function handleConnectDrive() {
    if (!session) return;
    window.location.href = `/api/drive?token=${session.access_token}`;
  }

  // Sync Google Drive
  async function handleSyncDrive() {
    if (!session || syncing) return;
    setSyncing(true);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Sincronizando con Google Drive...' }]);

    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        const stats = data.stats;
        const parts = [
          `**${stats.new}** nuevo${stats.new !== 1 ? 's' : ''}`,
          `**${stats.updated}** actualizado${stats.updated !== 1 ? 's' : ''}`,
          `**${stats.deleted ?? 0}** eliminado${(stats.deleted ?? 0) !== 1 ? 's' : ''}`,
          `**${stats.skipped}** sin cambios`,
        ];
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Sincronización completada: ${parts.join(', ')}.`,
        }]);
        await loadDocuments();
        await loadDriveStatus();
      } else {
        const data = await res.json();
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: data.error || 'Error sincronizando' }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: 'Error de conexión al sincronizar' }]);
    } finally {
      setSyncing(false);
    }
  }

  // Disconnect Drive
  async function handleDisconnectDrive() {
    if (!session || !window.confirm('¿Desconectar Google Drive? Se eliminarán todos los documentos sincronizados.')) return;

    try {
      await fetch('/api/drive/disconnect', {
        method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setDriveStatus({ connected: false });
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Google Drive desconectado.' }]);
      await loadDocuments();
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: 'Error desconectando Drive' }]);
    }
  }

  // Upload document with analysis
  async function handleUpload(file: File) {
    if (!session) return;

    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file);

    if (uploadError) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: `Error subiendo archivo: ${uploadError.message}` }]);
      throw new Error(uploadError.message);
    }

    if (documents.length > 0) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Analizando **${file.name}**...` }]);
      try {
        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ storagePath, fileName: file.name }),
        });
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          if (analyzeData.hasIssues) {
            setPendingAnalysis({ fileName: file.name, storagePath, fileSize: file.size, analysis: analyzeData.analysis });
            return;
          } else {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Análisis completado: sin problemas. Indexando...` }]);
          }
        }
      } catch (e) { console.error('Analysis failed:', e); }
    }

    await indexDocument(storagePath, file.name, file.size);
  }

  async function indexDocument(storagePath: string, fileName: string, fileSize: number) {
    if (!session) return;
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ storagePath, fileName, fileSize }),
    });
    if (!res.ok) {
      const data = await res.json();
      await supabase.storage.from('documents').remove([storagePath]);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: data.error || 'Error procesando' }]);
      return;
    }
    const data = await res.json();
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(), role: 'assistant',
      content: data.replaced
        ? `Documento **${data.document.name}** actualizado (${data.document.chunks} fragmentos).`
        : `Documento **${data.document.name}** indexado (${data.document.chunks} fragmentos).`,
    }]);
    await loadDocuments();
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
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Subida de **${pendingAnalysis.fileName}** cancelada.` }]);
    setPendingAnalysis(null);
  }

  async function handleDelete(id: string) {
    if (!session) return;
    const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error'); }
    await loadDocuments();
  }

  async function handleSend() {
    const question = input.trim();
    if (!question || sending || !session) return;
    if (documents.length === 0) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: 'Sube o sincroniza documentos primero.' }]);
      return;
    }
    setInput(''); setSending(true);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question };
    const loadingMsg: Message = { id: crypto.randomUUID(), role: 'loading', content: '' };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    try {
      const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat({ id: crypto.randomUUID(), role: 'error', content: data.error || `Error ${res.status}` }));
        return;
      }
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat({ id: crypto.randomUUID(), role: 'assistant', content: data.answer, sources: data.sources }));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat({ id: crypto.randomUUID(), role: 'error', content: 'Error de conexión.' }));
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleLogout() { await supabase.auth.signOut(); router.replace('/login'); }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const t = e.target; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px';
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {isMobile && sidebarOpen && <div className="sidebar-mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      <div style={{
        flexShrink: 0, transition: 'width 0.25s ease, transform 0.25s ease',
        width: isMobile ? 270 : (sidebarOpen ? 260 : 0), overflow: 'hidden',
        ...(isMobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 41, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', boxShadow: sidebarOpen ? 'var(--shadow-md)' : 'none' } : {}),
      }}>
        <div style={{ width: 260, height: '100%' }}>
          <DocumentsSidebar
            documents={documents} loading={docsLoading}
            driveStatus={driveStatus} syncing={syncing}
            onUpload={handleUpload} onDelete={handleDelete}
            onConnectDrive={handleConnectDrive} onSyncDrive={handleSyncDrive} onDisconnectDrive={handleDisconnectDrive}
            onLogout={handleLogout} onClose={isMobile ? () => setSidebarOpen(false) : undefined}
            userEmail={session.user.email || 'Usuario'}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar" style={{
            width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen && !isMobile ? (<><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></>) : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 14, fontWeight: 600 }}>Documentation Hub</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {documents.length > 0 ? `${documents.length} documento${documents.length !== 1 ? 's' : ''}` : 'Sube documentos para empezar'}
            </p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { if (window.confirm('¿Limpiar conversación?')) setMessages([]); }}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Limpiar chat
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: 'var(--brand-light)', border: '0.5px solid var(--brand)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /></svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Pregunta sobre tu documentación</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400 }}>
                {documents.length > 0 ? 'Escribe cualquier pregunta y buscaré la respuesta.' : 'Conecta Google Drive o sube documentos para empezar.'}
              </p>
            </div>
          ) : (
            messages.map(msg => <ChatMessage key={msg.id} role={msg.role} content={msg.content} sources={msg.sources} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '8px 10px' }}>
            <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
              placeholder={documents.length > 0 ? 'Escribe tu pregunta...' : 'Sube documentos primero...'} disabled={sending} rows={1}
              style={{ flex: 1, resize: 'none', outline: 'none', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', lineHeight: 1.5, maxHeight: 140, minHeight: 20 }} />
            <button onClick={handleSend} disabled={sending || !input.trim()} aria-label="Enviar"
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: sending || !input.trim() ? 'var(--bg-tertiary)' : 'var(--brand)', color: sending || !input.trim() ? 'var(--text-muted)' : '#fff', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {sending ? <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
            </button>
          </div>
          <p style={{ fontSize: 10, marginTop: 6, textAlign: 'center', color: 'var(--text-muted)' }}>Las respuestas se basan exclusivamente en tu documentación</p>
        </div>
      </div>

      {pendingAnalysis && <AnalysisModal fileName={pendingAnalysis.fileName} analysis={pendingAnalysis.analysis} onConfirm={handleAnalysisConfirm} onCancel={handleAnalysisCancel} />}
    </div>
  );
}
