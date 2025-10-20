"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { TiPrinter } from "react-icons/ti";
import styles from "./CommitteeReportTable.module.css"; // Assume you create this CSS module
import { CommitteeRecord } from "./types";
import { formatArabicDate } from "./utils";


// ✅ Check if value is null, undefined, empty string, or "null"/"undefined" string
const isEmptyValue = (value: any): boolean => {
  return (
    value === null || 
    value === undefined || 
    value === '' || 
    value === 'null' || 
    value === 'Null' || 
    value === 'NULL' ||
    value === 'undefined' ||
    (typeof value === 'string' && value.trim() === '')
  );
};

//  Safe display helper - returns "-" for empty values
const safeDisplay = (value: any): string => {
  return isEmptyValue(value) ? "-" : String(value);
};

// //  Updated formatDateSimple with null checking
// const formatDateSimple = (dateString: string | null | undefined): string => {
//   if (isEmptyValue(dateString)) return "-";
  
//   try {
//     // If already in yyyy-MM-dd format, return as is
//     if (/^\d{4}-\d{2}-\d{2}$/.test(dateString!)) {
//       return dateString!;
//     }
    
//     // Parse and format to yyyy-MM-dd
//     const date = new Date(dateString!);
    
//     // Check if date is valid
//     if (isNaN(date.getTime())) {
//       return "-";
//     }
    
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
    
//     return `${year}-${month}-${day}`;
//   } catch {
//     return "-";
//   }
// };

export default function CommitteePrintReportPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CommitteeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [count ,setCount] = useState<number>(0);
  // Get query parameters
  const committeeDate_from = searchParams.get("committeeDate_from");
  const committeeDate_to = searchParams.get("committeeDate_to");

  useEffect(() => {
    const fetchData = async () => {
      if (!committeeDate_from || !committeeDate_to) return;

      try {
         const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/committees/report`);
       
        url.searchParams.append("committeeDate_from", committeeDate_from);
        url.searchParams.append("committeeDate_to", committeeDate_to);

        const res = await fetch(url.toString());
        
        if (!res.ok) throw new Error("Failed to fetch report");
        const result = await res.json();
        console.log("result..." + result);
        setData(result.data || []);
        setCount(result.count || 0);

      } catch (error) {
        console.error("Error fetching committee report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [committeeDate_from, committeeDate_to]);

  const handlePrint = () => window.print();
  const cancelPrint = () => window.close();

  const getCurrentDateSimple = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};


const currentDate = getCurrentDateSimple();

  return (
    <div dir="rtl" className={`${styles.container} max-w-7xl mx-auto p-6 font-sans bg-white`}>
      <div className="flex items-center justify-between mb-6 w-full px-4">
        {/* Right: Title */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-serif font-bold text-gray-800">شعبة الاجازات</h1>
          <h1 className="text-2xl font-serif font-bold text-gray-800">تقرير اللجان</h1>
        </div>
        {/* Center: Report Title */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-gray-800">
            تقرير اللجان بين {formatArabicDate(committeeDate_from || "")} و {formatArabicDate(committeeDate_to || "")}
            <br />
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

      <div className="absolute top-4 left-4 z-50 flex gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-red-700 flex items-center gap-x-1 text-white font-extrabold px-2 py-2 rounded-lg hover:bg-red-500"
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

      {loading ? (
        <p className="text-center text-gray-500 text-lg">جاري التحميل...</p>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">لا توجد بيانات مطابقة</p>
      ) : (
        <div className="max-w-[1200px] mx-auto bg-white p-6 font-sans direction-rtl">
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
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[100px]">تاريخ الادخال</th>
                {/* <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[100px]">المستخدم</th> */}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id} className="text-center even:bg-gray-100">
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2">{index + 1}</td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[80px] max-w-[100px] overflow-hidden text-ellipsis whitespace-wrap break-words">
                   {safeDisplay(item.committeeNo)}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[112px]">
                    {formatArabicDate(item.committeeDate)}
                         

                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[150px] break-words">
                    {item.committeeTitle}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[120px] break-words">
                    {item.committeeBossName}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[80px]">
                    {safeDisplay(item.committeeCount)}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[60px]">
                    {safeDisplay(item.sex)}
                  </td>
                 
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[150px] break-words whitespace-pre-wrap align-top">
                    {item.notes}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[100px]">
                    {formatArabicDate(item.currentDate)}
                  </td>
                  {/* <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[100px]">
                    {item.username}
                  </td> */}
                </tr>
              ))}
            </tbody>
<tfoot>
  <tr className="bg-gray-300">
   
    <td
      colSpan={8}
      className="border border-gray-400 text-lg font-extrabold text-center p-2"
    >
      المجموع
    </td>

    
    <td
      className="border border-gray-400 text-lg font-extrabold text-center p-2"
    >
      {count}
    </td>
  </tr>
</tfoot>


          </table>
        </div>
      )}
    </div>
  );
}