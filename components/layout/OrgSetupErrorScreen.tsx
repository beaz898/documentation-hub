'use client';

import { useSession } from '@/contexts/SessionContext';

export default function OrgSetupErrorScreen() {
  const { orgSetupError, logout } = useSession();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{
        maxWidth: 400, width: '100%', padding: '28px 24px', borderRadius: 12,
        background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', margin: '0 auto',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Error al configurar tu cuenta</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{orgSetupError}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: 'var(--brand)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Recargar página
        </button>
        <button
          onClick={logout}
          style={{
            padding: '7px 18px', borderRadius: 8,
            border: '0.5px solid var(--border)', background: 'transparent',
            fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
