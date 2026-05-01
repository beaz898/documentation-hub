'use client';

import { useState, useCallback } from 'react';
import type { SessionInfo, CreditsInfo } from './types';

export function useCredits(session: SessionInfo | null) {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);

  const loadCredits = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/usage/summary', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.ok) {
        const data = await res.json();
        setCredits({
          remaining: data.creditsRemaining + data.creditsExtra,
          extra: data.creditsExtra,
          plan: data.plan,
          subscriptionStatus: data.subscriptionStatus || 'active',
          gracePeriodEndsAt: data.gracePeriodEndsAt || null,
        });
      }
    } catch (err) { console.error('Error loading credits:', err); }
  }, [session]);

  return { credits, loadCredits };
}
