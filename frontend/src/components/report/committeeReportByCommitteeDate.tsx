"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { TiPrinter } from "react-icons/ti";
import styles from "./CommitteeReportTable.module.css"; // Assume you create this CSS module
import { CommitteeRecord } from "./types";
import { formatArabicDate } from "./utils";

export default function CommitteePrintReportPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CommitteeRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
        setData(result || []);
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

  const currentDate = new Date("2025-09-12").toLocaleDateString("ar-EG"); // Hardcoded as per prompt

  return (
    <div dir="rtl" className={`${styles.container} max-w-7xl mx-auto p-6 font-sans bg-white`}>
      <div className="flex items-center justify-between mb-6 w-full px-4">
        {/* Right: Title */}
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">إدارة اللجان</h1>
        </div>
        {/* Center: Report Title */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-gray-800">
            تقرير اللجان بين {formatArabicDate(committeeDate_from || "")} و {formatArabicDate(committeeDate_to || "")}
            <br />
            <small>تاريخ التقرير: {currentDate}</small>
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
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[100px]">عدد الجنس لكل لجنة</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[150px]">الملاحظات</th>
                <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[100px]">تاريخ الإنشاء</th>
                {/* <th className="border border-gray-400 p-2 text-lg font-extrabold min-w-[100px]">المستخدم</th> */}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id} className="text-center even:bg-gray-100">
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2">{index + 1}</td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[80px] max-w-[100px] overflow-hidden text-ellipsis whitespace-wrap break-words">
                    {item.committeeNo}
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
                    {item.committeeCount}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[60px]">
                    {item.sex}
                  </td>
                  <td className="border border-gray-400 text-lg font-serif font-bold p-2 min-w-[100px]">
                    {item.sexCountPerCommittee}
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
          </table>
        </div>
      )}
    </div>
  );
}