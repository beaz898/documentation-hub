'use client';

// app/(authenticated)/settings/learning/page.tsx
//
// Página de ajustes (solo-admin de facto) para gestionar las reglas de
// aprendizaje Tipo 1. Aporta sesión + la cáscara visual de settings y monta
// <RulesManager/>, que hace toda la lógica (carga, 403, alta, activar/pausar).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight';
import RulesManager from '@/components/learning/RulesManager';

const supabase = createClient();

export default function LearningSettingsPage() {
  const t = useTranslations('learning');
  const router = useRouter();
  const vvHeight = useVisualViewportHeight();

  const [session, setSession] = useState<{ email: string | undefined; id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ email: s.user.email, id: s.user.id });
    });
  }, [router]);

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: vvHeight != null ? `${vvHeight}px` : '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>{t('title')}</h1>
        <FeedbackButton />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
          <RulesManager />
        </div>
      </div>
    </div>
  );
}
