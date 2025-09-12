import { ColumnDef } from "@tanstack/react-table";

// Define the base TableData type using unknown instead of any
export interface TableData {
  [key: string]: unknown;
}

// Extend ColumnDef to include size and other properties
export type AccessorColumnDef<T extends TableData> = ColumnDef<T> & {
  accessorKey: string;
  header: string;
  size?: number; // Explicitly include size
};

// HeaderMap for mapping field names to display names
export interface HeaderMap {
  [key: string]: string;
}

// Add PDF type for pdfFiles
export interface PDF {
  id: number;
  pdf: string;
  committeeNo: string | null;
  currentDate: string | null;
  username: string | null;  // Added username
  countPdf: string | null;
}

// Update TableData to include pdfFiles
export interface CommitteeDataTable extends TableData {
  serialNo:number;
  id: number;
  committeeNo: string | null;
  committeeDate: string | null;
  committeeTitle: string | null;
  committeeBossName: string | null;
  sex: string | null;
  committeeCount: string | null;
  sexCountPerCommittee: string | null;
  notes: string | null;
  currentDate: string | null;
  userID: number | null;
  username: string | null;
  pdfFiles: PDF[];
  countOfCommitteeBooks?: number; // Optional for lateBooks
}

export const HeaderMap: HeaderMap = {
  serialNo:"ت",
  id: "الايدي",
  committeeNo: "رقم اللجنة",
  committeeDate: "تأريخ اللجنة",
  committeeTitle: "عنوان اللجنة",
  committeeBossName: "رئيس اللجنة",
  sex: "الجنس",
  committeeCount: "عدد اعظاء اللجنة",
  sexCountPerCommittee: "العدد",
  notes: "الملاحظات",
  currentDate: "تأريخ الادخال",
  userID: "ايدي المستخدم",
  username: "المستخدم",
  countOfCommitteeBooks: "عدد الكتب",
};

export interface PDFRecord {
  id: number;
  bookID?: string | null;
  committeeNo: string | null;
  countPdf?: string | null;
  pdf: string | null;
  userID?: string | null;
  currentDate: string | null;
}





















