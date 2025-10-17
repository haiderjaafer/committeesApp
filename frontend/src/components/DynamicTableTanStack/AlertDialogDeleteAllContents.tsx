'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle } from 'lucide-react';

interface CommitteeDeleteInfo {
  id: number;
  committeeNo: string | null;
  committeeTitle: string | null;
}

interface AlertDialogDeleteAllContentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committee: CommitteeDeleteInfo | null;
  onDeleteSuccess?: () => void;
}

export default function AlertDialogDeleteAllContents({
  open,
  onOpenChange,
  committee,
  onDeleteSuccess,
}: AlertDialogDeleteAllContentsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  if (!committee) {
    return null;
  }

  const handleDelete = async () => {
    if (!committee) {
      toast.error('لم يتم تحديد اللجنة');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Deleting committee:', committee.id);

      const response = await axios.delete(
        `${API_BASE_URL}/api/committees/${committee.id}`,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.status === 200 || response.status === 204) {
        const responseData = response.data;
        
        console.log('Delete response:', responseData);

        if (responseData?.statistics) {
          const { totalPdfs, filesDeleted, filesFailed } = responseData.statistics;
          
          if (filesFailed > 0) {
            toast.warning(
              `تم حذف اللجنة "${committee.committeeTitle || committee.committeeNo}" بنجاح! ` +
              `تم حذف ${filesDeleted} من ${totalPdfs} ملف. ` +
              `فشل حذف ${filesFailed} ملف.`,
              { autoClose: 5000 }
            );
          } else {
            toast.success(
              `تم حذف اللجنة "${committee.committeeTitle || committee.committeeNo}" بنجاح! ` +
              `تم حذف ${totalPdfs} ملف PDF.`,
              { autoClose: 3000 }
            );
          }
        } else {
          toast.success(
            `تم حذف اللجنة "${committee.committeeTitle || committee.committeeNo}" بنجاح!`,
            { autoClose: 3000 }
          );
        }

        onOpenChange(false);

        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      }
    } catch (error) {
      console.error('Error deleting committee:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 404) {
          toast.error('اللجنة غير موجودة أو تم حذفها مسبقاً');
        } else if (status === 403) {
          toast.error('ليس لديك صلاحية لحذف هذه اللجنة');
        } else if (status === 500) {
          toast.error(
            errorData?.detail || 
            'حدث خطأ في الخادم أثناء حذف اللجنة. يرجى المحاولة مرة أخرى.',
            { autoClose: 5000 }
          );
        } else {
          toast.error(
            errorData?.detail || 
            errorData?.message || 
            'فشل في حذف اللجنة',
            { autoClose: 4000 }
          );
        }
      } else {
        toast.error('حدث خطأ غير متوقع أثناء حذف اللجنة');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
            <AlertTriangle className="h-6 w-6" />
            تأكيد حذف اللجنة
          </AlertDialogTitle>
          {/* ✅ FIXED: Remove AlertDialogDescription wrapper, use div instead */}
        </AlertDialogHeader>

        {/* ✅ Move content outside AlertDialogDescription to avoid nested <p> */}
        <div className="text-right space-y-4 pt-4 px-6 pb-8">
          {/* Committee Info */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-gray-800 font-bold text-base mb-2">
              هل أنت متأكد من حذف هذه اللجنة وجميع محتوياتها؟
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">رقم اللجنة:</span>{' '}
                <span className="text-red-700 font-bold">
                  {committee.committeeNo || 'غير متوفر'}
                </span>
              </div>
              <div>
                <span className="font-semibold">العنوان:</span>{' '}
                <span className="font-bold">
                  {committee.committeeTitle || 'غير متوفر'}
                </span>
              </div>

                <div>
                <span className="font-semibold">id:</span>{' '}
                <span className="font-bold">
                  {committee.id || 'غير متوفر'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning about PDFs */}
          <div className="bg-yellow-50 p-3  rounded-lg border border-yellow-200">
            <div className="text-sm text-yellow-800 font-semibold text-center">
              ⚠️ سيتم حذف اللجنة وجميع ملفات PDF المرتبطة بها نهائياً
            </div>
          </div>

       
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isDeleting}
            className="font-bold "
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 font-bold"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحذف...
              </>
            ) : (
              <>حذف نهائياً</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}