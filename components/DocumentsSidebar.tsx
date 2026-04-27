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

interface Credits {
  remaining: number;
  extra: number;
  plan: string;
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
  analysisProgress?: number;
  analysisPhase?: string;
  credits?: Credits | null;
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

// Plan display names
const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  business_plus: 'Business+',
  enterprise: 'Enterprise',
};

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
  analysisProgress = 0,
  analysisPhase = '',
  credits,
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

  // Names that appear BOTH as manual and as drive → show a small badge on those
  const crossSourceNames = useMemo(() => {
    const driveNames = new Set(driveDocs.map(d => d.name));
    const manualNames = new Set(manualDocs.map(d => d.name));
    const both = new Set<string>();
    driveNames.forEach(n => { if (manualNames.has(n)) both.add(n); });
    return both;
  }, [driveDocs, manualDocs]);

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

  // Small "drive" / "manual" badge for docs that exist in both sources
  function SourceBadge({ source }: { source: 'drive' | 'manual' }) {
    const isDrive = source === 'drive';
    return (
      <span style={{
        fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
        padding: '1px 5px', borderRadius: 3,
        background: isDrive ? 'rgba(37,99,235,0.12)' : 'rgba(124,58,237,0.12)',
        color: isDrive ? 'rgb(37,99,235)' : 'rgb(124,58,237)',
      }}>
        {source}
      </span>
    );
  }

  // Section header chevron
  function SectionChevron({ open }: { open: boolean }) {
    return (
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
  }

  // Document row renderer (reused for both drive and manual docs)
  function DocRow({ doc, showSourceBadge, badgeType }: { doc: Document; showSourceBadge: boolean; badgeType: 'drive' | 'manual' }) {
    return (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <p style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, flex: 1 }}>
              {doc.name}
            </p>
            {showSourceBadge && <SourceBadge source={badgeType} />}
          </div>
          <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {formatSize(doc.size_bytes)} · {doc.chunk_count} frag. · {formatDate(doc.created_at)}
          </p>
        </div>
        {doc.source !== 'google_drive' && (
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
        )}
      </div>
    );
  }

  // Recursive folder renderer for Drive tree
  function FolderView({ node, depth }: { node: FolderNode; depth: number }) {
    const isExpanded = expandedFolders.has(node.fullPath);
    const totalDocs = countDocsRecursive(node);
    const hasChildren = node.children.size > 0 || node.docs.length > 0;

    if (!hasChildren) return null;

    return (
      <div style={{ marginLeft: depth > 0 ? 10 : 0 }}>
        <div
          onClick={() => toggleFolder(node.fullPath)}
          role="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px',
            borderRadius: 5, cursor: 'pointer', fontSize: 11, color: 'var(--text-primary)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <SectionChevron open={isExpanded} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>{totalDocs}</span>
        </div>
        {isExpanded && (
          <div>
            {[...node.children.values()].map(child => (
              <FolderView key={child.fullPath} node={child} depth={depth + 1} />
            ))}
            {node.docs.map(doc => (
              <div key={doc.id} style={{ marginLeft: 10 }}>
                <DocRow doc={doc} showSourceBadge={crossSourceNames.has(doc.name)} badgeType="drive" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '7px 14px', fontSize: 10, fontWeight: 600,
    color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5,
    cursor: 'pointer', userSelect: 'none',
  };

  // Credit bar color logic
  const creditBarColor = credits
    ? credits.remaining <= 10
      ? 'var(--danger)'
      : credits.remaining <= 30
        ? '#f59e0b'
        : 'var(--brand)'
    : 'var(--brand)';

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-secondary)', borderRight: '0.5px solid var(--border)',
    }}>
      {/* 1. Header */}
      <div style={{
        padding: '14px 14px 10px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.2 }}>Documentos</h2>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{documents.length} archivos indexados</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Cerrar sidebar" style={{
            width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      {/* 2. Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Drive section */}
        <div
          style={sectionHeaderStyle}
          onClick={() => setDriveSectionOpen(v => !v)}
          role="button"
          aria-expanded={driveSectionOpen}
          aria-label="Mostrar/ocultar sección Google Drive"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SectionChevron open={driveSectionOpen} />
            <span>Google Drive</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {driveStatus.connected ? driveDocs.length : '—'}
          </span>
        </div>

        {driveSectionOpen && (
          <div style={{ padding: '6px 10px' }}>
            {!driveStatus.connected ? (
              <button onClick={onConnectDrive} style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '0.5px solid var(--border)', background: 'var(--bg-tertiary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: 'var(--text-primary)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 19.5h20L12 2z" /><path d="M12 2l8.5 17.5" /><path d="M2 19.5h17" />
                </svg>
                Conectar Google Drive
              </button>
            ) : (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>{driveStatus.email}</span>
                  <span style={{ margin: '0 4px' }}>·</span>
                  <span>Sync: {formatLastSynced(driveStatus.lastSynced)}</span>
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  <button onClick={onSyncDrive} disabled={syncing} style={{
                    flex: 1, padding: '5px 8px', borderRadius: 6, border: '0.5px solid var(--border)',
                    background: 'var(--bg-tertiary)', fontSize: 10, cursor: syncing ? 'not-allowed' : 'pointer',
                    color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    {syncing ? (
                      <><div className="animate-spin" style={{ width: 8, height: 8, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> Sincronizando...</>
                    ) : (
                      <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg> Sincronizar</>
                    )}
                  </button>
                </div>

                {driveDocs.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                    {syncing ? 'Trayendo archivos...' : 'Sin documentos en la carpeta'}
                  </p>
                ) : (
                  // If there are Drive docs with folders, show tree. Otherwise flat list.
                  driveTree.children.size > 0 ? (
                    <div>
                      {/* Root-level docs first */}
                      {driveTree.docs.map(doc => (
                        <DocRow key={doc.id} doc={doc} showSourceBadge={crossSourceNames.has(doc.name)} badgeType="drive" />
                      ))}
                      {/* Then folder tree */}
                      {[...driveTree.children.values()].map(child => (
                        <FolderView key={child.fullPath} node={child} depth={0} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {driveDocs.map(doc => (
                        <DocRow key={doc.id} doc={doc} showSourceBadge={crossSourceNames.has(doc.name)} badgeType="drive" />
                      ))}
                    </div>
                  )
                )}

                <button
                  onClick={onDisconnectDrive}
                  style={{
                    width: '100%', marginTop: 6, padding: '4px 0', border: 'none',
                    background: 'transparent', fontSize: 10, cursor: 'pointer',
                    color: 'var(--text-muted)', textAlign: 'center',
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
                  <DocRow key={doc.id} doc={doc} showSourceBadge={crossSourceNames.has(doc.name)} badgeType="manual" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom: credits + upload button + user */}
      <div style={{
        padding: '10px 14px', borderTop: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
      }}>
        {/* Credits indicator */}
        {credits && (
          <div style={{
            padding: '6px 10px', borderRadius: 8,
            background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 3,
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {PLAN_LABELS[credits.plan] || credits.plan}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: creditBarColor }}>
                  {credits.remaining} cr
                </span>
              </div>
              <div style={{
                width: '100%', height: 3, borderRadius: 2,
                background: 'var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: creditBarColor,
                  width: `${Math.min(100, (credits.remaining / Math.max(credits.remaining, 100)) * 100)}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          </div>
        )}

        {analysisProgress > 0 ? (
          <div style={{ width: '100%' }}>
            <p style={{
              fontSize: 10, fontWeight: 500, color: 'var(--brand)',
              marginBottom: 4, textAlign: 'center',
            }}>
              {analysisPhase}
            </p>
            <div style={{
              width: '100%', height: 36, borderRadius: 9,
              background: 'var(--bg-tertiary)', overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                height: '100%', borderRadius: 9,
                background: 'var(--brand)',
                width: `${analysisProgress}%`,
                transition: 'width 0.4s ease',
              }} />
              <span style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                color: analysisProgress > 50 ? '#fff' : 'var(--brand)',
              }}>
                {analysisProgress}%
              </span>
            </div>
          </div>
        ) : (
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
        )}
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
