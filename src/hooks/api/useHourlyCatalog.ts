/**
 * Hourly Catalog hooks — service packages and serving areas (admin CRUD).
 * Create/update/delete require `hourly.admin.full_access`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  HourlyPackageService,
  HourlyServingAreaService,
} from '@/services/hourly-worker.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  HourlyPackageListParams,
  CreateHourlyServicePackageDto,
  UpdateHourlyServicePackageDto,
  HourlyServingAreaListParams,
  CreateHourlyServingAreaDto,
  UpdateHourlyServingAreaDto,
} from '@/types/hourly-worker.types';

const PACKAGES_KEY = ['hourly-packages'];
const AREAS_KEY = ['hourly-serving-areas'];

// ── Packages ────────────────────────────────────────────────────────────────────

export function useHourlyPackages(params?: HourlyPackageListParams) {
  return useQuery({
    queryKey: [...PACKAGES_KEY, params],
    queryFn: () => HourlyPackageService.getAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useHourlyPackageMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });

  const create = useMutation({
    mutationFn: (data: CreateHourlyServicePackageDto) => HourlyPackageService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة الباقة / Package added');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إضافة الباقة / Failed to add package')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHourlyServicePackageDto }) =>
      HourlyPackageService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث الباقة / Package updated');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل تحديث الباقة / Failed to update package')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => HourlyPackageService.remove(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف الباقة / Package deleted');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل حذف الباقة / Failed to delete package')),
  });

  return { create, update, remove };
}

// ── Serving Areas ───────────────────────────────────────────────────────────────

export function useHourlyServingAreas(params?: HourlyServingAreaListParams) {
  return useQuery({
    queryKey: [...AREAS_KEY, params],
    queryFn: () => HourlyServingAreaService.getAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useHourlyServingAreaMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: AREAS_KEY });

  const create = useMutation({
    mutationFn: (data: CreateHourlyServingAreaDto) => HourlyServingAreaService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة المنطقة / Area added');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إضافة المنطقة / Failed to add area')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHourlyServingAreaDto }) =>
      HourlyServingAreaService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث المنطقة / Area updated');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل تحديث المنطقة / Failed to update area')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => HourlyServingAreaService.remove(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف المنطقة / Area deleted');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل حذف المنطقة / Failed to delete area')),
  });

  return { create, update, remove };
}
