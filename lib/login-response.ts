import 'server-only';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions, signSession, type SessionUser } from './session';

/** 로그인 성공 응답: JWT 를 httpOnly 쿠키에 담아 보낸다 */
export async function loginResponse(user: SessionUser, status = 200) {
  const token = await signSession(user);
  const res = NextResponse.json({ user: { id: user.id, nickname: user.nickname } }, { status });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
