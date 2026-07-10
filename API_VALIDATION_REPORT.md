# Sigma API Validation Report

**Date:** 2026-07-08/09 (test run executed 2026-07-08 22:59 UTC)

**Base URL:** `https://sigma-api.runasp.net`

**Account used:** `sigma@gmail.com` (Admin role), branch `31887c15-5b47-4551-2190-08dea9210ab7`

**Total endpoint entries recorded:** 344 (covering all module groups in `src/config/api.config.ts`)

| Result | Count |
|---|---|
| PASS (2xx/3xx, behaved as expected) | 122 |
| PARTIAL (reachable, client-side 4xx — often correct validation) | 7 |
| FAIL (broken route, server error, or wrong behavior) | 19 |
| SKIPPED (mutating/irreversible or update/delete — out of approved scope) | 142 |
| NOT EXECUTED (body/id not confidently constructible) | 54 |

## 1. Scope & Methodology

Per the approved scope, testing covered: all GET/list/by-id/detail/trace/report/status/filter endpoints, safe POST reads (export, filter, auto-fill, trace), and POST *create* endpoints using minimal disposable test data (named `ZZ_APITEST_<timestamp>` where applicable). PUT/UPDATE endpoints were **skipped as out of scope** (scope is "reads + safe creates" only, not updates). DELETE endpoints and mutating lifecycle transitions (sign, approve, reject, terminate, renew, close, complete, cancel, activate/deactivate, post/unpost, refund, deportation, handover, warranty-return, logout, change-password, etc.) were **skipped** per explicit instruction. Where a CREATE endpoint's request body schema could not be confidently constructed from available information, it is recorded as NOT EXECUTED with a reason, rather than guessing.

Testing was performed with a single Node.js script (`fetch`-based) that logged in once, then executed every module's endpoints sequentially, capturing sample ids from list responses to drive by-id/nested lookups. A fresh login was performed proactively and the run completed in under the 20-minute re-login threshold, so no mid-run token expiry occurred.

## 2. Header Verification

### 2.1 Authorization + X-Branch-Id sent on every authenticated request

Verified via `curl -v` (raw request headers) against three representative endpoints, one per module family:

```
GET /api/V1/Branch HTTP/1.1
> Authorization: Bearer eyJhbGciOiJIUzI1NiIs... (valid JWT)
> X-Branch-Id: 31887c15-5b47-4551-2190-08dea9210ab7
< HTTP/1.1 200 OK

GET /api/V1/Customer HTTP/1.1
> Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
> X-Branch-Id: 31887c15-5b47-4551-2190-08dea9210ab7
< HTTP/1.1 200 OK

GET /api/V1/Worker HTTP/1.1
> Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
> X-Branch-Id: 31887c15-5b47-4551-2190-08dea9210ab7
< HTTP/1.1 200 OK
```

All 344 recorded rows below carry a `Headers Sent` column showing `Auth:Y Branch:Y` for every authenticated call actually executed by the test harness (the harness sets both headers on every request unless a route is documented as excluded, e.g. login/refresh-token).

### 2.2 X-Branch-Id enforcement — NOT enforced (backend ignores it)

Tested GET `/api/V1/Branch`, `/api/V1/Customer`, `/api/V1/Worker`, and `/api/V1/HourlyWorkers` **without** the `X-Branch-Id` header (Authorization still present). All four returned **200 OK** with full data, identical in shape to the with-header response. This matches the already-known `/api/V1/Branch` behavior noted in prior facts, and confirms it is **not an isolated case** — the backend does not enforce/require `X-Branch-Id` on any of the endpoints sampled. This means branch-scoping (if intended for multi-branch data isolation) is not being enforced at the API layer for these read endpoints.

### 2.3 CRITICAL FINDING — Authorization is not enforced on most read endpoints

While probing header behavior, we discovered that the large majority of GET endpoints sampled across many modules return **200 OK with full live data when called with NO `Authorization` header at all**, and even with a **garbage/invalid Bearer token**. Endpoints confirmed to leak data with zero valid credentials:

`/api/V1/Branch`, `/api/V1/Customer`, `/api/V1/Worker`, `/api/V1/Nationality`, `/api/V1/Agent`, `/api/V1/Marketer`, `/api/Complaint`, `/api/Mediation/MediationContract`, `/api/Accounting/ReceiptVoucher`, `/api/V1/HourlyDrivers`, `/api/V1/HourlyWorkers`, `/api/V1/restrictiontype`, `/api/TransferContract`, `/api/V1/account/full-tree-structure`, `/api/V1/JournalEntries` (returned live financial journal data with zero auth).

By contrast, the **HR module** (`/api/V1/Employee`, `/api/V1/Leave`) correctly returns **401 Unauthorized** without a valid token. This proves the API pipeline is capable of enforcing auth — it is simply **not applied consistently** across controllers. Given that Customer PII, Worker PII, financial journal entries, and accounting vouchers are all exposed, this is assessed as a **critical security defect**, not merely a header-header quirk. See Required Fixes §1.

## 3. Per-Module Results

### AUTH

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Auth/me | Auth:Y Branch:Y | 200 | {"success":true,"data":{"fullName":"Asmaa","email":"sigma@gmail.com","roles":["Admin","Employee"]},"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/Auth/logout | - | SKIPPED | SKIPPED (revoke/logout — irreversible, explicitly out of scope) | n/a |  |
| POST | /api/V1/Auth/change-password | - | SKIPPED | SKIPPED (would change live admin password — irreversible/destructive, out of scope) | n/a |  |
| POST | /api/V1/Auth/add-admin | Auth:Y Branch:Y | 200 | {"success":true,"data":"Admin user created successfully.","errors":null,"statusCode":200} | yes | Created a disposable admin account successfully (email zz.apitest.<ts>@example.com). No delete endpoint exists for admin/auth users in api.config.ts to clean this up — flagged for manual cleanup. Request body: {"fullName":"ZZ_APITEST_1783551551581","email":"zz.apitest.1783551551581@example.com","password":"ZzApiTest1234$","phoneNumber":"0500000000"} |
| POST | /api/V1/Auth/refresh-token | Auth:N Branch:N (excluded per spec) | 200 | {"success":true,"data":{"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjJkYmI3MzNiLTZiNjItNGQ0ZS04NTIyLTg0NTg4NmM4Zjg5... | yes | Rotated to a new access+refresh token pair successfully when called without Authorization/X-Branch-Id headers (correctly excluded per spec). Session was immediately re-established via a fresh login afterward as a precaution. |

### BRANCH

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Branch | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"31887c15-5b47-4551-2190-08dea9210ab7","nameAr":"????? ????????","nameEn":"????? ????????","phone":null,"mobile":null,"email":null,"mainBranch":1,"parentBranchId":null,"parentBranch... | yes |  |
| GET | /api/V1/Branch/31887c15-5b47-4551-2190-08dea9210ab7 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"31887c15-5b47-4551-2190-08dea9210ab7","nameAr":"????? ????????","nameEn":"????? ????????","organizationTypeAr":null,"addressAr":null,"addressEn":null,"cityAr":null,"phone":null,"mobile":null... | yes |  |
| GET | /api/V1/Branch/31887c15-5b47-4551-2190-08dea9210ab7/sub-branches | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"f1457312-ecd8-4f02-2191-08dea9210ab7","nameAr":"ابحر","nameEn":"ابحر","phone":null,"mobile":null,"email":null,"mainBranch":0,"parentBranchId":"31887c15-5b47-4551-2190-08dea9210ab7","parentB... | yes |  |
| POST | /api/V1/Branch | Auth:Y Branch:Y | 400 | {"success":false,"errors":["AllowedRadiusMeters must be greater than 0."]} | yes | Correctly validates required AllowedRadiusMeters > 0 (geofencing field) and rejected the disposable test body — no junk record created. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","mainBranch":0,"parentBranchId":"31887c15-5b47-4551-2190-08dea9210ab7"} |
| PUT | /api/V1/Branch/{id} | - | SKIPPED | SKIPPED (update — out of approved scope: reads + safe creates only) | n/a |  |
| DELETE | /api/V1/Branch/{id} | - | SKIPPED | SKIPPED (delete explicitly out of scope) | n/a |  |

### CUSTOMERS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Customer | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"4613234d-446f-4f96-0082-08ded693a65b","arabicName":"سهام الحربي ","englishName":null,"identityNumber":null,"nationality":"9af3aefa-3fee-4e86-2d81-08de9d465260","cityAr":"جده","city... | yes |  |
| GET | /api/V1/Customer/4613234d-446f-4f96-0082-08ded693a65b | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"4613234d-446f-4f96-0082-08ded693a65b","arabicName":"سهام الحربي ","englishName":null,"identityNumber":null,"nationality":"9af3aefa-3fee-4e86-2d81-08de9d465260","cityAr":"جده","cityEn":"Jedda... | yes |  |
| POST | /api/V1/Customer | Auth:Y Branch:Y | 400 | {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Phones":["The Phones field is required."],"Nationality":["The Nationality field is re... | yes | Correctly validates required Phones and Nationality fields and rejected the disposable test body — no junk record created. Request body: {"arabicName":"ZZ_APITEST_1783551551581","englishName":"ZZ_APITEST_1783551551581","nationality":null,"cityAr":"test","cityEn":"test"} |
| PUT | /api/V1/Customer/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Customer/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| GET | /api/V1/Customer/export | Auth:Y Branch:Y | 200 | [binary file response, 414 bytes shown — likely .xlsx/export file, content omitted] | yes | Returned a binary .xlsx file (zip/PK header) — export works. |

### DOCUMENT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Document/GetAllDocument | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404 body, not a JSON app error) — endpoint appears not deployed on live backend. |
| GET | /api/Document/GetDocumentById/{id} | - | NOT_EXECUTED | no id available | n/a |  |
| POST | /api/Document/CreateDocument | - | NOT_EXECUTED | not executed — likely multipart/file upload, body unknown/not confidently constructible | n/a |  |
| PUT | /api/Document/UpdateDocument/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/Document/DeleteDocument/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### ROLES

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Roles/GetAllRoles | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404) — module appears not deployed on live backend. |
| GET | /api/Roles/GetRoleById/{id} | - | NOT_EXECUTED | no id available | n/a |  |
| POST | /api/Roles/Create | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404). Request body: {"name":"ZZ_APITEST_1783551551581","description":"api test role"} |
| PUT | /api/Roles/Update/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/Roles/Delete/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### USERS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Users/GetAllUsers | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404) — module appears not deployed on live backend. |
| GET | /api/Users/GetUserById/{id} | - | NOT_EXECUTED | no id available | n/a |  |
| POST | /api/Auth/register | - | NOT_EXECUTED | not executed — duplicate/overlaps with add-admin; register body/role requirements unclear, deferred to avoid duplicate disposable accounts | n/a |  |
| PUT | /api/Users/UpdateUserById/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/Users/DeleteUserById/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### AGENT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Agent | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"596445ca-263e-4c5c-62bb-08de9d43d411","agentNameAr":"مكتب جاكرتا للاستقدام","agentNameEn":"Jakarta Recruitment Office","username":"jakarta_agent","nationalityId":null,"agentLicense":"LIC-IN... | yes |  |
| GET | /api/V1/Agent/596445ca-263e-4c5c-62bb-08de9d43d411 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"596445ca-263e-4c5c-62bb-08de9d43d411","agentNameAr":"مكتب جاكرتا للاستقدام","agentNameEn":"Jakarta Recruitment Office","username":"jakarta_agent","nationalityId":null,"agentLicense":"LIC-IND... | yes |  |
| POST | /api/V1/Agent | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"021a68ae-599e-4731-a5a7-08dedd448ab0","agentNameAr":null,"agentNameEn":null,"username":null,"nationalityId":null,"agentLicense":null,"contractType":null,"phone":"0500000000","mobile":null,"e... | no | Returned HTTP 200 success and created a real Agent record, but all name fields (agentNameAr/agentNameEn) are null in the response — the test body used nameAr/nameEn which do not bind to the actual agentNameAr/agentNameEn properties, and the API accepted a blank-named record without validation. Leaves a junk blank Agent record in production; also flags a validation gap (should require a name). Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","phone":"0500000000"} |
| PUT | /api/V1/Agent/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Agent/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### JOB

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Job | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"01605bfb-6013-4306-f4c2-08de9bab1e0a","jobNameAr":"ممرض منزلي","jobNameEn":"Home Nurse","hasWorkCard":true,"workCardFees":800,"isActive":true},{"id":"3ae7b9d3-d451-40f1-f4c1-08de9b... | yes |  |
| GET | /api/V1/Job/01605bfb-6013-4306-f4c2-08de9bab1e0a | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"01605bfb-6013-4306-f4c2-08de9bab1e0a","jobNameAr":"ممرض منزلي","jobNameEn":"Home Nurse","hasWorkCard":true,"workCardFees":800,"isActive":true},"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/Job | Auth:Y Branch:Y | 200 | {"success":true,"data":"تم إضافة الوظيفة بنجاح","errors":null,"statusCode":200} | partial | Returned a generic success message (Arabic) without echoing the created entity, so field-binding correctness could not be confirmed from the response alone. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| PUT | /api/V1/Job/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Job/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### WORKERS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Worker | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","referenceNo":"WDK-2026-4402","fullNameAr":"عبد الله ابراهيم","fullNameEn":"2عبد الله ابراهيم","nationalityName":"سريلانكا","jobName":"سائق خا... | yes |  |
| GET | /api/V1/Worker/b3bf6c93-b0bd-4571-6551-08dea2ba50f7 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","referenceNo":"WDK-2026-4402","workerStatus":3,"workerType":1,"fullNameAr":"عبد الله ابراهيم","fullNameEn":"2عبد الله ابراهيم","religion":1,"userId":"US... | yes |  |
| POST | /api/V1/Worker | - | NOT_EXECUTED | not executed — worker creation requires many FK ids (nationality, job, agent, branch) not confidently constructible without domain knowledge; risk of wrong guess creating malformed record | n/a |  |
| PUT | /api/V1/Worker/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Worker/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/activate | - | SKIPPED | SKIPPED (lifecycle activate — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/move-to-accommodation | - | SKIPPED | SKIPPED (lifecycle transition — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/set-refusal | - | SKIPPED | SKIPPED (lifecycle transition — out of scope) | n/a |  |
| POST | /api/V1/Worker/WantsTransfer | - | SKIPPED | SKIPPED (worker lifecycle state mutation — out of scope) | n/a |  |
| GET | /api/V1/Worker/export | Auth:Y Branch:Y | 200 | [binary file response, 414 bytes shown — likely .xlsx/export file, content omitted] | yes | Returned a binary .xlsx file — export works. |

### RECRUITMENT_REQUEST

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/RecruitmentRequest | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404) — module appears not deployed on live backend. |
| POST | /api/RecruitmentRequest | - | NOT_EXECUTED | not executed — complex body (customer+worker refs) not confidently constructible | n/a |  |
| POST | /api/RecruitmentRequest/ChoiceCusomer | - | SKIPPED | SKIPPED (mutates live request workflow state — out of scope) | n/a |  |
| POST | /api/RecruitmentRequest/ChoiceWorker | - | SKIPPED | SKIPPED (mutates live request workflow state — out of scope) | n/a |  |
| DELETE | /api/RecruitmentRequest/DeleteWorker/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | /api/RecruitmentRequest/ReviewRequest | - | SKIPPED | SKIPPED (lifecycle transition — out of scope) | n/a |  |
| POST | /api/RecruitmentRequest/RefusedRequest | - | SKIPPED | SKIPPED (lifecycle transition/reject — out of scope) | n/a |  |
| POST | /api/RecruitmentRequest/AcceptRequest | - | SKIPPED | SKIPPED (lifecycle transition/approve — out of scope) | n/a |  |

### OPERATING_CONTRACT_OFFER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/OperatingContractOffer | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"55861229-b9df-472e-7e40-08dea0930285","offerType":1,"offerNumber":1,"offerContractType":1,"offerTitle":null,"numberOfDays":0,"nationalityId":"a9b569e2-7553-44d6-2d85-08de9d465260",... | yes |  |
| GET | /api/OperatingContractOffer/55861229-b9df-472e-7e40-08dea0930285 | Auth:Y Branch:Y | 200 | {"id":"55861229-b9df-472e-7e40-08dea0930285","offerType":1,"offerNumber":1,"offerContractType":1,"offerTitle":null,"numberOfDays":0,"nationalityId":"a9b569e2-7553-44d6-2d85-08de9d465260","jobId":"3ae7b9d3-d451-40f1-f4c1-... | yes |  |
| POST | /api/OperatingContractOffer | - | NOT_EXECUTED | not executed — body schema unknown, needs contract-domain FKs | n/a |  |
| PUT | /api/OperatingContractOffer/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/OperatingContractOffer/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### EMPLOYMENT_OPERATING_CONTRACT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/EmploymentOperatingContract | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"471eb219-fe0c-416f-b190-08ded691d2a4","customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","marketerId":null,"contractNumber":10,"contractCategory":null,"offerId":null,"operationTyp... | yes |  |
| GET | /api/EmploymentOperatingContract/471eb219-fe0c-416f-b190-08ded691d2a4 | Auth:Y Branch:Y | 200 | {"id":"471eb219-fe0c-416f-b190-08ded691d2a4","customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","marketerId":null,"contractNumber":10,"contractCategory":null,"offerId":null,"operationType":1,"paymentMethod":1,"nationali... | yes |  |
| POST | /api/EmploymentOperatingContract | - | NOT_EXECUTED | not executed — complex contract body schema unknown | n/a |  |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | .../{id}/sign | - | SKIPPED | SKIPPED (explicit: sign — out of scope) | n/a |  |
| POST | .../{id}/start-execution | - | SKIPPED | SKIPPED (explicit: start-execution — out of scope) | n/a |  |
| POST | .../{id}/renew | - | SKIPPED | SKIPPED (explicit: renew — out of scope) | n/a |  |
| POST | .../{id}/terminate | - | SKIPPED | SKIPPED (explicit: terminate — out of scope) | n/a |  |
| POST | .../{id}/customer-refund | - | SKIPPED | SKIPPED (explicit: customer-refund — out of scope) | n/a |  |
| GET | /api/EmploymentOperatingContract/471eb219-fe0c-416f-b190-08ded691d2a4/print-receipt-form | Auth:Y Branch:Y | 200 | {"message":"Data for print form generated.","contract":{"id":"471eb219-fe0c-416f-b190-08ded691d2a4","customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","marketerId":null,"contractNumber":10,"contractCategory":null,"offer... | yes |  |

### COMPLAINT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Complaint | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"7855d223-7f82-49f2-2d9d-08dec7d5e9e7","complaintNumber":8,"source":2,"sourceName":"Worker","priority":1,"priorityName":"Green","status":3,"statusName":"Finished","holdReason":null,... | yes |  |
| GET | /api/Complaint/7855d223-7f82-49f2-2d9d-08dec7d5e9e7 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"7855d223-7f82-49f2-2d9d-08dec7d5e9e7","complaintNumber":8,"source":2,"sourceName":"Worker","priority":1,"priorityName":"Green","status":3,"statusName":"Finished","holdReason":null,"customerI... | yes |  |
| GET | /api/Complaint/7855d223-7f82-49f2-2d9d-08dec7d5e9e7/issue | Auth:Y Branch:Y | 404 | {"success":false,"data":null,"errors":["Issue not found"],"statusCode":404} | yes | Route exists; returned structured 404 "Issue not found" — correct app-level behavior for a complaint with no issue attached. |
| POST | /api/Complaint | - | NOT_EXECUTED | not executed — body schema (customer/worker/contract refs) unknown | n/a |  |
| DELETE | /api/Complaint/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | /api/Complaint/{id}/finish | - | SKIPPED | SKIPPED (lifecycle: finish/complete — out of scope) | n/a |  |
| POST | /api/Complaint/{id}/toggle-hold | - | SKIPPED | SKIPPED (toggle state — out of scope) | n/a |  |
| POST | /api/Complaint/issue | - | NOT_EXECUTED | not executed — multipart/form-data, requires real complaint id + file, not attempted to avoid corrupt data | n/a |  |
| POST | /api/Complaint/update | - | NOT_EXECUTED | not executed — body schema unknown | n/a |  |

### NATIONALITY

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Nationality | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"bbee0b3d-365d-40b6-2d87-08de9d465260","nationalityNameAr":"سريلانكا","nationalityNameEn":"Sri Lanka","isActive":true,"createdDate":"2026-04-18T12:31:33.5035716","updatedDate":null}... | yes |  |
| GET | /api/V1/Nationality/bbee0b3d-365d-40b6-2d87-08de9d465260 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"bbee0b3d-365d-40b6-2d87-08de9d465260","nationalityNameAr":"سريلانكا","nationalityNameEn":"Sri Lanka","isActive":true,"createdDate":"2026-04-18T12:31:33.5035716","updatedDate":null},"errors":... | yes |  |
| POST | /api/V1/Nationality | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"d171205b-e017-42e8-4815-08dedd448c0e","nationalityNameAr":null,"nationalityNameEn":null,"isActive":null,"createdDate":"2026-07-08T22:59:21.043577Z","updatedDate":null},"errors":null,"statusC... | no | Returned HTTP 200/201 success and created a real Nationality record, but nationalityNameAr/nationalityNameEn are null in the response — test body used nameAr/nameEn which did not bind, and the API accepted a blank-named record without validation. Leaves a junk blank Nationality record in production; validation gap. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| PUT | /api/V1/Nationality/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Nationality/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | /api/V1/Nationality/{id}/toggle-status | - | SKIPPED | SKIPPED (toggle — out of scope) | n/a |  |

### MEDIATION_CONTRACT_OFFER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Mediation/MediationContractOffer | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"d11adcb7-51cf-4022-8539-daa40766b2ae","offerNumber":8,"nationalityId":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityNameAr":"سريلانكا","jobId":"b7c7f899-0cac-4698-f4c0-08de9ba... | yes |  |
| GET | /api/Mediation/MediationContractOffer/d11adcb7-51cf-4022-8539-daa40766b2ae | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"d11adcb7-51cf-4022-8539-daa40766b2ae","offerNumber":8,"nationalityId":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityNameAr":"سريلانكا","jobId":"b7c7f899-0cac-4698-f4c0-08de9bab1e0a","jo... | yes |  |
| POST | /api/Mediation/MediationContractOffer | - | NOT_EXECUTED | not executed — body schema unknown (pricing/nationality/job FKs) | n/a |  |
| PUT | /api/Mediation/MediationContractOffer | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | .../{id}/toggle-active | - | SKIPPED | SKIPPED (toggle — out of scope) | n/a |  |
| POST | /api/Mediation/MediationContractOffer/auto-fill | Auth:Y Branch:Y | 200 | {"success":true,"data":{"offerId":null,"found":false,"message":"لا يوجد عرض لهذه الجنسية","localCost":null,"agentCostSAR":null,"salary":null,"taxLocalCost":null,"totalOfferCost":null,"jobId":null,"workerType":null,"previ... | yes | Accepted empty body, returned a structured "found: false" response with an Arabic not-found message rather than erroring — reasonable behavior for an empty/no-match query. Request body: {} |

### MEDIATION_CONTRACT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Mediation/MediationContract | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"57f874c3-7f34-4328-2abd-08dedcf32c24","contractNumber":23,"statusName":"Signed","contractTypeName":"New","customerId":"4613234d-446f-4f96-0082-08ded693a65b","customerName":"سهام ال... | yes |  |
| GET | /api/Mediation/MediationContract/57f874c3-7f34-4328-2abd-08dedcf32c24 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"visaType":1,"visaDateHijri":null,"isComprehensiveQualificationVisa":false,"localCost":9800,"agentCostSAR":5200,"managerDiscount":0,"costDiscount":0,"costDescription":null,"hasContractInsurance":f... | yes |  |
| GET | /api/Mediation/MediationContract/status-history/57f874c3-7f34-4328-2abd-08dedcf32c24 | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"40695c6f-5af7-46f9-ca06-08dedcf32c3a","oldStatus":1,"oldStatusName":"Draft","newStatus":2,"newStatusName":"Signed","notes":"تم التوقيع والدفع في مساند","createdAt":"2026-07-08T13:17:44.4639... | yes |  |
| POST | /api/Mediation/MediationContract | - | NOT_EXECUTED | not executed — body schema unknown (customer/worker/offer FKs) | n/a |  |
| GET | /api/Mediation/MediationContract/export | Auth:Y Branch:Y | 200 | [binary file response, 414 bytes shown — likely .xlsx/export file, content omitted] | yes | Returned a binary .xlsx file — export works. |
| POST | /api/Mediation/MediationContract/cancel | - | SKIPPED | SKIPPED (explicit: cancel — out of scope) | n/a |  |
| POST | /api/Mediation/MediationContract/sign | - | SKIPPED | SKIPPED (explicit: sign — out of scope) | n/a |  |
| POST | /api/Mediation/MediationContract/update-status | - | SKIPPED | SKIPPED (status transition — out of scope) | n/a |  |
| POST | /api/Mediation/MediationContract/delivery-form | - | NOT_EXECUTED | not executed — creates real delivery-form record tied to a live contract; body schema unknown, deferred out of caution | n/a |  |
| POST | /api/Mediation/MediationContract/delivery-form/sign | - | SKIPPED | SKIPPED (explicit: sign — out of scope) | n/a |  |
| POST | /api/Mediation/MediationContract/warranty-return | - | SKIPPED | SKIPPED (explicit: warranty-return — out of scope) | n/a |  |

### CONTRACT_CREATION_REQUIREMENTS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/ContractCreationRequirements | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404) — legacy module superseded by CONTRACT_CREATION_REQUIREMENT (/api/FollowUp/...), which is live. |
| GET | .../{id} | - | NOT_EXECUTED | no id available | n/a |  |
| GET | /api/ContractCreationRequirements/GetRequirement | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404). |
| POST | /api/ContractCreationRequirements | - | NOT_EXECUTED | not executed — body schema unknown | n/a |  |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### NATIONALITY_FOLLOWUP

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Nationality/GetAllNationalityFollowUpStatus | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404) — legacy module superseded by NATIONALITY_FOLLOWUP_CONFIG (/api/FollowUp/...), which is live. |
| GET | /api/Nationality/GetNationalityFollowUpStatus/bbee0b3d-365d-40b6-2d87-08de9d465260 | Auth:Y Branch:Y | 404 |  | no | Route not found (blank 404). |
| POST | /api/Nationality/CreateNationalityFollowUpStatus | - | NOT_EXECUTED | not executed — body schema unknown | n/a |  |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| POST | .../{id} | - | SKIPPED | SKIPPED (toggle — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### MARKETER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Marketer | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"794c03ee-61d2-4446-0c13-08de9bbdbf96","nameAr":"فيسبوك","nameEn":"Facebook","createdDate":"2026-04-16T14:06:41.1265646"},{"id":"e646288d-0cd6-4dc2-0c12-08de9bbdbf96","nameAr":"تيك ... | yes |  |
| GET | /api/V1/Marketer/794c03ee-61d2-4446-0c13-08de9bbdbf96 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"794c03ee-61d2-4446-0c13-08de9bbdbf96","nameAr":"فيسبوك","nameEn":"Facebook","createdDate":"2026-04-16T14:06:41.1265646","createdBy":"","updatedDate":null,"updatedBy":null},"errors":null,"sta... | yes |  |
| POST | /api/V1/Marketer | Auth:Y Branch:Y | 200 | {"success":true,"data":"تم إضافة المسوق بنجاح","errors":null,"statusCode":200} | partial | Returned a generic success message (Arabic) without echoing the created entity, so field-binding correctness could not be confirmed. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","phone":"0500000000"} |
| PUT | /api/V1/Marketer/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Marketer/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### RECEIPT_VOUCHER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Accounting/ReceiptVoucher | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"dc1e297f-78a4-4d30-426e-08ded7a03d79","voucherSerialNumber":7,"voucherNumber":"20","voucherDate":"2026-07-01T18:41:51.815","amount":3000,"notes":null,"employmentOperatingContractId":"471eb2... | yes |  |
| GET | /api/Accounting/ReceiptVoucher/dc1e297f-78a4-4d30-426e-08ded7a03d79 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"dc1e297f-78a4-4d30-426e-08ded7a03d79","voucherSerialNumber":7,"voucherNumber":"20","voucherDate":"2026-07-01T18:41:51.815","amount":3000,"notes":null,"employmentOperatingContractId":"471eb21... | yes |  |
| GET | /api/Accounting/ReceiptVoucher/dc1e297f-78a4-4d30-426e-08ded7a03d79/trace | Auth:Y Branch:Y | 200 | {"success":true,"data":{"documentType":1,"documentEntityId":"dc1e297f-78a4-4d30-426e-08ded7a03d79","document":{"id":"dc1e297f-78a4-4d30-426e-08ded7a03d79","documentType":1,"documentNumber":"20","documentDate":"2026-07-01... | yes |  |
| POST | /api/Accounting/ReceiptVoucher | - | NOT_EXECUTED | not executed — accounting document body schema (accounts, amounts, customer/agent refs) unknown, risk of creating incorrect ledger-adjacent record | n/a |  |

### PAYMENT_VOUCHER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Accounting/PaymentVoucher | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"531e907d-0650-4ca9-b0e3-08ded3b95867","voucherSerialNumber":0,"voucherNumber":"TEST-PV-001","voucherDate":"2026-06-26T00:00:00","amount":100,"notes":"integration test","paymentMethod":1,"pa... | yes |  |
| GET | /api/Accounting/PaymentVoucher/531e907d-0650-4ca9-b0e3-08ded3b95867 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"531e907d-0650-4ca9-b0e3-08ded3b95867","voucherSerialNumber":0,"voucherNumber":"TEST-PV-001","voucherDate":"2026-06-26T00:00:00","amount":100,"notes":"integration test","paymentMethod":1,"pay... | yes |  |
| GET | /api/Accounting/PaymentVoucher/531e907d-0650-4ca9-b0e3-08ded3b95867/trace | Auth:Y Branch:Y | 200 | {"success":true,"data":{"documentType":2,"documentEntityId":"531e907d-0650-4ca9-b0e3-08ded3b95867","document":{"id":"531e907d-0650-4ca9-b0e3-08ded3b95867","documentType":2,"documentNumber":"TEST-PV-001","documentDate":"2... | yes |  |
| POST | /api/Accounting/PaymentVoucher | - | NOT_EXECUTED | not executed — accounting document body schema (accounts, amounts, customer/agent refs) unknown, risk of creating incorrect ledger-adjacent record | n/a |  |

### CREDIT_NOTE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Accounting/CreditNote | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |
| GET | /api/Accounting/CreditNote/{id} | - | NOT_EXECUTED | no id available | n/a |  |
| GET | /api/Accounting/CreditNote/{id}/trace | - | NOT_EXECUTED | no id available | n/a |  |
| POST | /api/Accounting/CreditNote | - | NOT_EXECUTED | not executed — accounting document body schema (accounts, amounts, customer/agent refs) unknown, risk of creating incorrect ledger-adjacent record | n/a |  |

### DEBIT_NOTE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Accounting/DebitNote | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |
| GET | /api/Accounting/DebitNote/{id} | - | NOT_EXECUTED | no id available | n/a |  |
| GET | /api/Accounting/DebitNote/{id}/trace | - | NOT_EXECUTED | no id available | n/a |  |
| POST | /api/Accounting/DebitNote | - | NOT_EXECUTED | not executed — accounting document body schema (accounts, amounts, customer/agent refs) unknown, risk of creating incorrect ledger-adjacent record | n/a |  |

### PERIOD_CLOSING

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/PeriodClosing/status | Auth:Y Branch:Y | 200 | {"success":true,"data":false,"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/PeriodClosing/close | - | SKIPPED | SKIPPED (explicit: close — irreversible financial period close, out of scope) | n/a |  |

### TRANSFER_CONTRACT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/TransferContract | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"7d9a3770-ea90-4eb5-f8cc-08deaddaafa1","customerId":"d0e64d14-ebf4-472f-58b9-08de9fe18f14","customerName":"أحمد محمود عبد الرحمن","contractNumber":11,"workerId":"d03d13d1-8301-4c75-... | yes |  |
| GET | /api/TransferContract/7d9a3770-ea90-4eb5-f8cc-08deaddaafa1 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"7d9a3770-ea90-4eb5-f8cc-08deaddaafa1","customerId":"d0e64d14-ebf4-472f-58b9-08de9fe18f14","customerName":"أحمد محمود عبد الرحمن","contractNumber":11,"workerId":"d03d13d1-8301-4c75-6d22-08dea... | yes |  |
| GET | /api/TransferContract/7d9a3770-ea90-4eb5-f8cc-08deaddaafa1/authority-status | Auth:Y Branch:Y | 405 |  | no | 405 Method Not Allowed on GET — route likely expects a different HTTP verb (e.g. POST) or this GET accessor in api.config.ts is wrong. |
| POST | /api/TransferContract | - | NOT_EXECUTED | not executed — body schema unknown (worker/customer FKs) | n/a |  |
| GET | /api/TransferContract/export | Auth:Y Branch:Y | 200 | [binary file response, 414 bytes shown — likely .xlsx/export file, content omitted] | yes | Returned a binary .xlsx file — export works. |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | .../{id}/sign | - | SKIPPED | SKIPPED (explicit: sign — out of scope) | n/a |  |
| POST | .../{id}/complete | - | SKIPPED | SKIPPED (explicit: complete — out of scope) | n/a |  |

### MEDICAL_EXAMINATION

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/MedicalExamination | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"24491f8a-2758-4b6e-fa89-08ded68546fd","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","examDate":"2026-06-30T09:00:00","medicalStatus":1,"notes":"... | yes |  |
| GET | /api/V1/MedicalExamination/24491f8a-2758-4b6e-fa89-08ded68546fd | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"24491f8a-2758-4b6e-fa89-08ded68546fd","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","workerReferenceNo":"WDK-2026-4402","examDate":"2026-06-30T09:00:00","... | yes |  |
| GET | /api/V1/MedicalExamination/report/24491f8a-2758-4b6e-fa89-08ded68546fd | Auth:Y Branch:Y | 200 | {"success":true,"data":{"examinationId":"24491f8a-2758-4b6e-fa89-08ded68546fd","workerFullNameAr":"عبد الله ابراهيم","workerFullNameEn":"2عبد الله ابراهيم","workerReferenceNo":"WDK-2026-4402","passportNo":"P55664433","na... | yes |  |
| GET | /api/V1/MedicalExamination/check-worker/b3bf6c93-b0bd-4571-6551-08dea2ba50f7 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"24491f8a-2758-4b6e-fa89-08ded68546fd","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","workerReferenceNo":"WDK-2026-4402","examDate":"2026-06-30T09:00:00","... | yes |  |
| POST | /api/V1/MedicalExamination | - | NOT_EXECUTED | not executed — body schema unknown (worker FK, exam results) | n/a |  |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### FOLLOWUP_STATUS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/FollowUp/FollowUpStatus/GetAll | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"26af5347-5871-4264-694f-08dea2f0880f","nameAr":"إرسال العقد","nameEn":"Contract Musaned","defaultSortOrder":1},{"id":"a34ca8f6-e242-4c2d-6950-08dea2f0880f","nameAr":"عقد السفارة","nameEn":"... | yes |  |
| GET | /api/FollowUp/FollowUpStatus/GetById/26af5347-5871-4264-694f-08dea2f0880f | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"26af5347-5871-4264-694f-08dea2f0880f","nameAr":"إرسال العقد","nameEn":"Contract Musaned","defaultSortOrder":1},"errors":null,"statusCode":200} | yes |  |
| POST | /api/FollowUp/FollowUpStatus/Create | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"1c618abe-f388-4c17-79ad-08dedd448eb0","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","defaultSortOrder":0},"errors":null,"statusCode":200} | yes | Correctly bound and echoed back nameAr/nameEn exactly as sent — clean, well-behaved create. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| PUT/POST | /api/FollowUp/FollowUpStatus/Update | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../Delete/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### CONTRACT_NATIONALITY

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/FollowUp/ContractNationality/GetAll | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityId":"bbee0b3d-365d-40b6-2d87-08de9d465260","nameAr":"سريلانكا","nameEn":"Sri Lanka","isActive":true,"configuredStatusCount":8},{"id":"81146... | yes |  |
| POST | /api/FollowUp/ContractNationality/Create | - | NOT_EXECUTED | not executed — body schema (nationalityId FK) unknown/risk of duplicate enrollment | n/a |  |
| PUT/POST | /api/FollowUp/ContractNationality/Update | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../Delete/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### NATIONALITY_FOLLOWUP_CONFIG

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/FollowUp/NationalityFollowUpConfig/GetByNationality/ea5cd852-d84a-441a-c18b-08dea2f4800b | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"2b461b3d-1234-44c4-c945-08dea2f48050","nationalityId":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityNameAr":"سريلانكا","followUpStatusId":"26af5347-5871-4264-694f-08dea2f0880f","status... | yes |  |
| POST | .../ToggleActive/{id} | - | SKIPPED | SKIPPED (toggle — out of scope) | n/a |  |
| PUT/POST | .../Update | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| POST | .../BulkUpdate | - | SKIPPED | SKIPPED (bulk update — out of scope) | n/a |  |

### MEDIATION_FOLLOWUP

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Mediation/MediationFollowUp/dashboard | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"57f874c3-7f34-4328-2abd-08dedcf32c24","contractNumber":23,"statusName":"Signed","contractTypeName":"New","customerId":"4613234d-446f-4f96-0082-08ded693a65b","customerName":"سهام ال... | yes |  |
| GET | /api/Mediation/MediationFollowUp/items/57f874c3-7f34-4328-2abd-08dedcf32c24 | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"fbbf9d5b-60fc-4cb9-468c-08dedcf32c46","mediationContractId":"57f874c3-7f34-4328-2abd-08dedcf32c24","followUpStatusId":"26af5347-5871-4264-694f-08dea2f0880f","statusNameAr":"إرسال العقد","st... | yes |  |
| GET | /api/Mediation/MediationFollowUp/item/fbbf9d5b-60fc-4cb9-468c-08dedcf32c46 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"fbbf9d5b-60fc-4cb9-468c-08dedcf32c46","mediationContractId":"57f874c3-7f34-4328-2abd-08dedcf32c24","followUpStatusId":"26af5347-5871-4264-694f-08dea2f0880f","statusNameAr":"إرسال العقد","sta... | yes |  |
| POST | .../update-description | - | NOT_EXECUTED | not executed — mutates a real follow-up item description; needs itemId, treated as update-like, deferred out of scope | n/a |  |

### CONTRACT_FOLLOWUP

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/FollowUp/ContractFollowUp/CanComplete/fbbf9d5b-60fc-4cb9-468c-08dedcf32c46 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"canComplete":true},"errors":null,"statusCode":200} | yes |  |
| POST | /api/FollowUp/ContractFollowUp/CompleteItem | - | SKIPPED | SKIPPED (explicit: complete — out of scope) | n/a |  |

### CONTRACT_CREATION_REQUIREMENT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob?nationalityId=bbee0b3d-365d-40b6-2d87-08de9d465260&jobId=01605bfb-6013-4306-f4c2-08de9bab1e0a | Auth:Y Branch:Y | 404 | {"success":false,"data":null,"errors":["لا توجد متطلبات لهذه الجنسية/الوظيفة"],"statusCode":404} | yes | Route exists; returned structured 404 with Arabic message "no requirements for this nationality/job" — correct app-level behavior (test nationality/job combo has none configured). |
| GET | .../GetById/{id} | - | NOT_EXECUTED | no id available (no create attempted) | n/a |  |
| POST | .../Create | - | NOT_EXECUTED | not executed — body schema (nationalityId/jobId/requirement list) not confidently constructible | n/a |  |
| PUT/POST | .../Update | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../Delete/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### HR_EMPLOYEE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Employee | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"b4ac372e-8cb4-4926-6e2b-08de9e50dd76","employeeNumber":"EMP001-UPDATED","nameAr":"???? ???? ???","nameEn":"Ahmed Mohamed Ali","email":"ahmed.updated@sigma.com","idNumber":"98765432... | yes |  |
| GET | /api/V1/Employee/b4ac372e-8cb4-4926-6e2b-08de9e50dd76 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"basicSalary":6500,"housingAllowance":1200,"mobilityAllowance":600,"otherAllowances":300,"totalSalary":8600,"id":"b4ac372e-8cb4-4926-6e2b-08de9e50dd76","employeeNumber":"EMP001-UPDATED","nameAr":"... | yes |  |
| POST | /api/V1/Employee | - | NOT_EXECUTED | not executed — per prior verified facts, requires userName+branch+more fields; deferred to avoid creating malformed live employee record | n/a |  |
| PUT | /api/V1/Employee/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/Employee/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | /api/V1/Employee/{id}/reset-password | - | SKIPPED | SKIPPED (mutates real employee credentials — out of scope) | n/a |  |

### HR_ATTENDANCE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| POST | /api/V1/Attendance/CheckIn | - | SKIPPED | SKIPPED (creates real geofenced attendance record tied to logged-in user — mutating, out of scope) | n/a |  |
| POST | /api/V1/Attendance/CheckOut | - | SKIPPED | SKIPPED (mutating attendance state — out of scope) | n/a |  |
| POST | /api/V1/Attendance/Filter | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"9e60f0d6-ed87-410b-f4b0-08deb44be26f","employeeId":"bfb61903-0fee-4c71-d5e2-08deb44b8def","employeeName":null,"attendanceDay":"2026-05-17T00:00:00","checkInTime":"2026-05-17T19:38:34.715858... | yes | Request body: {} |

### HR_LEAVE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Leave | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"42047269-4493-4a07-15ae-08deb5184321","employeeId":"bfb61903-0fee-4c71-d5e2-08deb44b8def","leaveTypeId":"bc297a73-0158-44a6-222c-08deb51a1411","reason":"مرض مزمن ","fromDate":"2026-05-18T00... | yes |  |
| GET | /api/V1/Leave/employee-balances | Auth:Y Branch:Y | 400 | {"success":false,"data":null,"errors":["Employee not found."],"statusCode":400} | partial | Returns 400 "Employee not found" for the logged-in admin account, which has no linked Employee/HR record — likely correct given this admin user is not an HR employee. |
| POST | /api/V1/Leave | - | NOT_EXECUTED | not executed — needs valid leaveTypeId + date range against real employee balance; deferred to avoid consuming real leave balance | n/a |  |
| POST | /api/V1/Leave/{id}/approve | - | SKIPPED | SKIPPED (explicit: approve — out of scope) | n/a |  |
| POST | /api/V1/Leave/{id}/reject | - | SKIPPED | SKIPPED (explicit: reject — out of scope) | n/a |  |
| POST | /api/V1/Leave/{id}/cancel | - | SKIPPED | SKIPPED (explicit: cancel — out of scope) | n/a |  |
| GET | /api/V1/Leave/balance/4b41e214-ac11-4b4a-222b-08deb51a1411 | Auth:Y Branch:Y | 200 | {"success":false,"data":{"balance":0},"errors":null,"statusCode":200} | yes |  |

### HR_LEAVE_TYPE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/LeaveType | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"4b41e214-ac11-4b4a-222b-08deb51a1411","name":"اجازة مرضية ","defaultDaysPerYear":10,"isPaid":true,"allowCarryForward":false,"isActive":true},{"id":"bc297a73-0158-44a6-222c-08deb51a1411","na... | yes |  |
| GET | /api/V1/LeaveType/4b41e214-ac11-4b4a-222b-08deb51a1411 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"4b41e214-ac11-4b4a-222b-08deb51a1411","name":"اجازة مرضية ","defaultDaysPerYear":10,"isPaid":true,"allowCarryForward":false,"isActive":true},"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/LeaveType | Auth:Y Branch:Y | 400 | {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Name":["The Name field is required."]},"traceId":"00-7cfbda6e1b90ed613a154e5e5772c902... | yes | Correctly validates required Name field (single field, not nameAr/nameEn bilingual pair as guessed). Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","daysPerYear":1} |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### HR_PAYROLL

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Payroll | Auth:Y Branch:Y | 404 | {"success":false,"data":null,"errors":["Payroll not found"],"statusCode":404} | partial | Route exists; 404 "Payroll not found" likely because no query params (period) were supplied and no default/latest run exists. |
| GET | /api/V1/Payroll/export | Auth:Y Branch:Y | 500 |  | no | HTTP 500 with empty body — server error, needs investigation. |
| POST | /api/V1/Payroll/generate | Auth:Y Branch:Y | 500 |  | no | HTTP 500 with empty body when generating a payroll run for a future disposable period (Dec 2099) — server error, needs investigation. Request body: {"month":12,"year":2099} |
| POST | /api/V1/Payroll/{id}/approve | - | SKIPPED | SKIPPED (explicit: approve — out of scope) | n/a |  |
| POST | /api/V1/Payroll/close/{id} | - | SKIPPED | SKIPPED (explicit: close — out of scope) | n/a |  |

### HR_PERMISSION_REQUEST

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/PermissionRequest/GetAll | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"112470ab-b021-41d6-adb3-08deb5836e7c","employeeId":"c6c9ba22-b78b-4f33-a77f-08deabeea092","employeeName":"محمد","permissionDate":"2026-05-19T08:42:16.883","permissionType":1,"permissionNatu... | yes |  |
| POST | /api/V1/PermissionRequest/Create | - | NOT_EXECUTED | not executed — body schema (employeeId, date/time range, reason) unknown | n/a |  |
| POST | .../Approve/{id} | - | SKIPPED | SKIPPED (explicit: approve — out of scope) | n/a |  |
| POST | .../Reject/{id} | - | SKIPPED | SKIPPED (explicit: reject — out of scope) | n/a |  |

### HR_RESIGNATION_REQUEST

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/ResignationRequest/GetAll | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"8db51951-6497-4a82-dd47-08deb58683e6","employeeId":"bfb61903-0fee-4c71-d5e2-08deb44b8def","employeeName":"اسماء","resignationDate":"2026-05-19T08:37:11.114","endDate":"2026-05-22T08:37:11.1... | yes |  |
| POST | /api/V1/ResignationRequest/Create | - | NOT_EXECUTED | not executed — would create a real resignation request against an employee record; deferred out of caution | n/a |  |
| POST | .../Approve/{id} | - | SKIPPED | SKIPPED (explicit: approve — out of scope) | n/a |  |
| POST | .../Reject/{id} | - | SKIPPED | SKIPPED (explicit: reject — out of scope) | n/a |  |

### HR_CUSTODY_REQUEST

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/CustodyRequest/GetAll | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"77d92a7a-63f3-4e2d-00b1-08deb5a3eba1","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","details":"سوف يتم التوصيل","status":2,"items":[{"id":"b2bd75d8-055f-42c4-df80-08deb5a3eba5","custo... | yes |  |
| GET | /api/V1/CustodyRequest/Types | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"d4c9b145-bf9e-4e98-ba78-08deb59da96d","nameAr":"عهده عينيه","nameEn":"عهده عينيه"},{"id":"f29770e1-3a8f-4a68-ba79-08deb59da96d","nameAr":"عهده نقديه","nameEn":"عهده نقديه"},{"id":"13d1f291-... | yes |  |
| GET | /api/V1/CustodyRequest/Types/d4c9b145-bf9e-4e98-ba78-08deb59da96d | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"d4c9b145-bf9e-4e98-ba78-08deb59da96d","nameAr":"عهده عينيه","nameEn":"عهده عينيه"},"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/CustodyRequest/Types/Create | Auth:Y Branch:Y | 200 | {"success":true,"data":"تم إضافة نوع العهدة بنجاح","errors":null,"statusCode":200} | yes | Created disposable custody-request type successfully. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| POST | /api/V1/CustodyRequest/Create | - | NOT_EXECUTED | not executed — needs employeeId + custody type FK; deferred out of caution | n/a |  |
| POST | .../Approve/{id} | - | SKIPPED | SKIPPED (explicit: approve — out of scope) | n/a |  |
| POST | .../Reject/{id} | - | SKIPPED | SKIPPED (explicit: reject — out of scope) | n/a |  |

### DEPARTMENT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Lookup/Departments | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"81f711f4-9b12-40c7-42aa-08de9e50d4df","nameAr":"قسم الموارد البشرية","nameEn":"HR Department"},{"id":"16d236b6-085d-400f-0325-08deb44ae5d4","nameAr":"IT","nameEn":"IT"},{"id":"921661ff-aa69... | yes |  |
| POST | /api/V1/Department?nameAr=ZZ_APITEST_1783551551581&nameEn=ZZ_APITEST_1783551551581 | Auth:Y Branch:Y | 200 | {"success":true,"data":"Department created successfully","errors":null,"statusCode":200} | yes | Query-param based create (nameAr/nameEn) worked as documented in api.config.ts comment. |
| DELETE | /api/V1/Department/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### HR_ADMIN

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Admin/all-users | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"186caaf5-2338-4a5e-aafb-c611a01fcb3e","fullName":"Mohamed","email":"Shosha@gmail.com","phoneNumber":null,"branchId":null,"branchName":null,"roles":["Employee"]},{"id":"204c281b-8e18-4cb4-b0... | yes |  |
| GET | /api/V1/Admin/all-roles | Auth:Y Branch:Y | 200 | {"success":true,"data":["Employeee","Admin","Agent","SalesEmployee","FollowUpEmployee","AccountingEmployee","CustomerServiceEmployee","ComplaintEmployee","Owner","Employee","Supervisor","Driver","MobileCustomer"],"errors... | yes |  |
| GET | /api/V1/Admin/positions | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"3bfbbd30-5a6d-4773-afad-08deb3718dac","nameAr":"string","nameEn":"string"},{"id":"1919fc58-76c7-4e61-9ae7-08ded5093f70","nameAr":"????","nameEn":"Manager"}],"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/Admin/create-position | Auth:Y Branch:Y | 200 | {"success":true,"data":"Employee position created successfully","errors":null,"statusCode":200} | yes | Created disposable position successfully. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| POST | /api/V1/Admin/add-user | - | NOT_EXECUTED | not executed — overlaps with Auth/add-admin already tested; deferred to avoid duplicate disposable accounts | n/a |  |
| POST | /api/V1/Admin/assign-role | - | SKIPPED | SKIPPED (mutates a real user's role assignment — out of scope, not a create) | n/a |  |
| POST | /api/V1/Admin/remove-role | - | SKIPPED | SKIPPED (mutates a real user's role assignment — out of scope) | n/a |  |
| DELETE | /api/V1/Admin/delete-position/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### HOUSING

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/Housing/GetAll | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"492db919-6774-486a-75b8-08deac12ea74","name":"سكن الرياض","address":null,"capacity":15,"notes":null,"isActive":true,"workerHousingCost":2,"housingOperationPrice":30,"currentOccupan... | yes |  |
| GET | /api/Housing/GetActiveList | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"f3a2a83d-2c16-441d-5a27-08dea8754315","name":"سكن صاري","address":"المدينه","capacity":15,"notes":null,"isActive":true,"workerHousingCost":null,"housingOperationPrice":null,"currentOccupanc... | yes |  |
| POST | /api/Housing | Auth:Y Branch:Y | 400 | {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Name":["The Name field is required."]},"traceId":"00-27d2632af5d6edb7491c270f5001b135... | yes | Correctly validates required Name field (PascalCase) — rejected disposable body that used nameAr/nameEn. Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","capacity":1} |
| PUT | /api/Housing/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| POST | /api/Housing/ToggleActive/{id} | - | SKIPPED | SKIPPED (toggle — out of scope) | n/a |  |
| DELETE | /api/Housing/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### WORKER_STATUS_LOG

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| POST | /api/V1/Worker/StatusLog | - | SKIPPED | SKIPPED (would alter a real worker's status history — mutating lifecycle-adjacent, out of scope) | n/a |  |
| DELETE | /api/V1/Worker/{id}/StatusLog/Last | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/ActivateWantsWork | - | SKIPPED | SKIPPED (activate — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/ActivateWantsTransfer | - | SKIPPED | SKIPPED (activate — out of scope) | n/a |  |

### WORKER_MASTER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| POST | /api/V1/Worker/Housed | - | SKIPPED | SKIPPED (mutates real worker housing state — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/Deportation | - | SKIPPED | SKIPPED (explicit: deportation — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/CancelDeportation | - | SKIPPED | SKIPPED (deportation-related lifecycle — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/Handover | - | SKIPPED | SKIPPED (explicit: handover — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/IssueResidency | - | SKIPPED | SKIPPED (mutates real worker legal-status record — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/AddUpdate | - | SKIPPED | SKIPPED (mutates real worker record — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/ExitAndReEntry | - | SKIPPED | SKIPPED (mutates real worker legal-status record — out of scope) | n/a |  |
| POST | /api/V1/Worker/{id}/ExitHousing | - | SKIPPED | SKIPPED (mutates real worker housing state — out of scope) | n/a |  |

### ACCOUNT

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/account/full-tree-structure | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"11111111-1111-1111-1111-111111111111","code":"1","name":"Assets","isLeaf":false,"level":1,"children":[]},{"id":"22222222-2222-2222-2222-222222222222","code":"2","name":"Liabilities","isLeaf... | yes |  |
| GET | /api/V1/account/subtree/11111111-1111-1111-1111-111111111111 | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"11111111-0000-0000-0000-000000000001","code":"101","name":"Cash","isLeaf":true,"level":2,"children":[]},{"id":"11111111-0000-0000-0000-000000000002","code":"102","name":"Bank","isLeaf":true... | yes |  |
| GET | /api/V1/account/settings | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"11111111-1111-1111-1111-111111111111","code":"1","name":"Assets","incomeStatementSide":0,"profitLossSide":0,"isGroupedInTrialBalance":true},{"id":"11111111-0000-0000-0000-000000000... | yes |  |
| POST | /api/V1/account/create-account | Auth:Y Branch:Y | 400 | {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Code":["The Code field is required."],"Name":["The Name field is required."]},"traceI... | yes | Correctly validates required Code and Name fields (PascalCase) — rejected disposable body. Request body: {"parentId":"11111111-1111-1111-1111-111111111111","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| PUT | /api/V1/account/update-account/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| PUT | /api/V1/account/reporting/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | /api/V1/account/delete-account/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### RESTRICTION_TYPE

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/restrictiontype | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"00000000-0000-0000-0000-000000000001","name":"Manual Entry","nameAr":"قيد يدوي","accountingEvent":null,"isManual":true,"isActive":true,"defaultDebitAccountId":null,"defaultCreditAccountId":... | yes |  |
| GET | /api/V1/restrictiontype/00000000-0000-0000-0000-000000000001 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"00000000-0000-0000-0000-000000000001","name":"Manual Entry","nameAr":"قيد يدوي","accountingEvent":null,"isManual":true,"isActive":true,"defaultDebitAccountId":null,"defaultCreditAccountId":n... | yes |  |
| POST | /api/V1/restrictiontype | Auth:Y Branch:Y | 400 | {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Name":["The Name field is required."]},"traceId":"00-eb16c32ac83633134ebedf5a47bfe751... | yes | Correctly validates required Name field — note api.config.ts comment says this should return 501 Not Implemented, but live backend now returns a normal 400 validation error, suggesting the endpoint has since been implemented (comment is stale). Request body: {"nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"} |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### JOURNAL_ENTRIES

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/JournalEntries | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"def1ac82-a8cf-4dbf-7964-08dedcf34c1d","entryNumber":"JE-2026-0040","date":"2026-07-08T13:17:44.5130831","description":"Mediation contract revenue recognition","status":1,"source":1... | yes |  |
| GET | /api/V1/JournalEntries/def1ac82-a8cf-4dbf-7964-08dedcf34c1d | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"def1ac82-a8cf-4dbf-7964-08dedcf34c1d","entryNumber":"JE-2026-0040","date":"2026-07-08T13:17:44.5130831","description":"Mediation contract revenue recognition","status":1,"source":10,"referen... | yes |  |
| POST | /api/V1/JournalEntries | - | NOT_EXECUTED | not executed — manual double-entry requires two real leaf account ids with balanced debit=credit amounts; not confidently constructible without account-tree leaf inspection risk of malformed ledger draft | n/a |  |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### POSTING

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| POST | /api/V1/Posting/{journalId} | - | SKIPPED | SKIPPED (explicit: post/unpost — out of scope) | n/a |  |
| POST | /api/V1/Posting/{id}/unpost | - | SKIPPED | SKIPPED (explicit: post/unpost — out of scope) | n/a |  |

### LEDGER

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/Ledger/general-ledger?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 404 | {"success":false,"data":null,"errors":["Account not found"],"statusCode":404} | partial | Route exists (JSON error body, not blank 404): requires an accountId (or similar) query parameter beyond from/to — "Account not found" returned when omitted. |
| GET | /api/V1/Ledger/agent-ledger?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 400 | {"success":false,"data":null,"errors":["No entries found"],"statusCode":400} | yes | Route exists; correctly reports "No entries found" for the wide test date range with no matching agent-ledger postings. |
| GET | /api/V1/Ledger/customer-ledger?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 400 | {"success":false,"data":null,"errors":["No entries found"],"statusCode":400} | yes | Route exists; correctly reports "No entries found". |
| GET | /api/V1/Ledger/worker-ledger?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 400 | {"success":false,"data":null,"errors":["No entries found"],"statusCode":400} | yes | Route exists; correctly reports "No entries found". |
| GET | /api/V1/Ledger/trial-balance?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"totalDebit":127591.6,"totalCredit":127591.6,"totalOpeningDebit":0,"totalOpeningCredit":0,"totalClosingDebit":34489,"totalClosingCredit":34489,"isBalanced":true,"difference":0,"lines":[{"accountId... | yes |  |
| GET | /api/V1/Ledger/income-statement?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"from":"2020-01-01T00:00:00","to":"2030-01-01T00:00:00","revenue":{"sectionName":"Revenue","accountType":4,"total":15000,"lines":[{"accountId":"44444444-0000-0000-0000-000000000001","accountCode":... | yes |  |
| GET | /api/V1/Ledger/balance-sheet?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"totalAssets":0,"totalLiabilities":0,"totalEquity":0,"currentYearEarnings":0,"isBalanced":true,"difference":0,"assets":{"sectionName":"Assets","total":0,"lines":[{"accountId":"11111111-0000-0000-0... | yes |  |
| GET | /api/V1/Ledger/vat-report?from=2020-01-01&to=2030-01-01 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"year":0,"quarter":0,"periodStart":"2020-01-01T00:00:00","periodEnd":"2030-01-01T00:00:00","outputVat":4211.62,"inputVat":900,"netVatPayable":3311.62,"lines":[{"accountCode":"202","accountName":"V... | yes |  |

### HOURLY_WORKERS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyWorkers | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"6b676e62-cd8b-4ba4-9319-08ded2b5b945","fullName":"لولى","phoneNumber":"010123445678","nationalId":"14215433","hourlyRate":10,"availableFromTime":"12:29:03","availableToTime":"12:29... | yes |  |
| GET | /api/V1/HourlyWorkers/6b676e62-cd8b-4ba4-9319-08ded2b5b945 | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"6b676e62-cd8b-4ba4-9319-08ded2b5b945","fullName":"لولى","phoneNumber":"010123445678","nationalId":"14215433","hourlyRate":10,"availableFromTime":"12:29:03","availableToTime":"12:29:09","isAc... | yes |  |
| POST | /api/V1/HourlyWorkers | Auth:Y Branch:Y | 201 | {"success":true,"data":{"id":"4f731e9b-0fa4-41ba-325b-08dedd4492d3","fullName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000000","nationalId":"3551551581","hourlyRate":10,"availableFromTime":"08:00:00","availableToTi... | yes | Created and correctly echoed back a full disposable HourlyWorker record with all fields bound properly. Request body: {"fullName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000000","nationalId":"3551551581","hourlyRate":10,"availableFromTime":"08:00:00","availableToTime":"20:00:00","notes":"api test"} |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | .../{id}/Activate | - | SKIPPED | SKIPPED (activate — out of scope) | n/a |  |
| POST | .../{id}/Deactivate | - | SKIPPED | SKIPPED (deactivate — out of scope) | n/a |  |

### HOURLY_WORKER_REQUESTS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyWorkerRequests | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"125c2426-21ff-4462-8175-743dc697985d","ticketNumber":"TK-2026-000001","customerName":"string","customerPhone":"string","customerAddress":"string","requestDate":"2026-06-25T00:00:00... | yes |  |
| GET | /api/V1/HourlyWorkerRequests/125c2426-21ff-4462-8175-743dc697985d | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"125c2426-21ff-4462-8175-743dc697985d","ticketNumber":"TK-2026-000001","customerName":"string","customerPhone":"string","customerAddress":"string","requestDate":"2026-06-25T00:00:00","request... | yes |  |
| GET | /api/V1/HourlyWorkerRequests/125c2426-21ff-4462-8175-743dc697985d/Detail | Auth:Y Branch:Y | 200 | {"success":true,"data":{"transferProofUrl":null,"customerId":null,"packageId":null,"packageName":null,"servingAreaId":null,"serviceCity":null,"serviceDistrict":null,"internalNotes":null,"subTotal":0,"discountAmount":0,"t... | yes |  |
| GET | /api/V1/HourlyWorkerRequests/125c2426-21ff-4462-8175-743dc697985d/Timeline | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"4682f7cf-587c-4092-bedf-08ded7612c1a","eventType":13,"title":"Assignment status: En Route","description":"لولى","occurredAt":"2026-07-01T11:10:25.857119","createdBy":"d7b8ffad-dd86-4fd6-942... | yes |  |
| GET | /api/V1/HourlyWorkerRequests/125c2426-21ff-4462-8175-743dc697985d/Logs | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"4682f7cf-587c-4092-bedf-08ded7612c1a","action":"Assignment status: En Route","details":"لولى","performedBy":"d7b8ffad-dd86-4fd6-942c-71bf9ae3c2c4","occurredAt":"2026-07-01T11:10:25.857119"}... | yes |  |
| GET | /api/V1/HourlyWorkerRequests/125c2426-21ff-4462-8175-743dc697985d/Payments | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyWorkerRequests/125c2426-21ff-4462-8175-743dc697985d/Assignments | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"assignmentStatus":2,"assignmentStatusName":"En Route","confirmedAt":"2026-07-01T11:10:20.377308","notes":null,"id":"ff0c95f3-2b3c-4170-2677-08ded2b63f21","workerId":"9fbd865d-91df-4113-931b-08de... | yes |  |
| POST | .../125c2426-21ff-4462-8175-743dc697985d/InternalNotes | - | NOT_EXECUTED | deferred — would add a permanent note to a real request; borderline mutating, skipped out of caution | n/a |  |
| GET | /api/V1/HourlyWorkerRequests/Track/{ticketNumber} | - | NOT_EXECUTED | no real ticket number known/available | n/a |  |
| POST | .../Assignments/{id}/Status | - | SKIPPED | SKIPPED (status transition — out of scope) | n/a |  |
| DELETE | .../Assignments/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | .../{id}/Approve | - | SKIPPED | SKIPPED (explicit: approve — out of scope) | n/a |  |
| POST | .../{id}/Reject | - | SKIPPED | SKIPPED (explicit: reject — out of scope) | n/a |  |
| POST | .../{id}/Assign | - | SKIPPED | SKIPPED (lifecycle assign — out of scope) | n/a |  |
| POST | .../{id}/InProgress | - | SKIPPED | SKIPPED (status transition — out of scope) | n/a |  |
| POST | .../{id}/Complete | - | SKIPPED | SKIPPED (explicit: complete — out of scope) | n/a |  |
| POST | .../{id}/Cancel | - | SKIPPED | SKIPPED (explicit: cancel — out of scope) | n/a |  |

### HOURLY_WORKER_ORDERS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | .../{orderId}/... | - | NOT_EXECUTED | no order id available — module has no GET_ALL/list endpoint in inventory to discover order ids | n/a |  |
| GET | .../{orderId}/... | - | NOT_EXECUTED | no order id available — module has no GET_ALL/list endpoint in inventory to discover order ids | n/a |  |
| GET | .../{orderId}/... | - | NOT_EXECUTED | no order id available — module has no GET_ALL/list endpoint in inventory to discover order ids | n/a |  |
| GET | .../{orderId}/... | - | NOT_EXECUTED | no order id available — module has no GET_ALL/list endpoint in inventory to discover order ids | n/a |  |
| POST | .../{orderId}/... | - | NOT_EXECUTED | no order id available — no list endpoint in inventory | n/a |  |
| POST | .../{orderId}/... | - | NOT_EXECUTED | no order id available — no list endpoint in inventory | n/a |  |
| POST | .../{orderId}/... | - | NOT_EXECUTED | no order id available — no list endpoint in inventory | n/a |  |
| POST | .../{orderId}/... | - | NOT_EXECUTED | no order id available — no list endpoint in inventory | n/a |  |
| POST | .../{orderId}/... | - | NOT_EXECUTED | no order id available — no list endpoint in inventory | n/a |  |

### HOURLY_DRIVERS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyDrivers | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"90b64c9e-834b-4159-2476-08ded760e9ab","fullName":"محمود","phoneNumber":"+9662123432","nationalId":"342323454","licenseNumber":"4254","vehicleType":"لول","vehiclePlateNumber":"23443... | yes |  |
| GET | /api/V1/HourlyDrivers/90b64c9e-834b-4159-2476-08ded760e9ab | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"90b64c9e-834b-4159-2476-08ded760e9ab","fullName":"محمود","phoneNumber":"+9662123432","nationalId":"342323454","licenseNumber":"4254","vehicleType":"لول","vehiclePlateNumber":"234432","isActi... | yes |  |
| GET | /api/V1/HourlyDrivers/90b64c9e-834b-4159-2476-08ded760e9ab/Orders | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |
| POST | /api/V1/HourlyDrivers | Auth:Y Branch:Y | 201 | {"success":true,"data":{"id":"63b8f86f-4b7b-44c7-76d9-08dedd4493ed","fullName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000001","nationalId":"551551581","licenseNumber":"ZZTEST123","vehicleType":null,"vehiclePlateNu... | yes | Created and correctly echoed back a full disposable HourlyDriver record with all fields bound properly. Request body: {"fullName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000001","nationalId":"551551581","licenseNumber":"ZZTEST123"} |
| PUT | .../{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| POST | .../{id}/Activate | - | SKIPPED | SKIPPED (activate — out of scope) | n/a |  |
| POST | .../{id}/Deactivate | - | SKIPPED | SKIPPED (deactivate — out of scope) | n/a |  |
| POST | .../{driverId}/Orders/{orderId}/TransportStatus | - | NOT_EXECUTED | no order id available | n/a |  |

### HOURLY_CATALOG

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyCatalog/Packages | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"id":"dc69f4a4-abcb-444d-5df3-08ded760fbec","code":"21","nameAr":"اسبوع","nameEn":"week","durationHours":2,"numberOfWorkers":1,"basePrice":12,"isActive":true}],"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyCatalog/ServingAreas | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyCatalog/Admin/Packages | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"dc69f4a4-abcb-444d-5df3-08ded760fbec","code":"21","nameAr":"اسبوع","nameEn":"week","durationHours":2,"numberOfWorkers":1,"basePrice":12,"isActive":true}],"totalCount":1,"pageNumber... | yes |  |
| GET | /api/V1/HourlyCatalog/Admin/Packages/dc69f4a4-abcb-444d-5df3-08ded760fbec | Auth:Y Branch:Y | 200 | {"success":true,"data":{"id":"dc69f4a4-abcb-444d-5df3-08ded760fbec","code":"21","nameAr":"اسبوع","nameEn":"week","durationHours":2,"numberOfWorkers":1,"basePrice":12,"isActive":true},"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyCatalog/Admin/ServingAreas | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":0},"errors":null,"statusCode":200} | yes |  |
| GET | .../Admin/ServingAreas/{id} | - | NOT_EXECUTED | no id available | n/a |  |
| - | - | - | NOT_EXECUTED | no CREATE endpoint defined for packages/serving-areas in api.config.ts (admin endpoints only expose GET/UPDATE/DELETE) | n/a |  |
| PUT | .../Admin/Packages/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../Admin/Packages/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |
| PUT | .../Admin/ServingAreas/{id} | - | SKIPPED | SKIPPED (update — out of scope) | n/a |  |
| DELETE | .../Admin/ServingAreas/{id} | - | SKIPPED | SKIPPED (delete — out of scope) | n/a |  |

### HOURLY_ORDER_PAYMENTS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyOrderPayments | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":0},"errors":null,"statusCode":200} | yes |  |
| POST | .../{id}/Refund | - | SKIPPED | SKIPPED (explicit: refund — out of scope) | n/a |  |

### HOURLY_ORDER_NOTIFICATIONS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyOrderNotifications | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[{"id":"67f0d62f-471d-4cec-186b-08ded6778d8a","orderId":"436b1de2-c766-43ad-b5ca-4898a28a20b3","event":"HourlyOrderCreated","channel":0,"recipientPhone":"0500000001","deliveryStatus":3,"se... | yes |  |
| POST | .../{id}/Retry | - | NOT_EXECUTED | not executed — retry re-sends a real notification (SMS/push) to an end-user; deferred out of caution to avoid spamming a real recipient | n/a |  |

### HOURLY_REPORTS

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyWorkerReports/OrdersSummary | Auth:Y Branch:Y | 200 | {"success":true,"data":{"totalOrders":5,"pendingOrders":0,"approvedOrders":0,"assignedOrders":0,"inProgressOrders":0,"completedOrders":3,"cancelledOrders":1,"rejectedOrders":1,"totalRevenue":0,"paidRevenue":0},"errors":n... | yes |  |
| GET | /api/V1/HourlyWorkerReports/Revenue | Auth:Y Branch:Y | 200 | {"success":true,"data":{"totalCollected":0,"totalRefunded":0,"netRevenue":0,"completedPayments":0,"pendingPayments":0,"failedPayments":0},"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyWorkerReports/WorkerUtilization | Auth:Y Branch:Y | 200 | {"success":true,"data":[{"workerId":"9fbd865d-91df-4113-931b-08ded2b5b945","workerName":"لولى","totalAssignments":4,"completedAssignments":0,"activeAssignments":2,"utilizationRate":0}],"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyWorkerReports/DriverPerformance | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |

### HOURLY_WORKER_PORTAL

| Method | Endpoint | Headers | Status | Result Summary | Correct? | Notes |
|---|---|---|---|---|---|---|
| GET | /api/V1/HourlyWorkerPortal/6b676e62-cd8b-4ba4-9319-08ded2b5b945/Assignments | Auth:Y Branch:Y | 200 | {"success":true,"data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":0},"errors":null,"statusCode":200} | yes |  |
| GET | /api/V1/HourlyWorkerPortal/6b676e62-cd8b-4ba4-9319-08ded2b5b945/Schedule | Auth:Y Branch:Y | 200 | {"success":true,"data":[],"errors":null,"statusCode":200} | yes |  |
| POST | .../{workerId}/Assignments/{id}/Status | - | SKIPPED | SKIPPED (status transition — out of scope) | n/a |  |

## 4. Required Fixes (most severe first)

1. **[CRITICAL — Security] Authorization is not enforced on the majority of read endpoints.** Confirmed on Customer, Worker, Branch, Nationality, Agent, Marketer, Complaint, MediationContract, ReceiptVoucher, HourlyDrivers, HourlyWorkers, RestrictionType, TransferContract, Account tree, and JournalEntries — all return 200 with full live data given no Authorization header or an invalid/garbage bearer token. Only the HR module (Employee, Leave) correctly returns 401. This exposes customer/worker PII and financial ledger data to anyone with the base URL. **Fix:** apply the `[Authorize]` attribute (or equivalent global auth filter) consistently across all controllers; add an integration test asserting 401 on every authenticated route without a token.

2. **[HIGH — Security/Design] `X-Branch-Id` is accepted but never enforced.** Confirmed on Branch, Customer, Worker, HourlyWorkers (and previously known for Branch). If branch-scoped data isolation is an intended security/business boundary, it currently does nothing — any authenticated (or unauthenticated, per #1) caller sees all branches' data regardless of the header. **Fix:** either enforce it server-side (filter query results by the header/claim) or remove it from the contract if branch scoping is meant to be client-side only.

3. **[HIGH — Bug] HR Payroll module is broken.** `GET /api/V1/Payroll/export` and `POST /api/V1/Payroll/generate` both return **HTTP 500** with an empty body. `GET /api/V1/Payroll` returns 404 "Payroll not found" with no way (from api.config.ts) to know what query parameters it expects. **Fix:** investigate server exceptions on export/generate; document required query params for GET.

4. **[MEDIUM — Dead/legacy routes] Several modules referenced in `api.config.ts` return blank 404s (route does not exist) on the live backend, not app-level "not found" JSON:**
   - `DOCUMENT` — `GET /api/Document/GetAllDocument`
   - `ROLES` — `GET /api/Roles/GetAllRoles`, `POST /api/Roles/Create`
   - `USERS` — `GET /api/Users/GetAllUsers`
   - `RECRUITMENT_REQUEST` — `GET /api/RecruitmentRequest`
   - `CONTRACT_CREATION_REQUIREMENTS` (legacy) — `GET /api/ContractCreationRequirements`, `GET /api/ContractCreationRequirements/GetRequirement`
   - `NATIONALITY_FOLLOWUP` (legacy) — `GET /api/Nationality/GetAllNationalityFollowUpStatus`, `GET /api/Nationality/GetNationalityFollowUpStatus/{id}`

   The legacy `CONTRACT_CREATION_REQUIREMENTS` and `NATIONALITY_FOLLOWUP` groups each have a live, working replacement elsewhere in the config (`CONTRACT_CREATION_REQUIREMENT` under `/api/FollowUp/...` and `NATIONALITY_FOLLOWUP_CONFIG` under `/api/FollowUp/...`, both confirmed working). **Fix:** either these are genuinely removed backend features (frontend should stop referencing them / remove dead code and any UI built on them), or they were never deployed — confirm with backend team and delete the dead `api.config.ts` entries plus any frontend pages/services depending on them.

5. **[MEDIUM — Bug] Inconsistent field-name binding allows blank-named records to be created silently.** `POST /api/V1/Agent` and `POST /api/V1/Nationality` both returned 200/201 success for a disposable test body using `nameAr`/`nameEn`, but the created record's actual name fields (`agentNameAr`/`agentNameEn`, `nationalityNameAr`/`nationalityNameEn`) came back **null** — the body didn't bind, and no server-side validation caught the missing required name. By contrast, `Customer`, `Housing`, `Account`, `RestrictionType`, and `LeaveType` create endpoints correctly return 400 with clear "field required" errors (in PascalCase: `Name`, `Phones`, `Nationality`, `Code`) when required fields are missing/misnamed. **Fix:** (a) add required-field validation to Agent/Nationality create so malformed bodies are rejected instead of silently creating blank records; (b) standardize on one casing convention for request bodies (currently a mix of camelCase and PascalCase across modules) and document it; (c) manually clean up the two blank test records this run created (Agent id `021a68ae-599e-4731-a5a7-08dedd448ab0`, Nationality id `d171205b-e017-42e8-4815-08dedd448c0e`).

6. **[LOW] `GET /api/TransferContract/{id}/authority-status` returns 405 Method Not Allowed.** The route exists but does not accept GET — either the api.config.ts accessor is wrong (should be POST, or a different path) or the backend route registration is incomplete. **Fix:** confirm intended HTTP verb with backend and correct the frontend config if needed.

7. **[LOW — Cleanup] Disposable test records were created during this run and cannot be deleted via the API within the approved scope** (no delete permitted). They should be cleaned up manually or via direct DB access:
   - Admin user: `zz.apitest.<timestamp>@example.com` (via `Auth/add-admin`)
   - Agent id `021a68ae-599e-4731-a5a7-08dedd448ab0` (blank name)
   - Nationality id `d171205b-e017-42e8-4815-08dedd448c0e` (blank name)
   - Job `ZZ_APITEST_<timestamp>`, Marketer `ZZ_APITEST_<timestamp>` (message-only response, id unknown)
   - FollowUpStatus id `1c618abe-f388-4c17-79ad-08dedd448eb0` (`ZZ_APITEST_<timestamp>`)
   - HourlyWorkers id `4f731e9b-0fa4-41ba-325b-08dedd4492d3`, HourlyDrivers id `63b8f86f-4b7b-44c7-76d9-08dedd4493ed`
   - Department `ZZ_APITEST_<timestamp>`, Employee position `ZZ_APITEST_<timestamp>`, CustodyRequest type `ZZ_APITEST_<timestamp>` (message-only responses, ids unknown)

8. **[INFO] Legacy `RESTRICTION_TYPE` create comment is stale.** `api.config.ts` comments that `POST /api/V1/restrictiontype` "currently returns 501 Not Implemented server-side" — live testing shows it now returns a normal 400 validation error (required `Name` field), meaning the endpoint has since been implemented. Comment should be updated/removed.

9. **[INFO] A meaningful number of endpoints could not be exercised** (54 NOT EXECUTED) because their POST body schemas involve multiple foreign keys/complex domain objects not safely guessable (e.g. Worker, Complaint, Mediation/Employment contracts, all Accounting documents, Journal Entries, HR Leave/Custody/Resignation/Permission requests). Recommend a follow-up pass with either backend Swagger/OpenAPI access or sample payloads supplied by the backend team to raise coverage on creates.

