# Day 8/8 — Missing Search Filters (Backend Ready)

> **Audience:** Front-end team  
> **Date:** 2026-08-08  
> **Topic:** New query parameters for Mediation Contracts, Automatic Follow-Up, and Rental/Operating Contracts  
> **Breaking changes:** None — all new params are optional. Existing filters still work.

---

## Summary

Backend now supports the search filters that were missing from the Parameter Gap Analysis.

| Screen | Endpoint | Query DTO |
|--------|----------|-----------|
| Mediation Contracts list | `GET api/Mediation/MediationContract` | `FilterMediationContractDto` |
| Mediation Export | `GET api/Mediation/MediationContract/export` | Same filters as list |
| Automatic Follow-Up dashboard | `GET api/Mediation/MediationFollowUp/dashboard` | Same DTO as Mediation |
| Rental / Operating Contracts | `GET api/EmploymentOperatingContract` | `EmploymentOperatingContractQuery` |

**Rules (all filters):**

- Omit or send `null` → ignored
- Filtering runs **before** pagination
- Export uses the **exact same** filter logic as the list
- Date ranges: `From` = `>=`, `To` = `<=`
- Booleans: `true` / `false` filter; omit to ignore
- Strings: case-insensitive, trimmed; default match = `Contains` (unless noted)
- Numbers / enums / GUIDs: exact match

ASP.NET Core binds query params **case-insensitively** (`externalStatusId` ≡ `ExternalStatusId`).

---

## 1. Mediation Contracts + Automatic Follow-Up

Use these on:

- `GET api/Mediation/MediationContract`
- `GET api/Mediation/MediationContract/export`
- `GET api/Mediation/MediationFollowUp/dashboard`

### 1.1 Newly supported query parameters

| Query param | Type | Behavior |
|-------------|------|----------|
| `externalStatusId` | `short?` | Alias of `statusId` (current contract status) |
| `manualContractStatus` | `short?` | Also filters `statusId` |
| `workerNumber` | `string?` | Contains on worker `referenceNo` / `borderNumber` / `iqamaNumber` / `nationalId` |
| `visaStatus` | `short?` | Exact match on contract `visaType` |
| `incompleteExternalStatusId` | `short?` | Contracts where `statusId < value` (not yet reached this milestone) |
| `pastExternalStatusId` | `short?` | Contracts that **previously** reached this status (status history) |
| `warrantyStatus` | `short?` | Exact match on current `statusId` (use `14` = WarrantyPeriod, `16` = Returned) |
| `createdBy` | `string?` | Creator user id (**Exact** match by default) |
| `cancellationDateFrom` | `DateTime?` | Cancellation date range start |
| `cancellationDateTo` | `DateTime?` | Cancellation date range end |
| `arrivalDateFrom` | `DateTime?` | Arrival date range start |
| `arrivalDateTo` | `DateTime?` | Arrival date range end |
| `isReplacement` | `bool?` | `true` = Transfer type **or** more than one worker assignment |
| `musanedPaymentStatus` | `0 \| 1 \| 2` | Computed payment status (see enum below) |
| `referenceNumber` | `string?` | Payment reference **or** worker reference number |
| `workersAddedToday` | `bool?` | Worker assigned today (UTC) |
| `religion` | `1 \| 2 \| 3` | Worker religion |
| `hasPreviousExperience` | `bool?` | Worker experience **or** offer previous-experience flag |
| `jobId` | `Guid?` | Worker job **or** offer job |
| `isVip` | `bool?` | `true` = `contractCategory == 2` (VIP) |

### 1.2 Follow-Up–specific extras (same DTO)

These work on all three endpoints above (most useful on the dashboard):

| Query param | Type | Behavior |
|-------------|------|----------|
| `externalStatusDateFrom` | `DateTime?` | When the **current** status was set (status history) |
| `externalStatusDateTo` | `DateTime?` | End of that range |
| `notArrivedAfterSigningDateDays` | `int?` | Still not arrived, and Signed date is older than N days |
| `notArrivedAfterArrivalDateDays` | `int?` | Still not arrived, and **WorkerDeparted** date is older than N days *(see caveats)* |
| `customerEmail` | `string?` | Customer email contains |

### 1.3 Useful existing aliases (do not duplicate)

| Frontend concept | Prefer this param | Already existed |
|------------------|-------------------|-----------------|
| External status | `externalStatusId` **or** `statusId` | `statusId` |
| VIP | `isVip=true` **or** `contractCategory=2` | `contractCategory` |
| Paid / unpaid only | `musanedPaymentStatus` **or** `isPaid` / `isUnpaid` | `isPaid`, `isUnpaid` |

### 1.4 Enums for Mediation filters

**`musanedPaymentStatus` (`MediationContractPaymentStatus`)**

| Value | Meaning |
|------:|---------|
| `0` | Unpaid |
| `1` | PartiallyPaid |
| `2` | Paid |

**`religion`**

| Value | Meaning |
|------:|---------|
| `1` | Muslim |
| `2` | Christian |
| `3` | Other |

**`statusId` / `externalStatusId` / `manualContractStatus` / `warrantyStatus` (`MediationContractStatus`)**

| Value | Name |
|------:|------|
| `1` | Draft |
| `2` | Signed |
| `3` | UnderFollowUp |
| `4` | VisaIssued |
| `5` | MedicalExamDone |
| `6` | TrainingDone |
| `7` | AuthoritiesApproved |
| `8` | TicketBooked |
| `9` | WorkerDeparted |
| `10` | WorkerArrived |
| `11` | DeliveryFormIssued |
| `12` | CustomerSigned |
| `13` | Delivered |
| `14` | WarrantyPeriod |
| `15` | Completed |
| `16` | Returned |
| `17` | Cancelled |

### 1.5 Example — Mediation list

```http
GET /api/Mediation/MediationContract
  ?externalStatusId=3
  &isVip=true
  &musanedPaymentStatus=0
  &religion=1
  &hasPreviousExperience=true
  &workersAddedToday=true
  &createdBy=user-id-here
  &page=1
  &pageSize=20
```

### 1.6 Example — Follow-Up dashboard

```http
GET /api/Mediation/MediationFollowUp/dashboard
  ?externalStatusId=8
  &notArrivedAfterSigningDateDays=14
  &customerEmail=@gmail.com
  &arrivalDateFrom=2026-01-01
  &arrivalDateTo=2026-08-01
  &page=1
  &pageSize=20
```

---

## 2. Rental / Operating Contracts

Endpoint: `GET api/EmploymentOperatingContract`

### 2.1 Newly supported query parameters

| Query param | Type | Behavior |
|-------------|------|----------|
| `customerArabicName` | `string?` | Customer Arabic name contains |
| `customerPhone` | `string?` | Any customer phone contains |
| `customerEmail` | `string?` | Customer email contains |
| `createdBy` | `string?` | Creator user id (**Exact** by default) |
| `expiresAfterDays` | `int?` | End date between **today** and **today + N days** (UTC) |
| `expirationCondition` | `1 \| 2 \| 3` | See enum below |
| `laborSelectionStatus` | `short?` | Alias of existing `laborManagement` |
| `workerPassportNumber` | `string?` | Worker passport contains |

### 2.2 `expirationCondition`

| Value | Name | Meaning |
|------:|------|---------|
| `1` | `NotExpired` | `contractEndDate >= today` |
| `2` | `Expired` | `contractEndDate < today` |
| `3` | `ExpiringWithinDays` | Ends within `expiresAfterDays` (defaults to **30** if `expiresAfterDays` omitted) |

**Examples**

```http
# Expire within 15 days
GET /api/EmploymentOperatingContract?expiresAfterDays=15

# Already expired
GET /api/EmploymentOperatingContract?expirationCondition=2

# Expiring within 30 days (default window)
GET /api/EmploymentOperatingContract?expirationCondition=3

# Expiring within 7 days via condition
GET /api/EmploymentOperatingContract?expirationCondition=3&expiresAfterDays=7
```

### 2.3 Example — customer + passport search

```http
GET /api/EmploymentOperatingContract
  ?customerArabicName=أحمد
  &customerPhone=05
  &customerEmail=@
  &workerPassportNumber=A12
  &laborSelectionStatus=1
  &pageNumber=1
  &pageSize=20
```

> Pagination for this endpoint uses `pageNumber` / `pageSize` (not `page`).

---

## 3. Not supported (backend limitation)

Wire these as **disabled / hidden** in the UI until DB support returns:

| Param | Screen | Reason |
|-------|--------|--------|
| `musanedContractStatus` | Mediation / Follow-Up | Musaned detail table was removed — no column to filter |
| `financialStatus` | Operating | No financial-status field on operating contracts |

---

## 4. Important caveats for FE

1. **Arrival dates**  
   There is no flight `ArrivalDate` column anymore.  
   - `arrivalDateFrom` / `arrivalDateTo` use the date the contract entered status **WorkerArrived (10)**.  
   - `notArrivedAfterArrivalDateDays` uses status **WorkerDeparted (9)** as the start of the waiting window.

2. **Cancellation dates**  
   No dedicated cancellation-date column. Backend uses Cancelled status-history date (fallback: `updatedDate` when `isCancel`).

3. **`isVip` vs `contractCategory`**  
   Prefer one. If both are sent, both apply (AND). Example: `isVip=true` + `contractCategory=1` returns empty.

4. **`externalStatusId` vs `statusId`**  
   Same field. Prefer one param to avoid conflicting AND filters.

5. **`laborSelectionStatus` vs `laborManagement`**  
   Same field. If both sent, `laborManagement` wins.

6. **Response models unchanged**  
   List/export/dashboard response shapes are the same as before.

---

## 5. FE checklist

- [ ] Wire Mediation search panel params to the new query names above  
- [ ] Reuse the same params on Mediation **export**  
- [ ] Wire Automatic Follow-Up filters (including `notArrivedAfter*` + `customerEmail`)  
- [ ] Wire Operating/Rental filters (`customerArabicName`, phones, email, expiration, passport)  
- [ ] Disable or hide `musanedContractStatus` and Operating `financialStatus`  
- [ ] Confirm date pickers send ISO dates; omit empty strings (prefer omit/`null`, not `""`)  
- [ ] Confirm pagination: Mediation/Follow-Up → `page` + `pageSize`; Operating → `pageNumber` + `pageSize`

---

## 6. Suggested TypeScript (new fields only)

```ts
/** Shared by Mediation list, export, and Follow-Up dashboard */
export interface MediationContractFilterExtras {
  externalStatusId?: number;
  manualContractStatus?: number;
  workerNumber?: string;
  visaStatus?: number;
  incompleteExternalStatusId?: number;
  pastExternalStatusId?: number;
  warrantyStatus?: number;
  createdBy?: string;
  cancellationDateFrom?: string; // ISO
  cancellationDateTo?: string;
  arrivalDateFrom?: string;
  arrivalDateTo?: string;
  isReplacement?: boolean;
  musanedPaymentStatus?: 0 | 1 | 2;
  referenceNumber?: string;
  workersAddedToday?: boolean;
  religion?: 1 | 2 | 3;
  hasPreviousExperience?: boolean;
  jobId?: string;
  isVip?: boolean;

  // Follow-Up oriented
  externalStatusDateFrom?: string;
  externalStatusDateTo?: string;
  notArrivedAfterArrivalDateDays?: number;
  notArrivedAfterSigningDateDays?: number;
  customerEmail?: string;
}

export type ExpirationCondition = 1 | 2 | 3;
// 1 = NotExpired, 2 = Expired, 3 = ExpiringWithinDays

export interface EmploymentOperatingFilterExtras {
  customerArabicName?: string;
  customerPhone?: string;
  customerEmail?: string;
  createdBy?: string;
  expiresAfterDays?: number;
  expirationCondition?: ExpirationCondition;
  laborSelectionStatus?: number;
  workerPassportNumber?: string;
}
```

---

## 7. Contact / questions

If a filter returns unexpected empty results, check:

1. Conflicting AND params (e.g. `statusId` + different `externalStatusId`)
2. Date timezone (backend uses UTC for “today” windows)
3. Whether the UI still sends a param that was **skipped** (`musanedContractStatus`, Operating `financialStatus`)
