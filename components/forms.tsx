'use client';

import { useState, type FormEvent } from 'react';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  LIMITS,
  SITUATIONS,
  SITUATION_EMOJI,
  type Category,
  type Situation,
} from '@/lib/constants';
import { ChipGroup, QuantityStepper, Spinner } from './ui';

const EMOJI_CHOICES = ['✈️', '🌊', '🏖️', '⛺', '👔', '📝', '🎓', '🏃', '📦', '🎂', '🎒', '📌'];

export interface ListFormValues {
  title: string;
  situation: Situation;
  emoji: string;
  event_date: string;
  memo: string;
}

/** 리스트 만들기·수정 폼 (제목·상황·이모지·날짜·메모) */
export function ListForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial?: Partial<ListFormValues>;
  submitLabel: string;
  busy: boolean;
  onSubmit: (values: ListFormValues) => void;
}) {
  const [v, setV] = useState<ListFormValues>({
    title: initial?.title ?? '',
    situation: initial?.situation ?? '여행',
    emoji: initial?.emoji ?? SITUATION_EMOJI[initial?.situation ?? '여행'],
    event_date: initial?.event_date ?? '',
    memo: initial?.memo ?? '',
  });
  const set = <K extends keyof ListFormValues>(k: K, val: ListFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function changeSituation(s: Situation) {
    // 이모지를 직접 고르지 않았다면 상황에 맞는 기본 이모지로 바꿔 준다
    setV((p) => ({ ...p, situation: s, emoji: p.emoji === SITUATION_EMOJI[p.situation] ? SITUATION_EMOJI[s] : p.emoji }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ ...v, title: v.title.trim(), memo: v.memo.trim() });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="label" htmlFor="list-title">제목</label>
        <input
          id="list-title"
          className="field"
          value={v.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="예) 제주도 가족 여행"
          maxLength={LIMITS.title}
          required
        />
      </div>

      <div>
        <span className="label">상황</span>
        <ChipGroup
          label="상황"
          options={SITUATIONS}
          value={v.situation}
          onChange={changeSituation}
          render={(s) => `${SITUATION_EMOJI[s]} ${s}`}
        />
      </div>

      <div>
        <span className="label">이모지</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="이모지">
          {[...new Set([v.emoji, ...EMOJI_CHOICES])].map((em) => (
            <button
              key={em}
              type="button"
              aria-pressed={v.emoji === em}
              onClick={() => set('emoji', em)}
              className="grid size-10 place-items-center rounded-xl border-[1.5px] border-transparent text-xl transition hover:bg-paper-deep aria-pressed:border-forest aria-pressed:bg-forest-soft"
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="list-date">날짜 <span className="font-normal text-ink-faint">(선택)</span></label>
        <input id="list-date" type="date" className="field" value={v.event_date} onChange={(e) => set('event_date', e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="list-memo">메모 <span className="font-normal text-ink-faint">(선택)</span></label>
        <textarea
          id="list-memo"
          className="field min-h-20 resize-y"
          value={v.memo}
          onChange={(e) => set('memo', e.target.value)}
          placeholder="출발 시간, 숙소 정보 등"
          maxLength={LIMITS.memo}
        />
      </div>

      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={busy || !v.title.trim()}>
        {busy && <Spinner />} {submitLabel}
      </button>
    </form>
  );
}

export interface ItemFormValues {
  name: string;
  category: Category;
  quantity: number;
}

/** 항목 추가·수정 폼 (이름 입력 + 카테고리 칩 + 수량 +/-) */
export function ItemForm({
  initial,
  submitLabel,
  busy,
  compact,
  onSubmit,
}: {
  initial?: Partial<ItemFormValues>;
  submitLabel: string;
  busy: boolean;
  compact?: boolean;
  onSubmit: (values: ItemFormValues) => Promise<boolean> | boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? '기타');
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await onSubmit({ name: name.trim(), category, quantity });
    if (ok && compact) {
      // 연달아 추가하기 쉽게 이름·수량만 비우고 카테고리는 유지
      setName('');
      setQuantity(1);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className="field"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="예) 보조배터리"
        maxLength={LIMITS.itemName}
        aria-label="항목 이름"
        required
      />
      <ChipGroup
        label="카테고리"
        options={CATEGORIES}
        value={category}
        onChange={setCategory}
        render={(c) => `${CATEGORY_EMOJI[c]} ${c}`}
      />
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-soft">수량</span>
          <QuantityStepper value={quantity} onChange={setQuantity} max={LIMITS.quantityMax} />
        </div>
        <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
          {busy && <Spinner />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
