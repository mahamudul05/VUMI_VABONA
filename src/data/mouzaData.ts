// ============================================================
// Bangladesh Mouza Database (Official Settlement Survey Data)
// Consolidated 57,000+ Mouzas across Bangladesh Districts & Upazilas
// ============================================================
import type { MouzaData } from './locations';
import mouzaRawData from './mouzaData.json';

export interface MouzaExtendedData extends MouzaData {
  area?: string;
  surveyPeriod?: string;
  gazetteDate?: string;
  remarks?: string;
  sheetCount?: string;
}

export const mouzaDatabase: Record<string, Record<string, MouzaExtendedData[]>> = mouzaRawData as unknown as Record<
  string,
  Record<string, MouzaExtendedData[]>
>;
