import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcPaymentStatus(totalAmount: number, totalPaid: number): string {
    if (totalPaid <= 0) return 'UNPAID';
    if (totalPaid >= totalAmount) return 'PAID';
    return 'PARTIAL';
}


export const paymentRouter = createTRPCRouter({
    /**
     * Obtener todos los pagos de un rental.
     */
    getByRental: protectedProcedure
        .input(z.object({ rentalId: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.session.user.id },
                select: { organizationId: true },
            });
            if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

            // Verificar que el rental pertenece a la organización
            const rental = await ctx.db.rental.findFirst({
                where: { id: input.rentalId, organizationId: user.organizationId },
                select: { id: true, totalAmount: true, paymentStatus: true },
            });
            if (!rental) throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });

            const payments = await ctx.db.payment.findMany({
                where: { rentalId: input.rentalId },
                orderBy: { createdAt: 'asc' },
            });

            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const pending = rental.totalAmount - totalPaid;

            return {
                payments,
                totalPaid,
                totalAmount: rental.totalAmount,
                pending,
                paymentStatus: rental.paymentStatus,
            };
        }),

    /**
     * Registrar un abono/pago.
     * Actualiza automáticamente paymentStatus en el Rental.
     */
    create: protectedProcedure
        .input(
            z.object({
                rentalId: z.string(),
                amount: z.number().positive(),
                method: z.enum(['CASH', 'TRANSFER', 'CARD', 'CHECK', 'OTHER']).default('CASH'),
                notes: z.string().optional(),
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
                    where: { id: input.rentalId, organizationId: user.organizationId },
                    select: { id: true, totalAmount: true },
                });
                if (!rental) throw new TRPCError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });

                // Crear el pago
                const payment = await tx.payment.create({
                    data: {
                        rentalId: input.rentalId,
                        amount: input.amount,
                        method: input.method,
                        notes: input.notes,
                    },
                });

                // Recalcular totalPaid y paymentStatus
                const allPayments = await tx.payment.findMany({
                    where: { rentalId: input.rentalId },
                    select: { amount: true },
                });
                const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

                await tx.rental.update({
                    where: { id: input.rentalId },
                    data: { paymentStatus: calcPaymentStatus(rental.totalAmount, totalPaid) },
                });

                return payment;
            });
        }),

    /**
     * Eliminar un pago y recalcular paymentStatus.
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: { id: ctx.session.user.id },
                select: { organizationId: true },
            });
            if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

            return ctx.db.$transaction(async (tx) => {
                // Verificar que el pago pertenece a un rental de esta organización
                const payment = await tx.payment.findFirst({
                    where: { id: input.id },
                    include: { rental: { select: { id: true, organizationId: true, totalAmount: true } } },
                });
                if (!payment || payment.rental.organizationId !== user.organizationId) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Pago no encontrado' });
                }

                await tx.payment.delete({ where: { id: input.id } });

                // Recalcular
                const remaining = await tx.payment.findMany({
                    where: { rentalId: payment.rentalId },
                    select: { amount: true },
                });
                const totalPaid = remaining.reduce((sum, p) => sum + p.amount, 0);

                await tx.rental.update({
                    where: { id: payment.rentalId },
                    data: { paymentStatus: calcPaymentStatus(payment.rental.totalAmount, totalPaid) },
                });

                return { success: true };
            });
        }),
});
