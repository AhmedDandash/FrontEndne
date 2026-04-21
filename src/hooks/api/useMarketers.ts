/**
 * Marketer Hooks
 * React Query hooks for Marketer CRUD — /api/V1/Marketer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { MarketerService } from '@/services/marketer.service';
import type { CreateMarketerDto, UpdateMarketerDto } from '@/types/api.types';

const QUERY_KEY = ['marketers'];

export function useMarketers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => MarketerService.getAll(),
  });
}

export function useMarketer(id: number | string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => MarketerService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateMarketer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMarketerDto) => MarketerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة المسوق بنجاح / Marketer created successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إضافة المسوق / Failed to create marketer');
    },
  });
}

export function useUpdateMarketer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateMarketerDto }) =>
      MarketerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم تحديث المسوق بنجاح / Marketer updated successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث المسوق / Failed to update marketer');
    },
  });
}

export function useDeleteMarketer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => MarketerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم حذف المسوق بنجاح / Marketer deleted successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل حذف المسوق / Failed to delete marketer');
    },
  });
}
