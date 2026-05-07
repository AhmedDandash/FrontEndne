/**
 * Complaint Service
 * Handles all complaint-related API calls.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  Complaint,
  CreateComplaintDto,
  CreateComplaintUpdateDto,
  AddIssueDto,
  ComplaintIssue,
  ComplaintUpdate,
} from '@/types/api.types';

const extractArray = <T>(payload: any): T[] => {
  const candidates = [
    payload,
    payload?.data,
    payload?.result,
    payload?.items,
    payload?.data?.data,
    payload?.data?.result,
    payload?.data?.items,
    payload?.result?.data,
    payload?.result?.items,
    payload?.$values,
    payload?.data?.$values,
    payload?.result?.$values,
    payload?.items?.$values,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (Array.isArray(candidate?.$values)) return candidate.$values;
  }

  return [];
};

const extractObject = <T>(payload: any): T | null => {
  const candidates = [payload?.data, payload?.result, payload?.item, payload];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as T;
    }
  }

  return null;
};

const normalizeBoolean = (value: unknown): boolean => {
  return value === true || value === 'true' || value === 1 || value === '1';
};

const normalizeNullableString = (value: unknown): string | null => {
  if (value == null) return null;

  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const normalizeComplaint = (raw: any): Complaint => {
  const status = normalizeNumber(raw?.status ?? raw?.Status);
  const statusName = normalizeNullableString(raw?.statusName ?? raw?.StatusName);
  const isFinished =
    status === 3 ||
    statusName?.toLowerCase() === 'finished' ||
    normalizeBoolean(raw?.isFinish ?? raw?.IsFinish);
  const isOnHold =
    !isFinished &&
    (status === 2 ||
      statusName?.toLowerCase() === 'hold' ||
      statusName?.toLowerCase() === 'onhold' ||
      statusName?.toLowerCase() === 'on hold' ||
      normalizeBoolean(raw?.ishold ?? raw?.isHold ?? raw?.Ishold ?? raw?.IsHold));

  const complaint: Complaint = {
    id: raw?.id ?? raw?.Id ?? raw?.complaintId ?? raw?.ComplaintId,
    complaintNumber: normalizeNullableString(raw?.complaintNumber ?? raw?.ComplaintNumber),
    source: raw?.source ?? raw?.Source ?? null,
    sourceName: normalizeNullableString(raw?.sourceName ?? raw?.SourceName),
    priority: raw?.priority ?? raw?.Priority ?? null,
    priorityName: normalizeNullableString(raw?.priorityName ?? raw?.PriorityName),
    status: status ?? (isFinished ? 3 : isOnHold ? 2 : 1),
    statusName,
    holdReason: normalizeNullableString(raw?.holdReason ?? raw?.HoldReason),
    customerId: raw?.customerId ?? raw?.CustomerId ?? null,
    workerId: raw?.workerId ?? raw?.WorkerId ?? null,
    workerLocation: raw?.workerLocation ?? raw?.WorkerLocation ?? null,
    workerLocationName: normalizeNullableString(raw?.workerLocationName ?? raw?.WorkerLocationName),
    relatedContractType:
      raw?.relatedContractType ??
      raw?.RelatedContractType ??
      raw?.contractType ??
      raw?.ContractType ??
      null,
    relatedContractId:
      raw?.relatedContractId ?? raw?.RelatedContractId ?? raw?.contractId ?? raw?.ContractId ?? null,
    notesAr: raw?.notesAr ?? raw?.NotesAr ?? null,
    notesEn: raw?.notesEn ?? raw?.NotesEn ?? null,
    createdAt: raw?.createdAt ?? raw?.CreatedAt ?? raw?.createdDate ?? raw?.CreatedDate ?? null,
    createdDate: raw?.createdDate ?? raw?.CreatedDate ?? raw?.createdAt ?? raw?.CreatedAt ?? null,
    createdBy: raw?.createdBy ?? raw?.CreatedBy ?? null,
    updatedAt: raw?.updatedAt ?? raw?.UpdatedAt ?? null,
    updatedBy: raw?.updatedBy ?? raw?.UpdatedBy ?? null,
    customerName:
      raw?.customerName ?? raw?.CustomerName ?? raw?.customerNameAr ?? raw?.CustomerNameAr ?? null,
    workerName: raw?.workerName ?? raw?.WorkerName ?? raw?.workerNameAr ?? raw?.WorkerNameAr ?? null,
    contractNumber: raw?.contractNumber ?? raw?.ContractNumber ?? null,
    isFinish: isFinished,
    finishNote: raw?.finishNote ?? raw?.FinishNote ?? null,
    ishold: isOnHold,
    hasIssue: normalizeBoolean(raw?.hasIssue ?? raw?.HasIssue),
    updates: extractArray<ComplaintUpdate>(raw?.updates ?? raw?.Updates),
  };

  return complaint;
};

const normalizeComplaintIssue = (raw: any): ComplaintIssue => ({
  id: raw?.id ?? raw?.Id,
  complaintParentId: raw?.complaintParentId ?? raw?.ComplaintParentId ?? null,
  incomingNumber: raw?.incomingNumber ?? raw?.IncomingNumber ?? null,
  submissionAuthority: raw?.submissionAuthority ?? raw?.SubmissionAuthority ?? null,
  submissionAuthorityName: normalizeNullableString(
    raw?.submissionAuthorityName ?? raw?.SubmissionAuthorityName
  ),
  submissionAuthorityNameAr: normalizeNullableString(
    raw?.submissionAuthorityNameAr ?? raw?.SubmissionAuthorityNameAr
  ),
  submissionAuthorityNameEn: normalizeNullableString(
    raw?.submissionAuthorityNameEn ?? raw?.SubmissionAuthorityNameEn
  ),
  transactionDate: raw?.transactionDate ?? raw?.TransactionDate ?? null,
  attachmentPath1: raw?.attachmentPath1 ?? raw?.AttachmentPath1 ?? null,
  attachmentPath2: raw?.attachmentPath2 ?? raw?.AttachmentPath2 ?? null,
  status: raw?.status ?? raw?.Status ?? null,
  createdAt: raw?.createdAt ?? raw?.CreatedAt ?? null,
  createdBy: raw?.createdBy ?? raw?.CreatedBy ?? null,
});

const sortComplaints = (complaints: Complaint[]): Complaint[] => {
  return [...complaints].sort((left, right) => {
    const rightTime = Date.parse(right.createdAt || right.updatedAt || '') || 0;
    const leftTime = Date.parse(left.createdAt || left.updatedAt || '') || 0;

    if (rightTime !== leftTime) return rightTime - leftTime;

    return String(right.id ?? '').localeCompare(String(left.id ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
};

export class ComplaintService {
  static async getAll(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
  }): Promise<Complaint[]> {
    const response = await api.get<any>(API_ENDPOINTS.COMPLAINT.GET_ALL, { params });
    const complaints = extractArray<any>(response.data).map(normalizeComplaint);
    return sortComplaints(complaints);
  }

  static async getById(id: number | string): Promise<Complaint> {
    const response = await api.get<any>(API_ENDPOINTS.COMPLAINT.GET_BY_ID(id));
    const complaint = extractObject<any>(response.data);
    return normalizeComplaint(complaint);
  }

  static async create(data: CreateComplaintDto): Promise<Complaint> {
    const response = await api.post<any>(API_ENDPOINTS.COMPLAINT.CREATE, data);
    const complaint = extractObject<any>(response.data);
    return normalizeComplaint(complaint ?? data);
  }

  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.COMPLAINT.DELETE(id));
  }

  static async finish(id: number | string): Promise<void> {
    await api.post(API_ENDPOINTS.COMPLAINT.FINISH(id), null);
  }

  static async toggleHold(id: number | string, reason: string): Promise<void> {
    await api.post(API_ENDPOINTS.COMPLAINT.HOLD(id), null, {
      params: { reason },
    });
  }

  static async addUpdate(data: CreateComplaintUpdateDto): Promise<ComplaintUpdate> {
    const response = await api.post<ComplaintUpdate>(API_ENDPOINTS.COMPLAINT.ADD_UPDATE, data);
    return response.data;
  }

  static async addIssue(data: AddIssueDto): Promise<ComplaintIssue> {
    const form = new FormData();
    form.append('ComplaintId', String(data.complaintId));
    if (data.incomingNumber != null) form.append('IncomingNumber', data.incomingNumber);
    if (data.submissionAuthority != null) {
      form.append('SubmissionAuthority', String(data.submissionAuthority));
    }
    if (data.transactionDate != null) form.append('TransactionDate', data.transactionDate);
    if (data.file1 instanceof File) form.append('file1', data.file1);
    if (data.file2 instanceof File) form.append('file2', data.file2);

    const response = await api.post<any>(API_ENDPOINTS.COMPLAINT.ADD_ISSUE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const issue = extractObject<any>(response.data);
    return normalizeComplaintIssue(issue ?? response.data);
  }

  static async getIssueById(id: number | string): Promise<ComplaintIssue[]> {
    const response = await api.get<any>(API_ENDPOINTS.COMPLAINT.GET_ISSUE(id));
    const issues = extractArray<any>(response.data);

    if (issues.length > 0) {
      return issues.map(normalizeComplaintIssue);
    }

    const issue = extractObject<any>(response.data);
    return issue ? [normalizeComplaintIssue(issue)] : [];
  }
}
