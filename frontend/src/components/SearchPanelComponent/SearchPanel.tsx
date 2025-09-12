"use client";
import { useCallback, useMemo, useState } from "react";
import CommitteeNoComboboxComponent from "../CommitteeNoComboboxComponent";
import CommitteeTitleComboboxComponent from "../CommitteeTitleComboboxComponent";
import CommitteeBossNameComoboxComponent from "../CommitteeBossNameComoboxComponent";
import ArabicDatePicker from "../DatePicker/ArabicDatePicker";
import { Button } from "../ui/button";
import { CircleOff, Search } from "lucide-react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { CommitteeDataTable, HeaderMap } from "../DynamicTableTanStack/types";
import { toast } from "react-toastify";

const DynamicTable = dynamic(() => import("@/components/DynamicTableTanStack/DynamicTableWithPagination"), {
  ssr: false,
  loading: () => <div>Loading table...</div>,
});

interface ApiResponse {
  data: CommitteeDataTable[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Update CommitteeDataTable to include serialNo
// interface CommitteeDataTable {
//   serialNo: number;
//   id: number;
//   committeeNo: string;
//   committeeDate: string | null;
//   committeeTitle: string;
//   committeeBossName: string;
//   committeeCount: number;
//   sex: string;
//   sexCountPerCommittee: number;
//   notes: string;
//   currentDate: string | null;
//   userID: number;
//   username: string;
//   pdfFiles: Array<{
//     id: number;
//     pdf: string;
//     currentDate: string | null;
//     username: string;
//   }>;
// }

interface Filters {
  committeeNo: string;
  committeeTitle: string;
  committeeBossName: string;
  committeeDate_from: string;
  committeeDate_to: string;
}

const FILTER_FIELDS = {
  committeeNo: "committeeNo",
  committeeTitle: "committeeTitle",
  committeeBossName: "committeeBossName",
  committeeDate_from: "committeeDate_from",
  committeeDate_to: "committeeDate_to",
} as const;

const SearchPanel = () => {
  const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || "", []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); // Match Postman test
  const [pendingFilters, setPendingFilters] = useState<Filters>({
    committeeNo: "",
    committeeTitle: "",
    committeeBossName: "",
    committeeDate_from: "",
    committeeDate_to: "",
  });

  const [activeFilters, setActiveFilters] = useState<Filters>({
    committeeNo: "",
    committeeTitle: "",
    committeeBossName: "",
    committeeDate_from: "",
    committeeDate_to: "",
  });

  // Handle search
  const handleSearch = useCallback(() => {
    console.log("handleSearch triggered with pendingFilters:", pendingFilters);
    // Validate date range
    if (pendingFilters.committeeDate_from && pendingFilters.committeeDate_to) {
      const startDate = new Date(pendingFilters.committeeDate_from);
      const endDate = new Date(pendingFilters.committeeDate_to);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error("تنسيق التاريخ غير صالح. استخدم YYYY-MM-DD");
        return;
      }
      if (startDate > endDate) {
        toast.error("تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية");
        return;
      }
    }
    setActiveFilters(pendingFilters);
    setPage(1);
  }, [pendingFilters]);

  // Handle reset
  const handleReset = useCallback(() => {
    console.log("handleReset triggered");
    setPendingFilters({
      committeeNo: "",
      committeeTitle: "",
      committeeBossName: "",
      committeeDate_from: "",
      committeeDate_to: "",
    });
    setActiveFilters({
      committeeNo: "",
      committeeTitle: "",
      committeeBossName: "",
      committeeDate_from: "",
      committeeDate_to: "",
    });
    setPage(1);
    setLimit(20);
  }, []);

  // Handle filter updates
  const handleSelect = useCallback((field: keyof Filters, value: string) => {
    console.log(`handleSelect: ${field} = ${value}`);
    setPendingFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle date changes
  const handleDateChange = useCallback((field: keyof Filters, value: string) => {
    console.log(`handleDateChange: ${field} = ${value}`);
    setPendingFilters((prev) => ({
      ...prev,
      [field]: value || "",
    }));
  }, []);

  // Memoized query parameters
  const queryParams = useMemo(() => {
    const params: Partial<Filters & { page: number; limit: number }> = { page, limit };
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        params[key as keyof Filters] = value;
      }
    });
    console.log("queryParams:", params);
    return params;
  }, [activeFilters, page, limit]);

  // Fetch function for API
  const fetchCommitteeData = useCallback(
    async (filterType: keyof Filters | "all") => {
      console.log("fetchCommitteeData called with filterType:", filterType);
      try {
        const endpoint = `${API_BASE_URL}/api/committees/getAllCommitteeNoBYQueryParams`;
        const params: Partial<Filters & { page: number; limit: number }> = { page, limit };

        // Independent search based on filter type
        if (filterType !== "all") {
          if (filterType === "committeeDate_from" || filterType === "committeeDate_to") {
            if (activeFilters.committeeDate_from && activeFilters.committeeDate_to) {
              params.committeeDate_from = activeFilters.committeeDate_from;
              params.committeeDate_to = activeFilters.committeeDate_to;
            } else {
              console.log("No date range provided, fetching all records");
              // Allow fetching all records when no date range is provided
            }
          } else if (activeFilters[filterType]) {
            params[filterType] = activeFilters[filterType];
          } else {
            console.log(`No value for ${filterType}, fetching all records`);
            // Allow fetching all records when no filter value is provided
          }
        } else {
          Object.assign(params, queryParams);
        }

        console.log("API call with params:", params);
        const response = await axios.get<ApiResponse>(endpoint, {
          params,
          timeout: 10000,
        });
        console.log("API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
    [API_BASE_URL, queryParams, page, limit, activeFilters]
  );

  // Memoized query keys
  const queryKeys = useMemo(
    () => ({
      committeeNo: ["committeeNo", activeFilters.committeeNo, page, limit],
      committeeTitle: ["committeeTitle", activeFilters.committeeTitle, page, limit],
      committeeBossName: ["committeeBossName", activeFilters.committeeBossName, page, limit],
      committeeDate_from: [
        "committeeDate",
        activeFilters.committeeDate_from,
        activeFilters.committeeDate_to,
        page,
        limit,
      ],
      committeeDate_to: [
        "committeeDate",
        activeFilters.committeeDate_from,
        activeFilters.committeeDate_to,
        page,
        limit,
      ],
      all: ["allFilters", queryParams],
    }),
    [activeFilters, queryParams, page, limit]
  );

  // Determine active filter type
  const activeFilterType = useMemo((): keyof Filters | "all" => {
    if (activeFilters.committeeNo) return "committeeNo";
    if (activeFilters.committeeTitle) return "committeeTitle";
    if (activeFilters.committeeBossName) return "committeeBossName";
    if (activeFilters.committeeDate_from && activeFilters.committeeDate_to) return "committeeDate_from";
    return "all";
  }, [activeFilters]);

  // React Query
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: queryKeys[activeFilterType],
    queryFn: () => fetchCommitteeData(activeFilterType),
    enabled: true, // Always fetch, even with no filters
    staleTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    console.log("handlePageChange:", newPage);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle rows per page change
  const handleLimitChange = useCallback((newLimit: number) => {
    console.log("handleLimitChange:", newLimit);
    if (newLimit >= 1 && newLimit <= 100) {
      setLimit(newLimit);
      setPage(1);
    }
  }, []);

  // Error handling
  if (error) {
    console.error("Query error:", error);
    return <div className="text-red-500 text-center">Error loading data: {(error as Error).message}</div>;
  }

  // Update orderHeaderMap to include serialNo
  // const updatedHeaderMap = useMemo(
  //   () => ({
  //     ...orderHeaderMap,
  //     serialNo: "الرقم التسلسلي",
  //   }),
  //   []
  // );

  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 font-arabic w-full max-w-full mx-auto text-right mt-3">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <div className="flex flex-col">
          <label className="font-extrabold text-gray-700">رقم اللجنة</label>
          <CommitteeNoComboboxComponent
            value={pendingFilters.committeeNo}
            onChange={(value) => handleSelect(FILTER_FIELDS.committeeNo, value)}
            fetchUrl={`${API_BASE_URL}/api/committees/getAllCommitteeNo`}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-extrabold text-gray-700">اسم اللجنة</label>
          <CommitteeTitleComboboxComponent
            value={pendingFilters.committeeTitle}
            onChange={(value) => handleSelect(FILTER_FIELDS.committeeTitle, value)}
            fetchUrl={`${API_BASE_URL}/api/committees/getAllCommitteeTitle`}
          />
        </div>
        <div className="flex flex-col">
          <label className="font-extrabold text-gray-700">رئيس اللجنة</label>
          <CommitteeBossNameComoboxComponent
            value={pendingFilters.committeeBossName}
            onChange={(value) => handleSelect(FILTER_FIELDS.committeeBossName, value)}
            fetchUrl={`${API_BASE_URL}/api/committees/getAllCommitteeBossName`}
          />
        </div>
      </div>

      {/* Date Pickers */}
      <div className="flex flex-col sm:flex-row gap-1 mt-6 sm:justify-start">
        <div className="text-right w-full sm:w-64">
          <label htmlFor="committeeDateFrom" className="block font-extrabold text-gray-700 mb-1">
            تاريخ اللجنة (من)
          </label>
          <ArabicDatePicker
            selected={pendingFilters.committeeDate_from}
            onChange={(dateString) => handleDateChange(FILTER_FIELDS.committeeDate_from, dateString)}
            label="تاريخ اللجنة (من)"
          />
        </div>
        <div className="text-right w-full sm:w-64">
          <label htmlFor="committeeDateTo" className="block font-extrabold text-gray-700 mb-1">
            تاريخ اللجنة (إلى)
          </label>
          <ArabicDatePicker
            selected={pendingFilters.committeeDate_to}
            onChange={(dateString) => handleDateChange(FILTER_FIELDS.committeeDate_to, dateString)}
            label="تاريخ اللجنة (إلى)"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full flex flex-col sm:flex-row justify-center mt-4 sm:mt-9 gap-2 sm:gap-4">
        <Button
          className="bg-sky-600 hover:bg-sky-700 w-full sm:w-32 md:w-36 lg:w-40 py-2 sm:py-2.5 text-sm sm:text-base font-extrabold focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
          onClick={handleSearch}
          disabled={isLoading}
        >
          <span className="flex items-center justify-center">
            <Search className="ml-2 h-5 w-5" /> بحث
          </span>
        </Button>
        <Button
          className="bg-gray-600 hover:bg-gray-700 w-full sm:w-32 md:w-36 lg:w-40 py-2 sm:py-2.5 text-sm sm:text-base font-extrabold focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          onClick={handleReset}
        >
          <span className="flex items-center justify-center">
            <CircleOff className="ml-2 h-5 w-5" /> إلغاء
          </span>
        </Button>
      </div>

      {/* Table */}
      <AnimatePresence>
        {isLoading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mt-4">
            جارٍ التحميل...
          </motion.div>
        ) : data?.data.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mt-4">
            لا توجد نتائج للعرض
          </motion.div>
        ) : (
          <DynamicTable
            data={data?.data || []}
            headerMap={HeaderMap} // Use updated header map with serialNo
            excludeFields={["pdfFiles", "userID"]}
            pagination={{
              page: data?.page || 1,
              limit: data?.limit || 20,
              total: data?.total || 0,
              totalPages: data?.totalPages || 1,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPanel;