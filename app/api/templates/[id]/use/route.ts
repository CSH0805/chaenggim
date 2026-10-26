import { NextResponse } from 'next/server';
import { notFound, parseId, withUser } from '@/lib/http';
import { createFromTemplate } from '@/lib/lists';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** 「이걸로 새 리스트」: 템플릿을 INSERT ... SELECT 로 복제 (체크는 모두 해제) */
export const POST = withUser<Ctx>(async (_req, { params, user }) => {
  const id = await createFromTemplate(user.id, parseId((await params).id));
  if (!id) throw notFound('템플릿을 찾을 수 없어요.');
  return NextResponse.json({ id }, { status: 201 });
});
