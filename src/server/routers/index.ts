import { createTRPCRouter } from '../trpc';
import { rentalRouter } from './rental';
import { inventoryRouter } from './inventory';
import { clientRouter } from './client';
import { dashboardRouter } from './dashboard';
import { paymentRouter } from './payment';

/**
 * Root tRPC Router
 * Combina todos los sub-routers
 */
export const appRouter = createTRPCRouter({
  rental: rentalRouter,
  inventory: inventoryRouter,
  clients: clientRouter,
  dashboard: dashboardRouter,
  payment: paymentRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
