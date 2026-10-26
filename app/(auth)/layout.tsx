import { Logo } from '@/components/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <p className="mt-3 font-hand text-xl text-ink-soft">
          클릭 몇 번이면 <span className="marker">준비물 체크리스트</span> 완성!
        </p>
      </div>
      {children}
    </main>
  );
}
