"use client";

import ArabicDatePicker from "@/components/DatePicker/ArabicDatePicker";
import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { CommitteeReportData } from "./types";
import { buildQueryString, formatArabicDate } from "./utils";

export default function CommitteeReportForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CommitteeReportData>({
    committeeDate_from: "",
    committeeDate_to: "",
  });

  const handleStartDateChange = useCallback((value: string) => {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      toast.error("يرجى إدخال التاريخ بصيغة YYYY-MM-DD");
      return;
    }
    setFormData((prev) => ({ ...prev, committeeDate_from: value }));
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      toast.error("يرجى إدخال التاريخ بصيغة YYYY-MM-DD");
      return;
    }
    setFormData((prev) => ({ ...prev, committeeDate_to: value }));
  }, []);

  const openPrintReport = useCallback(() => {
    try {
      setLoading(true);

      if (!formData.committeeDate_from || !formData.committeeDate_to) {
        toast.error("يرجى إدخال تاريخ البدء وتاريخ الانتهاء");
        return;
      }

      // Validate date range
      const startDate = new Date(formData.committeeDate_from);
      const endDate = new Date(formData.committeeDate_to);
      if (startDate > endDate) {
        toast.error("تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية");
        return;
      }

      const queryString = buildQueryString(formData);
      const printUrl = `/print/report?${queryString}`;
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

  const resetForm = () => {
    setFormData({ committeeDate_from: "", committeeDate_to: "" });
  };

  return (
    <>
      {/* Date Filters */}
      <div className="mb-6">
        <label className="block text-lg font-extrabold text-gray-700 mb-2">تحديد التقرير بين تاريخين</label>
        <div className="flex gap-4">
          <ArabicDatePicker
            selected={formData.committeeDate_from}
            onChange={handleStartDateChange}
            label="تاريخ البدء (من)"
          />
          <ArabicDatePicker
            selected={formData.committeeDate_to}
            onChange={handleEndDateChange}
            label="تاريخ الانتهاء (إلى)"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col mt-4 gap-4">
        <button
          onClick={openPrintReport}
          disabled={loading || !formData.committeeDate_from || !formData.committeeDate_to}
          className={`w-full py-3 px-6 rounded-md flex items-center justify-center gap-2 font-extrabold transition-colors ${
            loading || !formData.committeeDate_from || !formData.committeeDate_to
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
          {loading ? "جاري التحميل..." : "معاينة التقرير"}
        </button>

        <button
          onClick={resetForm}
          disabled={loading}
          className="px-6 py-3 border font-extrabold border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
        >
          إعادة تعيين
        </button>
      </div>

      {/* Form Summary */}
      {formData.committeeDate_from && formData.committeeDate_to && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
          <p>
            <strong>من:</strong>{' '}
            <span className="font-bold">{formatArabicDate(formData.committeeDate_from)}</span>
          </p>
          <p>
            <strong>إلى:</strong>{' '}
            <span className="font-bold">{formatArabicDate(formData.committeeDate_to)}</span>
          </p>
        </div>
      )}
    </>
  );
}