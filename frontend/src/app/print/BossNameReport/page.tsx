'use client';
import dynamic from 'next/dynamic';

const BossNameReport = dynamic(() => import('@/components/report/BossNameReport/BossNameReport'), {
  ssr: false,
});

export default function ReportPage() {
  return <BossNameReport />;
}


