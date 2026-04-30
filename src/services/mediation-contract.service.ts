/**
 * Mediation Contract Service
 * Handles all mediation contract-related API calls — endpoints per PDF spec only
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  MediationContract,
  CreateMediationContractDto,
  ContractCancelDto,
  SignMediationContractDto,
  DeliveryFormDto,
  DeliveryFormSignDto,
  WarrantyReturnDto,
  UpdateContractStatusDto,
  ContractStatusHistory,
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

  static async getAll(): Promise<MediationContract[]> {
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT.GET_ALL, {
      params: { PageSize: 9999, PageNumber: 1 },
    });
    return this.unwrapList<MediationContract>(response.data);
  }

  static async getById(id: number): Promise<MediationContract> {
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT.GET_BY_ID(id));
    return this.unwrap<MediationContract>(response.data);
  }

  static async create(data: CreateMediationContractDto): Promise<MediationContract> {
    const payload = {
      ...data,
      contractType: data.contractType != null ? Number(data.contractType) : null,
      customerId: data.customerId != null ? Number(data.customerId) : null,
      marketerId: data.marketerId != null ? Number(data.marketerId) : null,
      contractCategory: data.contractCategory != null ? Number(data.contractCategory) : null,
      offerId: data.offerId != null ? Number(data.offerId) : null,
      visaType: data.visaType != null ? Number(data.visaType) : null,
      arrivalDestinationId:
        data.arrivalDestinationId != null ? Number(data.arrivalDestinationId) : null,
      otherCosts: data.otherCosts != null ? Number(data.otherCosts) : null,
      managerDiscount: data.managerDiscount != null ? Number(data.managerDiscount) : null,
      costDiscount: data.costDiscount != null ? Number(data.costDiscount) : null,
      domesticWorkerInsurance:
        data.domesticWorkerInsurance != null ? Number(data.domesticWorkerInsurance) : null,
    };
    const response = await api.post<any>(API_ENDPOINTS.MEDIATION_CONTRACT.CREATE, payload);
    return this.unwrap<MediationContract>(response.data);
  }

  static async cancelContract(data: ContractCancelDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.CONTRACT_CANCEL, {
      contractId: Number(data.contractId),
      cancelBy: data.cancelBy != null ? Number(data.cancelBy) : null,
      cancelNote: data.cancelNote || null,
    });
    return this.unwrap<any>(response.data);
  }

  // ==================== Lifecycle Transitions ====================

  static async sign(data: SignMediationContractDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.SIGN, {
      contractId: Number(data.contractId),
      musanedContractNumber: data.musanedContractNumber,
      musanedDocumentationNumber: data.musanedDocumentationNumber || null,
    });
    return this.unwrap<any>(response.data);
  }

  static async generateDeliveryForm(data: DeliveryFormDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.DELIVERY_FORM, {
      contractId: Number(data.contractId),
      deliveryDate: data.deliveryDate || null,
      notes: data.notes || null,
    });
    return this.unwrap<any>(response.data);
  }

  static async signDelivery(data: DeliveryFormSignDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.DELIVERY_FORM_SIGN, {
      contractId: Number(data.contractId),
      customerSignedAt: data.customerSignedAt || new Date().toISOString(),
    });
    return this.unwrap<any>(response.data);
  }

  static async warrantyReturn(data: WarrantyReturnDto): Promise<any> {
    const response = await api.post(API_ENDPOINTS.MEDIATION_CONTRACT.WARRANTY_RETURN, {
      contractId: Number(data.contractId),
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

  static async getStatusHistory(contractId: string): Promise<ContractStatusHistory[]> {
    const response = await api.get<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT.STATUS_HISTORY(contractId)
    );
    return this.unwrapList<ContractStatusHistory>(response.data);
  }
}
