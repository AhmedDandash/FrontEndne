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

/** Project a single API contract into the display view model. */
export function mapContract(
  contract: EmploymentOperatingContract,
  resolveNationality: NameMap,
  resolveJob: NameMap
): RentContract {
  const startDate = contract.contractStartDate || new Date().toISOString();
  const endDate = contract.contractEndDate || new Date().toISOString();
  const daysRemaining = Math.max(
    0,
    Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const cs = contract.contractStatus || 1;
  const status = STATUS_KEY_BY_NUMBER[cs] ?? 'draft';

  const monthlyRent = contract.cost || 0;
  const monthsActive = Math.max(
    1,
    Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  const totalCollected = monthlyRent * monthsActive;

  const natName = resolveNationality(contract.nationalityId);
  const jobName = contract.jobName
    ? { ar: contract.jobName, en: contract.jobName }
    : resolveJob(contract.jobId as any);

  return {
    id: String(contract.id),
    customerId: Number(contract.customerId) || 0,
    contractNumber: `R${2024000 + Number(contract.id)}`,
    customerName: contract.customerNameAr || 'Unknown',
    customerNameAr: contract.customerNameAr || 'غير معروف',
    customerPhone: contract.mobile || '05xxxxxxxx',
    status,
    contractStatus: cs,
    startDate,
    endDate,
    monthlyRent,
    totalCollected,
    remainingAmount: Math.max(
      0,
      (contract.totalCostWithTax || contract.cost || 0) - totalCollected
    ),
    workerName: jobName.en,
    workerNameAr: jobName.ar,
    nationality: natName.en,
    nationalityAr: natName.ar,
    nationalityId: contract.nationalityId || '',
    profession: jobName.en,
    professionAr: jobName.ar,
    branch: 'Sigma Recruitment Office',
    branchAr: 'سيجما الكفاءات للاستقدام',
    daysRemaining,
    createdAt: contract.createdAt || new Date().toISOString(),
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
