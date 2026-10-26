/** 손글씨 로고: 체크 표시 + 챙김 */
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const text = size === 'lg' ? 'text-5xl' : 'text-3xl';
  const icon = size === 'lg' ? 'size-11' : 'size-7';
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg className={icon} viewBox="0 0 28 28" fill="none" aria-hidden>
        <path
          d="M4.6 5.3C9.2 4.5 17.8 4.9 23.5 4.5C24.1 10.1 23.4 17.2 23.9 23.3C17.3 23.9 10.1 23.2 4.2 23.8C4.8 17.1 4.1 10.2 4.6 5.3Z"
          className="fill-forest-soft stroke-forest"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8.2 14.6L12.6 18.9L21.4 8.2" className="stroke-forest" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-hand font-bold tracking-tight text-forest ${text}`}>챙김</span>
    </span>
  );
}
