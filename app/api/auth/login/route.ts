import { jsonError, readBody, run } from '@/lib/http';
import { loginResponse } from '@/lib/login-response';
import { verifyLogin } from '@/lib/users';
import { text } from '@/lib/validate';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return run(async () => {
    const body = await readBody(req);
    const email = text(body, 'email', '이메일', 255, true)!;
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) return jsonError('비밀번호를 입력해 주세요.', 400);

    const user = await verifyLogin(email, password);
    if (!user) return jsonError('이메일 또는 비밀번호가 맞지 않아요.', 401);
    return loginResponse(user);
  });
}
