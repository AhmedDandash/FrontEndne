import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrapList } from '@/lib/api/unwrap';
import type { Department, CreateDepartmentDto } from '@/types/hr.types';

export class DepartmentService {
  static async getAll(): Promise<Department[]> {
    const response = await api.get<any>(API_ENDPOINTS.DEPARTMENT.GET_ALL);
    return unwrapList<Department>(response.data);
  }

  // POST /api/V1/Department — nameAr and nameEn are sent as query params per spec.
  // An empty object body is required so a Content-Length header is emitted —
  // a bodyless POST returns HTTP 411 (Length Required) from this backend.
  static async create(dto: CreateDepartmentDto): Promise<void> {
    await api.post(API_ENDPOINTS.DEPARTMENT.CREATE, {}, {
      params: {
        nameAr: dto.nameAr || undefined,
        nameEn: dto.nameEn || undefined,
      },
    });
  }


}
