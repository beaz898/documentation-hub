'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Bot, Sun, Moon, Users, BarChart3, CreditCard, BookOpen, LogOut } from 'lucide-react';
import DoclityLogo from '@/components/DoclityLogo';
import { useTheme } from '@/components/ThemeProvider';
import { createClient } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';
import { useAccount } from '@/contexts/AccountContext';

interface UpgradeToast {
  label: string;
  minPlan: string;
  y: number;
}

function NavLink({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      title={label}
      className={[
        'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
        active
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
      ].join(' ')}
    >
      <Icon size={20} />
    </Link>
  );
}

function LockedNavItem({ icon: Icon, label, minPlan, onShow }: {
  icon: React.ElementType;
  label: string;
  minPlan: string;
  onShow: (label: string, minPlan: string, y: number) => void;
}) {
  return (
    <button
      title={label}
      onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        onShow(label, minPlan, rect.top + rect.height / 2);
      }}
      style={{ opacity: 0.35, cursor: 'not-allowed' }}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400"
    >
      <Icon size={20} />
    </button>
  );
}

function LoadingNavItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div
      title={label}
      aria-busy="true"
      style={{ opacity: 0.2, cursor: 'default' }}
      className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400"
    >
      <Icon size={20} />
    </div>
  );
}

export default function AppRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { features } = useAccount();
  const [upgradeToast, setUpgradeToast] = useState<UpgradeToast | null>(null);

  const featuresLoading = features === null;
  const hasAgent = features?.hasAgent ?? false;
  const hasAnalyticsPanel = features?.hasAnalyticsPanel ?? false;

  useEffect(() => {
    if (!upgradeToast) return;
    const timer = setTimeout(() => setUpgradeToast(null), 4000);
    return () => clearTimeout(timer);
  }, [upgradeToast]);

  function showToast(label: string, minPlan: string, y: number) {
    setUpgradeToast({ label, minPlan, y });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      <aside className="flex flex-col items-center justify-between w-16 h-dvh flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 py-4">

        <div className="flex items-center justify-center">
          <DoclityLogo size="sm" showText={false} />
        </div>

        <nav className="flex flex-col items-center gap-1">
          <NavLink href="/chat" icon={MessageSquare} label="Chat" active={isActive('/chat')} />

          {featuresLoading
            ? <LoadingNavItem icon={Bot} label="Agente" />
            : hasAgent
              ? <NavLink href="/agent" icon={Bot} label="Agente" active={isActive('/agent')} />
              : <LockedNavItem icon={Bot} label="Agente" minPlan="Business" onShow={showToast} />}

          <div className="w-6 border-t border-gray-200 dark:border-gray-700 my-1" />

          <NavLink href="/settings/team" icon={Users} label="Equipo" active={isActive('/settings/team')} />

          {featuresLoading
            ? <LoadingNavItem icon={BarChart3} label="Analítica" />
            : hasAnalyticsPanel
              ? <NavLink href="/settings/usage" icon={BarChart3} label="Analítica" active={isActive('/settings/usage')} />
              : <LockedNavItem icon={BarChart3} label="Analítica" minPlan="Business" onShow={showToast} />}

          <NavLink href="/settings/billing" icon={CreditCard} label="Facturación" active={isActive('/settings/billing')} />
          <NavLink href="/settings/learning" icon={BookOpen} label="Aprendizaje" active={isActive('/settings/learning')} />
        </nav>

        <div className="flex flex-col items-center gap-1">
          <LanguageSelector />

          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>

      </aside>

      {upgradeToast && (
        <div style={{
          position: 'fixed', left: 72, top: upgradeToast.y, transform: 'translateY(-50%)',
          zIndex: 200,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          borderRadius: 10, padding: '10px 30px 10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxWidth: 220, display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {upgradeToast.label}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
            Disponible desde el plan <strong>{upgradeToast.minPlan}</strong>.
          </p>
          <Link
            href="/settings/billing"
            onClick={() => setUpgradeToast(null)}
            style={{ fontSize: 11, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}
          >
            Ver planes →
          </Link>
          <button
            onClick={() => setUpgradeToast(null)}
            aria-label="Cerrar"
            style={{
              position: 'absolute', top: 6, right: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
