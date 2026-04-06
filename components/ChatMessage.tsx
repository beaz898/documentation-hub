'use client';

import ReactMarkdown from 'react-markdown';

interface Source {
  documentName: string;
  score: number;
}

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'loading' | 'error';
  content: string;
  sources?: Source[];
}

export default function ChatMessage({ role, content, sources }: ChatMessageProps) {
  if (role === 'loading') {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, background: 'var(--bg-tertiary)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: 12, background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', animationDelay: '0ms' }} />
            <div className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', animationDelay: '200ms' }} />
            <div className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', animationDelay: '400ms' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Buscando en la documentación...
          </span>
        </div>
      </div>
    );
  }

  if (role === 'error') {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, background: 'var(--danger-light)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: 12, maxWidth: '80%',
          background: 'var(--danger-light)', border: '0.5px solid var(--danger)',
          fontSize: 13, color: 'var(--danger-text)', lineHeight: 1.6,
        }}>
          {content}
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          padding: '10px 16px', borderRadius: 12, maxWidth: '80%',
          background: 'var(--brand)', color: '#fff', fontSize: 13,
          lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, marginTop: 2, background: 'var(--bg-tertiary)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>
      <div style={{ maxWidth: '85%' }}>
        <div
          className="prose-chat"
          style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13,
            background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
            color: 'var(--text-primary)', lineHeight: 1.65,
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {sources && sources.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, paddingLeft: 2 }}>
            {sources.map((source, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: 'var(--brand-light)', color: 'var(--brand-text)',
                  border: '0.5px solid var(--brand)',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                </svg>
                {source.documentName}
                <span style={{ opacity: 0.6 }}>{source.score}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
