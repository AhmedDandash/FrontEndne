// ==================== Housing Unit Types ====================

export interface HousingDto {
  name: string;
  address?: string | null;
  capacity: number;
  notes?: string | null;
  workerHousingCost?: number | null;
  housingOperationPrice?: number | null;
}

export interface Housing extends HousingDto {
  id: string;
  isActive: boolean;
  currentOccupancy: number;
  availableSlots: number;
  createdDate?: string | null;
}

export interface HousingActiveItem {
  id: string;
  name: string;
  capacity: number;
  availableSlots: number;
}

// ==================== Worker Status Log Types ====================

export interface WorkerStatusLogDto {
  workerId: string;
  /** StatusType 8 = Housing. housingId is mandatory when statusType === 8 */
  statusType: number;
  housingId?: string | null;
  statusDate: string;
  notes?: string | null;
  /** Present on the live CreateWorkerStatusLogDto schema; unused by any current caller. */
  penaltyAmount?: number | null;
  /** Present on the live CreateWorkerStatusLogDto schema; unused by any current caller. */
  agentId?: string | null;
}

// ==================== Housed Worker Types ====================

export interface HousingApplicantParams {
  pageNumber?: number;
  pageSize?: number;
  searchKeyword?: string;
  nationalityId?: string;
  agentId?: string;
  jobId?: string;
  isReadyForDeportation?: boolean;
  isReadyForHandover?: boolean;
  hasResidency?: boolean;
  wantsWork?: boolean;
  wantsTransfer?: boolean;
}

export interface HousedWorker {
  workerId: string;
  referenceNo?: string | null;
  workerName?: string | null;
  workerPassportNumber?: string | null;
  mobile?: string | null;
  nationalityId?: string | null;
  nationalityNameAr?: string | null;
  nationalityNameEn?: string | null;
  age?: number | null;
  birthDate?: string | null;
  jobName?: string | null;
  uploadImage?: string | null;
  workerStatus?: number | null;
  workerType?: number | null;
  agentId?: string | null;
  isActive?: boolean;
  lastStatusType?: number | null;
  lastStatusName?: string | null;
  lastStatusDate?: string | null;
  lastStatusNotes?: string | null;
  // Housing-specific fields
  housingName?: string | null;
  housingAddress?: string | null;
  housedDays?: number | null;
  isReadyForDeportation?: boolean;
  isReadyForHandover?: boolean;
  isResidencyIssued?: boolean;
  iqamaNumber?: string | null;
  notes?: string | null;
  wantsTransfer?: boolean;
  wantsWork?: boolean;
}

// ==================== Action DTOs ====================

export interface DeportationDto {
  transportType: string;
  carrierName?: string | null;
  tripNumber?: string | null;
  deportationTime?: string | null;
  destinationName?: string | null;
  saudiMobile?: string | null;
  whatsAppNumber?: string | null;
  borderNumber?: string | null;
  ticketType?: string | null;
  ticketImage?: File | null;
}

export interface HandoverDto {
  handoverTime: string;
  saudiMobile?: string | null;
  whatsAppNumber?: string | null;
  borderNumber?: string | null;
}

export interface IssueResidencyDto {
  iqamaNumber: string;
}

export interface AddUpdateDto {
  updateDate: string;
  notes: string;
}

export interface ExitAndReEntryDto {
  exitDate: string;
  reason?: string | null;
}
