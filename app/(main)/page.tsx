import Link from 'next/link';
import { ListCard, TemplateCard } from '@/components/ListCard';
import { EmptyState } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { formatKoreanDate, todaySeoul } from '@/lib/date';
import { getLists } from '@/lib/lists';

export const runtime = 'nodejs';

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const user = await requireUser();
  const tab = (await searchParams).tab === 'templates' ? 'templates' : 'active';
  const today = todaySeoul();
  const [active, templates] = await Promise.all([getLists(user.id, false), getLists(user.id, true)]);
  const lists = tab === 'templates' ? templates : active;

  const tabClass = (on: boolean) =>
    `relative flex-1 rounded-lg py-2 text-center text-sm font-semibold transition ${
      on ? 'bg-[#fffdf6] text-forest shadow-paper' : 'text-ink-soft hover:text-ink'
    }`;

  return (
    <>
      <section className="mb-5">
        <p className="text-sm text-ink-faint">{formatKoreanDate(today)}</p>
        <h1 className="font-hand text-[32px] font-bold leading-tight">
          {user.nickname}님, <span className="marker">오늘은 뭘 챙길까요?</span>
        </h1>
      </section>

      <Link
        href="/new"
        className="paper-card mb-6 flex items-center gap-3 border-forest/30 bg-forest-soft/60 p-4 transition hover:-translate-y-0.5"
      >
        <span className="text-3xl">✨</span>
        <span className="flex-1">
          <span className="block font-bold text-forest-dark">AI 체크리스트 만들기</span>
          <span className="text-sm text-ink-soft">상황만 고르면 준비물을 뚝딱 정리해 드려요</span>
        </span>
        <span className="text-xl text-forest">→</span>
      </Link>

      <div className="mb-4 flex gap-1 rounded-xl bg-paper-deep p-1" role="tablist">
        <Link href="/" role="tab" aria-selected={tab === 'active'} className={tabClass(tab === 'active')} scroll={false}>
          진행 중 <span className="font-hand text-base">{active.length}</span>
        </Link>
        <Link href="/?tab=templates" role="tab" aria-selected={tab === 'templates'} className={tabClass(tab === 'templates')} scroll={false}>
          템플릿 <span className="font-hand text-base">{templates.length}</span>
        </Link>
      </div>

      {lists.length === 0 ? (
        tab === 'templates' ? (
          <EmptyState emoji="📋" title="아직 템플릿이 없어요">
            자주 쓰는 리스트 상세 화면에서 <b>「템플릿으로 저장」</b>을 누르면
            <br />
            다음에 한 번에 꺼내 쓸 수 있어요.
          </EmptyState>
        ) : (
          <EmptyState emoji="🎒" title="챙길 리스트가 비어 있어요">
            오른쪽 아래 <b>+ 새 리스트</b>를 눌러 첫 체크리스트를 만들어 보세요.
          </EmptyState>
        )
      ) : (
        <div className="space-y-3">
          {lists.map((list, i) =>
            tab === 'templates' ? (
              <TemplateCard key={list.id} list={list} index={i} />
            ) : (
              <ListCard key={list.id} list={list} today={today} index={i} />
            ),
          )}
        </div>
      )}
    </>
  );
}
