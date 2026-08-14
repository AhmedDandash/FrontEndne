import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  HourlyWorkerService,
  HourlyWorkerRequestService,
} from '@/services/hourly-worker.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  HourlyWorkerListParams,
  HourlyWorkerAvailabilityParams,
  CreateHourlyWorkerDto,
  UpdateHourlyWorkerDto,
  HourlyWorkerRequestListParams,
  AssignWorkerDto,
  RejectRequestDto,
} from '@/types/hourly-worker.types';

const WORKERS_KEY = ['hourly-workers'];
const REQUESTS_KEY = ['hourly-worker-requests'];

// ─── Workers ──────────────────────────────────────────────────────────────────

export function useHourlyWorkers(params?: HourlyWorkerListParams) {
  return useQuery({
    queryKey: [...WORKERS_KEY, params],
    queryFn: () => HourlyWorkerService.getAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useHourlyWorker(id: string | undefined) {
  return useQuery({
    queryKey: [...WORKERS_KEY, id],
    queryFn: () => HourlyWorkerService.getById(id!),
    enabled: !!id,
  });
}

export function useAvailableHourlyWorkers(
  params?: HourlyWorkerAvailabilityParams,
  enabled = true
) {
  return useQuery({
    queryKey: [...WORKERS_KEY, 'available', params],
    queryFn: () => HourlyWorkerService.getAvailable(params),
    enabled,
  });
}

export function useHourlyWorkerMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: WORKERS_KEY });

  const create = useMutation({
    mutationFn: (data: CreateHourlyWorkerDto) => HourlyWorkerService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة العامل بنجاح / Worker added successfully');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل إضافة العامل / Failed to add worker')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHourlyWorkerDto }) =>
      HourlyWorkerService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث بيانات العامل / Worker updated successfully');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل تحديث العامل / Failed to update worker')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => HourlyWorkerService.remove(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف العامل / Worker deleted successfully');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل حذف العامل / Failed to delete worker')),
  });

  const activate = useMutation({
    mutationFn: (id: string) => HourlyWorkerService.activate(id),
    onSuccess: () => {
      invalidate();
      message.success('تم تفعيل العامل / Worker activated');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل تفعيل العامل / Failed to activate worker')),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => HourlyWorkerService.deactivate(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إلغاء تفعيل العامل / Worker deactivated');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل إلغاء تفعيل العامل / Failed to deactivate worker')),
  });

  return { create, update, remove, activate, deactivate };
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export function useHourlyWorkerRequests(params?: HourlyWorkerRequestListParams) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, params],
    queryFn: () => HourlyWorkerRequestService.getAll(params),
    placeholderData: (previous) => previous,
  });
}

export function useHourlyWorkerRequest(id: string | undefined) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, id],
    queryFn: () => HourlyWorkerRequestService.getById(id!),
    enabled: !!id,
  });
}

export function useHourlyWorkerRequestTracking(ticketNumber: string | undefined) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, 'track', ticketNumber],
    queryFn: () => HourlyWorkerRequestService.trackByTicket(ticketNumber!),
    enabled: !!ticketNumber,
  });
}

export function useHourlyWorkerRequestActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });

  const approve = useMutation({
    mutationFn: (id: string) => HourlyWorkerRequestService.approve(id),
    onSuccess: () => {
      invalidate();
      message.success('تمت الموافقة على الطلب / Request approved');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل الموافقة / Failed to approve')),
  });

  const reject = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: RejectRequestDto }) =>
      HourlyWorkerRequestService.reject(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم رفض الطلب / Request rejected');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل رفض الطلب / Failed to reject')),
  });

  const assign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignWorkerDto }) =>
      HourlyWorkerRequestService.assign(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تعيين العامل / Worker assigned');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل تعيين العامل / Failed to assign worker')),
  });

  const markInProgress = useMutation({
    mutationFn: (id: string) => HourlyWorkerRequestService.markInProgress(id),
    onSuccess: () => {
      invalidate();
      message.success('تم بدء التنفيذ / Marked in progress');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل بدء التنفيذ / Failed to start')),
  });

  const complete = useMutation({
    mutationFn: (id: string) => HourlyWorkerRequestService.complete(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إكمال الطلب / Request completed');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إكمال الطلب / Failed to complete')),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => HourlyWorkerRequestService.cancel(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إلغاء الطلب / Request cancelled');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إلغاء الطلب / Failed to cancel')),
  });

  return { approve, reject, assign, markInProgress, complete, cancel };
}
