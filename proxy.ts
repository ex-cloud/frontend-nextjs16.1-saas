import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Halaman yang memerlukan authentication
const protectedPaths = [
  '/dashboard',
]

// Halaman yang hanya bisa diakses jika BELUM login
const authPaths = [
  '/login',
  '/register',
  '/login/otp',
]

export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // Cek apakah path adalah protected path (dashboard dan turunannya)
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  // Cek apakah path adalah auth path (login/register)
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  // Jika mengakses protected path tapi belum login
  if (isProtectedPath && !token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Jika sudah login tapi mengakses auth path, redirect ke dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Konfigurasi path mana saja yang akan diproses middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|assets|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}
