// ==================== Admin / Position Types ====================
// Position = Job = JobId = JobName — unified business concept per spec

export interface EmployeePosition {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface EmployeePositionCreateDto {
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface AddUserDto {
  fullName: string;
  userName?: string | null;
  email?: string | null;
  password?: string | null;
  role: string;
}

export interface AssignRoleDto {
  userId: string;
  role: string;
}

export interface AdminUser {
  id: string;
  // Backend returns `fullName` (not `userName`); keep userName optional for
  // backward-compatibility with any callers that still reference it.
  fullName?: string | null;
  userName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  roles?: string[] | null;
}

export interface AdminRole {
  id: string;
  name?: string | null;
}

// ==================== Department Types ====================

export interface Department {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface CreateDepartmentDto {
  nameAr?: string | null;
  nameEn?: string | null;
}

// ==================== Employee Types ====================

export interface EmployeeDto {
  id: string;
  employeeNumber?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  email?: string | null;
  idNumber?: string | null;
  mobileNumber?: string | null;
  jobId?: string | null;
  jobNameAr?: string | null;
  jobNameEn?: string | null;
  departmentId?: string | null;
  departmentNameAr?: string | null;
  departmentNameEn?: string | null;
  branchId?: string | number | null;
  branchName?: string | null;
  nationalityId?: string | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  hiringDate?: string | null;
  isActive?: boolean;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  iban?: string | null;
  userName?: string | null;
}

export interface EmployeeCurrentDto extends EmployeeDto {
  basicSalary?: number | null;
  housingAllowance?: number | null;
  mobilityAllowance?: number | null;
  otherAllowances?: number | null;
  totalSalary?: number | null;
}

export interface CreateEmployeeDto {
  employeeNumber?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  email: string;
  idNumber?: string | null;
  mobileNumber?: string | null;
  jobId?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
  nationalityId?: string | null;
  hiringDate?: string | null;
  basicSalary?: number | null;
  housingAllowance?: number | null;
  mobilityAllowance?: number | null;
  otherAllowances?: number | null;
  isActive?: boolean;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  iban?: string | null;
  userName?: string | null;
}

export interface UpdateEmployeeDto {
  // The backend requires `userName` on update (returns 400
  // "The UserName field is required." if omitted) — verified live.
  userName: string;
  employeeNumber?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  idNumber?: string | null;
  mobileNumber?: string | null;
  jobId?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
  nationalityId?: string | null;
  hiringDate?: string | null;
  basicSalary?: number | null;
  housingAllowance?: number | null;
  mobilityAllowance?: number | null;
  otherAllowances?: number | null;
  isActive?: boolean;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  iban?: string | null;
}

export interface EmployeePagedResponse {
  items: EmployeeDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type EmployeeStringMatchMode = 0 | 1 | 2 | 3;

export interface EmployeeListQuery {
  SearchName?: string;
  Page?: number;
  PageNumber?: number;
  PageSize?: number;
  Id?: string;
  EmployeeNumber?: string;
  EmployeeNumberMatch?: EmployeeStringMatchMode;
  NameAr?: string;
  NameArMatch?: EmployeeStringMatchMode;
  NameEn?: string;
  NameEnMatch?: EmployeeStringMatchMode;
  Email?: string;
  EmailMatch?: EmployeeStringMatchMode;
  IdNumber?: string;
  IdNumberMatch?: EmployeeStringMatchMode;
  MobileNumber?: string;
  MobileNumberMatch?: EmployeeStringMatchMode;
  UserName?: string;
  UserNameMatch?: EmployeeStringMatchMode;
  UserId?: string;
  UserIdMatch?: EmployeeStringMatchMode;
  DepartmentId?: string;
  EmployeePositionId?: string;
  NationalityId?: string;
  HiringDateFrom?: string;
  HiringDateTo?: string;
  BasicSalaryMin?: number;
  BasicSalaryMax?: number;
  IsActive?: boolean;
  BankName?: string;
  BankNameMatch?: EmployeeStringMatchMode;
  BankAccountNumber?: string;
  BankAccountNumberMatch?: EmployeeStringMatchMode;
  IBAN?: string;
  IBANMatch?: EmployeeStringMatchMode;
  BranchId?: string;
  IncludeSubBranches?: boolean;
  Search?: string;
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  UpdatedDateFrom?: string;
  UpdatedDateTo?: string;
  SortBy?: string;
  SortDescending?: boolean;

  // Backward-compatible aliases used by existing employee lookup callers.
  searchName?: string;
  page?: number;
  pageSize?: number;
  employeePositionId?: string;
  hiringDateFrom?: string;
  hiringDateTo?: string;
  basicSalaryMin?: number;
  basicSalaryMax?: number;
  iban?: string;
}

// ==================== Attendance Types ====================

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | string;

export interface AttendanceFilterDto {
  employeeId?: string | null;
  // Backend-supported filter fields (verified live via FilterAttendanceDto).
  attendanceDay?: string | null;
  month?: number | null;
  year?: number | null;
  // NOTE: the backend does NOT support filtering by date-range or status —
  // these are applied client-side on top of the server-filtered result set.
  fromDate?: string | null;
  toDate?: string | null;
  status?: AttendanceStatus | number | null;
}

/** Body required by CheckIn / CheckOut (geofencing). */
export interface AttendanceLocationDto {
  latitude: number;
  longitude: number;
}

export type AttendanceStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | number;

export interface AttendanceRecord {
  id?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  attendanceDay?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  lateMinutes?: number | null;
  overtimeMinutes?: number | null;
  status?: AttendanceStatusCode | null;
  // ── Geolocation audit fields ──
  employeeLatitude?: number | null;
  employeeLongitude?: number | null;
  distanceFromBranchMeters?: number | null;
  checkOutEmployeeLatitude?: number | null;
  checkOutEmployeeLongitude?: number | null;
  checkOutDistanceFromBranchMeters?: number | null;
}

// ==================== Leave Types ====================

// Backend returns leave status as a NUMERIC enum (verified live):
//   0 = Pending, 1 = Approved, 2 = Rejected, 3 = Cancelled
// NOTE: this is 0-based, unlike Permission/Resignation/Custody which are 1-based.
export const LeaveStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
  Cancelled: 3,
} as const;

export type LeaveRequestStatus = number;

export interface CreateLeaveRequestDto {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  // Backend requires `reason` (verified live — returns 400 if missing).
  reason: string;
}

export interface ApproveLeaveDto {
  approvalComment?: string | null;
}

export interface RejectLeaveDto {
  approvalComment?: string | null;
}

export interface LeaveRequestDto {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  leaveTypeId?: string | null;
  leaveTypeName?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  daysCount?: number | null;
  reason?: string | null;
  status?: LeaveRequestStatus | null;
  approvedAt?: string | null;
  approvalComment?: string | null;
}

// ==================== Leave Type Types ====================

export interface LeaveTypeDto {
  id: string;
  name: string;
  defaultDaysPerYear: number;
  isActive: boolean;
  allowCarryForward: boolean;
  isPaid: boolean;
}

export interface CreateLeaveTypeDto {
  name: string;
  defaultDaysPerYear: number;
  isActive: boolean;
  allowCarryForward: boolean;
  isPaid: boolean;
}

export interface UpdateLeaveTypeDto {
  name: string;
  defaultDaysPerYear: number;
  isActive: boolean;
  allowCarryForward: boolean;
  isPaid: boolean;
}

// ==================== Employee Leave Balance Types ====================

export interface EmployeeLeaveBalanceDto {
  leaveTypeId?: string | null;
  leaveTypeName?: string | null;
  totalBalance?: number | null;
  usedBalance?: number | null;
  remainingBalance?: number | null;
}

// ==================== Requests Inbox / Outbox Types ====================
// Plumbing only — verified live via swagger (FilterInboxDto is reused as the
// body for BOTH /api/V1/RequestsInbox/Filter and /api/HR/RequestsOutbox/Filter).
// No inbox/outbox UI feature exists in the HR module yet; these types + the
// corresponding service methods (HRRequestsInboxService / HRRequestsOutboxService
// in hr.service.ts) only make the endpoints reachable. Building the actual
// inbox/outbox screens is out of scope for this pass.

// HRProcessState is a numeric enum (values 1-8); the spec does not surface
// string labels for it, so it's kept as an opaque number until product defines
// the mapping.
export type HRProcessState = number;

export interface FilterInboxDto {
  processState?: HRProcessState | null;
  processGroups?: number[] | null;
  processResults?: number[] | null;
  startsDate?: string | null;
  endingDate?: string | null;
}

/** Same shape as FilterInboxDto — the backend reuses one schema for both endpoints. */
export type FilterOutboxDto = FilterInboxDto;

// ==================== Request Status (shared) ====================

// Permission / Resignation / Custody requests share ONE status enum, verified
// live 2026-07-06: a freshly-created request is status 3 (Pending); approving
// moves it to 1 (Approved); rejecting to 2. This is DIFFERENT from LeaveStatus
// (which is 0-based). Earlier code assumed 1=Pending/2=Approved/3=Rejected — the
// inverse — which broke the counts, labels and approve/reject gating.
export const RequestStatus = {
  Approved: 1,
  Rejected: 2,
  Pending: 3,
} as const;

// ==================== Permission Request Types ====================

export type PermissionType = 1 | 2 | 3; // 1=ComeLate, 2=PartTime, 3=OutEarly
export type PermissionNature = 1 | 2;   // 1=Official, 2=Personal

export interface CreatePermissionRequestDto {
  createdTo: string;
  permissionDate: string;
  permissionType: PermissionType;
  permissionNature: PermissionNature;
  comeLateTime?: string | null;
  partTimeStart?: string | null;
  partTimeFinish?: string | null;
  outEarlyTime?: string | null;
  reasons: string;
}

// status: 1=Approved, 2=Rejected, 3=Pending (see RequestStatus)
export interface PermissionRequestDto {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  permissionDate?: string | null;
  permissionType?: number | null;   // 1=ComeLate, 2=PartTime, 3=OutEarly
  permissionNature?: number | null; // 1=Official, 2=Personal
  comeLateTime?: string | null;
  partTimeStart?: string | null;
  partTimeFinish?: string | null;
  outEarlyTime?: string | null;
  reasons?: string | null;
  status?: number | null;
}

// ==================== Resignation Request Types ====================

export interface CreateResignationRequestDto {
  createdTo: string;
  resignationDate: string;
  endDate: string;
  reasons: string;
}

// status: 1=Approved, 2=Rejected, 3=Pending (see RequestStatus)
export interface ResignationRequestDto {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  resignationDate?: string | null;
  endDate?: string | null;
  reasons?: string | null;
  status?: number | null;
}

// ==================== Custody Request Types ====================

export interface CustodyTypeDto {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface CreateCustodyTypeDto {
  nameAr: string;
  nameEn: string;
}

export interface CustodyItemDto {
  custodyTypeId: string;
  quantity: number;
  deliveryDate: string;
  temporal: boolean;
  shortNote?: string | null;
}

export interface CreateCustodyRequestDto {
  createdTo: string;
  details: string;
  reasons: string;
  custodyItems: CustodyItemDto[];
}

// status: 1=Approved, 2=Rejected, 3=Pending (see RequestStatus)
export type CustodyRequestStatus = 1 | 2 | 3 | number;

export interface CustodyRequestItemDto {
  id?: string | null;
  custodyTypeId?: string | null;
  custodyTypeName?: string | null;
  quantity?: number | null;
  deliveryDate?: string | null;
  temporal?: boolean | null;
  shortNote?: string | null;
}

export interface CustodyRequestDto {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  details?: string | null;
  reasons?: string | null;
  status?: CustodyRequestStatus | null;
  createdAt?: string | null;
  items?: CustodyRequestItemDto[] | null;
}

// ==================== Payroll Types ====================

export interface GeneratePayrollDto {
  month: number;
  year: number;
}

export interface PayrollEmployeeDto {
  // Payroll-run row id (distinct from `employeeId`) — verified live.
  id?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  baseSalary?: number | null;
  overtimeAmount?: number | null;
  lateDeduction?: number | null;
  absenceDeduction?: number | null;
  leaveDeduction?: number | null;
  bonus?: number | null;
  additionalDeduction?: number | null;
  loanDeduction?: number | null;
  paidAmount?: number | null;
  netSalary?: number | null;
  remainingAmount?: number | null;
}

// Payroll-run lifecycle. Verified live: a freshly generated run is status 0 and
// must be Approved before it can be Closed.
export const PayrollStatus = {
  Draft: 0,
  Approved: 1,
  Closed: 2,
} as const;

export interface PayrollRunDto {
  id: string;
  month?: number | null;
  year?: number | null;
  status?: number | null;
  totalNetAmount?: number | null;
  totalPaidAmount?: number | null;
  remainingAmount?: number | null;
  isClosed?: boolean | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  // Accounting integration links (populated once the run is approved/posted).
  journalEntryId?: string | null;
  accountingDocumentId?: string | null;
  createdAt?: string | null;
  employees?: PayrollEmployeeDto[];
  // Returned by the backend but structure not yet exercised by the UI.
  workers?: unknown[];
  payments?: unknown[];
  approvals?: unknown[];
}
