import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { AccountService } from '@/services/account.service';
import type {
  CreateAccountDto,
  UpdateAccountNameDto,
  UpdateAccountReportSideDto,
  AccountSettingsQuery,
} from '@/types/accounting.types';

const ACCOUNTS_KEY = 'accounts';

/**
 * Chart of Accounts hook — exposes the full account tree plus the mutations
 * documented in the Accounting API. The Chart of Accounts page consumes the
 * read side (`tree`, `isLoading`, `refetch`); the mutations are provided for
 * the account-management screens that build on top of this module.
 */
export function useAccountTree() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [ACCOUNTS_KEY, 'tree'],
    queryFn: () => AccountService.getFullTree(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateAccountDto) => AccountService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة الحساب بنجاح / Account created');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إضافة الحساب / Failed to create account');
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountNameDto }) =>
      AccountService.updateName(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث الحساب بنجاح / Account updated');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث الحساب / Failed to update account');
    },
  });

  const updateReportingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountReportSideDto }) =>
      AccountService.updateReporting(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث إعدادات الحساب / Account settings updated');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث الإعدادات / Failed to update settings');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => AccountService.delete(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف الحساب / Account deleted');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل حذف الحساب / Failed to delete account');
    },
  });

  return {
    tree: data ?? [],
    isLoading,
    isFetching,
    error,
    refetch,
    createAccount: createMutation.mutateAsync,
    updateAccountName: updateNameMutation.mutateAsync,
    updateAccountReporting: updateReportingMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateNameMutation.isPending,
    isUpdatingReporting: updateReportingMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Paginated, searchable account-settings list (GET /account/settings).
 * Its query key is namespaced under ACCOUNTS_KEY so the mutations in
 * useAccountTree invalidate it automatically. `placeholderData` keeps the
 * previous page visible while the next one loads.
 */
export function useAccountSettings(params: AccountSettingsQuery) {
  return useQuery({
    queryKey: [
      ACCOUNTS_KEY,
      'settings',
      params.searchTerm ?? '',
      params.pageNumber ?? 1,
      params.pageSize ?? 10,
    ],
    queryFn: () => AccountService.getSettings(params),
    placeholderData: (previous) => previous,
  });
}
