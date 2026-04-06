'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/chat');
    });
  }, [router, supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { org_id: crypto.randomUUID() } },
        });
        if (error) throw error;
        setSuccess('Cuenta creada. Revisa tu email para confirmar (o inicia sesión si la confirmación está desactivada).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/chat');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, position: 'relative',
    }}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 36, height: 36, borderRadius: 10,
          border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'all 0.15s',
        }}
      >
        {theme === 'light' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--brand)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" /><path d="M8 11h8" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Documentation Hub</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Tu documentación, siempre accesible
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          borderRadius: 16, padding: 28,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, textAlign: 'center', marginBottom: 22 }}>
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@empresa.com"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '0.5px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '0.5px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div style={{
                fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'var(--danger-light)', color: 'var(--danger-text)',
                border: '0.5px solid var(--danger)',
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                fontSize: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'var(--success-light)', color: 'var(--success-text)',
                border: '0.5px solid var(--success)',
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 10, border: 'none',
                background: loading ? 'var(--bg-tertiary)' : 'var(--brand)',
                color: loading ? 'var(--text-secondary)' : '#fff',
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
              style={{
                fontSize: 12, color: 'var(--brand)', background: 'none',
                border: 'none', cursor: 'pointer',
              }}
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, marginTop: 18, color: 'var(--text-muted)' }}>
          Tus documentos están seguros y solo accesibles por tu organización
        </p>
      </div>
    </div>
  );
}
