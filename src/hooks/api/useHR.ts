import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  HREmployeeService,
  HRAttendanceService,
  HRLeaveService,
  HRLeaveTypeService,
  HRPayrollService,
} from '@/services/hr.service';
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  AttendanceFilterDto,
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  GeneratePayrollDto,
} from '@/types/hr.types';

// ─── Query keys ──────────────────────────────────────────────────────────────

const QK = {
  employees: (search?: string, page?: number, pageSize?: number) =>
    ['hr-employees', search, page, pageSize] as const,
  employee: (id: string) => ['hr-employee', id] as const,
  attendance: (filter: AttendanceFilterDto) => ['hr-attendance', filter] as const,
  leave: ['hr-leave'] as const,
  leaveBalance: (leaveTypeId: string) => ['hr-leave-balance', leaveTypeId] as const,
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

export function useHRAttendance(filter: AttendanceFilterDto) {
  const query = useQuery({
    queryKey: QK.attendance(filter),
    queryFn: () => HRAttendanceService.filter(filter),
    enabled: false,
  });

  const filterMutation = useMutation({
    mutationFn: (dto: AttendanceFilterDto) => HRAttendanceService.filter(dto),
  });

  const checkInMutation = useMutation({
    mutationFn: () => HRAttendanceService.checkIn(),
    onSuccess: () => message.success('تم تسجيل الحضور بنجاح'),
    onError: (err: any) => message.error(err?.response?.data?.message || 'فشل تسجيل الحضور'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => HRAttendanceService.checkOut(),
    onSuccess: () => message.success('تم تسجيل الانصراف بنجاح'),
    onError: (err: any) => message.error(err?.response?.data?.message || 'فشل تسجيل الانصراف'),
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
    mutationFn: (requestId: string) => HRLeaveService.approve(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.leave });
      message.success('تمت الموافقة على الإجازة');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل الموافقة على الإجازة');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => HRLeaveService.reject(requestId),
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
