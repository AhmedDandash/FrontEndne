import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  AdminPositionService,
  AdminUserService,
  AdminRoleService,
} from '@/services/admin.service';
import { DepartmentService } from '@/services/department.service';
import type {
  EmployeePositionCreateDto,
  AddUserDto,
  AssignRoleDto,
  CreateDepartmentDto,
} from '@/types/hr.types';

const QK = {
  positions: ['admin-positions'] as const,
  departments: ['departments'] as const,
  users: ['admin-users'] as const,
  roles: ['admin-roles'] as const,
};

// ─── Positions (= Jobs in HR context) ────────────────────────────────────────

export function useAdminPositions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.positions,
    queryFn: () => AdminPositionService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: EmployeePositionCreateDto) => AdminPositionService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.positions });
      message.success('تم إضافة المسمى الوظيفي بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إضافة المسمى الوظيفي');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => AdminPositionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.positions });
      message.success('تم حذف المسمى الوظيفي');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل حذف المسمى الوظيفي');
    },
  });

  return {
    positions: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createPosition: createMutation.mutateAsync,
    deletePosition: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.users,
    queryFn: () => AdminUserService.getAll(),
  });

  const addUserMutation = useMutation({
    mutationFn: (dto: AddUserDto) => AdminUserService.addUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.users });
      message.success('تم إضافة المستخدم بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إضافة المستخدم');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: (dto: AssignRoleDto) => AdminUserService.assignRole(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.users });
      message.success('تم تعيين الدور بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل تعيين الدور');
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: (dto: AssignRoleDto) => AdminUserService.removeRole(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.users });
      message.success('تم إزالة الدور بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إزالة الدور');
    },
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    addUser: addUserMutation.mutateAsync,
    assignRole: assignRoleMutation.mutateAsync,
    removeRole: removeRoleMutation.mutateAsync,
    isAddingUser: addUserMutation.isPending,
    isAssigningRole: assignRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
}

// ─── Admin Roles ──────────────────────────────────────────────────────────────

export function useAdminRoles() {
  return useQuery<string[]>({
    queryKey: QK.roles,
    queryFn: () => AdminRoleService.getAll(),
  });
}

// ─── Departments ──────────────────────────────────────────────────────────────

export function useDepartments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QK.departments,
    queryFn: () => DepartmentService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateDepartmentDto) => DepartmentService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.departments });
      message.success('تم إضافة القسم بنجاح');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل إضافة القسم');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DepartmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.departments });
      message.success('تم حذف القسم');
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'فشل حذف القسم');
    },
  });

  return {
    departments: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createDepartment: createMutation.mutateAsync,
    deleteDepartment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
