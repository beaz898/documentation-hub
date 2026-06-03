'use client';

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
  onCollapse?:    () => void;
  credits?:       CreditsData | null;
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

// Cuando title es null (actualmente siempre), mostramos fecha+hora como identificador único.
// Pendiente: autogenerar title del primer mensaje en el endpoint de mensaje (Paso 6 post).
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
  conversations, loading, selectedId, onSelect, onNew, onCollapse, credits,
}: ConversationSidebarProps) {
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
            const cfg        = STATUS_CONFIG[conv.status];
            const isSelected = conv.id === selectedId;
            const title      = getConvTitle(conv);
            const dateStr    = formatDate(conv.last_message_at ?? conv.created_at);
            const turns      = conv.turn_count;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: isSelected ? 'var(--brand-light)' : 'transparent',
                  marginBottom: 1, display: 'flex', alignItems: 'flex-start', gap: 9,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
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
                  <p style={{
                    fontSize: 11, margin: '0 0 3px',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--brand-text)' : 'var(--text-primary)',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {title}
                  </p>
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
              </button>
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
