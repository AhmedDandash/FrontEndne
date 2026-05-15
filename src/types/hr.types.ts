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
  jobName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  nationalityId?: string | null;
  nationalityName?: string | null;
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
  status?: AttendanceStatus | null;
}

export interface AttendanceRecord {
  id?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  date?: string | null;
  lateMinutes?: number | null;
  overtimeMinutes?: number | null;
  status?: AttendanceStatus | null;
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
