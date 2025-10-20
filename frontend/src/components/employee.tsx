'use client';

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Check, ChevronDown, X, Search, Loader2, Info, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Step 1: Define interfaces
interface Employee {
  empID: number;
  name: string;
  employee_desc: number;
  gender?: number;
  genderName?: string;
}

interface MultiSelectEmployeesProps {
  value: number[];
  onChange: (empIDs: number[]) => void;
  className?: string;
  placeholder?: string;
  maxSelections?: number;
}

const MultiSelectEmployees: React.FC<MultiSelectEmployeesProps> = ({
  value,
  onChange,
  className,
  placeholder = "ابحث بالاسم الأول والثاني أو الرقم",
  maxSelections
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  console.log('Selected IDs:', value);

  // Fetch search results
  const { 
    data: searchResults, 
    isLoading: isSearching, 
    isFetching
  } = useQuery<Employee[], Error>({
    queryKey: ['employees-autocomplete', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.trim().length === 0) {
        return [];
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employees/autocomplete`,
          { 
            params: { 
              q: debouncedSearch.trim(),
              limit: 50
            },
            withCredentials: true 
          }
        );
        
        console.log('Search results:', response.data);
        return response.data;
      } catch (err) {
        console.error('Search error:', err);
        toast.error('فشل في البحث');
        return [];
      }
    },
    enabled: debouncedSearch.trim().length > 0,
    staleTime: 60000,
  });

  // ✅ Fetch selected employees - FIXED
  const { data: selectedEmployees, isLoading: isLoadingSelected } = useQuery<Employee[], Error>({
    queryKey: ['employees-selected', value],
    queryFn: async () => {
      if (value.length === 0) {
        console.log('No employees selected');
        return [];
      }

      try {
        console.log('Fetching details for selected IDs:', value);
        
        // Fetch each employee individually
        const promises = value.map(async (empID) => {
          try {
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employees/${empID}`,
              { withCredentials: true }
            );
            console.log(`Fetched employee ${empID}:`, response.data);
            return response.data.data; // ✅ Extract .data.data
          } catch (err) {
            console.error(`Error fetching employee ${empID}:`, err);
            return null;
          }
        });
        
        const employees = await Promise.all(promises);
        const validEmployees = employees.filter(emp => emp !== null) as Employee[];
        
        console.log('Loaded selected employees:', validEmployees);
        return validEmployees;
      } catch (err) {
        console.error('Error fetching selected employees:', err);
        return [];
      }
    },
    enabled: value.length > 0,
    staleTime: 30000, // 30 seconds cache
  });

  // Toggle employee selection
  const handleEmployeeToggle = useCallback((empID: number, employee: Employee) => {
    console.log('Toggling employee:', empID, employee.name);
    
    if (value.includes(empID)) {
      onChange(value.filter(id => id !== empID));
      toast.info(`تم إزالة: ${employee.name}`);
    } else {
      if (maxSelections && value.length >= maxSelections) {
        toast.warning(`الحد الأقصى ${maxSelections} موظف`);
        return;
      }
      onChange([...value, empID]);
      toast.success(`✓ تم إضافة: ${employee.name}`);
      setSearchTerm("");
    }
  }, [value, onChange, maxSelections]);

  // Remove employee
  const removeEmployee = useCallback((empID: number, name?: string) => {
    console.log('Removing employee:', empID, name);
    onChange(value.filter(id => id !== empID));
    if (name) {
      toast.info(`تم إزالة: ${name}`);
    }
  }, [value, onChange]);

  // Clear all
  const clearAll = useCallback(() => {
    onChange([]);
    setSearchTerm("");
    toast.info('تم إلغاء تحديد جميع الموظفين');
  }, [onChange]);

  const getSearchTypeHint = () => {
    if (!searchTerm.trim()) return null;
    
    if (searchTerm.trim().match(/^\d+$/)) {
      return (
        <div className="px-3 py-2 bg-blue-50 border-b flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-xs text-blue-700 font-arabic">
            بحث دقيق عن رقم الموظف: {searchTerm}
          </span>
        </div>
      );
    } else {
      return (
        <div className="px-3 py-2 bg-green-50 border-b flex items-center gap-2">
          <Info className="h-4 w-4 text-green-600" />
          <span className="text-xs text-green-700 font-arabic">
            بحث عن أسماء تبدأ بـ: "{searchTerm}"
          </span>
        </div>
      );
    }
  };

  const getButtonPlaceholder = () => {
    if (isLoadingSelected) {
      return "جارٍ التحميل...";
    }
    if (value.length === 0) {
      return placeholder;
    }
    if (value.length === 1 && selectedEmployees?.[0]) {
      return selectedEmployees[0].name;
    }
    return `${value.length} موظف محدد`;
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-12 h-auto px-4 font-arabic text-right"
          >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <span className="text-gray-700 font-bold">
                {getButtonPlaceholder()}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[500px] p-0" align="start">
          {/* Search Header */}
          <div className="p-3 bg-gray-50 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="اكتب الاسم الأول والثاني أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-arabic text-right"
                autoFocus
              />
            </div>
            
            <div className="mt-2 text-xs text-gray-500 space-y-1 font-arabic">
              <p>💡 أمثلة:</p>
              <p className="mr-4">• "زهراء حازم" → أسماء تبدأ بـ زهراء حازم</p>
              <p className="mr-4">• "1022" → موظف رقم 1022 فقط</p>
            </div>

            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs w-full mt-2 text-red-600 hover:bg-red-50"
              >
                <X className="ml-1 h-3 w-3" />
                مسح الكل ({value.length})
              </Button>
            )}
          </div>

          {getSearchTypeHint()}

          {/* Results */}
          <ScrollArea className="h-[320px]">
            {isSearching || isFetching ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="mr-2 text-sm font-arabic">جارٍ البحث...</span>
              </div>
            ) : searchTerm.trim().length === 0 ? (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-bold font-arabic mb-2">
                  ابدأ البحث
                </p>
                <div className="text-xs text-gray-500 space-y-1 font-arabic">
                  <p>اكتب الاسم الأول والثاني</p>
                  <p className="text-green-600">مثال: زهراء حازم</p>
                  <p className="mt-2">أو اكتب رقم الموظف</p>
                  <p className="text-blue-600">مثال: 1022</p>
                </div>
              </div>
            ) : searchResults && searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600 font-bold font-arabic mb-2">
                  لا توجد نتائج
                </p>
                <p className="text-xs text-gray-500 font-arabic">
                  لم يتم العثور على "{searchTerm}"
                </p>
              </div>
            ) : (
              <div>
                {searchResults?.map((employee) => {
                  const isSelected = value.includes(employee.empID);
                  
                  return (
                    <div
                      key={employee.empID}
                      className={cn(
                        "flex items-center px-4 py-3 cursor-pointer border-b hover:bg-blue-50 transition-colors",
                        isSelected && "bg-blue-50 border-blue-200"
                      )}
                      onClick={() => handleEmployeeToggle(employee.empID, employee)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={cn(
                            "w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0",
                            isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>

                        <div className="text-right flex-1">
                          <p className="text-sm font-bold font-arabic text-gray-800">
                            {employee.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-blue-600">
                              رقم: {employee.employee_desc}
                            </span>
                            {employee.genderName && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-500">
                                  {employee.genderName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Badge variant="default" className="bg-green-500">
                            <UserCheck className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {searchResults && searchResults.length > 0 && (
            <div className="p-2 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-600 font-arabic">
                عرض {searchResults.length} نتيجة • محدد {value.length}
                {maxSelections && ` من ${maxSelections}`}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* ✅ FIXED: Selected employees display with names and X icons */}
      {value.length > 0 && (
        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-bold text-blue-700 font-arabic">
                الموظفون المحددون ({value.length})
                {maxSelections && ` / ${maxSelections}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs text-red-600 hover:bg-red-100 font-arabic"
            >
              <X className="ml-1 h-3 w-3" />
              مسح الكل
            </Button>
          </div>
          
          {/* ✅ Show loading or employee names */}
          {isLoadingSelected ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="mr-2 text-sm text-gray-600 font-arabic">
                جارٍ تحميل الأسماء...
              </span>
            </div>
          ) : selectedEmployees && selectedEmployees.length > 0 ? (
            <div className="space-y-2">
              {selectedEmployees.map((emp, index) => (
                <div 
                  key={emp.empID} 
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Number badge */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    
                    {/* ✅ Employee name and details */}
                    <div className="text-right flex-1 min-w-0">
                      <p className="text-sm font-bold font-arabic text-gray-800">
                        {emp.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-blue-600">
                          رقم: {emp.employee_desc}
                        </span>
                        {emp.genderName && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {emp.genderName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ✅ X Remove button */}
                  <button
                    onClick={() => removeEmployee(emp.empID, emp.name)}
                    className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
                    title={`إزالة ${emp.name}`}
                  >
                    <X className="h-5 w-5 text-red-500 hover:text-red-700" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm font-arabic">
              فشل في تحميل بيانات الموظفين
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {value.length === 0 && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center font-arabic">
            لم يتم تحديد أي موظف بعد
          </p>
        </div>
      )}
    </div>
  );
};

export default MultiSelectEmployees;