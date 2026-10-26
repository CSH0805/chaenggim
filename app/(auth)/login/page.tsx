import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';

export const metadata: Metadata = { title: '로그인 · 챙김' };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
