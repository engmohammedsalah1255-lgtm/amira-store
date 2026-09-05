import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api')) {
    const referer = req.headers.get('referer') || '';
    const localeMatch = referer.match(/\/(ar|en)(?:\/|$)/);
    const locale = localeMatch?.[1] === 'en' ? 'en' : 'ar';

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-locale', locale);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\..*).*)'],
};
