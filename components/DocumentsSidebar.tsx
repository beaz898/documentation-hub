'use client';

import { useState, useRef, useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface Document {
  id: string;
  name: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
  status: string;
  source?: string;
  folder_path?: string | null;
}

interface DriveFolder {
  id: string;
  name: string;
  fileCount: number;
}

interface DriveStatus {
  connected: boolean;
  email?: string;
  folderName?: string;
  lastSynced?: string;
  folders?: DriveFolder[];
}

interface DocumentsSidebarProps {
  documents: Document[];
  loading: boolean;
  driveStatus: DriveStatus;
  syncing: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConnectDrive: () => void;
  onSyncDrive: () => void;
  onDisconnectDrive: () => void;
  onLogout: () => void;
  onClose?: () => void;
  userEmail: string;
}

// ============================================================
// Folder tree types and builder
// ============================================================
interface FolderNode {
  name: string;          // segment name (e.g. "Q1")
  fullPath: string;      // full path from root (e.g. "Ventas/2025/Q1"), used as React key + expand state
  children: Map<string, FolderNode>;
  docs: Document[];      // docs directly inside this folder (not in sub-folders)
}

function buildFolderTree(docs: Document[]): FolderNode {
  const root: FolderNode = { name: '', fullPath: '', children: new Map(), docs: [] };

  for (const doc of docs) {
    const path = doc.folder_path || '/';
    // "/" or "" => root level
    if (path === '/' || path === '') {
      root.docs.push(doc);
      continue;
    }

    const segments = path.split('/').filter(Boolean);
    let node = root;
    let acc = '';
    for (const segment of segments) {
      acc = acc ? `${acc}/${segment}` : segment;
      let child = node.children.get(segment);
      if (!child) {
        child = { name: segment, fullPath: acc, children: new Map(), docs: [] };
        node.children.set(segment, child);
      }
      node = child;
    }
    node.docs.push(doc);
  }

  return root;
}

// Count all docs inside a node, including all descendants
function countDocsRecursive(node: FolderNode): number {
  let total = node.docs.length;
  for (const child of node.children.values()) {
    total += countDocsRecursive(child);
  }
  return total;
}

export default function DocumentsSidebar({
  documents,
  loading,
  driveStatus,
  syncing,
  onUpload,
  onDelete,
  onConnectDrive,
  onSyncDrive,
  onDisconnectDrive,
  onLogout,
  onClose,
  userEmail,
}: DocumentsSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  // NEW: section-level collapse state (both sections start expanded)
  const [driveSectionOpen, setDriveSectionOpen] = useState(true);
  const [manualSectionOpen, setManualSectionOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const driveDocs = useMemo(() => documents.filter(d => d.source === 'google_drive'), [documents]);
  const manualDocs = useMemo(() => documents.filter(d => d.source !== 'google_drive'), [documents]);

  // Build the folder tree once per docs change
  const driveTree = useMemo(() => buildFolderTree(driveDocs), [driveDocs]);

  function toggleFolder(fullPath: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(fullPath)) next.delete(fullPath);
      else next.add(fullPath);
      return next;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Subiendo ${file.name}... (${i + 1}/${files.length})`);
      try { await onUpload(file); } catch { /* handled in parent */ }
    }
    setUploading(false);
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    setDeleting(id);
    try { await onDelete(id); } finally { setDeleting(null); }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function formatLastSynced(dateStr?: string): string {
    if (!dateStr) return 'Nunca';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return formatDate(dateStr);
  }

  // ============================================================
  // Recursive renderer for the Drive folder tree
  // ============================================================
  function renderFolderNode(node: FolderNode, depth: number): React.ReactNode {
    const isExpanded = expandedFolders.has(node.fullPath);
    const totalCount = countDocsRecursive(node);
    const indentPx = 8 + depth * 14;

    return (
      <div key={node.fullPath || 'root'}>
        <div
          onClick={() => toggleFolder(node.fullPath)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 6px', paddingLeft: indentPx,
            borderRadius: 6, cursor: 'pointer',
            fontSize: 11, color: 'var(--text-primary)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
            strokeWidth="2" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>{totalCount}</span>
        </div>

        {isExpanded && (
          <div>
            {/* Render child folders first */}
            {Array.from(node.children.values())
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(child => renderFolderNode(child, depth + 1))}

            {/* Then render docs directly in this folder */}
            {node.docs
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(doc => (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 6px',
                  paddingLeft: indentPx + 24,
                  fontSize: 10, color: 'var(--text-secondary)',
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{doc.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(doc.size_bytes)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  // Chevron icon for collapsible section headers
  function SectionChevron({ open }: { open: boolean }) {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.5" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none' }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
  }

  const sectionHeaderStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 2,
    padding: '8px 12px', fontSize: 11, fontWeight: 600,
    color: 'var(--text-secondary)', background: 'var(--bg-secondary)',
    borderBottom: '0.5px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', userSelect: 'none',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-secondary)', borderRight: '0.5px solid var(--border)',
    }}>
      {/* 1. Logo */}
      <div style={{
        padding: '14px 16px', flexShrink: 0, borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" /><path d="M8 11h8" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600 }}>Documentation Hub</h2>
          <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Cerrar" style={{
            width: 28, height: 28, borderRadius: 7, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable area for both sections */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* 2. Google Drive section */}
        <div
          style={sectionHeaderStyle}
          onClick={(e) => {
            // Don't toggle section if user clicked the sync button
            if ((e.target as HTMLElement).closest('button')) return;
            setDriveSectionOpen(v => !v);
          }}
          role="button"
          aria-expanded={driveSectionOpen}
          aria-label="Mostrar/ocultar sección Google Drive"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SectionChevron open={driveSectionOpen} />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Google Drive</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{driveDocs.length}</span>
          </div>
          {driveStatus.connected && (
            <button
              onClick={(e) => { e.stopPropagation(); onSyncDrive(); }}
              disabled={syncing}
              aria-label="Sincronizar"
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 5,
                border: '0.5px solid var(--border)', background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)', cursor: syncing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          )}
        </div>

        {driveSectionOpen && (
          <div style={{ padding: '8px 12px' }}>
            {!driveStatus.connected ? (
              /* Not connected: show connect button */
              <button
                onClick={onConnectDrive}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '0.5px dashed var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                </svg>
                Conectar Google Drive
              </button>
            ) : (
              /* Connected: show account, then real folder tree built from indexed docs */
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                  borderRadius: 6, background: 'var(--bg-tertiary)', marginBottom: 8,
                  fontSize: 10, color: 'var(--text-secondary)',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {driveStatus.email}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatLastSynced(driveStatus.lastSynced)}
                  </span>
                </div>

                {driveDocs.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 4px' }}>
                    Sin documentos. Pulsa sincronizar.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Render top-level folders (sorted) */}
                    {Array.from(driveTree.children.values())
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(child => renderFolderNode(child, 0))}

                    {/* Render docs at the very root (folder_path === "/" or empty) */}
                    {driveTree.docs
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(doc => (
                        <div key={doc.id} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 6px', paddingLeft: 8,
                          fontSize: 10, color: 'var(--text-secondary)',
                        }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{doc.name}</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>{formatSize(doc.size_bytes)}</span>
                        </div>
                      ))}
                  </div>
                )}

                <button
                  onClick={onDisconnectDrive}
                  style={{
                    marginTop: 8, fontSize: 10, color: 'var(--text-muted)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px 0',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  Desconectar Drive
                </button>
              </>
            )}
          </div>
        )}

        {/* 3. Manual documents section */}
        <div
          style={sectionHeaderStyle}
          onClick={() => setManualSectionOpen(v => !v)}
          role="button"
          aria-expanded={manualSectionOpen}
          aria-label="Mostrar/ocultar sección Subidos manualmente"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SectionChevron open={manualSectionOpen} />
            <span>Subidos manualmente</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{manualDocs.length}</span>
        </div>

        {manualSectionOpen && (
          <div style={{ padding: '6px 10px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div className="animate-spin" style={{
                  width: 16, height: 16, border: '2px solid var(--brand)',
                  borderTopColor: 'transparent', borderRadius: '50%',
                }} />
              </div>
            ) : manualDocs.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '12px 4px', textAlign: 'center' }}>
                Sin documentos manuales
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {manualDocs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
                      borderRadius: 7, transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                      background: 'var(--brand-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.name}
                      </p>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        {formatSize(doc.size_bytes)} · {doc.chunk_count} frag. · {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      disabled={deleting === doc.id}
                      aria-label={`Eliminar ${doc.name}`}
                      style={{
                        opacity: 0, padding: 3, borderRadius: 5, border: 'none',
                        background: 'transparent', cursor: 'pointer', color: 'var(--danger)',
                        flexShrink: 0, transition: 'opacity 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                      {deleting === doc.id ? (
                        <div className="animate-spin" style={{ width: 10, height: 10, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        )}
      </div>

      {/* 4. Bottom: upload button + user */}
      <div style={{
        padding: '10px 14px', borderTop: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
      }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', padding: '9px', borderRadius: 9, border: 'none',
            background: uploading ? 'var(--bg-tertiary)' : 'var(--brand)',
            color: uploading ? 'var(--text-secondary)' : '#fff',
            fontSize: 12, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          {uploading ? (
            <><div className="animate-spin" style={{ width: 12, height: 12, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> Procesando...</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Subir documentos</>
          )}
        </button>
        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.pdf,.docx,.csv,.json,.html" onChange={handleFileChange} style={{ display: 'none' }} aria-label="Seleccionar archivos" />

        {uploadProgress && <p style={{ fontSize: 10, color: 'var(--brand)' }}>{uploadProgress}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg-tertiary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)',
          }}>{userEmail.charAt(0).toUpperCase()}</div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
          <button onClick={toggleTheme} aria-label="Cambiar tema" style={{
            fontSize: 10, padding: '3px 7px', borderRadius: 5,
            border: '0.5px solid var(--border)', background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
          }}>
            {theme === 'dark' ? (
              <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /></svg> Claro</>
            ) : (
              <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg> Oscuro</>
            )}
          </button>
          <button onClick={onLogout} aria-label="Cerrar sesión" style={{
            padding: 5, borderRadius: 5, border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
