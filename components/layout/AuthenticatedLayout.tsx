'use client';

import AppRail from '@/components/layout/AppRail';
import OrgSetupErrorScreen from '@/components/layout/OrgSetupErrorScreen';
import SessionGate from '@/components/layout/SessionGate';
import { useScrollFocusedInputIntoView } from '@/hooks/useScrollFocusedInputIntoView';
import { SessionProvider, useSession } from '@/contexts/SessionContext';
import { AccountProvider } from '@/contexts/AccountContext';

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  useScrollFocusedInputIntoView();
  const { orgSetupError } = useSession();

  if (orgSetupError) {
    return <OrgSetupErrorScreen />;
  }

  return (
    <div className="flex h-dvh">
      <AppRail />
      <main className="flex-1 overflow-y-auto md:overflow-hidden">
        <SessionGate>{children}</SessionGate>
      </main>
    </div>
  );
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AccountProvider>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </AccountProvider>
    </SessionProvider>
  );
}
