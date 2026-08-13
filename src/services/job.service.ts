/**
 * Job Service
 * Handles all CRUD operations for Jobs (General Settings)
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { buildListParams } from '@/lib/api/buildListParams';
import type { Job, CreateJobDto, UpdateJobDto } from '@/types/api.types';
import type { PagedResponse } from '@/types/filters.types';

/** GET /api/V1/Job filters — backend supports SearchName, PageNumber, PageSize. */
export interface JobQuery {
  searchName?: string;
  pageNumber?: number;
  pageSize?: number;
}

export class JobService {
  /**
   * Get all jobs
   */
  static async getAll(): Promise<Job[]> {
    // The backend defaults to a small page size (10) when no PageSize is
    // sent — live-verified this silently truncates the list once more than
    // 10 jobs exist. Force a large page so every dropdown consumer of this
    // method sees the full list, not just the first page.
    const response = await api.get<any>(API_ENDPOINTS.JOB.GET_ALL, {
      params: { PageSize: 9999 },
    });

    // Handle different response structures
    const payload = response.data;
    const candidates = [
      payload,
      payload?.data,
      payload?.result,
      payload?.items,
      payload?.jobs,
      payload?.data?.data,
      payload?.data?.result,
      payload?.data?.items,
      payload?.$values,
      payload?.data?.$values,
    ];

    let jobs: Job[] = [];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) { jobs = candidate; break; }
      if (Array.isArray(candidate?.$values)) { jobs = candidate.$values; break; }
    }

    return jobs;
  }

  /**
   * GET /api/V1/Job with server-side search + pagination.
   * Kept alongside `getAll()` (unpaged) which existing dropdown code relies on.
   */
  static async getPaged(query?: JobQuery): Promise<PagedResponse<Job>> {
    const params = buildListParams(query as Record<string, unknown>);
    const response = await api.get<any>(API_ENDPOINTS.JOB.GET_ALL, { params });
    const payload = response.data;
    const page = payload?.data ?? payload;
    return {
      items: Array.isArray(page?.items)
        ? page.items
        : Array.isArray(page)
          ? page
          : Array.isArray(page?.$values)
            ? page.$values
            : [],
      totalCount: page?.totalCount ?? 0,
      pageNumber: page?.pageNumber ?? query?.pageNumber ?? 1,
      pageSize: page?.pageSize ?? query?.pageSize ?? 10,
    };
  }

  /**
   * Get job by ID
   */
  static async getById(id: number | string): Promise<Job | null> {
    try {
      const response = await api.get<Job>(API_ENDPOINTS.JOB.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new job
   */
  static async create(data: CreateJobDto): Promise<Job> {
    // Convert to proper types
    const payload = {
      ...data,
      workCardFees: data.workCardFees ? Number(data.workCardFees) : null,
      hasWorkCard: Boolean(data.hasWorkCard),
      isActive: Boolean(data.isActive),
    };

    const response = await api.post<Job>(API_ENDPOINTS.JOB.CREATE, payload);
    return response.data;
  }

  /**
   * Update existing job
   */
  static async update(id: number | string, data: UpdateJobDto): Promise<Job> {
    // Convert to proper types
    const payload = {
      ...data,
      workCardFees: data.workCardFees ? Number(data.workCardFees) : null,
      hasWorkCard: Boolean(data.hasWorkCard),
      isActive: Boolean(data.isActive),
    };

    const response = await api.put<Job>(API_ENDPOINTS.JOB.UPDATE(id), payload);
    return response.data;
  }

  /**
   * Delete job
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.JOB.DELETE(id));
  }
}
