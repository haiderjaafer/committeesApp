'use client';
import dynamic from 'next/dynamic';

const ReportTable = dynamic(() => import('@/components/report/committeeReportByCommitteeDate'), {
  ssr: false,
});

export default function ReportPage() {
  return <ReportTable />;
}


