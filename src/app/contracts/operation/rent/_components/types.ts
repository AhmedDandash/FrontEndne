/**
 * Shared view-model types for the Operations (rent) contracts page.
 * Extracted from the former monolithic page.tsx during the Phase 2 refactor.
 */
import type React from 'react';

/** ContractStatus enum (API): 1=Draft, 2=Signed, 3=Executing, 4=Finished */
export type ContractStatusKey = 'draft' | 'signed' | 'executing' | 'finished';

/** UI view model — a flattened, display-ready projection of EmploymentOperatingContract. */
export interface RentContract {
  id: string;
  /** Customer UUID (GUID) — never coerce to number */
  customerId: string;
  contractNumber: string;
  customerName: string;
  customerNameAr: string;
  customerPhone: string;
  /** API contractStatus mapped to a display key */
  status: ContractStatusKey;
  /** Raw API contractStatus number (1-4) */
  contractStatus: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  totalCollected: number;
  remainingAmount: number;
  workerName: string;
  workerNameAr: string;
  nationality: string;
  nationalityAr: string;
  nationalityId: string;
  profession: string;
  professionAr: string;
  branch: string;
  branchAr: string;
  daysRemaining: number;
  createdAt: string;
  notes: string;
}

export interface StatusMeta {
  color: string;
  label: string;
  icon: React.ReactNode;
}
