import type { Metadata } from 'next';
import { EmptyState, ProgressBar } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { SITUATION_EMOJI } from '@/lib/constants';
import { getStats } from '@/lib/stats';

export const runtime = 'nodejs';
export const metadata: Metadata = { title: '통계 · 챙김' };

function StatTile({ label, value, unit, note }: { label: string; value: number | string; unit?: string; note?: string }) {
  return (
    <div className="paper-card p-4">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 font-hand text-4xl leading-none font-bold text-forest">
        {value}
        {unit && <span className="ml-0.5 text-xl text-ink-soft">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
    </div>
  );
}

export default async function StatsPage() {
  const user = await requireUser();
  const s = await getStats(user.id);
  const maxSituation = Math.max(1, ...s.bySituation.map((r) => r.count));
  const maxTop = Math.max(1, ...s.topItems.map((r) => r.count));

  return (
    <div className="space-y-4">
      <h1 className="font-hand text-[32px] font-bold leading-tight">
        <span className="marker">나의 챙김 기록</span> 📊
      </h1>

      {s.totalLists === 0 && s.templateCount === 0 ? (
        <EmptyState emoji="📈" title="아직 쌓인 기록이 없어요">
          리스트를 만들고 체크하면 여기에 통계가 그려져요.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="진행 중 리스트" value={s.totalLists} unit="개" />
            <StatTile label="다 챙긴 리스트" value={s.completedLists} unit="개" />
            <StatTile label="템플릿" value={s.templateCount} unit="개" />
            <StatTile label="AI가 챙겨 준 항목" value={s.aiItems} unit="개" />
          </div>

          <section className="paper-card p-5">
            <h2 className="font-hand text-2xl font-bold">전체 체크 완료율</h2>
            <div className="mt-2 flex items-end gap-3">
              <p className="font-hand text-6xl leading-none font-bold text-forest">
                {s.items.rate}
                <span className="text-3xl">%</span>
              </p>
              <p className="pb-1 text-sm text-ink-soft">
                {s.items.total}개 중 {s.items.checked}개 챙김
              </p>
            </div>
            <ProgressBar value={s.items.checked} total={s.items.total} className="mt-3" />
          </section>

          <section className="paper-card p-5">
            <h2 className="mb-3 font-hand text-2xl font-bold">상황별 리스트 수</h2>
            {s.bySituation.length === 0 ? (
              <p className="text-sm text-ink-faint">진행 중인 리스트가 없어요.</p>
            ) : (
              <ul className="space-y-2.5">
                {s.bySituation.map((r) => (
                  <li key={r.situation} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-sm font-semibold">
                      {SITUATION_EMOJI[r.situation]} {r.situation}
                    </span>
                    <span className="h-5 flex-1 overflow-hidden rounded-md bg-paper-deep">
                      <span
                        className="block h-full rounded-md bg-forest/80"
                        style={{ width: `${(r.count / maxSituation) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right font-hand text-xl font-bold">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="paper-card p-5">
            <h2 className="mb-1 font-hand text-2xl font-bold">내가 가장 자주 넣는 준비물 TOP 5</h2>
            <p className="mb-3 text-xs text-ink-faint">모든 리스트·템플릿의 항목 이름 기준</p>
            <ol className="space-y-2">
              {s.topItems.map((r, i) => (
                <li key={r.name} className="flex items-center gap-3">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full font-hand text-xl font-bold ${
                      i === 0 ? 'bg-marker' : 'bg-paper-deep text-ink-soft'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-paper-deep">
                      <span className="block h-full rounded-full bg-forest/60" style={{ width: `${(r.count / maxTop) * 100}%` }} />
                    </span>
                  </span>
                  <span className="font-hand text-xl font-bold text-ink-soft">{r.count}회</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
