/**
 * Data mapping for the Operations contracts page.
 *
 * Centralises the API → RentContract projection and the status badge metadata
 * that were previously inlined as ~120 lines inside page.tsx. Keeping the
 * projection here lets the page component focus on orchestration.
 *
 * NOTE: `contractNumber`, `totalCollected` and `remainingAmount` are derived/
 * placeholder values carried over verbatim from the original implementation —
 * the list endpoint does not yet return real collection figures. They are
 * preserved (not "fixed") so this refactor stays behaviour-neutral; replacing
 * them with real receipt-voucher totals is tracked as follow-up work.
 */
import React from 'react';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { EmploymentOperatingContract } from '@/types/api.types';
import type { ContractStatusKey, RentContract, StatusMeta } from './types';

interface NameMap {
  (id: string | number | null | undefined): { ar: string; en: string };
}

interface CustomerMap {
  (id: string | number | null | undefined): { ar: string; en: string; phone: string };
}

/** Build a UUID → customer-name/phone resolver from the customers lookup. */
export function buildCustomerResolver(customers: any[]): CustomerMap {
  const map = new Map<string, { ar: string; en: string; phone: string }>();
  customers.forEach((c: any) => {
    const primaryPhone =
      Array.isArray(c.phones) && c.phones.length
        ? (c.phones.find((p: any) => p.isPrimary) || c.phones[0]).phoneNumber
        : c.mobile || c.phone || '';
    map.set(String(c.id), {
      ar: c.arabicName || c.englishName || `#${c.id}`,
      en: c.englishName || c.arabicName || `#${c.id}`,
      phone: primaryPhone || '',
    });
  });
  return (id) => {
    if (!id) return { ar: 'غير معروف', en: 'Unknown', phone: '' };
    return map.get(String(id)) || { ar: 'غير معروف', en: 'Unknown', phone: '' };
  };
}

/** Build a UUID → nationality-name resolver from the nationalities lookup. */
export function buildNationalityResolver(nationalities: any[]): NameMap {
  const map = new Map<string, { ar: string; en: string }>();
  nationalities.forEach((n) => {
    map.set(String(n.id), {
      ar: n.nationalityNameAr || n.nationalityNameEn || String(n.id),
      en: n.nationalityNameEn || n.nationalityNameAr || String(n.id),
    });
  });
  return (id) => {
    if (!id) return { ar: 'غير معروف', en: 'Unknown' };
    return map.get(String(id)) || { ar: 'غير معروف', en: 'Unknown' };
  };
}

/** Build an id → job-name resolver from the jobs lookup. */
export function buildJobResolver(jobs: any[]): NameMap {
  const map = new Map<string, { ar: string; en: string }>();
  jobs.forEach((j: any) => {
    map.set(String(j.id), {
      ar: j.jobNameAr || j.name || `#${j.id}`,
      en: j.jobNameEn || j.jobNameAr || j.name || `#${j.id}`,
    });
  });
  return (id) => {
    if (!id) return { ar: 'غير معروف', en: 'Unknown' };
    return map.get(String(id)) || { ar: 'غير معروف', en: 'Unknown' };
  };
}

const STATUS_KEY_BY_NUMBER: Record<number, ContractStatusKey> = {
  1: 'draft',
  2: 'signed',
  3: 'executing',
  4: 'finished',
};

/**
 * Derive the contract status from the fields the list endpoint actually returns.
 *
 * The API does NOT expose a numeric `contractStatus` (confirmed against the live
 * endpoint — neither the list nor the detail response carries it). The only
 * lifecycle signal available is `isFinish`:
 *   - isFinish === true  → Finished (4)
 *   - isFinish === false → Executing (3)  (activated, not yet finished)
 *   - isFinish == null   → Draft (1)      (created, never activated)
 * `contractStatus` is honoured first if a future API version starts returning it.
 */
function deriveStatus(contract: EmploymentOperatingContract): number {
  if (contract.contractStatus) return contract.contractStatus;
  if (contract.isFinish === true) return 4;
  if (contract.isFinish === false) return 3;
  return 1;
}

/** Project a single API contract into the display view model. */
export function mapContract(
  contract: EmploymentOperatingContract,
  resolveNationality: NameMap,
  resolveJob: NameMap,
  resolveCustomer?: CustomerMap
): RentContract {
  const startDate = contract.contractStartDate || '';
  const endDate = contract.contractEndDate || '';
  const daysRemaining = endDate
    ? Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const cs = deriveStatus(contract);
  const status = STATUS_KEY_BY_NUMBER[cs] ?? 'draft';

  // The list endpoint carries the contract value but no collection figures.
  const monthlyRent = contract.cost ?? contract.offerPrice ?? 0;
  const totalCollected = 0;
  const remainingAmount = monthlyRent;

  const natName = contract.nationalityName
    ? { ar: contract.nationalityName, en: contract.nationalityName }
    : resolveNationality(contract.nationalityId);
  const jobName = contract.jobName
    ? { ar: contract.jobName, en: contract.jobName }
    : resolveJob(contract.jobId as any);
  const cust = resolveCustomer
    ? resolveCustomer(contract.customerId)
    : {
        ar: contract.customerNameAr || 'غير معروف',
        en: contract.customerNameAr || 'Unknown',
        phone: contract.mobile || '',
      };

  // Worker name comes from the contract's own worker fields, falling back to a dash.
  const workerEn = contract.workerNameEn || contract.workerNameAr || '—';
  const workerAr = contract.workerNameAr || contract.workerNameEn || '—';

  return {
    id: String(contract.id),
    customerId: contract.customerId != null ? String(contract.customerId) : '',
    contractNumber: contract.contractNumber != null ? String(contract.contractNumber) : String(contract.id),
    customerName: cust.en,
    customerNameAr: cust.ar,
    customerPhone: cust.phone || '—',
    status,
    contractStatus: cs,
    startDate,
    endDate,
    monthlyRent,
    totalCollected,
    remainingAmount,
    workerName: workerEn,
    workerNameAr: workerAr,
    nationality: natName.en,
    nationalityAr: natName.ar,
    nationalityId: contract.nationalityId || '',
    profession: jobName.en,
    professionAr: jobName.ar,
    branch: 'Sigma Recruitment Office',
    branchAr: 'سيجما الكفاءات للاستقدام',
    daysRemaining,
    createdAt: contract.createdAt || '',
    notes: contract.noteFinish || '',
  };
}

/** Badge colour + icon + bilingual label for a status key. */
export function getStatusMeta(status: ContractStatusKey, isRtl: boolean): StatusMeta {
  const config: Record<ContractStatusKey, StatusMeta> = {
    draft: { color: 'default', label: isRtl ? 'مسودة' : 'Draft', icon: <FileTextOutlined /> },
    signed: { color: 'processing', label: isRtl ? 'موقع' : 'Signed', icon: <CheckCircleOutlined /> },
    executing: { color: 'success', label: isRtl ? 'منفذ' : 'Executing', icon: <PlayCircleOutlined /> },
    finished: { color: 'error', label: isRtl ? 'منتهي' : 'Finished', icon: <StopOutlined /> },
  };
  return config[status] || { color: 'default', label: status, icon: <ClockCircleOutlined /> };
}
