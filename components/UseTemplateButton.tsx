'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from './Toast';
import { Spinner } from './ui';

/** 템플릿 → 「이걸로 새 리스트」 */
export function UseTemplateButton({ templateId, className = 'btn-outline px-3 py-2' }: { templateId: number; className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function use() {
    setBusy(true);
    try {
      const { id } = await api<{ id: number }>(`/api/templates/${templateId}/use`, 'POST');
      toast('템플릿으로 새 리스트를 만들었어요');
      router.push(`/lists/${id}`);
    } catch (err) {
      toast((err as Error).message, 'error');
      setBusy(false);
    }
  }

  return (
    <button type="button" className={`${className} shrink-0`} onClick={use} disabled={busy}>
      {busy ? <Spinner /> : '📋'} 이걸로 새 리스트
    </button>
  );
}
