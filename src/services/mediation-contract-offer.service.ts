/**
 * Mediation Contract Offer Service
 * Handles all mediation contract offer-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  MediationContractOffer,
  MediationContractOfferSummary,
  CreateMediationContractOfferDto,
  UpdateMediationContractOfferDto,
  MediationOfferAutoFillDto,
} from '@/types/api.types';

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
      branchId: offer.branchId ?? offer.branchID,
      agentId: offer.agentId ?? offer.agentID,
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

  /**
   * Get summary of offers (grouped by nationality/job/branch)
   */
  static async getSummary(): Promise<MediationContractOfferSummary[]> {
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.GET_SUMMARY, {
      params: { PageSize: 9999, PageNumber: 1 },
    });
    return this.unwrapList<MediationContractOfferSummary>(response.data);
  }

  /**
   * Get all offers
   */
  static async getAll(): Promise<MediationContractOffer[]> {
    const response = await api.get<any>(API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.GET_ALL, {
      params: { PageSize: 9999, PageNumber: 1 },
    });
    return this.unwrapList<MediationContractOffer>(response.data);
  }

  /**
   * Get offer by ID
   */
  static async getById(id: number | string): Promise<MediationContractOffer> {
    const response = await api.get<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.GET_BY_ID(id)
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  /**
   * Create new offer
   */
  static async create(data: CreateMediationContractOfferDto): Promise<MediationContractOffer> {
    const payload = {
      ...data,
      nationalityId: data.nationalityId ?? null,
      jobId: data.jobId ?? null,
      branchId: data.branchId ?? null,
      agentId: data.agentId ?? null,
      workerType: data.workerType !== undefined ? Number(data.workerType) : null,
      age: data.age ? Number(data.age) : null,
      religion: data.religion !== undefined ? Number(data.religion) : null,
      previousExperience:
        data.previousExperience !== undefined ? Number(data.previousExperience) : null,
      salary: data.salary ? Number(data.salary) : null,
      localCost: data.localCost ? Number(data.localCost) : null,
      taxLocalCost: data.taxLocalCost ? Number(data.taxLocalCost) : null,
      agentCostSAR: data.agentCostSAR ? Number(data.agentCostSAR) : null,
    };
    const response = await api.post<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.CREATE,
      payload
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  /**
   * Update offer
   */
  static async update(
    id: number | string,
    data: UpdateMediationContractOfferDto
  ): Promise<MediationContractOffer> {
    const payload = {
      ...data,
      nationalityId: data.nationalityId ?? null,
      jobId: data.jobId ?? null,
      branchId: data.branchId ?? null,
      agentId: data.agentId ?? null,
      workerType: data.workerType !== undefined ? Number(data.workerType) : null,
      age: data.age ? Number(data.age) : null,
      religion: data.religion !== undefined ? Number(data.religion) : null,
      previousExperience:
        data.previousExperience !== undefined ? Number(data.previousExperience) : null,
      salary: data.salary ? Number(data.salary) : null,
      localCost: data.localCost ? Number(data.localCost) : null,
      taxLocalCost: data.taxLocalCost ? Number(data.taxLocalCost) : null,
      agentCostSAR: data.agentCostSAR ? Number(data.agentCostSAR) : null,
    };
    const response = await api.put<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.UPDATE(id),
      payload
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  /**
   * Delete offer
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.DELETE(id));
  }

  /**
   * Toggle active status of an offer (PATCH /toggle-active)
   */
  static async toggleActive(id: number | string): Promise<MediationContractOffer> {
    const response = await api.patch<any>(
      API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.TOGGLE_ACTIVE(id)
    );
    return this.unwrap<MediationContractOffer>(response.data);
  }

  /**
   * Auto-fill offer costs based on nationality/job/workerType/experience
   */
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
