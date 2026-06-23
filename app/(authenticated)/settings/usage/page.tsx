'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase';
import QualityTab from '@/components/usage/QualityTab';
import ChatTab from '@/components/usage/ChatTab';

interface UserUsage {
  userId: string;
  email: string;
  total: number;
  byEndpoint: Record<string, number>;
}

interface UsageHistory {
  days: number;
  totalCredits: number;
  totalOperations: number;
  byUser: UserUsage[];
  byEndpoint: Record<string, number>;
  byDay: Record<string, number>;
}

interface UsageSummary {
  plan: string;
  creditsRemaining: number;
  creditsExtra: number;
  consumed: number;
  role: string;
}

const ENDPOINT_LABELS: Record<string, string> = {
  '/api/ask': 'Chat',
  '/api/analyze-v2': 'Analisis',
  '/api/analyze-style': 'Estilo',
  '/api/improve': 'Mejora',
};

function formatEndpoint(endpoint: string): string {
  return ENDPOINT_LABELS[endpoint] || endpoint;
}

type TabId = 'consumption' | 'quality' | 'chat';

const PLANS_WITH_ANALYTICS = new Set(['business', 'business_plus', 'enterprise']);

export default function UsagePage() {
  const t = useTranslations('usage');
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [history, setHistory] = useState<UsageHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<TabId>('consumption');
  const router = useRouter();
  const supabase = createClient();

  const allTabs: Array<{ id: TabId; label: string }> = [
    { id: 'consumption', label: t('tabConsumption') },
    { id: 'quality',     label: t('tabQuality') },
    { id: 'chat',        label: t('tabChat') },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ access_token: s.access_token });
    });
  }, [router, supabase.auth]);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        fetch('/api/usage/summary', { credentials: 'include' }),
        fetch('/api/usage/history?days=' + days, { credentials: 'include' }),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
      else if (historyRes.status === 403) setSummary(prev => prev ? { ...prev, role: 'member' } : null);
    } catch (err) {
      console.error('Error cargando datos de consumo:', err);
    } finally {
      setLoading(false);
    }
  }, [session, days]);

  useEffect(() => { if (session) loadData(); }, [session, loadData]);

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  const isAdmin = summary?.role === 'admin';
  const hasAnalyticsPanel = PLANS_WITH_ANALYTICS.has(summary?.plan ?? '');
  const visibleTabs = allTabs.filter(tab => tab.id === 'consumption' || hasAnalyticsPanel);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--border)' }}>
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>{t('headerTitle')}</h1>
      </div>

      {loading ? (
        <div style={{ padding: '0 20px', borderBottom: '0.5px solid var(--border)', minHeight: 80 }} />
      ) : (
        <div style={{ padding: '0 20px', borderBottom: '0.5px solid var(--border)', display: 'flex' }}>
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              borderBottom: activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              marginBottom: -1,
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        ) : !isAdmin ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('adminOnly')}</p>
            {summary && (
              <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', display: 'inline-block' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('yourCredits')}</span>
                <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{summary.creditsRemaining + summary.creditsExtra}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'consumption' && (
              <>
                {summary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('creditsRemaining')}</span>
                      <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{summary.creditsRemaining + summary.creditsExtra}</p>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('consumed')}</span>
                      <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{summary.consumed}</p>
                    </div>
                    {history && (
                      <>
                        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('operationsDays', { days })}</span>
                          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{history.totalOperations}</p>
                        </div>
                        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t('creditsDays', { days })}</span>
                          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{history.totalCredits}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                  {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => setDays(d)} style={{ padding: '5px 12px', borderRadius: 6, border: '0.5px solid var(--border)', background: days === d ? 'var(--brand)' : 'var(--bg-secondary)', color: days === d ? '#fff' : 'var(--text-secondary)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                      {t('days', { days: d })}
                    </button>
                  ))}
                </div>

                {history && (
                  <>
                    <div style={{ marginBottom: 28 }}>
                      <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('byOperationType')}</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(history.byEndpoint).sort(([, a], [, b]) => b - a).map(([endpoint, credits]) => {
                          const pct = history.totalCredits > 0 ? (credits / history.totalCredits) * 100 : 0;
                          return (
                            <div key={endpoint} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{formatEndpoint(endpoint)}</span>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{credits} cr</span>
                              </div>
                              <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 2, background: 'var(--brand)', width: pct + '%', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {history.byUser.length > 0 && (
                      <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('byUser')}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {history.byUser.map(u => {
                            const pct = history.totalCredits > 0 ? (u.total / history.totalCredits) * 100 : 0;
                            return (
                              <div key={u.userId} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                  <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{u.total} cr</span>
                                </div>
                                <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: 2, background: 'var(--brand)', width: pct + '%', transition: 'width 0.3s ease' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                  {Object.entries(u.byEndpoint).map(([ep, cr]) => (
                                    <span key={ep} style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatEndpoint(ep)}: {cr}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {Object.keys(history.byDay).length > 0 && (
                      <div>
                        <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('byDay')}</h2>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, padding: '0 4px' }}>
                          {Object.entries(history.byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, credits]) => {
                            const maxVal = Math.max(...Object.values(history.byDay), 1);
                            const barH = (credits / maxVal) * 80;
                            return (
                              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{credits}</span>
                                <div style={{ width: '100%', maxWidth: 24, height: Math.max(barH, 2), borderRadius: 2, background: 'var(--brand)', opacity: 0.7 }} />
                                <span style={{ fontSize: 7, color: 'var(--text-muted)' }}>{day.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'quality' && <QualityTab session={session} />}
            {activeTab === 'chat' && <ChatTab session={session} />}

            {!hasAnalyticsPanel && (
              <div style={{
                marginTop: 32, padding: '24px 20px', borderRadius: 12,
                border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  {t('intelligencePanel')}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  {t('upsellDesc')}
                </p>
                <a
                  href="/settings/billing"
                  style={{
                    display: 'inline-block', padding: '8px 20px', borderRadius: 8,
                    background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {t('viewPlans')}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
