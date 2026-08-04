/**
 * useWorkerDeliveryRecord Hook — signed handover receipt (FEdits-2 §5).
 *
 * The backend exposes no list/by-contract lookup for this entity, so the
 * frontend can't rediscover a record it created after a page reload. Stopgap
 * (accepted for v1 — see Q6 in the roadmap): remember the created id in
 * localStorage per contract. Works for the person who created it, on that
 * device; fragile across devices/users. Escalate to the backend team for a
 * `GET /api/WorkerDeliveryRecord/by-contract/{contractId}` if this needs to
 * be more robust later.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { message } from 'antd';
import { WorkerDeliveryRecordService } from '@/services/worker-delivery-record.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  CreateWorkerDeliveryRecordDto,
  UpdateWorkerDeliveryRecordDto,
} from '@/types/api.types';

const QUERY_KEY = 'worker-delivery-record';

function storageKey(contractId: string): string {
  return `sigma.workerDeliveryRecord.${contractId}`;
}

/** Reads the locally-remembered record id for a contract, if any. */
export function getStoredWorkerDeliveryRecordId(contractId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(storageKey(contractId));
  } catch {
    return null;
  }
}

function storeWorkerDeliveryRecordId(contractId: string, recordId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(contractId), recordId);
  } catch {
    // localStorage unavailable (private mode, quota) — non-fatal, just means
    // the receipt won't be re-discoverable next visit.
  }
}

/** GET /api/WorkerDeliveryRecord/{id} — enabled only once a local id is known. */
export function useWorkerDeliveryRecord(id: string | null | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => WorkerDeliveryRecordService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateWorkerDeliveryRecord() {
  return useMutation({
    mutationFn: (data: CreateWorkerDeliveryRecordDto) =>
      WorkerDeliveryRecordService.create(data),
    onSuccess: (created) => {
      if (created?.id && created.operationContractId) {
        storeWorkerDeliveryRecordId(created.operationContractId, created.id);
      }
      message.success('تم حفظ إيصال الاستلام / Handover receipt saved');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل حفظ إيصال الاستلام / Failed to save receipt')),
  });
}

export function useUpdateWorkerDeliveryRecord() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkerDeliveryRecordDto }) =>
      WorkerDeliveryRecordService.update(id, data),
    onSuccess: () => {
      message.success('تم تحديث إيصال الاستلام / Handover receipt updated');
    },
    onError: (error) =>
      message.error(
        getApiErrorMessage(error, 'فشل تحديث إيصال الاستلام / Failed to update receipt')
      ),
  });
}

export function usePrintWorkerDeliveryRecord() {
  return useMutation({
    mutationFn: (id: string) => WorkerDeliveryRecordService.print(id),
    onError: (error) =>
      message.error(
        getApiErrorMessage(error, 'فشل جلب بيانات الطباعة / Failed to fetch print data')
      ),
  });
}
