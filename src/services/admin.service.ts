import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  EmployeePosition,
  EmployeePositionCreateDto,
  AddUserDto,
  AssignRoleDto,
  AdminUser,
} from '@/types/hr.types';

function unwrapList<T>(payload: any): T[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.value,
    payload?.value,
    payload?.data?.items,
    payload?.value?.items,
    payload?.items,
    payload?.result,
    payload?.data?.result,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
    if (Array.isArray(c?.$values)) return c.$values as T[];
  }
  return [];
}

// ─── Position Service (Position = Job in HR module) ──────────────────────────

export class AdminPositionService {
  static async getAll(): Promise<EmployeePosition[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_ADMIN.POSITIONS);
    return unwrapList<EmployeePosition>(response.data);
  }

  static async create(dto: EmployeePositionCreateDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ADMIN.CREATE_POSITION, dto);
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_ADMIN.DELETE_POSITION(id));
  }
}

// ─── Admin User Service ──────────────────────────────────────────────────────

export class AdminUserService {
  static async getAll(): Promise<AdminUser[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_ADMIN.ALL_USERS);
    return unwrapList<AdminUser>(response.data);
  }

  static async addUser(dto: AddUserDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ADMIN.ADD_USER, dto);
  }

  static async assignRole(dto: AssignRoleDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ADMIN.ASSIGN_ROLE, dto);
  }

  static async removeRole(dto: AssignRoleDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ADMIN.REMOVE_ROLE, dto);
  }
}

// ─── Admin Role Service ──────────────────────────────────────────────────────

export class AdminRoleService {
  static async getAll(): Promise<string[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_ADMIN.ALL_ROLES);
    const payload = response.data;
    if (Array.isArray(payload?.data)) return payload.data as string[];
    if (Array.isArray(payload)) return payload as string[];
    return [];
  }
}
