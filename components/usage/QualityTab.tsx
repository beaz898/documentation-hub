'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface QualityData {
  days: number;
  totalAnalyses: number;
  totalContradictions: number;
  totalConfirmed: number;
  totalDuplicates: number;
  totalOverlaps: number;
  totalStyle: number;
  byType: Record<string, number>;
  recommendations: Record<string, number>;
  documentRanking: Array<{
    name: string;
    total: number;
    contradictions: number;
    duplicates: number;
    overlaps: number;
    style: number;
  }>;
  byDay: Array<{ day: string; analyses: number; issues: number }>;
}

interface QualityTabProps {
  session: { access_token: string };
}

function DayFilter({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  const t = useTranslations('usage');
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {[7, 14, 30].map(d => (
        <button key={d} onClick={() => setDays(d)} style={{
          padding: '5px 12px', borderRadius: 6, border: '0.5px solid var(--border)',
          background: days === d ? 'var(--brand)' : 'var(--bg-secondary)',
          color: days === d ? '#fff' : 'var(--text-secondary)',
          fontSize: 11, fontWeight: 500, cursor: 'pointer',
        }}>
          {t('days', { days: d })}
        </button>
      ))}
    </div>
  );
}

export default function QualityTab({ session }: QualityTabProps) {
  const t = useTranslations('usage');
  const ta = useTranslations('analysis');
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const typeLabels: Record<string, string> = {
    quick: t('quick'),
    exhaustive: t('exhaustive'),
    style: t('style'),
  };

  const recLabels: Record<string, { label: string; color: string }> = {
    INDEXAR:    { label: ta('recommendation.INDEXAR'),    color: 'rgb(34,197,94)' },
    REVISAR:    { label: ta('recommendation.REVISAR'),    color: '#f59e0b' },
    NO_INDEXAR: { label: ta('recommendation.NO_INDEXAR'), color: 'rgb(239,68,68)' },
    sin_dato:   { label: t('recNoData'),                  color: 'var(--text-muted)' },
  };

  const statCards = [
    { label: t('analysesCount'),    value: data?.totalAnalyses ?? 0 },
    { label: ta('contradictions'),  value: data?.totalContradictions ?? 0 },
    { label: t('confirmedCount'),   value: data?.totalConfirmed ?? 0 },
    { label: t('duplicatesCount'),  value: data?.totalDuplicates ?? 0 },
    { label: t('overlapsCount'),    value: data?.totalOverlaps ?? 0 },
    { label: t('styleIssuesCount'), value: data?.totalStyle ?? 0 },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage/analytics?tab=quality&days=${days}`, {
        credentials: 'include',
      });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Error cargando calidad documental:', err);
    } finally {
      setLoading(false);
    }
  }, [session, days]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!data || data.totalAnalyses === 0) {
    return (
      <>
        <DayFilter days={days} setDays={setDays} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
          {t('noQualityData', { days })}
        </p>
      </>
    );
  }

  const recTotal = Object.values(data.recommendations).reduce((s, v) => s + v, 0);
  const maxIssues = Math.max(...data.byDay.map(d => d.issues), 1);

  return (
    <>
      <DayFilter days={days} setDays={setDays} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
        {statCards.map(({ label, value }) => (
          <div key={label} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
            <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('byAnalysisType')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(data.byType).filter(([, v]) => v > 0).map(([type, count]) => {
            const pct = data.totalAnalyses > 0 ? (count / data.totalAnalyses) * 100 : 0;
            return (
              <div key={type} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{typeLabels[type] ?? type}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{count} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'var(--brand)', width: pct + '%', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('recommendationRate')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(data.recommendations).filter(([, v]) => v > 0).map(([key, count]) => {
            const pct = recTotal > 0 ? (count / recTotal) * 100 : 0;
            const meta = recLabels[key] ?? { label: key, color: 'var(--brand)' };
            return (
              <div key={key} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{count} ({Math.round(pct)}%)</span>
                </div>
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: meta.color, width: pct + '%', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.documentRanking.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('mostProblematic')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.documentRanking.map((doc, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{doc.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{doc.total} issues</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {doc.contradictions > 0 && <span style={{ fontSize: 9, color: 'rgb(239,68,68)' }}>{ta('contradictions')}: {doc.contradictions}</span>}
                  {doc.duplicates     > 0 && <span style={{ fontSize: 9, color: '#f59e0b' }}>{t('duplicatesCount')}: {doc.duplicates}</span>}
                  {doc.overlaps       > 0 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t('overlapsCount')}: {doc.overlaps}</span>}
                  {doc.style          > 0 && <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{t('style')}: {doc.style}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.byDay.length > 1 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{t('timeEvolution')}</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, padding: '0 4px' }}>
            {data.byDay.map(({ day, issues }) => {
              const barH = (issues / maxIssues) * 80;
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{issues > 0 ? issues : ''}</span>
                  <div style={{ width: '100%', maxWidth: 24, height: Math.max(barH, 2), borderRadius: 2, background: issues > 0 ? 'rgb(239,68,68)' : 'var(--border)', opacity: 0.7 }} />
                  <span style={{ fontSize: 7, color: 'var(--text-muted)' }}>{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
