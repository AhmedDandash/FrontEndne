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
  workerId: string;
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
