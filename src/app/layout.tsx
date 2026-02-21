import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import { Providers } from '@/app/providers';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EvenRent - Gestión de Inventario y Rentals',
  description:
    'Sistema de gestión de inventario y rentals para negocios de eventos en Latinoamérica',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
