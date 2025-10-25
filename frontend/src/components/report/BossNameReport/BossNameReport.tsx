"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { TiPrinter } from "react-icons/ti";
import "./BossNameReport.css";

interface Employee {
  empID: number;
  name: string;
  employee_desc: number;
  gender: number | null;
  genderName: string | null;
}

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
  employees: Employee[];
  employeeCount: number;
}

interface Statistics {
  totalCommittees: number;
  totalEmployees: number;
  maleCommittees: number;
  femaleCommittees: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  bossName: string;
  count: number;
  reportDate: string;
  totalEmployees: number;
  statistics: Statistics;
  data: CommitteeReportData[];
}

const formatDateSimple = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

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
        
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result: ApiResponse = await res.json();
        
        if (!result.success) {
          throw new Error(result.message || "فشل في جلب البيانات");
        }

        setReportData(result);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError(error instanceof Error ? error.message : "حدث خطأ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bossName]);

  const handlePrint = () => window.print();
  const cancelPrint = () => window.close();

  const currentDate = getCurrentDateSimple();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl font-arabic">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-red-600 text-xl mb-4 font-arabic">{error || "حدث خطأ"}</p>
          <button onClick={cancelPrint} className="bg-red-700 text-white font-extrabold px-6 py-3 rounded-lg">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="max-w-[1400px] mx-auto p-6 font-sans bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 w-full px-4">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-serif font-bold text-gray-800">شعبة الاجازات واللجان</h2>
          <h1 className="text-2xl font-serif font-bold text-gray-800">تقرير حسب رئيس اللجنة</h1>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-gray-800">
            تقرير اللجان برئاسة
            <br />
            <span className="text-blue-700">{reportData.bossName}</span>
            <br />
            <small className="text-base text-gray-600">
              تاريخ التقرير: <span dir="ltr">{currentDate}</span> 
            </small>
          </h1>
        </div>
        
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

      {/*  FIXED: Compact Statistics - No page break */}
      {reportData.statistics && (
        <div className="mb-4 print:mb-3">
          <h3 className="text-lg font-extrabold text-center text-blue-800 mb-2 font-arabic print:text-base">احصائيات الاعضاء</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-blue-50 rounded border border-blue-300 print:border print:bg-white">
              <p className="text-xs text-gray-600 font-arabic">إجمالي اللجان</p>
              <p className="text-2xl font-bold text-blue-700 print:text-xl">{reportData.statistics.totalCommittees}</p>
            </div>
            <div className="p-2 bg-green-50 rounded border border-green-300 print:border print:bg-white">
              <p className="text-xs text-gray-600 font-arabic">إجمالي الأعضاء</p>
              <p className="text-2xl font-bold text-green-700 print:text-xl">{reportData.statistics.totalEmployees}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded border border-purple-300 print:border print:bg-white">
              <p className="text-xs text-gray-600 font-arabic">لجان ذكور</p>
              <p className="text-2xl font-bold text-purple-700 print:text-xl">{reportData.statistics.maleCommittees}</p>
            </div>
            <div className="p-2 bg-pink-50 rounded border border-pink-300 print:border print:bg-white">
              <p className="text-xs text-gray-600 font-arabic">لجان إناث</p>
              <p className="text-2xl font-bold text-pink-700 print:text-xl">{reportData.statistics.femaleCommittees}</p>
            </div>
          </div>
        </div>
      )}

   {/* Report Table */}
      {!reportData.data || reportData.data.length === 0 ? (
        <p className="text-center text-gray-500 text-lg font-arabic">لا توجد لجان مسجلة لهذا الرئيس</p>
      ) : (
        <div className="max-w-full mx-auto bg-white">
          {reportData.data.map((committee, index) => (
            //  FIXED: Wrap entire committee in a container that prevents page breaks
            <div key={committee.id} className="committee-group mb-6 print:mb-4">
              
              {/*  Committee Header + Main Table - Keep Together */}
              <div className="committee-header-and-table">
                {/* Committee Header */}
                <div className="bg-blue-600 text-white p-2 rounded-t print:bg-blue-600 print:rounded-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-blue-600 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-base font-bold font-arabic">
                        لجنة رقم: {committee.committeeNo}
                      </span>
                    </div>
                    <span className="text-sm">
                      الأعضاء: <span className="font-bold">{committee.employeeCount}</span>
                    </span>
                  </div>
                </div>

                {/* Main Committee Table */}
                <table className="w-full border-collapse text-sm mb-3">
                  <thead>
                    <tr className="bg-blue-100 text-center print:bg-blue-100">
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">رقم اللجنة</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">التاريخ</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">عنوان اللجنة</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">رئيس اللجنة</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">العدد</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">الجنس</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">الملاحظات</th>
                      <th className="border border-gray-400 p-1.5 text-sm font-extrabold">تاريخ الإنشاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-center">
                      <td className="border border-gray-400 text-sm font-bold p-1.5">{committee.committeeNo}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5">{formatDateSimple(committee.committeeDate)}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5 text-right">{committee.committeeTitle}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5">{committee.committeeBossName}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5">{committee.committeeCount || "-"}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5">{committee.sex || "-"}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5 text-right">{committee.notes || "-"}</td>
                      <td className="border border-gray-400 text-sm font-bold p-1.5">{formatDateSimple(committee.currentDate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/*  Employees Table - Keep with header if possible */}
              {committee.employees && committee.employees.length > 0 ? (
                <div className="mr-3">
                  <div className="bg-green-100 p-1.5 font-bold text-green-800 text-center text-sm border border-green-400 print:bg-green-100">
                    أعضاء اللجنة ({committee.employeeCount} عضو)
                  </div>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-green-50 text-center print:bg-green-50">
                        <th className="border border-gray-400 p-1 text-xs font-extrabold w-[40px]">ت</th>
                        <th className="border border-gray-400 p-1 text-xs font-extrabold">الاسم الكامل</th>
                        <th className="border border-gray-400 p-1 text-xs font-extrabold w-[90px]">معرف الموظف</th>
                        <th className="border border-gray-400 p-1 text-xs font-extrabold w-[90px]">رقم الموظف</th>
                        <th className="border border-gray-400 p-1 text-xs font-extrabold w-[70px]">الجنس</th>
                      </tr>
                    </thead>
                    <tbody>
                      {committee.employees.map((employee, empIndex) => (
                        <tr key={employee.empID} className="text-center even:bg-gray-50">
                          <td className="border border-gray-400 text-xs font-bold p-1">{empIndex + 1}</td>
                          <td className="border border-gray-400 text-xs font-bold p-1 text-right">{employee.name}</td>
                          <td className="border border-gray-400 text-xs font-bold p-1 text-green-600">{employee.empID}</td>
                          <td className="border border-gray-400 text-xs font-bold p-1 text-blue-600">{employee.employee_desc}</td>
                          <td className="border border-gray-400 text-xs font-bold p-1">{employee.genderName || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mr-3 p-2 bg-gray-100 text-center text-xs border border-gray-300 print:bg-gray-100">
                  <p className="font-arabic">لا يوجد أعضاء</p>
                </div>
              )}

              {/* Separator - Allow page break here */}
              {index < reportData.data.length - 1 && (
                <div className="border-t-2 border-blue-300 my-4 print:border-t print:page-break-after-auto"></div>
              )}
            </div>
          ))}

       
        </div>
      )}
    </div>
  );
}