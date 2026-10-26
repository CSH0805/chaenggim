'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** 손으로 그린 듯한 네모 + 체크 */
export function HandCheckbox({ checked, size = 26 }: { checked: boolean; size?: number }) {
  return (
    <svg
      className="hand-check shrink-0"
      data-checked={checked}
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <path
        className="box"
        d="M4.6 5.3C9.2 4.5 17.8 4.9 23.5 4.5C24.1 10.1 23.4 17.2 23.9 23.3C17.3 23.9 10.1 23.2 4.2 23.8C4.8 17.1 4.1 10.2 4.6 5.3Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="tick" d="M8.2 14.6L12.6 18.9L21.4 8.2" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      role="status"
      aria-label="불러오는 중"
    />
  );
}

/** 진행 바 (연필로 칠한 느낌) */
export function ProgressBar({ value, total, className = '' }: { value: number; total: number; className?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const done = total > 0 && value === total;
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-paper-deep ring-1 ring-line ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${done ? 'bg-forest' : 'bg-forest/80'}`}
        style={{
          width: `${pct}%`,
          backgroundImage:
            'repeating-linear-gradient(-45deg, transparent 0 6px, rgba(255,255,255,0.18) 6px 9px)',
        }}
      />
    </div>
  );
}

/** 한 개를 고르는 칩 묶음 */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  render,
  label,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  render?: (v: T) => ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((opt) => (
        <button key={opt} type="button" className="chip" aria-pressed={value === opt} onClick={() => onChange(opt)}>
          {render ? render(opt) : opt}
        </button>
      ))}
    </div>
  );
}

/** 수량 −/+ 버튼 */
export function QuantityStepper({ value, onChange, max = 99 }: { value: number; onChange: (v: number) => void; max?: number }) {
  const btn =
    'grid size-9 place-items-center rounded-lg border-[1.5px] border-line bg-[#fffdf6] text-lg text-ink-soft transition hover:border-forest active:scale-90 disabled:opacity-40';
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="수량 줄이기">
        −
      </button>
      <span className="w-8 text-center font-hand text-2xl font-bold" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="수량 늘리기">
        +
      </button>
    </div>
  );
}

/** 가운데 뜨는 모달. 바깥을 누르거나 Esc 로 닫힌다. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input, textarea, button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="paper-card animate-rise max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-hand text-2xl font-bold">{title}</h2>
          <button type="button" className="btn-ghost -mr-2 px-2.5 py-1.5" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 삭제 같은 위험한 동작 전에 한 번 더 묻는 모달 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = '삭제',
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-[15px] leading-relaxed text-ink-soft">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>
          취소
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy && <Spinner />} {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/** 빈 화면·에러 화면에 쓰는 안내 카드 */
export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="paper-card animate-rise flex flex-col items-center px-6 py-10 text-center">
      <div className="animate-wiggle mb-3 text-5xl">{emoji}</div>
      <p className="font-hand text-2xl font-bold">{title}</p>
      {children && <div className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
}

/** AI 실패 등 에러 안내 박스 */
export function Notice({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  const styles = tone === 'error' ? 'border-tomato/40 bg-tomato-soft text-tomato' : 'border-forest/30 bg-forest-soft text-forest-dark';
  return <div className={`animate-rise rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>{children}</div>;
}
