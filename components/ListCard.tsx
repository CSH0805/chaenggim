import Link from 'next/link';
import { dDayLabel, formatKoreanDate } from '@/lib/date';
import type { ListSummary } from '@/lib/types';
import { ProgressBar } from './ui';
import { UseTemplateButton } from './UseTemplateButton';

function DdayBadge({ label }: { label: string }) {
  const style =
    label === 'D-DAY'
      ? 'bg-tomato text-white'
      : label.startsWith('D+')
        ? 'bg-paper-deep text-ink-faint'
        : 'bg-marker text-ink';
  return <span className={`rounded-md px-2 py-0.5 font-hand text-lg font-bold leading-tight ${style}`}>{label}</span>;
}

export function ListCard({ list, today, index }: { list: ListSummary; today: string; index: number }) {
  const dday = dDayLabel(list.event_date, today);
  const done = list.total > 0 && list.checked === list.total;
  return (
    <Link
      href={`/lists/${list.id}`}
      className="paper-card animate-rise group relative block p-4 transition hover:-translate-y-0.5 hover:border-forest/40"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-paper-deep text-2xl">{list.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[17px] font-bold">{list.title}</h3>
            {dday && <DdayBadge label={dday} />}
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            {list.situation}
            {list.event_date && ` · ${formatKoreanDate(list.event_date)}`}
          </p>
        </div>
        {done && (
          <span className="animate-pop -rotate-12 rounded-md border-2 border-forest px-1.5 font-hand text-lg font-bold text-forest">
            다 챙김!
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={list.checked} total={list.total} />
        <span className="shrink-0 font-hand text-lg font-bold text-ink-soft">
          {list.checked} / {list.total}
        </span>
      </div>
    </Link>
  );
}

export function TemplateCard({ list, index }: { list: ListSummary; index: number }) {
  return (
    <div
      className="paper-card animate-rise flex items-center gap-3 border-dashed p-4"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link href={`/lists/${list.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest-soft text-2xl">{list.emoji}</span>
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-bold">{list.title}</h3>
          <p className="mt-0.5 text-xs text-ink-faint">
            {list.situation} · 항목 {list.total}개
          </p>
        </div>
      </Link>
      <UseTemplateButton templateId={list.id} />
    </div>
  );
}
