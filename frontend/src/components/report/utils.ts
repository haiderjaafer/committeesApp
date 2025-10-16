import { BossNameFormData } from "../BossNameReportSelection/BossNameComponent";
import { CommitteeReportData } from "./types";

export const buildQueryString = (data: CommitteeReportData): string => {
  const params = new URLSearchParams();

  if (data.committeeDate_from.trim()) {
    params.append("committeeDate_from", data.committeeDate_from);
  }

  if (data.committeeDate_to.trim()) {
    params.append("committeeDate_to", data.committeeDate_to);
  }

  return params.toString();
};


export const buildQueryStringBossName = (data: BossNameFormData): string => {
  const params = new URLSearchParams();

  if (data.bossName && data.bossName.trim()) {
    params.append("bossName", data.bossName.trim());
  }

  return params.toString();
};

export const formatArabicDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\//g, '-');
};

export const validateDateFormat = (value: string): boolean => {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
};