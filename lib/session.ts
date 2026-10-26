import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { env } from './env';

// proxy.ts 와 서버 코드가 함께 쓰는 JWT 세션 유틸 (DB 조회 없음)

export const SESSION_COOKIE = 'ck_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export interface SessionUser {
  id: number;
  nickname: string;
}

function secretKey() {
  const secret = env('SESSION_SECRET');
  if (secret.length < 32) throw new Error('SESSION_SECRET 은 32자 이상이어야 해요.');
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ nickname: user.nickname })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || id <= 0) return null;
    return { id, nickname: String(payload.nickname ?? '') };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}
