import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { db } from '@/lib/db';
import { auth } from '@/auth';

/**
 * Contexto de tRPC - Contiene sesión y base de datos
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await auth();

  return {
    db,
    session,
    headers: opts.req.headers,
  };
};

/**
 * Inicialización de tRPC
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause?.name === 'ZodError' ? error.cause : null,
      },
    };
  },
});

/**
 * Router y procedimientos públicos
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware de autenticación
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // Infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Procedimiento protegido (requiere autenticación)
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
