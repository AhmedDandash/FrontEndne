/**
 * Hourly Worker Services
 * Worker pool CRUD + lifecycle, and request review/assign/lifecycle.
 * See src/types/hourly-worker.types.ts for the business rules.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap } from '@/utils/api-response';
import type {
  HourlyWorker,
  CreateHourlyWorkerDto,
  UpdateHourlyWorkerDto,
  HourlyWorkerListParams,
  HourlyWorkerRequest,
  HourlyWorkerRequestListParams,
  AssignWorkerDto,
  RejectRequestDto,
} from '@/types/hourly-worker.types';

export interface Paged<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

function unwrapPaged<T>(payload: any, params?: { pageNumber?: number; pageSize?: number }): Paged<T> {
  const data = payload?.data ?? payload;
  const items: T[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  return {
    items,
    totalCount: data?.totalCount ?? items.length,
    pageNumber: data?.pageNumber ?? params?.pageNumber ?? 1,
    pageSize: data?.pageSize ?? params?.pageSize ?? items.length,
  };
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export class HourlyWorkerService {
  static async getAll(params: HourlyWorkerListParams = {}): Promise<Paged<HourlyWorker>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKERS.GET_ALL, {
      params: {
        search: params.search || undefined,
        isActive: params.isActive,
        isAvailableNow: params.isAvailableNow,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyWorker>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyWorker> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKERS.GET_BY_ID(id));
    return unwrap<HourlyWorker>(response.data);
  }

  static async create(data: CreateHourlyWorkerDto): Promise<HourlyWorker> {
    const response = await api.post<any>(API_ENDPOINTS.HOURLY_WORKERS.CREATE, data);
    return unwrap<HourlyWorker>(response.data);
  }

  static async update(id: string, data: UpdateHourlyWorkerDto): Promise<HourlyWorker> {
    const response = await api.put<any>(API_ENDPOINTS.HOURLY_WORKERS.UPDATE(id), data);
    return unwrap<HourlyWorker>(response.data);
  }

  static async remove(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOURLY_WORKERS.DELETE(id));
  }

  static async activate(id: string): Promise<void> {
    // Empty body {} so axios sends Content-Length:0 (server returns 411 otherwise).
    await api.post(API_ENDPOINTS.HOURLY_WORKERS.ACTIVATE(id), {});
  }

  static async deactivate(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKERS.DEACTIVATE(id), {});
  }
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export class HourlyWorkerRequestService {
  static async getAll(
    params: HourlyWorkerRequestListParams = {}
  ): Promise<Paged<HourlyWorkerRequest>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_ALL, {
      params: {
        ticketNumber: params.ticketNumber || undefined,
        customerName: params.customerName || undefined,
        status: params.status,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyWorkerRequest>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyWorkerRequest> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_BY_ID(id));
    return unwrap<HourlyWorkerRequest>(response.data);
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto = {}): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.REJECT(id), data);
  }

  static async assign(id: string, data: AssignWorkerDto): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.ASSIGN(id), data);
  }

  static async markInProgress(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.IN_PROGRESS(id), {});
  }

  static async complete(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.COMPLETE(id), {});
  }

  static async cancel(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.CANCEL(id), {});
  }
}
