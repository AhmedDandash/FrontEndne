/**
 * Transfer Contract Hooks
 * React Query hooks for Transfer Contract CRUD + lifecycle — /api/TransferContract
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { TransferContractService } from '@/services/transfer-contract.service';
import type { CreateTransferContractDto, UpdateTransferContractDto } from '@/types/api.types';

const QUERY_KEY = ['transfer-contracts'];

export function useTransferContracts(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => TransferContractService.getAll(params),
  });
}

export function useTransferContract(id: number | string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => TransferContractService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferContractDto) => TransferContractService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تمت إضافة عقد النقل بنجاح / Transfer contract created successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إضافة عقد النقل / Failed to create transfer contract');
    },
  });
}

export function useUpdateTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateTransferContractDto }) =>
      TransferContractService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم تحديث عقد النقل بنجاح / Transfer contract updated successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث عقد النقل / Failed to update transfer contract');
    },
  });
}

export function useDeleteTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => TransferContractService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم حذف عقد النقل بنجاح / Transfer contract deleted successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل حذف عقد النقل / Failed to delete transfer contract');
    },
  });
}

/** POST /api/TransferContract/{id}/sign — Draft → Signed */
export function useSignTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => TransferContractService.sign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم توقيع عقد النقل بنجاح / Transfer contract signed successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل توقيع عقد النقل / Failed to sign transfer contract');
    },
  });
}

/** POST /api/TransferContract/{id}/complete — Signed → Completed */
export function useCompleteTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => TransferContractService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم إتمام عقد النقل بنجاح / Transfer contract completed successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل إتمام عقد النقل / Failed to complete transfer contract');
    },
  });
}

/**
 * PATCH /api/TransferContract/{id}/authority-status?status=&note=
 * Pass status (TransferContractStatus 1-7) and optional note as query params.
 */
export function useUpdateTransferContractAuthorityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: number | string; status?: number; note?: string }) =>
      TransferContractService.updateAuthorityStatus(id, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('تم تحديث حالة الجهة بنجاح / Authority status updated successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'فشل تحديث حالة الجهة / Failed to update authority status');
    },
  });
}
