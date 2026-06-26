'use client';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  business_plus: 'Business+',
  enterprise: 'Enterprise',
};

interface CreditsData {
  remaining: number;
  plan: string;
}

interface CreditsIndicatorProps {
  credits: CreditsData | null | undefined;
  compact?: boolean;
}

export default function CreditsIndicator({ credits, compact }: CreditsIndicatorProps) {
  if (!credits) return null;

  const color = credits.remaining <= 10
    ? 'var(--danger)'
    : credits.remaining <= 30
      ? '#f59e0b'
      : 'var(--brand)';

  if (compact) {
    return (
      <span style={{ fontSize: 12, fontWeight: 600, color, whiteSpace: 'nowrap' }}>
        {credits.remaining} cr
      </span>
    );
  }

  const fillPct = Math.min(100, (credits.remaining / Math.max(credits.remaining, 100)) * 100);

  return (
    <div style={{
      padding: '6px 10px', borderRadius: 8,
      background: 'var(--bg-tertiary)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 3,
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
            {PLAN_LABELS[credits.plan] || credits.plan}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color }}>
            {credits.remaining} cr
          </span>
        </div>
        <div style={{
          width: '100%', height: 3, borderRadius: 2,
          background: 'var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: color,
            width: `${fillPct}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
}
