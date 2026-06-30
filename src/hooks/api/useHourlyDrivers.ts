/**
 * Hourly Drivers hooks — list + CRUD + activate/deactivate.
 * Create/update/delete/activate/deactivate require `hourly.admin.full_access`;
 * the UI gates those actions and the server returns 403 otherwise.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { HourlyDriverService } from '@/services/hourly-worker.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  HourlyDriverListParams,
  CreateHourlyDriverDto,
  UpdateHourlyDriverDto,
} from '@/types/hourly-worker.types';

const DRIVERS_KEY = ['hourly-drivers'];

export function useHourlyDrivers(params?: HourlyDriverListParams) {
  return useQuery({
    queryKey: [...DRIVERS_KEY, params],
    queryFn: () => HourlyDriverService.getAll(params),
  });
}

export function useHourlyDriver(id: string | undefined) {
  return useQuery({
    queryKey: [...DRIVERS_KEY, id],
    queryFn: () => HourlyDriverService.getById(id!),
    enabled: !!id,
  });
}

export function useHourlyDriverMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: DRIVERS_KEY });

  const create = useMutation({
    mutationFn: (data: CreateHourlyDriverDto) => HourlyDriverService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة السائق / Driver added');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إضافة السائق / Failed to add driver')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHourlyDriverDto }) =>
      HourlyDriverService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث السائق / Driver updated');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل تحديث السائق / Failed to update driver')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => HourlyDriverService.remove(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف السائق / Driver deleted');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل حذف السائق / Failed to delete driver')),
  });

  const activate = useMutation({
    mutationFn: (id: string) => HourlyDriverService.activate(id),
    onSuccess: () => {
      invalidate();
      message.success('تم تفعيل السائق / Driver activated');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل التفعيل / Failed to activate')),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => HourlyDriverService.deactivate(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إلغاء تفعيل السائق / Driver deactivated');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إلغاء التفعيل / Failed to deactivate')),
  });

  return { create, update, remove, activate, deactivate };
}
