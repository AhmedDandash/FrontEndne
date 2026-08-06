/**
 * Nationality Hooks
 * React Query hooks for nationality CRUD operations (General Options)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NationalityService } from '@/services/nationality.service';
import type {
  Nationality,
  CreateNationalityDto,
  UpdateNationalityDto,
} from '@/types/api.types';
import { message } from 'antd';
import { getApiErrorMessage } from '@/utils/api-error';

const QUERY_KEY = 'nationalities';

/**
 * Fetch nationalities.
 * @param params Optional server-side filters. Pass `{ isActiveOnly: true, pageSize: 100 }`
 *   for customer-facing dropdowns so disabled nationalities are excluded.
 */
export const useNationalities = (params?: { isActiveOnly?: boolean; pageSize?: number }) => {
  return useQuery<Nationality[], Error>({
    queryKey: [QUERY_KEY, params ?? {}],
    queryFn: () => NationalityService.getAll(params),
    placeholderData: (previous) => previous,
  });
};

/**
 * Fetch nationality by ID
 */
export const useNationality = (id: number | string) => {
  return useQuery<Nationality, Error>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => NationalityService.getById(id),
    enabled: !!id,
  });
};

/**
 * Create new nationality
 */
export const useCreateNationality = () => {
  const queryClient = useQueryClient();

  return useMutation<Nationality, Error, CreateNationalityDto>({
    mutationFn: NationalityService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة الجنسية بنجاح / Nationality created successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل إضافة الجنسية / Failed to create nationality'));
    },
  });
};

/**
 * Update nationality
 */
export const useUpdateNationality = () => {
  const queryClient = useQueryClient();

  return useMutation<Nationality, Error, { id: number | string; data: UpdateNationalityDto }>({
    mutationFn: ({ id, data }) => NationalityService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث الجنسية بنجاح / Nationality updated successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل تحديث الجنسية / Failed to update nationality'));
    },
  });
};

/**
 * Delete nationality
 */
export const useDeleteNationality = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: NationalityService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف الجنسية بنجاح / Nationality deleted successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل حذف الجنسية / Failed to delete nationality'));
    },
  });
};

/**
 * Toggle nationality active status
 * PUT /api/V1/Nationality/{id}/toggle-status
 */
export const useToggleNationalityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number | string>({
    mutationFn: NationalityService.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تغيير حالة الجنسية / Nationality status toggled');
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل تغيير حالة الجنسية / Failed to toggle nationality status')
      );
    },
  });
};
