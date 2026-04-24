/**
 * HR Service
 * All HR module API calls.
 * Mock data is used as fallback until real endpoints are fully verified.
 * Paths match swagger-Hr-Api.json exactly.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
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
  CreateEmployeeDto,
  CreateDepartmentDto,
  RejectRequestDto,
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


// ─────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────

export class HREmployeeService {
  static async getAll(filter?: EmployeesFilterDto): Promise<Employee[]> {
    const response = await api.get<Employee[]>(API_ENDPOINTS.HR_EMPLOYEES.GET_ALL, {
      params: {
        searchName: filter?.nameAr,
        page: 1,
        pageSize: 100,
      },
    });
    return response.data ?? [];
  }

  static async getById(id: string): Promise<Employee | undefined> {
    const response = await api.get<Employee>(API_ENDPOINTS.HR_EMPLOYEES.GET_BY_ID(id));
    return response.data;
  }

  static async create(data: CreateEmployeeDto): Promise<Employee> {
    const response = await api.post<Employee>(API_ENDPOINTS.HR_EMPLOYEES.CREATE, data);
    return response.data;
  }

  static async update(id: string, data: CreateEmployeeDto): Promise<Employee> {
    const response = await api.put<Employee>(API_ENDPOINTS.HR_EMPLOYEES.UPDATE(id), data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_EMPLOYEES.DELETE(id));
  }

  static async getCurrent(username: string | null): Promise<HREmployee | null> {
    if (!username) return null;
    const response = await api.get<Employee[]>(API_ENDPOINTS.HR_EMPLOYEES.GET_ALL, {
      params: { searchName: username, page: 1, pageSize: 1 },
    });
    const emp = response.data?.[0];
    if (!emp) return null;
    return {
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      nameAr: emp.nameAr,
      nameEn: emp.nameEn,
      jobName: emp.jobName,
      departmentId: emp.departmentId,
      departmentName: emp.departmentName,
      nationalityName: emp.nationalityName,
      idNumber: emp.idNumber,
      mobileNumber: emp.mobileNumber,
      hiringDate: emp.hiringDate,
    };
  }

  static async search(query: string): Promise<HREmployee[]> {
    const response = await api.get<Employee[]>(API_ENDPOINTS.HR_EMPLOYEES.GET_ALL, {
      params: { searchName: query, page: 1, pageSize: 20 },
    });
    const employees = response.data ?? [];
    return employees.map((e) => ({
      id: e.id,
      employeeNumber: e.employeeNumber,
      nameAr: e.nameAr,
      nameEn: e.nameEn,
      jobName: e.jobName,
      departmentId: e.departmentId,
      departmentName: e.departmentName,
      nationalityName: e.nationalityName,
      idNumber: e.idNumber,
      mobileNumber: e.mobileNumber,
      hiringDate: e.hiringDate,
    }));
  }
}

// ─────────────────────────────────────────────
// Department
// ─────────────────────────────────────────────

export class HRDepartmentService {
  static async create(data: CreateDepartmentDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_DEPARTMENT.CREATE, null, {
      params: { nameAr: data.nameAr, nameEn: data.nameEn },
    });
  }
}

// ─────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────

export class HRLookupService {
  static async getDepartments(): Promise<HRLookupItem[]> {
    const response = await api.get<HRLookupItem[]>(API_ENDPOINTS.HR_LOOKUPS.DEPARTMENTS);
    return response.data ?? [];
  }

  static async getSalaryScales(): Promise<HRLookupItem[]> {
    const response = await api.get<HRLookupItem[]>(API_ENDPOINTS.HR_LOOKUPS.SALARY_SCALES);
    return response.data ?? [];
  }

  static async getCustodyTypes(): Promise<HRLookupItem[]> {
    const response = await api.get<HRLookupItem[]>(API_ENDPOINTS.HR_LOOKUPS.CUSTODY_TYPES);
    return response.data ?? [];
  }
}

// ─────────────────────────────────────────────
// Vacation Request
// ─────────────────────────────────────────────

export class HRVacationService {
  static async getById(id: string): Promise<VacationRequest | undefined> {
    const response = await api.get<VacationRequest>(API_ENDPOINTS.HR_VACATION.GET_BY_ID(id));
    return response.data;
  }

  static async create(data: CreateVacationRequestDto): Promise<VacationRequest> {
    const formData = new FormData();
    formData.append('CreatedTo', data.createdTo);
    formData.append('VacationType', String(data.vacationType));
    formData.append('VacationDays', String(data.vacationDays));
    formData.append('VacationDate', data.vacationDate);
    formData.append('FinalizeDate', data.finalizeDate);
    if (data.substituteId) formData.append('SubstituteId', data.substituteId);
    if (data.mobileNumber) formData.append('MobileNumber', data.mobileNumber);
    formData.append('Reasons', data.reasons);
    if (data.attachmentFile) formData.append('AttachmentFile', data.attachmentFile);
    const response = await api.post<VacationRequest>(API_ENDPOINTS.HR_VACATION.CREATE, formData);
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_VACATION.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_VACATION.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Permission Request
// ─────────────────────────────────────────────

export class HRPermissionService {
  static async getAll(): Promise<PermissionRequest[]> {
    const response = await api.get<PermissionRequest[]>(API_ENDPOINTS.HR_PERMISSION.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreatePermissionRequestDto): Promise<PermissionRequest> {
    const response = await api.post<PermissionRequest>(API_ENDPOINTS.HR_PERMISSION.CREATE, data);
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_PERMISSION.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Custody Request
// ─────────────────────────────────────────────

export class HRCustodyService {
  static async getAll(): Promise<CustodyRequest[]> {
    const response = await api.get<CustodyRequest[]>(API_ENDPOINTS.HR_CUSTODY.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreateCustodyRequestDto): Promise<CustodyRequest> {
    const response = await api.post<CustodyRequest>(API_ENDPOINTS.HR_CUSTODY.CREATE, data);
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_CUSTODY.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_CUSTODY.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Job Modification Request
// ─────────────────────────────────────────────

export class HRJobModificationService {
  static async getAll(): Promise<JobModificationRequest[]> {
    const response = await api.get<JobModificationRequest[]>(API_ENDPOINTS.HR_JOB_MODIFICATION.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreateJobModificationRequestDto): Promise<JobModificationRequest> {
    const response = await api.post<JobModificationRequest>(
      API_ENDPOINTS.HR_JOB_MODIFICATION.CREATE,
      data
    );
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_JOB_MODIFICATION.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_JOB_MODIFICATION.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Resignation Request
// ─────────────────────────────────────────────

export class HRResignationService {
  static async getAll(): Promise<ResignationRequest[]> {
    const response = await api.get<ResignationRequest[]>(API_ENDPOINTS.HR_RESIGNATION.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreateResignationRequestDto): Promise<ResignationRequest> {
    const response = await api.post<ResignationRequest>(API_ENDPOINTS.HR_RESIGNATION.CREATE, data);
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_RESIGNATION.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_RESIGNATION.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Entitlements Request
// ─────────────────────────────────────────────

export class HREntitlementsService {
  static async getAll(): Promise<EntitlementsRequest[]> {
    const response = await api.get<EntitlementsRequest[]>(API_ENDPOINTS.HR_ENTITLEMENTS.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreateEntitlementsRequestDto): Promise<EntitlementsRequest> {
    const response = await api.post<EntitlementsRequest>(
      API_ENDPOINTS.HR_ENTITLEMENTS.CREATE,
      data
    );
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ENTITLEMENTS.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_ENTITLEMENTS.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Loans Request
// ─────────────────────────────────────────────

export class HRLoansService {
  static async getAll(): Promise<LoanRequest[]> {
    const response = await api.get<LoanRequest[]>(API_ENDPOINTS.HR_LOANS.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreateLoanRequestDto): Promise<LoanRequest> {
    const response = await api.post<LoanRequest>(API_ENDPOINTS.HR_LOANS.CREATE, data);
    return response.data;
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_LOANS.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.post(API_ENDPOINTS.HR_LOANS.REJECT(id), data);
  }
}

// ─────────────────────────────────────────────
// Requests Inbox / Outbox
// ─────────────────────────────────────────────

export class HRRequestsInboxService {
  static async getAll(filter?: HRRequestsFilterDto): Promise<HRRequestSummary[]> {
    const response = await api.post<HRRequestSummary[]>(
      API_ENDPOINTS.HR_REQUESTS_INBOX.FILTER,
      filter ?? {}
    );
    return response.data ?? [];
  }
}

export class HRRequestsOutboxService {
  static async getAll(filter?: HRRequestsFilterDto): Promise<HRRequestSummary[]> {
    const response = await api.post<HRRequestSummary[]>(
      API_ENDPOINTS.HR_REQUESTS_OUTBOX.FILTER,
      filter ?? {}
    );
    return response.data ?? [];
  }
}

// ─────────────────────────────────────────────
// Employee Commission
// ─────────────────────────────────────────────

export class HRCommissionService {
  static async getAll(filter?: CommissionFilterDto): Promise<EmployeeCommission[]> {
    const response = await api.get<EmployeeCommission[]>(API_ENDPOINTS.HR_COMMISSION.GET_ALL, {
      params: {
        empId: filter?.empId,
        comDate: filter?.comDate,
        comDateTo: filter?.comDateTo,
      },
    });
    return response.data ?? [];
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
    const response = await api.get<CommissionSlice[]>(API_ENDPOINTS.HR_COMMISSION_SLICES.GET_ALL);
    return response.data ?? [];
  }

  static async create(data: CreateCommissionSliceDto): Promise<CommissionSlice> {
    const response = await api.post<CommissionSlice>(
      API_ENDPOINTS.HR_COMMISSION_SLICES.CREATE,
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
    const response = await api.post<AttendanceRecord[]>(
      API_ENDPOINTS.HR_ATTENDANCE.FILTER,
      filter ?? {}
    );
    return response.data ?? [];
  }
}

// ─────────────────────────────────────────────
// Leave Balance
// ─────────────────────────────────────────────

export class HRLeaveBalanceService {
  static async getAll(filter?: LeaveBalanceFilterDto): Promise<LeaveBalance[]> {
    const response = await api.post<LeaveBalance[]>(
      API_ENDPOINTS.HR_LEAVE_BALANCE.FILTER,
      filter ?? {}
    );
    return response.data ?? [];
  }
}

// ─────────────────────────────────────────────
// HR Complaints
// ─────────────────────────────────────────────

export class HRComplaintService {
  static async create(data: CreateHRComplaintDto): Promise<HRComplaint> {
    const response = await api.post<HRComplaint>(API_ENDPOINTS.HR_COMPLAINTS.CREATE, data);
    return response.data;
  }

  static async reply(data: ReplyHRComplaintDto): Promise<HRComplaint> {
    const response = await api.post<HRComplaint>(API_ENDPOINTS.HR_COMPLAINTS.REPLY, data);
    return response.data;
  }

  static async close(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HR_COMPLAINTS.CLOSE(id), {});
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HR_COMPLAINTS.DELETE(id));
  }
}
