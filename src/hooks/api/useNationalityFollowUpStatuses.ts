/**
 * Nationality Follow-Up Status Hooks
 * React Query hooks for nationality-to-follow-up-status association CRUD
 */

import { useMutation, useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { NationalityFollowUpService } from '@/services/nationality-followup.service';
import { NationalityService } from '@/services/nationality.service';
import type {
  NationalityFollowUpStatus,
  CreateNationalityFollowUpStatusDto,
  UpdateNationalityFollowUpStatusDto,
} from '@/types/api.types';
import { message } from 'antd';

const QUERY_KEY = 'nationalityFollowUpStatuses';

/**
 * Fetch follow-up statuses for all nationalities by calling
 * GET /api/Nationality/GetNationalityFollowUpStatus/{nationalityId}
 * for each nationality obtained from GetAllNationality.
 */
export const useNationalityFollowUpStatuses = () => {
  // Step 1: fetch all nationalities
  const { data: nationalities = [], isLoading: natLoading } = useQuery({
    queryKey: ['nationalities'],
    queryFn: () => NationalityService.getAll(),
  });

  const nationalityIds = nationalities
    .filter((n) => n.nationalityId != null)
    .map((n) => n.nationalityId as number);

  // Step 2: for each nationality, fetch its follow-up statuses
  const queries = useQueries({
    queries: nationalityIds.map((id) => ({
      queryKey: [QUERY_KEY, 'byNationality', id],
      queryFn: () => NationalityFollowUpService.getByNationality(id),
      enabled: !natLoading && nationalityIds.length > 0,
    })),
  });

  const isLoading = natLoading || queries.some((q) => q.isLoading);
  const data: NationalityFollowUpStatus[] = queries.flatMap((q) => q.data ?? []);

  return { data, isLoading };
};

/**
 * Create nationality follow-up status association
 */
export const useCreateNationalityFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation<NationalityFollowUpStatus, Error, CreateNationalityFollowUpStatusDto>({
    mutationFn: NationalityFollowUpService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة ربط الجنسية بنجاح / Association created successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'حدث خطأ / Error occurred');
    },
  });
};

/**
 * Update nationality follow-up status association
 */
export const useUpdateNationalityFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation<
    NationalityFollowUpStatus,
    Error,
    { id: number; data: UpdateNationalityFollowUpStatusDto }
  >({
    mutationFn: ({ id, data }) => NationalityFollowUpService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم التحديث بنجاح / Updated successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'حدث خطأ / Error occurred');
    },
  });
};

/**
 * Toggle active status
 */
export const useToggleNationalityFollowUpActive = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: NationalityFollowUpService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'حدث خطأ / Error occurred');
    },
  });
};

/**
 * Delete nationality follow-up status association
 */
export const useDeleteNationalityFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: NationalityFollowUpService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم الحذف بنجاح / Deleted successfully');
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'حدث خطأ / Error occurred');
    },
  });
};
