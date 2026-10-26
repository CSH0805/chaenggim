import { NextResponse } from 'next/server';
import { notFound, parseId, withUser } from '@/lib/http';
import { saveAsTemplate } from '@/lib/lists';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** 「템플릿으로 저장」: 리스트와 항목을 is_template = 1 로 복사 */
export const POST = withUser<Ctx>(async (_req, { params, user }) => {
  const id = await saveAsTemplate(user.id, parseId((await params).id));
  if (!id) throw notFound('리스트를 찾을 수 없어요.');
  return NextResponse.json({ id }, { status: 201 });
});
