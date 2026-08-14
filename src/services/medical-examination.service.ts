/**
 * Medical Examination Service
 * New module in new API contract: /api/V1/MedicalExamination
 *
 * Previously: endpoints were nested under /api/Worker/*
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { MedicalExamination, MedicalExaminationDto } from '@/types/api.types';

/**
 * GET /api/V1/MedicalExamination filters — backend supports WorkerId,
 * WorkerSearch, MedicalStatus (enum), FromDate, ToDate, PageNumber, PageSize.
 */
export interface MedicalExaminationQuery {
  workerId?: number | string;
  workerSearch?: string;
  workerSearchMatch?: number;
  notes?: string;
  notesMatch?: number;
  medicalStatus?: number;
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export class MedicalExaminationService {
  private static unwrap<T>(payload: any): T {
    return (payload?.data?.value ?? payload?.value ?? payload?.data ?? payload) as T;
  }

  private static unwrapList<T>(payload: any): T[] {
    const candidates = [
      payload,
      payload?.data,
      payload?.data?.value,
      payload?.value,
      payload?.result,
      payload?.data?.result,
      payload?.items,
      payload?.data?.items,
      payload?.value?.items,
      payload?.records,
      payload?.data?.records,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as T[];
      if (Array.isArray(candidate?.$values)) return candidate.$values as T[];
    }

    return [];
  }

  /**
   * GET /api/V1/MedicalExamination
   */
  static async getAll(params?: MedicalExaminationQuery): Promise<MedicalExamination[]> {
    const query = params
      ? {
          WorkerId: params.workerId,
          WorkerSearch: params.workerSearch,
          WorkerSearchMatch: params.workerSearchMatch,
          Notes: params.notes,
          NotesMatch: params.notesMatch,
          MedicalStatus: params.medicalStatus,
          FromDate: params.fromDate,
          ToDate: params.toDate,
          BranchId: params.branchId,
          IncludeSubBranches: params.includeSubBranches,
          Search: params.search,
          CreatedDateFrom: params.createdDateFrom,
          CreatedDateTo: params.createdDateTo,
          UpdatedDateFrom: params.updatedDateFrom,
          UpdatedDateTo: params.updatedDateTo,
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
          SortBy: params.sortBy,
          SortDescending: params.sortDescending,
        }
      : undefined;
    const clean = query
      ? Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))
      : undefined;
    const response = await api.get<any>(API_ENDPOINTS.MEDICAL_EXAMINATION.GET_ALL, {
      params: clean,
    });

    return this.unwrapList<MedicalExamination>(response.data);
  }

  /**
   * GET /api/V1/MedicalExamination/{id}
   */
  static async getById(id: number | string): Promise<MedicalExamination> {
    const response = await api.get<any>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.GET_BY_ID(id)
    );
    return this.unwrap<MedicalExamination>(response.data);
  }

  /**
   * POST /api/V1/MedicalExamination
   * Body: { workerId (uuid), examDate, medicalStatus, notes }
   */
  static async create(data: MedicalExaminationDto): Promise<MedicalExamination | string> {
    const response = await api.post<any>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.CREATE,
      data
    );
    return this.unwrap<MedicalExamination | string>(response.data);
  }

  /**
   * PUT /api/V1/MedicalExamination/{id}
   */
  static async update(
    id: number | string,
    data: Partial<MedicalExaminationDto>
  ): Promise<MedicalExamination | string> {
    const response = await api.put<any>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.UPDATE(id),
      data
    );
    return this.unwrap<MedicalExamination | string>(response.data);
  }

  /**
   * DELETE /api/V1/MedicalExamination/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.MEDICAL_EXAMINATION.DELETE(id));
  }

  /**
   * GET /api/V1/MedicalExamination/check-worker/{workerId}
   */
  static async checkWorker(workerId: number | string): Promise<MedicalExamination> {
    const response = await api.get<any>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.CHECK_WORKER(workerId)
    );
    return this.unwrap<MedicalExamination>(response.data);
  }

  /**
   * GET /api/V1/MedicalExamination/report/{id}
   * Fetches the medical report data for printing.
   */
  static async getReport(id: number | string): Promise<any> {
    const response = await api.get<any>(API_ENDPOINTS.MEDICAL_EXAMINATION.REPORT(id));
    return this.unwrap<any>(response.data);
  }
}
