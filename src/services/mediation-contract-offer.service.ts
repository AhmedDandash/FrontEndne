import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  MediationContractOffer,
  CreateMediationContractOfferDto,
  UpdateMediationContractOfferDto,
  MediationOfferAutoFillDto,
} from '@/types/api.types';

/**
 * Optional server-side filters for GET /api/Mediation/MediationContractOffer.
 * This is bounded reference/picker data so the service still fetches "all"
 * (Page=1, PageSize=9999) — but sending these cheap query params server-side
 * is strictly better than fetching everything and filtering client-side.
 */
export interface MediationOfferQuery {
  OfferNumber?: number | string;
  NationalityId?: string;
  JobId?: string;
  WorkerType?: number;
  PreviousExperience?: number;
  IsActive?: boolean;
  ShowForExternalCustomers?: boolean;
  ShowForReception?: boolean;
  // Extra range filters (gap audit — verified live).
  SalaryMin?: number;
  SalaryMax?: number;
  LocalCostMin?: number;
  LocalCostMax?: number;
  AgentCostSARMin?: number;
  AgentCostSARMax?: number;
}

export class MediationContractOfferService {
  private static normalizeKeys<T extends Record<string, any>>(item: T): T {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;

    return Object.entries(item).reduce<Record<string, any>>((acc, [key, value]) => {
      acc[key] = value;
      acc[key.charAt(0).toLowerCase() + key.slice(1)] = value;
      return acc;
    }, {}) as T;
  }

  private static normalizeOffer(item: any): MediationContractOffer {
    const offer = this.normalizeKeys(item);
    return {
      ...offer,
      id: offer.id ?? offer.ID ?? offer.offerId ?? offer.mediationContractOfferId,
      nationalityId: offer.nationalityId ?? offer.nationalityID,
      jobId: offer.jobId ?? offer.jobID,
      agentCostSAR: offer.agentCostSAR ?? offer.agentCostSar,
    } as MediationContractOffer;
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
      if (Array.isArray(candidate)) return candidate.map((item) => this.normalizeOffer(item)) as T[];
      if (Array.isArray(candidate?.$values)) {
        return candidate.$values.map((item: any) => this.normalizeOffer(item)) as T[];
      }
    }

    console.warn('[MediationContractOfferService] Unexpected response shape:', payload);
    return [];
  }

  static async getAll(params?: MediationOfferQuery): Promise<MediationContractOffer[]> {
    const query: Record<string, any> = { PageSize: 9999, PageNumber: 1 };
    if (params) {
      (
        [
          'OfferNumber',
          'NationalityId',
          'JobId',
          'WorkerType',
          'PreviousExperience',
          'IsActive',
          'ShowForExternalCustomers',
          'ShowForReception',
          'SalaryMin',
          'SalaryMax',
          'LocalCostMin',
          'LocalCostMax',
          'AgentCostSARMin',
          'AgentCostSARMax',
        ] as const
      ).forEach((key) => {
        const value = params[key];
        if (value != null && value !== '') query[key] = value;
      });
    }
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.GET_ALL, {
      params: query,
    });
    return this.unwrapList<MediationContractOffer>(response.data);
  }

  static async getById(id: string): Promise<MediationContractOffer> {
    const response = await api.get<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.GET_BY_ID(id)
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  static async create(data: CreateMediationContractOfferDto): Promise<MediationContractOffer> {
    const payload = {
      nationalityId: data.nationalityId ?? null,
      jobId: data.jobId ?? null,
      workerType: data.workerType != null ? Number(data.workerType) : null,
      previousExperience: data.previousExperience != null ? Number(data.previousExperience) : null,
      localCost: data.localCost != null ? Number(data.localCost) : null,
      agentCostSAR: data.agentCostSAR != null ? Number(data.agentCostSAR) : null,
      salary: data.salary != null ? Number(data.salary) : null,
      taxLocalCost: data.taxLocalCost != null ? Number(data.taxLocalCost) : null,
      showForExternalCustomers: data.showForExternalCustomers ?? false,
      showForReception: data.showForReception ?? false,
    };
    const response = await api.post<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.CREATE,
      payload
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  static async update(
    data: UpdateMediationContractOfferDto
  ): Promise<MediationContractOffer> {
    const payload = {
      id: data.id,
      nationalityId: data.nationalityId ?? null,
      jobId: data.jobId ?? null,
      workerType: data.workerType != null ? Number(data.workerType) : null,
      previousExperience: data.previousExperience != null ? Number(data.previousExperience) : null,
      localCost: data.localCost != null ? Number(data.localCost) : null,
      agentCostSAR: data.agentCostSAR != null ? Number(data.agentCostSAR) : null,
      salary: data.salary != null ? Number(data.salary) : null,
      taxLocalCost: data.taxLocalCost != null ? Number(data.taxLocalCost) : null,
      showForExternalCustomers: data.showForExternalCustomers ?? false,
      showForReception: data.showForReception ?? false,
    };
    const response = await api.put<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.UPDATE,
      payload
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.DELETE(id));
  }

  static async toggleActive(id: string): Promise<MediationContractOffer> {
    const response = await api.patch<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.TOGGLE_ACTIVE(id)
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  static async autoFill(data: MediationOfferAutoFillDto): Promise<Partial<MediationContractOffer>> {
    const response = await api.post<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.AUTO_FILL,
      {
        nationalityId: data.nationalityId ?? null,
        jobId: data.jobId ?? null,
        workerType: data.workerType ?? null,
        previousExperience: data.previousExperience ?? null,
      }
    );
    return this.unwrap<Partial<MediationContractOffer>>(response.data);
  }
}
