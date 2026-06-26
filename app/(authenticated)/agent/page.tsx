'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase';
import { useConversation } from '@/hooks/agent/useConversation';
import ConversationSidebar from '@/components/agent/ConversationSidebar';
import ConversationDrawer from '@/components/agent/ConversationDrawer';
import ConversationThread from '@/components/agent/ConversationThread';
import ConversationInput from '@/components/agent/ConversationInput';
import CreditsIndicator from '@/components/shared/CreditsIndicator';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight';
import type { ConfirmationMode } from '@/lib/agent/types';

interface Summary { hasAgent: boolean; creditsRemaining: number; creditsExtra: number; plan: string }
interface CreditsData { remaining: number; plan: string }

const ACTIVE_STATUSES = new Set(['running', 'awaiting_user', 'awaiting_confirmation']);

export default function AgentPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [hasAgent, setHasAgent]       = useState(false);
  const [credits, setCredits]         = useState<CreditsData | null>(null);
  // selectedId controla qué conversación muestra la UI. Es independiente del hook
  // para poder volver al estado "nueva conversación" (null) sin limpiar el hook.
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const vvHeight = useVisualViewportHeight();
  const router   = useRouter();
  const supabase = createClient();
  const autoSelectedRef    = useRef(false);
  const prevConvStatusRef  = useRef<string | undefined>(undefined);

  const {
    conversations, conversation, messages,
    loading, sending, creating, error, pollingError,
    loadConversations, selectConversation, createConversation,
    sendMessage, cancelConversation, updateMode, renameConversation, deleteConversation,
    retryPolling, clearError,
  } = useConversation();

  // Carga inicial: verifica acceso al agente y obtiene saldo de créditos.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      try {
        const res = await fetch('/api/usage/summary', { credentials: 'include' });
        if (res.ok) {
          const data: Summary = await res.json();
          setHasAgent(data.hasAgent ?? false);
          setCredits({ remaining: (data.creditsRemaining ?? 0) + (data.creditsExtra ?? 0), plan: data.plan ?? 'free' });
        }
      } catch { /* keep hasAgent false */ }
      finally { setPageLoading(false); }
    });
  }, [router, supabase.auth]);

  // Refresco de créditos tras completar un turno. Usado solo por el efecto de
  // transición running → idle; no reutiliza la sesión ni toca hasAgent.
  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/usage/summary', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { creditsRemaining: number; creditsExtra: number; plan: string };
        setCredits({
          remaining: (data.creditsRemaining ?? 0) + (data.creditsExtra ?? 0),
          plan: data.plan ?? 'free',
        });
      }
    } catch { /* ignore — saldo queda con el valor anterior */ }
  }, []);

  // Detecta la transición running → idle (turno completado) y refresca el saldo.
  // No dispara en pausas (awaiting_user / awaiting_confirmation) porque el turno
  // aún está activo y la reconciliación de créditos no ha ocurrido todavía.
  useEffect(() => {
    const current = conversation?.status;
    if (prevConvStatusRef.current === 'running' && current === 'idle') {
      void loadCredits();
    }
    prevConvStatusRef.current = current;
  }, [conversation?.status, loadCredits]);

  useEffect(() => {
    if (hasAgent) loadConversations();
  }, [hasAgent, loadConversations]);

  // Auto-seleccionar la conversación activa más reciente al cargar por primera vez
  useEffect(() => {
    if (autoSelectedRef.current || conversations.length === 0) return;
    autoSelectedRef.current = true;
    const active = conversations.find(c => ACTIVE_STATUSES.has(c.status));
    if (active) {
      setSelectedId(active.id);
      void selectConversation(active.id);
    }
  }, [conversations, selectConversation]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    void selectConversation(id);
  }, [selectConversation]);

  // "Nueva conversación": volvemos al formulario vacío sin tocar el polling del hook.
  // Si había polling activo de otra conv, se descartará en cuanto handleCreateAndSend
  // llame a selectConversation con el nuevo ID.
  const handleNew = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleRename = useCallback((id: string, title: string) => {
    void renameConversation(id, title);
  }, [renameConversation]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await deleteConversation(id);
    // El hook ya limpia la lista y detiene el polling si era la activa.
    // Aquí solo falta deseleccionar en la UI si era la conversación visible.
    if (ok && selectedId === id) {
      setSelectedId(null);
    }
  }, [deleteConversation, selectedId]);

  async function handleCreateAndSend(mode: ConfirmationMode, content: string) {
    const id = await createConversation(mode);
    if (!id) return;
    setSelectedId(id);
    await selectConversation(id);
    await sendMessage(id, { content });
  }

  // La conversación a renderizar solo se muestra cuando el selectedId coincide
  // con la conversación que el hook tiene cargada en detalle.
  const displayedConversation = selectedId !== null && conversation?.id === selectedId
    ? conversation
    : null;

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!hasAgent) return <Paywall />;

  return (
    <div style={{ display: 'flex', height: vvHeight != null ? `${vvHeight}px` : '100dvh', overflow: 'hidden' }}>

      {/* Sidebar — fijo en escritorio, drawer en móvil */}
      {!isMobile && (
        <div style={{ width: 260, flexShrink: 0, height: '100%' }}>
          <ConversationSidebar
            conversations={conversations}
            loading={loading}
            selectedId={selectedId}
            onSelect={handleSelect}
            onNew={handleNew}
            onRename={handleRename}
            onDelete={handleDelete}
            credits={credits}
            isMobile={isMobile}
          />
        </div>
      )}
      {isMobile && (
        <ConversationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <ConversationSidebar
            conversations={conversations}
            loading={loading}
            selectedId={selectedId}
            onSelect={id => { handleSelect(id); setDrawerOpen(false); }}
            onNew={() => { handleNew(); setDrawerOpen(false); }}
            onRename={handleRename}
            onDelete={handleDelete}
            onCollapse={() => setDrawerOpen(false)}
            credits={credits}
            isMobile={isMobile}
          />
        </ConversationDrawer>
      )}

      {/* Área principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Barra superior móvil — botón ☰ + créditos; oculta en escritorio */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderBottom: '0.5px solid var(--border)',
            background: 'var(--bg)', flexShrink: 0,
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú de conversaciones"
              style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                border: '0.5px solid var(--border)', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div style={{ flex: 1 }} />
            <CreditsIndicator credits={credits} compact />
            <FeedbackButton />
          </div>
        )}

        {/* Hilo de mensajes o estado vacío */}
        {displayedConversation ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ConversationThread
              conversation={displayedConversation}
              messages={messages}
              onCancel={() => void cancelConversation(displayedConversation.id)}
              onUpdateMode={mode => void updateMode(displayedConversation.id, mode)}
            />
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Banner de error de polling */}
        {pollingError && (
          <div style={{
            padding: '8px 16px', borderTop: '0.5px solid var(--border)',
            background: 'rgba(220,38,38,0.06)', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: 'var(--danger)' }}>
              Se perdió la conexión con el agente. Puede que siga trabajando en segundo plano.
            </span>
            <button
              onClick={retryPolling}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '0.5px solid rgba(220,38,38,0.3)', background: 'transparent',
                color: 'var(--danger)', cursor: 'pointer', flexShrink: 0,
              }}
            >Reintentar</button>
          </div>
        )}

        {/* Input — siempre visible */}
        <ConversationInput
          conversation={displayedConversation}
          isMobile={isMobile}
          sending={sending}
          creating={creating}
          error={error}
          onSendMessage={sendMessage}
          onCreateAndSend={handleCreateAndSend}
          onCancel={() => { if (displayedConversation) void cancelConversation(displayedConversation.id); }}
          onClearError={clearError}
        />
      </div>
    </div>
  );
}

// ── Estado vacío (sin conversación seleccionada) ──────────────────────────────

function EmptyState() {
  const t = useTranslations('agent');
  return (
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
  );
}

// ── Paywall ───────────────────────────────────────────────────────────────────

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
