import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const inventoryRouter = createTRPCRouter({
  /**
   * Obtener todos los items de inventario
   */
  getAll: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const items = await ctx.db.inventoryItem.findMany({
        where: {
          organizationId: user.organizationId,
          ...(input.category && { category: input.category }),
          ...(input.search && {
            OR: [
              { name: { contains: input.search, mode: 'insensitive' } },
              { sku: { contains: input.search, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: { name: 'asc' },
      });

      return items;
    }),

  /**
   * Crear un item de inventario
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        category: z.string(),
        sku: z.string(),
        description: z.string().optional(),
        unitCost: z.number(),
        rentalPrice: z.number(),
        totalStock: z.number(),
        location: z.string().default('Bodega General'),
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

      const item = await ctx.db.inventoryItem.create({
        data: {
          ...input,
          availableStock: input.totalStock,
          organizationId: user.organizationId,
          userId: ctx.session.user.id,
        },
      });

      return item;
    }),

  /**
   * Actualizar un item de inventario
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        sku: z.string().optional(),
        description: z.string().optional(),
        unitCost: z.number().optional(),
        rentalPrice: z.number().optional(),
        totalStock: z.number().optional(),
        availableStock: z.number().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const item = await ctx.db.inventoryItem.update({
        where: { id },
        data,
      });
      return item;
    }),

  /**
   * Eliminar un item de inventario
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.inventoryItem.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),
});
