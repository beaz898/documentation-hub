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
      <div className="flex gap-3 animate-fade-in-up">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <div
          className="px-4 py-3 rounded-xl max-w-[80%]"
          style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse-dot" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse-dot" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse-dot" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Buscando en la documentación...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'error') {
    return (
      <div className="flex gap-3 animate-fade-in-up">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div
          className="px-4 py-3 rounded-xl max-w-[80%] text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: 'var(--danger)',
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="flex gap-3 justify-end animate-fade-in-up">
        <div
          className="px-4 py-3 rounded-xl max-w-[80%] text-sm"
          style={{
            background: 'var(--brand)',
            color: 'white',
            lineHeight: '1.6',
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
      </div>
      <div className="max-w-[85%] space-y-2">
        <div
          className="px-4 py-3 rounded-xl text-sm prose-chat"
          style={{
            background: 'var(--surface-overlay)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {/* Fuentes */}
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {sources.map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md"
                style={{
                  background: 'rgba(51,102,255,0.08)',
                  color: 'var(--brand)',
                  border: '1px solid rgba(51,102,255,0.15)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
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
