import { createTRPCRouter, protectedProcedure } from '../trpc';
import { addHours, startOfDay, endOfDay } from 'date-fns';

export type NotificationKind =
  | 'delivery_soon'
  | 'pickup_today'
  | 'unpaid_completed'
  | 'stock_out'
  | 'stock_low';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  urgency: 'high' | 'medium' | 'low';
}

export const notificationsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });
    if (!user) throw new Error('User not found');
    const orgId = user.organizationId;
    const now = new Date();

    const [deliveriesSoon, pickupsToday, unpaidCompleted, stockOut, stockLow] =
      await Promise.all([
        // Entregas en las próximas 48 h (no canceladas)
        ctx.db.rental.findMany({
          where: {
            organizationId: orgId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            deliveryDate: { gte: now, lte: addHours(now, 48) },
          },
          select: { id: true, eventName: true, deliveryDate: true, client: { select: { name: true } } },
          orderBy: { deliveryDate: 'asc' },
        }),

        // Recolecciones hoy (IN_PROGRESS)
        ctx.db.rental.findMany({
          where: {
            organizationId: orgId,
            status: 'IN_PROGRESS',
            pickupDate: { gte: startOfDay(now), lte: endOfDay(now) },
          },
          select: { id: true, eventName: true, pickupDate: true, client: { select: { name: true } } },
          orderBy: { pickupDate: 'asc' },
        }),

        // Completados sin cobrar
        ctx.db.rental.findMany({
          where: {
            organizationId: orgId,
            status: 'COMPLETED',
            paymentStatus: { not: 'PAID' },
          },
          select: { id: true, eventName: true, totalAmount: true, client: { select: { name: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),

        // Stock agotado
        ctx.db.inventoryItem.findMany({
          where: { organizationId: orgId, availableStock: 0, totalStock: { gt: 0 } },
          select: { id: true, name: true, category: true },
        }),

        // Stock crítico (disponible < 20% del total, no agotado)
        ctx.db.inventoryItem.findMany({
          where: { organizationId: orgId, totalStock: { gt: 0 }, availableStock: { gt: 0 } },
          select: { id: true, name: true, totalStock: true, availableStock: true },
        }),
      ]);

    const notifications: Notification[] = [];

    // ── Entregas próximas ──────────────────────────────────────────
    for (const r of deliveriesSoon) {
      const hoursLeft = Math.round(
        (new Date(r.deliveryDate).getTime() - now.getTime()) / 3_600_000
      );
      const label = hoursLeft <= 24 ? `en ${hoursLeft}h` : 'en 2 días';
      notifications.push({
        id: `delivery_${r.id}`,
        kind: 'delivery_soon',
        title: `Entrega ${label} — ${r.eventName}`,
        description: `Cliente: ${r.client.name}`,
        href: `/eventos/${r.id}`,
        urgency: hoursLeft <= 24 ? 'high' : 'medium',
      });
    }

    // ── Recolecciones hoy ─────────────────────────────────────────
    for (const r of pickupsToday) {
      notifications.push({
        id: `pickup_${r.id}`,
        kind: 'pickup_today',
        title: `Recoger hoy — ${r.eventName}`,
        description: `Cliente: ${r.client.name}`,
        href: `/eventos/${r.id}`,
        urgency: 'high',
      });
    }

    // ── Sin cobrar ────────────────────────────────────────────────
    for (const r of unpaidCompleted) {
      const amount = new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
      }).format(r.totalAmount);
      notifications.push({
        id: `unpaid_${r.id}`,
        kind: 'unpaid_completed',
        title: `Pago pendiente — ${r.eventName}`,
        description: `${r.client.name} · ${amount}`,
        href: `/eventos/${r.id}`,
        urgency: 'medium',
      });
    }

    // ── Stock agotado ─────────────────────────────────────────────
    for (const item of stockOut) {
      notifications.push({
        id: `stockout_${item.id}`,
        kind: 'stock_out',
        title: `Sin stock — ${item.name}`,
        description: 'Disponibilidad: 0 unidades',
        href: `/inventory/${item.id}`,
        urgency: 'high',
      });
    }

    // ── Stock crítico ────────────────────────────────────────────
    for (const item of stockLow) {
      const ratio = item.availableStock / item.totalStock;
      if (ratio < 0.2) {
        notifications.push({
          id: `stocklow_${item.id}`,
          kind: 'stock_low',
          title: `Stock bajo — ${item.name}`,
          description: `${item.availableStock} de ${item.totalStock} disponibles`,
          href: `/inventory/${item.id}`,
          urgency: 'low',
        });
      }
    }

    // Orden: high → medium → low
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => order[a.urgency] - order[b.urgency]);

    return notifications;
  }),
});
