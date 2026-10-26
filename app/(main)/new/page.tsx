import type { Metadata } from 'next';
import { NewListClient } from './NewListClient';

export const metadata: Metadata = { title: '새 리스트 · 챙김' };

export default async function NewListPage({ searchParams }: PageProps<'/new'>) {
  const mode = (await searchParams).mode === 'manual' ? 'manual' : 'ai';
  return <NewListClient initialMode={mode} />;
}
