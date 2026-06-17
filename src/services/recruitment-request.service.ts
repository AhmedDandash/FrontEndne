/**
 * Recruitment Request Service
 * Handles all recruitment request-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  RecruitmentRequest,
  CreateRecruitmentRequestDto,
  ChoiceCustomerDto,
  ChoiceWorkerDto,
  RequestActionDto,
  Worker,
  Job,
  Customer,
} from '@/types/api.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class RecruitmentRequestService {
  /**
   * Generate unique request code
   */
  static generateRequestCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = 'REQ';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get all recruitment requests
   */
  static async getAll(): Promise<RecruitmentRequest[]> {
    try {
      // Add cache-busting query param to ensure fresh data
      const response = await api.get<ApiResponse<RecruitmentRequest[]>>(
        `${API_ENDPOINTS.RECRUITMENT_REQUEST.GET_ALL}?_t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        }
      );

      console.log('🔍 Recruitment Request Response:', response.data);

      // Handle different response structures
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching recruitment requests:', error);
      return [];
    }
  }

  /**
   * Create new recruitment request
   */
  static async create(data: CreateRecruitmentRequestDto): Promise<RecruitmentRequest | null> {
    try {
      // Auto-generate request code if not provided
      const payload = {
        ...data,
        requestCode: data.requestCode || this.generateRequestCode(),
      };

      console.log('📤 Creating recruitment request:', payload);
      const response = await api.post<ApiResponse<RecruitmentRequest>>(
        API_ENDPOINTS.RECRUITMENT_REQUEST.CREATE,
        payload
      );

      return response.data?.data || response.data;
    } catch (error) {
      console.error('❌ Error creating recruitment request:', error);
      throw error;
    }
  }

  /**
   * Choose customer for request
   */
  static async choiceCustomer(data: ChoiceCustomerDto): Promise<void> {
    try {
      console.log('📤 Assigning customer to request:', data);
      await api.post(API_ENDPOINTS.RECRUITMENT_REQUEST.CHOICE_CUSTOMER, data);
    } catch (error) {
      console.error('❌ Error assigning customer:', error);
      throw error;
    }
  }

  /**
   * Choose worker for request
   */
  static async choiceWorker(data: ChoiceWorkerDto): Promise<void> {
    try {
      const payload = {
        workerId: Number(data.workerId),
        requestId: Number(data.requestId),
      };

      if (!Number.isFinite(payload.workerId) || payload.workerId <= 0) {
        throw new Error('Invalid workerId for ChoiceWorker request');
      }

      if (!Number.isFinite(payload.requestId) || payload.requestId <= 0) {
        throw new Error('Invalid requestId for ChoiceWorker request');
      }

      console.log('📤 Assigning worker to request:', payload);
      await api.post(API_ENDPOINTS.RECRUITMENT_REQUEST.CHOICE_WORKER, payload);
    } catch (error) {
      console.error('❌ Error assigning worker:', error);
      throw error;
    }
  }

  /**
   * Delete worker from request
   */
  static async deleteWorker(requestId: number): Promise<void> {
    try {
      console.log('📤 Deleting worker from request:', requestId);
      await api.post(API_ENDPOINTS.RECRUITMENT_REQUEST.DELETE_WORKER(requestId));
    } catch (error) {
      console.error('❌ Error deleting worker:', error);
      throw error;
    }
  }

  /**
   * Review request (change status to review = 1)
   */
  static async reviewRequest(data: RequestActionDto): Promise<void> {
    try {
      console.log('📤 Reviewing request:', data);
      await api.post(API_ENDPOINTS.RECRUITMENT_REQUEST.REVIEW_REQUEST, data);
    } catch (error) {
      console.error('❌ Error reviewing request:', error);
      throw error;
    }
  }

  /**
   * Refuse request
   */
  static async refuseRequest(data: RequestActionDto): Promise<void> {
    try {
      console.log('📤 Refusing request:', data);
      await api.post(API_ENDPOINTS.RECRUITMENT_REQUEST.REFUSED_REQUEST, data);
    } catch (error) {
      console.error('❌ Error refusing request:', error);
      throw error;
    }
  }

  /**
   * Accept request
   */
  static async acceptRequest(data: RequestActionDto): Promise<void> {
    try {
      console.log('📤 Accepting request:', data);
      await api.post(API_ENDPOINTS.RECRUITMENT_REQUEST.ACCEPT_REQUEST, data);
    } catch (error) {
      console.error('❌ Error accepting request:', error);
      throw error;
    }
  }

  /**
   * Get all jobs
   */
  static async getJobs(): Promise<Job[]> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.JOB.GET_ALL);
      console.log('Jobs Response:', response.data);

      let rawJobs: any[] = [];

      if (Array.isArray(response.data)) {
        rawJobs = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.jobs)) {
          rawJobs = response.data.jobs;
        } else if (Array.isArray(response.data.data)) {
          rawJobs = response.data.data;
        } else if (Array.isArray(response.data.result)) {
          rawJobs = response.data.result;
        } else if (Array.isArray(response.data.items)) {
          rawJobs = response.data.items;
        }
      }

      const normalizedJobs: Job[] = rawJobs
        .map((job) => ({
          id: Number(job.id ?? job.jobId ?? 0),
          jobNameAr: job.jobNameAr ?? job.nameAr ?? job.jobName ?? null,
          jobNameEn: job.jobNameEn ?? job.nameEn ?? job.jobName ?? null,
          hasWorkCard: job.hasWorkCard ?? false,
          workCardFees:
            job.workCardFees !== undefined && job.workCardFees !== null
              ? Number(job.workCardFees)
              : null,
          isActive: job.isActive ?? true,
        }))
        .filter((job) => Number.isFinite(job.id) && job.id > 0);

      return normalizedJobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }

  /**
   * Get all workers
   */
  static async getWorkers(): Promise<Worker[]> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.WORKERS.GET_ALL);
      console.log('🔍 Workers Response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Paginated envelope: { data: { items: [...] } }
      if (Array.isArray(response.data?.data?.items)) {
        return response.data.data.items;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching workers:', error);
      return [];
    }
  }

  /**
   * Get all customers
   */
  static async getCustomers(): Promise<Customer[]> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.CUSTOMERS.GET_ALL);
      console.log('🔍 Customers Response:', response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      return [];
    }
  }
}

