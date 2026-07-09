'use client';
import { useState } from 'react';

interface OrphanGroup { documentId: string; documentName: string; vectorCount: number; }
interface Report {
  totalVectorsInPinecone: number; validDocumentsInSupabase: number;
  orphanGroups: OrphanGroup[];
  totalOrphanVectors?: number; totalDeleted?: number; message: string;
}

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [deleted, setDeleted] = useState(false);

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
    </div>
  );
}
