export interface PDFResponse {
  id: number;
  committeeNo: string | null;
  pdf: string | null;
  currentDate: string | null;
  username: string | null;
}

export interface CommitteeResponse {
  id: number;
  committeeNo: string;
  committeeDate: string | null;
  committeeTitle: string;
  committeeBossName: string;
  sex: string;
  committeeCount: number;
  sexCountPerCommittee: number;
  notes: string;
  currentDate: string | null;
  userID: number;
  username: string;
  pdfFiles: PDFResponse[];
}

export interface CommitteeInsertionType {
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  sex: string;
  committeeCount: string;
  sexCountPerCommittee: string;
  notes: string;
  currentDate: string;
  userID: string;
}