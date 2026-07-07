# Backend API Changes — Branch, Filtering, Reports & Excel Export

> **Generated:** 2026-07-01  
> **Purpose:** Guide frontend implementation for branch scoping, advanced list filters, report filters, and Excel export endpoints.

---

## Overview

The backend now supports:

1. **Branch identification** on create/update and list filtering via `BranchId`
2. **Shared filter parameters** on list and report endpoints
3. **Excel export** endpoints that mirror list filters exactly
4. **JWT branch context** via `branchId` claim (already issued at login)

---

## Shared Filter Model (`PagedFilterQueryBase`)

Most list/report query DTOs now inherit or include these optional parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `branchId` | `Guid?` | null | Filter by branch. When set, returns records for that branch (and optionally sub-branches). |
| `includeSubBranches` | `bool` | `true` | When `branchId` is a main branch, include its sub-branches in the filter. |
| `search` | `string?` | null | Cross-field text search (entity-specific fields). |
| `createdDateFrom` | `DateTime?` | null | Filter `CreatedDate >= value` |
| `createdDateTo` | `DateTime?` | null | Filter `CreatedDate <= value` |
| `updatedDateFrom` | `DateTime?` | null | Filter `UpdatedDate >= value` |
| `updatedDateTo` | `DateTime?` | null | Filter `UpdatedDate <= value` |
| `pageNumber` | `int` | `1` | Page index (1-based) |
| `pageSize` | `int` | `10` | Page size (clamped server-side to max 500) |
| `sortBy` | `string?` | null | Sort field name (where supported) |
| `sortDescending` | `bool` | `false` | Sort direction |

### Branch behavior

- **List filter:** Pass `branchId` to scope results. Omit to return all branches (admin views).
- **Create:** Optional `branchId` on create DTOs. If omitted, backend uses the logged-in user's JWT `branchId`.
- **Hierarchy:** Main branch + `includeSubBranches=true` includes all child sub-branches.

### User branch from JWT

`BaseController` exposes `CurrentBranchId` from claim `branchId`. Frontend should:

- Send user's branch as default filter on list screens (optional, based on role)
- Allow admins to clear or change `branchId` filter
- Pass `branchId` on create forms when user selects a branch explicitly

---

## New Excel Export Endpoints

All export endpoints use **the same query parameters** as their list counterpart.  
Response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx` download).

| Module | Method | Endpoint | Query DTO |
|--------|--------|----------|-----------|
| Workers | `GET` | `/api/V1/Worker/export` | `WorkerQuery` |
| Customers | `GET` | `/api/V1/Customer/export` | `CustomerQuery` |
| Transfer Contracts | `GET` | `/api/TransferContract/export` | `TransferContractQuery` |
| Mediation Contracts | `GET` | `/api/Mediation/MediationContract/export` | `FilterMediationContractDto` |
| Payroll (existing) | `GET` | `/api/V1/Payroll/export` | `month`, `year` |

### Frontend export pattern

```typescript
// Reuse the same filter state as the list/grid
const params = new URLSearchParams({
  branchId: filters.branchId ?? '',
  search: filters.search ?? '',
  pageNumber: '1',        // ignored for export (all filtered rows, max 50k)
  pageSize: '10',         // ignored for export
  // ... entity-specific filters
});

const response = await fetch(`/api/V1/Worker/export?${params}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const blob = await response.blob();
// trigger download with Content-Disposition filename or a generated name
```

---

## Module-Specific Changes

### 1. Workers — `GET /api/V1/Worker`

**Query (`WorkerQuery`)** — extends shared base +:

| Field | Type | Notes |
|-------|------|-------|
| `searchName` | string? | Name search (legacy, still works) |
| `nationalId` | string? | |
| `passportNo` | string? | |
| `mobile` | string? | |
| `nationalityId` | Guid? | |
| `jobId` | Guid? | |
| `workerStatus` | enum? | |
| `minAge` / `maxAge` | int? | |
| `agentId` | Guid? | |
| + all `PagedFilterQueryBase` fields | | |

**Create (`CreateWorkerDto`):** added optional `branchId`

**Export:** `GET /api/V1/Worker/export`

---

### 2. Customers — `GET /api/V1/Customer`

**Query (`CustomerQuery`)** — extends shared base +:

| Field | Type |
|-------|------|
| `searchName` | string? |
| `idNumber` | string? |
| `mobile` | string? |
| `email` | string? |
| `nationality` | string? |
| `agentId` | Guid? |
| `marketerId` | Guid? |

**Create (`CreateCustomerDto`):** added optional `branchId`

**Export:** `GET /api/V1/Customer/export`

---

### 3. Transfer Contracts — `GET /api/TransferContract`

**Breaking (non-breaking at HTTP level):** Replaced `pageNumber`, `pageSize`, `search` with full `TransferContractQuery`:

| Field | Type |
|-------|------|
| `contractNumber` | int? |
| `customerId` | Guid? |
| `workerId` | Guid? |
| `marketerId` | Guid? |
| `contractStatus` | enum? |
| `customerNationalId` | string? |
| `workerPassportNo` | string? |
| `customerPhone` | string? |
| `requestDateFrom` / `requestDateTo` | DateTime? |
| + shared base fields | |

**Create:** optional `branchId` on `CreateTransferContractDto`

**Export:** `GET /api/TransferContract/export`

---

### 4. Mediation Contracts — `GET /api/Mediation/MediationContract`

**Query (`FilterMediationContractDto`)** — enhanced:

| New/Updated Field | Type |
|-------------------|------|
| `branchId`, `includeSubBranches` | branch scoping |
| `search` | cross-field search |
| `customerId`, `workerId`, `agentId`, `marketerId` | Guid? |
| `contractType` | short? |
| `customerPhone`, `visaNumber` | string? |
| `createdDateFrom/To`, `updatedDateFrom/To` | DateTime? |
| `page` / `pageSize` | pagination (note: uses `page` not `pageNumber`) |

**Follow-up dashboard** (`GET /api/Mediation/MediationFollowUp/dashboard`) uses the same filter DTO.

**Export:** `GET /api/Mediation/MediationContract/export`

---

### 5. Employment Operating Contracts — `GET /api/V1/EmploymentOperatingContract`

**Query (`EmploymentOperatingContractQuery`)** — extends shared base +:

| Field | Type |
|-------|------|
| `searchWorkerName` | string? |
| `workerPhone` | string? |
| `identityNumber` | string? (query param; filters via worker phone/name in practice) |
| `contractNumber` | int? |
| `customerId`, `workerId`, `marketerId` | Guid? |
| `contractStatus` | enum? |
| `isFinish` | bool? |
| `contractDateFrom` / `contractDateTo` | DateTime? (maps to `ContractStartDate`) |

---

### 6. Complaints — `GET /api/Complaint`

**Query (`ComplaintQuery`)** — replaces `pageNumber`, `pageSize`, `search`:

| Field | Type |
|-------|------|
| `customerId`, `workerId` | Guid? |
| `status` | ComplaintStatus? |
| `relatedContractType` | enum? |
| `relatedContractId` | Guid? |
| `customerPhone`, `customerNationalId` | string? |
| + shared base fields | |

---

### 7. Journal Entries — `GET /api/V1/JournalEntries`

**Query (`JournalEntryQueryDto`)** — extends shared base +:

| Field | Type |
|-------|------|
| `from` / `to` | DateTime? (entry date) |
| `status`, `source`, `referenceType` | enums? |
| `sourceId`, `customerId`, `agentId`, `workerId`, `employeeId` | Guid? |
| `entryNumber` | string? |

**Branch filter:** filters journal entries by `BranchId`.

---

### 8. Hourly Worker Orders — `FilterHourlyWorkerRequestDto` / `FilterHourlyOrderDto`

Extended with:

- `branchId`, `includeSubBranches`, `search`
- `customerPhone`, `serviceCity`, `packageId`, `paymentStatus`
- `createdDateFrom/To`, `updatedDateFrom/To`
- `sortBy`, `sortDescending`

---

### 9. Hourly Workers Admin — `FilterHourlyWorkerDto`

Extended with shared base fields (`branchId`, `search`, date ranges, pagination, sort).

---

### 10. Hourly Reports — `GET /api/V1/HourlyWorkerReports/*`

**Query (`FilterHourlyReportDto`)** — enhanced:

| Field | Type |
|-------|------|
| `branchId`, `includeSubBranches` | branch scoping |
| `dateFrom`, `dateTo` | DateTime? |
| `serviceCity` | string? |
| `ticketNumber`, `customerPhone` | string? |
| `status` | HourlyWorkerRequestStatus? |
| `search` | string? |

Endpoints: `OrdersSummary`, `Revenue`, `WorkerUtilization`, `DriverPerformance`

---

### 11. Accounting Reports — `GET /api/V1/Ledger/*`

**Trial balance & general ledger** request DTOs now accept:

| Field | Type |
|-------|------|
| `branchId` | Guid? |
| `includeSubBranches` | bool |

> **Note:** DTOs are ready; full ledger aggregation branch filtering is partially implemented. Pass `branchId` from UI — backend journal-entry lists are fully branch-filtered.

---

### 12. Accounting Documents (Vouchers)

**`AccountingDocumentFilterDto`** extended with:

- `branchId`, `search`, pagination
- `documentType`, `documentNumber`
- `dateFrom`, `dateTo`

---

## Create DTOs — Branch Fields Added

| DTO | New Field |
|-----|-----------|
| `CreateWorkerDto` | `branchId?: Guid` |
| `CreateCustomerDto` | `branchId?: Guid` |
| `CreateTransferContractDto` | `branchId?: Guid` |

Mediation contracts: `BranchId` auto-set from worker → customer on create.

---

## Recommended Frontend UI Components

### 1. `BranchFilterSelect`

- Load branches from `GET /api/V1/Branch`
- Show main branches with sub-branch toggle (`includeSubBranches`)
- Default to user's JWT `branchId` for staff roles

### 2. `DateRangeFilter`

- `createdDateFrom` / `createdDateTo`
- `updatedDateFrom` / `updatedDateTo`
- Entity-specific ranges (`dateFrom`/`dateTo`, `requestDateFrom`, etc.)

### 3. `ExportButton`

- Calls `.../export` with **identical** query params as current list
- Shows loading state; downloads blob as `.xlsx`

### 4. `AdvancedFilterPanel`

Collapsible panel per module with:

- Branch selector
- Global search
- Entity-specific fields (status, contract number, phone, national ID, etc.)
- Date ranges
- Clear / Apply buttons

### 5. Filter State Persistence

Store filter state in URL query params or session so list + export stay in sync.

---

## Pagination Notes

| Module | Page param name |
|--------|-----------------|
| Most modules | `pageNumber` |
| Mediation contracts | `page` |
| Employees (HR) | `page` |

Always send both `pageNumber`/`page` and `pageSize` together.

---

## TypeScript Interfaces (starter)

```typescript
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

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

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

export interface FilterMediationContractQuery extends PagedFilterQuery {
  contractNumber?: number;
  customerNationalId?: string;
  workerPassportNumber?: string;
  contractId?: string;
  customerId?: string;
  workerId?: string;
  statusId?: number;
  contractType?: number;
  nationalityId?: string;
  workerType?: number;
  customerPhone?: string;
  visaNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;       // mediation uses `page` not `pageNumber`
  pageSize?: number;
}
```

---

## Migration Checklist for Frontend

- [ ] Add branch selector to all list screens (workers, customers, contracts, hourly, accounting)
- [ ] Update API clients to send new query params
- [ ] Replace Transfer Contract list params with `TransferContractQuery`
- [ ] Replace Complaint list params with `ComplaintQuery`
- [ ] Add export buttons wired to new `/export` endpoints
- [ ] Pass `branchId` on create forms (optional; falls back to user branch)
- [ ] Mediation list: support new filters + `page` pagination param
- [ ] Hourly reports: pass `branchId` and new search fields
- [ ] Journal entries: add branch + worker/employee filters
- [ ] Parse `branchId` from login JWT for default scoping

---

## Assumptions & Limitations

1. **Existing data** may have `branchId = null` — those records appear when no branch filter is applied.
2. **Export cap:** 50,000 rows per export request.
3. **No new DB migration** in this change — `BranchId` columns already exist on entities.
4. **Ledger report branch filtering** at aggregation level is DTO-ready; journal entry lists are fully filtered.
5. **HR modules** (loans, permissions, etc.) not yet migrated to shared filter pattern — future iteration.
6. **Backward compatible:** Old query params still work where not replaced (e.g. mediation `page`/`pageSize` unchanged).

---

## Backend Files Reference

See project root implementation summary for full list of modified/created backend files.
