// 'use client';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { FileText, Calendar, User, Users } from 'lucide-react';

interface PageProps {
  params: Promise<{
    bossName: string;
  }>;
}

// ✅ Define interfaces for type safety
interface PDFData {
  id: number;
  committeeID: number;
  committeeNo: string;
  countPdf: number;
  pdf: string;
  currentDate: string;
  userID: number;
}

interface UserData {
  id: number;
  username: string;
  email: string | null;
}

interface CommitteeData {
  id: number;
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  sex: string | null;
  committeeCount: number | null;
  notes: string | null;
  currentDate: string;
  userID: number;
  user: UserData | null;
  pdfs: PDFData[];
  pdfCount: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  bossName: string;
  count: number;
  data: CommitteeData[];
}

export default async function CommitteesByBossPage({ params }: PageProps) {
  const { bossName } = await params;
  const decodedBossName = decodeURIComponent(bossName);
  
  if (!decodedBossName || decodedBossName.trim().length === 0) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-sky-50/50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold font-arabic text-sky-600 mb-2">
            عرض اللجان برئاسة
          </h1>
          <h2 className="text-4xl font-bold font-arabic text-sky-900">
            {decodedBossName}
          </h2>
        </div>
        
        {/* Committees List */}
        <Suspense fallback={<LoadingSkeleton />}>
          <CommitteesList bossName={decodedBossName} />
        </Suspense>
      </div>
    </div>
  );
}

// Component to fetch and display committees
async function CommitteesList({ bossName }: { bossName: string }) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/committees/boss/${encodeURIComponent(bossName)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        next: { revalidate: 0 }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      return <EmptyState bossName={bossName} />;
    }
    
    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-sky-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-sky-50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-sky-600 mb-2" />
              <p className="text-3xl font-bold text-sky-700">{data.count}</p>
              <p className="text-sm text-gray-600 font-arabic">عدد اللجان</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-3xl font-bold text-green-700">
                {data.data.reduce((sum, c) => sum + (c.pdfCount || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 font-arabic">عدد الملفات</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <User className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-xl font-bold text-purple-700 font-arabic">
                {bossName}
              </p>
              <p className="text-sm text-gray-600 font-arabic">رئيس اللجنة</p>
            </div>
          </div>
        </div>

        {/* Committees Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((committee) => (
            <CommitteeCard 
              key={committee.id} 
              committee={committee} 
              apiUrl={API_BASE_URL} 
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching committees:', error);
    return <ErrorState error={error} />;
  }
}

//  Committee Card with proper typing

function CommitteeCard({ 
  committee, 
  apiUrl 
}: { 
  committee: CommitteeData; 
  apiUrl: string 
}) {
  return (
    <div className="border border-sky-100 rounded-xl p-5 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Header */}
      <div className="border-b pb-3 mb-3">
        <h3 className="font-bold font-arabic text-lg text-sky-700 mb-2">
          {committee.committeeTitle}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1 font-arabic">
            <FileText className="h-3 w-3" />
            {committee.committeeNo}
          </span>
          <span className="flex items-center gap-1 font-arabic">
            <Calendar className="h-3 w-3" />
            {committee.committeeDate}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm mb-3">
        <InfoRow label="رئيس اللجنة" value={committee.committeeBossName} />
        {committee.sex && <InfoRow label="الجنس" value={committee.sex} />}
        {committee.committeeCount !== null && (
          <InfoRow label="عدد الأعضاء" value={String(committee.committeeCount)} />
        )}
        {committee.user && <InfoRow label="المستخدم" value={committee.user.username} />}
        {committee.notes && (
          <div className="pt-2 border-t mt-2">
            <p className="text-xs text-gray-600 font-arabic line-clamp-2">
              <span className="font-semibold">ملاحظات:</span> {committee.notes}
            </p>
          </div>
        )}
      </div>

      {/* PDFs Section */}
      {/* PDFs Section */}
{committee.pdfs.length > 0 && (
  <div className="pt-3 border-t">
    <p className="text-xs font-semibold text-gray-700 mb-2 font-arabic flex items-center gap-1">
      <FileText className="h-3 w-3" />
      الملفات ({committee.pdfCount})
    </p>
    <div className="space-y-1">
      {committee.pdfs.map((pdfItem) => {
        return (
          <a 
            key={pdfItem.id}
            href={`${apiUrl}/api/committees/pdf/file/${pdfItem.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 bg-gray-50 hover:bg-sky-50 rounded text-xs transition-colors group"
          >
            <span className="text-red-600 font-arabic group-hover:text-sky-700">
              📄 PDF #{pdfItem.countPdf}
            </span>
            <span className="text-gray-500 font-arabic">
              {pdfItem.currentDate}
            </span>
          </a>
        );
      })}
    </div>
  </div>
)}
    </div>
  );
}



function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="font-arabic text-xs flex justify-between">
      <span className="font-semibold text-gray-700">{label}:</span>
      <span className="text-gray-600">{value}</span>
    </p>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border rounded-xl p-5 bg-white shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ bossName }: { bossName: string }) {
  return (
    <div className="text-center py-20">
      <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-arabic font-semibold text-gray-700 mb-2">
        لا توجد لجان
      </h3>
      <p className="text-gray-500 font-arabic">
        لم يتم العثور على أي لجان برئاسة {bossName}
      </p>
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="text-center py-20">
      <div className="text-red-400 mb-4">⚠️</div>
      <h3 className="text-xl font-arabic font-semibold text-red-700 mb-2">
        حدث خطأ
      </h3>
      <p className="text-gray-600 font-arabic">
        حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-500 mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { bossName } = await params;
  const decodedBossName = decodeURIComponent(bossName);
  
  return {
    title: `لجان الرئيس ${decodedBossName} | نظام اللجان`,
    description: `عرض تفصيلي لجميع اللجان برئاسة ${decodedBossName}`,
  };
}