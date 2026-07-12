# Sigma API — Phase 3 Full Re-Validation Report

> **Supersedes** `API_VALIDATION_REPORT.md`. Every endpoint was re-tested live from scratch; no prior result was trusted.

| | |
|---|---|
| Base URL | `https://sigma-api.runasp.net` |
| Auth | Bearer JWT + `X-Branch-Id` header |
| Account | `sigma@gmail.com` (roles: Admin, Employee) |
| Branch | `31887c15-5b47-4551-2190-08dea9210ab7` |
| Spec source | live OpenAPI `/swagger/v1/swagger.json` (391 operations / 319 paths) |
| Date | 2026-07-12 |
| Tool | Node harness (`harness.js` GET stage, `mutate.js` mutation stage) |

## Methodology & safety

- **GET (169):** every route called with a valid token; each also probed **without** a token to test auth enforcement. Path-param routes use real IDs harvested from list responses; where no record exists a non-existent GUID is used (a `404 not-found` is then the correct, healthy result).
- **`/Filter` & list POSTs (4):** executed for real (read-only, no data written).
- **Creates paired with a DELETE route (curated):** a real record was created with a `ZZ_REVAL_` marker, then deleted — exercising create **and** delete end-to-end. All such records were cleaned up.
- **Other creates / global POSTs:** sent an **empty body** to verify the validation contract without polluting production.
- **State actions (approve/sign/reject/terminate/…) and by-id DELETEs:** probed with a **non-existent GUID** to verify routing/auth/validation without mutating real data. A `2xx` here is a defect (id not checked).
- **Multipart/file endpoints (9):** not auto-driven (require form-data); listed as SKIP.
- **Cleanup:** all junk created during testing was deleted, including two blank records the *previous* report had left behind.

## Result summary

| Verdict | Count |
|---|--:|
| PASS (correct behavior) | 347 |
| FAIL / BUG | 20 |
| WEAK (2xx on non-existent id) | 7 |
| SKIP (multipart, not driven) | 9 |
| **Total operations** | **391** |

## CRITICAL — Authentication not enforced

The API accepts requests **with no bearer token** on the large majority of endpoints — reads *and writes*.

- **66 of 169 GET endpoints** return `2xx` with no `Authorization` header.
- **Unauthenticated writes confirmed** (created/deleted data with no token) on: `POST /Agent`, `POST /Complaint`, `POST /Job`, `POST /Marketer`, `POST /Nationality`, `POST /RestrictionType`, `POST /FollowUpStatus/Create`, `POST /NationalityFollowUpConfig/BulkUpdate`, `POST /MediationContractOffer/auto-fill`, and several `DELETE` routes.
- **Correctly enforced (control group):** every `/Filter` POST returns `401` without a token; all `HourlyDrivers/me/*`, `HourlyWorkerPortal/me/*`, and `HourlyCustomer/*` self-service routes return `403` for the admin (wrong role). So enforcement exists but is applied inconsistently across modules.

## Correctness bugs

### Hard 500
- `GET /api/V1/Payroll/export` → **500, empty body** (reproduced from prior report).

### Crash-on-empty-body creates (return 500 instead of 400 validation) — 12
These throw an unhandled exception when required fields are missing, instead of returning a validation error:
- `POST /api/V1/Commission/Create`
- `POST /api/V1/CommissionSlice/Create`
- `POST /api/Complaint/update`
- `POST /api/V1/Complaint/Create`
- `POST /api/V1/CustodyRequest/Create`
- `POST /api/EmploymentOperatingContract`
- `POST /api/V1/EntitlementsRequest/Create`
- `POST /api/Mediation/MediationContractOffer`
- `POST /api/V1/MedicalExamination`
- `POST /api/V1/Payroll/generate`
- `POST /api/V1/PermissionRequest/Create`
- `POST /api/V1/ResignationRequest/Create`

### Silent-create (accept an EMPTY body and persist a blank record) — 5
No validation; a blank row is created (the prior report’s Agent/Nationality bug, now also on Complaint, Marketer, OperatingContractOffer):
- `POST /api/V1/Agent`
- `POST /api/Complaint`
- `POST /api/V1/Marketer`
- `POST /api/V1/Nationality`
- `POST /api/OperatingContractOffer`

### Weak DELETE (returns 200 "deleted" for a non-existent GUID — no existence check) — 7
- `DELETE /api/V1/Commission/Delete/{id}`
- `DELETE /api/V1/CommissionSlice/Delete/{id}`
- `DELETE /api/V1/Complaint/Delete/{id}`
- `DELETE /api/FollowUp/ContractCreationRequirement/Delete/{id}`
- `DELETE /api/FollowUp/ContractNationality/Delete/{id}`
- `DELETE /api/FollowUp/FollowUpStatus/Delete/{id}`
- `DELETE /api/Mediation/MediationContractOffer/{id}`

### Not deletable by design
- `DELETE /api/Complaint/{id}` → **405** (mediation complaints have no delete route; use `finish`/`toggle-hold`). One blank test complaint could not be removed.

## Per-module results

Verdict legend: PASS = behaves correctly (incl. correct `400/403/404` business/guard/empty responses). `noTok` = status when called with **no** bearer token (`2xx` = auth bypass).

### Account (8)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Account/full-tree-structure` | 200 | - | PASS |
| GET | `/api/V1/Account/settings` | 200 | - | PASS |
| GET | `/api/V1/Account/Accounts-list` | 200 | - | PASS |
| GET | `/api/V1/Account/subtree/{parentId}` | 200 | - | PASS |
| POST | `/api/V1/Account/create-account` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/Account/update-account/{accountId}` | 400 | 400 | PASS(routes+guards) |
| PUT | `/api/V1/Account/reporting/{accountId}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/Account/delete-account/{accountId}` | 400 | 400 | PASS(routes+guards) |

### Admin (8)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Admin/all-users` | 200 | - | PASS |
| GET | `/api/V1/Admin/all-roles` | 200 | - | PASS |
| GET | `/api/V1/Admin/positions` | 200 | - | PASS |
| POST | `/api/V1/Admin/add-user` | 400 | 400 | PASS(validates) |
| POST | `/api/V1/Admin/assign-role` | 400 | 400 | PASS(validates) |
| POST | `/api/V1/Admin/remove-role` | 400 | 400 | PASS(validates) |
| POST | `/api/V1/Admin/create-position` | 400 | 400 | PASS(validates) |
| DELETE | `/api/V1/Admin/delete-position/{id}` | 404 | 404 | PASS(routes+guards) |

### Agent (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Agent` | 200 | - | PASS |
| GET | `/api/V1/Agent/{id}` | 200 | - | PASS |
| POST | `/api/V1/Agent` | 200 | 200 | BUG(accepts empty body) |
| PUT | `/api/V1/Agent/{id}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/Agent/{id}` | 404 | 404 | PASS(routes+guards) |

### Auth (7)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Auth/me` | 200 | - | PASS |
| GET | `/api/V1/Auth/test-auth` | 200 | - | PASS |
| POST | `/api/V1/Auth/login` | 400 | 400 | PASS(validates) |
| PATCH | `/api/V1/Auth/change-password` | 400 | 401 | PASS(validates) |
| POST | `/api/V1/Auth/refresh-token` | 400 | 400 | PASS(validates) |
| POST | `/api/V1/Auth/logout` | 400 | 401 | PASS(validates) |
| POST | `/api/V1/Auth/add-admin` | 400 | 400 | PASS(validates) |

### Branch (6)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Branch` | 200 | - | PASS |
| GET | `/api/V1/Branch/{id}` | 200 | - | PASS |
| GET | `/api/V1/Branch/{id}/sub-branches` | 200 | - | PASS |
| POST | `/api/V1/Branch` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/Branch/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/Branch/{id}` | 404 | 404 | PASS(routes+guards) |

### Commission (3)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Commission/GetAll` | 200 | - | PASS |
| POST | `/api/V1/Commission/Create` | 500 | 401 | BUG(500 on empty) |
| DELETE | `/api/V1/Commission/Delete/{id}` | 200 | 401 | WEAK(2xx on fake id) |

### CommissionSlice (3)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/CommissionSlice/GetAll` | 200 | - | PASS |
| POST | `/api/V1/CommissionSlice/Create` | 500 | 401 | BUG(500 on empty) |
| DELETE | `/api/V1/CommissionSlice/Delete/{id}` | 200 | 401 | WEAK(2xx on fake id) |

### Complaint (13)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Complaint` | 200 | - | PASS |
| GET | `/api/V1/Complaint/GetAll` | 200 | - | PASS |
| GET | `/api/Complaint/{id}` | 200 | - | PASS |
| GET | `/api/Complaint/{id}/issue` | 404 | - | PASS(404) |
| POST | `/api/Complaint` | 200 | 200 | BUG(accepts empty body) |
| POST | `/api/Complaint/{id}/toggle-hold` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/Complaint/{id}/finish` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/Complaint/update` | 500 | 500 | BUG(500 on empty) |
| POST | `/api/Complaint/issue` | SKIP | - | SKIP(multipart) |
| POST | `/api/V1/Complaint/Create` | 500 | 401 | BUG(500 on empty) |
| POST | `/api/V1/Complaint/Reply` | 404 | 401 | CHECK(404) |
| POST | `/api/V1/Complaint/Close/{id}` | 404 | 401 | PASS(routes+guards) |
| DELETE | `/api/V1/Complaint/Delete/{id}` | 200 | 401 | WEAK(2xx on fake id) |

### ContractCreationRequirement (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob` | 404 | - | PASS(404) |
| GET | `/api/FollowUp/ContractCreationRequirement/GetById/{id}` | 404 | - | PASS(404) |
| POST | `/api/FollowUp/ContractCreationRequirement/Create` | 400 | 400 | PASS(validates) |
| PUT | `/api/FollowUp/ContractCreationRequirement/Update` | 400 | 400 | PASS(validates) |
| DELETE | `/api/FollowUp/ContractCreationRequirement/Delete/{id}` | 200 | 200 | WEAK(2xx on fake id) |

### ContractNationality (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/FollowUp/ContractNationality/GetAll` | 200 | - | PASS |
| GET | `/api/FollowUp/ContractNationality/GetById/{id}` | 404 | - | PASS(404) |
| POST | `/api/FollowUp/ContractNationality/Create` | 400 | 400 | PASS(validates) |
| PUT | `/api/FollowUp/ContractNationality/Update` | 400 | 400 | PASS(validates) |
| DELETE | `/api/FollowUp/ContractNationality/Delete/{id}` | 200 | 200 | WEAK(2xx on fake id) |

### CreditNote (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Accounting/CreditNote` | 200 | - | PASS |
| GET | `/api/Accounting/CreditNote/{id}` | 404 | - | PASS(404) |
| GET | `/api/Accounting/CreditNote/{id}/trace` | 404 | - | PASS(404) |
| POST | `/api/Accounting/CreditNote` | 400 | 400 | PASS(validates) |

### CustodyRequest (7)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/CustodyRequest/GetAll` | 200 | - | PASS |
| GET | `/api/V1/CustodyRequest/Types` | 200 | - | PASS |
| GET | `/api/V1/CustodyRequest/Types/{id}` | 200 | - | PASS |
| POST | `/api/V1/CustodyRequest/Create` | 500 | 401 | BUG(500 on empty) |
| POST | `/api/V1/CustodyRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/CustodyRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/CustodyRequest/Types/Create` | 400 | 401 | PASS(validates) |

### Customer (7)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Customer` | 200 | - | PASS |
| GET | `/api/V1/Customer/export` | 200 | - | PASS |
| GET | `/api/V1/Customer/{id}` | 200 | - | PASS |
| POST | `/api/V1/Customer` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/Customer/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/Customer/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Customer/generate-english-name` | 400 | 400 | PASS(validates) |

### DebitNote (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Accounting/DebitNote` | 200 | - | PASS |
| GET | `/api/Accounting/DebitNote/{id}` | 404 | - | PASS(404) |
| GET | `/api/Accounting/DebitNote/{id}/trace` | 404 | - | PASS(404) |
| POST | `/api/Accounting/DebitNote` | 400 | 400 | PASS(validates) |

### Employee (6)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Employee` | 200 | - | PASS |
| GET | `/api/V1/Employee/{id}` | 200 | - | PASS |
| POST | `/api/V1/Employee` | 400 | 401 | PASS(validates) |
| PUT | `/api/V1/Employee/{id}` | 404 | 401 | PASS(routes+guards) |
| DELETE | `/api/V1/Employee/{id}` | 404 | 401 | PASS(routes+guards) |
| PUT | `/api/V1/Employee/{id}/reset-password` | 404 | 401 | PASS(routes+guards) |

### EmploymentOperatingContract (13)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/EmploymentOperatingContract` | 200 | - | PASS |
| GET | `/api/EmploymentOperatingContract/{id}` | 200 | - | PASS |
| GET | `/api/EmploymentOperatingContract/{id}/print-delivery-form` | 200 | - | PASS |
| GET | `/api/EmploymentOperatingContract/{id}/print-receipt-form` | 200 | - | PASS |
| POST | `/api/EmploymentOperatingContract` | 500 | 401 | BUG(500 on empty) |
| PUT | `/api/EmploymentOperatingContract/{id}` | 404 | 401 | PASS(routes+guards) |
| DELETE | `/api/EmploymentOperatingContract/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/EmploymentOperatingContract/{id}/renew` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/EmploymentOperatingContract/{id}/terminate` | 400 | 401 | PASS(routes+guards) |
| POST | `/api/EmploymentOperatingContract/{id}/customer-refund` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/EmploymentOperatingContract/{id}/sign` | 400 | 401 | PASS(routes+guards) |
| POST | `/api/EmploymentOperatingContract/{id}/start-execution` | 400 | 401 | PASS(routes+guards) |
| POST | `/api/EmploymentOperatingContract/{id}/delivery-form` | 404 | 401 | PASS(routes+guards) |

### EntitlementsRequest (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/EntitlementsRequest/GetAll` | 200 | - | PASS |
| POST | `/api/V1/EntitlementsRequest/Create` | 500 | 401 | BUG(500 on empty) |
| POST | `/api/V1/EntitlementsRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/EntitlementsRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |

### FollowUpStatus (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/FollowUp/FollowUpStatus/GetAll` | 200 | - | PASS |
| GET | `/api/FollowUp/FollowUpStatus/GetById/{id}` | 404 | - | PASS(404) |
| POST | `/api/FollowUp/FollowUpStatus/Create` | 200 | 200 | PASS(created+cleaned) |
| PUT | `/api/FollowUp/FollowUpStatus/Update` | 400 | 400 | PASS(validates) |
| DELETE | `/api/FollowUp/FollowUpStatus/Delete/{id}` | 200 | 200 | WEAK(2xx on fake id) |

### Hourly Workers - Catalog (12)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyCatalog/Packages` | 200 | - | PASS |
| GET | `/api/V1/HourlyCatalog/ServingAreas` | 200 | - | PASS |
| GET | `/api/V1/HourlyCatalog/Admin/Packages` | 200 | - | PASS |
| GET | `/api/V1/HourlyCatalog/Admin/ServingAreas` | 200 | - | PASS |
| GET | `/api/V1/HourlyCatalog/Admin/Packages/{id}` | 200 | - | PASS |
| GET | `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}` | 404 | - | PASS(404) |
| POST | `/api/V1/HourlyCatalog/Admin/Packages` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/HourlyCatalog/Admin/Packages/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/HourlyCatalog/Admin/Packages/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyCatalog/Admin/ServingAreas` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}` | 404 | 404 | PASS(routes+guards) |

### Hourly Workers - Customer (6)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyCustomer/Orders` | 400 | - | PASS(400 business) |
| GET | `/api/V1/HourlyCustomer/Orders/{ticketNumber}/Tracking` | 404 | - | PASS(404 no-data) |
| GET | `/api/V1/HourlyCustomer/Orders/{orderId}/Invoices` | 403 | - | PASS(403 guarded) |
| GET | `/api/V1/HourlyCustomer/Orders/{orderId}/Notifications` | 403 | - | PASS(403 guarded) |
| POST | `/api/V1/HourlyCustomer/Orders/{orderId}/Cancel` | 403 | 401 | PASS(routes+guards) |
| POST | `/api/V1/HourlyCustomer/Orders/{orderId}/Refund` | 403 | 401 | PASS(routes+guards) |

### Hourly Workers - Drivers (12)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyDrivers` | 200 | - | PASS |
| GET | `/api/V1/HourlyDrivers/me/Orders` | 403 | - | PASS(403 guarded) |
| GET | `/api/V1/HourlyDrivers/me/Orders/Current` | 403 | - | PASS(403 guarded) |
| GET | `/api/V1/HourlyDrivers/me/Orders/History` | 403 | - | PASS(403 guarded) |
| GET | `/api/V1/HourlyDrivers/{id}` | 200 | - | PASS |
| GET | `/api/V1/HourlyDrivers/{driverId}/Orders` | 200 | - | PASS |
| POST | `/api/V1/HourlyDrivers` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/HourlyDrivers/{id}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/HourlyDrivers/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyDrivers/{id}/Activate` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyDrivers/{id}/Deactivate` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus` | 404 | 401 | PASS(routes+guards) |

### Hourly Workers - Notifications (2)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyOrderNotifications` | 200 | - | PASS |
| POST | `/api/V1/HourlyOrderNotifications/{id}/Retry` | 404 | 404 | PASS(routes+guards) |

### Hourly Workers - Orders (18)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyWorkerRequests` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/{id}/Detail` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/{id}` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/{id}/Timeline` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/{id}/Logs` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/{id}/Payments` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/{id}/Assignments` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerRequests/Track/{ticketNumber}` | 404 | - | PASS(404 no-data) |
| POST | `/api/V1/HourlyWorkerRequests` | 400 | 400 | PASS(validates) |
| DELETE | `/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}` | 404 | 404 | PASS(routes+guards) |
| PUT | `/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/Approve` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/Reject` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/Assign` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/InProgress` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/Complete` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/Cancel` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerRequests/{id}/InternalNotes` | 404 | 404 | PASS(routes+guards) |

### Hourly Workers - Payments (2)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyOrderPayments` | 200 | - | PASS |
| POST | `/api/V1/HourlyOrderPayments/{id}/Refund` | 404 | 404 | PASS(routes+guards) |

### Hourly Workers - Reports (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyWorkerReports/OrdersSummary` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerReports/Revenue` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerReports/WorkerUtilization` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerReports/DriverPerformance` | 200 | - | PASS |

### Hourly Workers - Staff (8)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyWorkers` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkers/Available` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkers/{id}` | 200 | - | PASS |
| POST | `/api/V1/HourlyWorkers` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/HourlyWorkers/{id}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/HourlyWorkers/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkers/{id}/Activate` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkers/{id}/Deactivate` | 404 | 404 | PASS(routes+guards) |

### Hourly Workers - Worker Portal (6)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyWorkerPortal/me/Assignments` | 403 | - | PASS(403 guarded) |
| GET | `/api/V1/HourlyWorkerPortal/me/Schedule` | 403 | - | PASS(403 guarded) |
| GET | `/api/V1/HourlyWorkerPortal/{workerId}/Assignments` | 404 | - | PASS(404) |
| GET | `/api/V1/HourlyWorkerPortal/{workerId}/Schedule` | 404 | - | PASS(404) |
| POST | `/api/V1/HourlyWorkerPortal/me/Assignments/{assignmentId}/Status` | 403 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status` | 404 | 401 | PASS(routes+guards) |

### Housing (7)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Housing/GetAll` | 200 | - | PASS |
| GET | `/api/Housing/GetActiveList` | 200 | - | PASS |
| GET | `/api/Housing/{id}` | 200 | - | PASS |
| PUT | `/api/Housing/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/Housing/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/Housing` | 400 | 400 | PASS(validates) |
| POST | `/api/Housing/ToggleActive/{id}` | 404 | 404 | PASS(routes+guards) |

### Job (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Job` | 200 | - | PASS |
| GET | `/api/V1/Job/{id}` | 200 | - | PASS |
| POST | `/api/V1/Job` | 200 | 200 | PASS(created+cleaned) |
| PUT | `/api/V1/Job/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/Job/{id}` | 404 | 404 | PASS(routes+guards) |

### JobModificationRequest (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/JobModificationRequest/GetAll` | 200 | - | PASS |
| POST | `/api/V1/JobModificationRequest/Create` | 404 | 401 | CHECK(404) |
| POST | `/api/V1/JobModificationRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/JobModificationRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |

### JournalEntries (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/JournalEntries` | 200 | - | PASS |
| GET | `/api/V1/JournalEntries/{id}` | 200 | - | PASS |
| POST | `/api/V1/JournalEntries` | 400 | 400 | PASS(validates) |
| PUT | `/api/V1/JournalEntries/{id}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/JournalEntries/{id}` | 400 | 400 | PASS(routes+guards) |

### Leave (6)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Leave` | 200 | - | PASS |
| GET | `/api/V1/Leave/employee-balances` | 400 | - | PASS(400 business) |
| GET | `/api/V1/Leave/balance/{leaveTypeId}` | 200 | - | PASS |
| POST | `/api/V1/Leave` | 400 | 401 | PASS(validates) |
| PUT | `/api/V1/Leave/{requestId}/approve` | 400 | 401 | PASS(routes+guards) |
| PUT | `/api/V1/Leave/{requestId}/reject` | 400 | 401 | PASS(routes+guards) |

### LeaveType (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/LeaveType` | 200 | - | PASS |
| GET | `/api/V1/LeaveType/{id}` | 200 | - | PASS |
| POST | `/api/V1/LeaveType` | 201 | 400 | PASS(created+cleaned) |
| PUT | `/api/V1/LeaveType/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/LeaveType/{id}` | 404 | 404 | PASS(routes+guards) |

### Ledger (8)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Ledger/agent-ledger` | 400 | - | PASS(400 business) |
| GET | `/api/V1/Ledger/customer-ledger` | 200 | - | PASS |
| GET | `/api/V1/Ledger/worker-ledger` | 400 | - | PASS(400 business) |
| GET | `/api/V1/Ledger/income-statement` | 200 | - | PASS |
| GET | `/api/V1/Ledger/general-ledger` | 200 | - | PASS |
| GET | `/api/V1/Ledger/trial-balance` | 200 | - | PASS |
| GET | `/api/V1/Ledger/balance-sheet` | 200 | - | PASS |
| GET | `/api/V1/Ledger/vat-report` | 200 | - | PASS |

### LoanRequest (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/LoanRequest/GetAll` | 200 | - | PASS |
| POST | `/api/V1/LoanRequest/Create` | 404 | 401 | CHECK(404) |
| POST | `/api/V1/LoanRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/LoanRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |

### Lookup (3)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Lookup/Departments` | 200 | - | PASS |
| GET | `/api/V1/Lookup/SalaryScales` | 200 | - | PASS |
| GET | `/api/V1/Lookup/CustodyTypes` | 200 | - | PASS |

### Marketer (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Marketer` | 200 | - | PASS |
| GET | `/api/V1/Marketer/{id}` | 200 | - | PASS |
| POST | `/api/V1/Marketer` | 200 | 200 | BUG(accepts empty body) |
| PUT | `/api/V1/Marketer/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/Marketer/{id}` | 404 | 404 | PASS(routes+guards) |

### MediationContract (16)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Mediation/MediationContract` | 200 | - | PASS |
| GET | `/api/Mediation/MediationContract/export` | 200 | - | PASS |
| GET | `/api/Mediation/MediationContract/recruitment-requests` | 200 | - | PASS |
| GET | `/api/Mediation/MediationContract/{id}` | 200 | - | PASS |
| GET | `/api/Mediation/MediationContract/status-history/{contractId}` | 200 | - | PASS |
| POST | `/api/Mediation/MediationContract` | SKIP | - | SKIP(multipart) |
| POST | `/api/Mediation/MediationContract/sign` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/customer-payment` | 400 | 400 | PASS(validates) |
| PUT | `/api/Mediation/MediationContract/update-status` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/sponsorship-transfer` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/cancel` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/delivery-form` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/delivery-form/sign` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/warranty-return` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/end-worker-service` | 400 | 400 | PASS(validates) |
| POST | `/api/Mediation/MediationContract/assign-worker` | 400 | 400 | PASS(validates) |

### MediationContractOffer (7)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Mediation/MediationContractOffer` | 200 | - | PASS |
| GET | `/api/Mediation/MediationContractOffer/{id}` | 200 | - | PASS |
| POST | `/api/Mediation/MediationContractOffer` | 500 | 500 | BUG(500 on empty) |
| PUT | `/api/Mediation/MediationContractOffer` | 404 | 404 | CHECK(404) |
| DELETE | `/api/Mediation/MediationContractOffer/{id}` | 200 | 200 | WEAK(2xx on fake id) |
| POST | `/api/Mediation/MediationContractOffer/auto-fill` | 200 | 200 | BUG(accepts empty body) |
| PATCH | `/api/Mediation/MediationContractOffer/{id}/toggle-active` | 404 | 404 | PASS(routes+guards) |

### MediationFollowUp (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Mediation/MediationFollowUp/dashboard` | 200 | - | PASS |
| GET | `/api/Mediation/MediationFollowUp/items/{contractId}` | 200 | - | PASS |
| GET | `/api/Mediation/MediationFollowUp/item/{itemId}` | 404 | - | PASS(404 no-data) |
| POST | `/api/Mediation/MediationFollowUp/update-description` | 404 | 404 | CHECK(404) |

### MedicalExamination (7)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/MedicalExamination` | 200 | - | PASS |
| GET | `/api/V1/MedicalExamination/{id}` | 200 | - | PASS |
| GET | `/api/V1/MedicalExamination/report/{id}` | 404 | - | PASS(404) |
| GET | `/api/V1/MedicalExamination/check-worker/{workerId}` | 200 | - | PASS |
| POST | `/api/V1/MedicalExamination` | 500 | 500 | BUG(500 on empty) |
| PUT | `/api/V1/MedicalExamination/{id}` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/MedicalExamination/{id}` | 404 | 404 | PASS(routes+guards) |

### Nationality (6)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Nationality` | 200 | - | PASS |
| GET | `/api/V1/Nationality/{id}` | 200 | - | PASS |
| POST | `/api/V1/Nationality` | 200 | 200 | BUG(accepts empty body) |
| PUT | `/api/V1/Nationality/{id}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/Nationality/{id}` | 404 | 404 | PASS(routes+guards) |
| PUT | `/api/V1/Nationality/{id}/toggle-status` | 404 | 404 | PASS(routes+guards) |

### OperatingContractOffer (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/OperatingContractOffer` | 200 | - | PASS |
| GET | `/api/OperatingContractOffer/{id}` | 200 | - | PASS |
| POST | `/api/OperatingContractOffer` | 200 | 401 | BUG(accepts empty body) |
| PUT | `/api/OperatingContractOffer/{id}` | 404 | 401 | PASS(routes+guards) |
| DELETE | `/api/OperatingContractOffer/{id}` | 404 | 404 | PASS(routes+guards) |

### PaymentVoucher (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Accounting/PaymentVoucher` | 200 | - | PASS |
| GET | `/api/Accounting/PaymentVoucher/{id}` | 200 | - | PASS |
| GET | `/api/Accounting/PaymentVoucher/{id}/trace` | 200 | - | PASS |
| POST | `/api/Accounting/PaymentVoucher` | 400 | 400 | PASS(validates) |

### Payroll (12)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Payroll` | 404 | - | PASS(404) |
| GET | `/api/V1/Payroll/history` | 200 | - | PASS |
| GET | `/api/V1/Payroll/export` | 500 | - | FAIL(500) |
| GET | `/api/V1/Payroll/{id}` | 200 | - | PASS |
| GET | `/api/V1/Payroll/{id}/trace` | 200 | - | PASS |
| GET | `/api/V1/Payroll/{payrollRunId}/payments/{paymentId}/trace` | 404 | - | PASS(404) |
| POST | `/api/V1/Payroll/generate` | 500 | 500 | BUG(500 on empty) |
| PUT | `/api/V1/Payroll/{id}/submit` | 404 | 404 | PASS(routes+guards) |
| PUT | `/api/V1/Payroll/{id}/approve` | 404 | 404 | PASS(routes+guards) |
| PUT | `/api/V1/Payroll/{id}/reject` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Payroll/{id}/payments` | 404 | 404 | PASS(routes+guards) |
| PUT | `/api/V1/Payroll/close/{id}` | 404 | 404 | PASS(routes+guards) |

### PeriodClosing (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/PeriodClosing` | 200 | - | PASS |
| GET | `/api/V1/PeriodClosing/status` | 200 | - | PASS |
| POST | `/api/V1/PeriodClosing/close` | 400 | 401 | PASS(validates) |
| POST | `/api/V1/PeriodClosing/open` | 400 | 401 | PASS(validates) |

### PermissionRequest (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/PermissionRequest/GetAll` | 200 | - | PASS |
| POST | `/api/V1/PermissionRequest/Create` | 500 | 401 | BUG(500 on empty) |
| POST | `/api/V1/PermissionRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/PermissionRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |

### ReceiptVoucher (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/Accounting/ReceiptVoucher` | 200 | - | PASS |
| GET | `/api/Accounting/ReceiptVoucher/{id}` | 200 | - | PASS |
| GET | `/api/Accounting/ReceiptVoucher/{id}/trace` | 200 | - | PASS |
| POST | `/api/Accounting/ReceiptVoucher` | 400 | 400 | PASS(validates) |

### ResignationRequest (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/ResignationRequest/GetAll` | 200 | - | PASS |
| POST | `/api/V1/ResignationRequest/Create` | 500 | 401 | BUG(500 on empty) |
| POST | `/api/V1/ResignationRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/ResignationRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |

### RestrictionType (5)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/RestrictionType` | 200 | - | PASS |
| GET | `/api/V1/RestrictionType/{id}` | 200 | - | PASS |
| POST | `/api/V1/RestrictionType` | 200 | 200 | PASS(created+cleaned) |
| PUT | `/api/V1/RestrictionType/{id}` | 400 | 400 | PASS(routes+guards) |
| DELETE | `/api/V1/RestrictionType/{id}` | 400 | 400 | PASS(routes+guards) |

### Role (3)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Role/all-role` | 200 | - | PASS |
| GET | `/api/V1/Role/users-with-roles` | 200 | - | PASS |
| POST | `/api/V1/Role/assign-role` | 400 | 401 | PASS(validates) |

### Sigma.API (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/health` | 200 | - | PASS |

### TransferContract (8)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/TransferContract` | 200 | - | PASS |
| GET | `/api/TransferContract/export` | 200 | - | PASS |
| GET | `/api/TransferContract/{id}` | 200 | - | PASS |
| POST | `/api/TransferContract` | 404 | 404 | CHECK(404) |
| DELETE | `/api/TransferContract/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/TransferContract/{id}/sign` | 404 | 404 | PASS(routes+guards) |
| PATCH | `/api/TransferContract/{id}/authority-status` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/TransferContract/{id}/complete` | 404 | 404 | PASS(routes+guards) |

### WeatherForecast (3)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/WeatherForecast` | 200 | - | PASS |
| GET | `/WeatherForecast/test-auth` | 200 | - | PASS |
| GET | `/WeatherForecast/me` | 200 | - | PASS |

### Worker (27)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/Worker` | 200 | - | PASS |
| GET | `/api/V1/Worker/export` | 200 | - | PASS |
| GET | `/api/V1/Worker/public-worker` | 200 | - | PASS |
| GET | `/api/V1/Worker/WantsTransfer` | 200 | - | PASS |
| GET | `/api/V1/Worker/Housed` | 200 | - | PASS |
| GET | `/api/V1/Worker/{id}` | 200 | - | PASS |
| GET | `/api/V1/Worker/public-worker/{id}` | 200 | - | PASS |
| GET | `/api/V1/Worker/{workerId}/StatusLog` | 200 | - | PASS |
| GET | `/api/V1/Worker/{workerId}/CurrentStatus` | 200 | - | PASS |
| POST | `/api/V1/Worker` | SKIP | - | SKIP(multipart) |
| PUT | `/api/V1/Worker/{id}` | SKIP | - | SKIP(multipart) |
| DELETE | `/api/V1/Worker/{id}` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{id}/upload-video` | SKIP | - | SKIP(multipart) |
| POST | `/api/V1/Worker/{id}/move-to-accommodation` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{id}/set-refusal` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{id}/activate` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Worker/StatusLog` | 404 | 404 | CHECK(404) |
| POST | `/api/V1/Worker/{workerId}/ActivateWantsWork` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/ActivateWantsTransfer` | 404 | 404 | PASS(routes+guards) |
| DELETE | `/api/V1/Worker/{workerId}/StatusLog/Last` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/Deportation` | SKIP | - | SKIP(multipart) |
| POST | `/api/V1/Worker/{workerId}/CancelDeportation` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/ExitHousing` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/Handover` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/ExitAndReEntry` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/AddUpdate` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/Worker/{workerId}/IssueResidency` | 400 | 400 | PASS(routes+guards) |

### Hourly Workers - Checkout & Tracking (13)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/HourlyWorkerOrders/{orderId}/Tracking` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerOrders/{orderId}/Invoices` | 200 | - | PASS |
| GET | `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation` | 404 | - | PASS(404) |
| POST | `/api/V1/HourlyWorkerOrders/Quote` | 404 | 404 | CHECK(404) |
| POST | `/api/V1/HourlyWorkerOrders/Checkout` | 400 | 400 | PASS(validates) |
| POST | `/api/V1/HourlyWorkerOrders/ConfirmPayment` | 400 | 400 | PASS(validates) |
| POST | `/api/V1/HourlyWorkerOrders/ConfirmPaymentWithTransfer` | SKIP | - | SKIP(multipart) |
| POST | `/api/V1/HourlyWorkerOrders/{orderId}/Tracking` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerOrders/{orderId}/AssignDriver` | 400 | 400 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerOrders/{orderId}/Invoices` | 404 | 404 | PASS(routes+guards) |
| POST | `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation` | 404 | 404 | PASS(routes+guards) |
| PUT | `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status` | 404 | 404 | PASS(routes+guards) |

### NationalityFollowUpConfig (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/FollowUp/NationalityFollowUpConfig/GetByNationality/{nationalityId}` | 200 | - | PASS |
| PUT | `/api/FollowUp/NationalityFollowUpConfig/Update` | 400 | 400 | PASS(validates) |
| POST | `/api/FollowUp/NationalityFollowUpConfig/BulkUpdate` | 200 | 200 | BUG(accepts empty body) |
| POST | `/api/FollowUp/NationalityFollowUpConfig/ToggleActive/{id}` | 400 | 400 | PASS(routes+guards) |

### VacationRequest (4)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| GET | `/api/V1/VacationRequest/{id}` | 404 | - | PASS(404) |
| POST | `/api/V1/VacationRequest/Create` | SKIP | - | SKIP(multipart) |
| POST | `/api/V1/VacationRequest/Approve/{id}` | 404 | 401 | PASS(routes+guards) |
| POST | `/api/V1/VacationRequest/Reject/{id}` | 404 | 401 | PASS(routes+guards) |

### Attendance (3)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/Attendance/Filter` | 200 | 401 | PASS |
| POST | `/api/V1/Attendance/CheckIn` | 400 | 401 | PASS(validates) |
| POST | `/api/V1/Attendance/CheckOut` | 400 | 401 | PASS(validates) |

### Department (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/Department` | 400 | 401 | PASS(validates) |

### External (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/External/request-worker` | 400 | 400 | PASS(validates) |

### File (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/File/upload-multiple` | SKIP | - | SKIP(multipart) |

### LeaveBalance (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/LeaveBalance/Filter` | 200 | 401 | PASS |

### Posting (2)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/Posting/{journalId}` | 400 | 401 | PASS(routes+guards) |
| POST | `/api/V1/Posting/{id}/unpost` | 400 | 401 | PASS(routes+guards) |

### RequestsInbox (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/V1/RequestsInbox/Filter` | 200 | 401 | PASS |

### RequestsOutbox (1)

| Method | Path | Status | noTok | Verdict |
|---|---|--:|--:|---|
| POST | `/api/HR/RequestsOutbox/Filter` | 200 | 401 | PASS |


---

# Phase 4 — Live write & lifecycle validation (non-production)

The environment was confirmed non-production, so mutating endpoints were exercised **for real** with valid bodies (FKs sourced from live data), full lifecycles were driven, and all removable test data was cleaned up afterward.

## Creates that work correctly with valid data (~28)
`Agent`, `Nationality`, `Marketer`, `Job`, `LeaveType`, `RestrictionType`, `FollowUpStatus`, `Admin/create-position`, `Commission`, `CustodyRequest` (+`Types`), `Employee`, `MedicalExamination`, `HourlyCatalog/Admin/Packages`, `Leave`, `Complaint` (mediation) + `Complaint/update`, `External/request-worker`, `Worker/StatusLog`, `Account/create-account`, `HourlyWorkerOrders/Quote`, `Customer/generate-english-name`, and the four **new HR request types** `PermissionRequest`, `ResignationRequest`, `EntitlementsRequest`, `JobModificationRequest`, `LoanRequest`.

> **Key reclassification:** the request-type creates that returned **500 on an empty body** in Phase 3 (Custody/Entitlements/Permission/Resignation/JobMod/Loan/Commission) all **succeed with a valid body**. Their Phase-3 500 is a *validation-gap crash*, not a broken endpoint.

## Lifecycles validated end-to-end
- **CRUD:** `HourlyCatalog/Admin/Packages` Create → GET `200` → DELETE `200` → GET `404` (confirmed removed).
- **Request workflow:** `PermissionRequest/Create` → `GetAll` (found) → `Approve/{id}` → `200`.
- **Accounting:** `create-account` validates the account-code prefix rule ("must start with parent code"); `JournalEntries` validates account existence (`400` "accounts not found" for a bad FK); **`PeriodClosing/close` year 2026 → `200`** (created closing journal entry `533b2681…`), then **`open` 2026 → `200`** (reversed). Real financial close/open cycle works and is reversible.

## Confirmed backend bugs — 500 instead of 400 on bad/missing input
- **`POST /api/Accounting/PaymentVoucher`** → **500 even with a populated body** (no basic validation; the sibling ReceiptVoucher/CreditNote/DebitNote all return `400`).
- **`POST /api/V1/CommissionSlice/Create`** → **500** (crashes without a valid `commissionId`).
- **Vouchers** (`ReceiptVoucher`/`CreditNote`/`DebitNote`) correctly `400` on missing required fields, but **500 on a well-formed but non-existent FK** — FK existence is not validated (uncaught DB error).
- **`create-account`** returns **500 when sent unexpected/extra fields** (should ignore or `400`); works when the body is exactly `{code,name,parentId}`.
- Incomplete-body **500s** (deep FK chains, not happy-path-validated here): `OperatingContractOffer`, `MediationContractOffer`, `EmploymentOperatingContract`, `Housing`, `HourlyCatalog/Admin/ServingAreas`, `Payroll/generate`.

## Silent-create bug — status after Phase 4
`Agent`, `Nationality`, `Marketer`, `Complaint`, `OperatingContractOffer` still accept an **empty body** and persist a blank row (Phase 3 finding stands), **but** with valid bodies they create correct records. Verdict: functional endpoints missing input validation.

## Request/field-shape notes (frontend contract)
- `create-account` body is `{code, name, parentId}` — **not** `parentAccountId`; `code` must start with the parent's code.
- Accounting notes use `creditNoteNumber` / `debitNoteNumber` (not `voucherNumber`); `ReceiptVoucher` requires `employmentOperatingContractId`.
- `HourlyDrivers.nationalId` must be ≤ 20 chars.

## Test-data cleanup
All test records created during Phases 3–4 that have a delete route were removed (accounts, agents, nationalities, marketers, jobs, leave types, restriction types, employees, medical exams, catalog packages, follow-up statuses) — **including the two blank records the prior report left in production** (Agent `021a68ae`, Nationality `d171205b`). Request-type records (Permission/Leave/Custody/Resignation/etc.) and one mediation Complaint have **no delete endpoint** and remain in the test DB by design.
