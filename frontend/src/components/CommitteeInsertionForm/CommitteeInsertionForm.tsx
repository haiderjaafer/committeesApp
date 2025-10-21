'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import ArabicDatePicker from '@/components/DatePicker/ArabicDatePicker';
import DropzoneComponent, { DropzoneComponentRef } from '@/components/ReactDropZoneComponont';
import { JWTPayload } from '@/utiles/verifyToken';
import { BossNameAutocomplete } from '../BossName';
import EmployeeSelectionDialog from '@/components/EmployeeSelectionDialog';
import { useQuery } from '@tanstack/react-query';
import { User, Hash, X, Users, Loader2 } from 'lucide-react';

// Step 1: Interfaces
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

interface CommitteeInsertionFormProps {
  payload: JWTPayload;
  id: string | number;
}

interface Employee {
  empID: number;
  name: string;
  employee_desc: number;
  gender?: number;
  genderName?: string;
}

export default function CommitteeInsertionForm({ payload }: CommitteeInsertionFormProps) {
  const dropzoneRef = useRef<DropzoneComponentRef>(null);
  const debouncedCheckCommitteeRef = useRef<NodeJS.Timeout | null>(null);

  console.log(`payload CommitteeInsertionForm: ${payload.id}`);

  const userID = payload.id?.toString() || '';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Step 2: Form state
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
  const [lastCommitteeNo, setLastCommitteeNo] = useState<string | null>(null);

  // ✅ Step 3: Employee selection state
  const [selectedEmployeeIDs, setSelectedEmployeeIDs] = useState<number[]>([]);

  // ✅ Step 4: Fetch selected employees details
  const { data: selectedEmployees, isLoading: isLoadingEmployees } = useQuery<Employee[], Error>({
    queryKey: ['selected-employees-details', selectedEmployeeIDs],
    queryFn: async () => {
      if (selectedEmployeeIDs.length === 0) {
        return [];
      }

      try {
        console.log('Fetching employee details for IDs:', selectedEmployeeIDs);
        
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
    staleTime: 60000,
  });

  // Fetch last committee number
  const fetchLastCommitteeNo = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await axios.get<{ lastCommitteeNo: string }>(
        `${API_BASE_URL}/api/committees/lastCommitteeNo`,
        { signal }
      );
      setLastCommitteeNo(res.data.lastCommitteeNo);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled");
      } else {
        console.error("Error fetching last committeeNo:", err);
        setLastCommitteeNo(null);
      }
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLastCommitteeNo(controller.signal);
    return () => controller.abort();
  }, [fetchLastCommitteeNo]);

  // Check if committee exists
  const checkCommitteeExists = useCallback(
    async (committeeNo: string, committeeDate: string) => {
      if (!committeeNo || !committeeDate) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/committees/checkCommitteeNoExistsForDebounce`, {
          params: { committeeNo, committeeDate },
        });
        if (response.data.exists) {
          toast.warning('رقم اللجنة موجود بالفعل لهذا التاريخ');
        }
      } catch (error) {
        console.error('Error checking committee existence:', error);
      }
    },
    [API_BASE_URL]
  );

  useEffect(() => {
    if (debouncedCheckCommitteeRef.current) {
      clearTimeout(debouncedCheckCommitteeRef.current);
    }

    if (formData.committeeNo && formData.committeeDate) {
      debouncedCheckCommitteeRef.current = setTimeout(() => {
        checkCommitteeExists(formData.committeeNo, formData.committeeDate);
      }, 500);
    }

    return () => {
      if (debouncedCheckCommitteeRef.current) {
        clearTimeout(debouncedCheckCommitteeRef.current);
      }
    };
  }, [formData.committeeNo, formData.committeeDate, checkCommitteeExists]);

  // Handle input changes
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
      toast.info(`تم اختيار الملف ${file.name}`);
    }
  }, []);

  const handleFileRemoved = useCallback((fileName: string) => {
    setSelectedFile(null);
    toast.info(`تم إزالة الملف ${fileName}`);
  }, []);

  const handleBookPdfLoaded = useCallback((success: boolean, file?: File) => {
    if (success && file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  }, []);

  const handleBossNameSelect = useCallback((bossName: string) => {
    console.log('Selected boss name:', bossName);
  }, []);

  // ✅ Step 5: Handle employee selection
  const handleEmployeesSelected = useCallback((empIDs: number[]) => {
    console.log('Received selected employee IDs:', empIDs);
    setSelectedEmployeeIDs(empIDs);
    toast.success(`تم تحديد ${empIDs.length} موظف`);
  }, []);

  // ✅ Step 6: Remove individual employee
  const removeEmployee = useCallback((empID: number) => {
    const newIDs = selectedEmployeeIDs.filter(id => id !== empID);
    setSelectedEmployeeIDs(newIDs);
    toast.info('تم إزالة الموظف من القائمة');
  }, [selectedEmployeeIDs]);

  // ✅ Step 7: Clear all employees
  const clearAllEmployees = useCallback(() => {
    setSelectedEmployeeIDs([]);
    toast.info('تم مسح جميع الموظفين');
  }, []);

  // ✅ Step 8: Handle form submission with employee IDs
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Validation
      const requiredFields: (keyof CommitteeFormData)[] = [
        'committeeNo',
        'committeeDate',
        'committeeTitle',
        'committeeBossName',
        'committeeCount',
        'userID',
      ];

      const fieldLabels: Record<keyof CommitteeFormData, string> = {
        committeeNo: 'رقم اللجنة',
        committeeDate: 'تاريخ اللجنة',
        committeeTitle: 'عنوان اللجنة',
        committeeBossName: 'اسم رئيس اللجنة',
        sex: 'الجنس',
        committeeCount: 'عدد اللجان',
        notes: 'الملاحظات',
        userID: 'معرف المستخدم',
      };

      for (const field of requiredFields) {
        if (!formData[field]) {
          const label = fieldLabels[field] || field;
          toast.error(`يرجى ملء حقل ${label}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (!selectedFile) {
        toast.error('يرجى تحميل ملف PDF');
        setIsSubmitting(false);
        return;
      }

      // ✅ Create FormData with employee IDs as JSON string
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // ✅ Add employee IDs as JSON string
      formDataToSend.append('employeeIDs', JSON.stringify(selectedEmployeeIDs));
      
      // Add PDF file
      formDataToSend.append('file', selectedFile);

      console.log('Submitting form with employee IDs:', {
        ...formData,
        employeeIDs: selectedEmployeeIDs,
        fileName: selectedFile.name
      });

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/committees/post`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.status === 200) {
          toast.success(`تم حفظ اللجنة بنجاح مع ${selectedEmployeeIDs.length} عضو!`);
          
          // Reset form
          setFormData({
            committeeNo: '',
            committeeDate: format(new Date(), 'yyyy-MM-dd'),
            committeeTitle: '',
            committeeBossName: '',
            sex: '',
            committeeCount: '',
            notes: '',
            userID: userID,
          });
          setSelectedFile(null);
          setSelectedEmployeeIDs([]); // ✅ Clear employees
          dropzoneRef.current?.reset(true);
          
          await fetchLastCommitteeNo();
        } else {
          throw new Error('Failed to add committee');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error('فشل في إرسال البيانات. يرجى المحاولة مرة أخرى');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, selectedFile, selectedEmployeeIDs, API_BASE_URL, userID, fetchLastCommitteeNo]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-400 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-sky-100/50">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-sky-600">
            إضافة لجنة جديدة
          </h1>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-extrabold text-green-400">آخر كتاب لجنة</h1>
            <h1 className="text-2xl font-extrabold text-green-600">{lastCommitteeNo}</h1>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-10" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Committee Number */}
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
                placeholder="رقم اللجنة"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
                required
                autoComplete="off"
              />
            </div>

            {/* Committee Date */}
            <div className="text-center">
              <label htmlFor="committeeDate" className="block text-sm font-extrabold text-gray-700 mb-1">
                تاريخ اللجنة
              </label>
              <ArabicDatePicker
                selected={formData.committeeDate}
                onChange={handleDateChange}
                label="تاريخ اللجنة"
              />
            </div>

            {/* Committee Title */}
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
                placeholder="عنوان اللجنة"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
                required
                autoComplete="off"
              />
            </div>

            {/* Committee Boss Name */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="committeeBossName" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                رئيس اللجنة
              </label>
              <BossNameAutocomplete
                value={formData.committeeBossName}
                onChange={(value) => setFormData(prev => ({ ...prev, committeeBossName: value }))}
                onSelect={handleBossNameSelect}
              />
            </div>

            {/* Sex */}
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
                <option value="">اختر الجنس (اختياري)</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>

            {/* Committee Count */}
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
                placeholder="عدد أعضاء اللجنة"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right"
                required
                autoComplete="off"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="notes" className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
                ملاحظات
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="الملاحظات"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-arabic text-right resize-y"
                rows={4}
                autoComplete="off"
              />
            </div>
          </div>

          {/* ✅ Employee Selection Dialog */}
          <div className="mt-6">
            <label className="block text-sm font-extrabold text-gray-700 mb-2 text-right">
              أعضاء اللجنة
            </label>
            <EmployeeSelectionDialog
              selectedEmployeeIDs={selectedEmployeeIDs}
              onEmployeesSelected={handleEmployeesSelected}
              maxSelections={50}
              triggerButtonText="اختيار أعضاء اللجنة"
              triggerButtonClassName="w-full h-12 text-base"
            />
          </div>

          {/*  Display Selected Employees */}
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

              {isLoadingEmployees ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="mr-2 text-sm text-gray-600 font-arabic">
                    جارٍ تحميل البيانات...
                  </span>
                </div>
              ) : selectedEmployees && selectedEmployees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedEmployees.map((employee, index) => (
                    <div
                      key={employee.empID}
                      className="bg-white border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="">
                          {/* <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                          </div> */}

                          <div className="flex  gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              {/* <p className="text-xs text-gray-500 font-arabic">الاسم</p> */}
                              <p className="text-sm font-bold font-arabic text-gray-800">
                                {employee.name}
                              </p>
                            </div>
                              <div className="flex  gap-1">
                              {/* <Hash className="h-3 w-3 text-purple-600" /> */}
                              {/* <span className="text-xs text-gray-500">رقم: </span> */}
                              <span className="text-xs font-bold text-purple-600">
                                {employee.employee_desc}
                              </span>
                            </div>

                          </div>

                          {/* <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-gray-500">ID: </span>
                              <span className="text-xs font-bold text-green-600">
                                {employee.empID}
                              </span>
                            </div>
                         
                          </div> */}

                          {/* {employee.genderName && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block font-arabic">
                              {employee.genderName}
                            </span>
                          )} */}
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
              ) : null}
            </div>
          )}

          {/* Dropzone for PDF Upload */}
          <div className="mt-6">
            <label className="block text-sm font-extrabold text-gray-700 mb-1 text-right">
              تحميل ملف PDF
            </label>
            <DropzoneComponent
              ref={dropzoneRef}
              onFilesAccepted={handleFilesAccepted}
              onFileRemoved={handleFileRemoved}
              onBookPdfLoaded={handleBookPdfLoaded}
              username="haider"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-arabic font-semibold text-lg rounded-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                // `حفظ الكتاب ${selectedEmployeeIDs.length > 0 ? `(${selectedEmployeeIDs.length} عضو)` : ''}`
                "حفظ الكتاب"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}