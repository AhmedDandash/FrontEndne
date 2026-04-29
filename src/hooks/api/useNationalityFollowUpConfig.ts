import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { NationalityFollowUpConfigService } from '@/services/nationality-followup-config.service';
import type {
  NationalityFollowUpConfig,
  BulkUpdateNationalityFollowUpConfigDto,
} from '@/types/api.types';

const QK = 'nationality-followup-config';

export function useNationalityFollowUpConfig(contractNationalityId: number | null) {
  return useQuery({
    queryKey: [QK, contractNationalityId],
    queryFn: () => NationalityFollowUpConfigService.getByNationality(contractNationalityId!),
    enabled: !!contractNationalityId,
  });
}

export function useToggleNationalityFollowUpConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; contractNationalityId: number; nextValue: boolean }) =>
      NationalityFollowUpConfigService.toggleActive(id),
    onMutate: async ({ id, contractNationalityId, nextValue }) => {
      await qc.cancelQueries({ queryKey: [QK, contractNationalityId] });
      const previous = qc.getQueryData<NationalityFollowUpConfig[]>([QK, contractNationalityId]);
      qc.setQueryData<NationalityFollowUpConfig[]>([QK, contractNationalityId], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, isActive: nextValue } : item))
      );
      return { previous, contractNationalityId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([QK, ctx.contractNationalityId], ctx.previous);
      }
      message.error('فشل تغيير التفعيل | Toggle failed');
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: [QK, vars.contractNationalityId] });
    },
  });
}

export function useBulkUpdateNationalityFollowUpConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateNationalityFollowUpConfigDto) =>
      NationalityFollowUpConfigService.bulkUpdate(data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: [QK, vars.nationalityId] });
      message.success('تم حفظ الإعدادات | Settings saved');
    },
    onError: () => message.error('فشل الحفظ | Save failed'),
  });
}
