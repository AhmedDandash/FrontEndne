/**
 * Hourly Order hooks — order detail + sub-resources (timeline, logs, payments,
 * assignments) and order operations (recommended workers, driver, tracking,
 * invoices, accommodation).
 *
 * The order id is the same id as a HourlyWorkerRequest. Mutations invalidate both
 * the order-detail key and the requests list so the UI stays in sync.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  HourlyWorkerRequestService,
  HourlyWorkerOrderService,
} from '@/services/hourly-worker.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  UpdateAssignmentStatusDto,
  AddInternalNoteDto,
  AssignDriverDto,
  IssueHourlyOrderInvoiceDto,
  BookHourlyOrderAccommodationDto,
  UpdateHourlyAccommodationStatusDto,
} from '@/types/hourly-worker.types';

const ORDER_KEY = ['hourly-order'];
const REQUESTS_KEY = ['hourly-worker-requests'];

// ── Read hooks ────────────────────────────────────────────────────────────────

export function useHourlyOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, id, 'detail'],
    queryFn: () => HourlyWorkerRequestService.getDetail(id!),
    enabled: !!id,
  });
}

export function useHourlyOrderTimeline(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, id, 'timeline'],
    queryFn: () => HourlyWorkerRequestService.getTimeline(id!),
    enabled: !!id,
  });
}

export function useHourlyOrderLogs(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, id, 'logs'],
    queryFn: () => HourlyWorkerRequestService.getLogs(id!),
    enabled: !!id,
  });
}

export function useHourlyOrderPayments(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, id, 'payments'],
    queryFn: () => HourlyWorkerRequestService.getPayments(id!),
    enabled: !!id,
  });
}

export function useHourlyOrderAssignments(id: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, id, 'assignments'],
    queryFn: () => HourlyWorkerRequestService.getAssignments(id!),
    enabled: !!id,
  });
}

export function useRecommendedWorkers(orderId: string | undefined, maxResults = 10) {
  return useQuery({
    queryKey: [...ORDER_KEY, orderId, 'recommended', maxResults],
    queryFn: () => HourlyWorkerOrderService.getRecommendedWorkers(orderId!, maxResults),
    enabled: !!orderId,
  });
}

export function useOrderTracking(orderId: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, orderId, 'tracking'],
    queryFn: () => HourlyWorkerOrderService.getTracking(orderId!),
    enabled: !!orderId,
  });
}

export function useOrderInvoices(orderId: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, orderId, 'invoices'],
    queryFn: () => HourlyWorkerOrderService.getInvoices(orderId!),
    enabled: !!orderId,
  });
}

export function useOrderAccommodation(orderId: string | undefined) {
  return useQuery({
    queryKey: [...ORDER_KEY, orderId, 'accommodation'],
    queryFn: () => HourlyWorkerOrderService.getAccommodation(orderId!),
    enabled: !!orderId,
  });
}

// ── Mutation hooks ──────────────────────────────────────────────────────────────

/** Order lifecycle + assignment + note mutations, scoped to a single order id. */
export function useHourlyOrderActions(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [...ORDER_KEY, id] });
    queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
  };

  const approve = useMutation({
    mutationFn: () => HourlyWorkerRequestService.approve(id),
    onSuccess: () => {
      invalidate();
      message.success('تمت الموافقة على الطلب / Order approved');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل الموافقة / Failed to approve')),
  });

  const reject = useMutation({
    mutationFn: (notes?: string) => HourlyWorkerRequestService.reject(id, { notes }),
    onSuccess: () => {
      invalidate();
      message.success('تم رفض الطلب / Order rejected');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل رفض الطلب / Failed to reject')),
  });

  const markInProgress = useMutation({
    mutationFn: () => HourlyWorkerRequestService.markInProgress(id),
    onSuccess: () => {
      invalidate();
      message.success('تم بدء التنفيذ / Marked in progress');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل بدء التنفيذ / Failed to start')),
  });

  const complete = useMutation({
    mutationFn: () => HourlyWorkerRequestService.complete(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إكمال الطلب / Order completed');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إكمال الطلب / Failed to complete')),
  });

  const cancel = useMutation({
    mutationFn: () => HourlyWorkerRequestService.cancel(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إلغاء الطلب / Order cancelled');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إلغاء الطلب / Failed to cancel')),
  });

  const assignWorkers = useMutation({
    mutationFn: (workerIds: string[]) =>
      // The Assign endpoint accepts either {workerId} or {workerIds:[...]}. Send both:
      // the array for multi-assign and the first id for back-compat with single-assign.
      HourlyWorkerRequestService.assign(id, { workerId: workerIds[0], workerIds }),
    onSuccess: () => {
      invalidate();
      message.success('تم تعيين العمال / Workers assigned');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل تعيين العمال / Failed to assign')),
  });

  const updateAssignmentStatus = useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: UpdateAssignmentStatusDto }) =>
      HourlyWorkerRequestService.updateAssignmentStatus(id, assignmentId, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث حالة التعيين / Assignment status updated');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل تحديث الحالة / Failed to update status')),
  });

  const unassign = useMutation({
    mutationFn: (assignmentId: string) =>
      HourlyWorkerRequestService.deleteAssignment(id, assignmentId),
    onSuccess: () => {
      invalidate();
      message.success('تم إلغاء تعيين العامل / Worker unassigned');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إلغاء التعيين / Failed to unassign')),
  });

  const addInternalNote = useMutation({
    mutationFn: (data: AddInternalNoteDto) => HourlyWorkerRequestService.addInternalNote(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة الملاحظة / Note added');
    },
    onError: (err) => message.error(getApiErrorMessage(err, 'فشل إضافة الملاحظة / Failed to add note')),
  });

  const assignDriver = useMutation({
    mutationFn: (data: AssignDriverDto) => HourlyWorkerOrderService.assignDriver(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تعيين السائق / Driver assigned');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل تعيين السائق / Failed to assign driver')),
  });

  const issueInvoice = useMutation({
    mutationFn: (data: IssueHourlyOrderInvoiceDto) =>
      HourlyWorkerOrderService.issueInvoice(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم إصدار الفاتورة / Invoice issued');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل إصدار الفاتورة / Failed to issue invoice')),
  });

  const bookAccommodation = useMutation({
    mutationFn: (data: BookHourlyOrderAccommodationDto) =>
      HourlyWorkerOrderService.bookAccommodation(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم حجز السكن / Accommodation booked');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل حجز السكن / Failed to book accommodation')),
  });

  const updateAccommodationStatus = useMutation({
    mutationFn: ({
      accommodationId,
      data,
    }: {
      accommodationId: string;
      data: UpdateHourlyAccommodationStatusDto;
    }) => HourlyWorkerOrderService.updateAccommodationStatus(id, accommodationId, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث حالة السكن / Accommodation status updated');
    },
    onError: (err) =>
      message.error(getApiErrorMessage(err, 'فشل تحديث حالة السكن / Failed to update accommodation')),
  });

  return {
    approve,
    reject,
    markInProgress,
    complete,
    cancel,
    assignWorkers,
    updateAssignmentStatus,
    unassign,
    addInternalNote,
    assignDriver,
    issueInvoice,
    bookAccommodation,
    updateAccommodationStatus,
  };
}
