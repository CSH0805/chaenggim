import 'server-only';
import { execute } from './db';

/** AI 응답(검증을 거친 결과)을 ck_ai_logs 에 남긴다 */
export async function saveAiLog(
  userId: number,
  kind: 'generate' | 'review',
  response: unknown,
  listId: number | null = null,
) {
  const result = await execute(
    'INSERT INTO ck_ai_logs (user_id, list_id, kind, response_json) VALUES (?, ?, ?, ?)',
    [userId, listId, kind, JSON.stringify(response)],
  );
  return result.insertId;
}
