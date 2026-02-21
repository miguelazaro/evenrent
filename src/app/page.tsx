'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { KPICard } from '@/features/dashboard/components/kpi-card';
import { UpcomingRentalsTable } from '@/components/upcoming-rentals-table';
import { trpc } from '@/lib/trpc/client';

export default function DashboardPage() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const { data: kpis } = trpc.dashboard.getKPIs.useQuery();
  const { data: upcomingRentals = [], isLoading: loadingRentals } = trpc.dashboard.getUpcomingRentals.useQuery();

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900">Resumen Operativo</h1>
        <p className="text-lg text-zinc-600">
          Bienvenido de nuevo, Inge. Miguel Lázaro
        </p>
        <p className="text-sm text-zinc-500">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Eventos Hoy"
          value={kpis?.todayEvents ?? '—'}
          subtext="Con entrega hoy"
          iconName="calendar"
          variant="default"
        />
        <KPICard
          label="Entregas Pendientes"
          value={kpis?.pendingDeliveries ?? '—'}
          subtext="Requieren atención"
          iconName="package"
          variant="warning"
        />
        <KPICard
          label="Recolecciones"
          value={kpis?.todayPickups ?? '—'}
          subtext="Programadas hoy"
          iconName="check-circle"
          variant="success"
        />
        <KPICard
          label="Ingresos del Mes"
          value={kpis?.monthlyRevenue ?? '—'}
          subtext="MXN acumulado"
          iconName="trending-up"
          variant="accent"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900">Próximas Salidas</h2>
            <p className="text-sm text-zinc-600">
              Calendario de entregas programadas
            </p>
          </div>
        </div>
        <UpcomingRentalsTable isLoading={loadingRentals} data={upcomingRentals.map((r) => ({
          id: r.id,
          status: r.status,
          client: r.client.name,
          eventName: r.eventName,
          deliveryDate: r.deliveryDate,
          items: r.items.length > 0
            ? r.items.map((i) => `${i.inventoryItem.name} x${i.quantity}`).join(', ')
            : '—',
        }))} />
      </div>
    </div>
  );
}
