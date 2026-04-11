/**
 * HR Module – Mock Data
 * ─────────────────────────────────────────────
 * IMPORTANT: Maximum 3 records per dataset.
 * All mock data is schema-aligned with hr.types.ts.
 * Replace by removing the MOCK_* usage and wiring the real API service.
 *
 * Usage:
 *   import { MOCK_EMPLOYEES } from '@/features/hr/mock/hr.mock';
 *   // When API is ready, delete the import and use the service hook instead.
 */

import type {
  HREmployee,
  VacationRequest,
  PermissionRequest,
 
  HRRequestSummary,
  Employee,
  EmployeeCommission,
  CommissionSlice,
  AttendanceRecord,
  LeaveBalance,
  HRComplaint,
  HRLookupItem,
} from '@/types/hr.types';

// ─────────────────────────────────────────────
// Lookup: Employees (for employee select dropdowns)
// ─────────────────────────────────────────────
export const MOCK_HR_EMPLOYEES: HREmployee[] = [
  {
    id: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeNumber: 'EMP-001',
    nameAr: 'أحمد محمد علي',
    nameEn: 'Ahmed Mohamed Ali',
    jobName: 'مهندس برمجيات',
    departmentId: 68,
    departmentName: 'تقنية المعلومات',
    nationalityName: 'سعودي',
    idNumber: '1012345678',
    mobileNumber: '0501234567',
    hiringDate: '2020-01-15',
    basicSalary: 8000,
    housingAllowance: 2000,
    mobilityAllowance: 500,
    otherAllowances: 300,
    totalSalary: 10800,
  },
  {
    id: '8b2e4a1c-3d7f-4e9a-b6c2-52d4e8f1a023',
    employeeNumber: 'EMP-002',
    nameAr: 'سارة عبدالله الحربي',
    nameEn: 'Sara Abdullah Al-Harbi',
    jobName: 'محاسبة',
    departmentId: 73,
    departmentName: 'المالية',
    nationalityName: 'سعودية',
    idNumber: '1087654321',
    mobileNumber: '0559876543',
    hiringDate: '2019-06-01',
    basicSalary: 7000,
    housingAllowance: 1800,
    mobilityAllowance: 400,
    otherAllowances: 200,
    totalSalary: 9400,
  },
  {
    id: 'c4f7d2b8-9e1a-4c3f-8d5b-71e3a9c2d047',
    employeeNumber: 'EMP-003',
    nameAr: 'خالد سعد المطيري',
    nameEn: 'Khalid Saad Al-Mutairi',
    jobName: 'مدير مشروع',
    departmentId: 74,
    departmentName: 'العمليات',
    nationalityName: 'سعودي',
    idNumber: '1056789012',
    mobileNumber: '0531234567',
    hiringDate: '2018-03-20',
    basicSalary: 12000,
    housingAllowance: 3000,
    mobilityAllowance: 700,
    otherAllowances: 500,
    totalSalary: 16200,
  },
];

// ─────────────────────────────────────────────
// Lookup: Departments
// ─────────────────────────────────────────────
export const MOCK_DEPARTMENTS: HRLookupItem[] = [
  { id: 68, nameAr: 'تقنية المعلومات', nameEn: 'Information Technology' },
  { id: 73, nameAr: 'المالية', nameEn: 'Finance' },
  { id: 74, nameAr: 'العمليات', nameEn: 'Operations' },
];

// ─────────────────────────────────────────────
// Lookup: Salary Scales
// ─────────────────────────────────────────────
export const MOCK_SALARY_SCALES: HRLookupItem[] = [
  { id: 1, nameAr: 'الفئة الأولى', nameEn: 'Grade 1' },
  { id: 2, nameAr: 'الفئة الثانية', nameEn: 'Grade 2' },
  { id: 3, nameAr: 'الفئة الثالثة', nameEn: 'Grade 3' },
];

// ─────────────────────────────────────────────
// Lookup: Custody Types
// ─────────────────────────────────────────────
export const MOCK_CUSTODY_TYPES: HRLookupItem[] = [
  { id: 13, nameAr: 'حاسوب محمول', nameEn: 'Laptop' },
  { id: 14, nameAr: 'هاتف جوال', nameEn: 'Mobile Phone' },
  { id: 24, nameAr: 'سيارة', nameEn: 'Vehicle' },
];

// ─────────────────────────────────────────────
// Vacation Requests
// ─────────────────────────────────────────────
export const MOCK_VACATION_REQUESTS: VacationRequest[] = [
  {
    id: 1,
    createdTo: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeName: 'أحمد محمد علي',
    employeeNumber: 'EMP-001',
    departmentName: 'تقنية المعلومات',
    jobName: 'مهندس برمجيات',
    screenId: 'VacationRequest',
    result: 1,
    processState: 1,
    vacationType: 81,
    vacationDays: 7,
    vacationDate: '2026-04-15',
    finalizeDate: '2026-04-22',
    comeBackDate: '2026-04-23',
    reasons: 'إجازة سنوية مستحقة',
    createdAt: '2026-04-01T10:00:00Z',
    minRange: 0,
    maxRange: 30,
    exhausted: 5,
    available: 25,
  },
];

// ─────────────────────────────────────────────
// Permission Requests
// ─────────────────────────────────────────────
export const MOCK_PERMISSION_REQUESTS: PermissionRequest[] = [
  {
    id: 2,
    createdTo: '8b2e4a1c-3d7f-4e9a-b6c2-52d4e8f1a023',
    employeeName: 'سارة عبدالله الحربي',
    employeeNumber: 'EMP-002',
    departmentName: 'المالية',
    jobName: 'محاسبة',
    screenId: 'RequestPermission',
    result: 3,
    processState: 2,
    permissionDate: '2026-04-12',
    permissionType: 1,
    permissionNature: 2,
    comeLateTime: '09:30',
    reasons: 'موعد طبي طارئ',
    createdAt: '2026-04-10T08:30:00Z',
  },
];

// ─────────────────────────────────────────────
// Inbox / Outbox Request Summaries
// ─────────────────────────────────────────────
export const MOCK_INBOX_REQUESTS: HRRequestSummary[] = [
  {
    id: 1,
    screenId: 'VacationRequest',
    processState: 1,
    processGroup: 1,
    result: 3,
    employeeName: 'أحمد محمد علي',
    employeeNumber: 'EMP-001',
    departmentName: 'تقنية المعلومات',
    createdAt: '2026-04-01T10:00:00Z',
    assigneeEmpName: 'مدير الموارد البشرية',
  },
  {
    id: 2,
    screenId: 'RequestPermission',
    processState: 2,
    processGroup: 2,
    result: 3,
    employeeName: 'سارة عبدالله الحربي',
    employeeNumber: 'EMP-002',
    departmentName: 'المالية',
    createdAt: '2026-04-10T08:30:00Z',
  },
  {
    id: 3,
    screenId: 'LoanRequest',
    processState: 8,
    processGroup: 8,
    result: 1,
    employeeName: 'خالد سعد المطيري',
    employeeNumber: 'EMP-003',
    departmentName: 'العمليات',
    createdAt: '2026-03-20T09:00:00Z',
    assigneeEmpName: 'مدير الموارد البشرية',
  },
];

export const MOCK_OUTBOX_REQUESTS: HRRequestSummary[] = [
  {
    id: 4,
    screenId: 'RequestJobModify',
    processState: 5,
    processGroup: 5,
    result: 2,
    employeeName: 'أحمد محمد علي',
    employeeNumber: 'EMP-001',
    departmentName: 'تقنية المعلومات',
    createdAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 5,
    screenId: 'RequestResignation',
    processState: 6,
    processGroup: 6,
    result: 0,
    employeeName: 'سارة عبدالله الحربي',
    employeeNumber: 'EMP-002',
    departmentName: 'المالية',
    createdAt: '2026-04-05T14:00:00Z',
  },
];

// ─────────────────────────────────────────────
// Employees (Management)
// ─────────────────────────────────────────────
export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeNumber: 'EMP-001',
    nameAr: 'أحمد محمد علي',
    nameEn: 'Ahmed Mohamed Ali',
    email: 'ahmed@company.com',
    loginName: 'ahmed.ali',
    jobId: 1,
    jobName: 'مهندس برمجيات',
    departmentId: 68,
    departmentName: 'تقنية المعلومات',
    nationalityId: 1,
    nationalityName: 'سعودي',
    idNumber: '1012345678',
    mobileNumber: '0501234567',
    hiringDate: '2020-01-15',
    isActive: true,
  },
  {
    id: '8b2e4a1c-3d7f-4e9a-b6c2-52d4e8f1a023',
    employeeNumber: 'EMP-002',
    nameAr: 'سارة عبدالله الحربي',
    nameEn: 'Sara Abdullah Al-Harbi',
    email: 'sara@company.com',
    loginName: 'sara.harbi',
    jobId: 2,
    jobName: 'محاسبة',
    departmentId: 73,
    departmentName: 'المالية',
    nationalityId: 1,
    nationalityName: 'سعودية',
    idNumber: '1087654321',
    mobileNumber: '0559876543',
    hiringDate: '2019-06-01',
    isActive: true,
  },
  {
    id: 'c4f7d2b8-9e1a-4c3f-8d5b-71e3a9c2d047',
    employeeNumber: 'EMP-003',
    nameAr: 'خالد سعد المطيري',
    nameEn: 'Khalid Saad Al-Mutairi',
    email: 'khalid@company.com',
    loginName: 'khalid.mutairi',
    jobId: 3,
    jobName: 'مدير مشروع',
    departmentId: 74,
    departmentName: 'العمليات',
    nationalityId: 1,
    nationalityName: 'سعودي',
    idNumber: '1056789012',
    mobileNumber: '0531234567',
    hiringDate: '2018-03-20',
    isActive: true,
  },
];

// ─────────────────────────────────────────────
// Employee Commissions
// ─────────────────────────────────────────────
export const MOCK_COMMISSIONS: EmployeeCommission[] = [
  {
    id: 1,
    empId: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeName: 'أحمد محمد علي',
    comDate: '2026-03-01',
    comDateTo: '2026-03-31',
    typeId: 1,
    typeName: 'مكافأة',
    amount: 2000,
    isTaxable: false,
    bankFees: 10,
    bankFeesTax: 1.5,
    taxValue: 0,
    accountId: 101,
  },
  {
    id: 2,
    empId: '8b2e4a1c-3d7f-4e9a-b6c2-52d4e8f1a023',
    employeeName: 'سارة عبدالله الحربي',
    comDate: '2026-03-01',
    comDateTo: '2026-03-31',
    typeId: 2,
    typeName: 'عمولة مبيعات',
    amount: 1500,
    isTaxable: true,
    bankFees: 8,
    bankFeesTax: 1.2,
    taxValue: 225,
    accountId: 102,
  },
];

// ─────────────────────────────────────────────
// Commission Slices
// ─────────────────────────────────────────────
export const MOCK_COMMISSION_SLICES: CommissionSlice[] = [
  {
    id: 1,
    commissionName: 'شريحة المبيعات الأولى',
    commissionTypeId: 2,
    commissionTypeName: 'عمولة مبيعات',
    commissionId: 101,
    amount: 500,
    isPercent: false,
    includeTax: false,
    withDetails: true,
  },
  {
    id: 2,
    commissionName: 'شريحة المكافآت',
    commissionTypeId: 1,
    commissionTypeName: 'مكافأة',
    commissionId: 102,
    amount: 5,
    isPercent: true,
    includeTax: true,
    withDetails: false,
  },
];

// ─────────────────────────────────────────────
// Attendance Records
// ─────────────────────────────────────────────
export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 1,
    employeeId: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeName: 'أحمد محمد علي',
    employeeNumber: 'EMP-001',
    attendanceDay: '2026-04-09',
    checkInTime: '08:02',
    checkOutTime: '17:05',
    status: 1,
  },
  {
    id: 2,
    employeeId: '8b2e4a1c-3d7f-4e9a-b6c2-52d4e8f1a023',
    employeeName: 'سارة عبدالله الحربي',
    employeeNumber: 'EMP-002',
    attendanceDay: '2026-04-09',
    checkInTime: '09:35',
    checkOutTime: '17:00',
    status: 3,
  },
  {
    id: 3,
    employeeId: 'c4f7d2b8-9e1a-4c3f-8d5b-71e3a9c2d047',
    employeeName: 'خالد سعد المطيري',
    employeeNumber: 'EMP-003',
    attendanceDay: '2026-04-09',
    checkInTime: undefined,
    checkOutTime: undefined,
    status: 2,
  },
];

// ─────────────────────────────────────────────
// Leave Balances
// ─────────────────────────────────────────────
export const MOCK_LEAVE_BALANCES: LeaveBalance[] = [
  {
    employeeId: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeName: 'أحمد محمد علي',
    year: 2026,
    annualBalance: 30,
    usedBalance: 7,
    remainingBalance: 23,
    sickBalance: 15,
    usedSickBalance: 0,
    remainingSickBalance: 15,
  },
  {
    employeeId: '8b2e4a1c-3d7f-4e9a-b6c2-52d4e8f1a023',
    employeeName: 'سارة عبدالله الحربي',
    year: 2026,
    annualBalance: 30,
    usedBalance: 12,
    remainingBalance: 18,
    sickBalance: 15,
    usedSickBalance: 3,
    remainingSickBalance: 12,
  },
];

// ─────────────────────────────────────────────
// HR Complaints
// ─────────────────────────────────────────────
export const MOCK_HR_COMPLAINTS: HRComplaint[] = [
  {
    id: 1,
    employeeId: '2fd5f065-ee5c-4fc7-9527-41b3ba9fa014',
    employeeName: 'أحمد محمد علي',
    employeeNumber: 'EMP-001',
    complaintId: 101,
    complaintNotes: 'تأخر صرف الراتب لشهر مارس',
    replyNotes: 'سيتم المعالجة خلال 3 أيام عمل',
    sendTheComplaintTo: 'مدير الموارد البشرية',
    sendReplyTo: 'أحمد محمد علي',
    status: 2,
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-04-03T11:00:00Z',
  },
  {
    id: 2,
    employeeId: 'c4f7d2b8-9e1a-4c3f-8d5b-71e3a9c2d047',
    employeeName: 'خالد سعد المطيري',
    employeeNumber: 'EMP-003',
    complaintId: 102,
    complaintNotes: 'عدم احتساب البدلات بشكل صحيح',
    sendTheComplaintTo: 'قسم المالية',
    status: 1,
    createdAt: '2026-04-08T10:30:00Z',
  },
];
