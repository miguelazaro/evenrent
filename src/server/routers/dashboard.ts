import { createTRPCRouter, protectedProcedure } from '../trpc';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export const dashboardRouter = createTRPCRouter({
  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const orgId = user.organizationId;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [todayEvents, pendingDeliveries, todayPickups, monthlyRentals] =
      await Promise.all([
        // Eventos con entrega HOY
        ctx.db.rental.count({
          where: {
            organizationId: orgId,
            deliveryDate: { gte: todayStart, lte: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
        // Entregas pendientes (PENDING o CONFIRMED, fecha >= hoy)
        ctx.db.rental.count({
          where: {
            organizationId: orgId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            deliveryDate: { gte: todayStart },
          },
        }),
        // Recolecciones programadas HOY
        ctx.db.rental.count({
          where: {
            organizationId: orgId,
            pickupDate: { gte: todayStart, lte: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
        // Ingresos del mes (suma totalAmount)
        ctx.db.rental.aggregate({
          where: {
            organizationId: orgId,
            deliveryDate: { gte: monthStart, lte: monthEnd },
            status: { not: 'CANCELLED' },
          },
          _sum: { totalAmount: true },
        }),
      ]);

    const totalAmount = monthlyRentals._sum.totalAmount ?? 0;
    const formattedRevenue =
      totalAmount > 0
        ? `$${totalAmount.toLocaleString('es-MX')} MXN`
        : '$0 MXN';

    return {
      todayEvents,
      pendingDeliveries,
      todayPickups,
      monthlyRevenue: formattedRevenue,
    };
  }),

  getUpcomingRentals: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');

    const rentals = await ctx.db.rental.findMany({
      where: {
        organizationId: user.organizationId,
        deliveryDate: { gte: startOfDay(new Date()) },
        status: { not: 'CANCELLED' },
      },
      include: {
        client: { select: { name: true } },
        items: { include: { inventoryItem: { select: { name: true } } } },
      },
      orderBy: { deliveryDate: 'asc' },
      take: 10,
    });

    return rentals;
  }),
});
