import HeroSectionHomePageComponent from "@/components/HeroSection/HeroSectionHomePageComponent";

const HeroSectionHomePage = () => {

  return (
   <HeroSectionHomePageComponent/>
  );
};

export default HeroSectionHomePage;



// 'use client';

// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import EmployeeSelectionDialog from '@/components/EmployeeSelectionDialog';
// import { toast } from 'react-toastify';
// import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import { User, Hash, X, Users } from 'lucide-react';

// // Step 1: Employee interface
// interface Employee {
//   empID: number;
//   name: string;
//   employee_desc: number;
//   gender?: number;
//   genderName?: string;
// }

// export default function CommitteeForm() {
//   // Form state
//   const [committeeNo, setCommitteeNo] = useState('');
//   const [committeeTitle, setCommitteeTitle] = useState('');
//   const [committeeBossName, setCommitteeBossName] = useState('');
//   const [notes, setNotes] = useState('');
  
//   // ✅ Selected employee IDs state
//   const [selectedEmployeeIDs, setSelectedEmployeeIDs] = useState<number[]>([]);

//   // ✅ Step 2: Fetch selected employees details
//   const { data: selectedEmployees, isLoading: isLoadingEmployees } = useQuery<Employee[], Error>({
//     queryKey: ['selected-employees-details', selectedEmployeeIDs],
//     queryFn: async () => {
//       if (selectedEmployeeIDs.length === 0) {
//         return [];
//       }

//       try {
//         console.log('Fetching employee details for IDs:', selectedEmployeeIDs);
        
//         const promises = selectedEmployeeIDs.map(async (empID) => {
//           const response = await axios.get(
//             `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/employees/${empID}`,
//             { withCredentials: true }
//           );
//           return response.data.data;
//         });
        
//         const employees = await Promise.all(promises);
//         console.log('Loaded employee details:', employees);
//         return employees;
//       } catch (err) {
//         console.error('Error fetching employee details:', err);
//         return [];
//       }
//     },
//     enabled: selectedEmployeeIDs.length > 0,
//     staleTime: 60000, // Cache for 1 minute
//   });

//   // Step 3: Handle employee selection
//   const handleEmployeesSelected = (empIDs: number[]) => {
//     console.log('Received selected employee IDs:', empIDs);
//     setSelectedEmployeeIDs(empIDs);
//     toast.success(`تم تحديد ${empIDs.length} موظف`);
//   };

//   // Step 4: Remove individual employee
//   const removeEmployee = (empID: number) => {
//     const newIDs = selectedEmployeeIDs.filter(id => id !== empID);
//     setSelectedEmployeeIDs(newIDs);
//     toast.info('تم إزالة الموظف من القائمة');
//   };

//   // Step 5: Handle form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (selectedEmployeeIDs.length === 0) {
//       toast.error('الرجاء اختيار أعضاء اللجنة');
//       return;
//     }

//     const committeeData = {
//       committeeNo,
//       committeeTitle,
//       committeeBossName,
//       notes,
//       employeeIDs: selectedEmployeeIDs,
//     };

//     console.log('Submitting committee:', committeeData);

//     try {
//       // Submit to backend
//       // const response = await axios.post('/api/committees/post', committeeData);
//       toast.success('تم حفظ اللجنة بنجاح');
//     } catch (error) {
//       toast.error('فشل في حفظ اللجنة');
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-3xl font-bold mb-6 text-right font-arabic">
//         إضافة لجنة جديدة
//       </h1>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Committee No */}
//         <div className="space-y-2">
//           <Label htmlFor="committeeNo" className="text-right block font-arabic font-bold">
//             رقم اللجنة
//           </Label>
//           <Input
//             id="committeeNo"
//             value={committeeNo}
//             onChange={(e) => setCommitteeNo(e.target.value)}
//             placeholder="أدخل رقم اللجنة"
//             className="text-right font-arabic"
//             required
//           />
//         </div>

//         {/* Committee Title */}
//         <div className="space-y-2">
//           <Label htmlFor="committeeTitle" className="text-right block font-arabic font-bold">
//             عنوان اللجنة
//           </Label>
//           <Input
//             id="committeeTitle"
//             value={committeeTitle}
//             onChange={(e) => setCommitteeTitle(e.target.value)}
//             placeholder="أدخل عنوان اللجنة"
//             className="text-right font-arabic"
//             required
//           />
//         </div>

//         {/* Committee Boss Name */}
//         <div className="space-y-2">
//           <Label htmlFor="committeeBossName" className="text-right block font-arabic font-bold">
//             رئيس اللجنة
//           </Label>
//           <Input
//             id="committeeBossName"
//             value={committeeBossName}
//             onChange={(e) => setCommitteeBossName(e.target.value)}
//             placeholder="أدخل اسم رئيس اللجنة"
//             className="text-right font-arabic"
//             required
//           />
//         </div>

//         {/* ✅ Employee Selection Dialog */}
//         <div className="space-y-2">
//           <Label className="text-right block font-arabic font-bold">
//             أعضاء اللجنة
//           </Label>
//           <EmployeeSelectionDialog
//             selectedEmployeeIDs={selectedEmployeeIDs}
//             onEmployeesSelected={handleEmployeesSelected}
//             maxSelections={20}
//             triggerButtonText="اختيار أعضاء اللجنة"
//             triggerButtonClassName="w-full h-12 text-base"
//           />
          
//           {selectedEmployeeIDs.length > 0 && (
//             <p className="text-sm text-green-600 font-arabic text-right mt-2">
//               ✓ تم تحديد {selectedEmployeeIDs.length} موظف
//             </p>
//           )}
//         </div>

//         {/* Notes */}
//         <div className="space-y-2">
//           <Label htmlFor="notes" className="text-right block font-arabic font-bold">
//             ملاحظات
//           </Label>
//           <textarea
//             id="notes"
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             placeholder="أدخل ملاحظات إضافية"
//             className="w-full min-h-[100px] p-3 border rounded-md text-right font-arabic"
//           />
//         </div>

//         {/* Submit Button */}
//         <div className="flex gap-4">
//           <Button
//             type="submit"
//             className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-arabic font-bold text-base"
//             disabled={selectedEmployeeIDs.length === 0}
//           >
//             حفظ اللجنة ({selectedEmployeeIDs.length} عضو)
//           </Button>
//           <Button
//             type="button"
//             variant="outline"
//             className="h-12 px-8 font-arabic font-bold"
//             onClick={() => {
//               setCommitteeNo('');
//               setCommitteeTitle('');
//               setCommitteeBossName('');
//               setNotes('');
//               setSelectedEmployeeIDs([]);
//               toast.info('تم مسح النموذج');
//             }}
//           >
//             مسح
//           </Button>
//         </div>

//         {/* ✅ Step 6: Display selected employees with names and IDs */}
//         {selectedEmployeeIDs.length > 0 && (
//           <div className="mt-6 space-y-4">
//             {/* Section Header */}
//             <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-600">
//               <Users className="h-5 w-5 text-blue-600" />
//               <h3 className="font-bold font-arabic text-lg text-blue-700">
//                 الموظفون المحددون
//               </h3>
//             </div>

//             {/* Loading state */}
//             {isLoadingEmployees ? (
//               <div className="p-4 bg-gray-50 rounded-lg text-center">
//                 <p className="text-sm text-gray-600 font-arabic">
//                   جارٍ تحميل بيانات الموظفين...
//                 </p>
//               </div>
//             ) : selectedEmployees && selectedEmployees.length > 0 ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 {selectedEmployees.map((employee, index) => (
//                   <div
//                     key={employee.empID}
//                     className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
//                   >
//                     <div className="flex items-start justify-between">
//                       {/* Employee Info */}
//                       <div className="">
//                         {/* Number Badge */}
//                         {/* <div className="flex items-center gap-2 mb-2">
//                           <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
//                             {index + 1}
//                           </span>
//                           <span className="text-xs text-gray-500 font-arabic">
//                             عضو اللجنة
//                           </span>
//                         </div> */}

//                         {/* Name */}
//                         <div className="flex items-start gap-2 mb-2  ">
//                           <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
//                           <div className="flex-1">
//                             {/* <p className="text-xs text-gray-500 font-arabic">الاسم</p> */}
//                             <p className="text-sm font-bold font-arabic text-gray-800">
//                               {employee.name}
//                             </p>
//                           </div>

//     <div className="flex items-center gap-2">
                         
//                           <div>
                          
//                             <p className="text-sm font-bold text-purple-600">
//                               {employee.employee_desc}
//                             </p>
//                           </div>
//                         </div>

//                         </div>

//                         {/* Employee ID */}
//                         {/* <div className="flex items-center gap-2 mb-2">
//                           <Hash className="h-4 w-4 text-green-600" />
//                           <div>
//                             <p className="text-xs text-gray-500 font-arabic">معرف الموظف (empID)</p>
//                             <p className="text-sm font-bold text-green-600">
//                               {employee.empID}
//                             </p>
//                           </div>
//                         </div> */}

//                         {/* Employee Desc */}
//                         {/* <div className="flex items-center gap-2">
//                           <Hash className="h-4 w-4 text-purple-600" />
//                           <div>
//                             <p className="text-xs text-gray-500 font-arabic">رقم الموظف</p>
//                             <p className="text-sm font-bold text-purple-600">
//                               {employee.employee_desc}
//                             </p>
//                           </div>
//                         </div> */}

//                         {/* Gender */}
//                         {/* {employee.genderName && (
//                           <div className="mt-2">
//                             <span className="text-xs bg-gray-200 px-2 py-1 rounded font-arabic">
//                               {employee.genderName}
//                             </span>
//                           </div>
//                         )} */}
//                       </div>

//                       {/* Remove Button */}
//                       <button
//                         type="button"
//                         onClick={() => removeEmployee(employee.empID)}
//                         className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
//                         title={`إزالة ${employee.name}`}
//                       >
//                         <X className="h-5 w-5 text-red-500 hover:text-red-700" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="p-4 bg-gray-50 rounded-lg text-center">
//                 <p className="text-sm text-gray-600 font-arabic">
//                   فشل في تحميل بيانات الموظفين
//                 </p>
//               </div>
//             )}

//             {/* Summary Card */}
//             <div className="bg-blue-600 text-white rounded-lg p-4">
//               <div className="flex items-center justify-between">
//                 <div className="text-right">
//                   <p className="text-sm opacity-90 font-arabic">إجمالي الأعضاء</p>
//                   <p className="text-3xl font-bold">{selectedEmployeeIDs.length}</p>
//                 </div>
//                 <Users className="h-12 w-12 opacity-50" />
//               </div>
//             </div>

//             {/* ✅ Raw Data (for debugging) */}
//             <details className="bg-gray-100 rounded-lg p-4">
//               <summary className="cursor-pointer font-bold font-arabic text-gray-700 mb-2">
//                 🔍 عرض البيانات الخام (للمطورين)
//               </summary>
//               <div className="mt-2">
//                 <p className="font-bold font-arabic mb-2 text-sm text-gray-600">
//                   معرفات الموظفين المحددة (Employee IDs):
//                 </p>
//                 <pre className="bg-white p-3 rounded border overflow-x-auto text-xs">
//                   {JSON.stringify(selectedEmployeeIDs, null, 2)}
//                 </pre>

//                 {selectedEmployees && selectedEmployees.length > 0 && (
//                   <>
//                     <p className="font-bold font-arabic mt-4 mb-2 text-sm text-gray-600">
//                       بيانات الموظفين الكاملة:
//                     </p>
//                     <pre className="bg-white p-3 rounded border overflow-x-auto text-xs max-h-60 overflow-y-auto">
//                       {JSON.stringify(selectedEmployees, null, 2)}
//                     </pre>
//                   </>
//                 )}
//               </div>
//             </details>
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }