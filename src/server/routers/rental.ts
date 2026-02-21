import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { createTRPCRouter, protectedProcedure } from '../trpc';

//  Schemas 

const rentalItemInputSchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  notes: z.string().optional(),
});

const RENTAL_STATUS = z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
type RentalStatus = z.infer<typeof RENTAL_STATUS>;

/** Statuses that actively consume inventory stock */
const STOCK_CONSUMING_STATUSES: RentalStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
];

//  Helpers 

type ItemInput = { inventoryItemId: string; quantity: number };
type PrismaTx = Omit<Prisma.TransactionClient, '$transaction' | '$disconnect' | '$connect' | '$use' | '$on' | '$extends'>;

async function deductStock(tx: PrismaTx, items: ItemInput[]): Promise<void> {
  for (const item of items) {
    const inv = await tx.inventoryItem.findUnique({
      where: { id: item.inventoryItemId },
      select: { name: true, availableStock: true },
    });
    if (!inv) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Artículo de inventario no encontrado (${item.inventoryItemId})`,
      });
    }
    if (inv.availableStock < item.quantity) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Stock insuficiente para "${inv.name}". Disponible: ${inv.availableStock}, solicitado: ${item.quantity}.`,
      });
    }
    await tx.inventoryItem.update({
      where: { id: item.inventoryItemId },
      data: { availableStock: { decrement: item.quantity } },
    });
  }
}

async function restoreStock(tx: PrismaTx, items: ItemInput[]): Promise<void> {
  for (const item of items) {
    await tx.inventoryItem.update({
      where: { id: item.inventoryItemId },
      data: { availableStock: { increment: item.quantity } },
    });
  }
}

//  Router 

export const rentalRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const rentals = await ctx.db.rental.findMany({
        where: { organizationId: user.organizationId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { deliveryDate: 'asc' },
        include: {
          client: true,
          items: { include: { inventoryItem: true } },
        },
      });
      let nextCursor: typeof input.cursor | undefined;
      if (rentals.length > input.limit) {
        nextCursor = rentals.pop()?.id;
      }
      return { rentals, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const rental = await ctx.db.rental.findFirst({
        where: { id: input.id, organizationId: user.organizationId },
        include: {
          client: true,
          items: { include: { inventoryItem: true } },
        },
      });
      if (!rental) throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
      return rental;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        eventType: z.string(),
        eventName: z.string(),
        deliveryDate: z.date(),
        pickupDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(rentalItemInputSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const { items = [], ...rentalData } = input;
      const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      return ctx.db.$transaction(async (tx) => {
        if (items.length > 0) {
          await deductStock(tx, items);
        }
        return tx.rental.create({
          data: {
            ...rentalData,
            totalAmount,
            organizationId: user.organizationId,
            userId: ctx.session.user.id,
            items: items.length > 0
              ? {
                  create: items.map((item) => ({
                    inventoryItemId: item.inventoryItemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    notes: item.notes,
                  })),
                }
              : undefined,
          },
          include: {
            client: true,
            items: { include: { inventoryItem: true } },
          },
        });
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: RENTAL_STATUS,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return ctx.db.$transaction(async (tx) => {
        const rental = await tx.rental.findFirst({
          where: { id: input.id, organizationId: user.organizationId },
          include: { items: true },
        });
        if (!rental) throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
        const wasConsuming = STOCK_CONSUMING_STATUSES.includes(rental.status as RentalStatus);
        const willConsume = STOCK_CONSUMING_STATUSES.includes(input.status);
        if (wasConsuming && !willConsume) {
          await restoreStock(tx, rental.items);
        } else if (!wasConsuming && willConsume) {
          await deductStock(tx, rental.items);
        }
        return tx.rental.update({
          where: { id: input.id },
          data: { status: input.status },
        });
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        clientId: z.string().optional(),
        eventType: z.string().optional(),
        eventName: z.string().optional(),
        deliveryDate: z.date().optional(),
        pickupDate: z.date().optional(),
        notes: z.string().optional(),
        status: RENTAL_STATUS.optional(),
        items: z.array(rentalItemInputSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const { id, items, ...data } = input;
      return ctx.db.$transaction(async (tx) => {
        const existing = await tx.rental.findFirst({
          where: { id, organizationId: user.organizationId },
          include: { items: true },
        });
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
        const currentStatus = (data.status ?? existing.status) as RentalStatus;
        const wasConsuming = STOCK_CONSUMING_STATUSES.includes(existing.status as RentalStatus);
        const willConsume = STOCK_CONSUMING_STATUSES.includes(currentStatus);
        if (items !== undefined) {
          if (wasConsuming && existing.items.length > 0) {
            await restoreStock(tx, existing.items);
          }
          await tx.rentalItem.deleteMany({ where: { rentalId: id } });
          if (willConsume && items.length > 0) {
            await deductStock(tx, items);
          }
          const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
          return tx.rental.update({
            where: { id },
            data: {
              ...data,
              totalAmount,
              items: items.length > 0
                ? {
                    create: items.map((item) => ({
                      inventoryItemId: item.inventoryItemId,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      notes: item.notes,
                    })),
                  }
                : undefined,
            },
            include: {
              client: true,
              items: { include: { inventoryItem: true } },
            },
          });
        }
        if (data.status && data.status !== existing.status) {
          if (wasConsuming && !willConsume && existing.items.length > 0) {
            await restoreStock(tx, existing.items);
          } else if (!wasConsuming && willConsume && existing.items.length > 0) {
            await deductStock(tx, existing.items);
          }
        }
        return tx.rental.update({
          where: { id },
          data,
          include: {
            client: true,
            items: { include: { inventoryItem: true } },
          },
        });
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true },
      });
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return ctx.db.$transaction(async (tx) => {
        const rental = await tx.rental.findFirst({
          where: { id: input.id, organizationId: user.organizationId },
          include: { items: true },
        });
        if (!rental) throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
        if (
          STOCK_CONSUMING_STATUSES.includes(rental.status as RentalStatus) &&
          rental.items.length > 0
        ) {
          await restoreStock(tx, rental.items);
        }
        return tx.rental.delete({ where: { id: input.id } });
      });
    }),
});