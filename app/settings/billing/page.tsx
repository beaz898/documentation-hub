'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface UsageSummary {
  plan: string;
  creditsRemaining: number;
  creditsExtra: number;
  creditsTotal: number;
  consumed: number;
  cycleStart: string;
  role: string;
  subscriptionStatus?: string;
}

const PLANS = [
  { id: 'free', name: 'Free', price: 0, credits: 100, users: 1, description: 'Para probar' },
  { id: 'starter', name: 'Starter', price: 39, credits: 800, users: 5, description: 'Profesional independiente' },
  { id: 'pro', name: 'Pro', price: 99, credits: 3000, users: 15, description: 'PYME pequeña', popular: true },
  { id: 'business', name: 'Business', price: 249, credits: 8000, users: 40, description: 'PYME mediana' },
  { id: 'business_plus', name: 'Business+', price: 499, credits: 18000, users: 80, description: 'PYME grande' },
];

const CREDIT_PACKS = [
  { id: 'pack_500', credits: 500, price: 12, pricePerCredit: '0,024€' },
];

export default function BillingPage() {
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [buyingCredits, setBuyingCredits] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ access_token: s.access_token });
    });
  }, [router, supabase.auth]);

  // Handle callback params
  useEffect(() => {
    if (searchParams.get('billing') === 'success') {
      setMessage({ type: 'success', text: 'Plan contratado correctamente. Los créditos ya están disponibles.' });
      window.history.replaceState({}, '', '/settings/billing');
    }
    if (searchParams.get('billing') === 'cancelled') {
      setMessage({ type: 'error', text: 'Contratación cancelada.' });
      window.history.replaceState({}, '', '/settings/billing');
    }
    if (searchParams.get('credits') === 'success') {
      const amount = searchParams.get('amount') || '';
      setMessage({ type: 'success', text: `Recarga de ${amount} créditos completada.` });
      window.history.replaceState({}, '', '/settings/billing');
    }
    if (searchParams.get('credits') === 'cancelled') {
      setMessage({ type: 'error', text: 'Compra de créditos cancelada.' });
      window.history.replaceState({}, '', '/settings/billing');
    }
  }, [searchParams]);

  const loadUsage = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/usage/summary', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Error iniciando el pago.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setCheckingOut(null);
    }
  }

  async function handleBuyCredits(packId: string) {
    if (!session || buyingCredits) return;
    setBuyingCredits(packId);
    setMessage(null);

    try {
      const res = await fetch('/api/billing/buy-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ pack: packId }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Error iniciando la compra.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setBuyingCredits(null);
    }
  }

  async function handlePortal() {
    if (!session || openingPortal) return;
    setOpeningPortal(true);

    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Error abriendo el portal.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setOpeningPortal(false);
    }
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.push('/chat')}
          style={{
            padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)',
            background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12,
            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver al chat
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>Plan y facturación</h1>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        {/* Messages */}
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
            {/* Current plan summary */}
            {usage && (
              <div style={{
                padding: '16px 20px', borderRadius: 10, marginBottom: 24,
                background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Plan actual</span>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                      {PLANS.find(p => p.id === currentPlan)?.name || currentPlan}
                    </h2>
                  </div>
                  {currentPlan !== 'free' && isAdmin && (
                    <button
                      onClick={handlePortal}
                      disabled={openingPortal}
                      style={{
                        padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--border)',
                        background: 'var(--bg-tertiary)', fontSize: 11, cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {openingPortal ? 'Abriendo...' : 'Gestionar suscripción'}
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Créditos restantes</span>
                    <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{usage.creditsRemaining + usage.creditsExtra}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Consumidos este ciclo</span>
                    <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{usage.consumed}</p>
                  </div>
                  {usage.creditsExtra > 0 && (
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Créditos extra</span>
                      <p style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{usage.creditsExtra}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plans grid */}
            <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              {currentPlan === 'free' ? 'Elige un plan' : 'Cambiar de plan'}
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 32,
            }}>
              {PLANS.filter(p => p.id !== 'free').map(plan => {
                const isCurrent = plan.id === currentPlan;
                const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan);

                return (
                  <div
                    key={plan.id}
                    style={{
                      padding: '18px 16px', borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      border: isCurrent
                        ? '2px solid var(--brand)'
                        : plan.popular
                          ? '1px solid var(--brand)'
                          : '0.5px solid var(--border)',
                      position: 'relative',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {plan.popular && !isCurrent && (
                      <span style={{
                        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                        padding: '2px 10px', borderRadius: 10,
                        background: 'var(--brand)', color: '#fff',
                        fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
                      }}>
                        Popular
                      </span>
                    )}

                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{plan.name}</h3>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>{plan.description}</p>

                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 24, fontWeight: 700 }}>{plan.price}€</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/mes</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14, flex: 1 }}>
                      <p style={{ marginBottom: 3 }}>{plan.credits.toLocaleString('es-ES')} créditos/mes</p>
                      <p>Hasta {plan.users} usuarios</p>
                    </div>

                    {isCurrent ? (
                      <div style={{
                        padding: '8px', borderRadius: 8, textAlign: 'center',
                        background: 'var(--brand-light)', color: 'var(--brand)',
                        fontSize: 11, fontWeight: 600,
                      }}>
                        Plan actual
                      </div>
                    ) : isAdmin ? (
                      <button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={checkingOut === plan.id}
                        style={{
                          padding: '8px', borderRadius: 8, border: 'none',
                          background: checkingOut === plan.id ? 'var(--bg-tertiary)' : 'var(--brand)',
                          color: checkingOut === plan.id ? 'var(--text-muted)' : '#fff',
                          fontSize: 11, fontWeight: 600,
                          cursor: checkingOut === plan.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {checkingOut === plan.id
                          ? 'Redirigiendo...'
                          : isDowngrade
                            ? 'Cambiar'
                            : 'Contratar'}
                      </button>
                    ) : (
                      <div style={{
                        padding: '8px', borderRadius: 8, textAlign: 'center',
                        background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                        fontSize: 11,
                      }}>
                        Solo el admin puede cambiar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Credit packs section */}
            {isAdmin && currentPlan !== 'free' && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Recargar créditos</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Los créditos extra no caducan y se usan cuando se agotan los del plan.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {CREDIT_PACKS.map(pack => (
                    <div
                      key={pack.id}
                      style={{
                        padding: '16px 20px', borderRadius: 10,
                        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 16,
                        minWidth: 250,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{pack.credits} créditos</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{pack.pricePerCredit}/crédito</p>
                      </div>
                      <button
                        onClick={() => handleBuyCredits(pack.id)}
                        disabled={buyingCredits === pack.id}
                        style={{
                          padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--border)',
                          background: buyingCredits === pack.id ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                          color: buyingCredits === pack.id ? 'var(--text-muted)' : 'var(--text-primary)',
                          fontSize: 12, fontWeight: 600,
                          cursor: buyingCredits === pack.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {buyingCredits === pack.id ? 'Redirigiendo...' : `${pack.price}€`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IVA note */}
            <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              Precios sin IVA. Se aplicará el 21% de IVA en la factura.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
