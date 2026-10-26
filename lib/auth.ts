import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession, type SessionUser } from './session';

/** 쿠키의 JWT 로 현재 사용자를 확인한다. 없으면 null */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** 페이지(서버 컴포넌트)용: 로그인하지 않았으면 /login 으로 보낸다 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
