/** 페이지 데이터를 불러오는 동안 보여 주는 종이 카드 뼈대 */
export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
      <div className="mb-5 h-10 w-2/3 animate-pulse rounded-lg bg-paper-deep" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="paper-card animate-pulse p-4" style={{ animationDelay: `${i * 120}ms` }}>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-paper-deep" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-paper-deep" />
              <div className="h-3 w-1/4 rounded bg-paper-deep" />
            </div>
          </div>
          <div className="mt-4 h-2.5 rounded-full bg-paper-deep" />
        </div>
      ))}
      <p className="pt-2 text-center font-hand text-xl text-ink-faint">가방 여는 중…</p>
    </div>
  );
}
