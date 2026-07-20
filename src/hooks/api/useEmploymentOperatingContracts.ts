/**
 * useEmploymentOperatingContracts Hook
 * Migrated to new API contract.
 *
 * Lifecycle mutations:
 *  signContract → startExecution → renewContract / terminateContract → recordCustomerRefund
 *
 * Error handling is delegated to the shared `getApiErrorMessage` helper so every
 * mutation surfaces server validation messages consistently (bilingual fallback).
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { message } from 'antd';
import {
  EmploymentOperatingContractService,
  type GetContractsParams,
} from '@/services/employment-operating-contract.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  CreateEmploymentOperatingContractDto,
  UpdateEmploymentOperatingContractDto,
  TerminateContractDto,
  CustomerRefundDto,
  SaveDeliveryFormDto,
} from '@/types/api.types';

const QUERY_KEY = 'employment-operating-contracts';

/**
 * GET /api/EmploymentOperatingContract/{id} — standalone single-record hook.
 * Mirrors `useMediationContract` / `useTransferContract` so the `[id]` route
 * page doesn't need to mount the full (unpaginated) list hook just to fetch
 * one record.
 */
export function useEmploymentOperatingContract(id: number | string | undefined | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => EmploymentOperatingContractService.getById(id!),
    enabled: !!id,
  });
}

/**
 * Server-side paginated + filtered rent contracts (real PageNumber/PageSize,
 * search/contractNumber/marketerId/date range pushed to the backend).
 * Kept separate from `useEmploymentOperatingContracts` (used elsewhere as an
 * unpaginated reference list) so this is purely additive.
 */
export function useEmploymentOperatingContractsFiltered(params?: GetContractsParams) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employment-operating-contracts', 'filtered', params],
    queryFn: () => EmploymentOperatingContractService.getPaged(params),
    placeholderData: keepPreviousData,
  });

  return {
    contracts: data?.items ?? [],
    total: data?.totalCount ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useEmploymentOperatingContracts(
  params?: GetContractsParams | Record<string, any>
) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

  const {
    data: contracts,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => EmploymentOperatingContractService.getAll(params),
  });

  const useContract = (id: number | string) =>
    useQuery({
      queryKey: [QUERY_KEY, id],
      queryFn: () => EmploymentOperatingContractService.getById(id),
      enabled: !!id,
    });

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: CreateEmploymentOperatingContractDto) =>
      EmploymentOperatingContractService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تمت إضافة العقد بنجاح / Contract created successfully');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل إضافة العقد / Failed to create contract')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateEmploymentOperatingContractDto }) =>
      EmploymentOperatingContractService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث العقد بنجاح / Contract updated successfully');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل تحديث العقد / Failed to update contract')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.delete(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف العقد بنجاح / Contract deleted successfully');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل حذف العقد / Failed to delete contract')),
  });

  // ─── Lifecycle Transitions ─────────────────────────────────────────────────

  /** Draft → Signed */
  const signMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.sign(id),
    onSuccess: () => {
      invalidate();
      message.success('تم توقيع العقد / Contract signed');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل توقيع العقد / Failed to sign contract')),
  });

  /** Signed → Executing (worker goes to customer) */
  const startExecutionMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.startExecution(id),
    onSuccess: () => {
      invalidate();
      message.success('بدأ تنفيذ العقد / Contract execution started');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل بدء التنفيذ / Failed to start execution')),
  });

  /**
   * Extend end date (while Executing)
   * Body: raw date-time string — pass newEndDate as ISO string e.g. "2025-12-31T00:00:00"
   */
  const renewMutation = useMutation({
    mutationFn: ({ id, newEndDate }: { id: number | string; newEndDate: string }) =>
      EmploymentOperatingContractService.renew(id, newEndDate),
    onSuccess: () => {
      invalidate();
      message.success('تم تجديد العقد / Contract renewed');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل تجديد العقد / Failed to renew contract')),
  });

  /**
   * Executing → Finished (worker returns to accommodation).
   * Creates a Draft credit note; cash refund (if any) is paid out separately.
   */
  const terminateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: TerminateContractDto }) =>
      EmploymentOperatingContractService.terminate(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم إنهاء العقد / Contract terminated');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل إنهاء العقد / Failed to terminate contract')),
  });

  /** Pay the customer back their refund after termination */
  const customerRefundMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: CustomerRefundDto }) =>
      EmploymentOperatingContractService.recordCustomerRefund(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تسجيل استرداد العميل / Customer refund recorded');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل تسجيل الاسترداد / Failed to record refund')),
  });

  /** Fetch print receipt form data */
  const printReceiptFormMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.printReceiptForm(id),
    onError: (error) =>
      message.error(
        getApiErrorMessage(error, 'فشل جلب بيانات الطباعة / Failed to fetch print data')
      ),
  });

  /** Fetch delivery-form print data */
  const printDeliveryFormMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.printDeliveryForm(id),
    onError: (error) =>
      message.error(
        getApiErrorMessage(error, 'فشل جلب نموذج التسليم / Failed to fetch delivery form')
      ),
  });

  /** Save delivery-form (date / employee name / signatures) */
  const saveDeliveryFormMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: SaveDeliveryFormDto }) =>
      EmploymentOperatingContractService.saveDeliveryForm(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم حفظ نموذج التسليم / Delivery form saved');
    },
    onError: (error) =>
      message.error(getApiErrorMessage(error, 'فشل حفظ نموذج التسليم / Failed to save delivery form')),
  });

  return {
    contracts,
    isLoading,
    error,
    refetch,
    useContract,
    // CRUD
    createContract: createMutation.mutate,
    updateContract: updateMutation.mutate,
    deleteContract: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    // Lifecycle
    signContract: signMutation.mutate,
    startExecution: startExecutionMutation.mutate,
    renewContract: renewMutation.mutate,
    terminateContract: terminateMutation.mutate,
    recordCustomerRefund: customerRefundMutation.mutate,
    printReceiptForm: printReceiptFormMutation.mutateAsync,
    printDeliveryForm: printDeliveryFormMutation.mutateAsync,
    saveDeliveryForm: saveDeliveryFormMutation.mutateAsync,
    isSigning: signMutation.isPending,
    isStartingExecution: startExecutionMutation.isPending,
    isRenewing: renewMutation.isPending,
    isTerminating: terminateMutation.isPending,
    isRefunding: customerRefundMutation.isPending,
    isSavingDeliveryForm: saveDeliveryFormMutation.isPending,
  };
}
