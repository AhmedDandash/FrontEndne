import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  MediationContract,
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
  RecruitmentRequestItem,
  CreateMediationContractPaymentDto,
  RecordMediationPaymentResult,
} from '@/types/api.types';

export class MediationContractService {
  private static normalizeKeys<T extends Record<string, any>>(item: T): T {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;

    return Object.entries(item).reduce<Record<string, any>>((acc, [key, value]) => {
      acc[key] = value;
      acc[key.charAt(0).toLowerCase() + key.slice(1)] = value;
      return acc;
    }, {}) as T;
  }

  private static normalizeContract(item: any): MediationContract {
    const contract = this.normalizeKeys(item);
    return {
      ...contract,
      id: contract.id ?? contract.ID,
      agentCostSAR: contract.agentCostSAR ?? contract.agentCostSar,
    } as MediationContract;
  }

  private static unwrap<T>(payload: any): T {
    return this.normalizeKeys(payload?.data?.value ?? payload?.value ?? payload?.data ?? payload) as T;
  }

  private static unwrapList<T>(payload: any): T[] {
    const candidates = [
      payload,
      payload?.data,
      payload?.data?.value,
      payload?.value,
      payload?.result,
      payload?.data?.result,
      payload?.items,
      payload?.data?.items,
      payload?.value?.items,
      payload?.data?.value?.items,
      payload?.records,
      payload?.data?.records,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate.map((item) => this.normalizeContract(item)) as T[];
      if (Array.isArray(candidate?.$values)) {
        return candidate.$values.map((item: any) => this.normalizeContract(item)) as T[];
      }
    }

    console.warn('[MediationContractService] Unexpected response shape:', payload);
    return [];
  }

  static async getAll(params?: {
    // NOTE: the API paginates with `Page` (NOT `PageNumber`). Sending the wrong
    // name is silently ignored server-side and always returns page 1.
    Page?: number;
    PageSize?: number;
    // Optional server-side filters supported by the endpoint.
    StatusId?: number;
    ContractNumber?: number;
    MusanedContractNumber?: string;
    WorkerPassportNumber?: string;
    CustomerNationalId?: string;
    NationalityId?: string;
    WorkerType?: number;
    DateFrom?: string;
    DateTo?: string;
    // Branch scoping + shared advanced filters (FilterMediationContractDto).
    BranchId?: string;
    IncludeSubBranches?: boolean;
    Search?: string;
    ContractType?: number;
    CustomerId?: string;
    WorkerId?: string;
    AgentId?: string;
    MarketerId?: string;
    CustomerPhone?: string;
    VisaNumber?: string;
    CreatedDateFrom?: string;
    CreatedDateTo?: string;
    UpdatedDateFrom?: string;
    UpdatedDateTo?: string;
    // Filter by the contract's own id (distinct from ContractNumber).
    ContractId?: string;
    SortBy?: string;
    SortDescending?: boolean;
    // Advanced filters (ErpImprovementsJul2026).
    WithoutAssignedWorker?: boolean;
    IsPaid?: boolean;
    IsUnpaid?: boolean;
    PaymentDateFrom?: string;
    PaymentDateTo?: string;
  }): Promise<{ contracts: MediationContract[]; total: number }> {
    const query: Record<string, any> = {
      Page: params?.Page ?? 1,
      PageSize: params?.PageSize ?? 10,
    };
    // Forward optional filters, dropping null/empty values.
    if (params) {
      (
        [
          'StatusId',
          'ContractNumber',
          'MusanedContractNumber',
          'WorkerPassportNumber',
          'CustomerNationalId',
          'NationalityId',
          'WorkerType',
          'DateFrom',
          'DateTo',
          'BranchId',
          'IncludeSubBranches',
          'Search',
          'ContractType',
          'CustomerId',
          'WorkerId',
          'AgentId',
          'MarketerId',
          'CustomerPhone',
          'VisaNumber',
          'CreatedDateFrom',
          'CreatedDateTo',
          'UpdatedDateFrom',
          'UpdatedDateTo',
          'ContractId',
          'SortBy',
          'SortDescending',
          'WithoutAssignedWorker',
          'IsPaid',
          'IsUnpaid',
          'PaymentDateFrom',
          'PaymentDateTo',
        ] as const
      ).forEach((key) => {
        const value = params[key];
        if (value != null && value !== '') query[key] = value;
      });
    }

    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT.GET_ALL, {
      params: query,
    });
    const payload = response.data;
    const contracts = this.unwrapList<MediationContract>(payload);
    const total: number =
      payload?.total ??
      payload?.data?.total ??
      payload?.value?.total ??
      payload?.totalCount ??
      payload?.data?.totalCount ??
      payload?.data?.value?.totalCount ??
      contracts.length;
    return { contracts, total };
  }

  static async getById(id: string): Promise<MediationContractDetail> {
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT.GET_BY_ID(id));
    return this.unwrap<MediationContractDetail>(response.data);
  }

  static async create(data: CreateMediationContractDto): Promise<MediationContract> {
    const form = new FormData();

    const append = (key: string, value: any) => {
      if (value != null) form.append(key, String(value));
    };

    append('CustomerId', data.customerId);
    append('WorkerId', data.workerId);
    append('WorkerPassportNumber', data.workerPassportNumber);
    append('OfferId', data.offerId);
    append('ContractType', data.contractType != null ? Number(data.contractType) : 0);
    if (data.contractCategory != null) append('ContractCategory', Number(data.contractCategory));
    if (data.marketerId) append('MarketerId', data.marketerId);
    if (data.visaNumber) append('VisaNumber', data.visaNumber);
    if (data.visaDate) append('VisaDate', data.visaDate);
    // visaType removed from creation (ErpImprovementsJul2026) — no longer sent.
    if (data.visaDateHijri) append('VisaDateHijri', data.visaDateHijri);
    if (data.isComprehensiveQualificationVisa != null)
      append('IsComprehensiveQualificationVisa', data.isComprehensiveQualificationVisa);
    if (data.arrivalDestinationId != null) append('ArrivalDestinationId', Number(data.arrivalDestinationId));
    if (data.otherCosts != null) append('OtherCosts', Number(data.otherCosts));
    if (data.managerDiscount != null) append('ManagerDiscount', Number(data.managerDiscount));
    if (data.costDiscount != null) append('CostDiscount', Number(data.costDiscount));
    if (data.costDescription) append('CostDescription', data.costDescription);
    form.append('HasContractInsurance', String(data.hasContractInsurance ?? false));
    if (data.domesticWorkerInsurance != null) append('DomesticWorkerInsurance', Number(data.domesticWorkerInsurance));
    if (data.musanedContractNumber) append('MusanedContractNumber', data.musanedContractNumber);
    if (data.musanedDocumentationNumber) append('MusanedDocumentationNumber', data.musanedDocumentationNumber);

    if (data.attachments?.length) {
      data.attachments.forEach((file) => form.append('Attachments', file));
    }

    const response = await api.post<any>(API_ENDPOINTS.MEDIATION_CONTRACT.CREATE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.unwrap<MediationContract>(response.data);
  }

  static async cancelContract(data: ContractCancelDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.CONTRACT_CANCEL, {
      contractId: data.contractId,
      cancelBy: data.cancelBy != null ? Number(data.cancelBy) : null,
      cancelNote: data.cancelNote || null,
    });
    return this.unwrap<any>(response.data);
  }

  /** POST /api/Mediation/MediationContract/customer-payment — records a customer payment. */
  static async recordPayment(
    data: CreateMediationContractPaymentDto
  ): Promise<RecordMediationPaymentResult> {
    // NOTE: `paymentMethod` maps to a NON-nullable C# enum (PaymentMethodType) —
    // swagger has no `nullable: true` on it, unlike the other optional fields.
    // Sending JSON `null` breaks server-side deserialization (400 Bad Request),
    // so the key is OMITTED entirely when the user doesn't pick a method.
    const body: Record<string, any> = {
      contractId: data.contractId,
      amount: data.amount,
      paymentDate: data.paymentDate ?? null,
      bankFees: data.bankFees ?? null,
      referenceNumber: data.referenceNumber || null,
      notes: data.notes || null,
      description: data.description || null,
    };
    if (data.paymentMethod != null) body.paymentMethod = Number(data.paymentMethod);
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.CUSTOMER_PAYMENT, body);
    return this.unwrap<RecordMediationPaymentResult>(response.data);
  }

  // ==================== Lifecycle Transitions ====================

  static async sign(data: SignMediationContractDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.SIGN, {
      contractId: data.contractId,
      musanedContractNumber: data.musanedContractNumber,
      invoicePaymentDate: data.invoicePaymentDate ?? null,
    });
    return this.unwrap<any>(response.data);
  }

  static async generateDeliveryForm(data: DeliveryFormDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.DELIVERY_FORM, {
      contractId: data.contractId,
      deliveryDate: data.deliveryDate || null,
      notes: data.notes || null,
    });
    return this.unwrap<any>(response.data);
  }

  static async signDelivery(data: DeliveryFormSignDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.DELIVERY_FORM_SIGN, {
      contractId: data.contractId,
      customerSignedAt: data.customerSignedAt || new Date().toISOString(),
    });
    return this.unwrap<any>(response.data);
  }

  static async warrantyReturn(data: WarrantyReturnDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.WARRANTY_RETURN, {
      contractId: data.contractId,
      returnDate: data.returnDate,
      returnReason: Number(data.returnReason),
      daysWithCustomer: Number(data.daysWithCustomer),
      newWorkerLocation: data.newWorkerLocation || null,
      notes: data.notes || null,
    });
    return this.unwrap<any>(response.data);
  }

  static async updateStatus(data: UpdateContractStatusDto): Promise<any> {
    const response = await api.put(API_ENDPOINTS.MEDIATION_CONTRACT.UPDATE_STATUS, {
      contractId: data.contractId,
      newStatus: Number(data.newStatus),
      notes: data.notes || null,
    });
    return this.unwrap<any>(response.data);
  }

  // ==================== Worker Assignment ====================

  /** POST /api/Mediation/MediationContract/end-worker-service */
  static async endWorkerService(data: EndWorkerServiceDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.END_WORKER_SERVICE, {
      contractId: data.contractId,
      reason: data.reason || null,
    });
    return this.unwrap<any>(response.data);
  }

  /** POST /api/Mediation/MediationContract/assign-worker */
  static async assignWorker(data: AssignWorkerDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.ASSIGN_WORKER, {
      contractId: data.contractId,
      workerId: data.workerId,
      workerPassportNumber: data.workerPassportNumber,
    });
    return this.unwrap<any>(response.data);
  }

  // ==================== Recruitment Requests ====================

  /**
   * GET /api/Mediation/MediationContract/recruitment-requests
   * Returns `{ items, total }`; each item shows either a specific worker or the
   * `workerSelectionLabel` ("any matching worker").
   */
  static async getRecruitmentRequests(params?: {
    Page?: number;
    PageSize?: number;
    Search?: string;
    BranchId?: string;
    IncludeSubBranches?: boolean;
  }): Promise<{ requests: RecruitmentRequestItem[]; total: number }> {
    const query: Record<string, any> = {
      Page: params?.Page ?? 1,
      PageSize: params?.PageSize ?? 50,
    };
    (['Search', 'BranchId', 'IncludeSubBranches'] as const).forEach((key) => {
      const value = params?.[key];
      if (value != null && value !== '') query[key] = value;
    });
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT.RECRUITMENT_REQUESTS, {
      params: query,
    });
    const payload = response.data;
    const requests = this.unwrapList<RecruitmentRequestItem>(payload);
    const total: number =
      payload?.data?.totalCount ??
      payload?.totalCount ??
      payload?.data?.total ??
      payload?.total ??
      requests.length;
    return { requests, total };
  }
}
