import Link from 'next/link';
import { EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <EmptyState emoji="🧭" title="찾는 페이지가 없어요">
        <p>지워졌거나 내 리스트가 아닐 수 있어요.</p>
        <Link href="/" className="btn-primary mt-4">
          홈으로 가기
        </Link>
      </EmptyState>
    </main>
  );
}
