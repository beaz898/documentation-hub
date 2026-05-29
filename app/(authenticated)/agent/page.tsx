'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase';
import { useAgentTasks } from '@/hooks/agent/useAgentTasks';
import AgentSidebar from '@/components/agent/AgentSidebar';
import AgentChat from '@/components/agent/AgentChat';
import AgentInput from '@/components/agent/AgentInput';
import type { ConfirmationMode } from '@/lib/agent/types';

interface Summary { hasAgent: boolean }

const TERMINAL = new Set(['completed', 'failed', 'cancelled']);

export default function AgentPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [hasAgent, setHasAgent]       = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const router   = useRouter();
  const supabase = createClient();
  const autoSelectedRef = useRef(false);

  const {
    tasks, loading: tasksLoading, creating, error,
    loadTasks, createTask, cancelTask, confirm,
  } = useAgentTasks();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      try {
        const res = await fetch('/api/usage/summary', { credentials: 'include' });
        if (res.ok) {
          const data: Summary = await res.json();
          setHasAgent(data.hasAgent ?? false);
        }
      } catch { /* keep hasAgent false */ }
      finally { setPageLoading(false); }
    });
  }, [router, supabase.auth]);

  useEffect(() => {
    if (hasAgent) loadTasks();
  }, [hasAgent, loadTasks]);

  useEffect(() => {
    if (autoSelectedRef.current || tasks.length === 0) return;
    autoSelectedRef.current = true;
    const active = tasks.find(t => !TERMINAL.has(t.status));
    if (active) setSelectedId(active.id);
  }, [tasks]);

  async function handleCreateTask(goal: string, mode: ConfirmationMode): Promise<string | null> {
    const id = await createTask(goal, mode);
    if (id) setSelectedId(id);
    return id;
  }

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!hasAgent) return <Paywall />;

  const selectedTask = tasks.find(t => t.id === selectedId) ?? null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <div style={{ width: 260, flexShrink: 0, height: '100%' }}>
        <AgentSidebar
          tasks={tasks}
          loading={tasksLoading}
          selectedTaskId={selectedId}
          onSelectTask={setSelectedId}
          onNewTask={() => setSelectedId(null)}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {selectedTask ? (
          <AgentChat task={selectedTask} onConfirm={confirm} onCancel={cancelTask} />
        ) : (
          <AgentEmptyView
            creating={creating}
            onCreateTask={handleCreateTask}
            onConfirm={confirm}
          />
        )}

        {error && (
          <div style={{
            position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            padding: '8px 16px', borderRadius: 8, zIndex: 100,
            background: 'rgba(220,38,38,0.92)', color: '#fff', fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state (no task selected) ────────────────────────────────────────

type ConfirmFn = ReturnType<typeof useAgentTasks>['confirm'];

function AgentEmptyView({
  creating,
  onCreateTask,
  onConfirm,
}: {
  creating: boolean;
  onCreateTask: (goal: string, mode: ConfirmationMode) => Promise<string | null>;
  onConfirm: ConfirmFn;
}) {
  const t = useTranslations('agent');
  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 8v4l3 3" />
            <circle cx="19" cy="5" r="3" fill="var(--brand)" stroke="none" />
          </svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('title')}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          {t('emptyHint')}
        </p>
      </div>
      <AgentInput
        creating={creating}
        onCreateTask={onCreateTask}
        activeTaskId={null}
        pendingRequest={null}
        onConfirm={onConfirm}
      />
    </>
  );
}

// ─── Paywall ─────────────────────────────────────────────────────────────────

function Paywall() {
  const t = useTranslations('agent');
  const features = [
    t('featureEmail'),
    t('featureRead'),
    t('featureCite'),
    t('featureAsk'),
  ];

  return (
    <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 24px' }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        borderRadius: 16, padding: '32px 28px',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, marginBottom: 20,
          background: 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('title')}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('paywallBody')}
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </li>
          ))}
        </ul>
        <a
          href="/settings/billing"
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            padding: '11px 20px', borderRadius: 10,
            background: 'var(--brand)', color: '#fff',
            fontSize: 13, fontWeight: 600,
          }}
        >
          {t('paywallCta')}
        </a>
      </div>
    </div>
  );
}
