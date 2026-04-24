/**
 * HR Module – React Query Hooks
 * Each hook wraps the corresponding HRService method.
 * Bilingual success/error messages.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';
import {
  HREmployeeService,
  HRDepartmentService,
  HRLookupService,
  HRVacationService,
  HRPermissionService,
  HRCustodyService,
  HRJobModificationService,
  HRResignationService,
  HREntitlementsService,
  HRLoansService,
  HRRequestsInboxService,
  HRRequestsOutboxService,
  HRCommissionService,
  HRCommissionSliceService,
  HRAttendanceService,
  HRLeaveBalanceService,
  HRComplaintService,
} from '@/services/hr.service';
import type {
  Employee,
  EmployeesFilterDto,
  CreateEmployeeDto,
  CreateDepartmentDto,
  RejectRequestDto,
  CreateVacationRequestDto,
  CreatePermissionRequestDto,
  CreateCustodyRequestDto,
  CreateJobModificationRequestDto,
  CreateResignationRequestDto,
  CreateEntitlementsRequestDto,
  CreateLoanRequestDto,
  HRRequestsFilterDto,
  CommissionFilterDto,
  CreateCommissionSliceDto,
  AttendanceFilterDto,
  LeaveBalanceFilterDto,
  CreateHRComplaintDto,
  ReplyHRComplaintDto,
} from '@/types/hr.types';

// ─────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────

export const useHREmployees = (filter?: EmployeesFilterDto) =>
  useQuery({
    queryKey: ['hr-employees', filter],
    queryFn: () => HREmployeeService.getAll(filter),
  });

export const useHREmployee = (id: string) =>
  useQuery({
    queryKey: ['hr-employee', id],
    queryFn: () => HREmployeeService.getById(id),
    enabled: !!id,
  });

export const useCurrentHREmployee = () => {
  const username = useAuthStore((s) => s.username);
  return useQuery({
    queryKey: ['hr-current-employee', username],
    queryFn: () => HREmployeeService.getCurrent(username),
    enabled: !!username,
  });
};

export const useHREmployeeSearch = (query: string) =>
  useQuery({
    queryKey: ['hr-employee-search', query],
    queryFn: () => HREmployeeService.search(query),
    enabled: query.length >= 2,
  });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation<Employee, Error, CreateEmployeeDto>({
    mutationFn: HREmployeeService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-employees'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      message.success('تم إضافة الموظف بنجاح / Employee created successfully');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الإضافة / Create failed'),
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation<Employee, Error, { id: string; data: CreateEmployeeDto }>({
    mutationFn: ({ id, data }) => HREmployeeService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-employees'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      message.success('تم تعديل الموظف بنجاح / Employee updated successfully');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل التعديل / Update failed'),
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HREmployeeService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-employees'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      message.success('تم حذف الموظف / Employee deleted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الحذف / Delete failed'),
  });
};

// ─────────────────────────────────────────────
// Department
// ─────────────────────────────────────────────

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, CreateDepartmentDto>({
    mutationFn: HRDepartmentService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-departments'] });
      message.success('تم إضافة القسم / Department created');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الإضافة / Create failed'),
  });
};

// ─────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────

export const useHRDepartments = () =>
  useQuery({ queryKey: ['hr-departments'], queryFn: HRLookupService.getDepartments });

export const useHRSalaryScales = () =>
  useQuery({ queryKey: ['hr-salary-scales'], queryFn: HRLookupService.getSalaryScales });

export const useHRCustodyTypes = () =>
  useQuery({ queryKey: ['hr-custody-types'], queryFn: HRLookupService.getCustodyTypes });

// ─────────────────────────────────────────────
// Vacation Request
// ─────────────────────────────────────────────

export const useVacationRequest = (id: string) =>
  useQuery({
    queryKey: ['hr-vacation-request', id],
    queryFn: () => HRVacationService.getById(id),
    enabled: !!id,
  });

export const useCreateVacationRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateVacationRequestDto>({
    mutationFn: HRVacationService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-vacation-requests'] });
      qc.invalidateQueries({ queryKey: ['hr-inbox'] });
      message.success('تم إرسال طلب الإجازة بنجاح / Vacation request submitted successfully');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApproveVacationRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRVacationService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-vacation-requests'] });
      qc.invalidateQueries({ queryKey: ['hr-inbox'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectVacationRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HRVacationService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-vacation-requests'] });
      qc.invalidateQueries({ queryKey: ['hr-inbox'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Permission Request
// ─────────────────────────────────────────────

export const usePermissionRequests = () =>
  useQuery({ queryKey: ['hr-permission-requests'], queryFn: HRPermissionService.getAll });

export const useCreatePermissionRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreatePermissionRequestDto>({
    mutationFn: HRPermissionService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-permission-requests'] });
      message.success('تم إرسال طلب الإذن بنجاح / Permission request submitted successfully');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApprovePermissionRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRPermissionService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-permission-requests'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectPermissionRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HRPermissionService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-permission-requests'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Custody Request
// ─────────────────────────────────────────────

export const useCreateCustodyRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateCustodyRequestDto>({
    mutationFn: HRCustodyService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-custody-requests'] });
      message.success('تم إرسال طلب العهدة بنجاح / Custody request submitted successfully');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApproveCustodyRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRCustodyService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-custody-requests'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectCustodyRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HRCustodyService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-custody-requests'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Job Modification Request
// ─────────────────────────────────────────────

export const useCreateJobModificationRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateJobModificationRequestDto>({
    mutationFn: HRJobModificationService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-job-modification-requests'] });
      message.success('تم إرسال طلب التعديل الوظيفي / Job modification request submitted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApproveJobModificationRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRJobModificationService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-job-modification-requests'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectJobModificationRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HRJobModificationService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-job-modification-requests'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Resignation Request
// ─────────────────────────────────────────────

export const useCreateResignationRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateResignationRequestDto>({
    mutationFn: HRResignationService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-resignation-requests'] });
      message.success('تم إرسال طلب الاستقالة / Resignation request submitted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApproveResignationRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRResignationService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-resignation-requests'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectResignationRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HRResignationService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-resignation-requests'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Entitlements Request
// ─────────────────────────────────────────────

export const useCreateEntitlementsRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateEntitlementsRequestDto>({
    mutationFn: HREntitlementsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-entitlements-requests'] });
      message.success('تم إرسال طلب المستحقات / Entitlements request submitted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApproveEntitlementsRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HREntitlementsService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-entitlements-requests'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectEntitlementsRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HREntitlementsService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-entitlements-requests'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Loans Request
// ─────────────────────────────────────────────

export const useCreateLoanRequest = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateLoanRequestDto>({
    mutationFn: HRLoansService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-loan-requests'] });
      message.success('تم إرسال طلب القرض / Loan request submitted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الطلب / Failed to submit request'),
  });
};

export const useApproveLoanRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRLoansService.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-loan-requests'] });
      message.success('تمت الموافقة / Approved');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الموافقة / Approve failed'),
  });
};

export const useRejectLoanRequest = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; data: RejectRequestDto }>({
    mutationFn: ({ id, data }) => HRLoansService.reject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-loan-requests'] });
      message.success('تم الرفض / Rejected');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الرفض / Reject failed'),
  });
};

// ─────────────────────────────────────────────
// Inbox / Outbox
// ─────────────────────────────────────────────

export const useHRInbox = (filter?: HRRequestsFilterDto) =>
  useQuery({
    queryKey: ['hr-inbox', filter],
    queryFn: () => HRRequestsInboxService.getAll(filter),
  });

export const useHROutbox = (filter?: HRRequestsFilterDto) =>
  useQuery({
    queryKey: ['hr-outbox', filter],
    queryFn: () => HRRequestsOutboxService.getAll(filter),
  });

// ─────────────────────────────────────────────
// Employee Management
// ─────────────────────────────────────────────

export const useEmployees = (filter?: EmployeesFilterDto) =>
  useQuery({
    queryKey: ['employees', filter],
    queryFn: () => HREmployeeService.getAll(filter),
  });

// ─────────────────────────────────────────────
// Commission
// ─────────────────────────────────────────────

export const useHRCommissions = (filter?: CommissionFilterDto) =>
  useQuery({
    queryKey: ['hr-commissions', filter],
    queryFn: () => HRCommissionService.getAll(filter),
  });

export const useDeleteHRCommission = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: HRCommissionService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-commissions'] });
      message.success('تم حذف العمولة / Commission deleted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الحذف / Delete failed'),
  });
};

// ─────────────────────────────────────────────
// Commission Slices
// ─────────────────────────────────────────────

export const useCommissionSlices = () =>
  useQuery({ queryKey: ['hr-commission-slices'], queryFn: HRCommissionSliceService.getAll });

export const useCreateCommissionSlice = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateCommissionSliceDto>({
    mutationFn: HRCommissionSliceService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-commission-slices'] });
      message.success('تمت إضافة الشريحة / Slice added');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الإضافة / Add failed'),
  });
};

export const useDeleteCommissionSlice = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: HRCommissionSliceService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-commission-slices'] });
      message.success('تم حذف الشريحة / Slice deleted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الحذف / Delete failed'),
  });
};

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

export const useHRAttendance = (filter?: AttendanceFilterDto) =>
  useQuery({
    queryKey: ['hr-attendance', filter],
    queryFn: () => HRAttendanceService.getAll(filter),
  });

// ─────────────────────────────────────────────
// Leave Balance
// ─────────────────────────────────────────────

export const useHRLeaveBalance = (filter?: LeaveBalanceFilterDto) =>
  useQuery({
    queryKey: ['hr-leave-balance', filter],
    queryFn: () => HRLeaveBalanceService.getAll(filter),
  });

// ─────────────────────────────────────────────
// HR Complaints
// ─────────────────────────────────────────────

// Complaints list endpoint not defined in swagger-Hr-Api.json — returns empty until added.
export const useHRComplaints = () =>
  useQuery<any[]>({ queryKey: ['hr-complaints'], queryFn: async () => [] });

export const useCreateHRComplaint = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, CreateHRComplaintDto>({
    mutationFn: HRComplaintService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaints'] });
      message.success('تم إرسال الشكوى / Complaint submitted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الإرسال / Submit failed'),
  });
};

export const useReplyHRComplaint = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, ReplyHRComplaintDto>({
    mutationFn: HRComplaintService.reply,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaints'] });
      message.success('تم إرسال الرد / Reply sent');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل إرسال الرد / Reply failed'),
  });
};

export const useCloseHRComplaint = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRComplaintService.close,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaints'] });
      message.success('تم إغلاق الشكوى / Complaint closed');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الإغلاق / Close failed'),
  });
};

export const useDeleteHRComplaint = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: HRComplaintService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr-complaints'] });
      message.success('تم حذف الشكوى / Complaint deleted');
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message || 'فشل الحذف / Delete failed'),
  });
};
