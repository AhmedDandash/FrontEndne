import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  ContractNationality,
  CreateContractNationalityDto,
  UpdateContractNationalityDto,
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

export class ContractNationalityService {
  static async getAll(): Promise<ContractNationality[]> {
    const res = await api.get<any>(API_ENDPOINTS.CONTRACT_NATIONALITY.GET_ALL);
    return extractArray<ContractNationality>(res.data);
  }

  static async create(data: CreateContractNationalityDto): Promise<ContractNationality> {
    const res = await api.post<ContractNationality>(API_ENDPOINTS.CONTRACT_NATIONALITY.CREATE, data);
    return res.data;
  }

  static async update(data: UpdateContractNationalityDto): Promise<ContractNationality> {
    const res = await api.put<ContractNationality>(API_ENDPOINTS.CONTRACT_NATIONALITY.UPDATE, data);
    return res.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.CONTRACT_NATIONALITY.DELETE(id));
  }
}
