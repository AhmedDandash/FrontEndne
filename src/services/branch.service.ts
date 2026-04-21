/**
 * Branch Service
 * Handles all branch-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Branch, BranchDto } from '@/types/api.types';

export class BranchService {
  /**
   * Get all branches
   */
  static async getAll(): Promise<Branch[]> {
    const response = await api.get<Branch[]>(API_ENDPOINTS.BRANCH.GET_ALL);
    return response.data;
  }

  /**
   * Get branch by ID
   */
  static async getById(id: number | string): Promise<Branch> {
    const response = await api.get<Branch>(API_ENDPOINTS.BRANCH.GET_BY_ID(id));
    return response.data;
  }

  /**
   * Create new branch
   */
  static async create(data: BranchDto): Promise<Branch> {
    const response = await api.post<Branch>(API_ENDPOINTS.BRANCH.CREATE, data);
    return response.data;
  }

  /**
   * Update branch
   */
  static async update(id: number | string, data: BranchDto): Promise<Branch> {
    const response = await api.put<Branch>(API_ENDPOINTS.BRANCH.UPDATE(id), data);
    return response.data;
  }

  /**
   * Delete branch
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.BRANCH.DELETE(id));
  }
}
