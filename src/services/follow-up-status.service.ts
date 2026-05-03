import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  FollowUpStatus,
  CreateFollowUpStatusDto,
  UpdateFollowUpStatusDto,
} from '@/types/api.types';

function extractArray<T>(responseData: any): T[] {
  if (Array.isArray(responseData)) return responseData;
  if (responseData && typeof responseData === 'object') {
    for (const key of ['data', 'result', 'items']) {
      if (Array.isArray(responseData[key])) return responseData[key];
    }
  }
  return [];
}

export class FollowUpStatusService {
  static async getAll(): Promise<FollowUpStatus[]> {
    const res = await api.get<any>(API_ENDPOINTS.FOLLOWUP_STATUS.GET_ALL);
    return extractArray<FollowUpStatus>(res.data);
  }

  static async getById(id: number): Promise<FollowUpStatus> {
    const res = await api.get<any>(API_ENDPOINTS.FOLLOWUP_STATUS.GET_BY_ID(id));
    const raw = res.data?.data ?? res.data?.value ?? res.data;
    return raw as FollowUpStatus;
  }

  static async create(data: CreateFollowUpStatusDto): Promise<FollowUpStatus> {
    const res = await api.post<FollowUpStatus>(API_ENDPOINTS.FOLLOWUP_STATUS.CREATE, data);
    return res.data;
  }

  static async update(data: UpdateFollowUpStatusDto): Promise<FollowUpStatus> {
    const res = await api.put<FollowUpStatus>(API_ENDPOINTS.FOLLOWUP_STATUS.UPDATE, data);
    return res.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.FOLLOWUP_STATUS.DELETE(id));
  }
}
