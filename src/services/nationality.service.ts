/**
 * Nationality Service
 * Migrated to new API contract: /api/V1/Nationality
 *
 * Breaking changes from old API:
 *  - Paths changed from /api/Nationality/GetAllNationality etc. to RESTful /api/V1/Nationality
 *  - DTO simplified: removed nationalityId, authorizationSystem, ticketPrice, headerFile
 *  - New: toggleStatus() — POST /api/V1/Nationality/{id}/toggle-status
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Nationality, CreateNationalityDto, UpdateNationalityDto } from '@/types/api.types';

export class NationalityService {
  /**
   * GET /api/V1/Nationality
   */
  static async getAll(): Promise<Nationality[]> {
    const response = await api.get<any>(API_ENDPOINTS.NATIONALITY.GET_ALL);

    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    return [];
  }

  /**
   * GET /api/V1/Nationality/{id}
   */
  static async getById(id: number | string): Promise<Nationality> {
    const response = await api.get<Nationality>(API_ENDPOINTS.NATIONALITY.GET_BY_ID(id));
    return response.data;
  }

  /**
   * POST /api/V1/Nationality
   * Body: { nationalityNameAr, nationalityNameEn, isActive }
   */
  static async create(data: CreateNationalityDto): Promise<Nationality> {
    const response = await api.post<Nationality>(API_ENDPOINTS.NATIONALITY.CREATE, data);
    return response.data;
  }

  /**
   * PUT /api/V1/Nationality/{id}
   * Body: { id (uuid), nationalityNameAr, nationalityNameEn, isActive }
   */
  static async update(id: number | string, data: UpdateNationalityDto): Promise<Nationality> {
    const payload: UpdateNationalityDto = { ...data, id: String(id) };
    const response = await api.put<Nationality>(API_ENDPOINTS.NATIONALITY.UPDATE(id), payload);
    return response.data;
  }

  /**
   * DELETE /api/V1/Nationality/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.NATIONALITY.DELETE(id));
  }

  /**
   * PUT /api/V1/Nationality/{id}/toggle-status
   * Toggles isActive for the nationality. No request body.
   */
  static async toggleStatus(id: number | string): Promise<void> {
    await api.put(API_ENDPOINTS.NATIONALITY.TOGGLE_STATUS(id), null);
  }
}
