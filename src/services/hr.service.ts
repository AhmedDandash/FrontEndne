import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/lib/api/unwrap';
import type {
  EmployeeDto,
  EmployeeCurrentDto,
  EmployeePagedResponse,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  AttendanceFilterDto,
  AttendanceLocationDto,
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
  EmployeeLeaveBalanceDto,
  FilterInboxDto,
  FilterOutboxDto,
} from '@/types/hr.types';

// ─── Employee Service ────────────────────────────────────────────────────────

export class HREmployeeService {
  static async getAll(params?: {
    searchName?: string;
    page?: number;
    pageSize?: number;
    // Extra filters (gap-audit addition — see simga-api.txt GET /api/V1/Employee).
    employeePositionId?: string;
    hiringDateFrom?: string;
    hiringDateTo?: string;
    basicSalaryMin?: number;
    basicSalaryMax?: number;
    iban?: string;
  }): Promise<EmployeePagedResponse> {
    const response = await api.get<any>(API_ENDPOINTS.HR_EMPLOYEE.GET_ALL, {
      params: {
        searchName: params?.searchName || undefined,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
        employeePositionId: params?.employeePositionId || undefined,
        hiringDateFrom: params?.hiringDateFrom || undefined,
        hiringDateTo: params?.hiringDateTo || undefined,
        basicSalaryMin: params?.basicSalaryMin,
        basicSalaryMax: params?.basicSalaryMax,
        iban: params?.iban || undefined,
      },
    });
    const raw = response.data;
    const items = unwrapList<EmployeeDto>(raw);
    const meta = raw?.data ?? raw;
    return {
      items,
      totalCount: meta?.totalCount ?? meta?.total ?? items.length,
      // Backend echoes the page as `pageNumber` (not `page`).
      page: meta?.pageNumber ?? meta?.page ?? params?.page ?? 1,
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
    // Send an explicit empty body so a Content-Length:0 header is emitted —
    // bodyless PUTs return HTTP 411 (Length Required) from this backend.
    await api.put(API_ENDPOINTS.HR_EMPLOYEE.RESET_PASSWORD(id), {});
  }
}

// ─── Attendance Service ──────────────────────────────────────────────────────

export class HRAttendanceService {
  // Backend requires a JSON body with GPS coordinates (a bodyless POST returns
  // HTTP 411); geofencing is validated server-side against the assigned branch.
  static async checkIn(location: AttendanceLocationDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ATTENDANCE.CHECK_IN, location);
  }

  static async checkOut(location: AttendanceLocationDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ATTENDANCE.CHECK_OUT, location);
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
    // Send an explicit empty body so a Content-Length:0 header is emitted —
    // a bodyless PUT returns HTTP 411 (Length Required) from this backend.
    await api.put(API_ENDPOINTS.HR_LEAVE.CANCEL(requestId), {});
  }

  static async getEmployeeBalances(params: {
    employeeId?: string;
    leaveTypeId?: string;
    year?: number;
    month?: number;
  }): Promise<EmployeeLeaveBalanceDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_LEAVE.EMPLOYEE_BALANCES, { params });
    return unwrapList<EmployeeLeaveBalanceDto>(response.data);
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

  static async getHistory(year?: number): Promise<PayrollRunDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HR_PAYROLL.HISTORY, {
      params: { year },
    });
    return unwrapList<PayrollRunDto>(response.data);
  }

  // Generate → Approve → Close. Approve must precede Close (verified live).
  static async approve(id: string): Promise<void> {
    await api.put(API_ENDPOINTS.HR_PAYROLL.APPROVE(id), {});
  }

  static async close(id: string): Promise<void> {
    // Empty body required — a bodyless PUT returns HTTP 411 from this backend.
    await api.put(API_ENDPOINTS.HR_PAYROLL.CLOSE(id), {});
  }

  static async exportExcel(month: number, year: number): Promise<Blob> {
    const response = await api.get(API_ENDPOINTS.HR_PAYROLL.EXPORT, {
      params: { month, year },
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}

// ─── Requests Inbox / Outbox Service (plumbing only) ─────────────────────────
// No inbox/outbox UI feature exists in the HR module yet. These methods only
// make the backend capability reachable; building the actual screens is out of
// scope for this pass.

export class HRRequestsInboxService {
  static async filter(dto: FilterInboxDto): Promise<unknown[]> {
    const response = await api.post<any>(API_ENDPOINTS.HR_REQUESTS_INBOX.FILTER, dto);
    return unwrapList<unknown>(response.data);
  }
}

export class HRRequestsOutboxService {
  static async filter(dto: FilterOutboxDto): Promise<unknown[]> {
    const response = await api.post<any>(API_ENDPOINTS.HR_REQUESTS_OUTBOX.FILTER, dto);
    return unwrapList<unknown>(response.data);
  }
}
