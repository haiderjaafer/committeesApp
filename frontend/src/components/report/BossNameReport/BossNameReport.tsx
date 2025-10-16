"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { TiPrinter } from "react-icons/ti";
import "./BossNameReport.css";

interface CommitteeReportData {
  id: number;
  committeeNo: string;
  committeeDate: string | null;
  committeeTitle: string;
  committeeBossName: string;
  sex: string | null;
  committeeCount: number | null;
  notes: string | null;
  currentDate: string | null;
  userID: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  bossName: string;
  count: number;
  reportDate: string;
  statistics?: {
    totalCommittees: number;
    totalMembers: number;
    maleCount: number;
    femaleCount: number;
    dateRange?: {
      earliest: string | null;
      latest: string | null;
    };
  };
  data: CommitteeReportData[];
}

// ✅ Format date as yyyy-MM-dd
const formatDateSimple = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    // If already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Parse and format to yyyy-MM-dd
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

// ✅ Get current date as yyyy-MM-dd
const getCurrentDateSimple = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export default function BossNameReportPage() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bossName = searchParams.get("bossName");

  useEffect(() => {
    const fetchData = async () => {
      if (!bossName) {
        setError("لم يتم تحديد رئيس اللجنة");
        setLoading(false);
        return;
      }

      try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/committees/reportBasedOnBossName/${encodeURIComponent(bossName)}`;
        
        console.log("Fetching report from:", url);
        
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result: ApiResponse = await res.json();
        console.log("Report data received:", result);
        
        if (!result.success) {
          throw new Error(result.message || "فشل في جلب البيانات");
        }

        setReportData(result);
      } catch (error) {
        console.error("Error fetching boss name report:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bossName]);

  const handlePrint = () => window.print();
  const cancelPrint = () => window.close();

  // ✅ Current date in yyyy-MM-dd format
  const currentDate = getCurrentDateSimple();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-gray-500 text-xl">جاري التحميل...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || "حدث خطأ"}</p>
          <button
            onClick={cancelPrint}
            className="bg-red-700 text-white font-extrabold px-6 py-3 rounded-lg hover:bg-red-500"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }





  return (


    <div dir="rtl" className="max-w-7xl mx-auto p-6 font-sans bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 w-full px-4">
        {/* Right: Title */}
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-serif font-bold text-gray-800">شعبة الاجازات</h1>
          <h1 className="text-2xl font-serif font-bold text-gray-800">تقرير حسب رئيس اللجنة</h1>
        </div>
        
        {/* Center: Report Title */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-gray-800">
            تقرير اللجان برئاسة
            <br />
            <span className="text-blue-700">{reportData.bossName}</span>
            <br />
            {/*  Date in yyyy-MM-dd format */}
            <small className="text-base text-gray-600">
              تاريخ التقرير: <span dir="ltr">{currentDate}</span> 
            </small>
          </h1>
        </div>
        
        {/* Left: Logo */}
        <div>
          <Image src="/slogan.gif" alt="Logo" width={80} height={80} />
        </div>
      </div>

      {/* Print Buttons */}
      <div className="absolute top-4 left-4 z-50 flex gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-red-700 flex items-center gap-x-1 text-white font-extrabold px-4 py-2 rounded-lg hover:bg-red-500"
        >
          <TiPrinter size={25} /> طباعة
        </button>
        <button
          onClick={cancelPrint}
          className="bg-red-700 text-white font-extrabold px-4 py-2 rounded-lg hover:bg-red-500"
        >
          إلغاء
        </button>
      </div>

      {/* Statistics Summary */}
      {reportData.statistics && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg print:bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded shadow">
              <p className="text-sm text-gray-600">إجمالي اللجان</p>
              <p className="text-2xl font-bold text-blue-700">{reportData.statistics.totalCommittees}</p>
            </div>
            <div className="p-3 bg-white rounded shadow">
              <p className="text-sm text-gray-600">إجمالي الأعضاء</p>
              <p className="text-2xl font-bold text-green-700">{reportData.statistics.totalMembers}</p>
            </div>
            <div className="p-3 bg-white rounded shadow">
              <p className="text-sm text-gray-600">لجان ذكور</p>
              <p className="text-2xl font-bold text-purple-700">{reportData.statistics.maleCount}</p>
            </div>
            <div className="p-3 bg-white rounded shadow">
              <p className="text-sm text-gray-600">لجان إناث</p>
              <p className="text-2xl font-bold text-pink-700">{reportData.statistics.femaleCount}</p>
            </div>
          </div>
          {/* ✅ Date range in yyyy-MM-dd format */}
          {reportData.statistics.dateRange && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>
                <strong>الفترة الزمنية:</strong> من {formatDateSimple(reportData.statistics.dateRange.earliest)} 
                {' '}إلى {formatDateSimple(reportData.statistics.dateRange.latest)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Report Table */}
      {reportData.data.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">لا توجد لجان مسجلة لهذا الرئيس</p>
      ) : (
        <div className="max-w-[1200px] mx-auto bg-white p-6 font-sans">
          <table className="w-full border-collapse text-sm table-auto">
            <thead>
              <tr className="bg-blue-100 text-center">
                <th className="border border-gray-400 p-2 text-lg font-extrabold">ت</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[80px]">رقم اللجنة</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[112px]">تاريخ اللجنة</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[150px]">اسم اللجنة</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[120px]">رئيس اللجنة</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[80px]">عدد الأعضاء</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[60px]">الجنس</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[150px]">الملاحظات</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[100px]">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((item, index) => (
                <tr key={item.id} className="text-center even:bg-gray-100">
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2">
                    {index + 1}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[80px] break-words">
                    {item.committeeNo}
                  </td>
                  {/* ✅ Committee date in yyyy-MM-dd */}
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[112px]">
                    {formatDateSimple(item.committeeDate)}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[150px] break-words">
                    {item.committeeTitle}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[120px] break-words">
                    {item.committeeBossName}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[80px]">
                    {item.committeeCount || "-"}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[60px]">
                    {item.sex || "-"}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[150px] break-words whitespace-pre-wrap align-top">
                    {item.notes || "-"}
                  </td>
                  {/* ✅ Current date in yyyy-MM-dd */}
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[100px]">
                    {formatDateSimple(item.currentDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Footer */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded">
            <p className="text-center font-extrabold ">
              إجمالي عدد اللجان: <span className="text-blue-700">{reportData.count}</span>
            </p>
          </div>
        </div>
      )}
    </div>

    
  );

}
