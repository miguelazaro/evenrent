import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const settingsRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            timezone: true,
            currency: true,
            maxUsers: true,
            maxStorage: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new Error('User not found');
    return user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { name: input.name },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  updateOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        timezone: z.string(),
        currency: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true, role: true },
      });
      if (!user) throw new Error('User not found');

      return ctx.db.organization.update({
        where: { id: user.organizationId },
        data: {
          name: input.name,
          timezone: input.timezone,
          currency: input.currency,
        },
        select: { id: true, name: true, timezone: true, currency: true },
      });
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true },
      });
      if (!user) throw new Error('User not found');

      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) throw new Error('La contraseña actual es incorrecta');

      const hashed = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashed },
      });

      return { ok: true };
    }),

  // ── Gestión de equipo ──────────────────────────────────────────────────────

  getTeamMembers: protectedProcedure.query(async ({ ctx }) => {
    const me = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!me) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return ctx.db.user.findMany({
      where: { organizationId: me.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });
  }),

  inviteUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const me = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true, role: true },
      });
      if (!me) throw new TRPCError({ code: 'UNAUTHORIZED' });
      if (!['OWNER', 'ADMIN'].includes(me.role))
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo propietarios y administradores pueden invitar usuarios' });

      // Verificar límite del plan
      const org = await ctx.db.organization.findUnique({
        where: { id: me.organizationId },
        select: { maxUsers: true, _count: { select: { users: true } } },
      });
      if (org && org._count.users >= org.maxUsers)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Tu plan permite máximo ${org.maxUsers} usuarios. Actualiza tu plan para añadir más.`,
        });

      const existing = await ctx.db.user.findUnique({
        where: { organizationId_email: { organizationId: me.organizationId, email: input.email } },
      });
      if (existing)
        throw new TRPCError({ code: 'CONFLICT', message: 'Ya existe un usuario con ese correo en tu organización' });

      const hashed = await bcrypt.hash(input.password, 12);

      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          password: hashed,
          organizationId: me.organizationId,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const me = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true, role: true },
      });
      if (!me) throw new TRPCError({ code: 'UNAUTHORIZED' });
      if (!['OWNER', 'ADMIN'].includes(me.role))
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes permiso para cambiar roles' });
      if (input.userId === ctx.session.user.id)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes cambiar tu propio rol' });

      return ctx.db.user.update({
        where: { id: input.userId, organizationId: me.organizationId },
        data: { role: input.role },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    }),

  removeMember: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const me = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { organizationId: true, role: true },
      });
      if (!me) throw new TRPCError({ code: 'UNAUTHORIZED' });
      if (!['OWNER', 'ADMIN'].includes(me.role))
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes permiso para eliminar usuarios' });
      if (input.userId === ctx.session.user.id)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes eliminarte a ti mismo' });

      const target = await ctx.db.user.findUnique({
        where: { id: input.userId, organizationId: me.organizationId },
        select: { role: true },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });
      if (target.role === 'OWNER')
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No se puede eliminar al propietario' });

      await ctx.db.user.delete({ where: { id: input.userId } });
      return { ok: true };
    }),
});
