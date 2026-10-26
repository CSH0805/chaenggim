import 'server-only';
import { query } from './db';
import type { Stats } from './types';
import type { Situation } from './constants';

/** 통계: 모두 SQL 집계(COUNT·SUM·GROUP BY)로 계산한다. 템플릿은 '진행 중' 통계에서 제외. */
export async function getStats(userId: number): Promise<Stats> {
  const [bySituation, [itemRow], [listRow], topItems] = await Promise.all([
    // 상황별 리스트 수
    query<{ situation: Situation; count: number }>(
      `SELECT situation, COUNT(*) AS count
         FROM ck_lists
        WHERE user_id = ? AND is_template = 0
        GROUP BY situation
        ORDER BY count DESC, situation`,
      [userId],
    ),
    // 전체 체크 완료율 + AI 가 만든 항목 수
    query<{ total: number; checked: number | null; ai: number | null }>(
      `SELECT COUNT(i.id) AS total, SUM(i.is_checked) AS checked, SUM(i.is_ai) AS ai
         FROM ck_items i
         JOIN ck_lists l ON l.id = i.list_id
        WHERE i.user_id = ? AND l.is_template = 0`,
      [userId],
    ),
    // 리스트 수 / 다 챙긴 리스트 수 / 템플릿 수 (리스트별 집계를 서브쿼리로 한 번 더 집계)
    query<{ total_lists: number; completed: number | null; templates: number | null }>(
      `SELECT SUM(t.is_template = 0) AS total_lists,
              SUM(t.is_template = 0 AND t.item_count > 0 AND t.item_count = t.checked_count) AS completed,
              SUM(t.is_template = 1) AS templates
         FROM (SELECT l.id, l.is_template,
                      COUNT(i.id) AS item_count,
                      COALESCE(SUM(i.is_checked), 0) AS checked_count
                 FROM ck_lists l
                 LEFT JOIN ck_items i ON i.list_id = l.id
                WHERE l.user_id = ?
                GROUP BY l.id, l.is_template) AS t`,
      [userId],
    ),
    // 내가 가장 자주 넣는 준비물 TOP 5 (템플릿 포함, 이름 기준)
    query<{ name: string; count: number }>(
      `SELECT name, COUNT(*) AS count
         FROM ck_items
        WHERE user_id = ?
        GROUP BY name
        ORDER BY count DESC, MAX(created_at) DESC
        LIMIT 5`,
      [userId],
    ),
  ]);

  const total = Number(itemRow?.total ?? 0);
  const checked = Number(itemRow?.checked ?? 0);
  return {
    totalLists: Number(listRow?.total_lists ?? 0),
    completedLists: Number(listRow?.completed ?? 0),
    templateCount: Number(listRow?.templates ?? 0),
    bySituation: bySituation.map((r) => ({ situation: r.situation, count: Number(r.count) })),
    items: { total, checked, rate: total ? Math.round((checked / total) * 100) : 0 },
    topItems: topItems.map((r) => ({ name: r.name, count: Number(r.count) })),
    aiItems: Number(itemRow?.ai ?? 0),
  };
}
