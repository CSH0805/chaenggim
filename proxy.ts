import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

// 로그인 확인용 Proxy (Next.js 16 의 middleware). DB 는 조회하지 않고 쿠키의 JWT 만 검증한다.
// 실제 데이터 접근 권한은 각 API·페이지에서 user_id 조건으로 한 번 더 확인한다.

const PUBLIC_PAGES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth/') || user) return NextResponse.next();
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
  }

  const isPublic = PUBLIC_PAGES.includes(pathname);
  if (!user && !isPublic) return NextResponse.redirect(new URL('/login', request.url));
  if (user && isPublic) return NextResponse.redirect(new URL('/', request.url));
  return NextResponse.next();
}

export const config = {
  // 정적 파일·이미지·파비콘은 검사하지 않는다
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
