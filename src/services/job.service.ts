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
      let jobs: Job[] = [];

      if (Array.isArray(response.data)) {
        jobs = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Check common nested patterns
        if (Array.isArray(response.data.jobs)) {
          jobs = response.data.jobs;
        } else if (Array.isArray(response.data.data)) {
          jobs = response.data.data;
        } else if (Array.isArray(response.data.result)) {
          jobs = response.data.result;
        } else if (Array.isArray(response.data.items)) {
          jobs = response.data.items;
        }
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
