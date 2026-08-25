# README — Frontend Changes (Mediation Contract Worker Workflow)

**Date:** 2026-08-25  
**Audience:** Frontend developers  
**Related backend summary:** `docs/d-25-8.md`

This document describes everything the frontend must update after the Mediation Contract backend changes.

---

## 1. API Changes

Base route: `api/Mediation/MediationContract`  
Auth: Bearer token + existing contract permissions (`ContractsReadAccess` / `ContractsCreate` / `ContractsUpdate`).

### 1.1 Create Mediation Contract

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/Mediation/MediationContract` |
| **Content-Type** | `multipart/form-data` |
| **Purpose** | Create a draft mediation contract |

**Required fields**

| Field | Type | Notes |
|-------|------|--------|
| `CustomerId` | Guid | Required |
| `OfferId` | Guid | Required |

**Optional fields**

| Field | Type | Notes |
|-------|------|--------|
| `WorkerId` | Guid? | Omit to create without a worker |
| `WorkerPassportNumber` | string? | Required only when `WorkerId` is set (match check). If sent **without** `WorkerId`, stored as pending/external passport |
| `ContractType` | short | Default `1` |
| `MarketerId` | Guid? | |
| Visa / cost / insurance / attachments | | Unchanged |

**Do NOT send (removed from create)**

- `MusanedContractNumber`
- `MusanedDocumentationNumber`
- `ContractCategory` / `contractClassification`

**Success response**

```json
{
  "success": true,
  "data": {
    "message": "تم إنشاء العقد بنجاح.",
    "id": "guid"
  }
}
```

**Validation errors (400)** — e.g. missing customer/offer, passport mismatch when `WorkerId` is set.

Musaned contract number can still be set later via **Sign**:

`POST /api/Mediation/MediationContract/sign`

```json
{
  "contractId": "guid",
  "musanedContractNumber": "optional",
  "invoicePaymentDate": "2026-08-25T00:00:00Z"
}
```

---

### 1.2 Get Contract Details (worker image)

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `/api/Mediation/MediationContract/{id}` |
| **Purpose** | Contract details for the details screen |

When a registered worker is assigned, the response includes both **flat** fields (backwards compatible) and a nested **`worker`** object:

```json
{
  "success": true,
  "data": {
    "id": "guid",
    "workerId": "guid",
    "workerName": "اسم العامل",
    "workerPassportNumber": "A1234567",
    "workerPhotoUrl": "https://...",
    "workerImageUrl": "https://...",
    "pendingWorkerPassportNumber": null,
    "hasAssignedWorker": true,
    "hasSpecificWorker": true,
    "worker": {
      "id": "guid",
      "name": "اسم العامل",
      "passportNumber": "A1234567",
      "imageUrl": "https://...",
      "isExternal": false
    },
    "workerAssignments": [
      {
        "id": "guid",
        "workerId": "guid",
        "workerNameAr": "...",
        "workerPassportNumber": "...",
        "workerPhotoUrl": "https://...",
        "workerImageUrl": "https://...",
        "assignedAt": "...",
        "endedAt": null,
        "endReason": null,
        "isActive": true
      }
    ]
  }
}
```

**External / pending worker** (passport only, not in Workers table):

```json
{
  "workerId": null,
  "workerName": null,
  "workerPassportNumber": "UNKNOWN-999",
  "workerImageUrl": null,
  "pendingWorkerPassportNumber": "UNKNOWN-999",
  "hasAssignedWorker": false,
  "hasSpecificWorker": true,
  "worker": {
    "id": null,
    "name": null,
    "passportNumber": "UNKNOWN-999",
    "imageUrl": null,
    "isExternal": true
  }
}
```

Prefer `data.worker.imageUrl` for UI. Flat `workerImageUrl` / `workerPhotoUrl` remain available.

List endpoint `GET /api/Mediation/MediationContract` also returns the same worker fields / nested `worker`.

---

### 1.3 Assign / Add Worker (unified)

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/Mediation/MediationContract/assign-worker` |
| **Purpose** | Assign registered worker **or** attach external worker by passport |
| **Permission** | `ContractsUpdate` |

**Request body** — provide **either** `workerId` **or** `workerPassportNumber` (or both for registered assign with passport match):

```json
{
  "contractId": "guid",
  "workerId": "guid-or-null",
  "workerPassportNumber": "string-or-null"
}
```

#### Case A — Registered worker by ID

```json
{
  "contractId": "...",
  "workerId": "...",
  "workerPassportNumber": "A1234567"
}
```

`workerPassportNumber` is optional; if sent, it must match the worker’s passport.

#### Case B — Passport of an existing worker

```json
{
  "contractId": "...",
  "workerPassportNumber": "EXIST-001"
}
```

Backend finds the worker, validates availability, assigns them.

#### Case C — Passport not in system (external)

```json
{
  "contractId": "...",
  "workerPassportNumber": "UNKNOWN-999"
}
```

Backend stores `pendingWorkerPassportNumber` (no Worker master row created).

**Success response**

```json
{
  "success": true,
  "data": {
    "message": "تم إسناد العامل بنجاح.",
    "workerId": "guid-or-null",
    "pendingWorkerPassportNumber": null,
    "isExternal": false
  }
}
```

For external:

```json
{
  "message": "تم تسجيل رقم جواز عامل غير مسجّل بنجاح.",
  "workerId": null,
  "pendingWorkerPassportNumber": "UNKNOWN-999",
  "isExternal": true
}
```

**Common 400 errors**

| Message (Arabic) | Meaning |
|------------------|---------|
| يجب توفير معرف العامل أو رقم الجواز | Neither `workerId` nor passport provided |
| يوجد عامل مسند حالياً. استخدم إنهاء خدمة العامل أولاً | Active registered worker already on contract |
| يوجد رقم جواز معلق على هذا العقد... | Active pending passport already set — end first |
| رقم الجواز مسجل بالفعل على هذا العقد | Same pending passport already on this contract |
| العامل غير موجود / غير نشط / مسند لعقد نشط آخر | Registered worker validation failed |
| رقم الجواز غير متطابق | Passport does not match `workerId` |

---

### 1.4 Remove / End Worker

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/Mediation/MediationContract/end-worker-service` |
| **Purpose** | End active registered worker **or** clear pending/external passport |
| **Permission** | `ContractsUpdate` |

```json
{
  "contractId": "guid",
  "reason": "optional"
}
```

**Behavior**

- Registered worker: active `WorkerAssignments` row is soft-ended (`isActive=false`, `endedAt`, `endReason`); history kept.
- `workerId` and `pendingWorkerPassportNumber` cleared.
- Contract becomes eligible for another assign.

**Success**

```json
{
  "success": true,
  "data": { "message": "تم إنهاء خدمة العامل بنجاح." }
}
```

**400** if no registered worker and no pending passport: `لا يوجد عامل مسند حالياً على هذا العقد.`

---

### 1.5 Set Pending Passport (legacy / still supported)

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `/api/Mediation/MediationContract/set-pending-worker-passport` |

```json
{
  "contractId": "guid",
  "workerPassportNumber": "UNKNOWN-999"
}
```

Prefer **`assign-worker`** with passport only (same behavior). Keep this endpoint if already integrated.

Fails if passport already exists as a Worker — use `assign-worker` instead.

---

## 2. Mediation Contract Changes

### Removed from creation

Stop sending:

1. Musaned Contract Number (`musanedContractNumber`)
2. Documentation Number (`musanedDocumentationNumber`)
3. Contract Classification / Category (`contractCategory` / `contractClassification`)

These remain on the entity for list/filter/sign; they are **not** required (or accepted meaningfully) on create.

### Worker image

- Details/list return `worker.imageUrl` plus flat `workerImageUrl` / `workerPhotoUrl`.
- Source: existing worker `UploadImage` or latest worker attachment (same as elsewhere in the app).
- External workers have no image (`imageUrl: null`).

### Remove / replace worker

1. Call `end-worker-service`
2. UI shows “Add Worker”
3. Call `assign-worker` with new `workerId` or passport

Cannot assign a second registered worker while one is active.

### External worker by passport

- Use `assign-worker` with only `workerPassportNumber`.
- Distinguish in UI with `worker.isExternal === true` or `pendingWorkerPassportNumber`.

---

## 3. Frontend UI Changes

### Contract details — worker panel

```text
No active worker (workerId null AND no pending passport)
  → Show "Add Worker"

Active registered worker (workerId set)
  → Show name, passport, image (worker.imageUrl)
  → Show "Remove / End Worker"

Active external/pending (pendingWorkerPassportNumber set)
  → Show passport only (no image / no name unless you add labels)
  → Badge: "عامل غير مسجّل" / External
  → Show "Remove / End Worker"

After end-worker-service succeeds
  → Refresh details
  → Show "Add Worker" again
```

### Create form

- Remove inputs for Musaned number, documentation number, contract classification.
- Keep optional worker / passport on create if product still allows it.

### Add Worker dialog

Suggested flow:

1. User enters passport (and/or picks worker from search).
2. Optional: `GET api/V1/Worker?SearchByPassportOnly=true&PassportNo=...&AvailableForMediationContract=true`
3. If worker found → `assign-worker` with `workerId` (+ passport).
4. If not found → confirm “add as external” → `assign-worker` with passport only.
5. On success, refresh contract details.

---

## 4. External Worker UI

| Scenario | Detection | UI |
|----------|-----------|-----|
| Existing worker | Worker search returns a row / assign returns `isExternal: false` | Show name + image after refresh |
| Worker not found | Search empty | Offer “Continue with passport (external)” |
| After external assign | `worker.isExternal === true` | Show passport; no image; allow End then replace |

Do **not** create a fake incomplete Worker master record from the frontend.

---

## 5. Breaking Changes

**Mostly non-breaking / additive.**

| Change | Impact |
|--------|--------|
| Create no longer accepts Musaned / documentation / classification | **Breaking for clients that still require these fields on create UI** — stop sending them; create already ignored them if previously removed from DTO |
| `AssignMediationWorkerDto.workerId` and `workerPassportNumber` are no longer both `[Required]` | **Non-breaking** for old clients that still send both |
| Nested `worker` object added | **Additive** |
| `assign-worker` success payload now includes `workerId`, `pendingWorkerPassportNumber`, `isExternal` | **Additive** |
| `end-worker-service` also clears pending passport | **Behavioral extension** — usually desired |

If you already stopped sending Musaned/docs/classification on create:

```text
No breaking API changes.
```

Otherwise, treat create-form field removal as a **frontend breaking UX change** (fields must be removed from the create screen).

---

# Frontend-Only Changes

These do **not** require further backend work:

1. **Create form field removal**  
   - Screen: Mediation Contract create  
   - Remove Musaned Contract Number, Documentation Number, Contract Classification inputs  
   - Do not send those keys in FormData  

2. **Worker image display**  
   - Screen: Contract details  
   - Bind image to `worker.imageUrl` (fallback: `workerImageUrl`)  

3. **Add / Remove Worker buttons & empty states**  
   - Drive visibility from `hasAssignedWorker` / `pendingWorkerPassportNumber` / `worker.isExternal`  
   - Call existing `assign-worker` and `end-worker-service`  

4. **External worker confirmation UX**  
   - When passport search finds nothing, show confirm dialog then call `assign-worker` with passport only  

5. **Optional worker search UX**  
   - Use existing worker list API with `AvailableForMediationContract` / `SearchByPassportOnly` before assign  

Backend APIs to use: listed in section 1.
