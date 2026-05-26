'use client';

import AppRail from '@/components/layout/AppRail';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppRail />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
