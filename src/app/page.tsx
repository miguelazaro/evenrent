'use client';

import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, ChevronRight, TrendingUp, CalendarClock, Truck, RotateCcw, Package2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const STATUS_LABEL: Record<string, string> = {
  PENDING:     'PENDIENTE',
  CONFIRMED:   'CONFIRMADO',
  IN_PROGRESS: 'EN ENTREGA',
  COMPLETED:   'COMPLETADO',
  CANCELLED:   'CANCELADO',
};

const STATUS_PILL: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  CONFIRMED:   'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-zinc-100 text-zinc-500',
  CANCELLED:   'bg-red-100 text-red-600',
};

function getDateLabel(date: Date): { text: string; urgent: boolean } {
  if (isToday(date))    return { text: 'Hoy',    urgent: true };
  if (isTomorrow(date)) return { text: 'Mañana', urgent: true };
  return { text: format(date, "EEE d 'de' MMM", { locale: es }), urgent: false };
}

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date();

  const { data: kpis } = trpc.dashboard.getKPIs.useQuery();
  const { data: upcomingRentals = [] } = trpc.dashboard.getUpcomingRentals.useQuery();

  const todayDeliveries = upcomingRentals.filter((r) => isToday(new Date(r.deliveryDate)));
  const activityItems   = upcomingRentals.slice(0, 5);
  const tableItems      = upcomingRentals.slice(0, 8);

  const metrics = [
    {
      icon: TrendingUp,
      label: 'INGRESOS DEL MES',
      value: kpis?.monthlyRevenue ?? '—',
      sub: 'acumulado este mes',
    },
    {
      icon: CalendarClock,
      label: 'EVENTOS ACTIVOS',
      value: kpis?.pendingDeliveries ?? '—',
      sub: 'próximos 30 días',
    },
    {
      icon: Truck,
      label: 'ENTREGAS HOY',
      value: kpis?.todayEvents ?? '—',
      sub: 'programadas para hoy',
    },
    {
      icon: RotateCcw,
      label: 'RECOLECCIONES',
      value: kpis?.todayPickups ?? '—',
      sub: 'programadas hoy',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <div className="max-w-6xl mx-auto px-6 py-7 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {format(today, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
            <h1 className="text-[22px] font-bold text-zinc-900 mt-0.5 tracking-tight">
              Panel de Operaciones
            </h1>
          </div>
          <button
            onClick={() => router.push('/eventos')}
            className="flex items-center gap-2 text-[13px] font-semibold bg-zinc-900 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo evento
          </button>
        </div>

        {/* ── 4 Metrics strip ── */}
        <div className="bg-white rounded-xl border border-zinc-200 grid grid-cols-4 divide-x divide-zinc-200">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-400 mb-3">
                  {m.label}
                </p>
                <p className="text-[26px] font-bold text-zinc-900 leading-none tabular-nums">
                  {m.value}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Icon className="h-3 w-3 text-zinc-400" />
                  <p className="text-[11px] text-zinc-400">{m.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Middle: Activity + Table ── */}
        <div className="grid grid-cols-5 gap-5">

          {/* Activity Flow */}
          <div className="col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100">
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-zinc-500">
                Actividad reciente
              </p>
            </div>
            {activityItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center">
                <Package2 className="h-8 w-8 text-zinc-200 mb-2" />
                <p className="text-xs text-zinc-400">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {activityItems.map((rental) => {
                  const status = rental.status as string;
                  const deliveryDate = new Date(rental.deliveryDate);
                  const { text: dateText, urgent } = getDateLabel(deliveryDate);
                  const pill = STATUS_PILL[status] ?? 'bg-zinc-100 text-zinc-500';

                  return (
                    <div
                      key={rental.id}
                      onClick={() => router.push(`/eventos/${rental.id}`)}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                        status === 'PENDING' ? 'bg-amber-400' :
                        status === 'CONFIRMED' ? 'bg-emerald-400' :
                        status === 'IN_PROGRESS' ? 'bg-blue-400' :
                        'bg-zinc-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-800 truncate leading-tight">
                          {rental.eventName}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                          {rental.client.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pill}`}>
                            {STATUS_LABEL[status] ?? status}
                          </span>
                          <span className={`text-[10px] font-medium ${urgent ? 'text-amber-500' : 'text-zinc-400'}`}>
                            {dateText}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Events table */}
          <div className="col-span-3 bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-zinc-500">
                Próximos eventos
              </p>
              <button
                onClick={() => router.push('/eventos')}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Ver todos <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {tableItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center">
                <Package2 className="h-8 w-8 text-zinc-200 mb-2" />
                <p className="text-xs text-zinc-400">Sin eventos próximos</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-12 px-5 py-2 border-b border-zinc-100">
                  <p className="col-span-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Evento</p>
                  <p className="col-span-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Estado</p>
                  <p className="col-span-4 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">Fecha entrega</p>
                </div>
                <div className="divide-y divide-zinc-50">
                  {tableItems.map((rental) => {
                    const status = rental.status as string;
                    const deliveryDate = new Date(rental.deliveryDate);
                    const { text: dateText, urgent } = getDateLabel(deliveryDate);

                    return (
                      <div
                        key={rental.id}
                        onClick={() => router.push(`/eventos/${rental.id}`)}
                        className="grid grid-cols-12 items-center px-5 py-3 hover:bg-zinc-50 cursor-pointer transition-colors group"
                      >
                        <div className="col-span-5 min-w-0 pr-3">
                          <p className="text-[13px] font-semibold text-zinc-800 truncate leading-tight">
                            {rental.eventName}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{rental.client.name}</p>
                        </div>
                        <div className="col-span-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_PILL[status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        </div>
                        <div className="col-span-4 text-right">
                          <p className={`text-[12px] font-semibold capitalize ${urgent ? 'text-amber-500' : 'text-zinc-700'}`}>
                            {dateText}
                          </p>
                          {!urgent && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {format(deliveryDate, 'MMM yyyy', { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Entregas hoy ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-zinc-500">
              Entregas hoy
            </p>
          </div>
          {todayDeliveries.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 py-8 flex items-center justify-center">
              <p className="text-[12px] text-zinc-400">Sin entregas programadas para hoy</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayDeliveries.map((rental) => {
                const status = rental.status as string;
                return (
                  <div
                    key={rental.id}
                    onClick={() => router.push(`/eventos/${rental.id}`)}
                    className="bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-300 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-2 w-2 rounded-full mt-1 shrink-0 bg-zinc-900" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_PILL[status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </div>
                    <p className="text-[14px] font-bold text-zinc-900 leading-tight mb-0.5">{rental.eventName}</p>
                    <p className="text-[12px] text-zinc-400 mb-3">{rental.client.name}</p>
                    <button className="w-full text-[11px] font-semibold text-zinc-600 border border-zinc-200 rounded-md py-1.5 hover:bg-zinc-50 hover:border-zinc-300 transition-colors uppercase tracking-wide">
                      Ver detalle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
