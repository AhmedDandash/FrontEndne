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
  EndWorkerServiceDto,
  AssignWorkerDto,
  CreateMediationContractPaymentDto,
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
  updatedDateFrom?: string;
  updatedDateTo?: string;
  customerId?: string;
  workerId?: string;
  agentId?: string;
  marketerId?: string;
  /** Filter by the contract's own id (distinct from contractNumber). */
  contractId?: string;
  sortBy?: string;
  sortDescending?: boolean;
  // Advanced filters (ErpImprovementsJul2026).
  withoutAssignedWorker?: boolean;
  isPaid?: boolean;
  isUnpaid?: boolean;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  hasContractInsurance?: boolean;
  visaDateFrom?: string;
  visaDateTo?: string;
  externalStatusId?: number;
  manualContractStatus?: number;
  workerNumber?: string;
  visaStatus?: number;
  incompleteExternalStatusId?: number;
  pastExternalStatusId?: number;
  warrantyStatus?: number;
  createdBy?: string;
  cancellationDateFrom?: string;
  cancellationDateTo?: string;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  isReplacement?: boolean;
  musanedPaymentStatus?: 0 | 1 | 2;
  referenceNumber?: string;
  workersAddedToday?: boolean;
  religion?: 1 | 2 | 3;
  hasPreviousExperience?: boolean;
  jobId?: string;
  isVip?: boolean;
  /** Skip the fetch entirely — for callers that only need the list conditionally. Defaults to true. */
  enabled?: boolean;
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
    enabled: params?.enabled ?? true,
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
      UpdatedDateFrom: params?.updatedDateFrom,
      UpdatedDateTo: params?.updatedDateTo,
      CustomerId: params?.customerId,
      WorkerId: params?.workerId,
      AgentId: params?.agentId,
      MarketerId: params?.marketerId,
      ContractId: params?.contractId,
      SortBy: params?.sortBy,
      SortDescending: params?.sortDescending,
      WithoutAssignedWorker: params?.withoutAssignedWorker,
      IsPaid: params?.isPaid,
      IsUnpaid: params?.isUnpaid,
      PaymentDateFrom: params?.paymentDateFrom,
      PaymentDateTo: params?.paymentDateTo,
      HasContractInsurance: params?.hasContractInsurance,
      VisaDateFrom: params?.visaDateFrom,
      VisaDateTo: params?.visaDateTo,
      ExternalStatusId: params?.externalStatusId,
      ManualContractStatus: params?.manualContractStatus,
      WorkerNumber: params?.workerNumber,
      VisaStatus: params?.visaStatus,
      IncompleteExternalStatusId: params?.incompleteExternalStatusId,
      PastExternalStatusId: params?.pastExternalStatusId,
      WarrantyStatus: params?.warrantyStatus,
      CreatedBy: params?.createdBy,
      CancellationDateFrom: params?.cancellationDateFrom,
      CancellationDateTo: params?.cancellationDateTo,
      ArrivalDateFrom: params?.arrivalDateFrom,
      ArrivalDateTo: params?.arrivalDateTo,
      IsReplacement: params?.isReplacement,
      MusanedPaymentStatus: params?.musanedPaymentStatus,
      ReferenceNumber: params?.referenceNumber,
      WorkersAddedToday: params?.workersAddedToday,
      Religion: params?.religion,
      HasPreviousExperience: params?.hasPreviousExperience,
      JobId: params?.jobId,
      IsVip: params?.isVip,
    }),
    placeholderData: (previous) => previous,
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

  const endWorkerServiceMutation = useMutation({
    mutationFn: (data: EndWorkerServiceDto) => MediationContractService.endWorkerService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم إنهاء خدمة العامل / Worker service ended');
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل إنهاء خدمة العامل / Failed to end worker service')
      );
    },
  });

  const assignWorkerMutation = useMutation({
    mutationFn: (data: AssignWorkerDto) => MediationContractService.assignWorker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم إسناد العامل بنجاح / Worker assigned successfully');
    },
    onError: (error: any) => {
      message.error(
        getApiErrorMessage(error, 'فشل إسناد العامل / Failed to assign worker')
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
    endWorkerService: endWorkerServiceMutation.mutateAsync,
    assignWorker: assignWorkerMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isSigning: signMutation.isPending,
    isGeneratingDelivery: deliveryFormMutation.isPending,
    isSigningDelivery: signDeliveryMutation.isPending,
    isReturning: warrantyReturnMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isEndingWorkerService: endWorkerServiceMutation.isPending,
    isAssigningWorker: assignWorkerMutation.isPending,
  };
}

/** GET /api/Mediation/MediationContract/recruitment-requests */
export function useRecruitmentRequests(params?: {
  search?: string;
  branchId?: string;
  includeSubBranches?: boolean;
  pageSize?: number;
}) {
  const query = useQuery({
    queryKey: [QUERY_KEY, 'recruitment-requests', params],
    queryFn: () =>
      MediationContractService.getRecruitmentRequests({
        Search: params?.search,
        BranchId: params?.branchId,
        IncludeSubBranches: params?.branchId ? params?.includeSubBranches : undefined,
        PageSize: params?.pageSize ?? 50,
      }),
    placeholderData: (previous) => previous,
  });
  return {
    requests: query.data?.requests ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useMediationContract(id?: string | null) {
  return useQuery<MediationContractDetail>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => MediationContractService.getById(id!),
    enabled: !!id,
  });
}

/**
 * POST /api/Mediation/MediationContract/customer-payment — standalone so the
 * `[id]` detail route can record a payment without firing the paged list query.
 * Invalidating `[QUERY_KEY]` refreshes both the list and the detail queries.
 */
export function useRecordMediationPayment() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: CreateMediationContractPaymentDto) =>
      MediationContractService.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('تم تسجيل الدفعة بنجاح / Payment recorded successfully');
    },
    onError: (error: any) => {
      message.error(getApiErrorMessage(error, 'فشل تسجيل الدفعة / Failed to record payment'));
    },
  });
  return { recordPayment: mutation.mutateAsync, isRecordingPayment: mutation.isPending };
}

// NOTE: a dedicated status-history hook was removed — the contract detail
// response (`useMediationContract`) already embeds `statusHistories`, so a
// separate call would duplicate that data. The endpoint remains catalogued in
// api.config (MEDIATION_CONTRACT.STATUS_HISTORY) for any future standalone view.
