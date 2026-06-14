import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type { RestrictionType, RestrictionTypeCreateDto } from '@/types/accounting.types';

/**
 * RestrictionType (journal-entry type) service.
 *
 * Backend wraps payloads in the ApiResponse envelope and may serialise arrays
 * as `{ $values: [] }`; both are normalised here.
 *
 * NOTE: POST /restrictiontype currently returns 501 (CreateAsync not yet
 * implemented). `create` is kept for when the backend enables it.
 */
export class RestrictionTypeService {
  private static unwrap<T>(payload: any): T {
    const inner = payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
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
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as T[];
      if (Array.isArray(candidate?.$values)) return candidate.$values as T[];
    }
    console.warn('[RestrictionTypeService] Unexpected response shape:', payload);
    return [];
  }

  /** GET /restrictiontype — all restriction types. */
  static async getAll(): Promise<RestrictionType[]> {
    const response = await api.get<any>(API_ENDPOINTS.RESTRICTION_TYPE.GET_ALL);
    return this.unwrapList<RestrictionType>(response.data);
  }

  /** GET /restrictiontype/{id} — single restriction type. */
  static async getById(id: string): Promise<RestrictionType> {
    const response = await api.get<any>(API_ENDPOINTS.RESTRICTION_TYPE.GET_BY_ID(id));
    return this.unwrap<RestrictionType>(response.data);
  }

  /** POST /restrictiontype — currently 501 server-side. */
  static async create(data: RestrictionTypeCreateDto): Promise<RestrictionType> {
    const response = await api.post<any>(API_ENDPOINTS.RESTRICTION_TYPE.CREATE, this.toBody(data));
    return this.unwrap<RestrictionType>(response.data);
  }

  /** PUT /restrictiontype/{id} — update (same body as create). */
  static async update(id: string, data: RestrictionTypeCreateDto): Promise<RestrictionType> {
    const response = await api.put<any>(
      API_ENDPOINTS.RESTRICTION_TYPE.UPDATE(id),
      this.toBody(data)
    );
    return this.unwrap<RestrictionType>(response.data);
  }

  /** DELETE /restrictiontype/{id}. */
  static async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.RESTRICTION_TYPE.DELETE(id));
  }

  /** Normalise the request body (RestrictionTypeCreateDto). */
  private static toBody(data: RestrictionTypeCreateDto) {
    return {
      name: data.name ?? null,
      nameAr: data.nameAr ?? null,
      accountingEvent: data.accountingEvent ?? null,
      isManual: data.isManual ?? false,
      isActive: data.isActive ?? true,
      defaultDebitAccountId: data.defaultDebitAccountId ?? null,
      defaultCreditAccountId: data.defaultCreditAccountId ?? null,
    };
  }
}
