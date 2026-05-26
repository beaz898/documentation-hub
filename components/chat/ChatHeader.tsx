'use client';

import FeedbackButton from '@/components/feedback/FeedbackButton';

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
  isMobile, documentCount, accessToken, hasMessages,
  onToggleSidebar, onClearChat,
}: ChatHeaderProps) {
  return (
    <div style={{ borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
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
        <p style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
          {documentCount > 0 ? `${documentCount} documento${documentCount !== 1 ? 's' : ''}` : 'Sube documentos para empezar'}
        </p>
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
    </div>
  );
}
