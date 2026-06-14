'use client';

import AppRail from '@/components/layout/AppRail';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <AppRail />
      <main className="flex-1 overflow-y-auto md:overflow-hidden">{children}</main>
    </div>
  );
}
