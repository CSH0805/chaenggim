import { jsonError, run } from '@/lib/http';
import { loginResponse } from '@/lib/login-response';
import { DEMO_EMAIL, findUserByEmail } from '@/lib/users';

export const runtime = 'nodejs';

/** 「체험 계정으로 둘러보기」: 비밀번호 입력 없이 데모 계정으로 로그인 */
export function POST() {
  return run(async () => {
    const user = await findUserByEmail(DEMO_EMAIL);
    if (!user) return jsonError('체험 계정이 아직 준비되지 않았어요. (npm run db:seed 필요)', 503);
    return loginResponse({ id: user.id, nickname: user.nickname });
  });
}
