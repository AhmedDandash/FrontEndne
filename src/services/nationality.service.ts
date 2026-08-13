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
   * @param params Optional server-side filters. Pass `{ isActiveOnly: true }`
   *   for customer-facing dropdowns so disabled nationalities are excluded.
   *   `searchName` and `pageNumber` complete backend support (SearchName,
   *   PageNumber, PageSize) alongside the existing pageSize/isActiveOnly.
   */
  static async getAll(params?: {
    isActiveOnly?: boolean;
    searchName?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<Nationality[]> {
    // The backend defaults to a small page size (10) when none is sent —
    // live-verified this silently truncates the list once more than 10
    // nationalities exist (confirmed: 12 real nationalities, unparameterized
    // call returned only 10). Callers that pass their own `pageSize` keep it;
    // everyone else (most callers, via `useNationalities()` with no params)
    // gets a large default so they see the full list, not just the first page.
    const response = await api.get<any>(API_ENDPOINTS.NATIONALITY.GET_ALL, {
      params: { ...params, pageSize: params?.pageSize ?? 9999 },
    });

    const body = response.data;
    const candidates = [
      body,
      body?.data,
      body?.result,
      body?.items,
      body?.data?.items,
      body?.result?.items,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
      if (Array.isArray(candidate?.$values)) return candidate.$values;
    }

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
   *
   * Response is wrapped in the standard `{ success, data, errors, statusCode }`
   * envelope (no global unwrap interceptor exists), so the created entity —
   * and its `id` — must be pulled out of `body.data` before returning.
   */
  static async create(data: CreateNationalityDto): Promise<Nationality> {
    const response = await api.post<any>(API_ENDPOINTS.NATIONALITY.CREATE, data);
    const body = response.data;
    return (body?.data ?? body?.result ?? body) as Nationality;
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
