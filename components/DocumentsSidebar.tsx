'use client';

import { useState, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';

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
  onClose?: () => void;
  userEmail: string;
}

export default function DocumentsSidebar({
  documents,
  loading,
  onUpload,
  onDelete,
  onClose,
  onLogout,
  userEmail,
}: DocumentsSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

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
    if (!window.confirm(`¿Eliminar "${name}"? Se borrarán todos sus datos indexados.`)) return;
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
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-secondary)', borderRight: '0.5px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{ padding: 16, flexShrink: 0, borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" /><path d="M8 11h8" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Documentation Hub</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {documents.length} documento{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Cerrar sidebar"
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
            background: uploading ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: uploading ? 'var(--text-secondary)' : '#fff',
            fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'opacity 0.15s',
          }}
        >
          {uploading ? (
            <>
              <div className="animate-spin" style={{
                width: 14, height: 14, border: '2px solid currentColor',
                borderTopColor: 'transparent', borderRadius: '50%',
              }} />
              Procesando...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
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
          style={{ display: 'none' }}
          aria-label="Seleccionar archivos"
        />

        {uploadProgress && (
          <p style={{ fontSize: 11, marginTop: 8, color: 'var(--brand)' }}>{uploadProgress}</p>
        )}
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
            <div className="animate-spin" style={{
              width: 18, height: 18, border: '2px solid var(--brand)',
              borderTopColor: 'transparent', borderRadius: '50%',
            }} />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ marginBottom: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
              Sube documentos para empezar
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              PDF, Word, TXT, Markdown, CSV
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {documents.map(doc => (
              <div
                key={doc.id}
                role="listitem"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, cursor: 'default', transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: 'var(--brand-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{doc.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {formatSize(doc.size_bytes)} · {doc.chunk_count} frag. · {formatDate(doc.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.name)}
                  disabled={deleting === doc.id}
                  aria-label={`Eliminar ${doc.name}`}
                  style={{
                    opacity: 0, padding: 4, borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: 'var(--danger)',
                    flexShrink: 0, transition: 'opacity 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  onFocus={e => (e.currentTarget.style.opacity = '1')}
                  onBlur={e => (e.currentTarget.style.opacity = '0')}
                >
                  {deleting === doc.id ? (
                    <div className="animate-spin" style={{
                      width: 12, height: 12, border: '2px solid currentColor',
                      borderTopColor: 'transparent', borderRadius: '50%',
                    }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px', borderTop: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
      }}>
        {/* Theme toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 0',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tema</span>
          <button
            onClick={toggleTheme}
            aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 8, border: '0.5px solid var(--border)',
              background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: 11,
              color: 'var(--text-secondary)', transition: 'background 0.15s',
            }}
          >
            {theme === 'light' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                Oscuro
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                Claro
              </>
            )}
          </button>
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-tertiary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
          }}>
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <p style={{
            fontSize: 11, color: 'var(--text-secondary)', flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {userEmail}
          </p>
          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            style={{
              padding: 6, borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--text-muted)', flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
