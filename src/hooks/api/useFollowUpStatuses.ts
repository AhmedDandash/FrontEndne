import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { FollowUpStatusService } from '@/services/follow-up-status.service';
import type { CreateFollowUpStatusDto, UpdateFollowUpStatusDto } from '@/types/api.types';

const QK = 'followup-statuses';
const MEDIATION_FOLLOWUP_DASHBOARD_QK = 'mediation-followup-dashboard';
const MEDIATION_FOLLOWUP_ITEMS_QK = 'mediation-followup-items';
const NATIONALITY_CONFIG_QK = 'nationality-followup-config';

function invalidateFollowUpScreens(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [QK] });
  qc.invalidateQueries({ queryKey: [NATIONALITY_CONFIG_QK] });
  qc.invalidateQueries({ queryKey: [MEDIATION_FOLLOWUP_DASHBOARD_QK] });
  qc.invalidateQueries({ queryKey: [MEDIATION_FOLLOWUP_ITEMS_QK] });
}

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
      invalidateFollowUpScreens(qc);
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
      invalidateFollowUpScreens(qc);
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
      invalidateFollowUpScreens(qc);
      message.success('تم الحذف | Deleted');
    },
    onError: () => message.error('فشل الحذف | Delete failed'),
  });
}
