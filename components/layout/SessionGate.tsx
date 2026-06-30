'use client';

import { useSession } from '@/contexts/SessionContext';

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
        <div
          className="animate-spin"
          style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
