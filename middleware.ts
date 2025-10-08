import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permettre l'accès à la page de login sans authentification
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // Vérifier si l'utilisateur est authentifié
  const session = request.cookies.get('auth-session')

  if (!session) {
    // Rediriger vers la page de login si non authentifié
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
