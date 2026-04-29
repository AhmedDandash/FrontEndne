import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { FollowUpStatusService } from '@/services/follow-up-status.service';
import type { CreateFollowUpStatusDto, UpdateFollowUpStatusDto } from '@/types/api.types';

const QK = 'followup-statuses';

export function useFollowUpStatuses() {
  return useQuery({
    queryKey: [QK],
    queryFn: FollowUpStatusService.getAll,
  });
}

export function useCreateFollowUpStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFollowUpStatusDto) => FollowUpStatusService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تمت إضافة حالة المتابعة | Status created');
    },
    onError: () => message.error('فشل إضافة الحالة | Failed to create status'),
  });
}

export function useUpdateFollowUpStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFollowUpStatusDto) => FollowUpStatusService.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تم التعديل | Updated');
    },
    onError: () => message.error('فشل التعديل | Update failed'),
  });
}

export function useDeleteFollowUpStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => FollowUpStatusService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تم الحذف | Deleted');
    },
    onError: () => message.error('فشل الحذف | Delete failed'),
  });
}
