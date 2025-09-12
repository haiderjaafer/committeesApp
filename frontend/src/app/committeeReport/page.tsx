import CommitteeReportForm from '@/components/report/CommitteeReportFormSelection';
import { Metadata } from 'next';
import { TbReportSearch } from "react-icons/tb";

export const metadata: Metadata = {
  title: 'تقرير اللجان بين تاريخين',
  description: 'تقرير اللجان بين تاريخين',
};

export default function CommitteeReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto p-6 max-w-2xl ">
       
        <div className="bg-white rounded-lg shadow-md p-6 ">

          <TbReportSearch size={40} color='gray'/>
       
    <h1 className="text-2xl font-extrabold mb-6 text-gray-800 text-center ">
            تقارير النظام
          </h1>
          
          
          {/* Client component for interactive form */}
          <CommitteeReportForm />
        </div>
      </div>
    </div>
  );
}
