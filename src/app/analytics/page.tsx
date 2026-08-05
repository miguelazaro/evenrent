'use client';

import { trpc } from '@/lib/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Calendar, Users, Package2, BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

function fmtMoneyFull(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      <p>Ingresos: <span className="font-semibold">{fmtMoneyFull(payload[0]?.value ?? 0)}</span></p>
      {payload[1] && <p>Eventos: <span className="font-semibold">{payload[1]?.value}</span></p>}
    </div>
  );
}

// ─── Summary card ────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-zinc-600" />
        </div>
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f7f8] p-6 space-y-6">
      <div>
        <Skeleton className="h-7 w-40 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();

  const { data: summary, isLoading: l0 } = trpc.analytics.getSummary.useQuery();
  const { data: revenue, isLoading: l1 } = trpc.analytics.getRevenueByMonth.useQuery();
  const { data: byStatus, isLoading: l2 } = trpc.analytics.getEventsByStatus.useQuery();
  const { data: byType, isLoading: l3 } = trpc.analytics.getEventsByType.useQuery();
  const { data: topClients, isLoading: l4 } = trpc.analytics.getTopClients.useQuery();
  const { data: topInventory, isLoading: l5 } = trpc.analytics.getTopInventory.useQuery();

  if (l0 || l1 || l2 || l3 || l4 || l5) return <AnalyticsSkeleton />;

  const maxRevenue = Math.max(...(revenue?.map((d) => d.ingresos) ?? [0]), 1);

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Analítica</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Rendimiento general de tu negocio</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon={TrendingUp}
            label="Ingresos totales"
            value={fmtMoneyFull(summary?.totalRevenue ?? 0)}
            sub="eventos no cancelados"
          />
          <SummaryCard
            icon={Calendar}
            label="Eventos"
            value={String(summary?.totalEvents ?? 0)}
            sub="no cancelados"
          />
          <SummaryCard
            icon={Users}
            label="Clientes"
            value={String(summary?.totalClients ?? 0)}
            sub="en cartera"
          />
          <SummaryCard
            icon={Package2}
            label="Artículos"
            value={String(summary?.totalItems ?? 0)}
            sub="en inventario"
          />
        </div>

        {/* Revenue by month */}
        <Section title="Ingresos por mes — últimos 12 meses">
          {!revenue?.some((d) => d.ingresos > 0) ? (
            <div className="h-56 flex items-center justify-center text-zinc-400 text-sm">
              Sin datos de ingresos aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue} barSize={18} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtMoney(v)}
                  width={52}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f4f4f5', radius: 4 }} />
                <Bar dataKey="ingresos" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Status donut + Type bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Events by status */}
          <Section title="Eventos por estado">
            {!byStatus?.length ? (
              <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">Sin eventos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [value ?? 0, name ?? '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: '#71717a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* Events by type */}
          <Section title="Tipos de evento">
            {!byType?.length ? (
              <div className="h-52 flex items-center justify-center text-zinc-400 text-sm">Sin eventos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={byType}
                  layout="vertical"
                  barSize={14}
                  margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(v: number | undefined) => [v ?? 0, 'Eventos']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                    cursor={{ fill: '#f4f4f5' }}
                  />
                  <Bar dataKey="value" fill="#18181b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* Top clients + Top inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top clients */}
          <Section title="Top 5 clientes por ingresos">
            {!topClients?.length ? (
              <div className="py-10 text-center text-zinc-400 text-sm">Sin datos</div>
            ) : (
              <div className="space-y-3">
                {topClients.map((c, i) => {
                  const pct = maxRevenue > 0 ? (c.total / (topClients[0]?.total ?? 1)) * 100 : 0;
                  return (
                    <div
                      key={c.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/clients/${c.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 w-4">{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 group-hover:underline">{c.name}</p>
                            {c.company && <p className="text-xs text-zinc-400">{c.company}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-900">{fmtMoneyFull(c.total)}</p>
                          <p className="text-xs text-zinc-400">{c.eventos} eventos</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Top inventory */}
          <Section title="Top 5 artículos más rentados">
            {!topInventory?.length ? (
              <div className="py-10 text-center text-zinc-400 text-sm">Sin datos</div>
            ) : (
              <div className="space-y-3">
                {topInventory.map((item, i) => {
                  const maxU = topInventory[0]?.unidades ?? 1;
                  const pct = (item.unidades / maxU) * 100;
                  return (
                    <div
                      key={item.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/inventory/${item.id}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 w-4">{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 group-hover:underline">{item.name}</p>
                            <p className="text-xs text-zinc-400">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-zinc-900">{item.unidades} uds.</p>
                          <p className="text-xs text-zinc-400">{fmtMoneyFull(item.ingresos)}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

      </div>
    </div>
  );
}
