import { NextResponse } from 'next/server';
import { saveAiLog } from '@/lib/ai-logs';
import { AI_REST_MESSAGE, COMPANIONS, DURATIONS, LIMITS, WEATHERS } from '@/lib/constants';
import { AiUnavailableError, generateChecklist } from '@/lib/gemini';
import { badRequest, jsonError, readBody, withUser } from '@/lib/http';
import { isSituation, text } from '@/lib/validate';

export const runtime = 'nodejs';
export const maxDuration = 30;

function pick<T extends readonly string[]>(value: unknown, options: T, label: string): T[number] {
  if (typeof value === 'string' && options.includes(value)) return value;
  throw badRequest(`${label}을(를) 골라 주세요.`);
}

/**
 * POST /api/ai/generate { situation, duration, companion, weather, place? }
 * 미리보기용 체크리스트만 돌려준다. (저장은 사용자가 확인한 뒤 POST /api/lists 로)
 */
export const POST = withUser(async (req, { user }) => {
  const body = await readBody(req);
  if (!isSituation(body.situation)) throw badRequest('상황을 골라 주세요.');
  const input = {
    situation: body.situation,
    duration: pick(body.duration, DURATIONS, '기간'),
    companion: pick(body.companion, COMPANIONS, '동행'),
    weather: pick(body.weather, WEATHERS, '날씨'),
    place: text(body, 'place', '장소', LIMITS.place),
  };

  try {
    const preview = await generateChecklist(input);
    const logId = await saveAiLog(user.id, 'generate', { input, preview });
    return NextResponse.json({ preview, logId });
  } catch (err) {
    if (err instanceof AiUnavailableError) return jsonError(AI_REST_MESSAGE, 503);
    throw err;
  }
});
