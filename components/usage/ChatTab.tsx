'use client';

import { useState, useEffect, useCallback } from 'react';

interface CoverageItem {
  documentId: string;
  documentName: string;
  totalChunks: number;
  chunksUsados: number;
  percentage: number;
}

interface CoverageDetail {
  usedChunks: Array<{ chunkIndex: number; text: string }>;
  unusedChunks: number[];
}

interface ChatData {
  days: number;
  totalQueries: number;
  avgAnswerLength: number;
  topDocuments: Array<{ documentName: string; appearances: number }>;
  neverUsed: string[];
  recentQuestions: Array<{ question: string; documentsCount: number; created_at: string }>;
  byDay: Array<{ day: string; queries: number }>;
  documentCoverage?: CoverageItem[];
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

function coverageColor(pct: number): string {
  if (pct < 30) return '#ef4444';
  if (pct < 60) return '#f59e0b';
  return '#22c55e';
}

export default function ChatTab({ session }: ChatTabProps) {
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [coverageDetails, setCoverageDetails] = useState<Record<string, CoverageDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<Record<string, boolean>>({});

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

  const toggleDoc = useCallback(async (item: CoverageItem) => {
    const docId = item.documentId;
    if (expandedDoc === docId) {
      setExpandedDoc(null);
      return;
    }
    setExpandedDoc(docId);
    if (coverageDetails[docId]) return;
    setLoadingDetail(prev => ({ ...prev, [docId]: true }));
    try {
      const res = await fetch(`/api/documents/coverage/${docId}?days=${days}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const detail = await res.json();
        setCoverageDetails(prev => ({ ...prev, [docId]: detail }));
      }
    } catch (err) {
      console.error('Error cargando detalle de cobertura:', err);
    } finally {
      setLoadingDetail(prev => ({ ...prev, [docId]: false }));
    }
  }, [expandedDoc, coverageDetails, days, session]);

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

      {/* Cobertura de documentos */}
      {data.documentCoverage && data.documentCoverage.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Cobertura de documentos</h2>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            % de fragmentos de cada documento que han sido usados como fuente en respuestas. Haz clic para ver los fragmentos.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.documentCoverage.map(item => {
              const color = coverageColor(item.percentage);
              const isExpanded = expandedDoc === item.documentId;
              const detail = coverageDetails[item.documentId];
              const isLoading = loadingDetail[item.documentId];
              return (
                <div key={item.documentId} style={{ borderRadius: 8, border: `0.5px solid ${item.percentage < 30 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleDoc(item)}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.documentName}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0, marginLeft: 8 }}>{item.percentage}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: color, width: item.percentage + '%', transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {item.chunksUsados}/{item.totalChunks} frags
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    {item.percentage < 30 && (
                      <p style={{ fontSize: 10, color: '#ef4444', marginTop: 5 }}>
                        Baja cobertura — la mayoría del contenido no se usa en respuestas.
                      </p>
                    )}
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--border)', background: 'var(--bg-primary)' }}>
                      {isLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                          <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        </div>
                      )}
                      {!isLoading && detail && (
                        <>
                          {detail.usedChunks.length === 0 && (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin fragmentos usados en este período.</p>
                          )}
                          {detail.usedChunks.length > 0 && (
                            <>
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                Fragmentos utilizados ({detail.usedChunks.length}):
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {detail.usedChunks.map(chunk => (
                                  <div key={chunk.chunkIndex} style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)' }}>
                                    <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Fragmento #{chunk.chunkIndex}</span>
                                    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                      {chunk.text ? chunk.text.slice(0, 250) + (chunk.text.length > 250 ? '…' : '') : '(texto no disponible)'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {detail.unusedChunks.length > 0 && (
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                                  Fragmentos no usados: #{detail.unusedChunks.slice(0, 10).join(', #')}
                                  {detail.unusedChunks.length > 10 ? ` y ${detail.unusedChunks.length - 10} más` : ''}
                                </p>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
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
