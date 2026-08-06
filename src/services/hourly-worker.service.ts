/**
 * Hourly Worker Services
 * Full module: workers, requests, drivers, catalog, payments, notifications, reports.
 * See src/types/hourly-worker.types.ts for DTOs and business rules.
 */

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import { unwrap, unwrapList } from '@/utils/api-response';
import type {
  HourlyWorker,
  CreateHourlyWorkerDto,
  UpdateHourlyWorkerDto,
  HourlyWorkerListParams,
  HourlyWorkerRequest,
  HourlyWorkerRequestListParams,
  HourlyOrderDetailDto,
  HourlyOrderTimelineDto,
  HourlyOrderLogDto,
  HourlyOrderPaymentDto,
  HourlyWorkerAssignmentDetailDto,
  UpdateAssignmentStatusDto,
  AddInternalNoteDto,
  AssignWorkerDto,
  RejectRequestDto,
  RecommendedWorkerDto,
  AssignDriverDto,
  HourlyOrderTrackingDto,
  HourlyOrderInvoice,
  IssueHourlyOrderInvoiceDto,
  HourlyOrderAccommodation,
  BookHourlyOrderAccommodationDto,
  UpdateHourlyAccommodationStatusDto,
  HourlyDriver,
  CreateHourlyDriverDto,
  UpdateHourlyDriverDto,
  HourlyDriverListParams,
  HourlyServicePackage,
  CreateHourlyServicePackageDto,
  UpdateHourlyServicePackageDto,
  HourlyPackageListParams,
  HourlyServingArea,
  CreateHourlyServingAreaDto,
  UpdateHourlyServingAreaDto,
  HourlyServingAreaListParams,
  HourlyPaymentListItem,
  HourlyPaymentListParams,
  HourlyOrderNotification,
  HourlyNotificationListParams,
  HourlyOrdersSummaryReport,
  HourlyRevenueReport,
  HourlyWorkerUtilizationReport,
  HourlyDriverPerformanceReport,
  HourlyReportFilterParams,
  HourlyWorkerAvailabilityParams,
  HourlyCustomerOrderListParams,
  HourlyCustomerOrder,
  HourlyWorkerPortalAssignment,
} from '@/types/hourly-worker.types';

export interface Paged<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

function unwrapPaged<T>(payload: any, params?: { pageNumber?: number; pageSize?: number }): Paged<T> {
  const data = payload?.data ?? payload;
  const items: T[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  return {
    items,
    totalCount: data?.totalCount ?? items.length,
    pageNumber: data?.pageNumber ?? params?.pageNumber ?? 1,
    pageSize: data?.pageSize ?? params?.pageSize ?? items.length,
  };
}

// ─── Workers ──────────────────────────────────────────────────────────────────

export class HourlyWorkerService {
  static async getAll(params: HourlyWorkerListParams = {}): Promise<Paged<HourlyWorker>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKERS.GET_ALL, {
      params: {
        search: params.search || undefined,
        isActive: params.isActive,
        isAvailableNow: params.isAvailableNow,
        hourlyRateFrom: params.hourlyRateFrom ?? undefined,
        hourlyRateTo: params.hourlyRateTo ?? undefined,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        branchId: params.branchId || undefined,
        includeSubBranches: params.branchId ? params.includeSubBranches : undefined,
        createdDateFrom: params.createdDateFrom || undefined,
        createdDateTo: params.createdDateTo || undefined,
        updatedDateFrom: params.updatedDateFrom || undefined,
        updatedDateTo: params.updatedDateTo || undefined,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyWorker>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyWorker> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKERS.GET_BY_ID(id));
    return unwrap<HourlyWorker>(response.data);
  }

  static async create(data: CreateHourlyWorkerDto): Promise<HourlyWorker> {
    const response = await api.post<any>(API_ENDPOINTS.HOURLY_WORKERS.CREATE, data);
    return unwrap<HourlyWorker>(response.data);
  }

  static async update(id: string, data: UpdateHourlyWorkerDto): Promise<HourlyWorker> {
    const response = await api.put<any>(API_ENDPOINTS.HOURLY_WORKERS.UPDATE(id), data);
    return unwrap<HourlyWorker>(response.data);
  }

  static async remove(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOURLY_WORKERS.DELETE(id));
  }

  static async activate(id: string): Promise<void> {
    // Empty body {} so axios sends Content-Length:0 (server returns 411 otherwise).
    await api.post(API_ENDPOINTS.HOURLY_WORKERS.ACTIVATE(id), {});
  }

  static async deactivate(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKERS.DEACTIVATE(id), {});
  }

  /**
   * Zero-footprint stub (service+type only, no UI — see architecture note):
   * workers free for a given window. Availability-checking UI is a separate
   * feature build, out of scope for this parameter-completion pass.
   */
  static async getAvailable(params: HourlyWorkerAvailabilityParams = {}): Promise<HourlyWorker[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKERS.GET_AVAILABLE, { params });
    return unwrapList<HourlyWorker>(response.data);
  }
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export class HourlyWorkerRequestService {
  static async getAll(
    params: HourlyWorkerRequestListParams = {}
  ): Promise<Paged<HourlyWorkerRequest>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_ALL, {
      params: {
        ticketNumber: params.ticketNumber || undefined,
        customerName: params.customerName || undefined,
        status: params.status,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        branchId: params.branchId || undefined,
        includeSubBranches: params.branchId ? params.includeSubBranches : undefined,
        search: params.search || undefined,
        customerPhone: params.customerPhone || undefined,
        serviceCity: params.serviceCity || undefined,
        serviceDistrict: params.serviceDistrict || undefined,
        packageId: params.packageId || undefined,
        servingAreaId: params.servingAreaId || undefined,
        paymentStatus: params.paymentStatus,
        createdDateFrom: params.createdDateFrom || undefined,
        createdDateTo: params.createdDateTo || undefined,
        updatedDateFrom: params.updatedDateFrom || undefined,
        updatedDateTo: params.updatedDateTo || undefined,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyWorkerRequest>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyWorkerRequest> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_BY_ID(id));
    return unwrap<HourlyWorkerRequest>(response.data);
  }

  static async approve(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.APPROVE(id), {});
  }

  static async reject(id: string, data: RejectRequestDto = {}): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.REJECT(id), data);
  }

  static async assign(id: string, data: AssignWorkerDto): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.ASSIGN(id), data);
  }

  static async markInProgress(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.IN_PROGRESS(id), {});
  }

  static async complete(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.COMPLETE(id), {});
  }

  static async cancel(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.CANCEL(id), {});
  }

  // ── Order detail & sub-resources ──────────────────────────────────────────
  static async getDetail(id: string): Promise<HourlyOrderDetailDto> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_DETAIL(id));
    return unwrap<HourlyOrderDetailDto>(response.data);
  }

  static async getTimeline(id: string): Promise<HourlyOrderTimelineDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_TIMELINE(id));
    return unwrapList<HourlyOrderTimelineDto>(response.data);
  }

  static async getLogs(id: string): Promise<HourlyOrderLogDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_LOGS(id));
    return unwrapList<HourlyOrderLogDto>(response.data);
  }

  static async getPayments(id: string): Promise<HourlyOrderPaymentDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_PAYMENTS(id));
    return unwrapList<HourlyOrderPaymentDto>(response.data);
  }

  static async getAssignments(id: string): Promise<HourlyWorkerAssignmentDetailDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.GET_ASSIGNMENTS(id));
    return unwrapList<HourlyWorkerAssignmentDetailDto>(response.data);
  }

  static async updateAssignmentStatus(
    id: string,
    assignmentId: string,
    data: UpdateAssignmentStatusDto
  ): Promise<void> {
    await api.put(
      API_ENDPOINTS.HOURLY_WORKER_REQUESTS.UPDATE_ASSIGNMENT_STATUS(id, assignmentId),
      data
    );
  }

  static async deleteAssignment(id: string, assignmentId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.DELETE_ASSIGNMENT(id, assignmentId));
  }

  static async addInternalNote(id: string, data: AddInternalNoteDto): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_REQUESTS.ADD_INTERNAL_NOTE(id), data);
  }

  static async trackByTicket(ticketNumber: string): Promise<any> {
    const response = await api.get<any>(
      API_ENDPOINTS.HOURLY_WORKER_REQUESTS.TRACK(ticketNumber)
    );
    return unwrap<any>(response.data);
  }
}

// ─── Order operations (HourlyWorkerOrders) ──────────────────────────────────────

export class HourlyWorkerOrderService {
  static async getRecommendedWorkers(
    orderId: string,
    maxResults = 10
  ): Promise<RecommendedWorkerDto[]> {
    const response = await api.get<any>(
      API_ENDPOINTS.HOURLY_WORKER_ORDERS.RECOMMENDED_WORKERS(orderId),
      { params: { maxResults } }
    );
    return unwrapList<RecommendedWorkerDto>(response.data);
  }

  static async assignDriver(orderId: string, data: AssignDriverDto): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_WORKER_ORDERS.ASSIGN_DRIVER(orderId), data);
  }

  static async getTracking(orderId: string): Promise<HourlyOrderTrackingDto[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_ORDERS.GET_TRACKING(orderId));
    return unwrapList<HourlyOrderTrackingDto>(response.data);
  }

  static async recordTracking(
    orderId: string,
    data: Record<string, unknown>
  ): Promise<HourlyOrderTrackingDto> {
    const response = await api.post<any>(
      API_ENDPOINTS.HOURLY_WORKER_ORDERS.POST_TRACKING(orderId),
      data
    );
    return unwrap<HourlyOrderTrackingDto>(response.data);
  }

  static async getInvoices(orderId: string): Promise<HourlyOrderInvoice[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_ORDERS.GET_INVOICES(orderId));
    return unwrapList<HourlyOrderInvoice>(response.data);
  }

  static async issueInvoice(
    orderId: string,
    data: IssueHourlyOrderInvoiceDto
  ): Promise<HourlyOrderInvoice> {
    const response = await api.post<any>(
      API_ENDPOINTS.HOURLY_WORKER_ORDERS.POST_INVOICE(orderId),
      data
    );
    return unwrap<HourlyOrderInvoice>(response.data);
  }

  static async getAccommodation(orderId: string): Promise<HourlyOrderAccommodation | null> {
    try {
      const response = await api.get<any>(
        API_ENDPOINTS.HOURLY_WORKER_ORDERS.GET_ACCOMMODATION(orderId)
      );
      return unwrap<HourlyOrderAccommodation>(response.data);
    } catch (err: any) {
      // 404 = no accommodation booked yet — a normal, expected state.
      if (err?.response?.status === 404) return null;
      throw err;
    }
  }

  static async bookAccommodation(
    orderId: string,
    data: BookHourlyOrderAccommodationDto
  ): Promise<HourlyOrderAccommodation> {
    const response = await api.post<any>(
      API_ENDPOINTS.HOURLY_WORKER_ORDERS.POST_ACCOMMODATION(orderId),
      data
    );
    return unwrap<HourlyOrderAccommodation>(response.data);
  }

  static async updateAccommodationStatus(
    orderId: string,
    accommodationId: string,
    data: UpdateHourlyAccommodationStatusDto
  ): Promise<void> {
    await api.put(
      API_ENDPOINTS.HOURLY_WORKER_ORDERS.UPDATE_ACCOMMODATION_STATUS(orderId, accommodationId),
      data
    );
  }
}

// ─── Drivers ────────────────────────────────────────────────────────────────────

export class HourlyDriverService {
  static async getAll(params: HourlyDriverListParams = {}): Promise<Paged<HourlyDriver>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_DRIVERS.GET_ALL, {
      params: {
        search: params.search || undefined,
        isActive: params.isActive,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyDriver>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyDriver> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_DRIVERS.GET_BY_ID(id));
    return unwrap<HourlyDriver>(response.data);
  }

  static async create(data: CreateHourlyDriverDto): Promise<HourlyDriver> {
    const response = await api.post<any>(API_ENDPOINTS.HOURLY_DRIVERS.CREATE, data);
    return unwrap<HourlyDriver>(response.data);
  }

  static async update(id: string, data: UpdateHourlyDriverDto): Promise<HourlyDriver> {
    const response = await api.put<any>(API_ENDPOINTS.HOURLY_DRIVERS.UPDATE(id), data);
    return unwrap<HourlyDriver>(response.data);
  }

  static async remove(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOURLY_DRIVERS.DELETE(id));
  }

  static async activate(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_DRIVERS.ACTIVATE(id), {});
  }

  static async deactivate(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_DRIVERS.DEACTIVATE(id), {});
  }
}

// ─── Catalog: Packages ──────────────────────────────────────────────────────────

export class HourlyPackageService {
  static async getAll(
    params: HourlyPackageListParams = {}
  ): Promise<Paged<HourlyServicePackage>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_PACKAGES, {
      params: {
        search: params.search || undefined,
        isActive: params.isActive,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyServicePackage>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyServicePackage> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_PACKAGE_BY_ID(id));
    return unwrap<HourlyServicePackage>(response.data);
  }

  static async create(data: CreateHourlyServicePackageDto): Promise<HourlyServicePackage> {
    const response = await api.post<any>(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_PACKAGES, data);
    return unwrap<HourlyServicePackage>(response.data);
  }

  static async update(
    id: string,
    data: UpdateHourlyServicePackageDto
  ): Promise<HourlyServicePackage> {
    const response = await api.put<any>(
      API_ENDPOINTS.HOURLY_CATALOG.ADMIN_UPDATE_PACKAGE(id),
      data
    );
    return unwrap<HourlyServicePackage>(response.data);
  }

  static async remove(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_DELETE_PACKAGE(id));
  }
}

// ─── Catalog: Serving Areas ─────────────────────────────────────────────────────

export class HourlyServingAreaService {
  static async getAll(
    params: HourlyServingAreaListParams = {}
  ): Promise<Paged<HourlyServingArea>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_SERVING_AREAS, {
      params: {
        search: params.search || undefined,
        isActive: params.isActive,
        city: params.city || undefined,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyServingArea>(response.data, params);
  }

  static async getById(id: string): Promise<HourlyServingArea> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_SERVING_AREA_BY_ID(id));
    return unwrap<HourlyServingArea>(response.data);
  }

  static async create(data: CreateHourlyServingAreaDto): Promise<HourlyServingArea> {
    const response = await api.post<any>(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_SERVING_AREAS, data);
    return unwrap<HourlyServingArea>(response.data);
  }

  static async update(
    id: string,
    data: UpdateHourlyServingAreaDto
  ): Promise<HourlyServingArea> {
    const response = await api.put<any>(
      API_ENDPOINTS.HOURLY_CATALOG.ADMIN_UPDATE_SERVING_AREA(id),
      data
    );
    return unwrap<HourlyServingArea>(response.data);
  }

  static async remove(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.HOURLY_CATALOG.ADMIN_DELETE_SERVING_AREA(id));
  }
}

// ─── Payments ───────────────────────────────────────────────────────────────────

export class HourlyPaymentsService {
  static async getAll(
    params: HourlyPaymentListParams = {}
  ): Promise<Paged<HourlyPaymentListItem>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_ORDER_PAYMENTS.GET_ALL, {
      params: {
        orderId: params.orderId || undefined,
        status: params.status,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        search: params.search || undefined,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyPaymentListItem>(response.data, params);
  }

  static async refund(id: string, notes?: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_ORDER_PAYMENTS.REFUND(id), { notes });
  }
}

// ─── Notifications ──────────────────────────────────────────────────────────────

export class HourlyNotificationsService {
  static async getAll(
    params: HourlyNotificationListParams = {}
  ): Promise<Paged<HourlyOrderNotification>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_ORDER_NOTIFICATIONS.GET_ALL, {
      params: {
        orderId: params.orderId || undefined,
        deliveryStatus: params.deliveryStatus,
        recipientPhone: params.recipientPhone || undefined,
        search: params.search || undefined,
        sortBy: params.sortBy || undefined,
        sortDescending: params.sortDescending,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyOrderNotification>(response.data, params);
  }

  static async retry(id: string): Promise<void> {
    await api.post(API_ENDPOINTS.HOURLY_ORDER_NOTIFICATIONS.RETRY(id), {});
  }
}

// ─── Reports ────────────────────────────────────────────────────────────────────

export class HourlyReportsService {
  static async getOrdersSummary(
    params: HourlyReportFilterParams = {}
  ): Promise<HourlyOrdersSummaryReport> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_REPORTS.ORDERS_SUMMARY, { params });
    return unwrap<HourlyOrdersSummaryReport>(response.data);
  }

  static async getRevenue(params: HourlyReportFilterParams = {}): Promise<HourlyRevenueReport> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_REPORTS.REVENUE, { params });
    return unwrap<HourlyRevenueReport>(response.data);
  }

  static async getWorkerUtilization(
    params: HourlyReportFilterParams = {}
  ): Promise<HourlyWorkerUtilizationReport[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_REPORTS.WORKER_UTILIZATION, {
      params,
    });
    return unwrapList<HourlyWorkerUtilizationReport>(response.data);
  }

  static async getDriverPerformance(
    params: HourlyReportFilterParams = {}
  ): Promise<HourlyDriverPerformanceReport[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_REPORTS.DRIVER_PERFORMANCE, {
      params,
    });
    return unwrapList<HourlyDriverPerformanceReport>(response.data);
  }
}

// ─── Zero-footprint stubs (service + type only, no UI) ─────────────────────────
// Per architectural ruling: worker self-service portal and customer order
// history are separate feature builds, out of scope for this parameter-
// completion pass. Typed here only so the capability is reachable.

export class HourlyCustomerOrderService {
  static async getAll(
    params: HourlyCustomerOrderListParams = {}
  ): Promise<Paged<HourlyCustomerOrder>> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_CUSTOMER.GET_ORDERS, {
      params: {
        status: params.status,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    });
    return unwrapPaged<HourlyCustomerOrder>(response.data, params);
  }
}

export class HourlyWorkerPortalService {
  /** The logged-in worker's own assignments (self-service). */
  static async getMyAssignments(): Promise<HourlyWorkerPortalAssignment[]> {
    const response = await api.get<any>(API_ENDPOINTS.HOURLY_WORKER_PORTAL.GET_MY_ASSIGNMENTS);
    return unwrapList<HourlyWorkerPortalAssignment>(response.data);
  }

  /** Dashboard lookup of a specific worker's assignments by id. */
  static async getAssignments(workerId: string): Promise<HourlyWorkerPortalAssignment[]> {
    const response = await api.get<any>(
      API_ENDPOINTS.HOURLY_WORKER_PORTAL.GET_ASSIGNMENTS(workerId)
    );
    return unwrapList<HourlyWorkerPortalAssignment>(response.data);
  }
}
