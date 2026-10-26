'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Notice, Spinner } from '@/components/ui';
import { api } from '@/lib/api-client';

/** 로그인·회원가입 공용 폼 */
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  async function submit(path: string, body: unknown, kind: 'form' | 'demo') {
    setBusy(kind);
    setError('');
    try {
      await api(path, 'POST', body);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    submit(isSignup ? '/api/auth/signup' : '/api/auth/login', data, 'form');
  }

  return (
    <div className="paper-card p-6">
      <h1 className="mb-5 font-hand text-3xl font-bold">{isSignup ? '처음 오셨군요!' : '다시 만나서 반가워요'}</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label className="label" htmlFor="nickname">닉네임</label>
            <input id="nickname" name="nickname" className="field" placeholder="챙김이" maxLength={30} required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" className="field" placeholder="me@example.com" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            className="field"
            placeholder={isSignup ? '6자 이상' : '비밀번호'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={isSignup ? 6 : undefined}
            required
          />
        </div>

        {error && <Notice>{error}</Notice>}

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={busy !== null}>
          {busy === 'form' && <Spinner />}
          {isSignup ? '가입하고 시작하기' : '로그인'}
        </button>
      </form>

      {!isSignup && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-line" /> 가입 없이 <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            className="btn-outline w-full py-3 text-base"
            disabled={busy !== null}
            onClick={() => submit('/api/auth/demo', {}, 'demo')}
          >
            {busy === 'demo' ? <Spinner /> : '🎒'} 체험 계정으로 둘러보기
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        {isSignup ? '이미 계정이 있나요? ' : '아직 계정이 없나요? '}
        <Link href={isSignup ? '/login' : '/signup'} className="font-semibold text-forest underline underline-offset-4">
          {isSignup ? '로그인' : '회원가입'}
        </Link>
      </p>
    </div>
  );
}
