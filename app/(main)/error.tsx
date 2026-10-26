'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui';

export default function MainError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <EmptyState emoji="🫠" title="앗, 페이지를 불러오지 못했어요">
      <p>DB 연결이 잠깐 끊겼을 수 있어요. 잠시 후 다시 시도해 주세요.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" className="btn-primary" onClick={retry}>
          다시 시도
        </button>
        <Link href="/" className="btn-ghost">
          홈으로
        </Link>
      </div>
    </EmptyState>
  );
}
