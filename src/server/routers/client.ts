import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const clientRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const clients = await ctx.db.client.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    });

    return clients;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
        city: z.string(),
        address: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const client = await ctx.db.client.create({
        data: {
          ...input,
          organizationId: user.organizationId,
          userId: ctx.session.user.id,
        },
      });

      return client;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new Error('User not found');

      return ctx.db.client.update({
        where: { id, organizationId: user.organizationId },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new Error('User not found');

      return ctx.db.client.delete({
        where: { id: input.id, organizationId: user.organizationId },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new Error('User not found');

      return ctx.db.client.findUniqueOrThrow({
        where: { id: input.id, organizationId: user.organizationId },
        include: {
          rentals: {
            orderBy: { deliveryDate: 'desc' },
            select: {
              id: true,
              eventName: true,
              eventType: true,
              status: true,
              paymentStatus: true,
              deliveryDate: true,
              pickupDate: true,
              totalAmount: true,
              items: { select: { quantity: true } },
            },
          },
        },
      });
    }),
});
