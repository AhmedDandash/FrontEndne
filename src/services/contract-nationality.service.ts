import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  ContractNationality,
  CreateContractNationalityDto,
  UpdateContractNationalityDto,
} from '@/types/api.types';

function extractArray<T>(responseData: any): T[] {
  const candidates = [
    responseData,
    responseData?.data,
    responseData?.result,
    responseData?.items,
    responseData?.data?.items,
    responseData?.data?.value,
    responseData?.value,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (Array.isArray(c?.$values)) return c.$values;
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
