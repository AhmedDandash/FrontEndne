import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { RestrictionTypeService } from '@/services/restriction-type.service';
import type { RestrictionTypeCreateDto } from '@/types/accounting.types';

const RESTRICTION_TYPES_KEY = 'restriction-types';

/**
 * Restriction (journal-entry) types hook.
 *
 * The list endpoint returns everything in one call (no server-side paging /
 * filtering), so search & filters are applied client-side on the page.
 */
export function useRestrictionTypes() {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [RESTRICTION_TYPES_KEY],
    queryFn: () => RestrictionTypeService.getAll(),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [RESTRICTION_TYPES_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload: RestrictionTypeCreateDto) => RestrictionTypeService.create(payload),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة نوع القيد بنجاح / Restriction type created');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل الإضافة / Failed to create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RestrictionTypeCreateDto }) =>
      RestrictionTypeService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث نوع القيد بنجاح / Restriction type updated');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل التحديث / Failed to update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RestrictionTypeService.delete(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف نوع القيد / Restriction type deleted');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل الحذف / Failed to delete');
    },
  });

  return {
    restrictionTypes: data ?? [],
    isLoading,
    isFetching,
    error,
    refetch,
    createType: createMutation.mutateAsync,
    updateType: updateMutation.mutateAsync,
    deleteType: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
