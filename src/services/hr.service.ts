/**
 * HR Service
 * All HR module API calls.
 * Mock data is used until real endpoints are available.
 * To wire real APIs: remove mock imports and uncomment api.* calls.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { AuthService } from './auth.service';
import type {
  HREmployee,
  HRLookupItem,
  VacationRequest,
  CreateVacationRequestDto,
  PermissionRequest,
  CreatePermissionRequestDto,
  CustodyRequest,
  CreateCustodyRequestDto,
  JobModificationRequest,
  CreateJobModificationRequestDto,
  ResignationRequest,
  CreateResignationRequestDto,
  EntitlementsRequest,
  CreateEntitlementsRequestDto,
  LoanRequest,
  CreateLoanRequestDto,
  HRRequestSummary,
  HRRequestsFilterDto,
  Employee,
  EmployeesFilterDto,
  EmployeeCommission,
  CommissionFilterDto,
  CommissionSlice,
  CreateCommissionSliceDto,
  AttendanceRecord,
  AttendanceFilterDto,
  LeaveBalance,
  LeaveBalanceFilterDto,
  HRComplaint,
  CreateHRComplaintDto,
  ReplyHRComplaintDto,
} from '@/types/hr.types';

// ── Mock data imports (remove when real API is ready) ──
import {
  MOCK_HR_EMPLOYEES,
  MOCK_DEPARTMENTS,
  MOCK_SALARY_SCALES,
  MOCK_CUSTODY_TYPES,
  MOCK_VACATION_REQUESTS,
  MOCK_PERMISSION_REQUESTS,
  MOCK_INBOX_REQUESTS,
  MOCK_OUTBOX_REQUESTS,
  MOCK_EMPLOYEES,
  MOCK_COMMISSIONS,
  MOCK_COMMISSION_SLICES,
  MOCK_ATTENDANCE,
  MOCK_LEAVE_BALANCES,
  MOCK_HR_COMPLAINTS,
} from '@/features/hr/mock/hr.mock';

// ─────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────

export class HREmployeeService {
  static async getAll(filter?: EmployeesFilterDto): Promise<Employee[]> {
    // TODO: replace with real API
    // const response = await api.get(API_ENDPOINTS.HR_EMPLOYEES.GET_ALL, { params: filter });
    // return response.data;
    let result = [...MOCK_EMPLOYEES];
    if (filter?.nameAr) result = result.filter((e) => e.nameAr.includes(filter.nameAr!));
    if (filter?.loginName) result = result.filter((e) => e.loginName?.includes(filter.loginName!));
    if (filter?.email) result = result.filter((e) => e.email?.includes(filter.email!));
    return result;
  }

  static async getById(id: string): Promise<Employee | undefined> {
    // TODO: replace with real API
    // const response = await api.get(API_ENDPOINTS.HR_EMPLOYEES.GET_BY_ID(id));
    // return response.data;
    return MOCK_EMPLOYEES.find((e) => e.id === id);
  }

  static async getCurrent(userId: number | null): Promise<HREmployee | undefined> {
    // TODO: replace with real API
    // const response = await api.get(API_ENDPOINTS.HR_EMPLOYEES.GET_CURRENT);
    // return response.data;
    const currentUser = AuthService.getCurrentUser();
    const userName =
      currentUser?.username ||
      currentUser?.userName ||
      currentUser?.loginName ||
      currentUser?.fullName ||
      currentUser?.name;

    const candidateIds = [
      currentUser?.employeeId,
      currentUser?.employeeGuid,
      currentUser?.employee?.id,
      currentUser?.id,
      userId,
      typeof window !== 'undefined' ? localStorage.getItem('employeeId') : null,
      typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
    ]
      .filter((v): v is string | number => v !== null && v !== undefined)
      .map((v) => String(v));

    if (candidateIds.length) {
      const byId = MOCK_HR_EMPLOYEES.find((e) => candidateIds.includes(e.id));
      if (byId) return byId;
    }

    if (userName) {
      const normalized = String(userName).toLowerCase();
      const linkedEmployee = MOCK_EMPLOYEES.find((e) => {
        const login = e.loginName?.toLowerCase();
        const enName = e.nameEn?.toLowerCase();
        return login === normalized || enName === normalized;
      });
      if (linkedEmployee) {
        return MOCK_HR_EMPLOYEES.find((e) => e.id === linkedEmployee.id);
      }
    }

    return MOCK_HR_EMPLOYEES[0];
  }

  static async search(query: string): Promise<HREmployee[]> {
    // TODO: replace with real API
    // const response = await api.get(API_ENDPOINTS.HR_EMPLOYEES.SEARCH, { params: { q: query } });
    // return response.data;
    const q = query.toLowerCase();
    return MOCK_HR_EMPLOYEES.filter(
      (e) =>
        e.nameAr.toLowerCase().includes(q) ||
        e.nameEn.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q)
    );
  }
}

// ─────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────

export class HRLookupService {
  static async getDepartments(): Promise<HRLookupItem[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_LOOKUPS.DEPARTMENTS);
    return MOCK_DEPARTMENTS;
  }

  static async getSalaryScales(): Promise<HRLookupItem[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_LOOKUPS.SALARY_SCALES);
    return MOCK_SALARY_SCALES;
  }

  static async getCustodyTypes(): Promise<HRLookupItem[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_LOOKUPS.CUSTODY_TYPES);
    return MOCK_CUSTODY_TYPES;
  }
}

// ─────────────────────────────────────────────
// Vacation Request
// ─────────────────────────────────────────────

export class HRVacationService {
  static async getAll(): Promise<VacationRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_VACATION.GET_ALL);
    return MOCK_VACATION_REQUESTS;
  }

  static async getById(id: number): Promise<VacationRequest | undefined> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_VACATION.GET_BY_ID(id));
    return MOCK_VACATION_REQUESTS.find((r) => r.id === id);
  }

  static async create(data: CreateVacationRequestDto): Promise<VacationRequest> {
    const response = await api.post<VacationRequest>(API_ENDPOINTS.HR_VACATION.CREATE, data);
    return response.data;
  }

  static async approve(id: number): Promise<void> {
    await api.post(API_ENDPOINTS.HR_VACATION.APPROVE(id), {});
  }

  static async reject(id: number, reason: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_VACATION.REJECT(id), { reason });
  }
}

// ─────────────────────────────────────────────
// Permission Request
// ─────────────────────────────────────────────

export class HRPermissionService {
  static async getAll(): Promise<PermissionRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_PERMISSION.GET_ALL);
    return MOCK_PERMISSION_REQUESTS;
  }

  static async create(data: CreatePermissionRequestDto): Promise<PermissionRequest> {
    const response = await api.post<PermissionRequest>(API_ENDPOINTS.HR_PERMISSION.CREATE, data);
    return response.data;
  }

  static async approve(id: number): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION.APPROVE(id), {});
  }

  static async reject(id: number, reason: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION.REJECT(id), { reason });
  }
}

// ─────────────────────────────────────────────
// Custody Request
// ─────────────────────────────────────────────

export class HRCustodyService {
  static async getAll(): Promise<CustodyRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_CUSTODY.GET_ALL);
    return [];
  }

  static async create(data: CreateCustodyRequestDto): Promise<CustodyRequest> {
    const response = await api.post<CustodyRequest>(API_ENDPOINTS.HR_CUSTODY.CREATE, data);
    return response.data;
  }
}

// ─────────────────────────────────────────────
// Job Modification Request
// ─────────────────────────────────────────────

export class HRJobModificationService {
  static async getAll(): Promise<JobModificationRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_JOB_MODIFICATION.GET_ALL);
    return [];
  }

  static async create(data: CreateJobModificationRequestDto): Promise<JobModificationRequest> {
    const response = await api.post<JobModificationRequest>(
      API_ENDPOINTS.HR_JOB_MODIFICATION.CREATE,
      data
    );
    return response.data;
  }
}

// ─────────────────────────────────────────────
// Resignation Request
// ─────────────────────────────────────────────

export class HRResignationService {
  static async getAll(): Promise<ResignationRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_RESIGNATION.GET_ALL);
    return [];
  }

  static async create(data: CreateResignationRequestDto): Promise<ResignationRequest> {
    const response = await api.post<ResignationRequest>(API_ENDPOINTS.HR_RESIGNATION.CREATE, data);
    return response.data;
  }
}

// ─────────────────────────────────────────────
// Entitlements Request
// ─────────────────────────────────────────────

export class HREntitlementsService {
  static async getAll(): Promise<EntitlementsRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_ENTITLEMENTS.GET_ALL);
    return [];
  }

  static async create(data: CreateEntitlementsRequestDto): Promise<EntitlementsRequest> {
    const response = await api.post<EntitlementsRequest>(
      API_ENDPOINTS.HR_ENTITLEMENTS.CREATE,
      data
    );
    return response.data;
  }
}

// ─────────────────────────────────────────────
// Loans Request
// ─────────────────────────────────────────────

export class HRLoansService {
  static async getAll(): Promise<LoanRequest[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_LOANS.GET_ALL);
    return [];
  }

  static async create(data: CreateLoanRequestDto): Promise<LoanRequest> {
    const response = await api.post<LoanRequest>(API_ENDPOINTS.HR_LOANS.CREATE, data);
    return response.data;
  }
}

// ─────────────────────────────────────────────
// Requests Inbox / Outbox
// ─────────────────────────────────────────────

export class HRRequestsInboxService {
  static async getAll(filter?: HRRequestsFilterDto): Promise<HRRequestSummary[]> {
    // TODO: const response = await api.post(API_ENDPOINTS.HR_REQUESTS_INBOX.FILTER, filter);
    let result = [...MOCK_INBOX_REQUESTS];
    if (filter?.processState) result = result.filter((r) => r.processState === filter.processState);
    if (filter?.processGroups?.length)
      result = result.filter((r) => filter.processGroups!.includes(r.processGroup));
    if (filter?.processResults?.length)
      result = result.filter((r) => filter.processResults!.includes(r.result));
    return result;
  }
}

export class HRRequestsOutboxService {
  static async getAll(filter?: HRRequestsFilterDto): Promise<HRRequestSummary[]> {
    // TODO: const response = await api.post(API_ENDPOINTS.HR_REQUESTS_OUTBOX.FILTER, filter);
    let result = [...MOCK_OUTBOX_REQUESTS];
    if (filter?.processState) result = result.filter((r) => r.processState === filter.processState);
    return result;
  }
}

// ─────────────────────────────────────────────
// Employee Commission
// ─────────────────────────────────────────────

export class HRCommissionService {
  static async getAll(filter?: CommissionFilterDto): Promise<EmployeeCommission[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_COMMISSION.GET_ALL, { params: filter });
    let result = [...MOCK_COMMISSIONS];
    if (filter?.empId) result = result.filter((c) => c.empId === filter.empId);
    return result;
  }

  static async create(
    data: Omit<EmployeeCommission, 'id' | 'employeeName'>
  ): Promise<EmployeeCommission> {
    const response = await api.post<EmployeeCommission>(API_ENDPOINTS.HR_COMMISSION.CREATE, data);
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_COMMISSION.DELETE(id));
  }
}

// ─────────────────────────────────────────────
// Commission Slices
// ─────────────────────────────────────────────

export class HRCommissionSliceService {
  static async getAll(): Promise<CommissionSlice[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_COMMISSION_SLICES.GET_ALL);
    return MOCK_COMMISSION_SLICES;
  }

  static async create(data: CreateCommissionSliceDto): Promise<CommissionSlice> {
    const response = await api.post<CommissionSlice>(
      API_ENDPOINTS.HR_COMMISSION_SLICES.CREATE,
      data
    );
    return response.data;
  }

  static async update(
    id: number,
    data: Partial<CreateCommissionSliceDto>
  ): Promise<CommissionSlice> {
    const response = await api.put<CommissionSlice>(
      API_ENDPOINTS.HR_COMMISSION_SLICES.UPDATE(id),
      data
    );
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_COMMISSION_SLICES.DELETE(id));
  }
}

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

export class HRAttendanceService {
  static async getAll(filter?: AttendanceFilterDto): Promise<AttendanceRecord[]> {
    // TODO: const response = await api.post(API_ENDPOINTS.HR_ATTENDANCE.FILTER, filter);
    let result = [...MOCK_ATTENDANCE];
    if (filter?.employeeId) result = result.filter((a) => a.employeeId === filter.employeeId);
    if (filter?.attendanceDay)
      result = result.filter((a) => a.attendanceDay === filter.attendanceDay);
    return result;
  }
}

// ─────────────────────────────────────────────
// Leave Balance
// ─────────────────────────────────────────────

export class HRLeaveBalanceService {
  static async getAll(filter?: LeaveBalanceFilterDto): Promise<LeaveBalance[]> {
    // TODO: const response = await api.post(API_ENDPOINTS.HR_LEAVE_BALANCE.FILTER, filter);
    let result = [...MOCK_LEAVE_BALANCES];
    if (filter?.employeeId) result = result.filter((b) => b.employeeId === filter.employeeId);
    if (filter?.year) result = result.filter((b) => b.year === filter.year);
    return result;
  }
}

// ─────────────────────────────────────────────
// HR Complaints
// ─────────────────────────────────────────────

export class HRComplaintService {
  static async getAll(): Promise<HRComplaint[]> {
    // TODO: const response = await api.get(API_ENDPOINTS.HR_COMPLAINTS.GET_ALL);
    return MOCK_HR_COMPLAINTS;
  }

  static async create(data: CreateHRComplaintDto): Promise<HRComplaint> {
    const response = await api.post<HRComplaint>(API_ENDPOINTS.HR_COMPLAINTS.CREATE, data);
    return response.data;
  }

  static async reply(data: ReplyHRComplaintDto): Promise<HRComplaint> {
    const response = await api.post<HRComplaint>(API_ENDPOINTS.HR_COMPLAINTS.REPLY, data);
    return response.data;
  }

  static async close(id: number): Promise<void> {
    await api.post(API_ENDPOINTS.HR_COMPLAINTS.CLOSE(id), {});
  }

  static async delete(id: number): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_COMPLAINTS.DELETE(id));
  }
}
