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
  sidebarOpen, isMobile, documentCount, accessToken, hasMessages,
  onToggleSidebar, onClearChat,
}: ChatHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
      <button onClick={onToggleSidebar} aria-label="Toggle sidebar" style={{
        width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {sidebarOpen && !isMobile
            ? (<><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></>)
            : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)
          }
        </svg>
      </button>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 14, fontWeight: 600 }}>Doclity</h1>
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
  );
}
