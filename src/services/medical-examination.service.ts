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
  medicalStatus?: number;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export class MedicalExaminationService {
  /**
   * GET /api/V1/MedicalExamination
   */
  static async getAll(params?: MedicalExaminationQuery): Promise<MedicalExamination[]> {
    const clean = params
      ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
      : undefined;
    const response = await api.get<any>(API_ENDPOINTS.MEDICAL_EXAMINATION.GET_ALL, {
      params: clean,
    });

    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    return [];
  }

  /**
   * GET /api/V1/MedicalExamination/{id}
   */
  static async getById(id: number | string): Promise<MedicalExamination> {
    const response = await api.get<MedicalExamination>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.GET_BY_ID(id)
    );
    return response.data;
  }

  /**
   * POST /api/V1/MedicalExamination
   * Body: { workerId (uuid), examDate, medicalStatus, notes }
   */
  static async create(data: MedicalExaminationDto): Promise<MedicalExamination> {
    const response = await api.post<MedicalExamination>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.CREATE,
      data
    );
    return response.data;
  }

  /**
   * PUT /api/V1/MedicalExamination/{id}
   */
  static async update(
    id: number | string,
    data: Partial<MedicalExaminationDto>
  ): Promise<MedicalExamination> {
    const response = await api.put<MedicalExamination>(
      API_ENDPOINTS.MEDICAL_EXAMINATION.UPDATE(id),
      data
    );
    return response.data;
  }

  /**
   * DELETE /api/V1/MedicalExamination/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.MEDICAL_EXAMINATION.DELETE(id));
  }

  /**
   * GET /api/V1/MedicalExamination/report/{id}
   * Fetches the medical report data for printing.
   */
  static async getReport(id: number | string): Promise<any> {
    const response = await api.get(API_ENDPOINTS.MEDICAL_EXAMINATION.REPORT(id));
    return response.data;
  }
}
