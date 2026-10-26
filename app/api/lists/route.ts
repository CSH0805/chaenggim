import { NextResponse } from 'next/server';
import { badRequest, readBody, withUser } from '@/lib/http';
import { createList, getLists } from '@/lib/lists';
import { listFields, newItem } from '@/lib/validate';

export const runtime = 'nodejs';

/** GET /api/lists?template=1 → 템플릿 목록, 없으면 진행 중 목록 */
export const GET = withUser(async (req, { user }) => {
  const template = new URL(req.url).searchParams.get('template') === '1';
  return NextResponse.json({ lists: await getLists(user.id, template) });
});

/** POST /api/lists { title, situation, emoji?, event_date?, memo?, items?: [...], aiLogId? } */
export const POST = withUser(async (req, { user }) => {
  const body = await readBody(req);
  const fields = listFields(body);

  const rawItems = body.items ?? [];
  if (!Array.isArray(rawItems)) throw badRequest('items 는 배열이어야 해요.');
  if (rawItems.length > 100) throw badRequest('항목은 한 번에 100개까지만 저장할 수 있어요.');
  const items = rawItems.map(newItem);

  const aiLogId = Number.isInteger(body.aiLogId) ? Number(body.aiLogId) : null;
  const id = await createList(user.id, fields, items, aiLogId);
  return NextResponse.json({ id }, { status: 201 });
});
