'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OrphanGroup {
  documentId: string;
  documentName: string;
  vectorCount: number;
}
interface Report {
  totalVectorsInPinecone: number;
  validDocumentsInSupabase: number;
  orphanGroups: OrphanGroup[];
  totalOrphanVectors?: number;
  totalDeleted?: number;
  message: string;
}

export default function CleanupPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const call = async (dryRun: boolean) => {
    if (!token) { setError('No hay sesión. Inicia sesión en /chat primero.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/cleanup-orphans?dryRun=${dryRun}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setReport(data);
      if (!dryRun) setDeleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Limpieza de vectores huérfanos</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Esta página encuentra y elimina vectores en Pinecone que ya no tienen documento asociado en la base de datos. Empieza analizando sin borrar para ver qué hay.
      </p>

      {!token && <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 13 }}>Cargando sesión... si tarda, abre /chat primero para autenticarte.</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => call(true)}
          disabled={!token || loading}
          style={{ padding: '10px 16px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: !token || loading ? 'not-allowed' : 'pointer', fontSize: 14 }}
        >
          {loading ? 'Analizando...' : '1. Analizar (sin borrar)'}
        </button>
        {report && !deleted && (
          <button
            onClick={() => { if (confirm(`¿Borrar ${report.orphanGroups.reduce((s, g) => s + g.vectorCount, 0)} vectores huérfanos? Esta acción no se puede deshacer.`)) call(false); }}
            disabled={loading}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            {loading ? 'Borrando...' : '2. Limpiar huérfanos'}
          </button>
        )}
      </div>

      {error && <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>Error: {error}</div>}

      {report && (
        <div style={{ padding: 16, background: 'var(--bg-secondary)', border: '0.5px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{report.message}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Vectores en Pinecone: <b>{report.totalVectorsInPinecone}</b></div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Documentos válidos en base de datos: <b>{report.validDocumentsInSupabase}</b></div>

          {report.orphanGroups.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>✅ No hay huérfanos. Todo limpio.</div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Huérfanos detectados:</div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Documento</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Vectores</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orphanGroups.map(g => (
                    <tr key={g.documentId} style={{ borderBottom: '0.5px solid var(--border)' }}>
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
          ✅ Limpieza completada. Ya puedes eliminar las carpetas <code>app/admin/cleanup</code> y <code>app/api/admin</code> de tu repo para cerrar el acceso.
        </div>
      )}
    </div>
  );
}
