"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import CommitteeBossNameComoboxComponent from "../CommitteeBossNameComoboxComponent";
import {  buildQueryStringBossName } from "../report/utils";

//  Define proper interface for form data
export interface BossNameFormData {
  bossName: string;
}

export default function BossNameReportFormSelection() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BossNameFormData>({
    bossName: "",
  });


  const handleBossNameChange = useCallback((value: string) => {
    console.log("Boss name selected:", value);
    setFormData((prev) => ({ ...prev, bossName: value }));
  }, []);


  const queryString = buildQueryStringBossName(formData);

  //  Open print report with boss name
  const openPrintReport = useCallback(() => {
    try {
      setLoading(true);

      // Validate boss name
      if (!formData.bossName || formData.bossName.trim() === "") {
        toast.error("يرجى اختيار رئيس اللجنة");
        setLoading(false);
        return;
      }






      const printUrl = `/print/bossNameReport?${queryString}`;
      console.log("Opening print URL:", printUrl);

      const width = 1000;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,noopener,noreferrer`;
      const printWindow = window.open(printUrl, "_blank", features);

      if (!printWindow || printWindow.closed || typeof printWindow.closed === "undefined") {
        const fallback = document.createElement("a");
        fallback.href = printUrl;
        fallback.target = "_blank";
        fallback.rel = "noopener noreferrer";
        document.body.appendChild(fallback);
        fallback.click();
        document.body.removeChild(fallback);
      } else {
        printWindow.focus();
      }
    } catch (error) {
      console.error("Error opening print report:", error);
      toast.error("حدث خطأ أثناء فتح تقرير الطباعة");
    } finally {
      setLoading(false);
    }
  }, [formData]);

  //  Reset form
  const resetForm = useCallback(() => {
    setFormData({ bossName: "" });
    toast.info("تم إعادة تعيين النموذج");
  }, []);

 

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-sky-700 font-arabic">
        تقرير اللجان حسب رئيس اللجنة
      </h2>

      {/* Boss Name Selection */}
      <div className="mb-6">
        <label className="block font-extrabold text-gray-700 mb-2 text-right font-arabic">
          رئيس اللجنة
        </label>
        <CommitteeBossNameComoboxComponent
          value={formData.bossName}
          onChange={handleBossNameChange}
          fetchUrl={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/committees/getAllCommitteeBossName`}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
       
   

        {/* Print Report Button */}
        <button
          onClick={openPrintReport}
          disabled={loading || !formData.bossName}
          className={`w-full py-3 px-6 rounded-md flex items-center justify-center gap-2 font-extrabold transition-colors font-arabic ${
            loading || !formData.bossName
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-orange-600 text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          {loading ? "جاري التحميل..." : "طباعة التقرير"}
        </button>

        {/* Reset Button */}
        <button
          onClick={resetForm}
          disabled={loading}
          className="w-full px-6 py-3 border font-extrabold font-arabic border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
        >
          إعادة تعيين
        </button>
      </div>

      {/* Form Summary */}
      {formData.bossName && (
        <div className="mt-6 p-4 bg-sky-50 rounded-md border border-sky-200">
          <p className="text-sm text-gray-700 font-arabic text-right">
            <strong className="text-sky-700">رئيس اللجنة المختار:</strong>{' '}
            <span className="font-bold text-gray-900">{formData.bossName}</span>
          </p>
        </div>
      )}
    </div>
  );
}