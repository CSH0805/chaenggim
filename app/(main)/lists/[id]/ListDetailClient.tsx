'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ItemForm, ListForm, type ItemFormValues, type ListFormValues } from '@/components/forms';
import { useToast } from '@/components/Toast';
import { UseTemplateButton } from '@/components/UseTemplateButton';
import { ConfirmModal, EmptyState, HandCheckbox, Modal, ProgressBar, Spinner } from '@/components/ui';
import { api } from '@/lib/api-client';
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/constants';
import { dDayLabel, formatKoreanDate } from '@/lib/date';
import type { Item, ListDetail } from '@/lib/types';
import { AiReviewPanel } from './AiReviewPanel';

type Meta = Omit<ListDetail, 'items'>;

export function ListDetailClient({ initial, today }: { initial: ListDetail; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const { items: initialItems, ...initialMeta } = initial;
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [items, setItems] = useState<Item[]>(initialItems);

  const [showAdd, setShowAdd] = useState(initialItems.length === 0);
  const [editingList, setEditingList] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [openReason, setOpenReason] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isTemplate = meta.is_template === 1;
  const total = items.length;
  const checked = items.filter((i) => i.is_checked).length;
  const done = total > 0 && checked === total;
  const dday = dDayLabel(meta.event_date, today);

  // 0 → 전부 체크로 바뀌는 순간에만 꽃가루를 뿌린다
  const [confetti, setConfetti] = useState(false);
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 2000);
      wasDone.current = done;
      return () => clearTimeout(t);
    }
    wasDone.current = done;
  }, [done]);

  async function guard<T>(key: string, work: () => Promise<T>): Promise<T | undefined> {
    setBusy(key);
    try {
      return await work();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  }

  // ---------- 항목 ----------

  async function toggle(item: Item) {
    if (isTemplate) return;
    const next = item.is_checked ? 0 : 1;
    // 화면 먼저 바꾸고(낙관적 업데이트), 실패하면 되돌린다
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: next } : i)));
    try {
      await api(`/api/items/${item.id}`, 'PATCH', { is_checked: next === 1 });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: item.is_checked } : i)));
      toast((err as Error).message, 'error');
    }
  }

  async function addItem(values: ItemFormValues & { is_ai?: boolean; ai_reason?: string }) {
    const res = await guard('add', () => api<{ item: Item }>(`/api/lists/${meta.id}/items`, 'POST', values));
    if (!res) return false;
    setItems((prev) => [...prev, res.item]);
    toast(`「${res.item.name}」 추가!`);
    return true;
  }

  async function saveItem(values: ItemFormValues) {
    if (!editingItem) return false;
    const res = await guard('item', () => api<{ item: Item }>(`/api/items/${editingItem.id}`, 'PATCH', values));
    if (!res) return false;
    setItems((prev) => prev.map((i) => (i.id === res.item.id ? res.item : i)));
    setEditingItem(null);
    return true;
  }

  async function removeItem(item: Item) {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== item.id));
    try {
      await api(`/api/items/${item.id}`, 'DELETE');
      toast(`「${item.name}」 삭제했어요`);
    } catch (err) {
      setItems(prev);
      toast((err as Error).message, 'error');
    }
  }

  // ---------- 리스트 ----------

  async function saveList(values: ListFormValues) {
    const res = await guard('list', () =>
      api<{ list: ListDetail }>(`/api/lists/${meta.id}`, 'PATCH', {
        ...values,
        event_date: values.event_date || null,
        memo: values.memo || null,
      }),
    );
    if (!res) return;
    const l = res.list;
    setMeta((m) => ({ ...m, title: l.title, situation: l.situation, emoji: l.emoji, event_date: l.event_date, memo: l.memo }));
    setEditingList(false);
    toast('리스트를 수정했어요');
    router.refresh();
  }

  async function deleteList() {
    const res = await guard('delete', () => api(`/api/lists/${meta.id}`, 'DELETE'));
    if (res === undefined) return;
    toast('리스트를 삭제했어요');
    router.push(isTemplate ? '/?tab=templates' : '/');
    router.refresh();
  }

  async function resetAll() {
    const res = await guard('reset', () => api(`/api/lists/${meta.id}/reset`, 'POST'));
    if (res === undefined) return;
    setItems((prev) => prev.map((i) => ({ ...i, is_checked: 0 })));
    toast('모두 체크 해제했어요. 다음에 또 챙겨요!');
  }

  async function saveTemplate() {
    const res = await guard('template', () => api<{ id: number }>(`/api/lists/${meta.id}/template`, 'POST'));
    if (res) toast('📋 템플릿으로 저장했어요 (홈 → 템플릿 탭)');
  }

  const groups = CATEGORIES.map((c) => ({ category: c, items: items.filter((i) => i.category === c) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="space-y-4">
      <Link href={isTemplate ? '/?tab=templates' : '/'} className="inline-block text-sm font-semibold text-ink-soft hover:text-forest">
        ← {isTemplate ? '템플릿 목록' : '내 리스트'}
      </Link>

      {/* ── 제목 영역 ── */}
      <section className="paper-card relative overflow-hidden p-5">
        {isTemplate && (
          <span className="absolute top-3 right-3 rotate-6 rounded-md border-2 border-dashed border-forest px-2 font-hand text-lg font-bold text-forest">
            TEMPLATE
          </span>
        )}
        <div className="flex items-start gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-paper-deep text-3xl">{meta.emoji}</span>
          <div className="min-w-0 flex-1 pr-16">
            <h1 className="font-hand text-[30px] font-bold leading-tight break-keep">{meta.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
              <span>{meta.situation}</span>
              {meta.event_date && <span>· {formatKoreanDate(meta.event_date)}</span>}
              {dday && !isTemplate && (
                <span className={`rounded px-1.5 font-hand text-base font-bold ${dday === 'D-DAY' ? 'bg-tomato text-white' : 'bg-marker'}`}>
                  {dday}
                </span>
              )}
            </p>
          </div>
        </div>
        {meta.memo && <p className="mt-3 rounded-xl bg-paper-deep/70 px-3 py-2 text-sm whitespace-pre-line text-ink-soft">📝 {meta.memo}</p>}

        <div className="mt-4 flex flex-wrap gap-1">
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => setEditingList(true)}>
            ✏️ 수정
          </button>
          {!isTemplate && (
            <button type="button" className="btn-ghost px-3 py-1.5" onClick={saveTemplate} disabled={busy === 'template' || total === 0}>
              {busy === 'template' ? <Spinner /> : '📋'} 템플릿으로 저장
            </button>
          )}
          <button type="button" className="btn-ghost px-3 py-1.5 text-tomato" onClick={() => setConfirmDelete(true)}>
            🗑 삭제
          </button>
        </div>
      </section>

      {/* ── 진행률 / 템플릿 안내 ── */}
      {isTemplate ? (
        <section className="paper-card flex flex-col gap-3 border-dashed p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink-soft">
            템플릿은 체크하지 않고 <b>항목만 다듬어</b> 두는 곳이에요. 쓸 때는 새 리스트로 복사해요.
          </p>
          <UseTemplateButton templateId={meta.id} className="btn-primary" />
        </section>
      ) : (
        <section className="paper-card relative overflow-hidden p-4">
          {confetti && <Confetti />}
          <div className="mb-2 flex items-end justify-between">
            <p className="font-hand text-[28px] leading-none font-bold">
              {checked} <span className="text-ink-faint">/ {total}</span> <span className="text-xl text-forest">챙김</span>
            </p>
            {checked > 0 && (
              <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={resetAll} disabled={busy === 'reset'}>
                {busy === 'reset' ? <Spinner /> : '↺'} 모두 체크 해제
              </button>
            )}
          </div>
          <ProgressBar value={checked} total={total} />
          {done && (
            <p className="animate-pop mt-3 text-center font-hand text-2xl font-bold text-forest">🎉 다 챙겼어요! 잘 다녀오세요</p>
          )}
        </section>
      )}

      {/* ── AI 빠진 거 확인 ── */}
      <AiReviewPanel listId={meta.id} existing={items.map((i) => i.name)} onAdd={addItem} />

      {/* ── 항목 추가 ── */}
      <section className="paper-card p-4">
        <button
          type="button"
          className="flex w-full items-center justify-between font-semibold text-forest"
          onClick={() => setShowAdd((v) => !v)}
          aria-expanded={showAdd}
        >
          <span>+ 항목 직접 추가</span>
          <span className={`transition ${showAdd ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        {showAdd && (
          <div className="animate-rise mt-3">
            <ItemForm submitLabel="추가" busy={busy === 'add'} compact onSubmit={addItem} />
          </div>
        )}
      </section>

      {/* ── 카테고리별 항목 ── */}
      {groups.length === 0 ? (
        <EmptyState emoji="🧺" title="아직 항목이 없어요">
          위에서 직접 추가하거나 <b>🔍 AI 빠진 거 확인</b>으로 추천을 받아 보세요.
        </EmptyState>
      ) : (
        groups.map((g) => {
          const groupChecked = g.items.filter((i) => i.is_checked).length;
          return (
            <section key={g.category} className="paper-card animate-rise px-2 pt-3 pb-1.5">
              <h2 className="mb-1 flex items-center justify-between px-2 font-hand text-2xl font-bold">
                <span>
                  {CATEGORY_EMOJI[g.category]} {g.category}
                </span>
                {!isTemplate && (
                  <span className="text-lg text-ink-faint">
                    {groupChecked}/{g.items.length}
                  </span>
                )}
              </h2>
              <ul>
                {g.items.map((item) => (
                  <li key={item.id} data-checked={item.is_checked === 1} className="border-t border-dashed border-line first:border-t-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggle(item)}
                        disabled={isTemplate}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-paper-deep/60 disabled:cursor-default disabled:hover:bg-transparent"
                        aria-pressed={item.is_checked === 1}
                      >
                        {!isTemplate && <HandCheckbox checked={item.is_checked === 1} />}
                        <span className="strike truncate text-[15px] font-medium">{item.name}</span>
                        {item.quantity > 1 && (
                          <span className="shrink-0 font-hand text-lg text-ink-soft">×{item.quantity}</span>
                        )}
                      </button>
                      {item.is_ai === 1 && (
                        <button
                          type="button"
                          className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm transition hover:bg-marker/60 ${openReason === item.id ? 'bg-marker' : ''}`}
                          onClick={() => setOpenReason(openReason === item.id ? null : item.id)}
                          aria-label="AI 추천 이유 보기"
                          aria-expanded={openReason === item.id}
                          title="AI가 추천한 항목"
                        >
                          ✨
                        </button>
                      )}
                      <button
                        type="button"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-sm text-ink-faint transition hover:bg-paper-deep hover:text-ink"
                        onClick={() => setEditingItem(item)}
                        aria-label={`${item.name} 수정`}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-sm text-ink-faint transition hover:bg-tomato-soft hover:text-tomato"
                        onClick={() => removeItem(item)}
                        aria-label={`${item.name} 삭제`}
                      >
                        ✕
                      </button>
                    </div>
                    {openReason === item.id && (
                      <p className="animate-rise relative mx-2 mb-2 ml-11 rounded-xl bg-marker/50 px-3 py-2 text-sm text-ink">
                        ✨ {item.ai_reason || 'AI가 이 상황에 필요하다고 추천했어요.'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {/* ── 모달 ── */}
      <Modal open={editingList} onClose={() => setEditingList(false)} title="리스트 수정">
        <ListForm
          initial={{ ...meta, event_date: meta.event_date ?? '', memo: meta.memo ?? '' }}
          submitLabel="저장"
          busy={busy === 'list'}
          onSubmit={saveList}
        />
      </Modal>

      <Modal open={editingItem !== null} onClose={() => setEditingItem(null)} title="항목 수정">
        {editingItem && <ItemForm key={editingItem.id} initial={editingItem} submitLabel="저장" busy={busy === 'item'} onSubmit={saveItem} />}
      </Modal>

      <ConfirmModal
        open={confirmDelete}
        title="정말 삭제할까요?"
        message={
          <>
            <b>
              {meta.emoji} {meta.title}
            </b>
            와 항목 {total}개가 모두 사라져요. 되돌릴 수 없어요.
          </>
        }
        busy={busy === 'delete'}
        onConfirm={deleteList}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/** 다 챙겼을 때 잠깐 떨어지는 꽃가루 */
function Confetti() {
  const pieces = ['🎉', '✨', '🎊', '⭐', '✔️', '🌿', '🎉', '✨', '🎊', '⭐'];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {pieces.map((p, i) => (
        <span key={i} className="confetti text-xl" style={{ left: `${5 + i * 9.5}%`, animationDelay: `${(i % 4) * 0.12}s` }}>
          {p}
        </span>
      ))}
    </div>
  );
}
