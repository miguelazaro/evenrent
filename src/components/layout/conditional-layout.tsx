'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

const PUBLIC_ROUTES = ['/login', '/register'];
const CLEAN_ROUTES = ['/cotizacion'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isCleanRoute = CLEAN_ROUTES.some((r) => pathname.endsWith(r));

  if (isPublicRoute || isCleanRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 w-full">
        <div className="min-h-screen bg-zinc-50/40">
          {children}
        </div>
      </main>
    </div>
  );
}
