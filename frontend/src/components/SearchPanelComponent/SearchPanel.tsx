"use client";
import { useCallback, useMemo, useState } from "react";
import CommitteeNoComboboxComponent from "../CommitteeNoComboboxComponent";
import { Button } from "../ui/button";
import { CircleOff, Search } from "lucide-react";
import axios from "axios";
import { AnimatePresence, motion } from 'framer-motion';
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { CommitteeDataTable, orderHeaderMap } from "../DynamicTableTanStack/types";
import CommitteeTitleComboboxComponent from "../CommitteeTitleComboboxComponent";
import CommitteeBossNameComoboxComponent from "../CommitteeBossNameComoboxComponent";
import ArabicDatePicker from "../DatePicker/ArabicDatePicker";
import { toast } from "react-toastify";

const DynamicTable = dynamic(() => import('@/components/DynamicTableTanStack/DynamicTableWithPagination'), {
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

 interface Filters {
  
  committeeNo: string; // Add this line
  committeeTitle: string;
  committeeBossName: string;
  committeeDate_from:string;
  committeeDate_to:string;
}

// 3. Update the FILTER_FIELDS constant
const FILTER_FIELDS = {
  
  committeeNo: 'committeeNo', // Add this line
  committeeTitle:'committeeTitle',
  committeeBossName : 'committeeBossName',
  committeeDate_from:'committeeDate_from',
  committeeDate_to:'committeeDate_to',


} as const;


const SearchPanel = () => {

const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || '', []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  

// 4. Update the pendingFilters state initialization
const [pendingFilters, setPendingFilters] = useState<Filters>({
  
  committeeNo: '', // Add this line
  committeeTitle:'',
  committeeBossName:'',
  committeeDate_from:'2025-08-15',
  committeeDate_to:'2025-08-28',


});

// 5. Update the activeFilters state initialization
const [activeFilters, setActiveFilters] = useState<Filters>({
  
  committeeNo: '', // Add this line
  committeeTitle:'',
  committeeBossName:'',
  committeeDate_from:'2025-08-15',
  committeeDate_to:'2025-08-28',
});

// Handle search
  const handleSearch = useCallback(() => {
    setActiveFilters(pendingFilters);
    setPage(1);
   console.log("pendingFilters button..." +pendingFilters.committeeNo);
  }, [pendingFilters]);

// 6. Update the handleReset function
const handleReset = useCallback(() => {
  setPendingFilters({
    
    committeeNo: '', // Add this line
    committeeTitle:'',
    committeeBossName:'',
    committeeDate_from:'',
  committeeDate_to:'',
  });

  setActiveFilters({
    
    committeeNo: '', // Add this line
    committeeTitle:'',
    committeeBossName: '',
    committeeDate_from:'2025-08-15',
    committeeDate_to:'2025-08-28',
  });
  setPage(1);
  setLimit(10); // Reset to default limit
}, []);

// Consolidated filter update handler for pending filters
  const handleSelect = useCallback((field: keyof Filters, value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      [field]: value,
    } as Filters));
  }, []);

// 7. Add a custom onChange handler for committee selection (for console logging)
const handleCommitteeSelect = useCallback((value: string) => {
  console.log('Selected committee number:', value);
  console.log('Previous committee value:', pendingFilters.committeeNo);
  handleSelect(FILTER_FIELDS.committeeNo, value);
}, [handleSelect, pendingFilters.committeeNo]);


// Memoize query parameters based on active filters
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, limit };
    Object.entries(activeFilters).forEach(([key, value]) => {

      if (value) params[key] = value;
      console.log("queryParams"+ key + value);
    });
    return params;
  }, [activeFilters, page, limit]);

const fetchCommitteeNo = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse>(`${API_BASE_URL}/api/committees/getAllCommitteeNoBYQueryParams`, {
        params: queryParams,
        timeout: 10000,
      });
      // console.log("queryParams"+ queryParams)
      // console.log('API Response Data:', response.data.data.map((item) => ({
      //   bookStatus: item.bookStatus,
      //   raw: item,
      // })));
      return response.data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }, [API_BASE_URL, queryParams]);

  // React Query with optimized configuration
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['orders', queryParams],
    queryFn: fetchCommitteeNo,
    enabled: Object.values(activeFilters).some((value) => !!value) || page > 1 || Object.keys(queryParams).length === 2, // Allow fetch with no filters
   // staleTime: 1000 * 60 * 2, // now 2 minute data will stay in cached after 2 min will bring new data from server
   staleTime: 0 ,  
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });


 // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle rows per page change
  const handleLimitChange = useCallback((newLimit: number) => {
    if (newLimit >= 1 && newLimit <= 100) {
      setLimit(newLimit);
      setPage(1);
    }
  }, []);

const handleDateChange = useCallback((field: keyof Filters, value: string) => {
  setPendingFilters((prev) => ({
    ...prev,
    [field]: value || '',
  }));
}, []);




  //console.log("data......"+data?.data.map((items) => (console.log("item"+ items.committeeBossName))));

    // Loading and error states
  if (error) {
    return <div className="text-red-500 text-center">Error loading data: {(error as Error).message}</div>;
  }
   

      return (
  <div className="bg-white rounded-xl shadow-2xl p-6 font-arabic w-full max-w-full mx-auto text-right mt-3">
  {/* First row - Committee fields */}
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

  {/* Second row - Date Pickers */}
  <div className="flex flex-col sm:flex-row gap-1 mt-6 sm:justify-start">
    <div className="text-right w-full sm:w-64">
      <label
        htmlFor="committeeDateFrom"
        className="block  font-extrabold text-gray-700 mb-1"
      >
        تاريخ اللجنة (من)
      </label>
      <ArabicDatePicker
        selected={pendingFilters.committeeDate_from}
        onChange={(dateString) => handleDateChange(FILTER_FIELDS.committeeDate_from, dateString)}
        label="تاريخ اللجنة (من)"
      />
    </div>

    <div className="text-right w-full sm:w-64">
      <label
        htmlFor="committeeDateTo"
        className="block  font-extrabold text-gray-700 mb-1"
      >
        تاريخ اللجنة (الى)
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

  <AnimatePresence>
    {isLoading ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center mt-4"
      >
        Loading...
      </motion.div>
    ) : (
      <DynamicTable
        data={data?.data || []}
        headerMap={orderHeaderMap}
        excludeFields={['pdfFiles','userID']}
        pagination={{
          page: data?.page || 1,
          limit: data?.limit || 10,
          total: data?.total || 0,
          totalPages: data?.totalPages || 1,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
      />
    )}
  </AnimatePresence>
</div>
      )
}

export default SearchPanel;