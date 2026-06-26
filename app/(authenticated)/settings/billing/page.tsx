'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase';
import { PLAN_DETAILS } from '@/lib/plan-details';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import { useVisualViewportHeight } from '@/hooks/useVisualViewportHeight';

interface UsageSummary {
  plan: string;
  creditsRemaining: number;
  creditsExtra: number;
  creditsTotal: number;
  consumed: number;
  cycleStart: string;
  role: string;
  subscriptionStatus?: string;
  hasActiveSubscription?: boolean;
}

const CREDIT_PACKS = [
  { id: 'pack_500', credits: 500, price: 15, pricePerCredit: '0,030€' },
];

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function BillingPage() {
  const t = useTranslations('billing');
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [buyingCredits, setBuyingCredits] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeEmail, setPurgeEmail] = useState('');
  const [purging, setPurging] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const vvHeight = useVisualViewportHeight();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ access_token: s.access_token });
      setUserEmail(s.user?.email || '');
    });
  }, [router, supabase.auth]);

  useEffect(() => {
    if (searchParams.get('billing') === 'success') {
      setMessage({ type: 'success', text: t('successPlan') });
      window.history.replaceState({}, '', '/settings/billing');
    }
    if (searchParams.get('billing') === 'cancelled') {
      setMessage({ type: 'error', text: t('canceledPaymentLocal') });
      window.history.replaceState({}, '', '/settings/billing');
    }
    if (searchParams.get('credits') === 'success') {
      const amount = searchParams.get('amount') || '';
      setMessage({ type: 'success', text: t('successCredits', { amount }) });
      window.history.replaceState({}, '', '/settings/billing');
    }
    if (searchParams.get('credits') === 'cancelled') {
      setMessage({ type: 'error', text: t('canceledCredits') });
      window.history.replaceState({}, '', '/settings/billing');
    }
  }, [searchParams, t]);

  const loadUsage = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/usage/summary', { credentials: 'include' });
      if (res.ok) { const data = await res.json(); setUsage(data); }
    } catch (err) {
      console.error('Error loading usage:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { if (session) loadUsage(); }, [session, loadUsage]);

  async function handleCheckout(planId: string) {
    if (!session || checkingOut) return;
    setCheckingOut(planId);
    setMessage(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; }
      else { setMessage({ type: 'error', text: data.error || 'Error iniciando el pago.' }); }
    } catch { setMessage({ type: 'error', text: 'Error de conexión.' }); }
    finally { setCheckingOut(null); }
  }

  async function handleBuyCredits(packId: string) {
    if (!session || buyingCredits) return;
    setBuyingCredits(packId);
    setMessage(null);
    try {
      const res = await fetch('/api/billing/buy-credits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ pack: packId }),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; }
      else { setMessage({ type: 'error', text: data.error || 'Error iniciando la compra.' }); }
    } catch { setMessage({ type: 'error', text: 'Error de conexión.' }); }
    finally { setBuyingCredits(null); }
  }

  async function handlePortal() {
    if (!session || openingPortal) return;
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; }
      else { setMessage({ type: 'error', text: data.error || 'Error abriendo el portal.' }); }
    } catch { setMessage({ type: 'error', text: 'Error de conexión.' }); }
    finally { setOpeningPortal(false); }
  }

  async function handlePurge() {
    if (!session || purging) return;
    setPurging(true);
    setMessage(null);
    try {
      const res = await fetch('/api/org/purge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ confirmEmail: purgeEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Todos los datos han sido borrados correctamente.' });
        setShowPurgeConfirm(false); setPurgeEmail(''); loadUsage();
      } else { setMessage({ type: 'error', text: data.error || 'Error al borrar los datos.' }); }
    } catch { setMessage({ type: 'error', text: 'Error de conexión.' }); }
    finally { setPurging(false); }
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  const isAdmin = usage?.role === 'admin';
  const currentPlan = usage?.plan || 'free';
  const isCanceledOrExpired = usage?.subscriptionStatus === 'canceled' || usage?.subscriptionStatus === 'expired';
  const hasActiveSubscription = usage?.hasActiveSubscription ?? false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: vvHeight != null ? `${vvHeight}px` : '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>{t('pageTitle')}</h1>
        <FeedbackButton />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {message && (
          <div style={{
            marginBottom: 20, padding: '10px 14px', borderRadius: 8,
            background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `0.5px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 12, color: message.type === 'success' ? 'rgb(34,197,94)' : 'rgb(239,68,68)',
          }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        ) : (
          <>
            {usage && (
              <div style={{
                padding: '16px 20px', borderRadius: 10, marginBottom: 28,
                background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{t('currentPlan')}</span>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                      {PLAN_DETAILS.find(p => p.id === currentPlan)?.name || currentPlan}
                    </h2>
                  </div>
                  {currentPlan !== 'free' && isAdmin && (
                    <button
                      onClick={handlePortal} disabled={openingPortal}
                      style={{
                        padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--border)',
                        background: 'var(--bg-tertiary)', fontSize: 11, cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {openingPortal ? t('opening') : t('manageSubscription')}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('creditsRemaining')}</span>
                    <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{usage.creditsRemaining + usage.creditsExtra}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('creditsConsumed')}</span>
                    <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{usage.consumed}</p>
                  </div>
                  {usage.creditsExtra > 0 && (
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('creditsExtra')}</span>
                      <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{usage.creditsExtra}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{t('plansSection')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 12 }}>
              {PLAN_DETAILS.map(plan => {
                const isCurrent = plan.id === currentPlan;
                const priceLabel = plan.price === null ? t('free') : `${plan.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`;
                const busy = checkingOut === plan.id || openingPortal;

                return (
                  <div
                    key={plan.id}
                    style={{
                      padding: '18px 16px', borderRadius: 10, background: 'var(--bg-secondary)',
                      border: isCurrent ? '2px solid var(--brand)' : plan.popular ? '1.5px solid rgba(99,102,241,0.5)' : '0.5px solid var(--border)',
                      position: 'relative', display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {plan.popular && (
                      <span style={{
                        position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                        padding: '2px 10px', borderRadius: 10, whiteSpace: 'nowrap',
                        background: 'var(--brand)', color: '#fff',
                        fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        {t('mostPopular')}
                      </span>
                    )}

                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{plan.name}</h3>

                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 22, fontWeight: 700 }}>{priceLabel}</span>
                      {plan.price !== null && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('perMonth')}</span>}
                    </div>

                    {plan.base && (
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>
                        {plan.base}
                      </p>
                    )}

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11 }}>
                          <Check />
                          <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div style={{
                        padding: '7px', borderRadius: 8, textAlign: 'center',
                        background: 'rgba(99,102,241,0.08)', color: 'var(--brand)', fontSize: 11, fontWeight: 600,
                      }}>
                        {t('currentPlanBadge')}
                      </div>
                    ) : plan.id !== 'free' && isAdmin ? (
                      <button
                        onClick={hasActiveSubscription ? handlePortal : () => handleCheckout(plan.id)}
                        disabled={busy}
                        style={{
                          padding: '7px', borderRadius: 8, border: 'none',
                          background: busy ? 'var(--bg-tertiary)' : 'var(--brand)',
                          color: busy ? 'var(--text-muted)' : '#fff',
                          fontSize: 11, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {busy ? t('redirecting') : hasActiveSubscription ? t('changePlan') : t('hire')}
                      </button>
                    ) : plan.id !== 'free' ? (
                      <div style={{
                        padding: '7px', borderRadius: 8, textAlign: 'center',
                        background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: 10,
                      }}>
                        {t('adminOnlyPlan')}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 32 }}>
              {t('contactNote')}{' '}
              <a href="mailto:hola@doclity.com" style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                {t('contactUs')}
              </a>
            </p>

            {isAdmin && currentPlan !== 'free' && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t('rechargeCredits')}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {t('rechargeDesc')}
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {CREDIT_PACKS.map(pack => (
                    <div
                      key={pack.id}
                      style={{
                        padding: '16px 20px', borderRadius: 10,
                        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 16, minWidth: 250,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{pack.credits} créditos</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{pack.pricePerCredit}/{t('perCredit')}</p>
                      </div>
                      <button
                        onClick={() => handleBuyCredits(pack.id)}
                        disabled={buyingCredits === pack.id}
                        style={{
                          padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--border)',
                          background: 'var(--bg-tertiary)',
                          color: buyingCredits === pack.id ? 'var(--text-muted)' : 'var(--text-primary)',
                          fontSize: 12, fontWeight: 600,
                          cursor: buyingCredits === pack.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {buyingCredits === pack.id ? t('redirecting') : `${pack.price}€`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && isCanceledOrExpired && (
              <div style={{
                marginBottom: 32, padding: '20px', borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)',
              }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'rgb(239,68,68)', marginBottom: 6 }}>{t('dangerZone')}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  {t('dangerZoneDesc')}
                </p>
                {!showPurgeConfirm ? (
                  <button
                    onClick={() => setShowPurgeConfirm(true)}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: '1px solid rgba(239,68,68,0.4)', background: 'transparent',
                      color: 'rgb(239,68,68)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {t('deleteAllData')}
                  </button>
                ) : (
                  <div style={{ padding: '16px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      {t('purgeConfirmPrompt', { email: userEmail })}
                    </p>
                    <input
                      type="email" value={purgeEmail}
                      onChange={e => setPurgeEmail(e.target.value)} placeholder={userEmail}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 6,
                        border: '0.5px solid var(--border)', background: 'var(--bg)',
                        fontSize: 12, color: 'var(--text-primary)', marginBottom: 12, boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handlePurge} disabled={purging || purgeEmail !== userEmail}
                        style={{
                          padding: '8px 16px', borderRadius: 8, border: 'none',
                          background: purgeEmail === userEmail ? 'rgb(239,68,68)' : 'var(--bg-tertiary)',
                          color: purgeEmail === userEmail ? '#fff' : 'var(--text-muted)',
                          fontSize: 11, fontWeight: 600,
                          cursor: purging || purgeEmail !== userEmail ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {purging ? t('deleting') : t('confirmDelete')}
                      </button>
                      <button
                        onClick={() => { setShowPurgeConfirm(false); setPurgeEmail(''); }}
                        style={{
                          padding: '8px 16px', borderRadius: 8,
                          border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                        }}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              {t('vatNote')}
            </p>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
