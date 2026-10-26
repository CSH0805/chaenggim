import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';

export const metadata: Metadata = { title: '회원가입 · 챙김' };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
