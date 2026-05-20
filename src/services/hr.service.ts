import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  EmployeeDto,
  EmployeeCurrentDto,
  EmployeePagedResponse,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  AttendanceFilterDto,
  AttendanceRecord,
  CreateLeaveRequestDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  LeaveRequestDto,
  LeaveTypeDto,
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  GeneratePayrollDto,
  PayrollRunDto,
  CreatePermissionRequestDto,
  PermissionRequestDto,
  CreateResignationRequestDto,
  ResignationRequestDto,
  CreateCustodyRequestDto,
  CustodyTypeDto,
  CreateCustodyTypeDto,
  CustodyRequestDto,
} from '@/types/hr.types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function unwrap<T>(payload: any): T {
  return (payload?.data?.value ?? payload?.value ?? payload?.data ?? payload) as T;
}

function unwrapList<T>(payload: any): T[] {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.value,
    payload?.value,
    payload?.data?.items,
    payload?.value?.items,
    payload?.items,
    payload?.data?.result,
    payload?.result,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
    if (Array.isArray(c?.$values)) return c.$values as T[];
  }
  return [];
}

// ─── Employee Service ────────────────────────────────────────────────────────

export class HREmployeeService {
  static async getAll(params?: {
    searchName?: string;
    page?: number;
    pageSize?: number;
  }): Promise<EmployeePagedResponse> {
    const response = await api.get<any>(API_ENDPOINTS.HR_EMPLOYEE.GET_ALL, {
      params: {
        searchName: params?.searchName || undefined,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    });
    const raw = response.data;
    const items = unwrapList<EmployeeDto>(raw);
    const meta = raw?.data ?? raw;
    return {
      items,
      totalCount: meta?.totalCount ?? meta?.total ?? items.length,
      page: meta?.page ?? params?.page ?? 1,
      pageSize: meta?.pageSize ?? params?.pageSize ?? 10,
    };
  }

  static async getById(id: string): Promise<EmployeeCurrentDto> {
    const response = await api.get<any>(API_ENDPOINTS.HR_EMPLOYEE.GET_BY_ID(id));
    return unwrap<EmployeeCurrentDto>(response.data);
  }

  static async create(data: CreateEmployeeDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_EMPLOYEE.CREATE, data);
  }

  static async update(id: string, data: UpdateEmployeeDto): Promise<void> {
    await api.put(API_ENDPOINTS.HR_EMPLOYEE.UPDATE(id), data);
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_EMPLOYEE.DELETE(id));
  }

  static async resetPassword(id: string): Promise<void> {
    await api.put(API_ENDPOINTS.HR_EMPLOYEE.RESET_PASSWORD(id));
  }
}

// ─── Attendance Service ──────────────────────────────────────────────────────

export class HRAttendanceService {
  static async checkIn(): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ATTENDANCE.CHECK_IN, {});
  }

  static async checkOut(): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ATTENDANCE.CHECK_OUT, {});
  }

  static async filter(dto: AttendanceFilterDto): Promise<AttendanceRecord[]> {
    const response = await api.post<any>(API_ENDPOINTS.HR_ATTENDANCE.FILTER, dto);
    return unwrapList<AttendanceRecord>(response.data);
  }
}

// ─── Leave Service ───────────────────────────────────────────────────────────

export class HRLeaveService {
  static async getAll(): Promise<LeaveRequestDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_LEAVE.GET_ALL);
    return unwrapList<LeaveRequestDto>(response.data);
  }

  static async create(data: CreateLeaveRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_LEAVE.CREATE, data);
  }

  static async getBalance(leaveTypeId: string): Promise<number> {
    const response = await api.get<any>(API_ENDPOINTS.HR_LEAVE.GET_BALANCE(leaveTypeId));
    const raw = unwrap<any>(response.data);
    return raw?.balance ?? raw?.Balance ?? 0;
  }

  static async approve(requestId: string, dto?: ApproveLeaveDto): Promise<void> {
    await api.put(API_ENDPOINTS.HR_LEAVE.APPROVE(requestId), dto ?? {});
  }

  static async reject(requestId: string, dto?: RejectLeaveDto): Promise<void> {
    await api.put(API_ENDPOINTS.HR_LEAVE.REJECT(requestId), dto ?? {});
  }

  static async cancel(requestId: string): Promise<void> {
    await api.put(API_ENDPOINTS.HR_LEAVE.CANCEL(requestId));
  }
}

// ─── Leave Type Service ──────────────────────────────────────────────────────

export class HRLeaveTypeService {
  static async getAll(): Promise<LeaveTypeDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_LEAVE_TYPE.GET_ALL);
    return unwrapList<LeaveTypeDto>(response.data);
  }

  static async getById(id: string): Promise<LeaveTypeDto> {
    const response = await api.get<any>(API_ENDPOINTS.HR_LEAVE_TYPE.GET_BY_ID(id));
    return unwrap<LeaveTypeDto>(response.data);
  }

  static async create(data: CreateLeaveTypeDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_LEAVE_TYPE.CREATE, data);
  }

  static async update(id: string, data: UpdateLeaveTypeDto): Promise<void> {
    await api.put(API_ENDPOINTS.HR_LEAVE_TYPE.UPDATE(id), data);
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_LEAVE_TYPE.DELETE(id));
  }
}

// ─── Permission Request Service ──────────────────────────────────────────────

export class HRPermissionRequestService {
  static async getAll(): Promise<PermissionRequestDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_PERMISSION_REQUEST.GET_ALL);
    return unwrapList<PermissionRequestDto>(response.data);
  }

  static async create(data: CreatePermissionRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION_REQUEST.CREATE, data);
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION_REQUEST.APPROVE(id), {});
  }

  static async reject(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION_REQUEST.REJECT(id), {});
  }
}

// ─── Resignation Request Service ─────────────────────────────────────────────

export class HRResignationRequestService {
  static async getAll(): Promise<ResignationRequestDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_RESIGNATION_REQUEST.GET_ALL);
    return unwrapList<ResignationRequestDto>(response.data);
  }

  static async create(data: CreateResignationRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_RESIGNATION_REQUEST.CREATE, data);
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_RESIGNATION_REQUEST.APPROVE(id), {});
  }

  static async reject(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_RESIGNATION_REQUEST.REJECT(id), {});
  }
}

// ─── Custody Request Service ──────────────────────────────────────────────────

export class HRCustodyRequestService {
  static async getAll(): Promise<CustodyRequestDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_CUSTODY_REQUEST.GET_ALL);
    return unwrapList<CustodyRequestDto>(response.data);
  }

  static async create(data: CreateCustodyRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_CUSTODY_REQUEST.CREATE, data);
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_CUSTODY_REQUEST.APPROVE(id), {});
  }

  static async reject(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_CUSTODY_REQUEST.REJECT(id), {});
  }

  static async getTypes(): Promise<CustodyTypeDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_CUSTODY_REQUEST.GET_TYPES);
    return unwrapList<CustodyTypeDto>(response.data);
  }

  static async getType(id: string): Promise<CustodyTypeDto> {
    const response = await api.get<any>(API_ENDPOINTS.HR_CUSTODY_REQUEST.GET_TYPE(id));
    return unwrap<CustodyTypeDto>(response.data);
  }

  static async createType(data: CreateCustodyTypeDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_CUSTODY_REQUEST.CREATE_TYPE, data);
  }
}

// ─── Payroll Service ─────────────────────────────────────────────────────────

export class HRPayrollService {
  static async generate(dto: GeneratePayrollDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PAYROLL.GENERATE, dto);
  }

  static async get(month: number, year: number): Promise<PayrollRunDto> {
    const response = await api.get<any>(API_ENDPOINTS.HR_PAYROLL.GET, {
      params: { month, year },
    });
    return unwrap<PayrollRunDto>(response.data);
  }

  static async close(id: string): Promise<void> {
    await api.put(API_ENDPOINTS.HR_PAYROLL.CLOSE(id));
  }

  static async exportExcel(month: number, year: number): Promise<Blob> {
    const response = await api.get(API_ENDPOINTS.HR_PAYROLL.EXPORT, {
      params: { month, year },
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}
