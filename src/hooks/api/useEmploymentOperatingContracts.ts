/**
 * useEmploymentOperatingContracts Hook
 * Migrated to new API contract.
 *
 * Breaking changes from old hook:
 *  - endContract removed → use signContract / startExecution / renewContract / terminateContract
 *  - New mutations: signContract, startExecution, renewContract, terminateContract, printReceiptForm
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  EmploymentOperatingContractService,
  type GetContractsParams,
} from '@/services/employment-operating-contract.service';
import type {
  CreateEmploymentOperatingContractDto,
  UpdateEmploymentOperatingContractDto,
} from '@/types/api.types';

const QUERY_KEY = 'employment-operating-contracts';

export function useEmploymentOperatingContracts(
  params?: GetContractsParams | Record<string, any>
) {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة العقد بنجاح / Contract created successfully');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل إضافة العقد / Failed to create contract'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateEmploymentOperatingContractDto }) =>
      EmploymentOperatingContractService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث العقد بنجاح / Contract updated successfully');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل تحديث العقد / Failed to update contract'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم حذف العقد بنجاح / Contract deleted successfully');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل حذف العقد / Failed to delete contract'
      );
    },
  });

  // ─── Lifecycle Transitions ─────────────────────────────────────────────────

  /** Draft → Signed */
  const signMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.sign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم توقيع العقد / Contract signed');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'فشل توقيع العقد / Failed to sign contract');
    },
  });

  /** Signed → Executing (worker goes to customer) */
  const startExecutionMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.startExecution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('بدأ تنفيذ العقد / Contract execution started');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل بدء التنفيذ / Failed to start execution'
      );
    },
  });

  /**
   * Extend end date (while Executing)
   * Body: raw date-time string — pass newEndDate as ISO string e.g. "2025-12-31T00:00:00"
   */
  const renewMutation = useMutation({
    mutationFn: ({ id, newEndDate }: { id: number | string; newEndDate: string }) =>
      EmploymentOperatingContractService.renew(id, newEndDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تجديد العقد / Contract renewed');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل تجديد العقد / Failed to renew contract'
      );
    },
  });

  /**
   * Executing → Finished (worker returns to accommodation)
   * Body: raw note string
   */
  const terminateMutation = useMutation({
    mutationFn: ({ id, note }: { id: number | string; note: string }) =>
      EmploymentOperatingContractService.terminate(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم إنهاء العقد / Contract terminated');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل إنهاء العقد / Failed to terminate contract'
      );
    },
  });

  /** Fetch print receipt form data */
  const printReceiptFormMutation = useMutation({
    mutationFn: (id: number | string) => EmploymentOperatingContractService.printReceiptForm(id),
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'فشل جلب بيانات الطباعة / Failed to fetch print data'
      );
    },
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
    printReceiptForm: printReceiptFormMutation.mutateAsync,
    isSigning: signMutation.isPending,
    isStartingExecution: startExecutionMutation.isPending,
    isRenewing: renewMutation.isPending,
    isTerminating: terminateMutation.isPending,
  };
}
