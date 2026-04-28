'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function InvitePage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [orgName, setOrgName] = useState('');
  const [session, setSession] = useState<{ access_token: string; user: { email?: string } } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const token = searchParams.get('token');

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        // Guardar la URL actual para redirigir después del login
        const returnUrl = `/invite?token=${token}`;
        router.replace(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
        return;
      }
      setSession({ access_token: s.access_token, user: { email: s.user.email } });
      setStatus('ready');
    });
  }, [router, supabase.auth, token]);

  async function handleAccept() {
    if (!session || !token) return;
    setStatus('accepting');

    try {
      const res = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrgName(data.orgName || 'el workspace');
        setStatus('success');
        // Redirigir al chat después de 2 segundos
        setTimeout(() => router.replace('/chat'), 2000);
      } else {
        setErrorMessage(data.error || 'Error aceptando la invitación.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Error de conexión.');
      setStatus('error');
    }
  }

  if (!token) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Enlace de invitación inválido.</p>
          <button
            onClick={() => router.replace('/chat')}
            style={{
              marginTop: 16, padding: '8px 20px', borderRadius: 8, border: 'none',
              background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Ir al chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        width: '100%', maxWidth: 400, padding: 32, borderRadius: 12,
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        )}

        {status === 'ready' && (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
              background: 'var(--brand-light)', border: '0.5px solid var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Te han invitado</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Has recibido una invitación para unirte a un workspace en Documentation Hub.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 24 }}>
              Sesión: {session?.user.email}
            </p>
            <button
              onClick={handleAccept}
              style={{
                width: '100%', padding: '11px', borderRadius: 9, border: 'none',
                background: 'var(--brand)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Aceptar invitación
            </button>
          </>
        )}

        {status === 'accepting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Uniéndose al workspace...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(34,197,94)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Te has unido a {orgName}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Redirigiendo al chat...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No se pudo aceptar</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>{errorMessage}</p>
            <button
              onClick={() => router.replace('/chat')}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '0.5px solid var(--border)',
                background: 'var(--bg-tertiary)', fontSize: 12, cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              Ir al chat
            </button>
          </>
        )}
      </div>
    </div>
  );
}
