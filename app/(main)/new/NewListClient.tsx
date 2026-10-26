'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ListForm, type ListFormValues } from '@/components/forms';
import { useToast } from '@/components/Toast';
import { ChipGroup, Notice, Spinner } from '@/components/ui';
import { api } from '@/lib/api-client';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  COMPANIONS,
  DURATIONS,
  LIMITS,
  SITUATIONS,
  SITUATION_EMOJI,
  WEATHERS,
  type Situation,
} from '@/lib/constants';
import type { AiGenerated } from '@/lib/types';

type Mode = 'ai' | 'manual';

export function NewListClient({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
        mode === m ? 'bg-[#fffdf6] text-forest shadow-paper' : 'text-ink-soft hover:text-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-block text-sm font-semibold text-ink-soft hover:text-forest">
        ← 내 리스트
      </Link>
      <h1 className="font-hand text-[32px] font-bold leading-tight">새 리스트 만들기</h1>
      <div className="flex gap-1 rounded-xl bg-paper-deep p-1" role="tablist">
        {tab('ai', '✨ AI로 만들기')}
        {tab('manual', '✍️ 직접 만들기')}
      </div>
      {mode === 'ai' ? <AiCreate onManual={() => setMode('manual')} /> : <ManualCreate />}
    </div>
  );
}

function ManualCreate() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function create(values: ListFormValues) {
    setBusy(true);
    try {
      const { id } = await api<{ id: number }>('/api/lists', 'POST', {
        ...values,
        event_date: values.event_date || null,
        memo: values.memo || null,
      });
      toast('리스트를 만들었어요. 항목을 추가해 보세요!');
      router.push(`/lists/${id}`);
    } catch (err) {
      toast((err as Error).message, 'error');
      setBusy(false);
    }
  }

  return (
    <div className="paper-card animate-rise p-5">
      <ListForm submitLabel="리스트 만들기" busy={busy} onSubmit={create} />
    </div>
  );
}

const LOADING_LINES = ['상황을 살펴보는 중…', '날씨에 맞는 옷을 고르는 중…', '빠뜨리기 쉬운 걸 떠올리는 중…'];

function AiCreate({ onManual }: { onManual: () => void }) {
  const router = useRouter();
  const toast = useToast();

  const [situation, setSituation] = useState<Situation>('여행');
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>('1박2일');
  const [companion, setCompanion] = useState<(typeof COMPANIONS)[number]>('혼자');
  const [weather, setWeather] = useState<(typeof WEATHERS)[number]>('상관없음');
  const [place, setPlace] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<(AiGenerated & { logId: number }) | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [line, setLine] = useState(0);

  async function generate() {
    setLoading(true);
    setError('');
    setLine(0);
    const timer = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1800);
    try {
      const res = await api<{ preview: AiGenerated; logId: number }>('/api/ai/generate', 'POST', {
        situation,
        duration,
        companion,
        weather,
        place: place.trim() || null,
      });
      setPreview({ ...res.preview, logId: res.logId });
      setTitle(res.preview.title);
      setExcluded(new Set());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  function toggleExclude(i: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function save() {
    if (!preview) return;
    setSaving(true);
    try {
      const items = preview.items
        .filter((_, i) => !excluded.has(i))
        .map((it) => ({ name: it.name, category: it.category, quantity: it.quantity, is_ai: true, ai_reason: it.reason }));
      const { id } = await api<{ id: number }>('/api/lists', 'POST', {
        title: title.trim() || preview.title,
        situation,
        emoji: preview.emoji,
        event_date: eventDate || null,
        memo: [duration, companion !== '혼자' ? `${companion}와 함께` : '', weather !== '상관없음' ? `날씨: ${weather}` : '', place.trim()]
          .filter(Boolean)
          .join(' · '),
        items,
        aiLogId: preview.logId,
      });
      toast('✨ AI 리스트를 저장했어요!');
      router.push(`/lists/${id}`);
    } catch (err) {
      toast((err as Error).message, 'error');
      setSaving(false);
    }
  }

  // ── 미리보기 화면 ──
  if (preview) {
    const keep = preview.items.length - excluded.size;
    return (
      <div className="animate-rise space-y-4">
        <Notice tone="info">빼고 싶은 항목은 눌러서 제외하세요. 다시 누르면 되살아나요.</Notice>

        <div className="paper-card space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-paper-deep text-3xl">{preview.emoji}</span>
            <input
              className="field font-hand text-2xl font-bold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={LIMITS.title}
              aria-label="리스트 제목"
            />
          </div>
          <div>
            <label className="label" htmlFor="ai-date">날짜 <span className="font-normal text-ink-faint">(선택)</span></label>
            <input id="ai-date" type="date" className="field" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
        </div>

        {CATEGORIES.map((c) => {
          const rows = preview.items.map((it, i) => ({ it, i })).filter(({ it }) => it.category === c);
          if (rows.length === 0) return null;
          return (
            <section key={c} className="paper-card px-2 pt-3 pb-1.5">
              <h2 className="mb-1 px-2 font-hand text-2xl font-bold">
                {CATEGORY_EMOJI[c]} {c}
              </h2>
              <ul>
                {rows.map(({ it, i }) => {
                  const off = excluded.has(i);
                  return (
                    <li key={i} className="border-t border-dashed border-line first:border-t-0">
                      <button
                        type="button"
                        onClick={() => toggleExclude(i)}
                        aria-pressed={!off}
                        className={`flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-paper-deep/60 ${off ? 'opacity-45' : ''}`}
                      >
                        <span className={`mt-0.5 text-base ${off ? 'grayscale' : ''}`}>{off ? '➖' : '✨'}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`font-medium ${off ? 'line-through' : ''}`}>
                            {it.name}
                            {it.quantity > 1 && <span className="ml-1 font-hand text-lg text-ink-soft">×{it.quantity}</span>}
                          </span>
                          <span className="block text-xs text-ink-soft">{it.reason}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-ink-faint">{off ? '제외됨' : ''}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <div className="sticky bottom-4 z-30 flex gap-2 rounded-2xl bg-paper/90 p-2 shadow-paper backdrop-blur">
          <button type="button" className="btn-ghost" onClick={() => setPreview(null)} disabled={saving}>
            ← 조건 다시
          </button>
          <button type="button" className="btn-primary flex-1 py-3 text-base" onClick={save} disabled={saving || keep === 0}>
            {saving && <Spinner />} 이대로 저장 ({keep}개)
          </button>
        </div>
      </div>
    );
  }

  // ── 조건 선택 화면 ──
  const block = (label: string, children: React.ReactNode) => (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="paper-card animate-rise space-y-5 p-5">
      {block(
        '어떤 상황인가요?',
        <ChipGroup label="상황" options={SITUATIONS} value={situation} onChange={setSituation} render={(s) => `${SITUATION_EMOJI[s]} ${s}`} />,
      )}
      {block('기간', <ChipGroup label="기간" options={DURATIONS} value={duration} onChange={setDuration} />)}
      {block('누구랑?', <ChipGroup label="동행" options={COMPANIONS} value={companion} onChange={setCompanion} />)}
      {block(
        '날씨',
        <ChipGroup
          label="날씨"
          options={WEATHERS}
          value={weather}
          onChange={setWeather}
          render={(w) => `${{ 더움: '☀️', 추움: '❄️', 비: '☔', 상관없음: '🌤️' }[w]} ${w}`}
        />,
      )}
      <div>
        <label className="label" htmlFor="ai-place">
          장소 <span className="font-normal text-ink-faint">(선택)</span>
        </label>
        <input
          id="ai-place"
          className="field"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="예) 강릉, 도서관, 삼성전자"
          maxLength={LIMITS.place}
        />
      </div>

      {error && (
        <Notice>
          {error}
          <button type="button" className="ml-2 underline underline-offset-4" onClick={onManual}>
            직접 만들기로 가기 →
          </button>
        </Notice>
      )}

      <button type="button" className="btn-primary w-full py-3.5 text-base" onClick={generate} disabled={loading}>
        {loading ? (
          <>
            <Spinner /> {LOADING_LINES[line]}
          </>
        ) : (
          '✨ AI 체크리스트 만들기'
        )}
      </button>
    </div>
  );
}
