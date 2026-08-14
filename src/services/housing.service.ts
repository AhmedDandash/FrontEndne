import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { Housing, HousingDto, HousingActiveItem } from '@/types/housing.types';

export class HousingService {
  private static unwrap<T>(payload: any): T {
    const inner =
      payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
    return inner as T;
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
      payload?.records,
      payload?.data?.records,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as T[];
      if (Array.isArray(candidate?.$values)) return candidate.$values as T[];
    }

    console.warn('[HousingService] Unexpected response shape:', payload);
    return [];
  }

  static async getAll(params?: {
    name?: string;
    nameMatch?: number;
    address?: string;
    addressMatch?: number;
    notes?: string;
    notesMatch?: number;
    isActive?: boolean;
    hasAvailableSlots?: boolean;
    capacityMin?: number;
    capacityMax?: number;
    workerHousingCostMin?: number;
    workerHousingCostMax?: number;
    housingOperationPriceMin?: number;
    housingOperationPriceMax?: number;
  }): Promise<Housing[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOUSING.GET_ALL, {
      params: {
        PageSize: 9999,
        PageNumber: 1,
        Name: params?.name || undefined,
        NameMatch: params?.nameMatch,
        Address: params?.address || undefined,
        AddressMatch: params?.addressMatch,
        Notes: params?.notes || undefined,
        NotesMatch: params?.notesMatch,
        IsActive: params?.isActive,
        HasAvailableSlots: params?.hasAvailableSlots,
        CapacityMin: params?.capacityMin,
        CapacityMax: params?.capacityMax,
        WorkerHousingCostMin: params?.workerHousingCostMin,
        WorkerHousingCostMax: params?.workerHousingCostMax,
        HousingOperationPriceMin: params?.housingOperationPriceMin,
        HousingOperationPriceMax: params?.housingOperationPriceMax,
      },
    });
    return this.unwrapList<Housing>(response.data);
  }

  static async getActiveList(): Promise<HousingActiveItem[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOUSING.GET_ACTIVE_LIST);
    return this.unwrapList<HousingActiveItem>(response.data);
  }

  static async getById(id: string): Promise<Housing> {
    const response = await api.get<any>(API_ENDPOINTS.HOUSING.GET_BY_ID(id));
    return this.unwrap<Housing>(response.data);
  }

  static async create(data: HousingDto): Promise<Housing> {
    const response = await api.post<any>(API_ENDPOINTS.HOUSING.CREATE, {
      name: data.name,
      address: data.address ?? null,
      capacity: Number(data.capacity),
      notes: data.notes ?? null,
      workerHousingCost: data.workerHousingCost != null ? Number(data.workerHousingCost) : null,
      housingOperationPrice: data.housingOperationPrice != null ? Number(data.housingOperationPrice) : null,
    });
    return this.unwrap<Housing>(response.data);
  }

  static async update(id: string, data: HousingDto): Promise<Housing> {
    const response = await api.put<any>(API_ENDPOINTS.HOUSING.UPDATE(id), {
      id,
      name: data.name,
      address: data.address ?? null,
      capacity: Number(data.capacity),
      notes: data.notes ?? null,
      workerHousingCost: data.workerHousingCost != null ? Number(data.workerHousingCost) : null,
      housingOperationPrice: data.housingOperationPrice != null ? Number(data.housingOperationPrice) : null,
    });
    return this.unwrap<Housing>(response.data);
  }

  static async toggleActive(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOUSING.TOGGLE_ACTIVE(id));
  }

  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOUSING.DELETE(id));
  }
}
