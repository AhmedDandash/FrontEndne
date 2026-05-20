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
  userName?: string | null;
  email?: string | null;
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

// ==================== Attendance Types ====================

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | string;

export interface AttendanceFilterDto {
  employeeId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  status?: AttendanceStatus | number | null;
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
}

// ==================== Leave Types ====================

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | string;

export interface CreateLeaveRequestDto {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  reason?: string | null;
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

// ==================== Resignation Request Types ====================

export interface CreateResignationRequestDto {
  createdTo: string;
  resignationDate: string;
  endDate: string;
  reasons: string;
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

// status: 1=Pending, 2=Approved, 3=Rejected
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
  employeeId?: string | null;
  employeeName?: string | null;
  baseSalary?: number | null;
  overtimeAmount?: number | null;
  lateDeduction?: number | null;
  absenceDeduction?: number | null;
  leaveDeduction?: number | null;
  bonus?: number | null;
  additionalDeduction?: number | null;
  netSalary?: number | null;
}

export interface PayrollRunDto {
  id: string;
  month?: number | null;
  year?: number | null;
  isClosed?: boolean | null;
  createdAt?: string | null;
  employees?: PayrollEmployeeDto[];
}
