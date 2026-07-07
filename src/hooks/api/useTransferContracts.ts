/**
 * Transfer Contract Hooks
 * React Query hooks for Transfer Contract CRUD + lifecycle — /api/TransferContract
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { TransferContractService } from '@/services/transfer-contract.service';
import type { CreateTransferContractDto } from '@/types/api.types';

const QUERY_KEY = ['transfer-contracts'];

export interface TransferContractParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  // Branch scoping + advanced filters (TransferContractQuery — verified live).
  branchId?: string;
  includeSubBranches?: boolean;
  contractStatus?: number;
  contractNumber?: number;
  customerNationalId?: string;
  workerPassportNo?: string;
  customerPhone?: string;
  requestDateFrom?: string;
  requestDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
}

/** GET /api/TransferContract — paginated list */
export function useTransferContracts(params?: TransferContractParams) {
  // Drop null/empty values so the backend doesn't try to bind them.
  const clean = params
    ? (Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
      ) as TransferContractParams)
    : undefined;
  return useQuery({
    queryKey: [...QUERY_KEY, 'list', clean],
    queryFn: () => TransferContractService.getAll(clean),
  });
}

/** GET /api/TransferContract/{id} */
export function useTransferContract(id: string | undefined | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => TransferContractService.getById(id!),
    enabled: !!id,
  });
}

/** POST /api/TransferContract */
export function useCreateTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferContractDto) => TransferContractService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      message.success('تمت إضافة عقد نقل الكفالة بنجاح');
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        'فشل إنشاء عقد نقل الكفالة';
      message.error(msg);
    },
  });
}

/** DELETE /api/TransferContract/{id} — only Draft */
export function useDeleteTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TransferContractService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      message.success('تم حذف العقد بنجاح');
    },
    onError: (err: any) => {
      message.error(
        err.response?.data?.errors?.[0] || 'فشل حذف العقد — تأكد أن العقد في حالة مسودة'
      );
    },
  });
}

/** POST /api/TransferContract/{id}/sign — Draft → TransferCompleted */
export function useSignTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TransferContractService.sign(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', id] });
      message.success('تم توقيع العقد وإتمام نقل الكفالة بنجاح');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.errors?.[0] || 'فشل توقيع العقد');
    },
  });
}

/** POST /api/TransferContract/{id}/complete — manual completion (requires Approved) */
export function useCompleteTransferContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TransferContractService.complete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', id] });
      message.success('تم إتمام العقد بنجاح');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.errors?.[0] || 'فشل إتمام العقد');
    },
  });
}

/**
 * PATCH /api/TransferContract/{id}/authority-status
 * status: 4=SentToAuthorities, 5=Approved, 6=Rejected
 */
export function useUpdateTransferContractAuthorityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: number; note?: string }) =>
      TransferContractService.updateAuthorityStatus(id, { status, note }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', vars.id] });
      message.success('تم تحديث حالة الجهة بنجاح');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.errors?.[0] || 'فشل تحديث حالة الجهة');
    },
  });
}
