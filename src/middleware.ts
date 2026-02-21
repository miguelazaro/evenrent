import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Rutas públicas
  const publicRoutes = ['/login', '/register', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/login', req.url));
  }
});

// Configurar qué rutas usan el middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
