import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Định nghĩa các paths cần bảo vệ
const protectedPaths = ['/dashboard'];
const publicPaths = ['/signin', '/signup', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ cookies (aegisflow_token) - ở client side chúng ta có thể đang lưu localStorage,
  // nhưng nếu muốn thao tác ở middleware SSR thì Cookie là ưu tiên. Tạm thời Nextjs cookies() hook sẽ được dùng nếu lưu JWT.
  // Do frontend dùng localStorage 'aegisflow_token', Middleware có thể không đọc trực tiếp được LocalStorage. 
  // Cách chuẩn là frontend (auth context) thiết lập token vào cả cookie. Hoặc chuyển hướng nếu page load client auth.
  // Tuy nhiên, Next.js Middleware chỉ có thể đọc header/cookie.
  const token = request.cookies.get('aegisflow_token')?.value;

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Nếu truy cập protected page mà không có token -> Redirect về /signin
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Nếu truy cập trang công cộng khi đã có token -> Redirect vào /dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các route API, dashboard, auth paths
export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/signup', '/reset-password'],
};
