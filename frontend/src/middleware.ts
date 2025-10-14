// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt_cookies_auth_token')?.value

  console.log("All cookies:", request.cookies);


  console.log("middleware token"+ token);

  const { pathname } = request.nextUrl

  console.log("middleware request.nextUrl..."+ request.nextUrl);

  // 1. No token => Block access to protected routes
  if (!token) {
    const isProtectedRoute = pathname.startsWith('/') && pathname !== '/login' && pathname !== '/register'

    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 2. Has token => Prevent access to /login or /register
  if (token && (pathname === '/login' || pathname === '/register')) {   // if token is truthy leftside and right is truthy will be true
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}


export const config = {
  matcher: [
    '/',                // home page
    '/login',           // login page
    '/register',        // optional
    '/dashboard/:path*', // example protected route
    '/profile/:path*',
  ],
}
