import { NextResponse } from 'next/server';
import { notFound, parseId, readBody, withUser } from '@/lib/http';
import { addItem } from '@/lib/items';
import { newItem } from '@/lib/validate';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/lists/[id]/items { name, category, quantity, is_ai?, ai_reason? } */
export const POST = withUser<Ctx>(async (req, { params, user }) => {
  const listId = parseId((await params).id);
  const item = await addItem(user.id, listId, newItem(await readBody(req)));
  if (!item) throw notFound('리스트를 찾을 수 없어요.');
  return NextResponse.json({ item }, { status: 201 });
});
