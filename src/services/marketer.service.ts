/**
 * Marketer Service
 * New module in new API contract: /api/V1/Marketer
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { buildListParams } from '@/lib/api/buildListParams';
import type { Marketer, CreateMarketerDto, UpdateMarketerDto } from '@/types/api.types';
import type { PagedResponse } from '@/types/filters.types';

/** GET /api/V1/Marketer filters — backend supports SearchName, PageNumber, PageSize. */
export interface MarketerQuery {
  searchName?: string;
  pageNumber?: number;
  pageSize?: number;
}

export class MarketerService {
  /**
   * GET /api/V1/Marketer
   */
  static async getAll(): Promise<Marketer[]> {
    const response = await api.get<any>(API_ENDPOINTS.MARKETER.GET_ALL);

    // { success, data: { items: [...] } }
    if (response.data?.data?.items && Array.isArray(response.data.data.items))
      return response.data.data.items;
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.result && Array.isArray(response.data.result)) return response.data.result;
    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    return [];
  }

  /**
   * GET /api/V1/Marketer with server-side search + pagination.
   * Kept alongside `getAll()` (unpaged) which existing dropdown code relies on.
   */
  static async getPaged(query?: MarketerQuery): Promise<PagedResponse<Marketer>> {
    const params = buildListParams(query as Record<string, unknown>);
    const response = await api.get<any>(API_ENDPOINTS.MARKETER.GET_ALL, { params });
    const payload = response.data;
    const page = payload?.data ?? payload;
    return {
      items: Array.isArray(page?.items) ? page.items : Array.isArray(page) ? page : [],
      totalCount: page?.totalCount ?? 0,
      pageNumber: page?.pageNumber ?? query?.pageNumber ?? 1,
      pageSize: page?.pageSize ?? query?.pageSize ?? 10,
    };
  }

  /**
   * GET /api/V1/Marketer/{id}
   */
  static async getById(id: number | string): Promise<Marketer> {
    const response = await api.get<Marketer>(API_ENDPOINTS.MARKETER.GET_BY_ID(id));
    return response.data;
  }

  /**
   * POST /api/V1/Marketer
   * Body: { nameAr, nameEn }
   */
  static async create(data: CreateMarketerDto): Promise<Marketer> {
    const response = await api.post<Marketer>(API_ENDPOINTS.MARKETER.CREATE, data);
    return response.data;
  }

  /**
   * PUT /api/V1/Marketer/{id}
   */
  static async update(id: number | string, data: UpdateMarketerDto): Promise<Marketer> {
    const response = await api.put<Marketer>(API_ENDPOINTS.MARKETER.UPDATE(id), data);
    return response.data;
  }

  /**
   * DELETE /api/V1/Marketer/{id}
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.MARKETER.DELETE(id));
  }
}
