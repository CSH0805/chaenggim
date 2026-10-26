'use client';

import { useState } from 'react';
import { Notice, Spinner } from '@/components/ui';
import { api } from '@/lib/api-client';
import { CATEGORY_EMOJI, type Category } from '@/lib/constants';
import type { AiReview } from '@/lib/types';

interface Props {
  listId: number;
  existing: string[];
  onAdd: (values: { name: string; category: Category; quantity: number; is_ai: boolean; ai_reason: string }) => Promise<boolean>;
}

/** 「🔍 AI 빠진 거 확인」: 제안마다 「+ 추가」 한 번으로 항목에 넣는다 */
export function AiReviewPanel({ listId, existing, onAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<AiReview | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const has = (name: string) => existing.some((e) => e.replace(/\s+/g, '') === name.replace(/\s+/g, ''));

  async function run() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ review: AiReview }>('/api/ai/review', 'POST', { listId });
      setReview(res.review);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function add(s: AiReview['missing'][number]) {
    setAdding(s.name);
    await onAdd({ name: s.name, category: s.category, quantity: 1, is_ai: true, ai_reason: s.reason });
    setAdding(null);
  }

  return (
    <section className="space-y-3">
      <button type="button" className="btn-outline w-full border-dashed bg-[#fffdf6] py-3 text-base" onClick={run} disabled={loading}>
        {loading ? (
          <>
            <Spinner /> AI가 리스트를 훑어보는 중…
          </>
        ) : (
          <>🔍 AI 빠진 거 확인{review && ' (다시)'}</>
        )}
      </button>

      {error && <Notice>{error}</Notice>}

      {review && !loading && (
        <div className="paper-card animate-rise border-forest/30 p-4">
          {review.tip && (
            <p className="mb-3 rounded-xl bg-forest-soft px-3 py-2 text-sm text-forest-dark">
              💡 <b>팁</b> {review.tip}
            </p>
          )}
          {review.missing.length === 0 ? (
            <p className="py-2 text-center font-hand text-xl font-bold text-forest">빠진 게 없어 보여요! 👍</p>
          ) : (
            <ul className="space-y-1">
              {review.missing.map((s) => {
                const added = has(s.name);
                return (
                  <li key={s.name} className="flex items-center gap-3 rounded-xl px-1 py-2">
                    <span className="text-xl">{CATEGORY_EMOJI[s.category]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-ink-soft">{s.reason}</p>
                    </div>
                    <button
                      type="button"
                      className={added ? 'btn-ghost px-3 py-1.5 text-forest' : 'btn-primary px-3 py-1.5'}
                      disabled={added || adding !== null}
                      onClick={() => add(s)}
                    >
                      {adding === s.name ? <Spinner /> : added ? '✔ 추가됨' : '+ 추가'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
