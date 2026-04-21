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
  /**
   * Get all customers
   */
  static async getAll(): Promise<Customer[]> {
    const response = await api.get<Customer[]>(API_ENDPOINTS.CUSTOMERS.GET_ALL);
    return response.data;
  }

  /**
   * Get customer by ID
   */
  static async getById(id: number | string): Promise<Customer> {
    const response = await api.get<Customer>(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(id));
    return response.data;
  }

  /**
   * Create new customer
   */
  static async create(data: CreateCustomerDto): Promise<Customer> {
    const response = await api.post<Customer>(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return response.data;
  }

  /**
   * Update customer
   */
  static async update(id: number | string, data: UpdateCustomerDto): Promise<Customer> {
    const response = await api.put<Customer>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
    return response.data;
  }

  /**
   * Delete customer
   */
  static async delete(id: number | string): Promise<void> {
    await api.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id));
  }
}
