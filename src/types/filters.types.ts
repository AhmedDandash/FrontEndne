/**
 * Shared list-filter types for the branch-scoping / advanced-filter / export
 * feature (see `new edits2.md`). These mirror the backend `PagedFilterQueryBase`
 * and per-module query DTOs. Field names are camelCase — ASP.NET query-string
 * binding is case-insensitive, so `branchId` binds to `BranchId`, etc.
 *
 * IMPORTANT pagination quirk: most modules use `pageNumber`, but Mediation
 * contracts and HR Employees use `page`. `buildListParams` handles this.
 */

/** Base filter shared by most list + report + export endpoints. */
export interface PagedFilterQuery {
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  createdDateFrom?: string; // ISO date
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/** Standard paged envelope returned under `data`. */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// ─── Workers — GET /api/V1/Worker (+ /export) ────────────────────────────────
export interface WorkerQuery extends PagedFilterQuery {
  searchName?: string;
  nationalId?: string;
  passportNo?: string;
  mobile?: string;
  nationalityId?: string;
  jobId?: string;
  workerStatus?: number;
  minAge?: number;
  maxAge?: number;
  agentId?: string;
}

// ─── Customers — GET /api/V1/Customer (+ /export) ────────────────────────────
export interface CustomerQuery extends PagedFilterQuery {
  searchName?: string;
  idNumber?: string;
  mobile?: string;
  email?: string;
  nationality?: string;
  agentId?: string;
  marketerId?: string;
}

// ─── Transfer Contracts — GET /api/TransferContract (+ /export) ──────────────
export interface TransferContractQuery extends PagedFilterQuery {
  contractNumber?: number;
  customerId?: string;
  workerId?: string;
  marketerId?: string;
  contractStatus?: number;
  customerNationalId?: string;
  workerPassportNo?: string;
  customerPhone?: string;
  requestDateFrom?: string;
  requestDateTo?: string;
}

// ─── Mediation Contracts — GET /api/Mediation/MediationContract (+ /export) ──
// NOTE: mediation paginates with `page` (not `pageNumber`).
export interface FilterMediationContractQuery {
  branchId?: string;
  includeSubBranches?: boolean;
  search?: string;
  contractNumber?: number;
  customerNationalId?: string;
  workerPassportNumber?: string;
  contractId?: string;
  customerId?: string;
  workerId?: string;
  agentId?: string;
  marketerId?: string;
  statusId?: number;
  contractType?: number;
  nationalityId?: string;
  workerType?: number;
  customerPhone?: string;
  visaNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}
