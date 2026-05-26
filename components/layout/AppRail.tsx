'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Bot, Settings, Sun, Moon } from 'lucide-react';
import DoclityLogo from '@/components/DoclityLogo';
import { useTheme } from '@/components/ThemeProvider';

const NAV_ITEMS = [
  { href: '/chat',             icon: MessageSquare, label: 'Chat' },
  { href: '/agent',            icon: Bot,           label: 'Agente' },
  { href: '/settings/billing', icon: Settings,      label: 'Ajustes' },
] as const;

export default function AppRail() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="flex flex-col items-center justify-between w-16 h-screen flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 py-4">

      {/* Logo */}
      <div className="flex items-center justify-center">
        <DoclityLogo size="sm" showText={false} />
      </div>

      {/* Navegación */}
      <nav className="flex flex-col items-center gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={[
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
              ].join(' ')}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>

      {/* Toggle de tema */}
      <button
        onClick={toggleTheme}
        title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

    </aside>
  );
}
