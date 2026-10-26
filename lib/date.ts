// '오늘'과 D-day 는 서버 위치(Vercel 은 UTC)와 상관없이 항상 서울 기준으로 계산한다.

/** 서울 기준 오늘 날짜 YYYY-MM-DD */
export function todaySeoul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** 두 YYYY-MM-DD 문자열 사이의 일 수 (to - from) */
function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** 'D-3', 'D-DAY', 'D+2' 형태. 날짜가 없으면 null */
export function dDayLabel(eventDate: string | null, today: string = todaySeoul()): string | null {
  if (!eventDate) return null;
  const diff = daysBetween(today, eventDate);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

/** '10월 31일 (금)' 형태 */
export function formatKoreanDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getUTCDay()];
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${week})`;
}
