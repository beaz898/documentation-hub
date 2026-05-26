'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface Summary {
  hasAgent: boolean;
}

export default function AgentPage() {
  const [loading, setLoading] = useState(true);
  const [hasAgent, setHasAgent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      try {
        const res = await fetch('/api/usage/summary', { credentials: 'include' });
        if (res.ok) {
          const data: Summary = await res.json();
          setHasAgent(data.hasAgent ?? false);
        }
      } catch {
        // keep hasAgent false on error
      } finally {
        setLoading(false);
      }
    });
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
          <button
            onClick={() => router.push('/chat')}
            style={{
              padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)',
              background: 'var(--bg-secondary)', cursor: 'pointer',
              fontSize: 12, color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>
          <h1 style={{ fontSize: 15, fontWeight: 600 }}>Agente IA</h1>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', padding: '0 16px' }}>
          {([
            { label: 'Chat', href: '/chat' },
            { label: 'Agente', href: '/agent' },
          ] as const).map(({ label, href }) => {
            const active = href === '/agent';
            return (
              <a
                key={href}
                href={href}
                style={{
                  padding: '8px 14px',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  borderBottom: active ? '2px solid var(--brand)' : '2px solid transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  marginBottom: -1,
                }}
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {hasAgent ? (
        <Placeholder />
      ) : (
        <Paywall />
      )}
    </div>
  );
}

function Placeholder() {
  return (
    <div style={{ maxWidth: 560, margin: '64px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, margin: '0 auto 20px',
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 8v4l3 3" />
          <circle cx="19" cy="5" r="3" fill="var(--brand)" stroke="none" />
        </svg>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Agente IA</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
        Próximamente disponible aquí
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Estamos finalizando la interfaz. Si necesitas ejecutar tareas mientras tanto, contacta con soporte.
      </p>
    </div>
  );
}

function Paywall() {
  return (
    <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 24px' }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        borderRadius: 16, padding: '32px 28px',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, marginBottom: 20,
          background: 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
          </svg>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Agente IA</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          El agente sigue las instrucciones de tu documentación y redacta o procesa contenido por ti, citando siempre las fuentes.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Redacta emails siguiendo el tono de tu empresa',
            'Lee y resume documentos siguiendo tus procedimientos',
            'Cita las fuentes que usa en cada respuesta',
            'Pregunta antes de improvisar fuera del corpus',
          ].map(item => (
            <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </li>
          ))}
        </ul>

        <a
          href="/settings/billing"
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            padding: '11px 20px', borderRadius: 10,
            background: 'var(--brand)', color: '#fff',
            fontSize: 13, fontWeight: 600,
          }}
        >
          Actualizar a Business
        </a>
      </div>
    </div>
  );
}
