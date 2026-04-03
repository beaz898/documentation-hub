'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import ChatMessage from '@/components/ChatMessage';
import DocumentsSidebar from '@/components/DocumentsSidebar';

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
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<{ access_token: string; user: { email?: string; id: string } } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        router.replace('/login');
        return;
      }
      setSession({
        access_token: s.access_token,
        user: { email: s.user.email, id: s.user.id },
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!session) return;
    setDocsLoading(true);
    try {
      const res = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setDocsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) loadDocuments();
  }, [session, loadDocuments]);

  // Upload document: 1) Upload to Supabase Storage, 2) Tell backend to process it
  async function handleUpload(file: File) {
    if (!session) return;

    // Paso 1: Subir archivo a Supabase Storage (soporta archivos grandes)
    const storagePath = `${session.user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file);

    if (uploadError) {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'error', content: `Error subiendo archivo: ${uploadError.message}` },
      ]);
      throw new Error(uploadError.message);
    }

    // Paso 2: Decirle al backend que procese el archivo (solo envía la ruta, no el archivo)
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        storagePath,
        fileName: file.name,
        fileSize: file.size,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      const errorMsg = data.error || 'Error procesando documento';
      // Limpiar archivo de storage si falla el procesamiento
      await supabase.storage.from('documents').remove([storagePath]);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'error', content: errorMsg },
      ]);
      throw new Error(errorMsg);
    }

    const data = await res.json();
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.replaced
          ? `Documento **${data.document.name}** actualizado correctamente. Se reemplazó la versión anterior y se reindexaron ${data.document.chunks} fragmentos.`
          : `Documento **${data.document.name}** indexado correctamente (${data.document.chunks} fragmentos). Ya puedes hacer preguntas sobre su contenido.`,
      },
    ]);
    await loadDocuments();
  }

  // Delete document
  async function handleDelete(id: string) {
    if (!session) return;

    const res = await fetch(`/api/documents?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error eliminando');
    }

    await loadDocuments();
  }

  // Send question
  async function handleSend() {
    const question = input.trim();
    if (!question || sending || !session) return;

    if (documents.length === 0) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'error',
          content: 'Sube al menos un documento antes de hacer preguntas.',
        },
      ]);
      return;
    }

    setInput('');
    setSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: 'loading',
      content: '',
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev =>
          prev.filter(m => m.id !== loadingMsg.id).concat({
            id: crypto.randomUUID(),
            role: 'error',
            content: data.error || `Error ${res.status}`,
          })
        );
        return;
      }

      setMessages(prev =>
        prev.filter(m => m.id !== loadingMsg.id).concat({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        })
      );
    } catch (err) {
      console.error('Error asking:', err);
      setMessages(prev =>
        prev.filter(m => m.id !== loadingMsg.id).concat({
          id: crypto.randomUUID(),
          role: 'error',
          content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
        })
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // Handle keyboard
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className="flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{ width: sidebarOpen ? '280px' : '0px' }}
      >
        <div className="w-[280px] h-full">
          <DocumentsSidebar
            documents={documents}
            loading={docsLoading}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onLogout={handleLogout}
            userEmail={session.user.email || 'Usuario'}
          />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-overlay)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">Documentation Hub</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {documents.length > 0
                ? `${documents.length} documento${documents.length !== 1 ? 's' : ''} indexado${documents.length !== 1 ? 's' : ''}`
                : 'Sube documentos para empezar'
              }
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Limpiar conversación?')) setMessages([]);
              }}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--danger)';
                e.currentTarget.style.color = 'var(--danger)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              Limpiar chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(51,102,255,0.08)', border: '1px solid rgba(51,102,255,0.15)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="9" y1="10" x2="15" y2="10" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">
                Pregunta sobre tu documentación
              </h2>
              <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
                {documents.length > 0
                  ? `Tienes ${documents.length} documento${documents.length !== 1 ? 's' : ''} indexado${documents.length !== 1 ? 's' : ''}. Escribe cualquier pregunta y buscaré la respuesta en tu documentación.`
                  : 'Sube documentos con el botón de la barra lateral y luego pregunta lo que necesites.'
                }
              </p>

              {documents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {[
                    '¿Cómo se realiza el proceso de...?',
                    '¿Quién es responsable de...?',
                    '¿Qué dice la documentación sobre...?',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--brand)';
                        e.currentTarget.style.color = 'var(--brand)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map(msg => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                sources={msg.sources}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 p-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div
            className="flex items-end gap-2 p-2 rounded-xl transition-colors"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={documents.length > 0 ? 'Escribe tu pregunta...' : 'Sube documentos primero...'}
              disabled={sending}
              rows={1}
              className="flex-1 resize-none outline-none text-sm py-2 px-2"
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                maxHeight: '160px',
                lineHeight: '1.5',
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="p-2.5 rounded-lg transition-all flex-shrink-0"
              style={{
                background: sending || !input.trim() ? 'var(--surface-overlay)' : 'var(--brand)',
                color: sending || !input.trim() ? 'var(--text-muted)' : 'white',
                cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
            Las respuestas se basan exclusivamente en tu documentación · Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
