'use client';

import type { AgentTask, AgentTaskStatus } from '@/lib/agent/types';

interface AgentSidebarProps {
  tasks: AgentTask[];
  loading: boolean;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onNewTask: () => void;
  onClose?: () => void;
  onCollapseSidebar?: () => void;
}

interface StatusConfig {
  label: string;
  color: string;
  pulse: boolean;
}

const STATUS_CONFIG: Record<AgentTaskStatus, StatusConfig> = {
  pending:               { label: 'Pendiente',              color: 'var(--text-muted)', pulse: false },
  running:               { label: 'Ejecutando',             color: 'var(--brand)',      pulse: true  },
  awaiting_user:         { label: 'Esperando respuesta',    color: '#d97706',           pulse: true  },
  awaiting_confirmation: { label: 'Esperando confirmación', color: '#d97706',           pulse: true  },
  completed:             { label: 'Completada',             color: '#059669',           pulse: false },
  failed:                { label: 'Error',                  color: 'var(--danger)',     pulse: false },
  cancelled:             { label: 'Cancelada',              color: 'var(--text-muted)', pulse: false },
};

function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)     return 'Ahora';
  if (diff < 3_600_000)  return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function AgentSidebar({
  tasks, loading, selectedTaskId,
  onSelectTask, onNewTask, onClose, onCollapseSidebar,
}: AgentSidebarProps) {
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
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.2 }}>Tareas</h2>
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
          </p>
        </div>

        {onCollapseSidebar && (
          <button
            onClick={onCollapseSidebar}
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

        {onClose && (
          <button
            onClick={onClose} aria-label="Cerrar panel"
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
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div className="animate-spin" style={{
              width: 16, height: 16, border: '2px solid var(--brand)',
              borderTopColor: 'transparent', borderRadius: '50%',
            }} />
          </div>
        ) : tasks.length === 0 ? (
          <p style={{
            fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
            padding: '24px 12px', lineHeight: 1.6,
          }}>
            Sin tareas todavía.<br />Crea una nueva para empezar.
          </p>
        ) : (
          tasks.map(task => {
            const cfg = STATUS_CONFIG[task.status];
            const isSelected = task.id === selectedTaskId;

            return (
              <button
                key={task.id}
                onClick={() => onSelectTask(task.id)}
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
                {/* Status dot */}
                <div style={{ paddingTop: 3, flexShrink: 0 }}>
                  <div
                    className={cfg.pulse ? 'animate-pulse' : undefined}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 11, margin: '0 0 3px',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--brand-text)' : 'var(--text-primary)',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {task.goal}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 9, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatDate(task.created_at)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer: Nueva tarea */}
      <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onNewTask}
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
          Nueva tarea
        </button>
      </div>

    </div>
  );
}
