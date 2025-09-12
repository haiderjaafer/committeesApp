export interface CommitteeReportData {
  committeeDate_from: string;
  committeeDate_to: string;
  [key: string]: string;
}

export interface CommitteeRecord {
  id: number;
  committeeNo: string;
  committeeDate: string;
  committeeTitle: string;
  committeeBossName: string;
  committeeCount: number;
  sex: string;
  sexCountPerCommittee: number;
  notes: string;
  currentDate: string;
  userID: number;
  username: string;
}