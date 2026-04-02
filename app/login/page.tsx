'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const supabase = createClient();

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
          email,
          password,
          options: {
            data: { org_id: crypto.randomUUID() },
          },
        });
        if (error) throw error;
        setSuccess('Cuenta creada. Revisa tu email para confirmar (o inicia sesión si la confirmación está desactivada).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace('/chat');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(51,102,255,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--brand), #6366f1)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documentation Hub</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tu documentación, siempre accesible
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 className="text-lg font-semibold mb-6 text-center">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@empresa.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="text-sm px-4 py-3 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                background: loading ? 'var(--text-muted)' : 'var(--brand)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? 'Procesando...'
                : isRegister
                  ? 'Crear cuenta'
                  : 'Entrar'
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccess('');
              }}
              className="text-sm transition-colors"
              style={{ color: 'var(--brand)' }}
            >
              {isRegister
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'
              }
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Tus documentos están seguros y solo accesibles por tu organización
        </p>
      </div>
    </div>
  );
}
