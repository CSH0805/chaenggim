'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Logo } from './Logo';
import { Spinner } from './ui';

export function Header({ nickname }: { nickname: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await api('/api/auth/logout', 'POST').catch(() => {});
    router.replace('/login');
    router.refresh();
  }

  const nav = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold transition hover:bg-paper-deep ${
        pathname === href ? 'text-forest' : 'text-ink-soft'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-dashed border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" aria-label="챙김 홈">
          <Logo />
        </Link>
        <nav className="flex items-center gap-0.5">
          <span className="mr-1 hidden text-sm text-ink-faint sm:inline">{nickname}님</span>
          {nav('/stats', '📊 통계')}
          <button type="button" onClick={logout} disabled={busy} className="btn-ghost px-2.5 py-1.5">
            {busy && <Spinner />} 로그아웃
          </button>
        </nav>
      </div>
    </header>
  );
}

/** 오른쪽 아래 둥근 「+ 새 리스트」 버튼 (만들기 화면에서는 숨김) */
export function Fab() {
  const pathname = usePathname();
  if (pathname.startsWith('/new')) return null;
  return (
    <Link
      href="/new"
      className="fixed bottom-6 right-5 z-40 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-3.5 font-semibold text-paper shadow-[0_10px_24px_-8px_rgba(35,71,53,0.7)] transition hover:-translate-y-0.5 hover:bg-forest-dark active:scale-95 sm:right-[max(1.25rem,calc(50%-21rem))]"
    >
      <span className="text-xl leading-none">+</span> 새 리스트
    </Link>
  );
}
