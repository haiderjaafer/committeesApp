'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, User, Hash, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';

interface Employee {
  empID: number;
  name: string;
  employee_desc: number;
  gender?: number;
  genderName?: string;
}

interface CommitteeEmployeesDialogProps {
  committeeId: number;
  employeeCount: number | string;
  committeeName?: string | null;
}

const CommitteeEmployeesDialog: React.FC<CommitteeEmployeesDialogProps> = ({
  committeeId,
  employeeCount,
  committeeName
}) => {
  const [open, setOpen] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Fetch employees when dialog opens
  const { data: employees, isLoading, error } = useQuery<Employee[], Error>({
    queryKey: ['committee-employees', committeeId],
    queryFn: async () => {
      try {
        console.log('Fetching employees for committee:', committeeId);
        
        const response = await axios.get(
          `${API_BASE_URL}/api/employees/${committeeId}/employees`,
          { withCredentials: true }
        );
        
        console.log('Employees loaded:', response.data);
        return response.data;
      } catch (err) {
        console.error('Error loading employees:', err);
        toast.error('فشل في تحميل بيانات الموظفين');
        throw err;
      }
    },
    enabled: open,
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          className="underline text-green-600 font-extrabold underline-offset-4 hover:text-green-700 transition-colors cursor-pointer"
          title="عرض الأعضاء"
        >
          {employeeCount || 'غير معروف'}
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent
        dir="rtl"
        className="max-w-3xl w-[900px] max-h-[85vh] overflow-y-auto"
      >
        {/*  Close Button at Top Right */}
        <button
          onClick={() => setOpen(false)}
          className="absolute left-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-50"
          title="إغلاق"
        >
          <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </button>

        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-right font-arabic flex items-center gap-2 pr-8">
            <Users className="h-6 w-6 text-blue-600" />
            أعضاء اللجنة
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right font-arabic text-base">
            {committeeName && (
              <span className="block text-gray-700 font-bold mb-2">
                {committeeName}
              </span>
            )}
            <span className="text-blue-600 font-semibold">
              عدد الأعضاء: {employeeCount}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Content */}
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-3 text-gray-600 font-arabic">
                جارٍ تحميل البيانات...
              </span>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <p className="text-red-600 font-arabic">
                فشل في تحميل بيانات الموظفين
              </p>
            </div>
          ) : !employees || employees.length === 0 ? (
            <div className="text-center p-8">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-arabic">
                لا يوجد موظفين في هذه اللجنة
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 mb-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-sm opacity-90 font-arabic">إجمالي الأعضاء</p>
                    <p className="text-4xl font-bold">{employees.length}</p>
                  </div>
                  <Users className="h-12 w-12 opacity-50" />
                </div>
              </div>

              {/* Employee Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employees.map((employee, index) => (
                  <div
                    key={employee.empID}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Employee Number Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xs font-light text-gray-500 font-arabic">
                        عضو اللجنة
                      </span>
                    </div>

                    {/* Employee Name */}
                    <div className="flex items-start gap-2 mb-3">
                      <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-500 font-arabic">الاسم الكامل</p>
                        <p className="text-sm font-bold font-arabic text-gray-800 leading-relaxed">
                          {employee.name}
                        </p>
                      </div>
                    </div>

                    {/* Employee Details */}
                    <div className="space-y-2">
                      {/* Employee ID */}
                      {/* <div className="flex items-center gap-2 bg-white rounded-md p-2">
                        <Hash className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500 font-arabic">
                          معرف الموظف:
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {employee.empID}
                        </span>
                      </div> */}

                      {/* Employee Desc */}
                      <div className="flex items-center gap-2 bg-white rounded-md p-2">
                        <Hash className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-bold text-gray-500 font-arabic">
                          رقم الموظف:
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {employee.employee_desc}
                        </span>
                      </div>

                      {/* Gender */}
                      {employee.genderName && (
                        <div className="flex items-center gap-2 bg-white rounded-md p-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-bold text-gray-500 font-arabic">
                            الجنس:
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {employee.genderName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Close Button */}
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => setOpen(false)}
            className="font-arabic font-bold"
          >
            <X className="ml-2 h-4 w-4" />
            إغلاق
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CommitteeEmployeesDialog;