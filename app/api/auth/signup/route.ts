import { LIMITS } from '@/lib/constants';
import { badRequest, jsonError, readBody, run } from '@/lib/http';
import { loginResponse } from '@/lib/login-response';
import { createUser } from '@/lib/users';
import { text } from '@/lib/validate';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return run(async () => {
    const body = await readBody(req);
    const email = text(body, 'email', '이메일', 255, true)!;
    const nickname = text(body, 'nickname', '닉네임', LIMITS.nickname, true)!;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest('이메일 형식이 올바르지 않아요.');
    if (password.length < 6) throw badRequest('비밀번호는 6자 이상이어야 해요.');
    if (password.length > 72) throw badRequest('비밀번호는 72자 이하로 입력해 주세요.');

    const user = await createUser(email, password, nickname);
    if (!user) return jsonError('이미 가입된 이메일이에요.', 409);
    return loginResponse(user, 201);
  });
}
