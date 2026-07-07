/**
 * useMediationContracts Hook
 * React Query hooks for mediation contract operations — PDF spec endpoints only
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { MediationContractService } from '@/services/mediation-contract.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type {
  MediationContractDetail,
  CreateMediationContractDto,
  ContractCancelDto,
  SignMediationContractDto,
  DeliveryFormDto,
  DeliveryFormSignDto,
  WarrantyReturnDto,
  UpdateContractStatusDto,
} from '@/types/api.types';

const QUERY_KEY = 'mediation-contracts';

export interface MediationContractListParams {
  pageNumber?: number;
  pageSize?: number;
  // Optional server-side filters
  statusId?: number;
  contractNumber?: number;
  musanedContractNumber?: string;
  workerPassportNumber?: string;
  customerNationalId?: string;
  nationalityId?: string;
  workerType?: number;
  dateFrom?: string;
  dateTo?: string;
  // Branch scoping + shared advanced filters
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  contractType?: number;
  customerPhone?: string;
  visaNumber?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
}

export function useMediationContracts(params?: MediationContractListParams) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, 'list', params],
    queryFn: () => MediationContractService.getAll({
      Page: params?.pageNumber ?? 1,
      PageSize: params?.pageSize ?? 10,
      StatusId: params?.statusId,
      ContractNumber: params?.contractNumber,
      MusanedContractNumber: params?.musanedContractNumber,
      WorkerPassportNumber: params?.workerPassportNumber,
      CustomerNationalId: params?.customerNationalId,
      NationalityId: params?.nationalityId,
      WorkerType: params?.workerType,
      DateFrom: params?.dateFrom,
      DateTo: params?.dateTo,
      BranchId: params?.branchId,
      IncludeSubBranches: params?.branchId ? params?.includeSubBranches : undefined,
      Search: params?.search,
      ContractType: params?.contractType,
      CustomerPhone: params?.customerPhone,
      VisaNumber: params?.visaNumber,
      CreatedDateFrom: params?.createdDateFrom,
      CreatedDateTo: params?.createdDateTo,
    }),
  });

  const contracts = data?.contracts;
  const total = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (data: CreateMediationContractDto) => MediationContractService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تمت إضافة عقد الوساطة بنجاح / Mediation contract created successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل إضافة العقد / Failed to create contract'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (data: ContractCancelDto) => MediationContractService.cancelContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم إلغاء العقد بنجاح / Contract cancelled successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل إلغاء العقد / Failed to cancel contract'));
    },
  });

  const signMutation = useMutation({
    mutationFn: (data: SignMediationContractDto) => MediationContractService.sign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم توقيع العقد بنجاح / Contract signed successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل توقيع العقد / Failed to sign contract'));
    },
  });

  const deliveryFormMutation = useMutation({
    mutationFn: (data: DeliveryFormDto) => MediationContractService.generateDeliveryForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم إصدار نموذج الاستلام / Delivery form generated');
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل إصدار النموذج / Failed to generate delivery form')
      );
    },
  });

  const signDeliveryMutation = useMutation({
    mutationFn: (data: DeliveryFormSignDto) => MediationContractService.signDelivery(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success(
        'تم تأكيد الاستلام وبدأت فترة الضمان / Delivery confirmed — warranty period started'
      );
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل تأكيد الاستلام / Failed to confirm delivery')
      );
    },
  });

  const warrantyReturnMutation = useMutation({
    mutationFn: (data: WarrantyReturnDto) => MediationContractService.warrantyReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success(
        'تم تسجيل الإرجاع ضمن فترة الضمان / Warranty return recorded successfully'
      );
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل تسجيل الإرجاع / Failed to record warranty return')
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateContractStatusDto) => MediationContractService.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تحديث الحالة بنجاح / Status updated successfully');
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل تحديث الحالة / Failed to update status')
      );
    },
  });

  return {
    contracts,
    total,
    isLoading,
    error,
    refetch,
    createContract: createMutation.mutateAsync,
    cancelContract: cancelMutation.mutateAsync,
    signContract: signMutation.mutateAsync,
    generateDeliveryForm: deliveryFormMutation.mutateAsync,
    signDelivery: signDeliveryMutation.mutateAsync,
    warrantyReturn: warrantyReturnMutation.mutateAsync,
    updateContractStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isSigning: signMutation.isPending,
    isGeneratingDelivery: deliveryFormMutation.isPending,
    isSigningDelivery: signDeliveryMutation.isPending,
    isReturning: warrantyReturnMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export function useMediationContract(id?: string | null) {
  return useQuery<MediationContractDetail>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => MediationContractService.getById(id!),
    enabled: !!id,
  });
}

// NOTE: a dedicated status-history hook was removed — the contract detail
// response (`useMediationContract`) already embeds `statusHistories`, so a
// separate call would duplicate that data. The endpoint remains catalogued in
// api.config (MEDIATION_CONTRACT.STATUS_HISTORY) for any future standalone view.
