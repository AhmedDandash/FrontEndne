import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  HREmployeeService,
  HRAttendanceService,
  HRLeaveService,
  HRLeaveTypeService,
  HRPayrollService,
  HRPermissionRequestService,
  HRResignationRequestService,
  HRCustodyRequestService,
} from '@/services/hr.service';

import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  AttendanceFilterDto,
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  GeneratePayrollDto,
  CreatePermissionRequestDto,
  CreateResignationRequestDto,
  CreateCustodyRequestDto,
  CreateCustodyTypeDto,
} from '@/types/hr.types';

// ─── Query keys ──────────────────────────────────────────────────────────────

const QK = {
  employees: (search?: string, page?: number, pageSize?: number) =>
    ['hr-employees', search, page, pageSize] as const,
  employee: (id: string) => ['hr-employee', id] as const,
  attendance: (filter: AttendanceFilterDto) => ['hr-attendance', filter] as const,
  leave: ['hr-leave'] as const,
  leaveBalance: (leaveTypeId: string) => ['hr-leave-balance', leaveTypeId] as const,
  employeeBalances: (employeeId?: string, leaveTypeId?: string, year?: number, month?: number) =>
    ['hr-employee-balances', employeeId, leaveTypeId, year, month] as const,
  leaveTypes: ['hr-leave-types'] as const,
  payroll: (month: number, year: number) => ['hr-payroll', month, year] as const,
};

// ─── Employee hooks ───────────────────────────────────────────────────────────

export function useHREmployees(params?: {
  searchName?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.employees(params?.searchName, params?.page, params?.pageSize),
    queryFn: () => HREmployeeService.getAll(params),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeDto) => HREmployeeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      message.success('تم إضافة الموظف بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إضافة الموظف');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      HREmployeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      message.success('تم تحديث بيانات الموظف بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل تحديث الموظف');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => HREmployeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      message.success('تم تعطيل الموظف بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل تعطيل الموظف');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => HREmployeeService.resetPassword(id),
    onSuccess: () => {
      message.success('تمت إعادة تعيين كلمة المرور بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إعادة تعيين كلمة المرور');
    },
  });

  return {
    data: query.data,
    employees: query.data?.items ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    deleteEmployee: deleteMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}

export function useHREmployee(id: string) {
  return useQuery({
    queryKey: QK.employee(id),
    queryFn: () => HREmployeeService.getById(id),
    enabled: !!id,
  });
}

// ─── Attendance hooks ─────────────────────────────────────────────────────────

export function useHRAttendance(_filter: AttendanceFilterDto) {
  const filterMutation = useMutation({
    mutationFn: (dto: AttendanceFilterDto) => HRAttendanceService.filter(dto),
  });

  const checkInMutation = useMutation({
    mutationFn: () => HRAttendanceService.checkIn(),
    onSuccess: () => message.success('تم تسجيل الحضور بنجاح'),
    onError: (err: any) => {
      const d = err?.response?.data;
      message.error(d?.errors?.[0] || d?.message || 'فشل تسجيل الحضور');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => HRAttendanceService.checkOut(),
    onSuccess: () => message.success('تم تسجيل الانصراف بنجاح'),
    onError: (err: any) => {
      const d = err?.response?.data;
      message.error(d?.errors?.[0] || d?.message || 'فشل تسجيل الانصراف');
    },
  });

  return {
    records: filterMutation.data ?? [],
    isLoading: filterMutation.isPending,
    filterAttendance: filterMutation.mutateAsync,
    checkIn: checkInMutation.mutateAsync,
    checkOut: checkOutMutation.mutateAsync,
    isCheckingIn: checkInMutation.isPending,
    isCheckingOut: checkOutMutation.isPending,
  };
}

// ─── Leave hooks ──────────────────────────────────────────────────────────────

export function useHRLeave() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.leave,
    queryFn: () => HRLeaveService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeaveRequestDto) => HRLeaveService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leave });
      message.success('تم إنشاء طلب الإجازة بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إنشاء طلب الإجازة');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, approvalComment }: { requestId: string; approvalComment?: string }) =>
      HRLeaveService.approve(requestId, { approvalComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leave });
      message.success('تمت الموافقة على الإجازة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل الموافقة على الإجازة');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, approvalComment }: { requestId: string; approvalComment?: string }) =>
      HRLeaveService.reject(requestId, { approvalComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leave });
      message.success('تم رفض الإجازة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل رفض الإجازة');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => HRLeaveService.cancel(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leave });
      message.success('تم إلغاء طلب الإجازة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إلغاء الإجازة');
    },
  });

  return {
    leaveRequests: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createLeave: createMutation.mutateAsync,
    approveLeave: approveMutation.mutateAsync,
    rejectLeave: rejectMutation.mutateAsync,
    cancelLeave: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}

// ─── Employee Leave Balance hook ──────────────────────────────────────────────

export function useEmployeeLeaveBalances(params: {
  employeeId?: string;
  leaveTypeId?: string;
  year?: number;
  month?: number;
}) {
  return useQuery({
    queryKey: QK.employeeBalances(params.employeeId, params.leaveTypeId, params.year, params.month),
    queryFn: () => HRLeaveService.getEmployeeBalances(params),
  });
}

// ─── Leave Type hooks ─────────────────────────────────────────────────────────

export function useHRLeaveTypes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.leaveTypes,
    queryFn: () => HRLeaveTypeService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeaveTypeDto) => HRLeaveTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leaveTypes });
      message.success('تم إضافة نوع الإجازة بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إضافة نوع الإجازة');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeaveTypeDto }) =>
      HRLeaveTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leaveTypes });
      message.success('تم تحديث نوع الإجازة بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل تحديث نوع الإجازة');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => HRLeaveTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leaveTypes });
      message.success('تم حذف نوع الإجازة بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل حذف نوع الإجازة');
    },
  });

  return {
    leaveTypes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createLeaveType: createMutation.mutateAsync,
    updateLeaveType: updateMutation.mutateAsync,
    deleteLeaveType: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ─── Permission Request hooks ─────────────────────────────────────────────────

export function useHRPermissionRequest() {
  const createMutation = useMutation({
    mutationFn: (data: CreatePermissionRequestDto) => HRPermissionRequestService.create(data),
    onSuccess: () => message.success('تم تقديم طلب الاستئذان بنجاح'),
    onError: (err: any) => {
      const d = err?.response?.data;
      message.error(d?.errors?.[0] || d?.message || 'فشل تقديم طلب الاستئذان');
    },
  });

  return {
    createPermissionRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useHRPermissionRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hr-permission-requests'],
    queryFn: () => HRPermissionRequestService.getAll(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => HRPermissionRequestService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-permission-requests'] });
      message.success('تمت الموافقة على طلب الاستئذان');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل الموافقة على الطلب');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => HRPermissionRequestService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-permission-requests'] });
      message.success('تم رفض طلب الاستئذان');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل رفض الطلب');
    },
  });

  return {
    permissionRequests: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    approvePermissionRequest: approveMutation.mutateAsync,
    rejectPermissionRequest: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// ─── Resignation Request hooks ────────────────────────────────────────────────

export function useHRResignationRequest() {
  const createMutation = useMutation({
    mutationFn: (data: CreateResignationRequestDto) => HRResignationRequestService.create(data),
    onSuccess: () => message.success('تم تقديم طلب الاستقالة بنجاح'),
    onError: (err: any) => {
      const d = err?.response?.data;
      message.error(d?.errors?.[0] || d?.message || 'فشل تقديم طلب الاستقالة');
    },
  });

  return {
    createResignationRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useHRResignationRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hr-resignation-requests'],
    queryFn: () => HRResignationRequestService.getAll(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => HRResignationRequestService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-resignation-requests'] });
      message.success('تمت الموافقة على طلب الاستقالة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل الموافقة على الطلب');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => HRResignationRequestService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-resignation-requests'] });
      message.success('تم رفض طلب الاستقالة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل رفض الطلب');
    },
  });

  return {
    resignationRequests: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    approveResignationRequest: approveMutation.mutateAsync,
    rejectResignationRequest: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// ─── Custody Request hooks ────────────────────────────────────────────────────

export function useHRCustodyTypes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hr-custody-types'],
    queryFn: () => HRCustodyRequestService.getTypes(),
  });

  const createTypeMutation = useMutation({
    mutationFn: (data: CreateCustodyTypeDto) => HRCustodyRequestService.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-custody-types'] });
      message.success('تم إضافة نوع العهدة بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إضافة نوع العهدة');
    },
  });

  return {
    custodyTypes: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createCustodyType: createTypeMutation.mutateAsync,
    isCreatingType: createTypeMutation.isPending,
  };
}

export function useHRCustodyRequest() {
  const createMutation = useMutation({
    mutationFn: (data: CreateCustodyRequestDto) => HRCustodyRequestService.create(data),
    onSuccess: () => message.success('تم تقديم طلب العهدة بنجاح'),
    onError: (err: any) => {
      const d = err?.response?.data;
      message.error(d?.errors?.[0] || d?.message || 'فشل تقديم طلب العهدة');
    },
  });

  return {
    createCustodyRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useHRCustodyRequests() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hr-custody-requests'],
    queryFn: () => HRCustodyRequestService.getAll(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => HRCustodyRequestService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-custody-requests'] });
      message.success('تمت الموافقة على طلب العهدة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل الموافقة على الطلب');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => HRCustodyRequestService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-custody-requests'] });
      message.success('تم رفض طلب العهدة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل رفض الطلب');
    },
  });

  return {
    custodyRequests: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    approveCustodyRequest: approveMutation.mutateAsync,
    rejectCustodyRequest: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// ─── Payroll hooks ────────────────────────────────────────────────────────────

export function useHRPayroll(month: number, year: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.payroll(month, year),
    queryFn: () => HRPayrollService.get(month, year),
    enabled: !!month && !!year,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: (dto: GeneratePayrollDto) => HRPayrollService.generate(dto),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: QK.payroll(vars.month, vars.year) });
      message.success('تم إنشاء كشف الرواتب بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إنشاء كشف الرواتب');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => HRPayrollService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.payroll(month, year) });
      message.success('تم إغلاق كشف الرواتب');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إغلاق كشف الرواتب');
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ m, y }: { m: number; y: number }) => HRPayrollService.exportExcel(m, y),
    onSuccess: (blob, vars) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payroll-${vars.m}-${vars.y}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل تصدير كشف الرواتب');
    },
  });

  return {
    payroll: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    generatePayroll: generateMutation.mutateAsync,
    closePayroll: closeMutation.mutateAsync,
    exportPayroll: exportMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    isClosing: closeMutation.isPending,
    isExporting: exportMutation.isPending,
  };
}
