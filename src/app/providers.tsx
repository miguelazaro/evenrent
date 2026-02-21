'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { TRPCProvider } from '@/lib/trpc/client';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
            <TRPCProvider>
                {children}
            </TRPCProvider>
        </SessionProvider>
    );
}
