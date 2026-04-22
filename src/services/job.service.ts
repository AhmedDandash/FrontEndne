/**
 * Job Service
 * Handles all CRUD operations for Jobs (General Settings)
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Job, CreateJobDto, UpdateJobDto } from '@/types/api.types';

export class JobService {
  /**
   * Get all jobs
   */
  static async getAll(): Promise<Job[]> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.JOB.GET_ALL);

      console.log('🔍 Job Response Structure:', {
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
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

      console.log('✅ Parsed Jobs:', jobs.length, 'items');
      return jobs;
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      return [];
    }
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

    console.log('📤 Creating job with payload:', payload);
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

    console.log('📤 Updating job with payload:', payload);
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
