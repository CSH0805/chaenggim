import 'server-only';
import type { ResultSetHeader } from 'mysql2/promise';
import { execute, query, withTransaction } from './db';
import { todaySeoul } from './date';
import type { Item, ListDetail, ListSummary, NewItemInput } from './types';
import type { ListFields } from './validate';

// 모든 쿼리는 WHERE user_id = ? 로 로그인한 사용자의 데이터만 다룬다.

/**
 * 홈 화면 카드 목록. 항목 수/체크 수를 LEFT JOIN + COUNT/SUM 으로 함께 계산한다.
 * 정렬: 오늘 이후 일정(가까운 순) → 날짜 없음(최근 수정 순) → 지난 일정(최근 순)
 */
export async function getLists(userId: number, template: boolean): Promise<ListSummary[]> {
  const today = todaySeoul();
  const rows = await query<ListSummary>(
    `SELECT l.id, l.title, l.situation, l.emoji, l.event_date, l.memo, l.is_template, l.updated_at,
            COUNT(i.id) AS total,
            COALESCE(SUM(i.is_checked), 0) AS checked
       FROM ck_lists l
       LEFT JOIN ck_items i ON i.list_id = l.id
      WHERE l.user_id = ? AND l.is_template = ?
      GROUP BY l.id, l.title, l.situation, l.emoji, l.event_date, l.memo, l.is_template, l.updated_at
      ORDER BY CASE WHEN l.event_date >= ? THEN 0 WHEN l.event_date IS NULL THEN 1 ELSE 2 END,
               CASE WHEN l.event_date >= ? THEN l.event_date END ASC,
               l.event_date DESC,
               l.updated_at DESC`,
    [userId, template ? 1 : 0, today, today],
  );
  // SUM 결과는 드라이버에서 문자열로 올 수 있어 숫자로 맞춘다
  return rows.map((r) => ({ ...r, total: Number(r.total), checked: Number(r.checked) }));
}

export async function getList(userId: number, listId: number): Promise<ListDetail | null> {
  const lists = await query<Omit<ListDetail, 'items'>>(
    `SELECT id, title, situation, emoji, event_date, memo, is_template, updated_at
       FROM ck_lists
      WHERE id = ? AND user_id = ?`,
    [listId, userId],
  );
  if (!lists[0]) return null;
  const items = await query<Item>(
    `SELECT id, list_id, name, category, quantity, is_checked, is_ai, ai_reason, sort_order
       FROM ck_items
      WHERE list_id = ? AND user_id = ?
      ORDER BY sort_order, id`,
    [listId, userId],
  );
  return { ...lists[0], items };
}

/** 리스트 + 항목을 한 트랜잭션으로 저장. AI 로 만든 경우 생성 로그에 list_id 를 연결한다. */
export async function createList(
  userId: number,
  fields: ListFields,
  items: NewItemInput[],
  aiLogId: number | null = null,
): Promise<number> {
  return withTransaction(async (conn) => {
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO ck_lists (user_id, title, situation, emoji, event_date, memo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, fields.title, fields.situation, fields.emoji, fields.event_date, fields.memo],
    );
    const listId = result.insertId;

    if (items.length > 0) {
      const rows = items.map((it, i) => [
        listId, userId, it.name, it.category, it.quantity, it.is_ai ? 1 : 0, it.ai_reason ?? null, i + 1,
      ]);
      // VALUES ? 에 2차원 배열을 넘기면 mysql2 가 (?, ?, ...), (...) 로 안전하게 펼친다
      await conn.query(
        `INSERT INTO ck_items (list_id, user_id, name, category, quantity, is_ai, ai_reason, sort_order)
         VALUES ?`,
        [rows],
      );
    }

    if (aiLogId) {
      await conn.query(
        'UPDATE ck_ai_logs SET list_id = ? WHERE id = ? AND user_id = ? AND list_id IS NULL',
        [listId, aiLogId, userId],
      );
    }
    return listId;
  });
}

export async function updateList(userId: number, listId: number, patch: Partial<ListFields>) {
  // 컬럼 이름은 아래 고정 목록에서만 가져오고, 값은 모두 ? 로 넘긴다
  const allowed = ['title', 'situation', 'emoji', 'event_date', 'memo'] as const;
  const cols = allowed.filter((c) => c in patch);
  const result = await execute(
    `UPDATE ck_lists SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
    [...cols.map((c) => patch[c] ?? null), listId, userId],
  );
  return result.affectedRows > 0;
}

export async function deleteList(userId: number, listId: number) {
  // ck_items 는 FK ON DELETE CASCADE 로 함께 지워진다
  const result = await execute('DELETE FROM ck_lists WHERE id = ? AND user_id = ?', [listId, userId]);
  return result.affectedRows > 0;
}

/** 「모두 체크 해제」 */
export async function resetChecks(userId: number, listId: number) {
  const result = await execute(
    'UPDATE ck_items SET is_checked = 0 WHERE list_id = ? AND user_id = ?',
    [listId, userId],
  );
  return result.affectedRows;
}

/** 리스트를 복제한다. INSERT ... SELECT 로 리스트와 항목을 한 트랜잭션에서 복사(체크는 해제). */
async function copyList(userId: number, sourceId: number, toTemplate: boolean, onlyFromTemplate: boolean) {
  return withTransaction(async (conn) => {
    const [listResult] = await conn.query<ResultSetHeader>(
      `INSERT INTO ck_lists (user_id, title, situation, emoji, event_date, memo, is_template)
       SELECT user_id, title, situation, emoji, NULL, memo, ?
         FROM ck_lists
        WHERE id = ? AND user_id = ? ${onlyFromTemplate ? 'AND is_template = 1' : ''}`,
      [toTemplate ? 1 : 0, sourceId, userId],
    );
    if (listResult.affectedRows === 0) return null;
    const newId = listResult.insertId;

    await conn.query(
      `INSERT INTO ck_items (list_id, user_id, name, category, quantity, is_checked, is_ai, ai_reason, sort_order)
       SELECT ?, user_id, name, category, quantity, 0, is_ai, ai_reason, sort_order
         FROM ck_items
        WHERE list_id = ? AND user_id = ?
        ORDER BY sort_order, id`,
      [newId, sourceId, userId],
    );
    return newId;
  });
}

/** 리스트 상세의 「템플릿으로 저장」 → is_template = 1 복사본 */
export const saveAsTemplate = (userId: number, listId: number) => copyList(userId, listId, true, false);

/** 템플릿의 「이걸로 새 리스트」 → is_template = 0 복사본 */
export const createFromTemplate = (userId: number, templateId: number) =>
  copyList(userId, templateId, false, true);
