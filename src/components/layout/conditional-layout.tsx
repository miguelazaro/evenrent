'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { NotificationsBell } from '@/components/layout/notifications-bell';

const PUBLIC_ROUTES = ['/login', '/register'];
const CLEAN_ROUTES = ['/cotizacion'];

function TopBar() {
  return (
    <header className="h-12 border-b border-zinc-200 bg-white flex items-center justify-end px-4 shrink-0">
      <NotificationsBell />
    </header>
  );
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isCleanRoute = CLEAN_ROUTES.some((r) => pathname.endsWith(r));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (isPublicRoute || isCleanRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-zinc-50">
          {children}
        </main>
      </div>
    </div>
  );
}
