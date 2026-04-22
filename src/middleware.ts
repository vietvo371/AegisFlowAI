import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Chỉ protect dashboard — citizen/team tự handle auth trong layout
const protectedPaths = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('aegisflow_token')?.value;

  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
