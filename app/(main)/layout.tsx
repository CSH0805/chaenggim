import { Fab, Header } from '@/components/Header';
import { ToastProvider } from '@/components/Toast';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <ToastProvider>
      <Header nickname={user.nickname} />
      <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-32">{children}</main>
      <Fab />
    </ToastProvider>
  );
}
