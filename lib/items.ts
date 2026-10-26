import 'server-only';
import { execute, query } from './db';
import type { Item, NewItemInput } from './types';
import type { ItemPatch } from './validate';

const ITEM_COLUMNS = 'id, list_id, name, category, quantity, is_checked, is_ai, ai_reason, sort_order';

async function getItem(userId: number, itemId: number): Promise<Item | null> {
  const rows = await query<Item>(`SELECT ${ITEM_COLUMNS} FROM ck_items WHERE id = ? AND user_id = ?`, [
    itemId,
    userId,
  ]);
  return rows[0] ?? null;
}

/** 항목 추가. 내 리스트가 아니면 아무것도 넣지 않고 null */
export async function addItem(userId: number, listId: number, input: NewItemInput): Promise<Item | null> {
  // 리스트 소유자 확인과 다음 sort_order 계산을 INSERT ... SELECT 한 문장으로 처리
  const result = await execute(
    `INSERT INTO ck_items (list_id, user_id, name, category, quantity, is_ai, ai_reason, sort_order)
     SELECT l.id, l.user_id, ?, ?, ?, ?, ?,
            (SELECT COALESCE(MAX(i.sort_order), 0) + 1 FROM ck_items i WHERE i.list_id = l.id)
       FROM ck_lists l
      WHERE l.id = ? AND l.user_id = ?`,
    [input.name, input.category, input.quantity, input.is_ai ? 1 : 0, input.ai_reason ?? null, listId, userId],
  );
  if (result.affectedRows === 0) return null;
  return getItem(userId, result.insertId);
}

export async function updateItem(userId: number, itemId: number, patch: ItemPatch): Promise<Item | null> {
  // 컬럼 이름은 고정 목록에서만, 값은 ? 로
  const allowed = ['name', 'category', 'quantity', 'is_checked'] as const;
  const cols = allowed.filter((c) => c in patch);
  const result = await execute(
    `UPDATE ck_items SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
    [...cols.map((c) => patch[c] ?? null), itemId, userId],
  );
  if (result.affectedRows === 0) return null;
  return getItem(userId, itemId);
}

export async function deleteItem(userId: number, itemId: number) {
  const result = await execute('DELETE FROM ck_items WHERE id = ? AND user_id = ?', [itemId, userId]);
  return result.affectedRows > 0;
}
