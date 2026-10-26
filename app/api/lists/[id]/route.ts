import { NextResponse } from 'next/server';
import { notFound, parseId, readBody, withUser } from '@/lib/http';
import { deleteList, getList, updateList } from '@/lib/lists';
import { listPatch } from '@/lib/validate';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser<Ctx>(async (_req, { params, user }) => {
  const list = await getList(user.id, parseId((await params).id));
  if (!list) throw notFound('리스트를 찾을 수 없어요.');
  return NextResponse.json({ list });
});

/** 제목·상황·이모지·날짜·메모 수정 (보낸 필드만) */
export const PATCH = withUser<Ctx>(async (req, { params, user }) => {
  const id = parseId((await params).id);
  const patch = listPatch(await readBody(req));
  if (!(await updateList(user.id, id, patch))) throw notFound('리스트를 찾을 수 없어요.');
  return NextResponse.json({ list: await getList(user.id, id) });
});

export const DELETE = withUser<Ctx>(async (_req, { params, user }) => {
  if (!(await deleteList(user.id, parseId((await params).id)))) throw notFound('리스트를 찾을 수 없어요.');
  return NextResponse.json({ ok: true });
});
