'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Tone = 'ok' | 'error';
const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

/** 화면 아래에 잠깐 떴다 사라지는 알림 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((message: string, tone: Tone = 'ok') => {
    clearTimeout(timer.current);
    setToast({ message, tone, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" aria-live="polite">
        {toast && (
          <div
            key={toast.key}
            className={`animate-rise rounded-full px-4 py-2.5 text-sm font-semibold shadow-paper ${
              toast.tone === 'error' ? 'bg-tomato text-white' : 'bg-ink text-paper'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
