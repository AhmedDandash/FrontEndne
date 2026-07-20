import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  NationalityFollowUpConfig,
  UpdateNationalityFollowUpConfigDto,
  BulkUpdateNationalityFollowUpConfigDto,
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

export class NationalityFollowUpConfigService {
  static async getByNationality(
    contractNationalityId: number,
    isActive?: boolean
  ): Promise<NationalityFollowUpConfig[]> {
    const res = await api.get<any>(
      API_ENDPOINTS.NATIONALITY_FOLLOWUP_CONFIG.GET_BY_NATIONALITY(contractNationalityId),
      { params: isActive != null ? { isActive } : undefined }
    );
    const items = extractArray<NationalityFollowUpConfig>(res.data);
    return items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  static async toggleActive(id: number): Promise<{ isActive: boolean }> {
    const res = await api.post<any>(
      API_ENDPOINTS.NATIONALITY_FOLLOWUP_CONFIG.TOGGLE_ACTIVE(id)
    );
    return res.data;
  }

  static async update(data: UpdateNationalityFollowUpConfigDto): Promise<NationalityFollowUpConfig> {
    const res = await api.put<NationalityFollowUpConfig>(
      API_ENDPOINTS.NATIONALITY_FOLLOWUP_CONFIG.UPDATE,
      data
    );
    return res.data;
  }

  static async bulkUpdate(data: BulkUpdateNationalityFollowUpConfigDto): Promise<void> {
    await api.post(API_ENDPOINTS.NATIONALITY_FOLLOWUP_CONFIG.BULK_UPDATE, data);
  }
}
