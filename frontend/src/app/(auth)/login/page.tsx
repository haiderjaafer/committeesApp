// app/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'نظام متابعة الكتب الالكترونية',
  description: ' الدخول إلى نظام متابعة الكتب الالكترونية',
};

export default function LoginPage() {
  return <LoginForm />;
}