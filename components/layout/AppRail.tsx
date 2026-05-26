'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Bot, Settings, Sun, Moon, Users, BarChart3, CreditCard, LogOut } from 'lucide-react';
import DoclityLogo from '@/components/DoclityLogo';
import { useTheme } from '@/components/ThemeProvider';
import { createClient } from '@/lib/supabase';

interface OrgSummary {
  hasAgent: boolean;
  hasAnalyticsPanel: boolean;
}

const MAIN_NAV = [
  { href: '/chat',  icon: MessageSquare, label: 'Chat',   always: true  },
  { href: '/agent', icon: Bot,           label: 'Agente', always: false },
] as const;

const SETTINGS_NAV = [
  { href: '/settings/team',    icon: Users,       label: 'Equipo',      always: true  },
  { href: '/settings/usage',   icon: BarChart3,   label: 'Analítica',   always: false },
  { href: '/settings/billing', icon: CreditCard,  label: 'Facturación', always: true  },
] as const;

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

export default function AppRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [org, setOrg] = useState<OrgSummary>({ hasAgent: false, hasAnalyticsPanel: false });

  useEffect(() => {
    fetch('/api/usage/summary', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setOrg({ hasAgent: data.hasAgent ?? false, hasAnalyticsPanel: data.hasAnalyticsPanel ?? false });
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="flex flex-col items-center justify-between w-16 h-screen flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 py-4">

      {/* Logo */}
      <div className="flex items-center justify-center">
        <DoclityLogo size="sm" showText={false} />
      </div>

      {/* Navegación central */}
      <nav className="flex flex-col items-center gap-1">
        {/* Chat — siempre visible */}
        <NavLink href="/chat" icon={MessageSquare} label="Chat" active={isActive('/chat')} />

        {/* Agente — solo si el plan lo incluye */}
        {org.hasAgent && (
          <NavLink href="/agent" icon={Bot} label="Agente" active={isActive('/agent')} />
        )}

        {/* Separador */}
        <div className="w-6 border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Equipo */}
        <NavLink href="/settings/team" icon={Users} label="Equipo" active={isActive('/settings/team')} />

        {/* Analítica — solo si el plan lo incluye */}
        {org.hasAnalyticsPanel && (
          <NavLink href="/settings/usage" icon={BarChart3} label="Analítica" active={isActive('/settings/usage')} />
        )}

        {/* Facturación */}
        <NavLink href="/settings/billing" icon={CreditCard} label="Facturación" active={isActive('/settings/billing')} />
      </nav>

      {/* Parte inferior: tema + logout */}
      <div className="flex flex-col items-center gap-1">
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
  );
}
