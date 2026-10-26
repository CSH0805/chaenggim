import { NextResponse } from 'next/server';
import { parseId, withUser } from '@/lib/http';
import { resetChecks } from '@/lib/lists';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** 「모두 체크 해제」 */
export const POST = withUser<Ctx>(async (_req, { params, user }) => {
  const count = await resetChecks(user.id, parseId((await params).id));
  return NextResponse.json({ ok: true, count });
});
