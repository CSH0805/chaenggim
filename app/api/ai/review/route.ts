import { NextResponse } from 'next/server';
import { saveAiLog } from '@/lib/ai-logs';
import { AI_REST_MESSAGE } from '@/lib/constants';
import { AiUnavailableError, reviewChecklist } from '@/lib/gemini';
import { jsonError, notFound, parseId, readBody, withUser } from '@/lib/http';
import { getList } from '@/lib/lists';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** POST /api/ai/review { listId } → { missing: [...], tip } */
export const POST = withUser(async (req, { user }) => {
  const body = await readBody(req);
  const list = await getList(user.id, parseId(String(body.listId)));
  if (!list) throw notFound('리스트를 찾을 수 없어요.');

  try {
    const review = await reviewChecklist({
      situation: list.situation,
      title: list.title,
      memo: list.memo,
      items: list.items.map((i) => i.name),
    });
    await saveAiLog(user.id, 'review', review, list.id);
    return NextResponse.json({ review });
  } catch (err) {
    if (err instanceof AiUnavailableError) return jsonError(AI_REST_MESSAGE, 503);
    throw err;
  }
});
