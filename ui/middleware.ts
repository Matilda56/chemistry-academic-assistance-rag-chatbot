import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const prefix = '/proxy/3000';
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(prefix)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(prefix.length) || '/';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/proxy/3000/:path*'],
};
