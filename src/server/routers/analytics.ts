import { createTRPCRouter, protectedProcedure } from '../trpc';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

export const analyticsRouter = createTRPCRouter({
  /**
   * Ingresos de los últimos 12 meses (agrupado por mes)
   */
  getRevenueByMonth: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), 11 - i);
      return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, 'MMM yy', { locale: es }) };
    });

    const data = await Promise.all(
      months.map(async ({ start, end, label }) => {
        const agg = await ctx.db.rental.aggregate({
          where: {
            organizationId: user.organizationId,
            status: { not: 'CANCELLED' },
            deliveryDate: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        });
        return {
          mes: label,
          ingresos: agg._sum.totalAmount ?? 0,
          eventos: agg._count.id,
        };
      })
    );

    return data;
  }),

  /**
   * Distribución de eventos por estado
   */
  getEventsByStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const LABELS: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };
    const COLORS: Record<string, string> = {
      PENDING: '#f59e0b',
      CONFIRMED: '#3b82f6',
      IN_PROGRESS: '#8b5cf6',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    };

    const data = await Promise.all(
      statuses.map(async (status) => {
        const count = await ctx.db.rental.count({
          where: { organizationId: user.organizationId, status },
        });
        return { name: LABELS[status], value: count, color: COLORS[status] };
      })
    );

    return data.filter((d) => d.value > 0);
  }),

  /**
   * Distribución de eventos por tipo
   */
  getEventsByType: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const rentals = await ctx.db.rental.findMany({
      where: {
        organizationId: user.organizationId,
        status: { not: 'CANCELLED' },
      },
      select: { eventType: true },
    });

    const TYPE_LABELS: Record<string, string> = {
      wedding: 'Boda',
      corporate: 'Corporativo',
      birthday: 'Cumpleaños',
      anniversary: 'Aniversario',
      graduation: 'Graduación',
      quinceañera: 'Quinceañera',
      baptism: 'Bautizo',
      other: 'Otro',
    };

    const counts: Record<string, number> = {};
    for (const r of rentals) {
      const key = TYPE_LABELS[r.eventType.toLowerCase()] ?? r.eventType;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }),

  /**
   * Top 5 clientes por ingresos generados
   */
  getTopClients: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const clients = await ctx.db.client.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        name: true,
        company: true,
        rentals: {
          where: { status: { not: 'CANCELLED' } },
          select: { totalAmount: true },
        },
      },
    });

    return clients
      .map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company ?? null,
        total: c.rentals.reduce((acc, r) => acc + r.totalAmount, 0),
        eventos: c.rentals.length,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }),

  /**
   * Top 5 artículos de inventario más rentados
   */
  getTopInventory: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const items = await ctx.db.inventoryItem.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        name: true,
        category: true,
        rentalPrice: true,
        rentalItems: {
          select: { quantity: true, unitPrice: true },
        },
      },
    });

    const CATEGORY_LABELS: Record<string, string> = {
      mesas: 'Mesas', sillas: 'Sillas', manteleria: 'Mantelería',
      iluminacion: 'Iluminación', vajilla: 'Vajilla', decoracion: 'Decoración',
      audio_video: 'Audio / Video', carpas: 'Carpas', otro: 'Otro',
    };

    return items
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: CATEGORY_LABELS[item.category] ?? item.category,
        usos: item.rentalItems.length,
        unidades: item.rentalItems.reduce((acc, ri) => acc + ri.quantity, 0),
        ingresos: item.rentalItems.reduce((acc, ri) => acc + ri.unitPrice * ri.quantity, 0),
      }))
      .filter((i) => i.usos > 0)
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5);
  }),

  /**
   * Totales globales para tarjetas de resumen
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const orgId = user.organizationId;

    const [totalRevenue, totalEvents, totalClients, totalItems] = await Promise.all([
      ctx.db.rental.aggregate({
        where: { organizationId: orgId, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      ctx.db.rental.count({ where: { organizationId: orgId, status: { not: 'CANCELLED' } } }),
      ctx.db.client.count({ where: { organizationId: orgId } }),
      ctx.db.inventoryItem.count({ where: { organizationId: orgId } }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      totalEvents,
      totalClients,
      totalItems,
    };
  }),
});
