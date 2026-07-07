/**
 * Hourly Workers Module — Type Definitions
 * Mirrors the Sigma API (FRONTEND_INTEGRATION.md), bases:
 *   /api/V1/HourlyWorkers          — worker pool CRUD + activate/deactivate
 *   /api/V1/HourlyWorkerRequests   — service requests (created on mobile) +
 *                                    dashboard review/assign/lifecycle
 *
 * Business rules (enforced server-side, mirrored in the UI):
 *   • Worker: hourlyRate > 0, availableToTime must be after availableFromTime.
 *   • Delete worker fails (400) if they have active (Assigned/InProgress) requests.
 *   • Requests originate from mobile — the dashboard has no create endpoint.
 *   • Exactly one worker per request; the worker must be available for the period.
 *   • Status transitions are strict (see ALLOWED_TRANSITIONS); terminal states
 *     (Rejected/Completed/Cancelled) are read-only.
 *   • Action endpoints return a plain string message in `data`, not a model.
 */

// ==================== Worker ====================

export interface HourlyWorker {
  id: string;
  fullName: string;
  phoneNumber: string;
  nationalId: string | null;
  hourlyRate: number;
  /** "HH:mm:ss" */
  availableFromTime: string;
  /** "HH:mm:ss" */
  availableToTime: string;
  isActive: boolean;
  /** Server-computed from the availability window vs. now (UTC). */
  isAvailableNow: boolean;
  notes: string | null;
  createdDate: string;
  updatedDate: string | null;
}

export interface CreateHourlyWorkerDto {
  fullName: string;
  phoneNumber: string;
  nationalId?: string | null;
  hourlyRate: number;
  availableFromTime: string;
  availableToTime: string;
  notes?: string | null;
}

export type UpdateHourlyWorkerDto = CreateHourlyWorkerDto;

export interface HourlyWorkerListParams {
  search?: string;
  isActive?: boolean;
  isAvailableNow?: boolean;
  sortBy?: 'fullName' | 'hourlyRate' | 'createdDate';
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
  // Branch scoping (FilterHourlyWorkerDto shared base fields).
  branchId?: string;
  includeSubBranches?: boolean;
}

// ==================== Request ====================

export interface HourlyWorkerAssignment {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  assignedDate: string;
}

export interface HourlyWorkerRequestHistory {
  id: string;
  oldStatus: number | null;
  oldStatusName: string | null;
  newStatus: number;
  newStatusName: string;
  /** User GUID for dashboard actions, literal "Mobile" for app-created. */
  changedBy: string;
  changedAt: string;
  notes: string | null;
}

export interface HourlyWorkerRequest {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  requestDate: string;
  /** "HH:mm:ss" */
  requestedStartTime: string;
  /** "HH:mm:ss" */
  requestedEndTime: string;
  numberOfWorkers: number;
  notes: string | null;
  status: HourlyRequestStatus;
  statusName: string;
  assignedWorkersCount: number;
  createdDate: string;
  updatedDate: string | null;
  /** The list endpoint already embeds these — not detail-only. */
  assignments: HourlyWorkerAssignment[];
  history: HourlyWorkerRequestHistory[];
}

export interface AssignWorkerDto {
  /** Assign endpoint accepts a single worker… */
  workerId?: string;
  /** …or several at once. */
  workerIds?: string[];
}

export interface RejectRequestDto {
  notes?: string;
}

export interface HourlyWorkerRequestListParams {
  ticketNumber?: string;
  customerName?: string;
  status?: HourlyRequestStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'ticketNumber' | 'customerName' | 'requestDate' | 'status' | 'createdDate';
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
  // Branch scoping + shared filters (FilterHourlyWorkerRequestDto). NOTE: on the
  // current backend data branchId had no observable effect — plumbed per spec.
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  customerPhone?: string;
  serviceCity?: string;
}

// ==================== Status enum ====================

export enum HourlyRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Assigned = 3,
  InProgress = 4,
  Completed = 5,
  Cancelled = 6,
}

export interface StatusOption {
  value: HourlyRequestStatus;
  ar: string;
  en: string;
  /** Ant Design Tag colour. */
  color: string;
}

export const HOURLY_REQUEST_STATUSES: StatusOption[] = [
  { value: HourlyRequestStatus.Pending, ar: 'قيد الانتظار', en: 'Pending', color: 'gold' },
  { value: HourlyRequestStatus.Approved, ar: 'تمت الموافقة', en: 'Approved', color: 'cyan' },
  { value: HourlyRequestStatus.Rejected, ar: 'مرفوض', en: 'Rejected', color: 'red' },
  { value: HourlyRequestStatus.Assigned, ar: 'تم التعيين', en: 'Assigned', color: 'blue' },
  { value: HourlyRequestStatus.InProgress, ar: 'قيد التنفيذ', en: 'In Progress', color: 'processing' },
  { value: HourlyRequestStatus.Completed, ar: 'مكتمل', en: 'Completed', color: 'green' },
  { value: HourlyRequestStatus.Cancelled, ar: 'ملغي', en: 'Cancelled', color: 'default' },
];

export function getStatusOption(value: HourlyRequestStatus): StatusOption | undefined {
  return HOURLY_REQUEST_STATUSES.find((s) => s.value === value);
}

export function getStatusLabel(value: HourlyRequestStatus, isAr: boolean): string {
  const match = getStatusOption(value);
  if (!match) return String(value);
  return isAr ? match.ar : match.en;
}

/** Terminal states are read-only — no further actions allowed. */
export const TERMINAL_STATUSES: HourlyRequestStatus[] = [
  HourlyRequestStatus.Rejected,
  HourlyRequestStatus.Completed,
  HourlyRequestStatus.Cancelled,
];

export function isTerminalStatus(value: HourlyRequestStatus): boolean {
  return TERMINAL_STATUSES.includes(value);
}

/**
 * The lifecycle action(s) available from a given status, in display order.
 * Mirrors the documented status-transition matrix.
 */
export type HourlyRequestAction =
  | 'approve'
  | 'reject'
  | 'assign'
  | 'inProgress'
  | 'complete'
  | 'cancel';

export const ACTIONS_BY_STATUS: Record<HourlyRequestStatus, HourlyRequestAction[]> = {
  [HourlyRequestStatus.Pending]: ['approve', 'reject', 'cancel'],
  [HourlyRequestStatus.Approved]: ['assign', 'cancel'],
  [HourlyRequestStatus.Assigned]: ['inProgress', 'cancel'],
  [HourlyRequestStatus.InProgress]: ['complete', 'cancel'],
  [HourlyRequestStatus.Rejected]: [],
  [HourlyRequestStatus.Completed]: [],
  [HourlyRequestStatus.Cancelled]: [],
};

// ==================== Order Detail (full) ====================

export interface HourlyOrderPaymentDto {
  id: string;
  amount: number;
  paymentMethod: number;
  paymentMethodName: string;
  status: number;
  statusName?: string;
  transactionReference: string | null;
  transferProofUrl: string | null;
  paidAt: string | null;
  createdDate?: string;
}

export interface HourlyDriverAssignmentDto {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: number;
  statusName: string;
  assignedDate: string;
}

export interface HourlyOrderTimelineDto {
  id?: string;
  eventType: number;
  title: string;
  description: string | null;
  occurredAt: string;
  createdBy?: string;
}

export interface HourlyOrderLogDto {
  id?: string;
  action: string;
  details: string | null;
  performedBy?: string;
  occurredAt: string;
}

export interface HourlyOrderTrackingDto {
  id?: string;
  eventType: number;
  subjectType?: number;
  subjectId?: string;
  latitude?: number;
  longitude?: number;
  device?: string;
  notes?: string;
  trackingSource?: number;
  recordedAt?: string;
}

export interface HourlyWorkerAssignmentDetailDto {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  assignedDate: string;
  assignmentStatus: number;
  assignmentStatusName: string;
  confirmedAt: string | null;
  notes: string | null;
}

export interface HourlyOrderDetailDto {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerId: string | null;
  serviceCity: string | null;
  serviceDistrict: string | null;
  packageId: string | null;
  packageName: string | null;
  servingAreaId: string | null;
  numberOfWorkers: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: number;
  status: HourlyRequestStatus;
  statusName: string;
  requiresDriver: boolean;
  requiresAccommodation: boolean;
  serviceLatitude: number | null;
  serviceLongitude: number | null;
  transferProofUrl: string | null;
  internalNotes: string | null;
  requestDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  assignedWorkersCount: number;
  createdDate: string;
  /**
   * Detail returns the SIMPLE assignment shape (verified 2026-06-29) — the rich
   * status/confirmedAt fields come from GET /Assignments (HourlyWorkerAssignmentDetailDto).
   */
  assignments: HourlyWorkerAssignment[];
  payments: HourlyOrderPaymentDto[];
  driverAssignment: HourlyDriverAssignmentDto | null;
  timeline: HourlyOrderTimelineDto[];
  /** Detail embeds logs too, alongside the dedicated GET /Logs endpoint. */
  logs: HourlyOrderLogDto[];
  tracking: HourlyOrderTrackingDto[];
  history: HourlyWorkerRequestHistory[];
}

export interface UpdateAssignmentStatusDto {
  status: number;
  notes?: string;
}

export interface AddInternalNoteDto {
  note: string;
}

// ==================== Recommended Workers ====================

export interface RecommendedWorkerDto {
  /** Live API returns `workerId`/`workerName` (verified 2026-06-29), not id/fullName. */
  workerId: string;
  workerName: string;
  phoneNumber: string;
  hourlyRate: number;
  isAvailable: boolean;
  score: number;
  recommendationReason: string | null;
}

// ==================== Driver ====================

export interface HourlyDriver {
  id: string;
  fullName: string;
  phoneNumber: string;
  nationalId: string | null;
  licenseNumber: string | null;
  vehicleType: string | null;
  vehiclePlateNumber: string | null;
  notes: string | null;
  isActive: boolean;
  linkedUserId: string | null;
  createdDate: string;
  updatedDate: string | null;
}

export interface CreateHourlyDriverDto {
  fullName: string;
  phoneNumber: string;
  nationalId?: string | null;
  licenseNumber?: string | null;
  vehicleType?: string | null;
  vehiclePlateNumber?: string | null;
  notes?: string | null;
  linkedUserId?: string | null;
}

export type UpdateHourlyDriverDto = CreateHourlyDriverDto;

export interface HourlyDriverListParams {
  search?: string;
  isActive?: boolean;
  sortBy?: 'fullName' | 'createdDate';
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Catalog — Packages ====================

export interface HourlyServicePackage {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  durationHours: number;
  numberOfWorkers: number;
  basePrice: number;
  hourlyRate: number;
  sortOrder: number;
  isActive: boolean;
  createdDate: string;
}

export interface CreateHourlyServicePackageDto {
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  durationHours: number;
  numberOfWorkers: number;
  basePrice: number;
  hourlyRate: number;
  sortOrder?: number;
  isActive: boolean;
}

export type UpdateHourlyServicePackageDto = CreateHourlyServicePackageDto;

export interface HourlyPackageListParams {
  search?: string;
  isActive?: boolean;
  sortBy?: 'code' | 'nameEn' | 'basePrice' | 'sortOrder' | 'createdDate';
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Catalog — Serving Areas ====================

export interface HourlyServingArea {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  districtAr: string | null;
  districtEn: string | null;
  postalCode: string | null;
  centerLatitude: number | null;
  centerLongitude: number | null;
  radiusKm: number | null;
  isActive: boolean;
  createdDate: string;
}

export interface CreateHourlyServingAreaDto {
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  districtAr?: string | null;
  districtEn?: string | null;
  postalCode?: string | null;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  radiusKm?: number | null;
  isActive: boolean;
}

export type UpdateHourlyServingAreaDto = CreateHourlyServingAreaDto;

export interface HourlyServingAreaListParams {
  search?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Payments List ====================

export interface HourlyPaymentListItem {
  id: string;
  orderId: string;
  ticketNumber: string;
  checkoutReference: string | null;
  amount: number;
  paymentMethod: number;
  paymentMethodName: string;
  status: number;
  statusName?: string;
  transactionReference: string | null;
  transferProofUrl: string | null;
  paidAt: string | null;
  createdDate: string;
}

export interface HourlyPaymentListParams {
  orderId?: string;
  status?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'amount' | 'status' | 'createdDate';
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Notifications ====================

export interface HourlyOrderNotification {
  id: string;
  orderId: string;
  /** Notification event type, e.g. "HourlyOrderCreated", "HourlyOrderApproved". */
  event: string | null;
  /** Delivery channel (0 = WhatsApp). */
  channel: number;
  recipientPhone: string;
  deliveryStatus: number;
  deliveryStatusName?: string;
  sentAt: string | null;
  /** Populated when deliveryStatus = Failed, e.g. "Template not found". */
  errorMessage: string | null;
  createdDate: string;
}

export interface HourlyNotificationListParams {
  orderId?: string;
  deliveryStatus?: number;
  recipientPhone?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Reports ====================

export interface HourlyOrdersSummaryReport {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  assignedOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  paidRevenue: number;
}

export interface HourlyRevenueReport {
  totalCollected: number;
  totalRefunded: number;
  netRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

export interface HourlyWorkerUtilizationReport {
  workerId?: string;
  workerName?: string;
  totalAssignments: number;
  completedAssignments: number;
  activeAssignments: number;
  utilizationRate: number;
}

export interface HourlyDriverPerformanceReport {
  driverId?: string;
  driverName?: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  completionRate: number;
}

export interface HourlyReportFilterParams {
  dateFrom?: string;
  dateTo?: string;
  serviceCity?: string;
  status?: number;
  // Branch scoping — verified live: OrdersSummary honors branchId (5 → 0).
  branchId?: string;
  includeSubBranches?: boolean;
}

// ==================== Invoices ====================

export interface HourlyOrderInvoice {
  id: string;
  orderId: string;
  invoiceNumber?: string;
  dueDate: string | null;
  notes: string | null;
  createdDate: string;
}

export interface IssueHourlyOrderInvoiceDto {
  dueDate?: string;
  notes?: string;
}

// ==================== Accommodation ====================

export interface HourlyOrderAccommodation {
  id: string;
  orderId: string;
  housingId: string | null;
  checkInDate: string;
  checkOutDate: string;
  numberOfWorkers: number;
  cost: number;
  notes: string | null;
  status: number;
  statusName: string;
  createdDate: string;
}

export interface BookHourlyOrderAccommodationDto {
  housingId?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfWorkers: number;
  cost: number;
  notes?: string;
}

export interface UpdateHourlyAccommodationStatusDto {
  status: number;
  notes?: string;
}

// ==================== Assign Driver ====================

export interface AssignDriverDto {
  driverId: string;
}

// ==================== Worker Assignment Status Enums ====================

export enum HourlyWorkerAssignmentStatus {
  Pending = 0,
  Confirmed = 1,
  EnRoute = 2,
  Arrived = 3,
  InService = 4,
  ServiceCompleted = 5,
  Cancelled = 6,
  NoShow = 7,
  LeftCustomer = 8,
  ReturnedToAccommodation = 9,
}

export enum HourlyDriverAssignmentStatus {
  Pending = 0,
  Assigned = 1,
  EnRoute = 2,
  Arrived = 3,
  Completed = 4,
  Cancelled = 5,
}

export enum HourlyAccommodationStatus {
  Requested = 0,
  Confirmed = 1,
  CheckedIn = 2,
  CheckedOut = 3,
  Cancelled = 4,
}

export enum HourlyNotificationDeliveryStatus {
  Pending = 0,
  Sent = 1,
  Delivered = 2,
  Failed = 3,
}

export enum HourlyPaymentMethod {
  Card = 1,
  BankTransfer = 2,
}

export enum HourlyPaymentRecordStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Refunded = 3,
  Cancelled = 4,
}

export enum HourlyOrderPaymentStatus {
  Unpaid = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Refunded = 3,
  Failed = 4,
}
