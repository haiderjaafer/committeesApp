'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axios from 'axios';
import ArabicDatePicker from '@/components/DatePicker/ArabicDatePicker';
import DropzoneComponent, { DropzoneComponentRef } from '@/components/ReactDropZoneComponont';


interface CommitteeFormData {
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  sex: string;
  committeeCount: string;
  sexCountPerCommittee: string;
  notes: string;
  userID: string;
}



export default function CommitteeInsertionForm() {
  const dropzoneRef = useRef<DropzoneComponentRef>(null);
  const debouncedCheckCommitteeRef = useRef<NodeJS.Timeout | null>(null);

  //const userID = payload.id?.toString() || '';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const [formData, setFormData] = useState<CommitteeFormData>({
    committeeNo: '',
    committeeDate: format(new Date(), 'yyyy-MM-dd'),
    committeeTitle: '',
    committeeBossName: '',
    sex: '',
    committeeCount: '',
    sexCountPerCommittee: '',
    notes: '',
    userID:"1",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<number | undefined>(undefined);
  const [deID, setSelectedDepartment] = useState<number | undefined>(undefined);

 // Handle committee boss name change
const handleCommitteeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  console.log('Committee boss name changed:', value);
  setFormData((prev) => ({
    ...prev,
    committeeBossName: value,
  }));
}, []);

  // Handle department change
  const handleDepartmentChange = useCallback((deID: number | undefined) => {
    console.log('Department changed:', deID);
    setSelectedDepartment(deID);
    setFormData((prev) => ({
      ...prev,
      notes: deID ? `${prev.notes} Department_${deID}` : prev.notes, // Append to notes or adjust
    }));
  }, []);

  // Check if committee exists
  const checkCommitteeExists = useCallback(
    async (committeeNo: string, committeeDate: string) => {
      if (!committeeNo || !committeeDate) return;
      try {
        console.log('Checking committee existence:', { committeeNo, committeeDate });
        const response = await axios.get(`${API_BASE_URL}/api/committees/checkCommitteeNoExistsForDebounce`, {
          params: { committeeNo, committeeDate },
        });
        if (response.data.exists) {
          toast.warning('رقم اللجنة موجود بالفعل لهذا التاريخ');
        }
      } catch (error) {
        console.error('Error checking committee existence:', error);
        toast.error('فشل في التحقق من رقم اللجنة');
      }
    },
    [API_BASE_URL]
  );

//  Debounce committee existence check
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

  // Handle text input and select changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      console.log(`Input changed: ${name} = ${value}`);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  // Handle date change
  const handleDateChange = useCallback((value: string) => {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      toast.error('يرجى إدخال التاريخ بصيغة YYYY-MM-DD');
      return;
    }
    console.log('Date changed:', value);
    setFormData((prev) => ({ ...prev, committeeDate: value }));
  }, []);

  // Handle file acceptance
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
      console.log('File accepted:', file.name);
      setSelectedFile(file);
      toast.info(`تم اختيار الملف ${file.name}`);
    }
  }, []);

  // Handle file removal
  const handleFileRemoved = useCallback((fileName: string) => {
    console.log('File removed:', fileName);
    setSelectedFile(null);
    toast.info(`تم إزالة الملف ${fileName}`);
  }, []);

  // Handle book PDF loading result
  const handleBookPdfLoaded = useCallback((success: boolean, file?: File) => {
    console.log(`PDF loaded: ${success ? 'SUCCESS' : 'FAILED'}`);
    if (success && file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Validate required fields
      const requiredFields: (keyof CommitteeFormData)[] = [
        'committeeNo',
        'committeeDate',
        'committeeTitle',
        'committeeBossName',
        'sex',
        'committeeCount',
        'sexCountPerCommittee',
        'userID',
      ];

      const fieldLabels: Record<keyof CommitteeFormData, string> = {
        committeeNo: 'رقم اللجنة',
        committeeDate: 'تاريخ اللجنة',
        committeeTitle: 'عنوان اللجنة',
        committeeBossName: 'اسم رئيس اللجنة',
        sex: 'الجنس',
        committeeCount: 'عدد اللجان',
        sexCountPerCommittee: 'عدد الأفراد حسب الجنس',
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

      // Create FormData for submission
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('file', selectedFile);

      console.log('Submitting form:', Object.fromEntries(formDataToSend));

      try {
        const response = await axios.post(`${API_BASE_URL}/api/committees/post`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status === 200) {
          toast.success('تم حفظ بيانات اللجنة وملف PDF بنجاح!');
          setFormData({
            committeeNo: '',
            committeeDate: format(new Date(), 'yyyy-MM-dd'),
            committeeTitle: '',
            committeeBossName: '',
            sex: '',
            committeeCount: '',
            sexCountPerCommittee: '',
            notes: '',
            userID:"1",
          });
          setSelectedFile(null);
          setSelectedCommittee(undefined);
          setSelectedDepartment(undefined);
          dropzoneRef.current?.reset(true);
          console.log('Form reset, response:', response.data);
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
    [formData, selectedFile, API_BASE_URL]
  );

 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-sky-50/50 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-sky-100/50">
        <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-3xl font-bold font-arabic text-center text-sky-600 mb-6 sm:mb-8">
          إضافة لجنة جديدة
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 align-middle">
            {/* Committee Number */}
            <div>
              <label
                htmlFor="committeeNo"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
              >
                رقم اللجنة
              </label>
              <input
                id="committeeNo"
                name="committeeNo"
                type="text"
                value={formData.committeeNo}
                onChange={handleChange}
                placeholder="رقم اللجنة"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </div>

            {/* Committee Date */}
            <div className="text-center">
              <label
                htmlFor="committeeDate"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-center"
              >
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
              <label
                htmlFor="committeeTitle"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
              >
                عنوان اللجنة
              </label>
              <input
                id="committeeTitle"
                name="committeeTitle"
                type="text"
                value={formData.committeeTitle}
                onChange={handleChange}
                placeholder="عنوان اللجنة"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </div>

          <div className="sm:col-span-2 lg:col-span-1">
  <label
    htmlFor="committeeBossName"
    className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
  >
    رئيس اللجنة
  </label>
  <input
    id="committeeBossName"
    name="committeeBossName"
    type="text"
    value={formData.committeeBossName}
    onChange={handleCommitteeChange}
    placeholder="اسم رئيس اللجنة"
    className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
    required
  />
</div>

           

            {/* Sex */}
            <div>
              <label
                htmlFor="sex"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
              >
                الجنس
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full h-12 px-4 py-2 border text-sm font-extrabold border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              >
                <option value="">اختر الجنس</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>

            {/* Committee Count */}
            <div>
              <label
                htmlFor="committeeCount"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
              >
                عدد اللجان
              </label>
              <input
                id="committeeCount"
                name="committeeCount"
                type="text"
                value={formData.committeeCount}
                onChange={handleChange}
                placeholder="عدد اللجان"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </div>

            {/* Sex Count Per Committee */}
            <div>
              <label
                htmlFor="sexCountPerCommittee"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
              >
                عدد الأفراد حسب الجنس
              </label>
              <input
                id="sexCountPerCommittee"
                name="sexCountPerCommittee"
                type="text"
                value={formData.sexCountPerCommittee}
                onChange={handleChange}
                placeholder="عدد الأفراد حسب الجنس"
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="notes"
                className="block text-sm font-extrabold text-gray-700 mb-1 text-right"
              >
                ملاحظات
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="الملاحظات"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right resize-y"
                rows={4}
              />
            </div>
          </div>

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
              username= "haider"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-2 bg-sky-600 hover:bg-sky-700 text-white font-arabic font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'إضافة اللجنة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}