'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/chat');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex gap-2 items-center text-[var(--text-secondary)]">
        <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse-dot" />
        <span>Cargando...</span>
      </div>
    </div>
  );
}
