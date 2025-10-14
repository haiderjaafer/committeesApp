
import RegisterForm from '@/components/auth/RegisterForm';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'إنشاء حساب جديد - نظام متابعة الكتب الالكترونية',
  description: ' انشاء حساب جديد في نظام متابعة الكتب الالكترونية',
};

export default function RegisterPage() {
  return <RegisterForm />;
}