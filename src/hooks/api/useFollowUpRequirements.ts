import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { FollowUpRequirementService } from '@/services/followup-requirement.service';
import type {
  CreateFollowUpRequirementDto,
  UpdateFollowUpRequirementDto,
} from '@/types/api.types';

const QK = 'followup-requirements';

/**
 * GET /GetByNationalityAndJob?nationalityId=UUID&jobId=UUID
 * Enabled only when both params are non-empty strings.
 */
export function useFollowUpRequirement(
  nationalityId?: string | null,
  jobId?: string | null
) {
  return useQuery({
    queryKey: [QK, 'by-nat-job', nationalityId, jobId],
    queryFn: () =>
      FollowUpRequirementService.getByNationalityAndJob(nationalityId!, jobId!),
    enabled: !!nationalityId && !!jobId,
  });
}

/**
 * POST /Create
 */
export function useCreateFollowUpRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFollowUpRequirementDto) =>
      FollowUpRequirementService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تم إضافة المتطلبات بنجاح / Requirement created');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إضافة المتطلبات / Failed to create');
    },
  });
}

/**
 * PUT /Update
 */
export function useUpdateFollowUpRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateFollowUpRequirementDto) =>
      FollowUpRequirementService.update(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تم تعديل المتطلبات بنجاح / Requirement updated');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تعديل المتطلبات / Failed to update');
    },
  });
}

/**
 * DELETE /Delete/{id}
 */
export function useDeleteFollowUpRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FollowUpRequirementService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      message.success('تم حذف المتطلبات بنجاح / Requirement deleted');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل حذف المتطلبات / Failed to delete');
    },
  });
}
