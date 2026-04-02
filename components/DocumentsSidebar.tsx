'use client';

import { useState, useRef } from 'react';

interface Document {
  id: string;
  name: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
  status: string;
}

interface DocumentsSidebarProps {
  documents: Document[];
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLogout: () => void;
  userEmail: string;
}

export default function DocumentsSidebar({
  documents,
  loading,
  onUpload,
  onDelete,
  onLogout,
  userEmail,
}: DocumentsSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Subiendo ${file.name}... (${i + 1}/${files.length})`);
      try {
        await onUpload(file);
      } catch {
        // Error handling done in parent
      }
    }
    setUploading(false);
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Se borrarán todos sus datos indexados.`)) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--surface-raised)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--brand), #6366f1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Doc Hub</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {documents.length} documento{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
          style={{
            background: uploading ? 'var(--surface-overlay)' : 'var(--brand)',
            color: uploading ? 'var(--text-secondary)' : 'white',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? (
            <>
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Subir documentos
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,.docx,.csv,.json,.html"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadProgress && (
          <p className="text-xs mt-2" style={{ color: 'var(--brand)' }}>{uploadProgress}</p>
        )}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-3 opacity-50">📄</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Sube documentos para empezar a preguntar
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              PDF, Word, TXT, Markdown, CSV...
            </p>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="group flex items-start gap-2 p-2.5 rounded-lg transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-overlay)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(51,102,255,0.08)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatSize(doc.size_bytes)} · {doc.chunk_count} fragmentos · {formatDate(doc.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.name)}
                disabled={deleting === doc.id}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0"
                style={{ color: 'var(--danger)' }}
                title="Eliminar documento"
              >
                {deleting === doc.id ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer: user info */}
      <div
        className="p-3 flex items-center gap-2 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{ background: 'var(--surface-overlay)', color: 'var(--text-secondary)' }}
        >
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <p className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
          {userEmail}
        </p>
        <button
          onClick={onLogout}
          className="p-1.5 rounded-md transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title="Cerrar sesión"
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
