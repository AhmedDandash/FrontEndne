/**
 * Customer Service
 * Handles all customer-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { buildListParams } from '@/lib/api/buildListParams';
import type {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  // CustomerPhoneDto,
} from '@/types/api.types';
import type { CustomerQuery, PagedResponse } from '@/types/filters.types';

export class CustomerService {
  private static unwrap<T>(payload: any): T {
    return (payload?.data ?? payload) as T;
  }

  private static unwrapList<T>(payload: any): T[] {
    const unwrapped = this.unwrap<any>(payload);
    if (Array.isArray(unwrapped)) return unwrapped as T[];
    if (Array.isArray(unwrapped?.items)) return unwrapped.items as T[];
    return [];
  }

  /**
   * Get all customers (unpaged — kept for lookups/selects).
   */
  static async getAll(): Promise<Customer[]> {
    const response = await api.get<any>(API_ENDPOINTS.CUSTOMERS.GET_ALL);
    return this.unwrapList<Customer>(response.data);
  }

  /**
   * Get customers with server-side branch scoping, filters and pagination.
   * Response envelope: { data: { items, totalCount, pageNumber, pageSize } }.
   */
  static async getPaged(query?: CustomerQuery): Promise<PagedResponse<Customer>> {
    const params = buildListParams(query as Record<string, unknown>);
    const response = await api.get<any>(API_ENDPOINTS.CUSTOMERS.GET_ALL, { params });
    const page = this.unwrap<any>(response.data);
    return {
      items: Array.isArray(page?.items) ? page.items : Array.isArray(page) ? page : [],
      totalCount: page?.totalCount ?? 0,
      pageNumber: page?.pageNumber ?? query?.pageNumber ?? 1,
      pageSize: page?.pageSize ?? query?.pageSize ?? 10,
    };
  }

  /**
   * Get customer by ID
   */
  static async getById(id: number | string): Promise<Customer> {
    const response = await api.get<any>(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(id));
    return this.unwrap<Customer>(response.data);
  }

  /**
   * Create new customer — the backend returns a bare success-message string
   * (e.g. "تم اضافة العميل بنجاح"), NOT the created customer (confirmed live,
   * 2026-08-11 Customers-module audit — same response shape as Auth's
   * add-admin and Branch's create/update).
   */
  static async create(data: CreateCustomerDto): Promise<string> {
    const response = await api.post<any>(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return this.unwrap<string>(response.data);
  }

  /**
   * Update customer — same bare success-message response shape as create().
   */
  static async update(id: number | string, data: UpdateCustomerDto): Promise<string> {
    const response = await api.put<any>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
    return this.unwrap<string>(response.data);
  }

  /**
   * Delete customer
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id));
  }

  /**
   * POST /api/V1/Customer/generate-english-name
   * Transliterates an Arabic name to English. Returns '' when the input is empty
   * or cannot be transliterated. The user may still edit the result manually.
   */
  static async generateEnglishName(arabicName: string): Promise<string> {
    if (!arabicName?.trim()) return '';
    const response = await api.post<any>(API_ENDPOINTS.CUSTOMERS.GENERATE_ENGLISH_NAME, {
      arabicName: arabicName.trim(),
    });
    const payload = this.unwrap<any>(response.data);
    return payload?.englishName ?? '';
  }
}
