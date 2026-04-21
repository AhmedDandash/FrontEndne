/**
 * useBranches Hook
 * React Query hooks for branch operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { BranchService } from '@/services';
import type { BranchDto } from '@/types/api.types';

const QUERY_KEY = 'branches';

export function useBranches() {
  const queryClient = useQueryClient();

  // Get all branches
  const {
    data: branches,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const result = await BranchService.getAll();
      const branchesList = Array.isArray(result) ? result : [];
      console.log('🏢 Branches fetched from API:', result);
      console.log('📊 First branch sample:', branchesList[0]);
      console.log(
        '🔍 First branch keys:',
        branchesList[0] ? Object.keys(branchesList[0]) : 'No branches'
      );
      console.log('🆔 Does first branch have id?', branchesList[0]?.id !== undefined);

      // Check if branches have id field, if not, log a warning
      if (branchesList.length > 0 && !branchesList[0].hasOwnProperty('id')) {
        console.error('❌ WARNING: Branches from API are missing the "id" field!');
        console.log('Available fields:', Object.keys(branchesList[0]));
      }

      return branchesList;
    },
  });

  // Get branch by ID
  const useBranch = (id: number | string) => {
    return useQuery({
      queryKey: [QUERY_KEY, id],
      queryFn: () => BranchService.getById(id),
      enabled: !!id,
    });
  };

  // Create branch
  const createMutation = useMutation({
    mutationFn: (data: BranchDto) => BranchService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة الفرع بنجاح / Branch created successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل إضافة الفرع / Failed to create branch');
    },
  });

  // Update branch
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: BranchDto }) =>
      BranchService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث الفرع بنجاح / Branch updated successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل تحديث الفرع / Failed to update branch');
    },
  });

  // Delete branch
  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => BranchService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف الفرع بنجاح / Branch deleted successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل حذف الفرع / Failed to delete branch');
    },
  });

  return {
    branches,
    isLoading,
    error,
    refetch,
    useBranch,
    createBranch: createMutation.mutate,
    updateBranch: updateMutation.mutate,
    deleteBranch: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
