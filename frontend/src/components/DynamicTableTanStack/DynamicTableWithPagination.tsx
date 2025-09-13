'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  HeaderContext, // Added for explicit typing
} from '@tanstack/react-table';
import { useMediaQuery } from 'react-responsive';
import {  HeaderMap, PDF, PDFRecord, CommitteeDataTable } from './types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, BookOpen, ArrowUpDown,Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { GrUpdate,GrDocumentPdf } from "react-icons/gr";

import { AlertDialogDelete } from './AlertDialogDelete';


interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

interface DynamicTableProps<T extends CommitteeDataTable> {
  data: T[];
  headerMap?: HeaderMap;
  excludeFields?: string[];
  pagination?: Pagination;
}

export default function DynamicTable<T extends CommitteeDataTable>({
  data,
  headerMap = {},
  excludeFields = [],
  pagination,
}: DynamicTableProps<T>) {
  const [isMounted, setIsMounted] = useState(false);
  const [editDialogOpen, setEditDialog] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);
  const [selectedPdfs, setSelectedPdfs] = useState<PDF[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoadingPdfs, setIsLoadingPdfs] = useState(false);


  const [pdfs, setPdfs] = useState<PDFRecord[]>([]);

  console.log("pdf",pdfs);
  

  const [selectedPdf, setSelectedPdf] = useState<PDFRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);



  const isMobile = useMediaQuery({ maxWidth: 640 }) && isMounted;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dynamic truncation for long text fields
  const truncateText = useCallback((text: string, maxWords: number = 3) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}...`;
  }, []);

  // Determine if a field should be truncated
  const shouldTruncate = useCallback((key: string) => {
    return [
      'notes',
      'directoryName',
      'subject',
      'bookAction',
      
    ].includes(key);
  }, []);

  // Get background color for bookStatus
  const getStatusBackgroundColor = useCallback(
    (status: string | null | undefined) => {
      const normalizedStatus = status?.trim().toLowerCase() ?? '';
      switch (normalizedStatus) {
        case 'منجز':
          return 'bg-green-200 text-black text-lg font-extrabold';
        case 'قيد الانجاز':
          return 'bg-red-200 text-black text-lg font-extrabold';
        case 'مداولة':
          return 'bg-gray-200 text-black text-lg font-extrabold';
        default:
          console.warn('Unknown bookStatus:', normalizedStatus);
          return 'bg-gray-200 text-gray-700 text-lg font-extrabold';
      }
    },
    []
  );

  const columns = useMemo<ColumnDef<T>[]>(() => {
    if (data.length === 0) return [];

    const firstItem = data[0];
    const generatedColumns = Object.keys(firstItem)
      .filter((key) => !excludeFields.includes(key))
      .map((key) => {
        const columnDef: ColumnDef<T> = {
          accessorKey: key,
          // CHANGED: Handle header as string or function explicitly
            header: key === 'incomingDate' || key === 'bookDate'
            ? ({ column }: HeaderContext<T, unknown>) => (
                <div className="flex items-center justify-end gap-1">
                  <span>{headerMap[key] || key}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              )
            : headerMap[key] || key,
          cell: ({ row }) => {
            const value = row.getValue(key);
            const valueStr = String(value ?? '');

            // Handle bookStatus
            if (key === 'bookStatus') {
              const status = valueStr;
              const bgColorClass = getStatusBackgroundColor(status);
              return (
                <div
                  className={`text-right px-2 py-1 rounded-lg w-20 ${bgColorClass}`}
                >
                  {valueStr}
                </div>
              );
            }

            // Handle date fields
            if (key === 'bookDate' || key === 'incomingDate') {
              return (
                <div className="text-right px-1 py-1 rounded-lg w-32">
                  {valueStr}
                </div>
              );
            }

            // Handle username
            if (key === 'username') {
              return (
                <div className="text-right font-bold text-blue-600">
                  {valueStr || 'غير معروف'}
                </div>
              );
            }


                 if (key === 'countOfLateBooks') {
              const days = Number(valueStr);
              const bgColor = days > 3 ? 'bg-red-400' : days > 1 ? 'bg-yellow-200' : 'bg-green-200';
              return (
                <div className={`text-right px-2 py-1 rounded-lg font-bold ${bgColor}`}>
                  {valueStr} أيام
                </div>
              );
            }

            // Handle truncatable fields
            if (shouldTruncate(key)) {
              const truncatedText = truncateText(valueStr);
              return (
                <div className="text-right max-w-[200px] relative group">
                  <span className="truncate block">{truncatedText}</span>
                  <span className="absolute z-10 right-0 top-full mt-1 p-2 bg-gray-800 text-white text-sm font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-pre-wrap max-w-xs">
                    {valueStr}
                  </span>
                </div>
              );
            }

            return <div className="text-right">{valueStr}</div>;
          },
          size: 0,
        };

        // Assign column widths
      if (shouldTruncate(key)) {
          columnDef.size = 200;
        } else if (['bookNo', 'bookDate', 'bookStatus', 'incomingDate'].includes(key)) {
          columnDef.size = 100;
        } 
        else if (key === 'username' || key === 'countOfLateBooks') {
          columnDef.size = 150;
        } 

        else if (key === 'currentDate' ) {
          columnDef.size = 150;
        }
        
         else if (key === 'bookType' ) {
          columnDef.size = 70;
        }

        else {
          columnDef.size = 120;
        }

        return columnDef;
      });

    const actionColumn: ColumnDef<T> = {
      id: 'actions',
      header: 'الإجراءات',
      size: 120,
      cell: ({ row }) => (
        <div className="text-right flex items-center gap-2">
          {/* <Button
            className="font-extrabold"
            variant="outline"
            onClick={() => {
              setSelectedRecord(row.original);
               setEditDialog(true);
            }}
          >
            تعديل     
          </Button> */}


          
              <Link 
              
               href={`/updateCommittee/${row.original.id}`} 
                              
                    >
                    
                     <GrUpdate color='green' size={'1.4rem'}   /> 

                    </Link>   
          
          <Button
            variant="ghost"
            className=" cursor-pointer "
            onClick={async () => {
              setIsLoadingPdfs(true);
              try {
               

          

                const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/committees/pdf/${row.original.committeeNo}`,
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true,
            }
          );
          const pdfs = response.data;
          if (pdfs.length === 0) {
            toast.info('لا توجد ملفات PDF لهذا السجل');
          } else {
            setSelectedPdfs(pdfs);
            setPdfDialogOpen(true);
          }
} catch (error: unknown) {
  console.error('Error fetching PDFs:', error);
  
  // Type guard to check if error has the expected structure
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
    console.log('Error status:', axiosError.response?.status);
    console.log('Error detail:', axiosError.response?.data?.detail);
    
    if (axiosError.response?.status === 404) {
      toast.info('لا توجد ملفات PDF لهذا السجل');
    } else {
      toast.error(axiosError.response?.data?.detail || 'فشل تحميل ملفات PDF');
    }
  } else {
    toast.error('فشل تحميل ملفات PDF');
  }

              } finally {
                setIsLoadingPdfs(false);
              }
            }}
            title="عرض ملفات PDF"
          >
            {/* <BookOpen className="h-5 w-5 text-gray-600 " /> */}
            <GrDocumentPdf  color='blue'  size={"2.4rem"} />
          </Button>

           {/* <GrDocumentPdf  color='blue'  size={"2.4rem"} /> */}
        </div>
      ),
    };

    return [...generatedColumns, actionColumn];
  }, [data, headerMap, excludeFields, getStatusBackgroundColor, shouldTruncate, truncateText]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: 120,
      minSize: 50,
      maxSize: 400,
    },
  });

  // Pagination UI with ellipses
  const renderPagination = useCallback(() => {
    if (!pagination) return null;

    const { page, totalPages, onPageChange, onLimitChange, limit } = pagination;
    const pageButtons = [];

    const maxVisibleButtons = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisibleButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    if (startPage > 1) {
      pageButtons.push(
        <Button
          key={1}
          variant={1 === page ? 'default' : 'outline'}
          onClick={() => onPageChange(1)}
          className="mx-1 font-bold"
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pageButtons.push(<span key="start-ellipsis" className="mx-1">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={i === page ? 'default' : 'outline'}
          onClick={() => onPageChange(i)}
          className="mx-1 font-bold"
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons.push(<span key="end-ellipsis" className="mx-1">...</span>);
      }
      pageButtons.push(
        <Button
          key={totalPages}
          variant={totalPages === page ? 'default' : 'outline'}
          onClick={() => onPageChange(totalPages)}
          className="mx-1 font-bold"
        >
          {totalPages}
        </Button>
      );
    }

    return (
      <div className="flex flex-col items-center mt-4 gap-2">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">الصفوف لكل صفحة:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((option) => (
                  <SelectItem
                    key={option}
                    value={option.toString()}
                    className="font-bold"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="font-bold"
          >
            السابق
          </Button>
          {pageButtons}
          <Button
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="font-bold"
          >
            التالي
          </Button>
        </div>
      </div>
    );
  }, [pagination]);

  // Desktop view
  if (!isMounted || !isMobile) {
    return (
      <div className="overflow-x-auto p-4" dir="rtl">
        {data.length === 0 ? (
          <div className="p-4 text-gray-500 text-right">لا توجد بيانات متاحة</div>
        ) : (
          <table
            className="min-w-full table-auto border-collapse border border-gray-200"
            style={{ width: table.getTotalSize() }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-300">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 text-right text-sm font-bold text-gray-900 border border-gray-200"
                      style={{ width: header.column.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2 text-right text-sm font-bold text-gray-700 border border-gray-200"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {renderPagination()}
        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialog}>
          <DialogContent className="sm:max-w-[600px]" dir="rtl" aria-describedby="renderPagination">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">تعديل الكتاب</DialogTitle>
            </DialogHeader>
            {selectedRecord ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto text-right">
                {Object.entries(selectedRecord)
                  .filter(([key]) => key !== 'pdfFiles')
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between border-b pb-1 text-sm"
                    >
                      <span className="font-medium text-gray-800">
                        {headerMap[key] || key}:
                      </span>
                      <span className="text-gray-600">{String(value ?? '')}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div>لا توجد بيانات</div>
            )}
          </DialogContent>
        </Dialog>
        {/* PDF Dialog */}
        <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen} >
          <DialogContent className="sm:max-w-[600px] p-6 bg-gray-50" dir="rtl" aria-describedby="PDF_Dialog">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
                ملفات PDF المرتبطة
              </DialogTitle>
            </DialogHeader>
            {isLoadingPdfs ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : selectedPdfs.length > 0 ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedPdfs.map((pdf) => (
                  <Card
                    key={pdf.id}
                    className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border border-gray-200"
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-1">
                        <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
                        <div>
                          <p className="text-lg font-extrabold text-gray-600">
                            رقم الكتاب: {pdf.committeeNo || 'غير متوفر'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-1">
                      <div className="space-y-2 text-right">
                        <div className="flex items-center gap-x-1">
                          <span className="font-extrabold">تاريخ الإضافة :</span>{' '}
                          <span className="font-extrabold">
                            {pdf.currentDate || 'غير متوفر'}
                          </span>
                        </div>
                        <div className="flex items-center gap-x-1">
                          <span className="font-extrabold">المستخدم :</span>{' '}
                          <span className="font-extrabold text-blue-500">
                            {pdf.username || 'غير معروف'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end pt-1">
                 <section className='flex items-center gap-x-1'>

                       <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors duration-200"
                        onClick={() => {
                          window.open(
                            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/committees/pdf/file/${pdf.id}`
                          );
                        }}
                      >
                        <BookOpen className="mr-2 h-4 w-4" /> فتح الملف
                      </Button>

                           <Button
                        variant="default"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold transition-colors duration-200"
     
onClick={() => {
    setSelectedPdf({
      id: pdf.id,
      committeeNo:pdf.committeeNo,
      pdf: pdf.pdf,
      currentDate: pdf.currentDate,
    });
    setIsDialogOpen(true); // Open the dialog
  }}




                       
  // alert(`pdf file will be delete${pdf.id}`);
  // alert(`pdf file will be delete${pdf.pdf}`);
  // if (!confirm(`هل أنت متأكد من حذف الملف ${pdf.pdf} (ID: ${pdf.id})؟`)) return;

  // try {
  //   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/bookFollowUp/delete_pdf`;
  //   console.log("Deleting PDF with payload:", { id: pdf.id, pdf: pdf.pdf });
  //   const res = await fetch(url, {
  //     method: "DELETE",
  //     headers: {
  //       "Accept": "application/json",
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ id: pdf.id, pdf: pdf.pdf?.replace(/\//g, "\\") }), // Normalize to backslashes
  //   });
  //   if (!res.ok) {
  //     const errorData = await res.json().catch(() => ({}));
  //     throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
  //   }
  //   const result = await res.json();
  //   if (result.success) {
  //     toast.success(`تم حذف الملف ${pdf.pdf}`);
  //     setPdfs((prev:any) => prev.filter((item:any) => item.id !== pdf.id));
  //   } else {
  //     toast.error("فشل حذف الملف");
  //   }
  // } catch (error: any) {
  //   console.error("Error deleting PDF:", error);
  //   toast.error(`فشل حذف الملف: ${error.message}`);
  // }


                      
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> حذف الملف
                      </Button>

                      {selectedPdf && (
  <AlertDialogDelete
    open={isDialogOpen}
    onOpenChange={setIsDialogOpen}
    pdf={selectedPdf}
    setPdfs={setPdfs}
  />
)}

                 </section>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد ملفات PDF
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Mobile view
  return (
    <div className="space-y-4 p-4" dir="rtl">
      {data.length === 0 ? (
        <div className="p-4 text-gray-500 text-right">لا توجد بيانات متاحة</div>
      ) : (
        data.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 p-4 rounded-md bg-white shadow-sm"
          >
            {columns.map((column) => {
              if (
                'accessorKey' in column &&
                typeof column.accessorKey === 'string'
              ) {
                const key = column.accessorKey;
                const value = item[key as keyof T];
                const valueStr = String(value ?? '');

                if (key === 'bookStatus') {
                  const status = valueStr;
                  const bgColorClass = getStatusBackgroundColor(status);
                  return (
                    <div
                      key={key}
                      className="mb-2 flex justify-between"
                    >
                      <strong className="text-gray-900">
                        {headerMap[key] || key}:
                      </strong>
                      <span
                        className={`text-gray-700 px-2 py-1 rounded ${bgColorClass}`}
                      >
                        {valueStr}
                      </span>
                    </div>
                  );
                }

                if (key === 'username') {
                  return (
                    <div key={key} className="mb-2 flex justify-between">
                      <strong className="text-gray-900">
                        {headerMap[key] || key}:
                      </strong>
                      <span className="text-blue-600 font-bold">
                        {valueStr || 'غير معروف'}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={key} className="mb-2 flex justify-between">
                    <strong className="text-gray-900">
                      {headerMap[key] || key}:
                    </strong>
                    <span className="text-gray-700">{valueStr}</span>
                  </div>
                );
              }
              if (column.id === 'actions') {
                return (
                  <div key="actions" className="mt-2 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="font-bold"
                      onClick={() => {
                        setSelectedRecord(item);
                        setEditDialog(true);
                      }}
                    >
                      تعديل    
                    </Button>
                   
                    <Button
                      variant="ghost"
                      className="p-2"
                      onClick={async () => {
                        setIsLoadingPdfs(true);
                        try {
                          const response = await axios.get(
                            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/committees/pdf/${item.bookNo}`
                          );
                          const pdfs = response.data;
                          if (pdfs.length === 0) {
                            toast.info('لا توجد ملفات PDF لهذا السجل');
                          } else {
                            setSelectedPdfs(pdfs);
                            setPdfDialogOpen(true);
                          }
                        } catch (error) {
                          console.error('Error fetching PDFs:', error);
                          toast.error(`فشل تحميل ملفات PDF...`);
                        } finally {
                          setIsLoadingPdfs(false);
                        }
                      }}
                      title="عرض ملفات PDF"
                    >
                      <BookOpen className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))
      )}
      {renderPagination()}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl" aria-describedby='bookUpdate'>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">تعديل الكتاب</DialogTitle>
          </DialogHeader>
          {selectedRecord ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto text-right">
              {Object.entries(selectedRecord)
                .filter(([key]) => key !== 'pdfFiles')
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b pb-1 text-sm"
                  >
                    <span className="font-medium text-gray-800">
                      {headerMap[key] || key}:
                    </span>
                    <span className="text-gray-600">{String(value ?? '')}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div>لا توجد بيانات</div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-6 bg-gray-50" dir="rtl" aria-describedby='attachments_books'>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
              ملفات PDF المرتبطة
            </DialogTitle>
          </DialogHeader>
          {isLoadingPdfs ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : selectedPdfs.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {selectedPdfs.map((pdf) => (
                <Card
                  key={pdf.id}
                  className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border border-gray-200"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-1">
                      <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
                      <div>
                        <p className="text-lg font-extrabold text-gray-600">
                          رقم الكتاب: {pdf.committeeNo || 'غير متوفر'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-x-1">
                        <span className="font-extrabold">تاريخ الإضافة :</span>{' '}
                        <span className="font-extrabold">
                          {pdf.currentDate || 'غير متوفر'}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <span className="font-extrabold">المستخدم :</span>{' '}
                        <span className="font-extrabold text-blue-500">
                          {pdf.username || 'غير معروف'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end pt-1">
                    <Button
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors duration-200"
                      onClick={() => {
                        window.open(
                          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/bookFollowUp/pdf/file/${pdf.id}`
                        );
                      }}
                    >
                      <BookOpen className="mr-2 h-4 w-4" /> فتح الملف
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد ملفات PDF
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}