'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ArabicDatePicker from '@/components/DatePicker/ArabicDatePicker';
import DropzoneComponent, { DropzoneComponentRef } from '@/components/ReactDropZoneComponont';
import { JWTPayload } from '@/utiles/verifyToken';
import { BossNameAutocomplete } from '../BossName';
import EmployeeSelectionDialog from '@/components/EmployeeSelectionDialog';
import { useQuery } from '@tanstack/react-query';
import { User, Hash, X, Users, Loader2, Save, ArrowLeft } from 'lucide-react';

// Interfaces
interface CommitteeFormData {
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  sex?: string;
  committeeCount: string;
  notes: string;
  userID: string;
}

interface Employee {
  empID: number;
  name: string;
  employee_desc: number;
  gender?: number;
  genderName?: string;
}

interface CommitteeUpdateFormProps {
  payload: JWTPayload;
  committeeId: number;
}

export default function CommitteeUpdateForm({ 
  payload, 
  committeeId
}: CommitteeUpdateFormProps) {
  const router = useRouter();
  const dropzoneRef = useRef<DropzoneComponentRef>(null);

  const userID = payload.id?.toString() || '';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Form state
  const [formData, setFormData] = useState<CommitteeFormData>({
    committeeNo: '',
    committeeDate: format(new Date(), 'yyyy-MM-dd'),
    committeeTitle: '',
    committeeBossName: '',
    sex: '',
    committeeCount: '',
    notes: '',
    userID: userID,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFileChanged, setHasFileChanged] = useState(false);

  // Employee state
  const [selectedEmployeeIDs, setSelectedEmployeeIDs] = useState<number[]>([]);
  const [hasEmployeeChanged, setHasEmployeeChanged] = useState(false);
  const [initialEmployeeIDs, setInitialEmployeeIDs] = useState<number[]>([]);

  // ✅ Fetch committee details
  const { data: committeeDetails, isLoading: isLoadingCommittee } = useQuery({
    queryKey: ['committee-full-details', committeeId],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/committees/getCommitteeWithPdfsByID/${committeeId}`,
          { withCredentials: true }
        );
        
        console.log('Committee details loaded:', response.data);
        
        const data = response.data;
        
        // Set form data
        setFormData({
          committeeNo: data.committeeNo || '',
          committeeDate: data.committeeDate || format(new Date(), 'yyyy-MM-dd'),
          committeeTitle: data.committeeTitle || '',
          committeeBossName: data.committeeBossName || '',
          sex: data.sex || '',
          committeeCount: data.committeeCount?.toString() || '',
          notes: data.notes || '',
          userID: userID,
        });
        
        // ✅ Set initial employees
        const employeeIDs = data.employees?.map((emp: Employee) => emp.empID) || [];
        setSelectedEmployeeIDs(employeeIDs);
        setInitialEmployeeIDs(employeeIDs);
        
        console.log('Loaded employees:', employeeIDs);
        
        return data;
      } catch (err) {
        console.error('Error loading committee:', err);
        toast.error('فشل في تحميل بيانات اللجنة');
        throw err;
      }
    },
    enabled: !!committeeId,
  });

  // ✅ FIX: Fetch employee details based on CURRENT selectedEmployeeIDs (not from committeeDetails)
  const { data: selectedEmployees, isLoading: isLoadingSelectedEmployees } = useQuery<Employee[], Error>({
    queryKey: ['selected-employees-details', selectedEmployeeIDs],
    queryFn: async () => {
      if (selectedEmployeeIDs.length === 0) {
        console.log('No employees selected');
        return [];
      }

      try {
        console.log('Fetching details for employee IDs:', selectedEmployeeIDs);
        
        const promises = selectedEmployeeIDs.map(async (empID) => {
          const response = await axios.get(
            `${API_BASE_URL}/api/employees/${empID}`,
            { withCredentials: true }
          );
          return response.data.data;
        });
        
        const employees = await Promise.all(promises);
        console.log('Loaded employee details:', employees);
        return employees;
      } catch (err) {
        console.error('Error fetching employee details:', err);
        return [];
      }
    },
    enabled: selectedEmployeeIDs.length > 0,
    staleTime: 0, // ✅ Don't cache - always refetch when IDs change
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleDateChange = useCallback((value: string) => {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      toast.error('يرجى إدخال التاريخ بصيغة YYYY-MM-DD');
      return;
    }
    setFormData((prev) => ({ ...prev, committeeDate: value }));
  }, []);

  const handleFilesAccepted = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast.error('يرجى تحميل ملف PDF صالح');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الملف يتجاوز 10 ميجابايت');
        return;
      }
      setSelectedFile(file);
      setHasFileChanged(true);
      toast.info(`تم اختيار الملف ${file.name}`);
    }
  }, []);

  const handleFileRemoved = useCallback((fileName: string) => {
    setSelectedFile(null);
    setHasFileChanged(false);
    toast.info(`تم إزالة الملف ${fileName}`);
  }, []);

  const handleBookPdfLoaded = useCallback((success: boolean, file?: File) => {
    if (success && file) {
      setSelectedFile(file);
      setHasFileChanged(true);
    } else {
      setSelectedFile(null);
      setHasFileChanged(false);
    }
  }, []);

  const handleBossNameSelect = useCallback((bossName: string) => {
    console.log('Selected boss name:', bossName);
  }, []);

  // ✅ Handle employee selection
  const handleEmployeesSelected = useCallback((empIDs: number[]) => {
    console.log('New employee IDs:', empIDs);
    console.log('Initial employee IDs:', initialEmployeeIDs);
    
    setSelectedEmployeeIDs(empIDs);
    
    // Check if employees changed
    const hasChanged = JSON.stringify([...empIDs].sort()) !== 
                      JSON.stringify([...initialEmployeeIDs].sort());
    setHasEmployeeChanged(hasChanged);
    
    toast.success(`تم تحديد ${empIDs.length} موظف`);
  }, [initialEmployeeIDs]);

  // ✅ FIX: Remove individual employee
  const removeEmployee = useCallback((empID: number) => {
    console.log('Removing employee:', empID);
    console.log('Current IDs before removal:', selectedEmployeeIDs);
    
    const newIDs = selectedEmployeeIDs.filter(id => id !== empID);
    
    console.log('New IDs after removal:', newIDs);
    
    setSelectedEmployeeIDs(newIDs);
    
    const hasChanged = JSON.stringify([...newIDs].sort()) !== 
                      JSON.stringify([...initialEmployeeIDs].sort());
    setHasEmployeeChanged(hasChanged);
    
    toast.info('تم إزالة الموظف من القائمة');
  }, [selectedEmployeeIDs, initialEmployeeIDs]);

  // ✅ Clear all employees
  const clearAllEmployees = useCallback(() => {
    console.log('Clearing all employees');
    setSelectedEmployeeIDs([]);
    setHasEmployeeChanged(initialEmployeeIDs.length > 0);
    toast.info('تم مسح جميع الموظفين');
  }, [initialEmployeeIDs]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        console.log('Submitting update...');
        console.log('Selected employee IDs:', selectedEmployeeIDs);
        console.log('Has file changed:', hasFileChanged);
        console.log('Has employees changed:', hasEmployeeChanged);

        if (hasFileChanged && selectedFile) {
          // UPDATE WITH FILE
          console.log('Updating WITH file');
          
          const formDataToSend = new FormData();
          
          Object.entries(formData).forEach(([key, value]) => {
            if (value) {
              formDataToSend.append(key, value);
            }
          });
          
          if (hasEmployeeChanged) {
            formDataToSend.append('employeeIDs', JSON.stringify(selectedEmployeeIDs));
          }
          
          formDataToSend.append('file', selectedFile);
          
          const response = await axios.patch(
            `${API_BASE_URL}/api/committees/${committeeId}`,
            formDataToSend,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
              withCredentials: true,
            }
          );
          
          toast.success('تم تحديث اللجنة والملف بنجاح!');
          
        } else {
          // UPDATE WITHOUT FILE
          console.log('Updating WITHOUT file');
          
          const updatePayload: any = { ...formData };
          
          if (hasEmployeeChanged) {
            updatePayload.employeeIDs = selectedEmployeeIDs;
          }
          
          const response = await axios.patch(
            `${API_BASE_URL}/api/committees/${committeeId}/json`,
            updatePayload,
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            }
          );
          
          toast.success('تم تحديث اللجنة بنجاح!');
        }
        
        setTimeout(() => {
          router.push('/searchPanel');
        }, 1500);
        
      } catch (error) {
        console.error('Error updating committee:', error);
        const err = error as any;
        const errorMessage = err.response?.data?.detail || 'فشل في تحديث اللجنة';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData, 
      selectedFile, 
      selectedEmployeeIDs, 
      hasFileChanged, 
      hasEmployeeChanged,
      committeeId,
      API_BASE_URL,
      router
    ]
  );

  if (isLoadingCommittee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-400">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-xl font-arabic text-gray-700">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-400 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-sky-100/50">
        
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="font-arabic">
            <ArrowLeft className="ml-2 h-4 w-4" />
            رجوع
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-sky-600">
            تحديث اللجنة
          </h1>
          <div className="w-20"></div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            <div>
              <label htmlFor="committeeNo" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                رقم اللجنة
              </label>
              <input
                id="committeeNo"
                name="committeeNo"
                type="text"
                value={formData.committeeNo}
                onChange={handleChange}
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
                autoComplete="off"
              />
            </div>

            <div className="text-center">
              <label className="block text-sm font-extrabold text-gray-700 mb-1">
                تاريخ اللجنة
              </label>
              <ArabicDatePicker
                selected={formData.committeeDate}
                onChange={handleDateChange}
                label="تاريخ اللجنة"
              />
            </div>

            <div>
              <label htmlFor="committeeTitle" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                عنوان اللجنة
              </label>
              <input
                id="committeeTitle"
                name="committeeTitle"
                type="text"
                value={formData.committeeTitle}
                onChange={handleChange}
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
                autoComplete="off"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                رئيس اللجنة
              </label>
              <BossNameAutocomplete
                value={formData.committeeBossName}
                onChange={(value) => setFormData(prev => ({ ...prev, committeeBossName: value }))}
                onSelect={handleBossNameSelect}
              />
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                الجنس <span className="text-gray-400 text-xs">(اختياري)</span>
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full h-12 px-4 py-2 border text-sm font-extrabold border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
              >
                <option value="">اختر الجنس</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>

            <div>
              <label htmlFor="committeeCount" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                عدد أعضاء اللجنة
              </label>
              <input
                id="committeeCount"
                name="committeeCount"
                type="text"
                value={formData.committeeCount}
                onChange={handleChange}
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
                autoComplete="off"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="notes" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                ملاحظات
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right resize-y"
                rows={4}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Employee Selection */}
          <div className="mt-6">
            <label className="block text-sm font-extrabold text-gray-700 mb-2 text-right">
              أعضاء اللجنة
              {hasEmployeeChanged && (
                <span className="mr-2 text-xs text-orange-600 font-normal">
                  (تم التعديل)
                </span>
              )}
            </label>
            <EmployeeSelectionDialog
              selectedEmployeeIDs={selectedEmployeeIDs}
              onEmployeesSelected={handleEmployeesSelected}
              maxSelections={50}
              triggerButtonText="تعديل أعضاء اللجنة"
              triggerButtonClassName="w-full h-12 text-base"
            />
          </div>

          {/* ✅ Display Current Employees - NOW UPDATES WHEN IDs CHANGE */}
          {selectedEmployeeIDs.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-blue-700 font-arabic">
                    الموظفون المحددون ({selectedEmployeeIDs.length})
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllEmployees}
                  className="text-red-600 hover:bg-red-100 font-arabic"
                >
                  <X className="ml-1 h-4 w-4" />
                  مسح الكل
                </Button>
              </div>

              {isLoadingSelectedEmployees ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="mr-2 text-sm text-gray-600 font-arabic">
                    جارٍ تحميل البيانات...
                  </span>
                </div>
              ) : selectedEmployees && selectedEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedEmployees.map((employee: Employee, index: number) => (
                    <div
                      key={employee.empID}
                      className="bg-white border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>

                          <div className="flex items-start gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-arabic">الاسم</p>
                              <p className="text-sm font-bold font-arabic text-gray-800">
                                {employee.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-gray-500">ID: </span>
                              <span className="text-xs font-bold text-green-600">
                                {employee.empID}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-gray-500">رقم: </span>
                              <span className="text-xs font-bold text-purple-600">
                                {employee.employee_desc}
                              </span>
                            </div>
                          </div>

                          {employee.genderName && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block font-arabic">
                              {employee.genderName}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEmployee(employee.empID)}
                          className="w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
                          title={`إزالة ${employee.name}`}
                        >
                          <X className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500 text-sm font-arabic">
                  لا يوجد موظفين محددين
                </div>
              )}
            </div>
          )}

          {/* PDF Upload */}
          <div className="mt-6">
            <label className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
              تحديث ملف PDF
              <span className="text-xs text-gray-500 font-normal mr-2">(اختياري)</span>
              {hasFileChanged && (
                <span className="mr-2 text-xs text-orange-600 font-normal">
                  (ملف جديد)
                </span>
              )}
            </label>
            <DropzoneComponent
              ref={dropzoneRef}
              onFilesAccepted={handleFilesAccepted}
              onFileRemoved={handleFileRemoved}
              onBookPdfLoaded={handleBookPdfLoaded}
              username="haider"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-center gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-8 py-3 font-arabic font-semibold text-lg"
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-arabic font-semibold text-lg rounded-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جارٍ التحديث...
                </>
              ) : (
                <>
                  <Save className="ml-2 h-5 w-5" />
                  تحديث الكتاب
                  {hasEmployeeChanged && ` (${selectedEmployeeIDs.length} عضو)`}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}