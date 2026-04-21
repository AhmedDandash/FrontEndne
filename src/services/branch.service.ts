/**
 * Branch Service
 * Handles all branch-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Branch, BranchDto } from '@/types/api.types';

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
   * Get branch by ID
   */
  static async getById(id: number | string): Promise<Branch> {
    const response = await api.get<any>(API_ENDPOINTS.BRANCH.GET_BY_ID(id));
    return this.unwrap<Branch>(response.data);
  }

  /**
   * Create new branch
   */
  static async create(data: BranchDto): Promise<Branch> {
    const response = await api.post<any>(API_ENDPOINTS.BRANCH.CREATE, data);
    return this.unwrap<Branch>(response.data);
  }

  /**
   * Update branch
   */
  static async update(id: number | string, data: BranchDto): Promise<Branch> {
    const response = await api.put<any>(API_ENDPOINTS.BRANCH.UPDATE(id), data);
    return this.unwrap<Branch>(response.data);
  }

  /**
   * Delete branch
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.BRANCH.DELETE(id));
  }
}
