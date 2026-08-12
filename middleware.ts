import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password'];

// Define protected routes that require authentication
// NOTE: '/register' (Add Admin) is intentionally protected, not public — it
// grants a full Admin account, and the backend does not enforce auth on
// POST /api/V1/Auth/add-admin itself (confirmed live 2026-08-11), so the
// frontend route gate is the only defense against a logged-in-but-unprivileged
// user reaching it. See DEFAULT_RESTRICTED_PAGES in pagePermissions.config.ts
// for the role-level (admin-only) restriction on top of this session gate.
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/settings',
  '/branch',
  '/customers',
  '/followup',
  '/contracts',
  '/agents',
  '/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like .js, .css, .png, etc.
  ) {
    return NextResponse.next();
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Get the refresh token from cookies. NOTE: despite this comment's original
  // claim, this is NOT an HttpOnly cookie — it's written client-side via
  // `document.cookie` in auth.service.ts's login()/logout(), so it is
  // readable/settable by any JS on the page. This edge check is a UX
  // convenience (fast redirect for the common case), not a real security
  // boundary — actual authorization happens per-request via the bearer token
  // the backend validates. Don't rely on this gate alone for anything sensitive.
  const refreshToken = request.cookies.get('refreshToken')?.value;

  console.log(
    `[Middleware] Path: ${pathname}, RefreshToken: ${refreshToken ? 'EXISTS' : 'NONE'}, Protected: ${isProtectedRoute}`
  );

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !refreshToken) {
    console.log(`[Middleware] Redirecting to login - no refresh token`);
    const loginUrl = new URL('/login', request.url);

    // Append the original path as a redirect parameter
    loginUrl.searchParams.set('redirect', encodeURIComponent(pathname));

    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from public routes (like login page)
  if (isPublicRoute && refreshToken && pathname === '/login') {
    console.log(`[Middleware] Redirecting to dashboard - already authenticated`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$).*)',
  ],
};
