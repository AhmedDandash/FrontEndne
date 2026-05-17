import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Department, CreateDepartmentDto } from '@/types/hr.types';

function unwrapList<T>(payload: any): T[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.value,
    payload?.value,
    payload?.items,
    payload?.data?.items,
    payload?.result,
    payload?.data?.result,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
    if (Array.isArray(c?.$values)) return c.$values as T[];
  }
  return [];
}

export class DepartmentService {
  static async getAll(): Promise<Department[]> {
    const response = await api.get<any>(API_ENDPOINTS.DEPARTMENT.GET_ALL);
    return unwrapList<Department>(response.data);
  }

  // POST /api/V1/Department — nameAr and nameEn are sent as query params per spec
  static async create(dto: CreateDepartmentDto): Promise<void> {
    await api.post(API_ENDPOINTS.DEPARTMENT.CREATE, undefined, {
      params: {
        nameAr: dto.nameAr || undefined,
        nameEn: dto.nameEn || undefined,
      },
    });
  }


}
