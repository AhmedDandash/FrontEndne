/**
 * Customer Service
 * Handles all customer-related API calls
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  // CustomerPhoneDto,
} from '@/types/api.types';

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
   * Get all customers
   */
  static async getAll(): Promise<Customer[]> {
    const response = await api.get<any>(API_ENDPOINTS.CUSTOMERS.GET_ALL);
    return this.unwrapList<Customer>(response.data);
  }

  /**
   * Get customer by ID
   */
  static async getById(id: number | string): Promise<Customer> {
    const response = await api.get<any>(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(id));
    return this.unwrap<Customer>(response.data);
  }

  /**
   * Create new customer
   */
  static async create(data: CreateCustomerDto): Promise<Customer> {
    const response = await api.post<any>(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return this.unwrap<Customer>(response.data);
  }

  /**
   * Update customer
   */
  static async update(id: number | string, data: UpdateCustomerDto): Promise<Customer> {
    const response = await api.put<any>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
    return this.unwrap<Customer>(response.data);
  }

  /**
   * Delete customer
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id));
  }
}
