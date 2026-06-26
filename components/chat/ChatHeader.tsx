'use client';

import { useTranslations } from 'next-intl';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import CreditsIndicator from '@/components/shared/CreditsIndicator';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  isMobile: boolean;
  credits: { remaining: number; plan: string } | null | undefined;
  accessToken: string;
  hasMessages: boolean;
  onToggleSidebar: () => void;
  onClearChat: () => void;
}

export default function ChatHeader({
  isMobile, credits, accessToken, hasMessages,
  onToggleSidebar, onClearChat,
}: ChatHeaderProps) {
  const t = useTranslations();

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
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMobile && <CreditsIndicator credits={credits} compact />}
          <FeedbackButton accessToken={accessToken} />
          {hasMessages && (
            <button
              onClick={() => { if (window.confirm(t('chat.clearChatConfirm'))) onClearChat(); }}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {t('chat.clearChat')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
