import { NextResponse } from 'next/server';
import { notFound, parseId, readBody, withUser } from '@/lib/http';
import { deleteItem, updateItem } from '@/lib/items';
import { itemPatch } from '@/lib/validate';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** 이름·카테고리·수량 수정, 체크 토글({ is_checked: true|false }) */
export const PATCH = withUser<Ctx>(async (req, { params, user }) => {
  const item = await updateItem(user.id, parseId((await params).id), itemPatch(await readBody(req)));
  if (!item) throw notFound('항목을 찾을 수 없어요.');
  return NextResponse.json({ item });
});

export const DELETE = withUser<Ctx>(async (_req, { params, user }) => {
  if (!(await deleteItem(user.id, parseId((await params).id)))) throw notFound('항목을 찾을 수 없어요.');
  return NextResponse.json({ ok: true });
});
