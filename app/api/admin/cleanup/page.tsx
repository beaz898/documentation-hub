'use client';
import { useState } from 'react';

interface OrphanGroup { documentId: string; documentName: string; vectorCount: number; }
interface Report {
  totalVectorsInPinecone: number; validDocumentsInSupabase: number;
  orphanGroups: OrphanGroup[];
  totalOrphanVectors?: number; totalDeleted?: number; message: string;
}
interface BackfillReport {
  message: string;
  documentsScanned: number;
  vectorsToUpdate: number;
  byStatus: Record<string, number>;
  skipped: Array<{ id: string; name: string; reason: string }>;
  vectorsUpdated?: number;
  failed?: Array<{ id: string; name: string; error: string }>;
}

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [backfill, setBackfill] = useState<BackfillReport | null>(null);
  const [backfillDone, setBackfillDone] = useState(false);

  const callBackfill = async (dryRun: boolean) => {
    setLoading(true); setError(null); setForbidden(false);
    try {
      const res = await fetch(`/api/admin/cleanup-orphans?dryRun=${dryRun}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) { setForbidden(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setBackfill(data);
      if (!dryRun) setBackfillDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  };

  const call = async (dryRun: boolean) => {
    setLoading(true); setError(null); setForbidden(false);
    try {
      const res = await fetch(`/api/admin/cleanup-orphans?dryRun=${dryRun}`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) { setForbidden(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setReport(data);
      if (!dryRun) setDeleted(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Limpieza de vectores huérfanos</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Elimina vectores de Pinecone de tu organización que ya no tienen documento en la base de datos.
        Primero analiza para ver qué hay, luego pulsa limpiar. Solo administradores.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => call(true)} disabled={loading}
          style={{ padding: '10px 16px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          {loading ? 'Analizando...' : '1. Analizar (sin borrar)'}
        </button>
        {report && !deleted && (
          <button
            onClick={() => { if (confirm(`¿Borrar ${report.totalOrphanVectors ?? 0} vectores huérfanos? No se puede deshacer.`)) call(false); }}
            disabled={loading || (report.totalOrphanVectors ?? 0) === 0}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', cursor: loading || (report.totalOrphanVectors ?? 0) === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: (report.totalOrphanVectors ?? 0) === 0 ? 0.5 : 1 }}>
            {loading ? 'Borrando...' : '2. Limpiar huérfanos'}
          </button>
        )}
      </div>

      {forbidden && (
        <div style={{ padding: 12, background: '#fef3c7', color: '#92400e', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          Necesitas iniciar sesión como administrador de una organización para usar esta herramienta.
        </div>
      )}

      {error && <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>Error: {error}</div>}

      {report && (
        <div style={{ padding: 16, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{report.message}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Vectores en Pinecone: <b>{report.totalVectorsInPinecone}</b></div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Documentos en base de datos: <b>{report.validDocumentsInSupabase}</b></div>

          {report.orphanGroups.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>✅ No hay huérfanos. Todo limpio.</div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Huérfanos detectados:</div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Documento</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Vectores</th>
                </tr></thead>
                <tbody>
                  {report.orphanGroups.map((g, i) => (
                    <tr key={`${g.documentId}-${i}`} style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td style={{ padding: 6 }}>{g.documentName}<br /><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{g.documentId}</span></td>
                      <td style={{ padding: 6, textAlign: 'right' }}>{g.vectorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {deleted && (
        <div style={{ marginTop: 16, padding: 12, background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 13 }}>
          ✅ Limpieza completada.
        </div>
      )}

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '0.5px solid var(--border)' }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Etiquetar vectores con su estado</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Copia el estado de análisis de cada documento (Supabase) a la metadata de sus vectores
          en Pinecone. Necesario antes de activar el filtro del chat. Es repetible sin daño.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => callBackfill(true)} disabled={loading}
            style={{ padding: '10px 16px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {loading ? 'Analizando...' : '1. Analizar (sin escribir)'}
          </button>
          {backfill && !backfillDone && (
            <button
              onClick={() => { if (confirm(`¿Etiquetar ${backfill.vectorsToUpdate} vectores?`)) callBackfill(false); }}
              disabled={loading || backfill.vectorsToUpdate === 0}
              style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: loading || backfill.vectorsToUpdate === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: backfill.vectorsToUpdate === 0 ? 0.5 : 1 }}>
              {loading ? 'Etiquetando...' : '2. Ejecutar backfill'}
            </button>
          )}
        </div>

        {backfill && (
          <div style={{ padding: 16, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{backfill.message}</div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Documentos: <b>{backfill.documentsScanned}</b></div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>Vectores a etiquetar: <b>{backfill.vectorsToUpdate}</b>
              {typeof backfill.vectorsUpdated === 'number' && <> · etiquetados: <b>{backfill.vectorsUpdated}</b></>}
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Por estado:</div>
            <ul style={{ fontSize: 12, marginBottom: 12, paddingLeft: 18 }}>
              {Object.entries(backfill.byStatus).map(([estado, n]) => (
                <li key={estado}>{estado}: <b>{n}</b> vectores</li>
              ))}
            </ul>

            {backfill.skipped.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>Documentos omitidos:</div>
                <ul style={{ fontSize: 12, marginBottom: 12, paddingLeft: 18, color: '#92400e' }}>
                  {backfill.skipped.map(s => (<li key={s.id}>{s.name} — {s.reason}</li>))}
                </ul>
              </>
            )}

            {backfill.failed && backfill.failed.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>Fallos:</div>
                <ul style={{ fontSize: 12, paddingLeft: 18, color: '#991b1b' }}>
                  {backfill.failed.map(f => (<li key={f.id}>{f.id} — {f.error}</li>))}
                </ul>
              </>
            )}
          </div>
        )}

        {backfillDone && (
          <div style={{ marginTop: 16, padding: 12, background: '#dbeafe', color: '#1e40af', borderRadius: 8, fontSize: 13 }}>
            ✅ Backfill completado.
          </div>
        )}
      </div>
    </div>
  );
}
