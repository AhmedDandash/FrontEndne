/**
 * Complaint Service
 * Handles all complaint-related API calls — migrated to new API contract.
 *
 * Key changes from old API:
 *  - finish:    POST /FinishComplaint (body) → POST /{id}/finish (no body)
 *  - hold:      POST /HoldComplaint/{id}    → POST /{id}/toggle-hold?reason=...
 *  - addIssue:  POST /AddIssue (JSON+base64) → POST /issue (multipart/form-data)
 *  - getIssue:  GET  /GetIssueById/{id}     → GET  /{id}/issue
 *  - update:    PUT  /{id} (removed)        → POST /update (notes only)
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

export class ComplaintService {
  /**
   * GET /api/Complaint?pageNumber=&pageSize=&search=
   */
  static async getAll(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
  }): Promise<Complaint[]> {
    const response = await api.get<any>(API_ENDPOINTS.COMPLAINT.GET_ALL, { params });

    let complaints: Complaint[] = [];
    if (Array.isArray(response.data)) {
      complaints = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const data = response.data as any;
      if (Array.isArray(data.data)) complaints = data.data;
      else if (Array.isArray(data.result)) complaints = data.result;
      else if (Array.isArray(data.items)) complaints = data.items;
    }

    // Derive UI status from boolean flags (isFinish / ishold)
    return complaints.map((c) => ({
      ...c,
      status: c.isFinish ? 3 : c.ishold ? 2 : 1, // 1=Open, 2=Hold, 3=Finished
    }));
  }

  /**
   * GET /api/Complaint/{id}  — returns complaint + updates[] array
   */
  static async getById(id: number | string): Promise<Complaint> {
    const response = await api.get<Complaint>(API_ENDPOINTS.COMPLAINT.GET_BY_ID(id));
    return response.data;
  }

  /**
   * POST /api/Complaint
   * Payload: CreateComplaintDto (source, priority, customerId, workerId,
   *          workerLocation, relatedContractType, relatedContractId, notesAr, notesEn)
   */
  static async create(data: CreateComplaintDto): Promise<Complaint> {
    const response = await api.post<Complaint>(API_ENDPOINTS.COMPLAINT.CREATE, data);
    return response.data;
  }

  /**
   * DELETE /api/Complaint/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.COMPLAINT.DELETE(id));
  }

  /**
   * POST /api/Complaint/{id}/finish  — no request body
   * Status transition: Open/Hold → Finished
   */
  static async finish(id: number | string): Promise<void> {
    await api.post(API_ENDPOINTS.COMPLAINT.FINISH(id), null);
  }

  /**
   * POST /api/Complaint/{id}/toggle-hold?reason=<reason>
   * reason is REQUIRED by the new API.
   * Status transitions: Open ↔ Hold
   */
  static async toggleHold(id: number | string, reason: string): Promise<void> {
    await api.post(API_ENDPOINTS.COMPLAINT.HOLD(id), null, {
      params: { reason },
    });
  }

  /**
   * POST /api/Complaint/update
   * Adds a bilingual note/update to an existing complaint.
   */
  static async addUpdate(data: CreateComplaintUpdateDto): Promise<ComplaintUpdate> {
    const response = await api.post<ComplaintUpdate>(API_ENDPOINTS.COMPLAINT.ADD_UPDATE, data);
    return response.data;
  }

  /**
   * POST /api/Complaint/issue  — multipart/form-data
   * Files are uploaded as binary (File objects), not base64.
   */
  static async addIssue(data: AddIssueDto): Promise<ComplaintIssue> {
    const form = new FormData();
    form.append('ComplaintId', String(data.complaintId));
    if (data.incomingNumber != null) form.append('IncomingNumber', data.incomingNumber);
    if (data.submissionAuthority != null)
      form.append('SubmissionAuthority', String(data.submissionAuthority));
    if (data.transactionDate != null) form.append('TransactionDate', data.transactionDate);
    if (data.file1 instanceof File) form.append('file1', data.file1);
    if (data.file2 instanceof File) form.append('file2', data.file2);

    const response = await api.post<ComplaintIssue>(API_ENDPOINTS.COMPLAINT.ADD_ISSUE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /**
   * GET /api/Complaint/{id}/issue
   */
  static async getIssueById(id: number | string): Promise<ComplaintIssue[]> {
    const response = await api.get<any>(API_ENDPOINTS.COMPLAINT.GET_ISSUE(id));
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    return response.data ? [response.data] : [];
  }
}
