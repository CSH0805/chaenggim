import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { todaySeoul } from '@/lib/date';
import { getList } from '@/lib/lists';
import { ListDetailClient } from './ListDetailClient';

export const runtime = 'nodejs';

async function load(params: Promise<{ id: string }>) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const list = await getList(user.id, id);
  if (!list) notFound();
  return list;
}

export async function generateMetadata({ params }: PageProps<'/lists/[id]'>): Promise<Metadata> {
  const list = await load(params);
  return { title: `${list.emoji} ${list.title} · 챙김` };
}

export default async function ListPage({ params }: PageProps<'/lists/[id]'>) {
  const list = await load(params);
  // key 로 리스트가 바뀌면 클라이언트 상태를 새로 시작한다
  return <ListDetailClient key={list.id} initial={list} today={todaySeoul()} />;
}
