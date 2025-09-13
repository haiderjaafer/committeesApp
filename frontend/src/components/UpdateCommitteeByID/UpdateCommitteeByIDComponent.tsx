'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import DropzoneComponent, { DropzoneComponentRef } from '../ReactDropZoneComponont';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { FileText, Eye } from 'lucide-react';
import ArabicDatePicker from '../DatePicker/ArabicDatePicker';
//import { JWTPayload } from '@/utiles/verifyToken';

// Define the committee response type based on your API data

export interface JWTPayload {
  id: number;
  username: string;
  permission: string;
}

interface PDFResponse {
  id: number;
  committeeID: number;
  committeeNo: string | null;
  pdf: string | null;
  currentDate: string | null;
  username: string | null;
}

interface CommitteeResponse {
  id: number;
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  sex: string;
  committeeCount: number;
  sexCountPerCommittee: number;
  notes: string;
  currentDate: string;
  userID: number;
  username: string;
  pdfFiles?: PDFResponse[];
}

// Committee form type
interface CommitteeFormType {
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  sex: string;
  committeeCount: number;
  sexCountPerCommittee: number;
  notes: string;
  userID: string;
}

// Animation variants for Framer Motion
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const inputVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

interface UpdateCommitteeByIDProps {
  committeeId: string;
  payload: JWTPayload;
}

export default function UpdateCommitteeByID({ committeeId, payload }: UpdateCommitteeByIDProps) {
  console.log("UpdateCommitteeByID CLIENT", payload);

  // Updated helper function to handle date fields safely
  const getDateValue = (dateValue: string | null | undefined, useCurrentAsDefault = false) => {
    if (!dateValue || dateValue.trim() === '') {
      return useCurrentAsDefault ? format(new Date(), 'yyyy-MM-dd') : '';
    }
    try {
      const testDate = new Date(dateValue);
      if (isNaN(testDate.getTime())) {
        return useCurrentAsDefault ? format(new Date(), 'yyyy-MM-dd') : '';
      }
      return dateValue;
    } catch {
      return useCurrentAsDefault ? format(new Date(), 'yyyy-MM-dd') : '';
    }
  };
  
  // Memoize API base URL
  const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || '', []);

  const dropzoneRef = useRef<DropzoneComponentRef>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfFiles, setPdfFiles] = useState<PDFResponse[]>([]);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  // Static userID as requested
  const userID = '1';

  const [formData, setFormData] = useState<CommitteeFormType>({
    committeeNo: '',
    committeeDate: format(new Date(), 'yyyy-MM-dd'),
    committeeTitle: '',
    committeeBossName: '',
    sex: '',
    committeeCount: 0,
    sexCountPerCommittee: 0,
    notes: '',
    userID: userID,
  });

  // Fetch committee data
  const fetchCommitteeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<CommitteeResponse>(
        `${API_BASE_URL}/api/committees/getCommitteeWithPdfsByID/${committeeId}`
      );
      const committee = response.data;
      console.log("committee data...", committee);

      setFormData({
        committeeNo: committee.committeeNo || '',
        committeeDate: getDateValue(committee.committeeDate, true),
        committeeTitle: committee.committeeTitle || '',
        committeeBossName: committee.committeeBossName || '',
        sex: committee.sex || '',
        committeeCount: committee.committeeCount || 0,
        sexCountPerCommittee: committee.sexCountPerCommittee || 0,
        notes: committee.notes || '',
        userID: userID,
      });

      setPdfFiles(committee.pdfFiles || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching committee data:', error);
      toast.error('فشل في جلب بيانات اللجنة. يرجى المحاولة مرة أخرى');
      setIsLoading(false);
    }
  }, [committeeId, API_BASE_URL, userID]);

  useEffect(() => {
    fetchCommitteeData();
  }, [fetchCommitteeData]);

  // Handle text input and select changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value,
      }));
    },
    []
  );

  // Handle date changes
  const handleDateChange = useCallback(
    (key: "committeeDate", value: string) => {
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        toast.error("يرجى إدخال التاريخ بصيغة YYYY-MM-DD");
        return;
      }
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

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
      setSelectedFile(file);
      toast.info(`تم اختيار الملف ${file.name}`);
    }
  }, []);

  // Handle file removal
  const handleFileRemoved = useCallback((fileName: string) => {
    setSelectedFile(null);
    toast.info(`تم إزالة الملف ${fileName}`);
  }, []);

  // Handle committee PDF loading result
  const handleCommitteePdfLoaded = useCallback((success: boolean, file?: File) => {
    console.log(`📄 Committee PDF loaded: ${success ? 'SUCCESS' : 'FAILED'}`);
    if (success && file) {
      setSelectedFile(file);
      toast.info('تم تحميل ملف committee.pdf بنجاح');
    } else {
      setSelectedFile(null);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      console.log("form data client", formData);

      // Required fields validation
      const requiredFields: (keyof CommitteeFormType)[] = [
        'committeeNo',
        'committeeDate',
        'committeeTitle',
        'committeeBossName',
        'sex',
        'userID'
      ];

      const fieldLabels: Record<keyof CommitteeFormType, string> = {
        committeeNo: 'رقم اللجنة',
        committeeDate: 'تاريخ اللجنة',
        committeeTitle: 'عنوان اللجنة',
        committeeBossName: 'اسم رئيس اللجنة',
        sex: 'الجنس',
        committeeCount: 'عدد اللجنة',
        sexCountPerCommittee: 'عدد الجنس في اللجنة',
        notes: 'الملاحظات',
        userID: 'المستخدم',
      };

      for (const field of requiredFields) {
        if (!formData[field]) {
          const label = fieldLabels[field] || field;
          toast.error(`يرجى ملء حقل ${label}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Check if we have a valid file selected
      const hasValidFile = selectedFile && 
                          selectedFile instanceof File && 
                          selectedFile.size > 0 && 
                          selectedFile.type === 'application/pdf';

      console.log('File validation:', {
        selectedFile: !!selectedFile,
        isFile: selectedFile instanceof File,
        size: selectedFile?.size,
        type: selectedFile?.type,
        hasValidFile
      });

      try {
        let response;

        console.log('Starting committee update request...');

        if (hasValidFile) {
          // If we have a file, use FormData (multipart/form-data)
          const formDataToSend = new FormData();
          
          // Append form fields
          Object.entries(formData).forEach(([key, value]) => {
            formDataToSend.append(key, value?.toString() || '');
          });
          
          // Append the file and username
          formDataToSend.append('file', selectedFile);
          formDataToSend.append('username', payload.username);

          console.log('Sending with file - FormData entries:');
          for (let [key, value] of formDataToSend.entries()) {
            console.log(key, value);
          }

          response = await axios.patch(
            `${API_BASE_URL}/api/committees/${committeeId}`,
            formDataToSend
          );

          console.log('FormData response:', response.status, response.data);
        } else {
          // If no file, send JSON data
          const jsonData = {
            committeeNo: formData.committeeNo,
            committeeDate: formData.committeeDate,
            committeeTitle: formData.committeeTitle,
            committeeBossName: formData.committeeBossName,
            sex: formData.sex,
            committeeCount: formData.committeeCount,
            sexCountPerCommittee: formData.sexCountPerCommittee,
            notes: formData.notes || null,
            userID: parseInt(userID),
          };

          console.log('Sending without file - JSON data:', jsonData);

          response = await axios.patch(
            `${API_BASE_URL}/api/committees/${committeeId}/json`,
            jsonData,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('JSON response:', response.status, response.data);
        }

        console.log('Update request completed with status:', response.status);

        if (response.status === 200 || response.status === 201) {
          toast.success('تم تعديل اللجنة بنجاح!');
          
          // Only reset file-related state, keep form data as is
          setSelectedFile(null);
          if (dropzoneRef.current) {
            dropzoneRef.current.reset(true);
          }
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error updating committee:', error);
        
        let message = 'فشل في تحديث اللجنة. يرجى المحاولة مرة أخرى';

        if (axios.isAxiosError(error)) {
          if (error.response?.data) {
            console.error('Server error response:', error.response.data);
            
            if (typeof error.response.data === 'string') {
              message += `: ${error.response.data}`;
            } else if (error.response.data.detail) {
              message += `: ${error.response.data.detail}`;
            } else if (error.response.data.message) {
              message += `: ${error.response.data.message}`;
            } else {
              message += `: ${JSON.stringify(error.response.data)}`;
            }
          } else if (error.message) {
            message += `: ${error.message}`;
          }
        } else if (error instanceof Error) {
          message += `: ${error.message}`;
        }

        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, selectedFile, committeeId, userID, API_BASE_URL, payload.username]
  );

  const renderPDFs = useMemo(() => {
    if (pdfFiles.length === 0) {
      return (
        <motion.div variants={inputVariants} className="mt-6 text-center">
          <p className="font-arabic text-gray-500">لا توجد ملفات PDF مرفقة</p>
        </motion.div>
      );
    }

    return (
      <motion.div variants={inputVariants} className="mt-6">
        <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-teal-500 text-white font-arabic hover:from-blue-600 hover:to-teal-600 transition-all duration-300"
              onClick={() => setPdfDialogOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              عرض ملفات PDF ({pdfFiles.length})
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[90vw] md:max-w-[700px] lg:max-w-[800px] p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl max-h-[80vh] overflow-y-auto"
            dir="rtl"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-blue-700 font-arabic text-center">
                ملفات PDF المرتبطة باللجنة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {pdfFiles.map((pdf, index) => (
                <motion.div
                  key={pdf.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-xl border border-blue-100 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-100 to-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
                        <div>
                          <p className="text-lg font-bold text-gray-800 font-arabic">
                            رقم اللجنة: {pdf.committeeNo || 'غير متوفر'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 text-right space-y-3">
                      <div className="flex items-center gap-x-2 text-gray-700 font-arabic">
                        <span className="font-semibold">تاريخ الإضافة:</span>
                        <span>{pdf.currentDate || 'غير متوفر'}</span>
                      </div>
                      <div className="flex items-center gap-x-2 text-gray-700 font-arabic">
                        <span className="font-semibold">المستخدم:</span>
                        <span className="text-blue-600 font-bold">
                          {pdf.username || 'غير معروف'}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end p-4 bg-gray-50">
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-arabic font-semibold flex items-center gap-2 transition-transform duration-200 hover:scale-105"
                        onClick={() => {
                          window.open(
                            `${API_BASE_URL}/api/committees/pdf/file/${pdf.id}`,
                            '_blank'
                          );
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        عرض الملف
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }, [pdfFiles, pdfDialogOpen, API_BASE_URL]);

  if (isLoading) {
    console.log('Component is in loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="font-arabic text-xl text-gray-600">جاري التحميل...</p>
          <p className="text-sm text-gray-500 mt-2">Committee ID: {committeeId}</p>
        </div>
      </div>
    );
  }

  console.log("committeeID: " + committeeId);

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-sky-50/50 py-4 sm:py-6 md:py-8 lg:py-12"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-sky-100/50">
        <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-3xl font-bold font-arabic text-center text-sky-600 mb-6 sm:mb-8">
          تحديث اللجنة رقم {formData.committeeNo}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Committee Number */}
            <motion.div variants={inputVariants}>
              <label
                htmlFor="committeeNo"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                رقم اللجنة
              </label>
              <input
                id="committeeNo"
                name="committeeNo"
                type="text"
                value={formData.committeeNo}
                onChange={handleChange}
                className="w-full px-4 py-4 border h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </motion.div>

            {/* Committee Date */}
            <motion.div variants={inputVariants}>
              <label
                htmlFor="committeeDate"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                تاريخ اللجنة
              </label>
              <ArabicDatePicker
                selected={formData.committeeDate}
                onChange={(date) => handleDateChange('committeeDate', date)}
                allowEmpty={false}
              />
            </motion.div>

            {/* Committee Title */}
            <motion.div variants={inputVariants} className="sm:col-span-2 lg:col-span-1">
              <label
                htmlFor="committeeTitle"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                عنوان اللجنة
              </label>
              <input
                id="committeeTitle"
                name="committeeTitle"
                type="text"
                value={formData.committeeTitle}
                onChange={handleChange}
                className="w-full px-4 py-4 border h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </motion.div>

            {/* Committee Boss Name */}
            <motion.div variants={inputVariants}>
              <label
                htmlFor="committeeBossName"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                اسم رئيس اللجنة
              </label>
              <input
                id="committeeBossName"
                name="committeeBossName"
                type="text"
                value={formData.committeeBossName}
                onChange={handleChange}
                className="w-full px-4 py-4 border h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              />
            </motion.div>

            {/* Sex */}
            <motion.div variants={inputVariants}>
              <label
                htmlFor="sex"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                الجنس
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-4 py-2 h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                required
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </motion.div>

            {/* Committee Count */}
            <motion.div variants={inputVariants}>
              <label
                htmlFor="committeeCount"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                عدد اللجنة
              </label>
              <input
                id="committeeCount"
                name="committeeCount"
                type="number"
                value={formData.committeeCount}
                onChange={handleChange}
                className="w-full px-4 py-4 border h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                min="0"
              />
            </motion.div>

            {/* Sex Count Per Committee */}
            <motion.div variants={inputVariants}>
              <label
                htmlFor="sexCountPerCommittee"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                عدد الجنس في اللجنة
              </label>
              <input
                id="sexCountPerCommittee"
                name="sexCountPerCommittee"
                type="number"
                value={formData.sexCountPerCommittee}
                onChange={handleChange}
                className="w-full px-4 py-4 border h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
                min="0"
              />
            </motion.div>

            {/* Notes */}
            <motion.div variants={inputVariants} className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="notes"
                className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right"
              >
                ملاحظات
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all duration-200 font-arabic text-right resize-y text-sm leading-6 placeholder:text-center placeholder:font-extrabold placeholder:text-gray-300 placeholder:italic"
                rows={4}
              />
            </motion.div>
          </div>

          {/* Dropzone for PDF Upload */}
          <motion.div variants={inputVariants} className="mt-6">
            <label className="block text-sm font-extrabold font-sans text-gray-700 mb-1 text-right">
              تحميل ملف PDF جديد
            </label>
            <DropzoneComponent
              ref={dropzoneRef}
              onFilesAccepted={handleFilesAccepted}
              onFileRemoved={handleFileRemoved}
              onBookPdfLoaded={handleCommitteePdfLoaded} 
              username={payload.username}           
            />
          </motion.div>

          {/* Display PDFs */}
          {renderPDFs}

          {/* Submit Button */}
          <motion.div
            className="flex justify-center mt-6"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-2 bg-sky-600 hover:bg-sky-700 text-white font-arabic font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري التحديث...' : 'تحديث اللجنة'}
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}