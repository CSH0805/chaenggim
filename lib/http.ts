import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import type { SessionUser } from './session';

/** 입력값이 잘못됐을 때 던지는 오류 → 400 응답 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message = '찾을 수 없어요.') => new HttpError(404, message);

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type Handler<C> = (req: Request, ctx: C & { user: SessionUser }) => Promise<Response>;

/**
 * 로그인이 필요한 API 라우트를 감싼다.
 * - 로그인 안 했으면 401
 * - HttpError 는 해당 상태 코드로, 그 밖의 오류는 500 으로 { error } JSON 응답
 */
export function withUser<C extends object>(handler: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요해요.', 401);
    return run(() => handler(req, { ...ctx, user }));
  };
}

/** 로그인이 필요 없는 라우트(회원가입·로그인)용 오류 처리 */
export async function run(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.message, err.status);
    console.error(err);
    return jsonError('서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.', 500);
  }
}

/** 요청 본문 JSON 을 객체로 읽는다 (형식이 틀리면 400) */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  } catch {
    /* 아래에서 처리 */
  }
  throw badRequest('요청 형식이 올바르지 않아요.');
}

/** URL 의 [id] 를 양의 정수로 변환 (아니면 404) */
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw notFound();
  return id;
}
