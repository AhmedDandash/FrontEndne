# BACKEND_REVIEW_README.md

Report for Frontend Developers — Sigma.API Backend Review (Points 1–10).

**Build status:** Succeeded (0 errors)  
**Mediation tests:** 16 passed  
**Migration:** `20260820125107_AddCustomerBirthDateHijriAndPendingWorkerPassport`

---

## 1. Completed Backend Tasks

| # | Task | Status | What Was Done | API/Endpoint |
| - | ---- | ------ | ------------- | ------------ |
| 1 | Branches | Already existed + verified | Every contract/customer/worker has `BranchId`. Create resolves branch from `X-Branch-Id` / DTO / user. Lists filter by `BranchId` + `IncludeSubBranches`. **All branches:** omit `BranchId` (null) → no branch filter. | `GET/POST api/V1/Branch`, header `X-Branch-Id`, query `BranchId`, `IncludeSubBranches` |
| 2 | Filters / Created By | Already existed + improved | Mediation & Operating filters support `CreatedBy` / `CreatedByUserId`, `DateFrom`/`DateTo`, payment dates, etc. List/detail now return `createdBy` (user id) + `createdByName` (display name). | `GET api/Mediation/MediationContract?CreatedBy={userId}&DateFrom=&DateTo=` |
| 3 | Customer creation | Updated | Fields present: birth date, Hijri birth date, national id, secondary mobile, English name auto, city EN auto, nationality validation against master list, duplicate checks (national id / passport / mobile) with clear 400 errors + DB unique indexes. | `POST/PUT api/V1/Customer`, `POST api/V1/Customer/generate-english-name`, `GET api/V1/Nationality` |
| 4 | Mediation worker selection | Already existed | Only available workers via `AvailableForMediationContract=true`. Passport-only search via `SearchByPassportOnly=true` (+ `PassportNo` or `Search`). Busy workers on active mediation/operating/transfer are excluded. | `GET api/V1/Worker?AvailableForMediationContract=true&SearchByPassportOnly=true&PassportNo=` |
| 5 | Mediation create fields cleanup | Updated | Removed from **Create** DTO/API: Musaned contract number, documentation number, contract category. Visa type was already not required on create (optional entity field only). Musaned number remains on **Sign** only. | `POST api/Mediation/MediationContract`, `POST api/Mediation/MediationContract/sign` |
| 6 | Worker image on contract details | Already existed | Detail/list return `workerPhotoUrl` and `workerImageUrl` (same value from worker upload/attachments). Also on `workerAssignments[]`. | `GET api/Mediation/MediationContract/{id}` |
| 7 | Assign / remove worker workflow | Updated | Create **without** worker allowed. Assign one worker. Second assign blocked until end. End clears worker → contract free again. | `POST` create, `POST .../assign-worker`, `POST .../end-worker-service` |
| 8 | Mediation filters | Already existed + small add | Supports: without worker, paid/unpaid, payment date, create date, created by, pending passport, etc. | `GET api/Mediation/MediationContract` (see filter params below) |
| 9 | Recruitment specific vs specs-only | Updated | Response exposes `hasSpecificWorker`, `workerSelectionLabel`, `workerId`, `pendingWorkerPassportNumber`. External intake: `WorkerId` optional. | `GET .../recruitment-requests`, `POST api/V1/External/request-worker` |
| 10 | Worker not in system (passport) | Added | Store passport without `WorkerId` via create or dedicated endpoint. Cleared when a real worker is assigned. | `POST .../set-pending-worker-passport`, create with `WorkerPassportNumber` only |

---

## 2. API Changes

### Customer

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `api/V1/Customer` | Accepts/returns `birthDateHijri`. Auto `englishName` / `cityEn` if empty. Validates nationality against active `Nationalities`. Duplicate → 400 Arabic message. |
| PUT | `api/V1/Customer/{id}` | Same rules. |
| GET | `api/V1/Customer`, `/{id}` | Includes `birthDateHijri`. |
| POST | `api/V1/Customer/generate-english-name` | Unchanged helper. |

**Create body extras:**

```json
{
  "arabicName": "...",
  "englishName": null,
  "nationality": "سعودي",
  "nationalId": "...",
  "identityNumber": "...",
  "birthDate": "1990-01-15",
  "birthDateHijri": "1410/05/15",
  "secondaryMobileNumber": "...",
  "cityAr": "الرياض",
  "cityEn": null,
  "branchId": null,
  "phones": [{ "phoneNumber": "...", "isPrimary": true }]
}
```

### Mediation Contract Create

`POST api/Mediation/MediationContract` (`multipart/form-data`)

| Field | Required? | Notes |
|-------|-----------|-------|
| `CustomerId` | Yes | |
| `OfferId` | Yes | |
| `WorkerId` | **No** | Omit to create without worker |
| `WorkerPassportNumber` | Only if `WorkerId` set | If set **without** `WorkerId` → saved as `pendingWorkerPassportNumber` |
| ~~`MusanedContractNumber`~~ | Removed from create | Use Sign |
| ~~`MusanedDocumentationNumber`~~ | Removed from create | |
| ~~`ContractCategory` / `contractClassification`~~ | Removed from create | |

### Worker lifecycle

| Method | Endpoint | Behavior |
|--------|----------|----------|
| POST | `api/Mediation/MediationContract/assign-worker` | Body: `{ contractId, workerId, workerPassportNumber }`. Fails if worker already assigned. Clears pending passport. |
| POST | `api/Mediation/MediationContract/end-worker-service` | Body: `{ contractId, reason? }`. Clears `workerId` → contract can accept a new worker. |
| POST | `api/Mediation/MediationContract/set-pending-worker-passport` | **New.** Body: `{ contractId, workerPassportNumber }`. For worker not in system. Fails if contract already has assigned worker or passport already exists as a Worker. |

### External recruitment

`POST api/V1/External/request-worker`

```json
{
  "workerId": null,
  "workerPassportNumber": "A1234567",
  "customerName": "...",
  "phone": "...",
  "identityNumber": "...",
  "notes": "..."
}
```

- `workerId` set → specific booked worker (`hasSpecificWorker=true`)
- only `workerPassportNumber` → pending passport (`hasSpecificWorker=true`)
- neither → specs-only request (`hasSpecificWorker=false`)

### Available workers (passport search)

```
GET api/V1/Worker?AvailableForMediationContract=true&SearchByPassportOnly=true&PassportNo=A12
```

### Important list/detail response fields

```json
{
  "branchId": "...",
  "branchNameAr": "...",
  "workerId": null,
  "workerName": null,
  "workerPassportNumber": "A123",
  "pendingWorkerPassportNumber": "A123",
  "hasAssignedWorker": false,
  "hasSpecificWorker": true,
  "workerPhotoUrl": "https://...",
  "workerImageUrl": "https://...",
  "createdBy": "user-guid",
  "createdByName": "أحمد محمد",
  "isPaid": false,
  "invoicePaymentDate": null
}
```

### Key mediation filters (`GET api/Mediation/MediationContract`)

| Query param | Purpose |
|-------------|---------|
| `CreatedBy` / `CreatedByUserId` | Employee who created (AspNet user id) |
| `DateFrom` / `DateTo` | Creation date range |
| `WithoutAssignedWorker=true` | Contracts with no worker |
| `HasPendingWorkerPassport=true` | Pending passport only |
| `IsPaid` / `IsUnpaid` | Payment state |
| `PaymentDateFrom` / `PaymentDateTo` | Payment records dates |
| `InvoicePaymentDateFrom` / `InvoicePaymentDateTo` | Musaned invoice payment dates |
| `BranchId` + `IncludeSubBranches` | Branch scope; omit `BranchId` for **all branches** |

Employee picker for Created By: `GET api/V1/Employee` → use linked `userId` as `CreatedBy`.

---

## 3. Database Changes

Migration: **`20260820125107_AddCustomerBirthDateHijriAndPendingWorkerPassport`**

| Table | Column | Type |
|-------|--------|------|
| `Customers` | `BirthDateHijri` | `nvarchar(30)` nullable |
| `MediationContracts` | `PendingWorkerPassportNumber` | `nvarchar(max)` nullable |

Existing duplicate guards (unchanged): unique `NationalId`, unique passport when `IdentityType = Passport`.

Startup seed (idempotent): branches + customer nationalities (سعودي / سوري / مصري / يمني).

---

## 4. Important Notes (Business Rules)

1. **One worker per mediation contract** at a time. Assign again only after `end-worker-service`.
2. **Create without worker** is allowed; then assign later.
3. **Passport-only (not in system)** uses `pendingWorkerPassportNumber`, not a fake Worker row.
4. **Musaned numbers / contract category** are not part of create anymore; Musaned number can be set on **sign**.
5. **Visa type** is not required and not collected on create.
6. **Customer nationality** must match an active row in `Nationalities` (Arabic or English name). Seed includes سعودي، سوري، مصري، يمني; more can be managed via Nationality APIs.
7. **Branch:** send `X-Branch-Id` on non-GET requests. For “all branches” lists, do not pass `BranchId`.
8. Worker picker for mediation must use **available + passport search** flags; do not list all workers.

---

# Frontend Required Tasks

## 1. Mediation Create Form

- Stop sending / remove UI fields: Musaned contract number, documentation number, contract classification/category, visa type.
- Make worker optional on create.
- Support create with passport only (no worker) → maps to pending passport.

**API:** `POST api/Mediation/MediationContract`

## 2. Worker Picker

- Call workers with `AvailableForMediationContract=true` and `SearchByPassportOnly=true`.
- Search by passport number, not name.

**API:** `GET api/V1/Worker?...`

## 3. Display Worker Image

Backend returns:

- `workerPhotoUrl`
- `workerImageUrl`
- `workerAssignments[].workerPhotoUrl`

Show image on mediation contract details.

**API:** `GET api/Mediation/MediationContract/{id}`

## 4. Assign / Remove Worker Actions

Wire UI actions:

- Assign → `POST .../assign-worker`
- Remove/end → `POST .../end-worker-service`
- Hide assign when `hasAssignedWorker === true`
- Show assign again after end

## 5. Pending Passport (Worker Not In System)

Add UI to enter passport when worker is not in the system:

- On create: `WorkerPassportNumber` without `WorkerId`, **or**
- Later: `POST .../set-pending-worker-passport`

Display `pendingWorkerPassportNumber` in details.

## 6. Created By Filter

Add filter “أنشأ بواسطة” with employee dropdown.

- Employees: `GET api/V1/Employee`
- Filter param: `CreatedBy` or `CreatedByUserId` = employee `userId`
- Combine with `DateFrom` / `DateTo` for month/period

Display list column: `createdByName`

## 7. Mediation List Filters

Ensure these hit the backend (not client-only):

- Without worker → `WithoutAssignedWorker=true`
- Paid → `IsPaid=true`
- Payment date → `PaymentDateFrom` / `PaymentDateTo` (and/or invoice payment dates)
- Created by / created date as above

## 8. Customer Form

- Collect `birthDateHijri`, `nationalId`, `secondaryMobileNumber`
- Nationality dropdown from `GET api/V1/Nationality` (show سعودي/سوري/مصري/يمني etc.)
- Optional: call `generate-english-name`; backend also auto-fills English name/city if empty
- Handle 400 duplicate errors from backend and show message to user

## 9. Recruitment Requests Screen

Use:

- `hasSpecificWorker`
- `workerSelectionLabel`
- `pendingWorkerPassportNumber`
- `workerId` / worker photo fields

To distinguish: booked specific worker vs specs-only vs pending passport.

**API:** `GET api/Mediation/MediationContract/recruitment-requests`

## 10. Branches

- Show branch on contracts (`branchNameAr` / `branchNameEn`)
- Allow selecting all branches by omitting `BranchId`
- Keep sending `X-Branch-Id` on create/update
