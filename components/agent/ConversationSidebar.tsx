'use client';

import { useState, useRef } from 'react';
import type { AgentConversation, ConversationStatus } from '@/lib/agent/types';
import CreditsIndicator from '@/components/shared/CreditsIndicator';

interface CreditsData {
  remaining: number;
  plan: string;
}

interface ConversationSidebarProps {
  conversations:  AgentConversation[];
  loading:        boolean;
  selectedId:     string | null;
  onSelect:       (id: string) => void;
  onNew:          () => void;
  onRename:       (id: string, title: string) => void;
  onDelete:       (id: string) => void;
  onCollapse?:    () => void;
  credits?:       CreditsData | null;
  isMobile?:      boolean;
}

interface StatusConfig {
  label: string;
  color: string;
  pulse: boolean;
}

const STATUS_CONFIG: Record<ConversationStatus, StatusConfig> = {
  idle:                  { label: 'En reposo',             color: 'var(--text-muted)', pulse: false },
  running:               { label: 'Ejecutando',            color: 'var(--brand)',      pulse: true  },
  awaiting_user:         { label: 'Esperando respuesta',   color: '#d97706',           pulse: true  },
  awaiting_confirmation: { label: 'Esperando aprobación',  color: '#d97706',           pulse: true  },
};

function getConvTitle(conv: AgentConversation): string {
  if (conv.title) return conv.title;
  const date = new Date(conv.last_message_at ?? conv.created_at);
  const day  = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'Ahora';
  if (diff < 3_600_000)  return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function ConversationSidebar({
  conversations, loading, selectedId, onSelect, onNew, onRename, onDelete, onCollapse, credits, isMobile,
}: ConversationSidebarProps) {
  const [hoveredId,    setHoveredId]    = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [renamingId,   setRenamingId]   = useState<string | null>(null);
  const [draftTitle,   setDraftTitle]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(id: string) {
    setConfirmingId(null);
    onSelect(id);
  }

  function startRename(conv: AgentConversation) {
    setRenamingId(conv.id);
    setDraftTitle(getConvTitle(conv));
    setConfirmingId(null);
  }

  function commitRename(id: string) {
    onRename(id, draftTitle.trim());
    setRenamingId(null);
  }

  function cancelRename() {
    setRenamingId(null);
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-secondary)', borderRight: '0.5px solid var(--border)',
    }}>

      {/* Header */}
      <div style={{
        padding: '10px 10px 10px 14px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, gap: 6,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.2 }}>Conversaciones</h2>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {conversations.length}{' '}
            {conversations.length === 1 ? 'conversación' : 'conversaciones'}
          </p>
        </div>

        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Contraer panel" aria-label="Contraer panel"
            style={{
              width: 26, height: 26, flexShrink: 0, borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <polyline points="12 9 9 12 12 15" />
            </svg>
          </button>
        )}
      </div>

      {/* Lista de conversaciones */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div className="animate-spin" style={{
              width: 16, height: 16, border: '2px solid var(--brand)',
              borderTopColor: 'transparent', borderRadius: '50%',
            }} />
          </div>
        ) : conversations.length === 0 ? (
          <p style={{
            fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
            padding: '24px 12px', lineHeight: 1.6,
          }}>
            Sin conversaciones todavía.<br />Empieza una nueva para comenzar.
          </p>
        ) : (
          conversations.map(conv => {
            const cfg          = STATUS_CONFIG[conv.status];
            const isSelected   = conv.id === selectedId;
            const isHovered    = hoveredId === conv.id;
            const isConfirming = confirmingId === conv.id;
            const isRenaming   = renamingId === conv.id;
            const title        = getConvTitle(conv);
            const dateStr      = formatDate(conv.last_message_at ?? conv.created_at);
            const turns        = conv.turn_count;

            // ── Fila en modo confirmación de borrado ───────────────────────────
            if (isConfirming) {
              return (
                <div
                  key={conv.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                    background: 'rgba(220,38,38,0.06)',
                    border: '0.5px solid rgba(220,38,38,0.2)',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    ¿Borrar conversación?
                  </span>
                  <button
                    onClick={() => { setConfirmingId(null); onDelete(conv.id); }}
                    style={{
                      padding: '3px 10px', borderRadius: 6, border: 'none', flexShrink: 0,
                      background: 'var(--danger)', color: '#fff',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >Sí</button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    style={{
                      padding: '3px 10px', borderRadius: 6, flexShrink: 0,
                      border: '0.5px solid var(--border)', background: 'transparent',
                      color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >No</button>
                </div>
              );
            }

            // ── Fila normal (con modo renombrado inline) ───────────────────────
            return (
              <div
                key={conv.id}
                style={{ position: 'relative', marginBottom: 1 }}
                onMouseEnter={() => { if (!isRenaming) setHoveredId(conv.id); }}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  role={isRenaming ? undefined : 'button'}
                  tabIndex={isRenaming ? undefined : 0}
                  onClick={() => { if (!isRenaming) handleSelect(conv.id); }}
                  onKeyDown={e => { if (!isRenaming && e.key === 'Enter') handleSelect(conv.id); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: `8px ${(isHovered || isMobile) && !isRenaming ? 58 : 10}px 8px 10px`,
                    borderRadius: 8, cursor: isRenaming ? 'default' : 'pointer',
                    background: isSelected ? 'var(--brand-light)' : isHovered ? 'var(--surface-hover)' : 'transparent',
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    transition: 'background 0.1s', outline: 'none',
                  }}
                >
                  {/* Dot de estado */}
                  <div style={{ paddingTop: 3, flexShrink: 0 }}>
                    <div
                      className={cfg.pulse ? 'animate-pulse' : undefined}
                      style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }}
                    />
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isRenaming ? (
                      <input
                        ref={inputRef}
                        autoFocus
                        value={draftTitle}
                        maxLength={80}
                        onChange={e => setDraftTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); commitRename(conv.id); }
                          if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                        }}
                        onBlur={() => commitRename(conv.id)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'block', width: '100%',
                          fontSize: 11, fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? 'var(--brand-text)' : 'var(--text-primary)',
                          background: 'transparent', border: 'none', outline: 'none',
                          borderBottom: '1px solid var(--brand)',
                          padding: '0 0 1px', lineHeight: 1.4, margin: '0 0 3px',
                        }}
                      />
                    ) : (
                      <p style={{
                        fontSize: 11, margin: '0 0 3px',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--brand-text)' : 'var(--text-primary)',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {title}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 9, color: cfg.color, fontWeight: 500 }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        {turns > 0 ? `${turns} ${turns === 1 ? 'turno' : 'turnos'}` : 'Nueva'}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{dateStr}</span>
                    </div>
                  </div>
                </div>

                {/* Lápiz + papelera — visibles al hover, ocultos durante renombrado */}
                {(isHovered || isMobile) && !isRenaming && (
                  <>
                    {/* Lápiz (renombrar) */}
                    <button
                      onClick={e => { e.stopPropagation(); startRename(conv); }}
                      title="Renombrar conversación"
                      aria-label="Renombrar conversación"
                      style={{
                        position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)',
                        width: 22, height: 22, borderRadius: 5, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>

                    {/* Papelera (borrar) */}
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmingId(conv.id); }}
                      title="Borrar conversación"
                      aria-label="Borrar conversación"
                      style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        width: 22, height: 22, borderRadius: 5, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer: créditos + nueva conversación */}
      <div style={{
        padding: '10px 14px', borderTop: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
      }}>
        <CreditsIndicator credits={credits} />
        <button
          onClick={onNew}
          style={{
            width: '100%', padding: '9px', borderRadius: 9, border: 'none',
            background: 'var(--brand)', color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva conversación
        </button>
      </div>

    </div>
  );
}
