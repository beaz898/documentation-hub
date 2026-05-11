'use client';

import { useState, useEffect, useCallback } from 'react';

interface ChatData {
  days: number;
  totalQueries: number;
  avgAnswerLength: number;
  topDocuments: Array<{ documentName: string; appearances: number }>;
  neverUsed: string[];
  recentQuestions: Array<{ question: string; documentsCount: number; created_at: string }>;
  byDay: Array<{ day: string; queries: number }>;
}

interface ChatTabProps {
  session: { access_token: string };
}

function DayFilter({ days, setDays }: { days: number; setDays: (d: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {[7, 14, 30].map(d => (
        <button key={d} onClick={() => setDays(d)} style={{
          padding: '5px 12px', borderRadius: 6, border: '0.5px solid var(--border)',
          background: days === d ? 'var(--brand)' : 'var(--bg-secondary)',
          color: days === d ? '#fff' : 'var(--text-secondary)',
          fontSize: 11, fontWeight: 500, cursor: 'pointer',
        }}>
          {d} días
        </button>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function ChatTab({ session }: ChatTabProps) {
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage/analytics?tab=chat&days=${days}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Error cargando uso del chat:', err);
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

  if (!data || data.totalQueries === 0) {
    return (
      <>
        <DayFilter days={days} setDays={setDays} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
          No hay consultas registradas en los últimos {days} días.
        </p>
      </>
    );
  }

  const maxDayQueries = Math.max(...data.byDay.map(d => d.queries), 1);
  const maxAppearances = data.topDocuments[0]?.appearances ?? 1;

  return (
    <>
      <DayFilter days={days} setDays={setDays} />

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Consultas ({days}d)</span>
          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{data.totalQueries}</p>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Resp. media (chars)</span>
          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{data.avgAnswerLength}</p>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Docs sin uso</span>
          <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{data.neverUsed.length}</p>
        </div>
      </div>

      {/* Consultas por día */}
      {data.byDay.length > 1 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Consultas por día</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, padding: '0 4px' }}>
            {data.byDay.map(({ day, queries }) => {
              const barH = (queries / maxDayQueries) * 80;
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{queries}</span>
                  <div style={{ width: '100%', maxWidth: 24, height: Math.max(barH, 2), borderRadius: 2, background: 'var(--brand)', opacity: 0.7 }} />
                  <span style={{ fontSize: 7, color: 'var(--text-muted)' }}>{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documentos más utilizados */}
      {data.topDocuments.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Documentos más utilizados</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.topDocuments.map(doc => {
              const pct = (doc.appearances / maxAppearances) * 100;
              return (
                <div key={doc.documentName} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.documentName}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{doc.appearances}×</span>
                  </div>
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: 'var(--brand)', width: pct + '%', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consultas recientes */}
      {data.recentQuestions.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Consultas recientes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.recentQuestions.map((q, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                <p style={{ fontSize: 12, marginBottom: 3, lineHeight: 1.4 }}>{q.question}</p>
                <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                  {q.documentsCount} doc{q.documentsCount !== 1 ? 's' : ''} · {formatDate(q.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentos sin uso */}
      {data.neverUsed.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Documentos sin uso</h2>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            Nunca han aparecido como fuente en una respuesta. Considera revisarlos o eliminarlos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {data.neverUsed.slice(0, 15).map((name, i) => (
              <div key={i} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--bg-secondary)', border: '0.5px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(239,68,68,0.5)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </div>
            ))}
            {data.neverUsed.length > 15 && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 14 }}>+{data.neverUsed.length - 15} más</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
