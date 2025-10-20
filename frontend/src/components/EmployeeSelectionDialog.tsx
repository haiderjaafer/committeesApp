'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Save, X } from 'lucide-react';

import { toast } from 'react-toastify';
import MultiSelectEmployees from './employee';

interface EmployeeSelectionDialogProps {
  selectedEmployeeIDs: number[];
  onEmployeesSelected: (empIDs: number[]) => void;
  maxSelections?: number;
  triggerButtonText?: string;
  triggerButtonClassName?: string;
}

const EmployeeSelectionDialog: React.FC<EmployeeSelectionDialogProps> = ({
  selectedEmployeeIDs,
  onEmployeesSelected,
  maxSelections,
  triggerButtonText = "اختيار الموظفين",
  triggerButtonClassName = ""
}) => {
  // Step 1: Local state for dialog
  const [open, setOpen] = useState(false);
  const [tempSelectedIDs, setTempSelectedIDs] = useState<number[]>(selectedEmployeeIDs);

  // Step 2: Handle dialog open - initialize temp state
  const handleDialogOpen = () => {
    console.log('Dialog opened with selected IDs:', selectedEmployeeIDs);
    setTempSelectedIDs(selectedEmployeeIDs);
    setOpen(true);
  };

  // Step 3: Handle save - confirm selection
  const handleSave = () => {
    console.log('Saving selected employee IDs:', tempSelectedIDs);
    
    if (tempSelectedIDs.length === 0) {
      toast.warning('الرجاء اختيار موظف واحد على الأقل');
      return;
    }

    // Pass selected IDs to parent
    onEmployeesSelected(tempSelectedIDs);
    
    // Show success message
    toast.success(`تم حفظ ${tempSelectedIDs.length} موظف`);
    
    // Close dialog
    setOpen(false);
  };

  // Step 4: Handle cancel - revert changes
  const handleCancel = () => {
    console.log('Canceling selection, reverting to:', selectedEmployeeIDs);
    setTempSelectedIDs(selectedEmployeeIDs);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Button
      variant="outline"
      onClick={handleDialogOpen}
      className={`font-arabic ${triggerButtonClassName}`}
    >
      <Users className="ml-2 h-4 w-4" />
      {triggerButtonText}
      {selectedEmployeeIDs.length > 0 && (
        <span className="mr-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
          {selectedEmployeeIDs.length}
        </span>
      )}
    </Button>
  </AlertDialogTrigger>

  <AlertDialogContent
    dir="rtl"
     className="!max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl"

  >
    <AlertDialogHeader>
      <AlertDialogTitle className="text-2xl font-bold text-right font-arabic flex items-center gap-2">
        <Users className="h-6 w-6 text-blue-600" />
        اختيار أعضاء اللجنة
      </AlertDialogTitle>
      <AlertDialogDescription className="text-right font-arabic text-base">
        ابحث عن الموظفين واختر أعضاء اللجنة. يمكنك البحث بالاسم الأول والثاني أو رقم الموظف.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="py-4">
      <MultiSelectEmployees
        value={tempSelectedIDs}
        onChange={setTempSelectedIDs}
        maxSelections={maxSelections}
        placeholder="ابحث عن الموظفين بالاسم أو الرقم"
      />
    </div>

    {/* <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <p className="text-sm font-bold text-blue-700 text-right font-arabic">
        📊 ملخص الاختيار:
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-700 font-arabic">
          عدد الموظفين المحددين:
        </span>
        <span className="text-lg font-bold text-blue-600">
          {tempSelectedIDs.length}
          {maxSelections && ` / ${maxSelections}`}
        </span>
      </div>
    </div> */}

    <AlertDialogFooter className="gap-2 sm:gap-2">
      <AlertDialogCancel
        onClick={handleCancel}
        className="font-bold font-arabic"
      >
        <X className="ml-2 h-4 w-4" />
        إلغاء
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={handleSave}
        disabled={tempSelectedIDs.length === 0}
        className="bg-blue-600 hover:bg-blue-700 font-bold font-arabic"
      >
        <Save className="ml-2 h-4 w-4" />
        حفظ ({tempSelectedIDs.length})
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

  );
};

export default EmployeeSelectionDialog;