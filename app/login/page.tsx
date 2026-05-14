'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import DoclityLogo from '@/components/DoclityLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
          <div className="flex justify-center mb-3" style={{ color: 'var(--text-primary)' }}>
            <DoclityLogo size="md" />
          </div>
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

            {isRegister && (
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 cursor-pointer"
                  style={{ accentColor: 'var(--brand)', width: 15, height: 15, flexShrink: 0 }}
                />
                <label htmlFor="terms-checkbox" className="text-xs leading-relaxed cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  He leído y acepto los{' '}
                  <a
                    href="/legal/terminos"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--brand)', textDecoration: 'underline', textUnderlineOffset: 3 }}
                    onClick={e => e.stopPropagation()}
                  >
                    Términos y Condiciones
                  </a>
                  {' '}y la{' '}
                  <a
                    href="/legal/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--brand)', textDecoration: 'underline', textUnderlineOffset: 3 }}
                    onClick={e => e.stopPropagation()}
                  >
                    Política de Privacidad
                  </a>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isRegister && !termsAccepted)}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                background: loading || (isRegister && !termsAccepted) ? 'var(--text-muted)' : 'var(--brand)',
                cursor: loading || (isRegister && !termsAccepted) ? 'not-allowed' : 'pointer',
                opacity: isRegister && !termsAccepted ? 0.6 : 1,
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
                setTermsAccepted(false);
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
        <div className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            { href: '/legal/privacidad', label: 'Política de privacidad' },
            { href: '/legal/terminos', label: 'Términos y condiciones' },
            { href: '/legal/aviso-legal', label: 'Aviso legal' },
            { href: '/legal/cookies', label: 'Política de cookies' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{ color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
