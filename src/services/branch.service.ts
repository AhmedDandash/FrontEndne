/**
 * Branch Service
 * Handles all branch-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { buildListParams } from '@/lib/api/buildListParams';
import type { Branch, BranchDto } from '@/types/api.types';
import type { BranchQuery, PagedResponse } from '@/types/filters.types';

export class BranchService {
  private static unwrap<T>(payload: any): T {
    return (payload?.data ?? payload) as T;
  }

  private static unwrapList<T>(payload: any): T[] {
    const unwrapped = this.unwrap<any>(payload);
    if (Array.isArray(unwrapped)) return unwrapped as T[];
    if (Array.isArray(unwrapped?.items)) return unwrapped.items as T[];
    return [];
  }

  /**
   * Get all branches
   */
  static async getAll(): Promise<Branch[]> {
    const response = await api.get<any>(API_ENDPOINTS.BRANCH.GET_ALL);
    return this.unwrapList<Branch>(response.data);
  }

  /**
   * GET /api/V1/Branch with server-side filters + pagination.
   * Query names mirror the OpenAPI params exactly (SearchName, NameAr, etc.).
   * Kept alongside `getAll()` (unpaged) which existing dropdown code relies on.
   */
  static async getPaged(query?: BranchQuery): Promise<PagedResponse<Branch>> {
    const params = buildListParams(query as Record<string, unknown>);
    const response = await api.get<any>(API_ENDPOINTS.BRANCH.GET_ALL, { params });
    const page = this.unwrap<any>(response.data);
    const items = Array.isArray(page?.items) ? page.items : Array.isArray(page) ? page : [];
    return {
      items,
      totalCount: page?.totalCount ?? items.length,
      pageNumber: page?.pageNumber ?? query?.PageNumber ?? 1,
      pageSize: page?.pageSize ?? query?.PageSize ?? 10,
    };
  }

  /**
   * Get branch by ID
   */
  static async getById(id: number | string): Promise<Branch> {
    const response = await api.get<any>(API_ENDPOINTS.BRANCH.GET_BY_ID(id));
    return this.unwrap<Branch>(response.data);
  }

  /**
   * Get sub-branches for a given branch
   */
  static async getSubBranches(id: number | string): Promise<Branch[]> {
    const response = await api.get<any>(API_ENDPOINTS.BRANCH.GET_SUB_BRANCHES(id));
    return this.unwrapList<Branch>(response.data);
  }

  /**
   * Create new branch — the backend returns a bare success-message string
   * (e.g. "تم إضافة الفرع بنجاح"), NOT the created branch (confirmed live,
   * 2026-08-11 Branch-module audit). Callers that need the new branch's id
   * must re-fetch the list (there is no id in this response to unwrap).
   */
  static async create(data: BranchDto): Promise<string> {
    const response = await api.post<any>(API_ENDPOINTS.BRANCH.CREATE, data);
    return this.unwrap<string>(response.data);
  }

  /**
   * Update branch — same bare success-message response shape as create().
   */
  static async update(id: number | string, data: BranchDto): Promise<string> {
    const response = await api.put<any>(API_ENDPOINTS.BRANCH.UPDATE(id), data);
    return this.unwrap<string>(response.data);
  }

  /**
   * Delete branch
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.BRANCH.DELETE(id));
  }
}
