'use client';

import { usePathname } from 'next/navigation';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import DoclityLogo from '@/components/DoclityLogo';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  documentCount: number;
  accessToken: string;
  hasMessages: boolean;
  onToggleSidebar: () => void;
  onClearChat: () => void;
}

export default function ChatHeader({
  sidebarOpen, isMobile, documentCount, accessToken, hasMessages,
  onToggleSidebar, onClearChat,
}: ChatHeaderProps) {
  const pathname = usePathname();

  return (
    <div style={{ borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
      {/* Top row: logo + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        {isMobile && (
          <button onClick={onToggleSidebar} aria-label="Toggle sidebar" style={{
            width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div style={{ flex: 1 }}>
          <DoclityLogo size="sm" />
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {documentCount > 0 ? `${documentCount} documento${documentCount !== 1 ? 's' : ''}` : 'Sube documentos para empezar'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FeedbackButton accessToken={accessToken} />
          {hasMessages && (
            <button onClick={() => { if (window.confirm('¿Limpiar conversación?')) onClearChat(); }}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Limpiar chat
            </button>
          )}
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', padding: '0 16px' }}>
        {([
          { label: 'Chat', href: '/chat' },
          { label: 'Agente', href: '/agent' },
        ] as const).map(({ label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
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
  );
}
