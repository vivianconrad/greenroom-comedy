import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard']
const PUBLIC_PATHS = ['/', '/login', '/signup']
const PUBLIC_PREFIXES = ['/apply', '/form']

export async function proxy(request) {
  const { supabase, response } = await createClient(request)

  // Refresh the session — must be called before any redirects.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
