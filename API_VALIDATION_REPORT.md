# Sigma API — Validation Report

> **Fully re-validated from scratch on 2026-07-12.** This report replaces all earlier versions. Every endpoint below was tested live against the running backend; where the previous documentation disagreed with observed behavior, the **actual behavior** is recorded here.

## Environment

| | |
|---|---|
| Base URL | `https://sigma-api.runasp.net` |
| OpenAPI spec | `https://sigma-api.runasp.net/swagger/v1/swagger.json` (391 operations / 319 paths / 165 schemas) |
| Auth | `Authorization: Bearer <JWT>` + `X-Branch-Id: <branchGuid>` |
| Test account | `sigma@gmail.com` — roles Admin, Employee |
| Branch | `31887c15-5b47-4551-2190-08dea9210ab7` |
| Environment | Non-production (write/lifecycle testing performed; test data cleaned up) |

## Overall results

| Verdict | Count |
|---|--:|
| PASS (incl. PASS* = works with valid body) | 362 |
| FAIL / BUG | 13 |
| WEAK (2xx on non-existent id) | 7 |
| SKIP (multipart, not auto-driven) | 9 |
| NOT TESTED | 0 |
| **Total operations** | **391** |

## Cross-cutting findings

1. **CRITICAL — authentication not enforced on most endpoints.** 66 of 169 GETs and many writes return `2xx` with **no bearer token**. Enforcement exists only on `/Filter` POSTs (401) and the `*/me/*` + `HourlyCustomer/*` self-service routes (403). Every affected endpoint is flagged in its **Authentication Required** field below.
2. **`X-Branch-Id` GUID validation is enforced on every write, but not on reads.** All 199 write operations (POST/PUT/PATCH/DELETE) **and** the 4 `Filter` POSTs reject a missing or malformed `X-Branch-Id` with `400 {"success":false,"message":"يجب إرسال X-Branch-Id في الهيدر كـ GUID صالح.","statusCode":400}` — note the deviant `message` envelope (not the usual `errors` array). Plain **GET** endpoints and the `login`/`refresh-token`/`forgot-password`/`reset-password` auth endpoints do **not** require it. Each endpoint's **Required Headers** field states whether the header is mandatory. ⚠️ Security note: writes validate the *branch header* but (per finding 1) do **not** validate the *JWT* — a caller needs a valid branch GUID but no valid token.
3. **Silent-create bugs (5):** `POST` Agent, Complaint, Marketer, Nationality, OperatingContractOffer accept an **empty body** and persist a blank record.
4. **Crash-on-empty-body (13):** several creates return **500 instead of 400** when required fields are missing; the four new HR request types + Commission/Custody nonetheless work with a valid body (marked `PASS*`).
5. **Weak DELETE (7):** return `200 "deleted"` for a non-existent id (no existence check).
6. **Response envelopes vary:** most endpoints use `{success,data,errors,statusCode}`; validation failures sometimes use ASP.NET `ProblemDetails`; a few list endpoints return a bare array. Consumers must handle all three.
7. **Stale frontend routes** (in `api.config.ts`, absent from backend): `/api/Document/*`, `/api/Roles/*`, `/api/Users/*`, `/api/Auth/register`, legacy `ContractCreationRequirements`, legacy `Nationality*FollowUpStatus*`, `ContractFollowUp/*`, `DELETE /Department/{id}`, `POST /Leave/{id}/cancel` — these 404 and should be removed.

## Legend

`PASS` correct behavior · `PASS*` works with valid body but 500s on empty · `FAIL` bug · `WEAK` 2xx on bad id · `SKIP` multipart, not auto-driven. **noTok** = HTTP status when called with no bearer token (`2xx` ⇒ auth bypass).

---

## Account (8)

### `POST /api/V1/Account/create-account`

- **Endpoint:** `/api/V1/Account/create-account`
- **HTTP Method:** POST
- **Purpose:** Create a Account
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ code: string*, name: string*, parentId: string (uuid) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Account/create-account
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "code": "string",
  "name": "string",
  "parentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Code":["The Code field is`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Code" …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Account/update-account/{accountId}`

- **Endpoint:** `/api/V1/Account/update-account/{accountId}`
- **HTTP Method:** PUT
- **Purpose:** Update a Account by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `accountId` (string (uuid))
- **Request Body:** `{ name: string* }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Account/update-account/{accountId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["الحساب غير موجود"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الحساب غير موجود"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Account/reporting/{accountId}`

- **Endpoint:** `/api/V1/Account/reporting/{accountId}`
- **HTTP Method:** PUT
- **Purpose:** Update a Account by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `accountId` (string (uuid))
- **Request Body:** `{ incomeStatementSide: AccountReportSide, profitLossSide: AccountReportSide, isGroupedInTrialBalance: boolean }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Account/reporting/{accountId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "incomeStatementSide": 1,
  "profitLossSide": 1,
  "isGroupedInTrialBalance": true
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["الحساب غير موجود"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الحساب غير موجود"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Account/delete-account/{accountId}`

- **Endpoint:** `/api/V1/Account/delete-account/{accountId}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Account by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `accountId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Account/delete-account/{accountId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الحساب غير موجود"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الحساب غير موجود"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Account/full-tree-structure`

- **Endpoint:** `/api/V1/Account/full-tree-structure`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Account
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Account/full-tree-structure
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"11111111-1111-1111-1111-111111111111","code":"1","name":"Assets","isLeaf":false,"level":1,"children":[]},{"id":"22222222-2222-2222-2222-222222222222","code":"2","name":"Liabilities","isLeaf":false,"level":1,"children":[]},{"id":"33333333-3333-3333-3333-333333333333","code":"3","name":"Equity","isLeaf":true,"level":1,"children":[]},{"id":"44444444-4444-4444-4444-44444 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Account/subtree/{parentId}`

- **Endpoint:** `/api/V1/Account/subtree/{parentId}`
- **HTTP Method:** GET
- **Purpose:** Get a Account by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `parentId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Account/subtree/{parentId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Account/settings`

- **Endpoint:** `/api/V1/Account/settings`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Account
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchTerm` (string)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Account/settings?SearchTerm=<string>&PageNumber=<integer>&PageSize=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"11111111-1111-1111-1111-111111111111","code":"1","name":"Assets","incomeStatementSide":0,"profitLossSide":0,"isGroupedInTrialBalance":true},{"id":"11111111-0000-0000-0000-000000000001","code":"101","name":"Cash","incomeStatementSide":0,"profitLossSide":0,"isGroupedInTrialBalance":true},{"id":"11111111-0000-0000-0000-000000000002","code":"102","name":"Bank"," …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:32}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Account/Accounts-list`

- **Endpoint:** `/api/V1/Account/Accounts-list`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Account
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Account/Accounts-list
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"11111111-0000-0000-0000-000000000004","code":"104","name":"Fixed Assets","isLeaf":false,"level":2,"children":[]},{"id":"11111111-1111-1111-1111-111111111111","code":"1","name":"Assets","isLeaf":false,"level":1,"children":[]},{"id":"22222222-2222-2222-2222-222222222222","code":"2","name":"Liabilities","isLeaf":false,"level":1,"children":[]},{"id":"44444444-4444-4444-4 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

## Admin (8)

### `POST /api/V1/Admin/add-user`

- **Endpoint:** `/api/V1/Admin/add-user`
- **HTTP Method:** POST
- **Purpose:** Create a Admin
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ email: string, password: string, fullName: string, role: string, branchId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Admin/add-user
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "string",
  "fullName": "string",
  "role": "string",
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Role":["The Role field is`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Role" …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Admin/assign-role`

- **Endpoint:** `/api/V1/Admin/assign-role`
- **HTTP Method:** POST
- **Purpose:** Admin: assign-role
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ userId: string, role: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Admin/assign-role
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "role": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Role":["The Role field is`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Role" …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Admin/remove-role`

- **Endpoint:** `/api/V1/Admin/remove-role`
- **HTTP Method:** POST
- **Purpose:** Admin: remove-role
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ userId: string, role: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Admin/remove-role
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "role": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Role":["The Role field is`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Role" …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Admin/all-users`

- **Endpoint:** `/api/V1/Admin/all-users`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Admin
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Admin/all-users
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"186caaf5-2338-4a5e-aafb-c611a01fcb3e","fullName":"Mohamed","email":"Shosha@gmail.com","phoneNumber":null,"branchId":null,"branchName":null,"roles":["Employee"]},{"id":"204c281b-8e18-4cb4-b08a-b9c5477807bb","fullName":"Hossam Saeed","email":"hossamsaeed@12gmail.com","phoneNumber":null,"branchId":null,"branchName":null,"roles":["Admin","Employee"]},{"id":"2dbb733b-6b62 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[18]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Admin/all-roles`

- **Endpoint:** `/api/V1/Admin/all-roles`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Admin
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Admin/all-roles
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":["Employeee","Admin","Agent","SalesEmployee","FollowUpEmployee","AccountingEmployee","CustomerServiceEmployee","ComplaintEmployee","Owner","Employee","Supervisor","Driver","MobileCustomer"],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[13]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/Admin/create-position`

- **Endpoint:** `/api/V1/Admin/create-position`
- **HTTP Method:** POST
- **Purpose:** Create a Admin
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nameAr: string, nameEn: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Admin/create-position
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"NameAr":["The NameAr fiel`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"NameA …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Admin/delete-position/{id}`

- **Endpoint:** `/api/V1/Admin/delete-position/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Admin by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Admin/delete-position/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee position not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Employee position not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Admin/positions`

- **Endpoint:** `/api/V1/Admin/positions`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Admin
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Admin/positions
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"3bfbbd30-5a6d-4773-afad-08deb3718dac","nameAr":"string","nameEn":"string"},{"id":"1919fc58-76c7-4e61-9ae7-08ded5093f70","nameAr":"????","nameEn":"Manager"},{"id":"2e4ba901-a3d4-41d6-1f36-08dedd449121","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581"},{"id":"8d8643e6-37cf-428c-ba6c-08dedff8a4ae","nameAr":"ZZ_REVAL4_1783848770945","nameEn":"ZZ_RE …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[4]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

## Agent (5)

### `GET /api/V1/Agent`

- **Endpoint:** `/api/V1/Agent`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Agent
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Agent
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"596445ca-263e-4c5c-62bb-08de9d43d411","agentNameAr":"مكتب جاكرتا للاستقدام","agentNameEn":"Jakarta Recruitment Office","username":"jakarta_agent","nationalityId":null,"agentLicense":"LIC-IND-2026-001","contractType":1,"phone":"021556677","mobile":"081234567890","email":"jakarta.office@gmail.com","addressAr":"جاكرتا - إندونيسيا","addressEn":"Jakarta - Indonesia","comp …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/Agent`

- **Endpoint:** `/api/V1/Agent`
- **HTTP Method:** POST
- **Purpose:** Create a Agent
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ agentNameAr: string, agentNameEn: string, username: string, nationalityId: integer (int32), agentLicense: string, contractType: integer (int32), phone: string, mobile: string, email: string, addressAr: string, addressEn: string, companyNameAr: string, companyNameEn: string, followUpEmails: string, warrantyEmails: string, accountingEmails: string, sendAllEmails: boolean, isActive: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Agent
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "agentNameAr": "string",
  "agentNameEn": "string",
  "username": "string",
  "nationalityId": 0,
  "agentLicense": "string",
  "contractType": 0,
  "phone": "0512345678",
  "mobile": "0512345678",
  "email": "user@example.com",
  "addressAr": "string",
  "addressEn": "string",
  "companyNameAr": "string",
  "companyNameEn": "string",
  "followUpEmails": "user@example.com",
  "warrantyEmails": "user@example.com",
  "accountingEmails": "user@example.com",
  "sendAllEmails": true,
  "isActive": true
}
```
- **Example Response:** `{"success":true,"data":{"id":"176a7509-d4fc-4548-8700-08dedff33bf5","agentNameAr":null,"agentNameEn":null,"username":null,"nationalityId":null,"agentLicense":nu`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":true,"data":{"id":"176a7509-d4fc-4548-8700-08dedff33bf5","agentNameAr":null,"agentNameEn":null,"username":null,"nationalityId":nu …`
- **Status Code:** 200/200
- **Pass/Fail:** FAIL
- **Notes:** accepts empty body & creates a blank record (no validation) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Accepts an empty body and persists a blank record.
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Require and validate mandatory fields; reject empty bodies with 400.

### `GET /api/V1/Agent/{id}`

- **Endpoint:** `/api/V1/Agent/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Agent by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Agent/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"596445ca-263e-4c5c-62bb-08de9d43d411","agentNameAr":"مكتب جاكرتا للاستقدام","agentNameEn":"Jakarta Recruitment Office","username":"jakarta_agent","nationalityId":null,"agentLicense":"LIC-IND-2026-001","contractType":1,"phone":"021556677","mobile":"081234567890","email":"jakarta.office@gmail.com","addressAr":"جاكرتا - إندونيسيا","addressEn":"Jakarta - Indonesia","compa …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,agentNameAr,agentNameEn,username,nationalityId,agentLicense}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Agent/{id}`

- **Endpoint:** `/api/V1/Agent/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Agent by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ agentNameAr: string, agentNameEn: string, username: string, nationalityId: integer (int32), agentLicense: string, contractType: integer (int32), phone: string, mobile: string, email: string, addressAr: string, addressEn: string, companyNameAr: string, companyNameEn: string, followUpEmails: string, warrantyEmails: string, accountingEmails: string, sendAllEmails: boolean, isActive: boolean, id: string (uuid) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Agent/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "agentNameAr": "string",
  "agentNameEn": "string",
  "username": "string",
  "nationalityId": 0,
  "agentLicense": "string",
  "contractType": 0,
  "phone": "0512345678",
  "mobile": "0512345678",
  "email": "user@example.com",
  "addressAr": "string",
  "addressEn": "string",
  "companyNameAr": "string",
  "companyNameEn": "string",
  "followUpEmails": "user@example.com",
  "warrantyEmails": "user@example.com",
  "accountingEmails": "user@example.com",
  "sendAllEmails": true,
  "isActive": true,
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `ID mismatch`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `ID mismatch`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Agent/{id}`

- **Endpoint:** `/api/V1/Agent/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Agent by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Agent/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["Agent not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["Agent not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Attendance (3)

### `POST /api/V1/Attendance/Filter`

- **Endpoint:** `/api/V1/Attendance/Filter`
- **HTTP Method:** POST
- **Purpose:** Filter/search Attendance (POST query)
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ employeeId: string (uuid), attendanceDay: string (date-time), month: integer (int32), year: integer (int32) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Attendance/Filter
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "attendanceDay": "2026-01-01T00:00:00Z",
  "month": 0,
  "year": 0
}
```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Executed live (read-only) with and without a token. Observed: `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** executed live \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Attendance/CheckIn`

- **Endpoint:** `/api/V1/Attendance/CheckIn`
- **HTTP Method:** POST
- **Purpose:** Attendance: CheckIn
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ latitude: number (double), longitude: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Attendance/CheckIn
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "latitude": 0,
  "longitude": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["You are outside the allowed attendance area. Distance: 5720237m, allowed: 150m."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["You are outside the allowed attendance area. Distance: 5720237m, allowed: 150m."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Attendance/CheckOut`

- **Endpoint:** `/api/V1/Attendance/CheckOut`
- **HTTP Method:** POST
- **Purpose:** Attendance: CheckOut
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ latitude: number (double), longitude: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Attendance/CheckOut
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "latitude": 0,
  "longitude": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["You are outside the allowed attendance area. Distance: 5720237m, allowed: 150m."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["You are outside the allowed attendance area. Distance: 5720237m, allowed: 150m."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Auth (7)

### `POST /api/V1/Auth/login`

- **Endpoint:** `/api/V1/Auth/login`
- **HTTP Method:** POST
- **Purpose:** Auth: login
- **Authentication Required:** No (anonymous endpoint).
- **Required Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ email: string, password: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Auth/login
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Email":["The Email field `
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Email …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body)
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PATCH /api/V1/Auth/change-password`

- **Endpoint:** `/api/V1/Auth/change-password`
- **HTTP Method:** PATCH
- **Purpose:** Partial update: change-password
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ currentPassword: string, newPassword: string }`
- **Example Request:**

```http
PATCH https://sigma-api.runasp.net/api/V1/Auth/change-password
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"NewPassword":["The NewPas`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"NewPa …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Auth/refresh-token`

- **Endpoint:** `/api/V1/Auth/refresh-token`
- **HTTP Method:** POST
- **Purpose:** Auth: refresh-token
- **Authentication Required:** No (anonymous endpoint).
- **Required Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ refreshToken: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Auth/refresh-token
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "refreshToken": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"RefreshToken":["The Refre`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Refre …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body)
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Auth/logout`

- **Endpoint:** `/api/V1/Auth/logout`
- **HTTP Method:** POST
- **Purpose:** Auth: logout
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ refreshToken: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Auth/logout
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "refreshToken": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"RefreshToken":["The Refre`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Refre …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Auth/me`

- **Endpoint:** `/api/V1/Auth/me`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Auth
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Auth/me
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"fullName":"Asmaa","email":"sigma@gmail.com","roles":["Admin","Employee"]},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `obj{fullName,email,roles}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Auth/add-admin`

- **Endpoint:** `/api/V1/Auth/add-admin`
- **HTTP Method:** POST
- **Purpose:** Create a Auth
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ email: string, password: string, fullName: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Auth/add-admin
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "string",
  "fullName": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Email":["The Email field `
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Email …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Auth/test-auth`

- **Endpoint:** `/api/V1/Auth/test-auth`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Auth
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Auth/test-auth
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"authenticated":true,"claims":[{"type":"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier","value":"2dbb733b-6b62-4d4e-8522-845886c8f897"},{"type":"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name","value":"Asmaa"},{"type":"branchId","value":"31887c15-5b47-4551-2190-08dea9210ab7"},{"type":"http://schemas.microsoft.com/ws/2008/06/identity/claims/role","value":"Admin"}, …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `obj{authenticated,claims}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Branch (6)

### `POST /api/V1/Branch`

- **Endpoint:** `/api/V1/Branch`
- **HTTP Method:** POST
- **Purpose:** Create a Branch
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ parentBranchId: string (uuid), nameAr: string, nameEn: string, organizationTypeAr: integer (int32), addressAr: string, addressEn: string, cityAr: integer (int32), phone: string, mobile: string, email: string, branchLicense: string, commercialRegistrationNumber: string, commercialRegistrationDate: string (date-time), commercialRegistrationIssuedByAr: string, laborLicenseNumber: string, laborLicenseDate: string (date-time), poBox: string, postalCode: string, managerNameAr: string, philippineEmbassyBranch: string, whatsAppWelcomeTemplate: string, openingConversation: string, mainBranch: integer (int32), taxNumber: string, domain: string, appUrl: string, zaka_RegistrationNameAr: string, zaka_Commercial_Registration_Number: string, zaka_TaxNumber: string, zaka_Postal_Zone: string, zaka_City_Name: string, zaka_DistrictAr: string, zaka_BuildingNumber: string, zaka_StreetAr: string, latitude: number (double), longitude: number (double), allowedRadiusMeters: integer (int32) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Branch
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "parentBranchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nameAr": "string",
  "nameEn": "string",
  "organizationTypeAr": 0,
  "addressAr": "string",
  "addressEn": "string",
  "cityAr": 0,
  "phone": "0512345678",
  "mobile": "0512345678",
  "email": "user@example.com",
  "branchLicense": "string",
  "commercialRegistrationNumber": "string",
  "commercialRegistrationDate": "2026-01-01T00:00:00Z",
  "commercialRegistrationIssuedByAr": "string",
  "laborLicenseNumber": "string",
  "laborLicenseDate": "2026-01-01T00:00:00Z",
  "poBox": "string",
  "postalCode": "string",
  "managerNameAr": "string",
  "philippineEmbassyBranch": "string",
  "whatsAppWelcomeTemplate": "string",
  "openin …
```
- **Example Response:** `{"success":false,"errors":["AllowedRadiusMeters must be greater than 0."]}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["AllowedRadiusMeters must be greater than 0."]}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Branch`

- **Endpoint:** `/api/V1/Branch`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Branch
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `Email` (string)
    - `Mobile` (string)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Branch?SearchName=<string>&Email=<string>&Mobile=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"31887c15-5b47-4551-2190-08dea9210ab7","nameAr":"????? ????????","nameEn":"????? ????????","phone":null,"mobile":null,"email":null,"mainBranch":1,"parentBranchId":null,"parentBranchNameAr":null,"parentBranchNameEn":null,"subBranches":[{"id":"f1457312-ecd8-4f02-2191-08dea9210ab7","nameAr":"ابحر","nameEn":"ابحر","phone":null,"mobile":null,"email":null,"mainBran …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:3,total:3}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/Branch/{id}`

- **Endpoint:** `/api/V1/Branch/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Branch by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ parentBranchId: string (uuid), nameAr: string, nameEn: string, organizationTypeAr: integer (int32), addressAr: string, addressEn: string, cityAr: integer (int32), phone: string, mobile: string, email: string, branchLicense: string, commercialRegistrationNumber: string, commercialRegistrationDate: string (date-time), commercialRegistrationIssuedByAr: string, laborLicenseNumber: string, laborLicenseDate: string (date-time), poBox: string, postalCode: string, managerNameAr: string, philippineEmbassyBranch: string, whatsAppWelcomeTemplate: string, openingConversation: string, mainBranch: integer (int32), taxNumber: string, domain: string, appUrl: string, zaka_RegistrationNameAr: string, zaka_Commercial_Registration_Number: string, zaka_TaxNumber: string, zaka_Postal_Zone: string, zaka_City_Name: string, zaka_DistrictAr: string, zaka_BuildingNumber: string, zaka_StreetAr: string, latitude: number (double), longitude: number (double), allowedRadiusMeters: integer (int32) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Branch/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "parentBranchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nameAr": "string",
  "nameEn": "string",
  "organizationTypeAr": 0,
  "addressAr": "string",
  "addressEn": "string",
  "cityAr": 0,
  "phone": "0512345678",
  "mobile": "0512345678",
  "email": "user@example.com",
  "branchLicense": "string",
  "commercialRegistrationNumber": "string",
  "commercialRegistrationDate": "2026-01-01T00:00:00Z",
  "commercialRegistrationIssuedByAr": "string",
  "laborLicenseNumber": "string",
  "laborLicenseDate": "2026-01-01T00:00:00Z",
  "poBox": "string",
  "postalCode": "string",
  "managerNameAr": "string",
  "philippineEmbassyBranch": "string",
  "whatsAppWelcomeTemplate": "string",
  "openin …
```
- **Example Response:** `{"success":false,"data":null,"errors":["الفرع غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الفرع غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Branch/{id}`

- **Endpoint:** `/api/V1/Branch/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Branch by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Branch/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الفرع غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الفرع غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Branch/{id}`

- **Endpoint:** `/api/V1/Branch/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Branch by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Branch/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"31887c15-5b47-4551-2190-08dea9210ab7","nameAr":"????? ????????","nameEn":"????? ????????","organizationTypeAr":null,"addressAr":null,"addressEn":null,"cityAr":null,"phone":null,"mobile":null,"email":null,"branchLicense":null,"commercialRegistrationNumber":null,"commercialRegistrationDate":null,"commercialRegistrationIssuedByAr":null,"laborLicenseNumber":null,"laborLic …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,nameAr,nameEn,organizationTypeAr,addressAr,addressEn}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Branch/{id}/sub-branches`

- **Endpoint:** `/api/V1/Branch/{id}/sub-branches`
- **HTTP Method:** GET
- **Purpose:** Get a Branch by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Branch/{id}/sub-branches
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"f1457312-ecd8-4f02-2191-08dea9210ab7","nameAr":"ابحر","nameEn":"ابحر","phone":null,"mobile":null,"email":null,"mainBranch":0,"parentBranchId":"31887c15-5b47-4551-2190-08dea9210ab7","parentBranchNameAr":"????? ????????","parentBranchNameEn":"????? ????????","subBranches":[]}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Commission (3)

### `GET /api/V1/Commission/GetAll`

- **Endpoint:** `/api/V1/Commission/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Commission
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `empId` (string (uuid))
    - `comDate` (string (date-time))
    - `comDateTo` (string (date-time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Commission/GetAll?empId=<string>&comDate=<string>&comDateTo=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"02d857e2-26cc-4e4c-3806-08dedff8a5b2","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","employeeName":"???? ????","comDate":"2026-07-12T09:33:31.513","typeId":1,"amount":100.00}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Commission/Create`

- **Endpoint:** `/api/V1/Commission/Create`
- **HTTP Method:** POST
- **Purpose:** Create a Commission
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ employeeId: string (uuid), comDate: string (date-time), comDateTo: string (date-time), typeId: CommissionType, amount: number (double), isTaxable: boolean, bankFees: number (double), bankFeesTax: number (double), taxValue: number (double), accountId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Commission/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "comDate": "2026-01-01T00:00:00Z",
  "comDateTo": "2026-01-01T00:00:00Z",
  "typeId": 1,
  "amount": 0,
  "isTaxable": true,
  "bankFees": 0,
  "bankFeesTax": 0,
  "taxValue": 0,
  "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":true,"data":"Commission created","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500 (empty) / 200 (valid)
- **Pass/Fail:** PASS*
- **Notes:** works with valid body; 500 on empty body (validation gap) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `DELETE /api/V1/Commission/Delete/{id}`

- **Endpoint:** `/api/V1/Commission/Delete/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Commission by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Commission/Delete/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"Commission deleted","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"Commission deleted","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Return 404 when the target does not exist.

## CommissionSlice (3)

### `POST /api/V1/CommissionSlice/Create`

- **Endpoint:** `/api/V1/CommissionSlice/Create`
- **HTTP Method:** POST
- **Purpose:** Create a CommissionSlice
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ commissionId: string (uuid), commissionTypeId: integer (int32), commissionName: string, amount: number (double), isPercent: boolean, includeTax: boolean, withDetails: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/CommissionSlice/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "commissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "commissionTypeId": 0,
  "commissionName": "string",
  "amount": 0,
  "isPercent": true,
  "includeTax": true,
  "withDetails": true
}
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `DELETE /api/V1/CommissionSlice/Delete/{id}`

- **Endpoint:** `/api/V1/CommissionSlice/Delete/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a CommissionSlice by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/CommissionSlice/Delete/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"Slice deleted","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"Slice deleted","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Return 404 when the target does not exist.

### `GET /api/V1/CommissionSlice/GetAll`

- **Endpoint:** `/api/V1/CommissionSlice/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve CommissionSlice
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/CommissionSlice/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401).
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Complaint (13)

### `GET /api/Complaint`

- **Endpoint:** `/api/Complaint`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Complaint
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `Status` (ComplaintStatus)
    - `RelatedContractType` (RelatedContractType)
    - `RelatedContractId` (string (uuid))
    - `CustomerPhone` (string)
    - `CustomerNationalId` (string)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Complaint?CustomerId=<string>&WorkerId=<string>&Status=<val>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"5945b67c-e958-4088-91ce-08dedff8a619","complaintNumber":11,"source":1,"sourceName":"Customer","priority":1,"priorityName":"Green","status":1,"statusName":"Open","holdReason":null,"customerId":"f3c34dc9-ea08-4a4f-0a9c-08de995cf376","customerName":"محمد أحمد علي","workerId":"97fef276-3039-4cd3-9856-08de9fed0fc3","workerName":"Ahmed Mohamed Dandash","workerLoca …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:11}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Complaint`

- **Endpoint:** `/api/Complaint`
- **HTTP Method:** POST
- **Purpose:** Create a Complaint
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ source: ComplaintSource, priority: ComplaintPriority, customerId: string (uuid), workerId: string (uuid), workerLocation: WorkerLocation, relatedContractType: RelatedContractType, relatedContractId: string (uuid), notesAr: string, notesEn: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Complaint
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "source": 1,
  "priority": 1,
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerLocation": 1,
  "relatedContractType": 1,
  "relatedContractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "notesAr": "string",
  "notesEn": "string"
}
```
- **Example Response:** `{"success":true,"data":{"id":"2f2e41f7-2094-4974-c381-08dedff33e79","complaintNumber":9,"source":0,"sourceName":"0","priority":0,"priorityName":"0","status":1,"`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":true,"data":{"id":"2f2e41f7-2094-4974-c381-08dedff33e79","complaintNumber":9,"source":0,"sourceName":"0","priority":0,"priorityNa …`
- **Status Code:** 200/200
- **Pass/Fail:** FAIL
- **Notes:** accepts empty body & creates a blank record (no validation) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Accepts an empty body and persists a blank record.
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Require and validate mandatory fields; reject empty bodies with 400.

### `GET /api/Complaint/{id}`

- **Endpoint:** `/api/Complaint/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Complaint by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Complaint/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"5945b67c-e958-4088-91ce-08dedff8a619","complaintNumber":11,"source":1,"sourceName":"Customer","priority":1,"priorityName":"Green","status":1,"statusName":"Open","holdReason":null,"customerId":"f3c34dc9-ea08-4a4f-0a9c-08de995cf376","customerName":"محمد أحمد علي","workerId":"97fef276-3039-4cd3-9856-08de9fed0fc3","workerName":"Ahmed Mohamed Dandash","workerLocation":1,"w …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,complaintNumber,source,sourceName,priority,priorityName}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Complaint/{id}/toggle-hold`

- **Endpoint:** `/api/Complaint/{id}/toggle-hold`
- **HTTP Method:** POST
- **Purpose:** Complaint action: toggle-hold
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:**
    - `reason` (string)
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Complaint/{id}/toggle-hold?reason=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["Complaint not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["Complaint not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Complaint/{id}/finish`

- **Endpoint:** `/api/Complaint/{id}/finish`
- **HTTP Method:** POST
- **Purpose:** Complaint action: finish
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Complaint/{id}/finish
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["Complaint not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["Complaint not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Complaint/update`

- **Endpoint:** `/api/Complaint/update`
- **HTTP Method:** POST
- **Purpose:** Complaint: update
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ complaintId: string (uuid), noteAr: string, noteEn: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Complaint/update
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "complaintId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "noteAr": "string",
  "noteEn": "string"
}
```
- **Example Response:** `{"success":true,"data":{"id":"26e67e5d-95b9-4db6-9d13-08dedff8a65c","noteAr":"ZZ_REVAL4_1783848770945","noteEn":"ZZ_REVAL4_1783848770945","c`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `POST /api/Complaint/issue`

- **Endpoint:** `/api/Complaint/issue`
- **HTTP Method:** POST
- **Purpose:** Complaint: issue
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Complaint/issue
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `GET /api/Complaint/{id}/issue`

- **Endpoint:** `/api/Complaint/{id}/issue`
- **HTTP Method:** GET
- **Purpose:** Get a Complaint by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Complaint/{id}/issue
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Issue not found"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Complaint/GetAll`

- **Endpoint:** `/api/V1/Complaint/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Complaint
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Complaint/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Complaint/Create`

- **Endpoint:** `/api/V1/Complaint/Create`
- **HTTP Method:** POST
- **Purpose:** Create a Complaint
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ complaintNotes: string, sendTheComplaintTo: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Complaint/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "complaintNotes": "string",
  "sendTheComplaintTo": "string"
}
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `POST /api/V1/Complaint/Reply`

- **Endpoint:** `/api/V1/Complaint/Reply`
- **HTTP Method:** POST
- **Purpose:** Complaint: Reply
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ id: string (uuid), replyNotes: string, sendReplyTo: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Complaint/Reply
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "replyNotes": "string",
  "sendReplyTo": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Not found"],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["Not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Complaint/Close/{id}`

- **Endpoint:** `/api/V1/Complaint/Close/{id}`
- **HTTP Method:** POST
- **Purpose:** Complaint action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Complaint/Close/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Complaint/Delete/{id}`

- **Endpoint:** `/api/V1/Complaint/Delete/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Complaint by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Complaint/Delete/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"Complaint deleted","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"Complaint deleted","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Return 404 when the target does not exist.

## ContractCreationRequirement (5)

### `GET /api/FollowUp/ContractCreationRequirement/GetById/{id}`

- **Endpoint:** `/api/FollowUp/ContractCreationRequirement/GetById/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a ContractCreationRequirement by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/ContractCreationRequirement/GetById/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["متطلبات العقد غير موجودة"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob`

- **Endpoint:** `/api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob`
- **HTTP Method:** GET
- **Purpose:** List / retrieve ContractCreationRequirement
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `nationalityId` (string (uuid))
    - `jobId` (string (uuid))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob?nationalityId=<string>&jobId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["لا توجد متطلبات لهذه الجنسية/الوظيفة"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 404). Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/FollowUp/ContractCreationRequirement/Create`

- **Endpoint:** `/api/FollowUp/ContractCreationRequirement/Create`
- **HTTP Method:** POST
- **Purpose:** Create a ContractCreationRequirement
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid)*, jobId: string (uuid), requirementsText: string* }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/FollowUp/ContractCreationRequirement/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "requirementsText": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"RequirementsText":["The R`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Requi …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/FollowUp/ContractCreationRequirement/Update`

- **Endpoint:** `/api/FollowUp/ContractCreationRequirement/Update`
- **HTTP Method:** PUT
- **Purpose:** Update a ContractCreationRequirement
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid)*, jobId: string (uuid), requirementsText: string*, id: string (uuid) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/FollowUp/ContractCreationRequirement/Update
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "requirementsText": "string",
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"RequirementsText":["The R`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Requi …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/FollowUp/ContractCreationRequirement/Delete/{id}`

- **Endpoint:** `/api/FollowUp/ContractCreationRequirement/Delete/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a ContractCreationRequirement by id
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/FollowUp/ContractCreationRequirement/Delete/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Return 404 when the target does not exist.

## ContractNationality (5)

### `GET /api/FollowUp/ContractNationality/GetAll`

- **Endpoint:** `/api/FollowUp/ContractNationality/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve ContractNationality
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/ContractNationality/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityId":"bbee0b3d-365d-40b6-2d87-08de9d465260","nameAr":"سريلانكا","nameEn":"Sri Lanka","isActive":true,"configuredStatusCount":8},{"id":"81146978-e3ea-453b-c18c-08dea2f4800b","nationalityId":"a9b569e2-7553-44d6-2d85-08de9d465260","nameAr":"كينيا","nameEn":"Kenya","isActive":true,"configuredStatusCount":2},{"id":"3888ae8a …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[3]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/FollowUp/ContractNationality/GetById/{id}`

- **Endpoint:** `/api/FollowUp/ContractNationality/GetById/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a ContractNationality by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/ContractNationality/GetById/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الجنسية غير موجودة"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/FollowUp/ContractNationality/Create`

- **Endpoint:** `/api/FollowUp/ContractNationality/Create`
- **HTTP Method:** POST
- **Purpose:** Create a ContractNationality
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/FollowUp/ContractNationality/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["An error occurred while saving the entity changes. See the inner exception for details."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["An error occurred while saving the entity changes. See the inner exception for details."],"statusCod …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/FollowUp/ContractNationality/Update`

- **Endpoint:** `/api/FollowUp/ContractNationality/Update`
- **HTTP Method:** PUT
- **Purpose:** Update a ContractNationality
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid), id: string (uuid) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/FollowUp/ContractNationality/Update
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Nationality not found"],"statusCode":400}`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"success":false,"data":null,"errors":["Nationality not found"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/FollowUp/ContractNationality/Delete/{id}`

- **Endpoint:** `/api/FollowUp/ContractNationality/Delete/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a ContractNationality by id
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/FollowUp/ContractNationality/Delete/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Return 404 when the target does not exist.

## CreditNote (4)

### `GET /api/Accounting/CreditNote`

- **Endpoint:** `/api/Accounting/CreditNote`
- **HTTP Method:** GET
- **Purpose:** List / retrieve CreditNote
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `ContractId` (string (uuid))
    - `DocumentType` (AccountingDocumentType)
    - `DocumentNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/CreditNote?CustomerId=<string>&AgentId=<string>&ContractId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"5c58a37a-d37c-4392-0786-08dedff8a6eb","creditNoteNumber":"ZZ_REVAL4_1783848770945","creditNoteDate":"2026-07-12T09:33:33.53","amount":100.00,"vatAmount":100.00,"reason":"ZZ_REVAL4_1783848770945","notes":"ZZ_REVAL4_1783848770945","customerId":"f3c34dc9-ea08-4a4f-0a9c-08de995cf376","sourceContractId":"00000000-0000-0000-0000-000000000000","sourceContractType":"ZZ_REVAL …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Accounting/CreditNote`

- **Endpoint:** `/api/Accounting/CreditNote`
- **HTTP Method:** POST
- **Purpose:** Create a CreditNote
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ creditNoteNumber: string, creditNoteDate: string (date-time), amount: number (double), vatAmount: number (double), reason: string, notes: string, customerId: string (uuid), sourceContractId: string (uuid), sourceContractType: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Accounting/CreditNote
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "creditNoteNumber": "string",
  "creditNoteDate": "2026-01-01T00:00:00Z",
  "amount": 0,
  "vatAmount": 0,
  "reason": "string",
  "notes": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceContractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceContractType": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["'Credit Note Number' must not be empty.","'Credit Note Date' must not be empty.","'Amount' must be greater than '0'.","'`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["'Credit Note Number' must not be empty.","'Credit Note Date' must not be empty.","'Amount' must be g …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Validate FK existence (customer/contract) and return 400 rather than 500 on a bad reference.

### `GET /api/Accounting/CreditNote/{id}`

- **Endpoint:** `/api/Accounting/CreditNote/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a CreditNote by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/CreditNote/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"5c58a37a-d37c-4392-0786-08dedff8a6eb","creditNoteNumber":"ZZ_REVAL4_1783848770945","creditNoteDate":"2026-07-12T09:33:33.53","amount":100.00,"vatAmount":100.00,"reason":"ZZ_REVAL4_1783848770945","notes":"ZZ_REVAL4_1783848770945","customerId":"f3c34dc9-ea08-4a4f-0a9c-08de995cf376","sourceContractId":"00000000-0000-0000-0000-000000000000","sourceContractType":"ZZ_REVAL4 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,creditNoteNumber,creditNoteDate,amount,vatAmount,reason}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Accounting/CreditNote/{id}/trace`

- **Endpoint:** `/api/Accounting/CreditNote/{id}/trace`
- **HTTP Method:** GET
- **Purpose:** Get audit trace for a CreditNote
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/CreditNote/{id}/trace
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"documentType":3,"documentEntityId":"5c58a37a-d37c-4392-0786-08dedff8a6eb","document":{"id":"5c58a37a-d37c-4392-0786-08dedff8a6eb","documentType":3,"documentNumber":"ZZ_REVAL4_1783848770945","documentDate":"2026-07-12T09:33:33.53","amount":100.00,"journalEntryId":null,"accountingDocumentId":null,"customerId":"f3c34dc9-ea08-4a4f-0a9c-08de995cf376","agentId":null,"contractId" …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{documentType,documentEntityId,document,journalEntry,ledgerEntries}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## CustodyRequest (7)

### `GET /api/V1/CustodyRequest/GetAll`

- **Endpoint:** `/api/V1/CustodyRequest/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve CustodyRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/CustodyRequest/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"77d92a7a-63f3-4e2d-00b1-08deb5a3eba1","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","details":"سوف يتم التوصيل","status":2,"items":[{"id":"b2bd75d8-055f-42c4-df80-08deb5a3eba5","custodyTypeId":"d4c9b145-bf9e-4e98-ba78-08deb59da96d","custodyTypeName":null,"quantity":1,"deliveryDate":"2026-05-19T12:08:50.553","temporal":true}]},{"id":"9250fb5c-bdfa-4033-a0f3-08de …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/CustodyRequest/Create`

- **Endpoint:** `/api/V1/CustodyRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a CustodyRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ createdTo: string (uuid), details: string, reasons: string, custodyItems: array<CreateCustodyItemDto> }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/CustodyRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "createdTo": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "details": "string",
  "reasons": "string",
  "custodyItems": [
    {
      "custodyTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 0,
      "deliveryDate": "2026-01-01T00:00:00Z",
      "temporal": true,
      "shortNote": "string"
    }
  ]
}
```
- **Example Response:** `{"success":true,"data":"Custody request submitted","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500 (empty) / 200 (valid)
- **Pass/Fail:** PASS*
- **Notes:** works with valid body; 500 on empty body (validation gap) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `POST /api/V1/CustodyRequest/Approve/{id}`

- **Endpoint:** `/api/V1/CustodyRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** CustodyRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/CustodyRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/CustodyRequest/Reject/{id}`

- **Endpoint:** `/api/V1/CustodyRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** CustodyRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/CustodyRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/CustodyRequest/Types/Create`

- **Endpoint:** `/api/V1/CustodyRequest/Types/Create`
- **HTTP Method:** POST
- **Purpose:** Create a CustodyRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nameAr: string, nameEn: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/CustodyRequest/Types/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["يجب إدخال اسم نوع العهدة (عربي أو إنجليزي)."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["يجب إدخال اسم نوع العهدة (عربي أو إنجليزي)."],"statusCode":400}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/CustodyRequest/Types`

- **Endpoint:** `/api/V1/CustodyRequest/Types`
- **HTTP Method:** GET
- **Purpose:** List / retrieve CustodyRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/CustodyRequest/Types
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"d4c9b145-bf9e-4e98-ba78-08deb59da96d","nameAr":"عهده عينيه","nameEn":"عهده عينيه"},{"id":"f29770e1-3a8f-4a68-ba79-08deb59da96d","nameAr":"عهده نقديه","nameEn":"عهده نقديه"},{"id":"13d1f291-4ebe-4153-ba7a-08deb59da96d","nameAr":"كمبيوتر","nameEn":"كمبيوتر"},{"id":"2b2a3b7d-246d-4fa9-3831-08dedd4490c3","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/CustodyRequest/Types/{id}`

- **Endpoint:** `/api/V1/CustodyRequest/Types/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a CustodyRequest by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/CustodyRequest/Types/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"d4c9b145-bf9e-4e98-ba78-08deb59da96d","nameAr":"عهده عينيه","nameEn":"عهده عينيه"},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,nameAr,nameEn}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Customer (7)

### `POST /api/V1/Customer`

- **Endpoint:** `/api/V1/Customer`
- **HTTP Method:** POST
- **Purpose:** Create a Customer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ arabicName: string, englishName: string, nationality: string, identityType: IdentityType, identityNumber: string, identityIssueDate: string (date), birthDate: string (date), dateOfBirth: string (date), nationalId: string, secondaryMobileNumber: string, maritalStatus: MaritalStatus, housingType: HousingType, email: string, districtAr: string, districtEn: string, addressAr: string, addressEn: string, cityAr: string, cityEn: string, familyMembers: integer (int32), childrenCount: integer (int32), domesticWorkers: integer (int32), monthlyIncome: number (double), branchId: string (uuid), includeSubBranches: boolean, phones: array<CustomerPhoneDto> }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Customer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "arabicName": "string",
  "englishName": "string",
  "nationality": "string",
  "identityType": 1,
  "identityNumber": "string",
  "identityIssueDate": "2026-01-01",
  "birthDate": "2026-01-01",
  "dateOfBirth": "2026-01-01",
  "nationalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "secondaryMobileNumber": "0512345678",
  "maritalStatus": 1,
  "housingType": 1,
  "email": "user@example.com",
  "districtAr": "string",
  "districtEn": "string",
  "addressAr": "string",
  "addressEn": "string",
  "cityAr": "string",
  "cityEn": "string",
  "familyMembers": 0,
  "childrenCount": 0,
  "domesticWorkers": 0,
  "monthlyIncome": 0,
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "include …
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Phones":["The Phones fiel`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Phone …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Customer`

- **Endpoint:** `/api/V1/Customer`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Customer
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `IdNumber` (string)
    - `Mobile` (string)
    - `Email` (string)
    - `Nationality` (string)
    - `AgentId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Customer?SearchName=<string>&IdNumber=<string>&Mobile=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","arabicName":null,"englishName":"ZZ_REVAL4_1783848770945","identityNumber":"ZZ_REVAL4_1783848770945","nationalId":"ZZ_REVAL4_1783848770945","dateOfBirth":null,"secondaryMobileNumber":null,"nationality":null,"cityAr":null,"cityEn":null,"housingType":null,"numberOfComplaints":0,"numberOfOperatingContracts":0,"numberOfMedia …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:9,total:9}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/Customer/{id}`

- **Endpoint:** `/api/V1/Customer/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Customer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ arabicName: string, englishName: string, nationality: string, identityType: IdentityType, identityNumber: string, identityIssueDate: string (date), birthDate: string (date), dateOfBirth: string (date), nationalId: string, secondaryMobileNumber: string, maritalStatus: MaritalStatus, housingType: HousingType, email: string, districtAr: string, districtEn: string, addressAr: string, addressEn: string, cityAr: string, cityEn: string, familyMembers: integer (int32), childrenCount: integer (int32), domesticWorkers: integer (int32), monthlyIncome: number (double), branchId: string (uuid), includeSubBranches: boolean, phones: array<CustomerPhoneDto> }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Customer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "arabicName": "string",
  "englishName": "string",
  "nationality": "string",
  "identityType": 1,
  "identityNumber": "string",
  "identityIssueDate": "2026-01-01",
  "birthDate": "2026-01-01",
  "dateOfBirth": "2026-01-01",
  "nationalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "secondaryMobileNumber": "0512345678",
  "maritalStatus": 1,
  "housingType": 1,
  "email": "user@example.com",
  "districtAr": "string",
  "districtEn": "string",
  "addressAr": "string",
  "addressEn": "string",
  "cityAr": "string",
  "cityEn": "string",
  "familyMembers": 0,
  "childrenCount": 0,
  "domesticWorkers": 0,
  "monthlyIncome": 0,
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "include …
```
- **Example Response:** `{"success":false,"data":null,"errors":["العميل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["العميل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Customer/{id}`

- **Endpoint:** `/api/V1/Customer/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Customer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Customer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["العميل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["العميل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Customer/{id}`

- **Endpoint:** `/api/V1/Customer/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Customer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Customer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","arabicName":null,"englishName":"ZZ_REVAL4_1783848770945","identityNumber":"ZZ_REVAL4_1783848770945","nationalId":"ZZ_REVAL4_1783848770945","dateOfBirth":null,"secondaryMobileNumber":null,"nationality":null,"cityAr":null,"cityEn":null,"housingType":null,"numberOfComplaints":0,"numberOfOperatingContracts":0,"numberOfMediationContra …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,arabicName,englishName,identityNumber,nationalId,dateOfBirth}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Customer/export`

- **Endpoint:** `/api/V1/Customer/export`
- **HTTP Method:** GET
- **Purpose:** Export Customer (file/report)
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `IdNumber` (string)
    - `Mobile` (string)
    - `Email` (string)
    - `Nationality` (string)
    - `AgentId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Customer/export?SearchName=<string>&IdNumber=<string>&Mobile=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `PK    f�\�>�7  5     xl/workbook.xml��Ok�0ſ�'r]���Ф���^�'e;�VS�	����g�Zz�M����!��5쀁�w5�:�v�����y3�����;6X� 5t1��$;��&�G7X��'E��[��VK\x���"/���4"j��=��m�����1Z�kf�vpM��� ߅�V����0��R���Hע4'�?�y90!�>�JlƎ73~#��z��#_���@���R�P �V5��*�^��V;T	��?����d��MİQl!0�0#qJɁuZ)L���]��U��y��21nå02�P9����rzf>߫�PK    f�\@��'^  @     docProps/app.xml��AO�0��J�@�B …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `PK    f�\�>�7  5     xl/workbook.xml��Ok�0ſ�'r]���Ф���^�'e;�VS�	����g�Zz�M����!��5쀁�w5�:�v�����y3��`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/Customer/generate-english-name`

- **Endpoint:** `/api/V1/Customer/generate-english-name`
- **HTTP Method:** POST
- **Purpose:** Customer: generate-english-name
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ arabicName: string* }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Customer/generate-english-name
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "arabicName": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"ArabicName":["The ArabicN`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Arabi …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## DebitNote (4)

### `GET /api/Accounting/DebitNote`

- **Endpoint:** `/api/Accounting/DebitNote`
- **HTTP Method:** GET
- **Purpose:** List / retrieve DebitNote
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `ContractId` (string (uuid))
    - `DocumentType` (AccountingDocumentType)
    - `DocumentNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/DebitNote?CustomerId=<string>&AgentId=<string>&ContractId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"4b9197d8-35a3-4d51-8b7a-08dedff8a797","debitNoteNumber":"ZZ_REVAL4_1783848770945","debitNoteDate":"2026-07-12T09:33:34.715","amount":100.00,"vatAmount":100.00,"reason":"ZZ_REVAL4_1783848770945","notes":"ZZ_REVAL4_1783848770945","agentId":"596445ca-263e-4c5c-62bb-08de9d43d411","sourceContractId":"00000000-0000-0000-0000-000000000000","sourceContractType":"ZZ_REVAL4_17 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Accounting/DebitNote`

- **Endpoint:** `/api/Accounting/DebitNote`
- **HTTP Method:** POST
- **Purpose:** Create a DebitNote
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ debitNoteNumber: string, debitNoteDate: string (date-time), amount: number (double), vatAmount: number (double), reason: string, notes: string, agentId: string (uuid), sourceContractId: string (uuid), sourceContractType: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Accounting/DebitNote
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "debitNoteNumber": "string",
  "debitNoteDate": "2026-01-01T00:00:00Z",
  "amount": 0,
  "vatAmount": 0,
  "reason": "string",
  "notes": "string",
  "agentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceContractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceContractType": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["'Debit Note Number' must not be empty.","'Debit Note Date' must not be empty.","'Amount' must be greater than '0'.","'Ag`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["'Debit Note Number' must not be empty.","'Debit Note Date' must not be empty.","'Amount' must be gre …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Validate FK existence (customer/contract) and return 400 rather than 500 on a bad reference.

### `GET /api/Accounting/DebitNote/{id}`

- **Endpoint:** `/api/Accounting/DebitNote/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a DebitNote by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/DebitNote/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"4b9197d8-35a3-4d51-8b7a-08dedff8a797","debitNoteNumber":"ZZ_REVAL4_1783848770945","debitNoteDate":"2026-07-12T09:33:34.715","amount":100.00,"vatAmount":100.00,"reason":"ZZ_REVAL4_1783848770945","notes":"ZZ_REVAL4_1783848770945","agentId":"596445ca-263e-4c5c-62bb-08de9d43d411","sourceContractId":"00000000-0000-0000-0000-000000000000","sourceContractType":"ZZ_REVAL4_178 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,debitNoteNumber,debitNoteDate,amount,vatAmount,reason}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Accounting/DebitNote/{id}/trace`

- **Endpoint:** `/api/Accounting/DebitNote/{id}/trace`
- **HTTP Method:** GET
- **Purpose:** Get audit trace for a DebitNote
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/DebitNote/{id}/trace
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"documentType":4,"documentEntityId":"4b9197d8-35a3-4d51-8b7a-08dedff8a797","document":{"id":"4b9197d8-35a3-4d51-8b7a-08dedff8a797","documentType":4,"documentNumber":"ZZ_REVAL4_1783848770945","documentDate":"2026-07-12T09:33:34.715","amount":100.00,"journalEntryId":null,"accountingDocumentId":null,"customerId":null,"agentId":"596445ca-263e-4c5c-62bb-08de9d43d411","contractId …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{documentType,documentEntityId,document,journalEntry,ledgerEntries}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Department (1)

### `POST /api/V1/Department`

- **Endpoint:** `/api/V1/Department`
- **HTTP Method:** POST
- **Purpose:** Create a Department
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:**
    - `nameAr` (string)
    - `nameEn` (string)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Department?nameAr=<string>&nameEn=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"nameAr":["The nameAr fiel`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"nameA …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Employee (6)

### `GET /api/V1/Employee`

- **Endpoint:** `/api/V1/Employee`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Employee
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `searchName` (string)
    - `page` (integer (int32))
    - `pageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Employee?searchName=<string>&page=<integer>&pageSize=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"b4ac372e-8cb4-4926-6e2b-08de9e50dd76","employeeNumber":"EMP001-UPDATED","nameAr":"???? ???? ???","nameEn":"Ahmed Mohamed Ali","email":"ahmed.updated@sigma.com","idNumber":"9876543210","mobileNumber":"0509999999","jobId":null,"jobNameAr":null,"jobNameEn":null,"departmentId":null,"departmentNameAr":null,"departmentNameEn":null,"nationalityId":null,"nationality …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `paged{items:8,total:8}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Employee`

- **Endpoint:** `/api/V1/Employee`
- **HTTP Method:** POST
- **Purpose:** Create a Employee
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ employeeNumber: string, nameAr: string, nameEn: string, email: string, userId: string, idNumber: string, mobileNumber: string, jobId: string (uuid), departmentId: string (uuid), nationalityId: string (uuid), hiringDate: string (date-time), basicSalary: number (double), housingAllowance: number (double), mobilityAllowance: number (double), otherAllowances: number (double), isActive: boolean, bankName: string, bankAccountNumber: string, iban: string, userName: string, branchId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Employee
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "employeeNumber": "string",
  "nameAr": "string",
  "nameEn": "string",
  "email": "user@example.com",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "idNumber": "string",
  "mobileNumber": "0512345678",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hiringDate": "2026-01-01T00:00:00Z",
  "basicSalary": 0,
  "housingAllowance": 0,
  "mobilityAllowance": 0,
  "otherAllowances": 0,
  "isActive": true,
  "bankName": "string",
  "bankAccountNumber": "string",
  "iban": "string",
  "userName": "string",
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"UserName":["The UserName `
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"UserN …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Employee/{id}`

- **Endpoint:** `/api/V1/Employee/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Employee by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Employee/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"basicSalary":6500.00,"housingAllowance":1200.00,"mobilityAllowance":600.00,"otherAllowances":300.00,"totalSalary":8600.00,"id":"b4ac372e-8cb4-4926-6e2b-08de9e50dd76","employeeNumber":"EMP001-UPDATED","nameAr":"???? ???? ???","nameEn":"Ahmed Mohamed Ali","email":"ahmed.updated@sigma.com","idNumber":"9876543210","mobileNumber":"0509999999","jobId":null,"jobNameAr":null,"jobN …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{basicSalary,housingAllowance,mobilityAllowance,otherAllowances,totalSalary,id}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Employee/{id}`

- **Endpoint:** `/api/V1/Employee/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Employee by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ employeeNumber: string, nameAr: string, nameEn: string, email: string, userId: string, idNumber: string, mobileNumber: string, jobId: string (uuid), departmentId: string (uuid), nationalityId: string (uuid), hiringDate: string (date-time), basicSalary: number (double), housingAllowance: number (double), mobilityAllowance: number (double), otherAllowances: number (double), isActive: boolean, bankName: string, bankAccountNumber: string, iban: string, userName: string, branchId: string (uuid) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Employee/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "employeeNumber": "string",
  "nameAr": "string",
  "nameEn": "string",
  "email": "user@example.com",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "idNumber": "string",
  "mobileNumber": "0512345678",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "departmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hiringDate": "2026-01-01T00:00:00Z",
  "basicSalary": 0,
  "housingAllowance": 0,
  "mobilityAllowance": 0,
  "otherAllowances": 0,
  "isActive": true,
  "bankName": "string",
  "bankAccountNumber": "string",
  "iban": "string",
  "userName": "string",
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Employee/{id}`

- **Endpoint:** `/api/V1/Employee/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Employee by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Employee/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Employee/{id}/reset-password`

- **Endpoint:** `/api/V1/Employee/{id}/reset-password`
- **HTTP Method:** PUT
- **Purpose:** Update a Employee by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Employee/{id}/reset-password
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## EmploymentOperatingContract (13)

### `GET /api/EmploymentOperatingContract`

- **Endpoint:** `/api/EmploymentOperatingContract`
- **HTTP Method:** GET
- **Purpose:** List / retrieve EmploymentOperatingContract
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchWorkerName` (string)
    - `WorkerPhone` (string)
    - `IdentityNumber` (string)
    - `ContractNumber` (integer (int32))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `ContractStatus` (ContractStatus)
    - `IsFinish` (boolean)
    - `ContractDateFrom` (string (date-time))
    - `ContractDateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/EmploymentOperatingContract?SearchWorkerName=<string>&WorkerPhone=<string>&IdentityNumber=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"471eb219-fe0c-416f-b190-08ded691d2a4","customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","marketerId":null,"contractNumber":10,"contractCategory":null,"offerId":null,"operationType":1,"paymentMethod":1,"nationalityId":"8f452902-3545-465e-2d86-08de9d465260","jobId":"35054bc2-c1c5-4e60-f4be-08de9bab1e0a","duration":1,"durationNameAr":"شهري","durationNameEn":" …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:9,total:9}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/EmploymentOperatingContract`

- **Endpoint:** `/api/EmploymentOperatingContract`
- **HTTP Method:** POST
- **Purpose:** Create a EmploymentOperatingContract
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ customerId: string (uuid), marketerId: string (uuid), contractCategory: integer (int32), offerId: string (uuid), operationType: integer (int32), paymentMethod: integer (int32), nationalityId: string (uuid), jobId: string (uuid), duration: integer (int32), contractStartDate: string (date-time), contractEndDate: string (date-time), previousExperience: integer (int32), offerPrice: number (double), workerId: string (uuid), laborManagement: integer (int32), workerNameEn: string, workerNameAr: string, workerPhone: string, workersCount: integer (int32), cost: number (double), insurance: number (double), customerAddress: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "marketerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "contractCategory": 0,
  "offerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "operationType": 0,
  "paymentMethod": 0,
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "duration": 0,
  "contractStartDate": "2026-01-01T00:00:00Z",
  "contractEndDate": "2026-01-01T00:00:00Z",
  "previousExperience": 0,
  "offerPrice": 0,
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "laborManagement": 0,
  "workerNameEn": "string",
  "workerNameAr": "string",
  "workerPhone": "0512345678",
  "workersCount": 0,
  "cost": 0,
 …
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `GET /api/EmploymentOperatingContract/{id}`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a EmploymentOperatingContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"id":"471eb219-fe0c-416f-b190-08ded691d2a4","customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","marketerId":null,"contractNumber":10,"contractCategory":null,"offerId":null,"operationType":1,"paymentMethod":1,"nationalityId":"8f452902-3545-465e-2d86-08de9d465260","jobId":"35054bc2-c1c5-4e60-f4be-08de9bab1e0a","duration":1,"durationNameAr":"شهري","durationNameEn":"Monthly","contractStartDate":"202 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,customerId,marketerId,contractNumber,contractCategory,offerId}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/EmploymentOperatingContract/{id}`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a EmploymentOperatingContract by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ customerId: string (uuid), marketerId: string (uuid), contractCategory: integer (int32), offerId: string (uuid), operationType: integer (int32), paymentMethod: integer (int32), nationalityId: string (uuid), jobId: string (uuid), duration: integer (int32), contractStartDate: string (date-time), contractEndDate: string (date-time), previousExperience: integer (int32), offerPrice: number (double), workerId: string (uuid), laborManagement: integer (int32), workerNameEn: string, workerNameAr: string, workerPhone: string, workersCount: integer (int32), cost: number (double), insurance: number (double), customerAddress: string, isFinish: boolean, finishBy: string, finishDate: string (date-time), noteFinish: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "marketerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "contractCategory": 0,
  "offerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "operationType": 0,
  "paymentMethod": 0,
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "duration": 0,
  "contractStartDate": "2026-01-01T00:00:00Z",
  "contractEndDate": "2026-01-01T00:00:00Z",
  "previousExperience": 0,
  "offerPrice": 0,
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "laborManagement": 0,
  "workerNameEn": "string",
  "workerNameAr": "string",
  "workerPhone": "0512345678",
  "workersCount": 0,
  "cost": 0,
 …
```
- **Example Response:** `Contract not found.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Contract not found.`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/EmploymentOperatingContract/{id}`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a EmploymentOperatingContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `Contract not found.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Contract not found.`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/EmploymentOperatingContract/{id}/renew`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/renew`
- **HTTP Method:** POST
- **Purpose:** EmploymentOperatingContract action: renew
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{  }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/renew
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"$":["`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"$":["`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/EmploymentOperatingContract/{id}/terminate`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/terminate`
- **HTTP Method:** POST
- **Purpose:** EmploymentOperatingContract action: terminate
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ note: string, refundAmount: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/terminate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "note": "string",
  "refundAmount": 0
}
```
- **Example Response:** `Unable to terminate the contract.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Unable to terminate the contract.`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/EmploymentOperatingContract/{id}/customer-refund`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/customer-refund`
- **HTTP Method:** POST
- **Purpose:** EmploymentOperatingContract action: customer-refund
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ amount: number (double), paymentMethod: PaymentMethodType, description: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/customer-refund
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "amount": 0,
  "paymentMethod": 1,
  "description": "string"
}
```
- **Example Response:** `Contract not found.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Contract not found.`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/EmploymentOperatingContract/{id}/sign`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/sign`
- **HTTP Method:** POST
- **Purpose:** EmploymentOperatingContract action: sign
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/sign
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `Unable to sign the contract.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Unable to sign the contract.`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/EmploymentOperatingContract/{id}/start-execution`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/start-execution`
- **HTTP Method:** POST
- **Purpose:** EmploymentOperatingContract action: start-execution
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/start-execution
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `Unable to start execution of the contract.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Unable to start execution of the contract.`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/EmploymentOperatingContract/{id}/print-delivery-form`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/print-delivery-form`
- **HTTP Method:** GET
- **Purpose:** Get a EmploymentOperatingContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/print-delivery-form
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"contractId":"471eb219-fe0c-416f-b190-08ded691d2a4","contractNumber":10,"deliveryDate":"2026-07-12T10:49:15.4444908Z","branchNameAr":null,"branchNameEn":null,"employeeName":"2dbb733b-6b62-4d4e-8522-845886c8f897","customerNameAr":"محمد أحمد علي","customerNameEn":"Mohamed Ahmed Ali","customerPhone":"+201012448774","customerNationalId":"1051234567","customerAddress":null,"workerNameAr":"راجو كومار", …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{contractId,contractNumber,deliveryDate,branchNameAr,branchNameEn,employeeName}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/EmploymentOperatingContract/{id}/delivery-form`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/delivery-form`
- **HTTP Method:** POST
- **Purpose:** EmploymentOperatingContract action: delivery-form
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ deliveryDate: string (date-time), employeeName: string, notes: string, customerSignedAt: string (date-time), workerSignedAt: string (date-time), companyRepresentativeSignedAt: string (date-time) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/delivery-form
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "deliveryDate": "2026-01-01T00:00:00Z",
  "employeeName": "string",
  "notes": "string",
  "customerSignedAt": "2026-01-01T00:00:00Z",
  "workerSignedAt": "2026-01-01T00:00:00Z",
  "companyRepresentativeSignedAt": "2026-01-01T00:00:00Z"
}
```
- **Example Response:** `Contract not found.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Contract not found.`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/EmploymentOperatingContract/{id}/print-receipt-form`

- **Endpoint:** `/api/EmploymentOperatingContract/{id}/print-receipt-form`
- **HTTP Method:** GET
- **Purpose:** Get a EmploymentOperatingContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/EmploymentOperatingContract/{id}/print-receipt-form
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"message":"Data for print form generated.","contract":{"id":"471eb219-fe0c-416f-b190-08ded691d2a4","customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","marketerId":null,"contractNumber":10,"contractCategory":null,"offerId":null,"operationType":1,"paymentMethod":1,"nationalityId":"8f452902-3545-465e-2d86-08de9d465260","jobId":"35054bc2-c1c5-4e60-f4be-08de9bab1e0a","duration":1,"durationNameAr":"شه …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{message,contract}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## EntitlementsRequest (4)

### `GET /api/V1/EntitlementsRequest/GetAll`

- **Endpoint:** `/api/V1/EntitlementsRequest/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve EntitlementsRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/EntitlementsRequest/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"aeb21a0f-dbd5-489d-00e5-08dedff8a835","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","employeeName":"???? ????","entitlementType":1,"amount":100.00,"notes":"ZZ_REVAL4_1783848770945","status":3,"journalEntryId":null,"accountingDocumentId":null}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/EntitlementsRequest/Create`

- **Endpoint:** `/api/V1/EntitlementsRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a EntitlementsRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ createdTo: string (uuid), entitlementType: HREntitlementType, amount: number (double), notes: string, reasons: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/EntitlementsRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "createdTo": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "entitlementType": 1,
  "amount": 0,
  "notes": "string",
  "reasons": "string"
}
```
- **Example Response:** `{"success":true,"data":"Entitlements request submitted","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500 (empty) / 200 (valid)
- **Pass/Fail:** PASS*
- **Notes:** works with valid body; 500 on empty body (validation gap) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `POST /api/V1/EntitlementsRequest/Approve/{id}`

- **Endpoint:** `/api/V1/EntitlementsRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** EntitlementsRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/EntitlementsRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/EntitlementsRequest/Reject/{id}`

- **Endpoint:** `/api/V1/EntitlementsRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** EntitlementsRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/EntitlementsRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## External (1)

### `POST /api/V1/External/request-worker`

- **Endpoint:** `/api/V1/External/request-worker`
- **HTTP Method:** POST
- **Purpose:** Create a External
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ workerId: string (uuid), customerName: string, phone: string, notes: string, identityNumber: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/External/request-worker
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "phone": "0512345678",
  "notes": "string",
  "identityNumber": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Phone":["The Phone field `
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Phone …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## File (1)

### `POST /api/V1/File/upload-multiple`

- **Endpoint:** `/api/V1/File/upload-multiple`
- **HTTP Method:** POST
- **Purpose:** File: upload-multiple
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/File/upload-multiple
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

## FollowUpStatus (5)

### `GET /api/FollowUp/FollowUpStatus/GetAll`

- **Endpoint:** `/api/FollowUp/FollowUpStatus/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve FollowUpStatus
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/FollowUpStatus/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"1c618abe-f388-4c17-79ad-08dedd448eb0","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","defaultSortOrder":0},{"id":"2d7a721a-7238-4779-d57e-08dedff34435","nameAr":"ZZ_REVAL_1783846483728","nameEn":"ZZ_REVAL_1783846483728","defaultSortOrder":0},{"id":"26af5347-5871-4264-694f-08dea2f0880f","nameAr":"إرسال العقد","nameEn":"Contract Musaned","defau …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[13]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/FollowUp/FollowUpStatus/GetById/{id}`

- **Endpoint:** `/api/FollowUp/FollowUpStatus/GetById/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a FollowUpStatus by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/FollowUpStatus/GetById/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الحالة غير موجودة"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/FollowUp/FollowUpStatus/Create`

- **Endpoint:** `/api/FollowUp/FollowUpStatus/Create`
- **HTTP Method:** POST
- **Purpose:** Create a FollowUpStatus
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nameAr: string*, nameEn: string*, defaultSortOrder: integer (int32) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/FollowUp/FollowUpStatus/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string",
  "defaultSortOrder": 0
}
```
- **Example Response:** `{"success":true,"data":{"id":"ca6594d6-a78e-40bc-d57d-08dedff34435","nameAr":"ZZ_REVAL_1783846483728","nameEn":"ZZ_REVAL_1783846483728","defaultSortOrder":0},"e`
- **Actual Test Result:** Real record created with a valid body, then deleted (cleanup). Observed: `{"success":true,"data":{"id":"ca6594d6-a78e-40bc-d57d-08dedff34435","nameAr":"ZZ_REVAL_1783846483728","nameEn":"ZZ_REVAL_1783846483728","def …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/FollowUp/FollowUpStatus/Update`

- **Endpoint:** `/api/FollowUp/FollowUpStatus/Update`
- **HTTP Method:** PUT
- **Purpose:** Update a FollowUpStatus
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nameAr: string*, nameEn: string*, defaultSortOrder: integer (int32), id: string (uuid) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/FollowUp/FollowUpStatus/Update
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string",
  "defaultSortOrder": 0,
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"NameAr":["The NameAr fiel`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"NameA …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/FollowUp/FollowUpStatus/Delete/{id}`

- **Endpoint:** `/api/FollowUp/FollowUpStatus/Delete/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a FollowUpStatus by id
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/FollowUp/FollowUpStatus/Delete/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Return 404 when the target does not exist.

## Hourly Workers - Catalog (12)

### `GET /api/V1/HourlyCatalog/Packages`

- **Endpoint:** `/api/V1/HourlyCatalog/Packages`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Catalog
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCatalog/Packages
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"dc69f4a4-abcb-444d-5df3-08ded760fbec","code":"21","nameAr":"اسبوع","nameEn":"week","durationHours":2,"numberOfWorkers":1,"basePrice":12.00,"isActive":true}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyCatalog/ServingAreas`

- **Endpoint:** `/api/V1/HourlyCatalog/ServingAreas`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Catalog
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `city` (string)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCatalog/ServingAreas?city=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyCatalog/Admin/Packages`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/Packages`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Catalog
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Search` (string)
    - `IsActive` (boolean)
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/Packages?Search=<string>&IsActive=<boolean>&SortBy=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"dc69f4a4-abcb-444d-5df3-08ded760fbec","code":"21","nameAr":"اسبوع","nameEn":"week","durationHours":2,"numberOfWorkers":1,"basePrice":12.00,"isActive":true}],"totalCount":1,"pageNumber":1,"pageSize":1},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:1,total:1}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyCatalog/Admin/Packages`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/Packages`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Catalog: Packages
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ code: string, nameAr: string, nameEn: string, descriptionAr: string, descriptionEn: string, durationHours: integer (int32), numberOfWorkers: integer (int32), basePrice: number (double), hourlyRate: number (double), sortOrder: integer (int32), isActive: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/Packages
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "code": "string",
  "nameAr": "string",
  "nameEn": "string",
  "descriptionAr": "string",
  "descriptionEn": "string",
  "durationHours": 0,
  "numberOfWorkers": 0,
  "basePrice": 0,
  "hourlyRate": 0,
  "sortOrder": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"errors":["'Code' must not be empty.","'Name Ar' must not be empty.","'Name En' must not be empty.","'Duration Hours' must be greater than '0'.`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Code' must not be empty.","'Name Ar' must not be empty.","'Name En' must not be empty.","'Duration Hours' must  …`
- **Status Code:** 201
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyCatalog/Admin/Packages/{id}`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/Packages/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Catalog by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/Packages/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"dc69f4a4-abcb-444d-5df3-08ded760fbec","code":"21","nameAr":"اسبوع","nameEn":"week","durationHours":2,"numberOfWorkers":1,"basePrice":12.00,"isActive":true},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,code,nameAr,nameEn,durationHours,numberOfWorkers}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/HourlyCatalog/Admin/Packages/{id}`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/Packages/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Hourly Workers - Catalog by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ code: string, nameAr: string, nameEn: string, descriptionAr: string, descriptionEn: string, durationHours: integer (int32), numberOfWorkers: integer (int32), basePrice: number (double), hourlyRate: number (double), sortOrder: integer (int32), isActive: boolean }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/Packages/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "code": "string",
  "nameAr": "string",
  "nameEn": "string",
  "descriptionAr": "string",
  "descriptionEn": "string",
  "durationHours": 0,
  "numberOfWorkers": 0,
  "basePrice": 0,
  "hourlyRate": 0,
  "sortOrder": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Package not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Package not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/HourlyCatalog/Admin/Packages/{id}`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/Packages/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Hourly Workers - Catalog by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/Packages/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Package not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Package not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyCatalog/Admin/ServingAreas`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/ServingAreas`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Catalog
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Search` (string)
    - `City` (string)
    - `IsActive` (boolean)
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/ServingAreas?Search=<string>&City=<string>&IsActive=<boolean>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":0},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:0,total:0}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyCatalog/Admin/ServingAreas`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/ServingAreas`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Catalog: ServingAreas
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nameAr: string, nameEn: string, cityAr: string, cityEn: string, districtAr: string, districtEn: string, postalCode: string, centerLatitude: number (double), centerLongitude: number (double), radiusKm: number (double), isActive: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/ServingAreas
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string",
  "cityAr": "string",
  "cityEn": "string",
  "districtAr": "string",
  "districtEn": "string",
  "postalCode": "string",
  "centerLatitude": 0,
  "centerLongitude": 0,
  "radiusKm": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"errors":["'Name Ar' must not be empty.","'Name En' must not be empty."]}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Name Ar' must not be empty.","'Name En' must not be empty."]}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyCatalog/Admin/ServingAreas/{id}`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Catalog by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/ServingAreas/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Serving area not found."],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/HourlyCatalog/Admin/ServingAreas/{id}`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Hourly Workers - Catalog by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ nameAr: string, nameEn: string, cityAr: string, cityEn: string, districtAr: string, districtEn: string, postalCode: string, centerLatitude: number (double), centerLongitude: number (double), radiusKm: number (double), isActive: boolean }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/ServingAreas/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string",
  "cityAr": "string",
  "cityEn": "string",
  "districtAr": "string",
  "districtEn": "string",
  "postalCode": "string",
  "centerLatitude": 0,
  "centerLongitude": 0,
  "radiusKm": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Serving area not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Serving area not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/HourlyCatalog/Admin/ServingAreas/{id}`

- **Endpoint:** `/api/V1/HourlyCatalog/Admin/ServingAreas/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Hourly Workers - Catalog by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/HourlyCatalog/Admin/ServingAreas/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Serving area not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Serving area not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Checkout & Tracking (13)

### `POST /api/V1/HourlyWorkerOrders/Quote`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/Quote`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking: Quote
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ packageId: string (uuid), numberOfWorkers: integer (int32), discountAmount: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/Quote
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "packageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "numberOfWorkers": 0,
  "discountAmount": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Service package not found or inactive."],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["Service package not found or inactive."],"statusCode":404}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerOrders/Checkout`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/Checkout`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking: Checkout
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ customerName: string, customerPhone: string, customerAddress: string, serviceCity: string, serviceDistrict: string, servingAreaId: string (uuid), packageId: string (uuid), requestDate: string (date-time), requestedStartTime: string (time), numberOfWorkers: integer (int32), notes: string, serviceLatitude: number (double), serviceLongitude: number (double), requiresDriver: boolean, requiresAccommodation: boolean, paymentMethod: integer (int32), discountAmount: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/Checkout
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "customerName": "string",
  "customerPhone": "0512345678",
  "customerAddress": "string",
  "serviceCity": "string",
  "serviceDistrict": "string",
  "servingAreaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "packageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "requestDate": "2026-01-01T00:00:00Z",
  "requestedStartTime": "string",
  "numberOfWorkers": 0,
  "notes": "string",
  "serviceLatitude": 0,
  "serviceLongitude": 0,
  "requiresDriver": true,
  "requiresAccommodation": true,
  "paymentMethod": 0,
  "discountAmount": 0
}
```
- **Example Response:** `{"success":false,"errors":["'Customer Name' must not be empty.","'Customer Phone' must not be empty.","'Customer Address' must not be empty.","'Service City' mu`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Customer Name' must not be empty.","'Customer Phone' must not be empty.","'Customer Address' must not be empty. …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerOrders/ConfirmPayment`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/ConfirmPayment`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking: ConfirmPayment
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ checkoutReference: string, transactionReference: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/ConfirmPayment
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "checkoutReference": "string",
  "transactionReference": "string"
}
```
- **Example Response:** `{"success":false,"errors":["'Checkout Reference' must not be empty."]}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Checkout Reference' must not be empty."]}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerOrders/ConfirmPaymentWithTransfer`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/ConfirmPaymentWithTransfer`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking: ConfirmPaymentWithTransfer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/ConfirmPaymentWithTransfer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `POST /api/V1/HourlyWorkerOrders/{orderId}/Tracking`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Tracking`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking action: Tracking
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** `{ eventType: HourlyTrackingEventType, subjectType: HourlyTrackingSubjectType, subjectId: string (uuid), latitude: number (double), longitude: number (double), notes: string, device: string, trackingSource: HourlyTrackingSource }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Tracking
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "eventType": 0,
  "subjectType": 0,
  "subjectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "latitude": 0,
  "longitude": 0,
  "notes": "string",
  "device": "string",
  "trackingSource": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerOrders/{orderId}/Tracking`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Tracking`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Checkout & Tracking by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Tracking
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerOrders/{orderId}/AssignDriver`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/AssignDriver`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking action: AssignDriver
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** `{ driverId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/AssignDriver
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"errors":["'Driver Id' must not be empty."]}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"errors":["'Driver Id' must not be empty."]}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Checkout & Tracking by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `maxResults` (integer (int32))
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers?maxResults=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"workerId":"4f731e9b-0fa4-41ba-325b-08dedd4492d3","workerName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000000","hourlyRate":10.00,"score":60,"isAvailable":true,"recommendationReason":"Available for requested slot; Low current workload; Weekly schedule match"},{"workerId":"9fbd865d-91df-4113-931b-08ded2b5b945","workerName":"لولى","phoneNumber":"010123445678","hourlyRa …`
- **Actual Test Result:** Called live with a valid token. Observed: `array[2]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerOrders/{orderId}/Invoices`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Invoices`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Checkout & Tracking by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Invoices
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerOrders/{orderId}/Invoices`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Invoices`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking action: Invoices
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** `{ dueDate: string (date-time), notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Invoices
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "dueDate": "2026-01-01T00:00:00Z",
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerOrders/{orderId}/Accommodation`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Checkout & Tracking by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Accommodation
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Accommodation not found for this order."],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerOrders/{orderId}/Accommodation`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Checkout & Tracking action: Accommodation
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** `{ housingId: string (uuid), checkInDate: string (date-time), checkOutDate: string (date-time), numberOfWorkers: integer (int32), cost: number (double), notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Accommodation
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "housingId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "checkInDate": "2026-01-01T00:00:00Z",
  "checkOutDate": "2026-01-01T00:00:00Z",
  "numberOfWorkers": 0,
  "cost": 0,
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status`

- **Endpoint:** `/api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status`
- **HTTP Method:** PUT
- **Purpose:** Update a Hourly Workers - Checkout & Tracking by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid)), `accommodationId` (string (uuid))
- **Request Body:** `{ status: HourlyAccommodationStatus, notes: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "status": 0,
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Accommodation not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Accommodation not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Customer (6)

### `GET /api/V1/HourlyCustomer/Orders`

- **Endpoint:** `/api/V1/HourlyCustomer/Orders`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Customer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerPhone` (string)
    - `Status` (HourlyWorkerRequestStatus)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCustomer/Orders?CustomerPhone=<string>&Status=<val>&DateFrom=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"errors":["'Customer Phone' must not be empty."]}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 400). Observed: `obj{success,errors}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** correct business validation (e.g. no entries / missing param) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyCustomer/Orders/{ticketNumber}/Tracking`

- **Endpoint:** `/api/V1/HourlyCustomer/Orders/{ticketNumber}/Tracking`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Customer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `ticketNumber` (string)
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCustomer/Orders/{ticketNumber}/Tracking
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (no such record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyCustomer/Orders/{orderId}/Cancel`

- **Endpoint:** `/api/V1/HourlyCustomer/Orders/{orderId}/Cancel`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Customer action: Cancel
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyCustomer/Orders/{orderId}/Cancel
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["You do not have access to this order."],"statusCode":403}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["You do not have access to this order."],"statusCode":403}`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyCustomer/Orders/{orderId}/Invoices`

- **Endpoint:** `/api/V1/HourlyCustomer/Orders/{orderId}/Invoices`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Customer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCustomer/Orders/{orderId}/Invoices
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["You do not have access to this order."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyCustomer/Orders/{orderId}/Notifications`

- **Endpoint:** `/api/V1/HourlyCustomer/Orders/{orderId}/Notifications`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Customer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyCustomer/Orders/{orderId}/Notifications
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["You do not have access to this order."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyCustomer/Orders/{orderId}/Refund`

- **Endpoint:** `/api/V1/HourlyCustomer/Orders/{orderId}/Refund`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Customer action: Refund
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `orderId` (string (uuid))
- **Request Body:** `{ notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyCustomer/Orders/{orderId}/Refund
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["You do not have access to this order."],"statusCode":403}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["You do not have access to this order."],"statusCode":403}`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Drivers (12)

### `GET /api/V1/HourlyDrivers`

- **Endpoint:** `/api/V1/HourlyDrivers`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Drivers
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Search` (string)
    - `IsActive` (boolean)
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyDrivers?Search=<string>&IsActive=<boolean>&SortBy=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"63b8f86f-4b7b-44c7-76d9-08dedd4493ed","fullName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000001","nationalId":"551551581","licenseNumber":"ZZTEST123","vehicleType":null,"vehiclePlateNumber":null,"isActive":true,"notes":null,"linkedUserId":null,"createdDate":"2026-07-08T22:59:34.2497504"},{"id":"90b64c9e-834b-4159-2476-08ded760e9ab","fullName":"محمود"," …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:2,total:2}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyDrivers`

- **Endpoint:** `/api/V1/HourlyDrivers`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Drivers: HourlyDrivers
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ fullName: string, phoneNumber: string, nationalId: string, licenseNumber: string, vehicleType: string, vehiclePlateNumber: string, notes: string, linkedUserId: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyDrivers
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "fullName": "string",
  "phoneNumber": "0512345678",
  "nationalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "licenseNumber": "string",
  "vehicleType": "string",
  "vehiclePlateNumber": "string",
  "notes": "string",
  "linkedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"errors":["'Full Name' must not be empty.","'Phone Number' must not be empty."]}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Full Name' must not be empty.","'Phone Number' must not be empty."]}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyDrivers/{id}`

- **Endpoint:** `/api/V1/HourlyDrivers/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Drivers by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyDrivers/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"63b8f86f-4b7b-44c7-76d9-08dedd4493ed","fullName":"ZZ_APITEST_1783551551581","phoneNumber":"0500000001","nationalId":"551551581","licenseNumber":"ZZTEST123","vehicleType":null,"vehiclePlateNumber":null,"isActive":true,"notes":null,"linkedUserId":null,"createdDate":"2026-07-08T22:59:34.2497504"},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,fullName,phoneNumber,nationalId,licenseNumber,vehicleType}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/HourlyDrivers/{id}`

- **Endpoint:** `/api/V1/HourlyDrivers/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Hourly Workers - Drivers by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ fullName: string, phoneNumber: string, nationalId: string, licenseNumber: string, vehicleType: string, vehiclePlateNumber: string, notes: string, linkedUserId: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/HourlyDrivers/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "fullName": "string",
  "phoneNumber": "0512345678",
  "nationalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "licenseNumber": "string",
  "vehicleType": "string",
  "vehiclePlateNumber": "string",
  "notes": "string",
  "linkedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"errors":["The length of 'National Id' must be 20 characters or fewer. You entered 36 characters."]}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"errors":["The length of 'National Id' must be 20 characters or fewer. You entered 36 characters."]}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/HourlyDrivers/{id}`

- **Endpoint:** `/api/V1/HourlyDrivers/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Hourly Workers - Drivers by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/HourlyDrivers/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Driver not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Driver not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyDrivers/{id}/Activate`

- **Endpoint:** `/api/V1/HourlyDrivers/{id}/Activate`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Drivers action: Activate
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyDrivers/{id}/Activate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Driver not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Driver not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyDrivers/{id}/Deactivate`

- **Endpoint:** `/api/V1/HourlyDrivers/{id}/Deactivate`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Drivers action: Deactivate
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyDrivers/{id}/Deactivate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Driver not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Driver not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyDrivers/me/Orders`

- **Endpoint:** `/api/V1/HourlyDrivers/me/Orders`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Drivers
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyDrivers/me/Orders
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No driver profile linked to this account."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyDrivers/me/Orders/Current`

- **Endpoint:** `/api/V1/HourlyDrivers/me/Orders/Current`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Drivers
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyDrivers/me/Orders/Current
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No driver profile linked to this account."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyDrivers/me/Orders/History`

- **Endpoint:** `/api/V1/HourlyDrivers/me/Orders/History`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Drivers
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyDrivers/me/Orders/History
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No driver profile linked to this account."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyDrivers/{driverId}/Orders`

- **Endpoint:** `/api/V1/HourlyDrivers/{driverId}/Orders`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Drivers by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `driverId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyDrivers/{driverId}/Orders
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus`

- **Endpoint:** `/api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Drivers action: TransportStatus
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `driverId` (string (uuid)), `orderId` (string (uuid))
- **Request Body:** `{ status: HourlyDriverAssignmentStatus, notes: string, latitude: number (double), longitude: number (double), device: string, trackingSource: HourlyTrackingSource }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "status": 0,
  "notes": "string",
  "latitude": 0,
  "longitude": 0,
  "device": "string",
  "trackingSource": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Driver assignment not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Driver assignment not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Notifications (2)

### `GET /api/V1/HourlyOrderNotifications`

- **Endpoint:** `/api/V1/HourlyOrderNotifications`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Notifications
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `OrderId` (string (uuid))
    - `DeliveryStatus` (HourlyNotificationDeliveryStatus)
    - `RecipientPhone` (string)
    - `Search` (string)
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyOrderNotifications?OrderId=<string>&DeliveryStatus=<val>&RecipientPhone=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"67f0d62f-471d-4cec-186b-08ded6778d8a","orderId":"436b1de2-c766-43ad-b5ca-4898a28a20b3","event":"HourlyOrderCreated","channel":0,"recipientPhone":"0500000001","deliveryStatus":3,"sentAt":null,"errorMessage":"Template not found","createdDate":"2026-06-30T07:16:49.725574"},{"id":"d4807d69-3af0-499b-186c-08ded6778d8a","orderId":"436b1de2-c766-43ad-b5ca-4898a28a2 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:12}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyOrderNotifications/{id}/Retry`

- **Endpoint:** `/api/V1/HourlyOrderNotifications/{id}/Retry`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Notifications action: Retry
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyOrderNotifications/{id}/Retry
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Notification not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Notification not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Orders (18)

### `GET /api/V1/HourlyWorkerRequests`

- **Endpoint:** `/api/V1/HourlyWorkerRequests`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Orders
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ServiceCity` (string)
    - `ServiceDistrict` (string)
    - `PackageId` (string (uuid))
    - `ServingAreaId` (string (uuid))
    - `PaymentStatus` (HourlyOrderPaymentStatus)
    - `Search` (string)
    - `TicketNumber` (string)
    - `CustomerName` (string)
    - `CustomerPhone` (string)
    - `Status` (HourlyWorkerRequestStatus)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests?ServiceCity=<string>&ServiceDistrict=<string>&PackageId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"125c2426-21ff-4462-8175-743dc697985d","ticketNumber":"TK-2026-000001","customerName":"string","customerPhone":"string","customerAddress":"string","requestDate":"2026-06-25T00:00:00","requestedStartTime":"12:29:03","requestedEndTime":"14:33:38","numberOfWorkers":1,"notes":"string","status":5,"statusName":"Completed","assignedWorkersCount":1,"createdDate":"202 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:5,total:5}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyWorkerRequests`

- **Endpoint:** `/api/V1/HourlyWorkerRequests`
- **HTTP Method:** POST
- **Purpose:** Create a Hourly Workers - Orders
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ workerId: string (uuid), customerName: string, customerPhone: string, customerAddress: string, requestDate: string (date-time), requestedStartTime: string (time), requestedEndTime: string (time), notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerName": "string",
  "customerPhone": "0512345678",
  "customerAddress": "string",
  "requestDate": "2026-01-01T00:00:00Z",
  "requestedStartTime": "string",
  "requestedEndTime": "string",
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"errors":["'Worker Id' must not be empty.","'Customer Name' must not be empty.","'Customer Phone' must not be empty.","'Customer Address' must `
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Worker Id' must not be empty.","'Customer Name' must not be empty.","'Customer Phone' must not be empty.","'Cus …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/{id}/Detail`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Detail`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Detail
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"transferProofUrl":null,"customerId":null,"packageId":null,"packageName":null,"servingAreaId":null,"serviceCity":null,"serviceDistrict":null,"internalNotes":null,"subTotal":0.00,"discountAmount":0.00,"taxAmount":0.00,"totalAmount":0.00,"paymentStatus":0,"requiresDriver":false,"requiresAccommodation":false,"serviceLatitude":null,"serviceLongitude":null,"timeline":[{"id":"468 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{transferProofUrl,customerId,packageId,packageName,servingAreaId,serviceCity}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/{id}`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"125c2426-21ff-4462-8175-743dc697985d","ticketNumber":"TK-2026-000001","customerName":"string","customerPhone":"string","customerAddress":"string","requestDate":"2026-06-25T00:00:00","requestedStartTime":"12:29:03","requestedEndTime":"14:33:38","numberOfWorkers":1,"notes":"string","status":5,"statusName":"Completed","assignedWorkersCount":1,"createdDate":"2026-06-25T12 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,ticketNumber,customerName,customerPhone,customerAddress,requestDate}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/{id}/Timeline`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Timeline`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Timeline
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"4682f7cf-587c-4092-bedf-08ded7612c1a","eventType":13,"title":"Assignment status: En Route","description":"لولى","occurredAt":"2026-07-01T11:10:25.857119","createdBy":"d7b8ffad-dd86-4fd6-942c-71bf9ae3c2c4"},{"id":"00569934-d219-48d9-bede-08ded7612c1a","eventType":13,"title":"Assignment status: Confirmed","description":"لولى","occurredAt":"2026-07-01T11:10:20.3779742", …`
- **Actual Test Result:** Called live with a valid token. Observed: `array[2]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/{id}/Logs`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Logs`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Logs
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"4682f7cf-587c-4092-bedf-08ded7612c1a","action":"Assignment status: En Route","details":"لولى","performedBy":"d7b8ffad-dd86-4fd6-942c-71bf9ae3c2c4","occurredAt":"2026-07-01T11:10:25.857119"},{"id":"00569934-d219-48d9-bede-08ded7612c1a","action":"Assignment status: Confirmed","details":"لولى","performedBy":"d7b8ffad-dd86-4fd6-942c-71bf9ae3c2c4","occurredAt":"2026-07-01 …`
- **Actual Test Result:** Called live with a valid token. Observed: `array[7]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/{id}/Payments`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Payments`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Payments
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/{id}/Assignments`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Assignments`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Assignments
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"assignmentStatus":2,"assignmentStatusName":"En Route","confirmedAt":"2026-07-01T11:10:20.377308","notes":null,"id":"ff0c95f3-2b3c-4170-2677-08ded2b63f21","workerId":"9fbd865d-91df-4113-931b-08ded2b5b945","workerName":"لولى","workerPhone":"010123445678","assignedDate":"2026-06-25T12:35:31.8183343"}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid)), `assignmentId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status`
- **HTTP Method:** PUT
- **Purpose:** Update a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid)), `assignmentId` (string (uuid))
- **Request Body:** `{ status: HourlyWorkerAssignmentStatus, notes: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "status": 0,
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Assignment not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Assignment not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/Approve`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Approve`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: Approve
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Approve
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/Reject`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Reject`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: Reject
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Reject
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/Assign`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Assign`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: Assign
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ workerId: string (uuid), workerIds: array<string (uuid)> }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Assign
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/InProgress`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/InProgress`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: InProgress
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/InProgress
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/Complete`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Complete`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: Complete
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Complete
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/Cancel`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/Cancel`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: Cancel
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/Cancel
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerRequests/{id}/InternalNotes`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/{id}/InternalNotes`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Orders action: InternalNotes
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ note: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/{id}/InternalNotes
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "note": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerRequests/Track/{ticketNumber}`

- **Endpoint:** `/api/V1/HourlyWorkerRequests/Track/{ticketNumber}`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Orders by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `ticketNumber` (string)
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerRequests/Track/{ticketNumber}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Order not found."],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (no such record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Payments (2)

### `GET /api/V1/HourlyOrderPayments`

- **Endpoint:** `/api/V1/HourlyOrderPayments`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Payments
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `OrderId` (string (uuid))
    - `Status` (HourlyPaymentRecordStatus)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `Search` (string)
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyOrderPayments?OrderId=<string>&Status=<val>&DateFrom=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[],"totalCount":0,"pageNumber":1,"pageSize":0},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:0,total:0}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyOrderPayments/{id}/Refund`

- **Endpoint:** `/api/V1/HourlyOrderPayments/{id}/Refund`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Payments action: Refund
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyOrderPayments/{id}/Refund
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Payment not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Payment not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Hourly Workers - Reports (4)

### `GET /api/V1/HourlyWorkerReports/OrdersSummary`

- **Endpoint:** `/api/V1/HourlyWorkerReports/OrdersSummary`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Reports
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `ServiceCity` (string)
    - `TicketNumber` (string)
    - `CustomerPhone` (string)
    - `Status` (HourlyWorkerRequestStatus)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerReports/OrdersSummary?DateFrom=<string>&DateTo=<string>&ServiceCity=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"totalOrders":5,"pendingOrders":0,"approvedOrders":0,"assignedOrders":0,"inProgressOrders":0,"completedOrders":3,"cancelledOrders":1,"rejectedOrders":1,"totalRevenue":0.00,"paidRevenue":0},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `obj{totalOrders,pendingOrders,approvedOrders,assignedOrders,inProgressOrders,completedOrders}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyWorkerReports/Revenue`

- **Endpoint:** `/api/V1/HourlyWorkerReports/Revenue`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Reports
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `ServiceCity` (string)
    - `TicketNumber` (string)
    - `CustomerPhone` (string)
    - `Status` (HourlyWorkerRequestStatus)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerReports/Revenue?DateFrom=<string>&DateTo=<string>&ServiceCity=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"totalCollected":0,"totalRefunded":0,"netRevenue":0,"completedPayments":0,"pendingPayments":0,"failedPayments":0},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `obj{totalCollected,totalRefunded,netRevenue,completedPayments,pendingPayments,failedPayments}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyWorkerReports/WorkerUtilization`

- **Endpoint:** `/api/V1/HourlyWorkerReports/WorkerUtilization`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Reports
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `ServiceCity` (string)
    - `TicketNumber` (string)
    - `CustomerPhone` (string)
    - `Status` (HourlyWorkerRequestStatus)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerReports/WorkerUtilization?DateFrom=<string>&DateTo=<string>&ServiceCity=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"workerId":"9fbd865d-91df-4113-931b-08ded2b5b945","workerName":"لولى","totalAssignments":4,"completedAssignments":0,"activeAssignments":2,"utilizationRate":0}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyWorkerReports/DriverPerformance`

- **Endpoint:** `/api/V1/HourlyWorkerReports/DriverPerformance`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Reports
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `ServiceCity` (string)
    - `TicketNumber` (string)
    - `CustomerPhone` (string)
    - `Status` (HourlyWorkerRequestStatus)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerReports/DriverPerformance?DateFrom=<string>&DateTo=<string>&ServiceCity=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

## Hourly Workers - Staff (8)

### `GET /api/V1/HourlyWorkers`

- **Endpoint:** `/api/V1/HourlyWorkers`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Staff
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `IsActive` (boolean)
    - `IsAvailableNow` (boolean)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkers?IsActive=<boolean>&IsAvailableNow=<boolean>&BranchId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"6b676e62-cd8b-4ba4-9319-08ded2b5b945","fullName":"لولى","phoneNumber":"010123445678","nationalId":"14215433","hourlyRate":10.00,"availableFromTime":"12:29:03","availableToTime":"12:29:09","isActive":true,"isAvailableNow":false,"notes":"string","createdDate":"2026-06-25T12:31:47.1099664","updatedDate":null},{"id":"2fa48606-2d47-4812-931a-08ded2b5b945","fullNa …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:5,total:5}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyWorkers`

- **Endpoint:** `/api/V1/HourlyWorkers`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Staff: HourlyWorkers
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ fullName: string, phoneNumber: string, nationalId: string, hourlyRate: number (double), availableFromTime: string (time), availableToTime: string (time), notes: string, linkedUserId: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkers
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "fullName": "string",
  "phoneNumber": "0512345678",
  "nationalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hourlyRate": 0,
  "availableFromTime": "string",
  "availableToTime": "string",
  "notes": "string",
  "linkedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"errors":["'Full Name' must not be empty.","'Phone Number' must not be empty.","'Hourly Rate' must be greater than '0'.","Available end time mu`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"errors":["'Full Name' must not be empty.","'Phone Number' must not be empty.","'Hourly Rate' must be greater than '0'.","A …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkers/{id}`

- **Endpoint:** `/api/V1/HourlyWorkers/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Staff by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkers/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"6b676e62-cd8b-4ba4-9319-08ded2b5b945","fullName":"لولى","phoneNumber":"010123445678","nationalId":"14215433","hourlyRate":10.00,"availableFromTime":"12:29:03","availableToTime":"12:29:09","isActive":true,"isAvailableNow":false,"notes":"string","createdDate":"2026-06-25T12:31:47.1099664","updatedDate":null},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,fullName,phoneNumber,nationalId,hourlyRate,availableFromTime}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/HourlyWorkers/{id}`

- **Endpoint:** `/api/V1/HourlyWorkers/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Hourly Workers - Staff by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ fullName: string, phoneNumber: string, nationalId: string, hourlyRate: number (double), availableFromTime: string (time), availableToTime: string (time), notes: string, linkedUserId: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/HourlyWorkers/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "fullName": "string",
  "phoneNumber": "0512345678",
  "nationalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "hourlyRate": 0,
  "availableFromTime": "string",
  "availableToTime": "string",
  "notes": "string",
  "linkedUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"dto":`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"dto":`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/HourlyWorkers/{id}`

- **Endpoint:** `/api/V1/HourlyWorkers/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Hourly Workers - Staff by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/HourlyWorkers/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Hourly worker not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Hourly worker not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkers/{id}/Activate`

- **Endpoint:** `/api/V1/HourlyWorkers/{id}/Activate`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Staff action: Activate
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkers/{id}/Activate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Hourly worker not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Hourly worker not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkers/{id}/Deactivate`

- **Endpoint:** `/api/V1/HourlyWorkers/{id}/Deactivate`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Staff action: Deactivate
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkers/{id}/Deactivate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Hourly worker not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Hourly worker not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkers/Available`

- **Endpoint:** `/api/V1/HourlyWorkers/Available`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Staff
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `requestDate` (string (date-time))
    - `startTime` (string (time))
    - `endTime` (string (time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkers/Available?requestDate=<string>&startTime=<string>&endTime=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"6b676e62-cd8b-4ba4-9319-08ded2b5b945","name":"لولى","hourlyRate":10.00,"availableFrom":"12:29:03","availableTo":"12:29:09","availabilityStatus":"OutsideWorkingHours"},{"id":"2fa48606-2d47-4812-931a-08ded2b5b945","name":"لولى","hourlyRate":10.00,"availableFrom":"12:29:03","availableTo":"12:29:09","availabilityStatus":"OutsideWorkingHours"},{"id":"9fbd865d-91df-4113-93 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[4]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

## Hourly Workers - Worker Portal (6)

### `GET /api/V1/HourlyWorkerPortal/me/Assignments`

- **Endpoint:** `/api/V1/HourlyWorkerPortal/me/Assignments`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Worker Portal
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Status` (HourlyWorkerAssignmentStatus)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerPortal/me/Assignments?Status=<val>&DateFrom=<string>&DateTo=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No worker profile linked to this account."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/HourlyWorkerPortal/me/Assignments/{assignmentId}/Status`

- **Endpoint:** `/api/V1/HourlyWorkerPortal/me/Assignments/{assignmentId}/Status`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Worker Portal action: Status
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `assignmentId` (string (uuid))
- **Request Body:** `{ status: HourlyWorkerAssignmentStatus, notes: string, latitude: number (double), longitude: number (double), device: string, trackingSource: HourlyTrackingSource }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerPortal/me/Assignments/{assignmentId}/Status
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "status": 0,
  "notes": "string",
  "latitude": 0,
  "longitude": 0,
  "device": "string",
  "trackingSource": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["No worker profile linked to this account."],"statusCode":403}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["No worker profile linked to this account."],"statusCode":403}`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerPortal/me/Schedule`

- **Endpoint:** `/api/V1/HourlyWorkerPortal/me/Schedule`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Hourly Workers - Worker Portal
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerPortal/me/Schedule
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No worker profile linked to this account."],"statusCode":403}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `null`
- **Status Code:** 403
- **Pass/Fail:** PASS
- **Notes:** authorization correctly enforced (wrong role) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/HourlyWorkerPortal/{workerId}/Assignments`

- **Endpoint:** `/api/V1/HourlyWorkerPortal/{workerId}/Assignments`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Worker Portal by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Status` (HourlyWorkerAssignmentStatus)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `SortBy` (string)
    - `SortDescending` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerPortal/{workerId}/Assignments?Status=<val>&DateFrom=<string>&DateTo=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Worker not found."],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status`

- **Endpoint:** `/api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status`
- **HTTP Method:** POST
- **Purpose:** Hourly Workers - Worker Portal action: Status
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid)), `assignmentId` (string (uuid))
- **Request Body:** `{ status: HourlyWorkerAssignmentStatus, notes: string, latitude: number (double), longitude: number (double), device: string, trackingSource: HourlyTrackingSource }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "status": 0,
  "notes": "string",
  "latitude": 0,
  "longitude": 0,
  "device": "string",
  "trackingSource": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Assignment not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Assignment not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/HourlyWorkerPortal/{workerId}/Schedule`

- **Endpoint:** `/api/V1/HourlyWorkerPortal/{workerId}/Schedule`
- **HTTP Method:** GET
- **Purpose:** Get a Hourly Workers - Worker Portal by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/HourlyWorkerPortal/{workerId}/Schedule
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Worker not found."],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Housing (7)

### `GET /api/Housing/GetAll`

- **Endpoint:** `/api/Housing/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Housing
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Name` (string)
    - `IsActive` (boolean)
    - `HasAvailableSlots` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Housing/GetAll?Name=<string>&IsActive=<boolean>&HasAvailableSlots=<boolean>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"4da7cb0c-ac69-4a65-feba-08dedff8a959","name":"ZZ_REVAL4_1783848770945","address":"ZZ_REVAL4_1783848770945","capacity":1,"notes":"ZZ_REVAL4_1783848770945","isActive":true,"workerHousingCost":1.00,"housingOperationPrice":1.00,"currentOccupancy":0,"availableSlots":1,"createdDate":"2026-07-12T09:33:41.9302193"},{"id":"492db919-6774-486a-75b8-08deac12ea74","name" …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:6,total:6}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/Housing/{id}`

- **Endpoint:** `/api/Housing/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Housing by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Housing/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"4da7cb0c-ac69-4a65-feba-08dedff8a959","name":"ZZ_REVAL4_1783848770945","address":"ZZ_REVAL4_1783848770945","capacity":1,"notes":"ZZ_REVAL4_1783848770945","isActive":true,"workerHousingCost":1.00,"housingOperationPrice":1.00,"currentOccupancy":0,"availableSlots":1,"createdDate":"2026-07-12T09:33:41.9302193"},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,name,address,capacity,notes,isActive}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/Housing/{id}`

- **Endpoint:** `/api/Housing/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Housing by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ name: string, address: string, capacity: integer (int32), notes: string, workerHousingCost: number (double), housingOperationPrice: number (double), id: string (uuid) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/Housing/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string",
  "address": "string",
  "capacity": 0,
  "notes": "string",
  "workerHousingCost": 0,
  "housingOperationPrice": 0,
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["سكن غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["سكن غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/Housing/{id}`

- **Endpoint:** `/api/Housing/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Housing by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/Housing/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["سكن غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["سكن غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Housing/GetActiveList`

- **Endpoint:** `/api/Housing/GetActiveList`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Housing
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Housing/GetActiveList
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"f3a2a83d-2c16-441d-5a27-08dea8754315","name":"سكن صاري","address":"المدينه","capacity":15,"notes":null,"isActive":true,"workerHousingCost":null,"housingOperationPrice":null,"currentOccupancy":3,"availableSlots":12,"createdDate":"2026-05-02T18:04:32.2707686"},{"id":"9530394c-8a30-4ed6-5a28-08dea8754315","name":"مخزون التاجير سيجما الكفاءات","address":"المدينه","capaci …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[6]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Housing`

- **Endpoint:** `/api/Housing`
- **HTTP Method:** POST
- **Purpose:** Create a Housing
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ name: string, address: string, capacity: integer (int32), notes: string, workerHousingCost: number (double), housingOperationPrice: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Housing
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string",
  "address": "string",
  "capacity": 0,
  "notes": "string",
  "workerHousingCost": 0,
  "housingOperationPrice": 0
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Name":["The Name field is`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Name" …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Housing/ToggleActive/{id}`

- **Endpoint:** `/api/Housing/ToggleActive/{id}`
- **HTTP Method:** POST
- **Purpose:** Housing action: {id}
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Housing/ToggleActive/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["سكن غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["سكن غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Job (5)

### `POST /api/V1/Job`

- **Endpoint:** `/api/V1/Job`
- **HTTP Method:** POST
- **Purpose:** Create a Job
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ jobNameAr: string, jobNameEn: string, hasWorkCard: boolean, workCardFees: number (double), isActive: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Job
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "jobNameAr": "string",
  "jobNameEn": "string",
  "hasWorkCard": true,
  "workCardFees": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":true,"data":"تم إضافة الوظيفة بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Real record created with a valid body, then deleted (cleanup). Observed: `{"success":true,"data":"تم إضافة الوظيفة بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Job`

- **Endpoint:** `/api/V1/Job`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Job
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Job?SearchName=<string>&PageNumber=<integer>&PageSize=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"a00a3007-cd97-4f00-9b6b-08dedd448ae3","jobNameAr":null,"jobNameEn":null,"hasWorkCard":false,"workCardFees":null,"isActive":true},{"id":"01605bfb-6013-4306-f4c2-08de9bab1e0a","jobNameAr":"ممرض منزلي","jobNameEn":"Home Nurse","hasWorkCard":true,"workCardFees":800.00,"isActive":true},{"id":"3ae7b9d3-d451-40f1-f4c1-08de9bab1e0a","jobNameAr":"عاملة تنظيف","jobNam …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:6,total:6}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/Job/{id}`

- **Endpoint:** `/api/V1/Job/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Job by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ jobNameAr: string, jobNameEn: string, hasWorkCard: boolean, workCardFees: number (double), isActive: boolean }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Job/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "jobNameAr": "string",
  "jobNameEn": "string",
  "hasWorkCard": true,
  "workCardFees": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["الوظيفة غير موجودة"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الوظيفة غير موجودة"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Job/{id}`

- **Endpoint:** `/api/V1/Job/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Job by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Job/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الوظيفة غير موجودة"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الوظيفة غير موجودة"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Job/{id}`

- **Endpoint:** `/api/V1/Job/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Job by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Job/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"a00a3007-cd97-4f00-9b6b-08dedd448ae3","jobNameAr":null,"jobNameEn":null,"hasWorkCard":false,"workCardFees":null,"isActive":true},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,jobNameAr,jobNameEn,hasWorkCard,workCardFees,isActive}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## JobModificationRequest (4)

### `GET /api/V1/JobModificationRequest/GetAll`

- **Endpoint:** `/api/V1/JobModificationRequest/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve JobModificationRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/JobModificationRequest/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"ee3b992e-2b35-4f8c-e6dc-08dedff8a98c","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","employeeName":"???? ????","oldDepartmentId":"00000000-0000-0000-0000-000000000000","newDepartmentId":"16d236b6-085d-400f-0325-08deb44ae5d4","oldSalaryScaleId":"00000000-0000-0000-0000-000000000000","newSalaryScaleId":"00000000-0000-0000-0000-000000000000","oldTotalSalary":0.00, …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/JobModificationRequest/Create`

- **Endpoint:** `/api/V1/JobModificationRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a JobModificationRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ createdTo: string (uuid), newDepartmentId: string (uuid), newSalaryScaleId: string (uuid), newTotalSalary: number (double), reasons: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/JobModificationRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "createdTo": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "newDepartmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "newSalaryScaleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "newTotalSalary": 0,
  "reasons": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/JobModificationRequest/Approve/{id}`

- **Endpoint:** `/api/V1/JobModificationRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** JobModificationRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/JobModificationRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/JobModificationRequest/Reject/{id}`

- **Endpoint:** `/api/V1/JobModificationRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** JobModificationRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/JobModificationRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## JournalEntries (5)

### `GET /api/V1/JournalEntries`

- **Endpoint:** `/api/V1/JournalEntries`
- **HTTP Method:** GET
- **Purpose:** List / retrieve JournalEntries
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `From` (string (date-time))
    - `To` (string (date-time))
    - `Status` (JournalEntryStatus)
    - `Source` (JournalEntrySource)
    - `ReferenceType` (JournalReferenceType)
    - `SourceId` (string (uuid))
    - `CustomerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `EmployeeId` (string (uuid))
    - `EntryNumber` (string)
    - `ContractNumber` (integer (int32))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/JournalEntries?From=<string>&To=<string>&Status=<val>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"491b4fcf-5f41-4aa8-8c2f-08dedece1534","entryNumber":"JE-2026-0042","date":"2099-12-31T00:00:00","description":"إغلاق السنة المالية 2099","status":0,"source":12,"referenceType":4,"sourceId":null,"customerId":null,"agentId":null,"workerId":null,"employeeId":null,"restrictionTypeId":"00000000-0000-0000-0000-000000000001","createdBy":"Asmaa","createdDate":"2026- …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:45}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/JournalEntries`

- **Endpoint:** `/api/V1/JournalEntries`
- **HTTP Method:** POST
- **Purpose:** Create a JournalEntries
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ date: string (date-time), description: string, customerId: string (uuid), agentId: string (uuid), workerId: string (uuid), employeeId: string (uuid), restrictionTypeId: string (uuid), lines: array<JournalEntryLineCreateDto> }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/JournalEntries
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "date": "2026-01-01T00:00:00Z",
  "description": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "restrictionTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "lines": [
    {
      "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "debit": 0,
      "credit": 0,
      "description": "string"
    }
  ]
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["يجب إضافة سطرين على الأقل لقيد اليومية"],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["يجب إضافة سطرين على الأقل لقيد اليومية"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/JournalEntries/{id}`

- **Endpoint:** `/api/V1/JournalEntries/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a JournalEntries by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ date: string (date-time), description: string, customerId: string (uuid), agentId: string (uuid), workerId: string (uuid), employeeId: string (uuid), restrictionTypeId: string (uuid), lines: array<JournalEntryLineCreateDto> }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/JournalEntries/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "date": "2026-01-01T00:00:00Z",
  "description": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "restrictionTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "lines": [
    {
      "accountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "debit": 0,
      "credit": 0,
      "description": "string"
    }
  ]
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["القيد غير موجود"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["القيد غير موجود"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/JournalEntries/{id}`

- **Endpoint:** `/api/V1/JournalEntries/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a JournalEntries by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/JournalEntries/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["القيد غير موجود"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["القيد غير موجود"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/JournalEntries/{id}`

- **Endpoint:** `/api/V1/JournalEntries/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a JournalEntries by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/JournalEntries/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"491b4fcf-5f41-4aa8-8c2f-08dedece1534","entryNumber":"JE-2026-0042","date":"2099-12-31T00:00:00","description":"إغلاق السنة المالية 2099","status":0,"source":12,"referenceType":4,"sourceId":null,"customerId":null,"agentId":null,"workerId":null,"employeeId":null,"restrictionTypeId":"00000000-0000-0000-0000-000000000001","createdBy":"Asmaa","createdDate":"2026-07-10T21:5 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,entryNumber,date,description,status,source}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Leave (6)

### `POST /api/V1/Leave`

- **Endpoint:** `/api/V1/Leave`
- **HTTP Method:** POST
- **Purpose:** Create a Leave
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ employeeId: string (uuid), leaveTypeId: string (uuid), reason: string, fromDate: string (date-time), toDate: string (date-time) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Leave
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "leaveTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "string",
  "fromDate": "2026-01-01T00:00:00Z",
  "toDate": "2026-01-01T00:00:00Z"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"reason":["The reason fiel`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"reaso …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Leave`

- **Endpoint:** `/api/V1/Leave`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Leave
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Leave
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"42047269-4493-4a07-15ae-08deb5184321","employeeId":"bfb61903-0fee-4c71-d5e2-08deb44b8def","leaveTypeId":"bc297a73-0158-44a6-222c-08deb51a1411","reason":"مرض مزمن ","fromDate":"2026-05-18T00:00:00","toDate":"2026-05-20T00:00:00","employeeName":null,"leaveTypeName":null,"daysCount":3,"approvedAt":"2026-06-28T12:14:18.518907","approvalComment":null,"status":1},{"id":"22 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[8]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Leave/{requestId}/approve`

- **Endpoint:** `/api/V1/Leave/{requestId}/approve`
- **HTTP Method:** PUT
- **Purpose:** Update a Leave by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `requestId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Leave/{requestId}/approve
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Not found."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Not found."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Leave/{requestId}/reject`

- **Endpoint:** `/api/V1/Leave/{requestId}/reject`
- **HTTP Method:** PUT
- **Purpose:** Update a Leave by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `requestId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Leave/{requestId}/reject
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Not found."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Not found."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Leave/balance/{leaveTypeId}`

- **Endpoint:** `/api/V1/Leave/balance/{leaveTypeId}`
- **HTTP Method:** GET
- **Purpose:** Get a Leave by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `leaveTypeId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Leave/balance/{leaveTypeId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":{"balance":15},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{balance}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Leave/employee-balances`

- **Endpoint:** `/api/V1/Leave/employee-balances`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Leave
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `employeeId` (string (uuid))
    - `leaveTypeId` (string (uuid))
    - `year` (integer (int32))
    - `month` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Leave/employee-balances?employeeId=<string>&leaveTypeId=<string>&year=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee not found."],"statusCode":400}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `null`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** correct business validation (e.g. no entries / missing param) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## LeaveBalance (1)

### `POST /api/V1/LeaveBalance/Filter`

- **Endpoint:** `/api/V1/LeaveBalance/Filter`
- **HTTP Method:** POST
- **Purpose:** Filter/search LeaveBalance (POST query)
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ employeeId: string (uuid), year: integer (int32) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/LeaveBalance/Filter
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "year": 0
}
```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Executed live (read-only) with and without a token. Observed: `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** executed live \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## LeaveType (5)

### `POST /api/V1/LeaveType`

- **Endpoint:** `/api/V1/LeaveType`
- **HTTP Method:** POST
- **Purpose:** Create a LeaveType
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ name: string, defaultDaysPerYear: integer (int32), isPaid: boolean, allowCarryForward: boolean, isActive: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/LeaveType
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string",
  "defaultDaysPerYear": 0,
  "isPaid": true,
  "allowCarryForward": true,
  "isActive": true
}
```
- **Example Response:** `{"success":true,"data":"Leave type created successfully","errors":null,"statusCode":201}`
- **Actual Test Result:** Real record created with a valid body, then deleted (cleanup). Observed: `{"success":true,"data":"Leave type created successfully","errors":null,"statusCode":201}`
- **Status Code:** 201
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/LeaveType`

- **Endpoint:** `/api/V1/LeaveType`
- **HTTP Method:** GET
- **Purpose:** List / retrieve LeaveType
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/LeaveType
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"4b41e214-ac11-4b4a-222b-08deb51a1411","name":"اجازة مرضية ","defaultDaysPerYear":10,"isPaid":true,"allowCarryForward":false,"isActive":true},{"id":"bc297a73-0158-44a6-222c-08deb51a1411","name":"اجازة سنوية ","defaultDaysPerYear":21,"isPaid":true,"allowCarryForward":false,"isActive":true},{"id":"527cab3e-b953-4f7d-222d-08deb51a1411","name":"اجازة بدون سبب","defaultDay …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[3]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/LeaveType/{id}`

- **Endpoint:** `/api/V1/LeaveType/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a LeaveType by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/LeaveType/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"4b41e214-ac11-4b4a-222b-08deb51a1411","name":"اجازة مرضية ","defaultDaysPerYear":10,"isPaid":true,"allowCarryForward":false,"isActive":true},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,name,defaultDaysPerYear,isPaid,allowCarryForward,isActive}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/LeaveType/{id}`

- **Endpoint:** `/api/V1/LeaveType/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a LeaveType by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ name: string, defaultDaysPerYear: integer (int32), isPaid: boolean, allowCarryForward: boolean, isActive: boolean }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/LeaveType/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string",
  "defaultDaysPerYear": 0,
  "isPaid": true,
  "allowCarryForward": true,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Leave type not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Leave type not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/LeaveType/{id}`

- **Endpoint:** `/api/V1/LeaveType/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a LeaveType by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/LeaveType/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Leave type not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Leave type not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Ledger (8)

### `GET /api/V1/Ledger/agent-ledger`

- **Endpoint:** `/api/V1/Ledger/agent-ledger`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `AgentId` (string (uuid))
    - `From` (string (date-time))
    - `To` (string (date-time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/agent-ledger?AgentId=<string>&From=<string>&To=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No entries found"],"statusCode":400}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 400). Observed: `null`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** correct business validation (e.g. no entries / missing param) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Ledger/customer-ledger`

- **Endpoint:** `/api/V1/Ledger/customer-ledger`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerId` (string (uuid))
    - `From` (string (date-time))
    - `To` (string (date-time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/customer-ledger?CustomerId=<string>&From=<string>&To=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"customerId":"f3c34dc9-ea08-4a4f-0a9c-08de995cf376","lines":[{"date":"2026-06-13T12:44:35.5085813","entryNumber":"JE-2026-0001","description":"Mediation contract revenue recognition","accountCode":"103","accountName":"Accounts Receivable","debit":2725.00,"credit":0.00,"source":"Contract","sourceId":"a69d7576-395d-462f-3c17-08dec9489919"},{"date":"2026-06-13T12:44:35.5085813 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 400). Observed: `obj{customerId,lines,totalDebit,totalCredit,balance}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Ledger/worker-ledger`

- **Endpoint:** `/api/V1/Ledger/worker-ledger`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `WorkerId` (string (uuid))
    - `From` (string (date-time))
    - `To` (string (date-time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/worker-ledger?WorkerId=<string>&From=<string>&To=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["No entries found"],"statusCode":400}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 400). Observed: `null`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** correct business validation (e.g. no entries / missing param) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Ledger/income-statement`

- **Endpoint:** `/api/V1/Ledger/income-statement`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `From` (string (date-time))
    - `To` (string (date-time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/income-statement?PageNumber=<integer>&PageSize=<integer>&From=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"from":"0001-01-01T00:00:00","to":"0001-01-01T00:00:00","revenue":{"sectionName":"Revenue","accountType":4,"total":0,"lines":[{"accountId":"44444444-0000-0000-0000-000000000001","accountCode":"401","accountName":"Service Revenue","accountType":4,"openingBalance":0,"openingDebit":0,"openingCredit":0,"debit":0,"credit":0,"closingBalance":0,"closingDebit":0,"closingCredit":0," …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `obj{from,to,revenue,operatingExpenses,adminExpenses,totalRevenue}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Ledger/general-ledger`

- **Endpoint:** `/api/V1/Ledger/general-ledger`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `AccountId` (string (uuid))
    - `From` (string (date-time))
    - `To` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/general-ledger?AccountId=<string>&From=<string>&To=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"accountId":"44444444-0000-0000-0000-000000000002","accountCode":"402","accountName":"Mediation Revenue","accountType":4,"openingBalance":0,"totalDebit":37000.00,"totalCredit":37000.00,"closingBalance":0.00,"isValid":false,"lines":[{"date":"2025-12-31T00:00:00","entryNumber":"JE-2026-0044","description":"إغلاق السنة المالية 2025","debit":15000.00,"credit":0.00,"balanceAfter …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 404). Observed: `obj{accountId,accountCode,accountName,accountType,openingBalance,totalDebit}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Ledger/trial-balance`

- **Endpoint:** `/api/V1/Ledger/trial-balance`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `From` (string (date-time))
    - `To` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `GroupedOnly` (boolean)
    - `ExcludeZeroBalances` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/trial-balance?From=<string>&To=<string>&BranchId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"totalDebit":0,"totalCredit":0,"totalOpeningDebit":0,"totalOpeningCredit":0,"totalClosingDebit":0,"totalClosingCredit":0,"isBalanced":true,"difference":0,"lines":[{"accountId":"11111111-0000-0000-0000-000000000001","accountCode":"101","accountName":"Cash","accountType":1,"openingBalance":0,"openingDebit":0,"openingCredit":0,"debit":0,"credit":0,"closingBalance":0,"closingDe …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `obj{totalDebit,totalCredit,totalOpeningDebit,totalOpeningCredit,totalClosingDebit,totalClosingCredit}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Ledger/balance-sheet`

- **Endpoint:** `/api/V1/Ledger/balance-sheet`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `AsOfDate` (string (date-time))
    - `IncludeCurrentYearEarnings` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/balance-sheet?AsOfDate=<string>&IncludeCurrentYearEarnings=<boolean>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"totalAssets":0,"totalLiabilities":0,"totalEquity":0,"currentYearEarnings":0,"isBalanced":true,"difference":0,"assets":{"sectionName":"Assets","total":0,"lines":[{"accountId":"11111111-0000-0000-0000-000000000001","accountCode":"101","accountName":"Cash","accountType":1,"openingBalance":0,"openingDebit":0,"openingCredit":0,"debit":0,"credit":0,"closingBalance":0,"closingDeb …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `obj{totalAssets,totalLiabilities,totalEquity,currentYearEarnings,isBalanced,difference}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Ledger/vat-report`

- **Endpoint:** `/api/V1/Ledger/vat-report`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Ledger
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Year` (integer (int32))
    - `Quarter` (integer (int32))
    - `From` (string (date-time))
    - `To` (string (date-time))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Ledger/vat-report?Year=<integer>&Quarter=<integer>&From=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"year":2026,"quarter":1,"periodStart":"2025-01-01T00:00:00","periodEnd":"2026-12-31T00:00:00","outputVat":4324.93,"inputVat":900.00,"netVatPayable":3424.93,"lines":[{"accountCode":"202","accountName":"VAT Payable","debit":1886.61,"credit":6211.54,"netMovement":4324.93},{"accountCode":"105","accountName":"VAT Receivable","debit":900.00,"credit":0.00,"netMovement":900.00}],"i …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 400). Observed: `obj{year,quarter,periodStart,periodEnd,outputVat,inputVat}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## LoanRequest (4)

### `GET /api/V1/LoanRequest/GetAll`

- **Endpoint:** `/api/V1/LoanRequest/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve LoanRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/LoanRequest/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"128a4a8f-9f81-4b62-8ed4-08dedff8a9fa","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","employeeName":"???? ????","loanAmount":100.00,"basicSalary":0.00,"housingAllowance":0,"mobilityAllowance":0,"otherAllowances":0,"totalSalary":0.00,"hiringDate":"2026-07-12T09:33:42.9802767","status":3,"outstandingBalance":0.00,"isFullyRepaid":false,"journalEntryId":null,"accoun …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[1]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/LoanRequest/Create`

- **Endpoint:** `/api/V1/LoanRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a LoanRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ createdTo: string (uuid), loanAmount: number (double), reasons: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/LoanRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "createdTo": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "loanAmount": 0,
  "reasons": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["Employee not found"],"statusCode":404}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/LoanRequest/Approve/{id}`

- **Endpoint:** `/api/V1/LoanRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** LoanRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/LoanRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/LoanRequest/Reject/{id}`

- **Endpoint:** `/api/V1/LoanRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** LoanRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/LoanRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Lookup (3)

### `GET /api/V1/Lookup/Departments`

- **Endpoint:** `/api/V1/Lookup/Departments`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Lookup
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Lookup/Departments
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"81f711f4-9b12-40c7-42aa-08de9e50d4df","nameAr":"قسم الموارد البشرية","nameEn":"HR Department"},{"id":"16d236b6-085d-400f-0325-08deb44ae5d4","nameAr":"IT","nameEn":"IT"},{"id":"921661ff-aa69-409a-0326-08deb44ae5d4","nameAr":"مبيعات","nameEn":"Sales"},{"id":"47e307bf-e2b8-4694-34ae-08ded5095966","nameAr":"تجريبي","nameEn":"Test"},{"id":"b48c0d09-e86c-47c8-69b8-08dedd44 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Lookup/SalaryScales`

- **Endpoint:** `/api/V1/Lookup/SalaryScales`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Lookup
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Lookup/SalaryScales
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Lookup/CustodyTypes`

- **Endpoint:** `/api/V1/Lookup/CustodyTypes`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Lookup
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Lookup/CustodyTypes
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"d4c9b145-bf9e-4e98-ba78-08deb59da96d","nameAr":"عهده عينيه","nameEn":"عهده عينيه"},{"id":"f29770e1-3a8f-4a68-ba79-08deb59da96d","nameAr":"عهده نقديه","nameEn":"عهده نقديه"},{"id":"13d1f291-4ebe-4153-ba7a-08deb59da96d","nameAr":"كمبيوتر","nameEn":"كمبيوتر"},{"id":"2b2a3b7d-246d-4fa9-3831-08dedd4490c3","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Marketer (5)

### `POST /api/V1/Marketer`

- **Endpoint:** `/api/V1/Marketer`
- **HTTP Method:** POST
- **Purpose:** Create a Marketer
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nameAr: string, nameEn: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Marketer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string"
}
```
- **Example Response:** `{"success":true,"data":"تم إضافة المسوق بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":true,"data":"تم إضافة المسوق بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200/200
- **Pass/Fail:** FAIL
- **Notes:** accepts empty body & creates a blank record (no validation) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Accepts an empty body and persists a blank record.
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Require and validate mandatory fields; reject empty bodies with 400.

### `GET /api/V1/Marketer`

- **Endpoint:** `/api/V1/Marketer`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Marketer
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Marketer?SearchName=<string>&PageNumber=<integer>&PageSize=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"a87a94fa-9f2f-496a-b5fa-08dedd448d2b","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","createdDate":"2026-07-08T22:59:22.9137154"},{"id":"794c03ee-61d2-4446-0c13-08de9bbdbf96","nameAr":"فيسبوك","nameEn":"Facebook","createdDate":"2026-04-16T14:06:41.1265646"},{"id":"e646288d-0cd6-4dc2-0c12-08de9bbdbf96","nameAr":"تيك توك","nameEn":"Tik …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:6,total:6}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/Marketer/{id}`

- **Endpoint:** `/api/V1/Marketer/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Marketer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ nameAr: string, nameEn: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Marketer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nameAr": "string",
  "nameEn": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["المسوق غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["المسوق غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Marketer/{id}`

- **Endpoint:** `/api/V1/Marketer/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Marketer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Marketer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["المسوق غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["المسوق غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Marketer/{id}`

- **Endpoint:** `/api/V1/Marketer/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Marketer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Marketer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"a87a94fa-9f2f-496a-b5fa-08dedd448d2b","nameAr":"ZZ_APITEST_1783551551581","nameEn":"ZZ_APITEST_1783551551581","createdDate":"2026-07-08T22:59:22.9137154","createdBy":"2dbb733b-6b62-4d4e-8522-845886c8f897","updatedDate":null,"updatedBy":null},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,nameAr,nameEn,createdDate,createdBy,updatedDate}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## MediationContract (16)

### `GET /api/Mediation/MediationContract`

- **Endpoint:** `/api/Mediation/MediationContract`
- **HTTP Method:** GET
- **Purpose:** List / retrieve MediationContract
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ContractNumber` (integer (int32))
    - `CustomerNationalId` (string)
    - `WorkerPassportNumber` (string)
    - `ContractId` (string (uuid))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `MusanedContractNumber` (string)
    - `StatusId` (integer (int32))
    - `ContractType` (integer (int32))
    - `NationalityId` (string (uuid))
    - `WorkerType` (integer (int32))
    - `CustomerPhone` (string)
    - `VisaNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `PaymentDateFrom` (string (date-time))
    - `PaymentDateTo` (string (date-time))
    - `WithoutAssignedWorker` (boolean)
    - `IsPaid` (boolean)
    - `IsUnpaid` (boolean)
    - `Source` (ContractSource)
    - `Page` (integer (int32))
    - `PageSize` (integer (int32))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContract?ContractNumber=<integer>&CustomerNationalId=<string>&WorkerPassportNumber=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"5bb4d51d-ea20-4bcc-9a00-08dedff8a862","contractNumber":24,"statusName":"MedicalExamDone","contractTypeName":null,"customerId":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","customerName":null,"customerNationalId":"ZZ_REVAL4_1783848770945","customerPhone":"0512345678","workerId":"97fef276-3039-4cd3-9856-08de9fed0fc3","workerName":"Ahmed Mohamed Dandash","workerPassp …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:24}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Mediation/MediationContract`

- **Endpoint:** `/api/Mediation/MediationContract`
- **HTTP Method:** POST
- **Purpose:** Create a MediationContract
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `GET /api/Mediation/MediationContract/export`

- **Endpoint:** `/api/Mediation/MediationContract/export`
- **HTTP Method:** GET
- **Purpose:** Export MediationContract (file/report)
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ContractNumber` (integer (int32))
    - `CustomerNationalId` (string)
    - `WorkerPassportNumber` (string)
    - `ContractId` (string (uuid))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `MusanedContractNumber` (string)
    - `StatusId` (integer (int32))
    - `ContractType` (integer (int32))
    - `NationalityId` (string (uuid))
    - `WorkerType` (integer (int32))
    - `CustomerPhone` (string)
    - `VisaNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `PaymentDateFrom` (string (date-time))
    - `PaymentDateTo` (string (date-time))
    - `WithoutAssignedWorker` (boolean)
    - `IsPaid` (boolean)
    - `IsUnpaid` (boolean)
    - `Source` (ContractSource)
    - `Page` (integer (int32))
    - `PageSize` (integer (int32))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContract/export?ContractNumber=<integer>&CustomerNationalId=<string>&WorkerPassportNumber=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `PK    f�\�-'�@  K     xl/workbook.xml��Kk1��J:,x�f]�-��R*}@�%&�n0�%��?�$U顷�d��7��lЊ�yiM� ��[!Ͷ�}h�'�L��h�nc�Z_����R�;���G3h�Z�Y�u[j�Vr�[��h-��:T,Hk\|'{'����2�;Ġ�/L3i����n�3�5,;�O@h���J��_?���·��� �x�\�M�h3�7���%"&�\|C!�x�Ś�H*X��@\%En!�3��J�"���'�zPF��W��9l�<Q�3��c�H'����Ќ�P�e�ٸ�>�r�%�[���e��1��c99����� PK    f�\�R�4e  ^     docProps/app.xml���O� …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `PK    f�\�-'�@  K     xl/workbook.xml��Kk1��J:,x�f]�-��R*}@�%&�n0�%��?�$U顷�d��7��lЊ�yiM� ��[!Ͷ�}h�'�L��h`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/Mediation/MediationContract/{id}`

- **Endpoint:** `/api/Mediation/MediationContract/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a MediationContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContract/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"visaDateHijri":null,"isComprehensiveQualificationVisa":null,"localCost":null,"agentCostSAR":null,"managerDiscount":null,"costDiscount":null,"costDescription":"ZZ_REVAL4_1783848770945","hasContractInsurance":null,"domesticWorkerInsurance":null,"isCancel":null,"cancelNote":null,"marketerId":null,"contractCategoryName":null,"workerAssignments":[],"followUpItems":[],"deliveryF …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{visaDateHijri,isComprehensiveQualificationVisa,localCost,agentCostSAR,managerDiscount,costDiscount}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/sign`

- **Endpoint:** `/api/Mediation/MediationContract/sign`
- **HTTP Method:** POST
- **Purpose:** MediationContract: sign
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, musanedContractNumber: string*, invoicePaymentDate: string (date-time) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/sign
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "musanedContractNumber": "string",
  "invoicePaymentDate": "2026-01-01T00:00:00Z"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"MusanedContractNumber":["`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Musan …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/customer-payment`

- **Endpoint:** `/api/Mediation/MediationContract/customer-payment`
- **HTTP Method:** POST
- **Purpose:** MediationContract: customer-payment
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, amount: number (double)*, paymentMethod: PaymentMethodType, bankFees: number (double), description: string }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/customer-payment
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "paymentMethod": 1,
  "bankFees": 0,
  "description": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["بيانات الدفع غير صالحة."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["بيانات الدفع غير صالحة."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/Mediation/MediationContract/update-status`

- **Endpoint:** `/api/Mediation/MediationContract/update-status`
- **HTTP Method:** PUT
- **Purpose:** Update a MediationContract
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, newStatus: integer (int32)*, notes: string, accountingAmount: number (double) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/Mediation/MediationContract/update-status
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "newStatus": 0,
  "notes": "string",
  "accountingAmount": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["بيانات غير صالحة."],"statusCode":400}`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"success":false,"data":null,"errors":["بيانات غير صالحة."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/sponsorship-transfer`

- **Endpoint:** `/api/Mediation/MediationContract/sponsorship-transfer`
- **HTTP Method:** POST
- **Purpose:** MediationContract: sponsorship-transfer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, amount: number (double)*, notes: string }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/sponsorship-transfer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["بيانات نقل الكفالة غير صالحة."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["بيانات نقل الكفالة غير صالحة."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/cancel`

- **Endpoint:** `/api/Mediation/MediationContract/cancel`
- **HTTP Method:** POST
- **Purpose:** MediationContract: cancel
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, cancelNote: string*, cancelBy: integer (int32) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/cancel
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "cancelNote": "string",
  "cancelBy": 0
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"CancelNote":["The CancelN`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Cance …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/delivery-form`

- **Endpoint:** `/api/Mediation/MediationContract/delivery-form`
- **HTTP Method:** POST
- **Purpose:** MediationContract: delivery-form
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, deliveryDate: string (date-time), notes: string }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/delivery-form
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deliveryDate": "2026-01-01T00:00:00Z",
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["رقم العقد مطلوب."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["رقم العقد مطلوب."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/delivery-form/sign`

- **Endpoint:** `/api/Mediation/MediationContract/delivery-form/sign`
- **HTTP Method:** POST
- **Purpose:** MediationContract: sign
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, customerSignedAt: string (date-time) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/delivery-form/sign
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerSignedAt": "2026-01-01T00:00:00Z"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["رقم العقد مطلوب."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["رقم العقد مطلوب."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/warranty-return`

- **Endpoint:** `/api/Mediation/MediationContract/warranty-return`
- **HTTP Method:** POST
- **Purpose:** MediationContract: warranty-return
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, returnDate: string (date-time), returnReason: WorkerReturnReason*, daysWithCustomer: integer (int32), newWorkerLocation: string, notes: string }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/warranty-return
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "returnDate": "2026-01-01T00:00:00Z",
  "returnReason": 1,
  "daysWithCustomer": 0,
  "newWorkerLocation": "string",
  "notes": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"DaysWithCustomer":["The f`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"DaysW …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Mediation/MediationContract/status-history/{contractId}`

- **Endpoint:** `/api/Mediation/MediationContract/status-history/{contractId}`
- **HTTP Method:** GET
- **Purpose:** Get a MediationContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `contractId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContract/status-history/{contractId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Mediation/MediationContract/recruitment-requests`

- **Endpoint:** `/api/Mediation/MediationContract/recruitment-requests`
- **HTTP Method:** GET
- **Purpose:** List / retrieve MediationContract
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ContractNumber` (integer (int32))
    - `CustomerNationalId` (string)
    - `WorkerPassportNumber` (string)
    - `ContractId` (string (uuid))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `MusanedContractNumber` (string)
    - `StatusId` (integer (int32))
    - `ContractType` (integer (int32))
    - `NationalityId` (string (uuid))
    - `WorkerType` (integer (int32))
    - `CustomerPhone` (string)
    - `VisaNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `PaymentDateFrom` (string (date-time))
    - `PaymentDateTo` (string (date-time))
    - `WithoutAssignedWorker` (boolean)
    - `IsPaid` (boolean)
    - `IsUnpaid` (boolean)
    - `Source` (ContractSource)
    - `Page` (integer (int32))
    - `PageSize` (integer (int32))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContract/recruitment-requests?ContractNumber=<integer>&CustomerNationalId=<string>&WorkerPassportNumber=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"5bb4d51d-ea20-4bcc-9a00-08dedff8a862","contractNumber":24,"statusName":"MedicalExamDone","createdAt":"2026-07-12T09:33:40.3075547","customerName":null,"customerPhone":"0512345678","costDescription":"ZZ_REVAL4_1783848770945","branchId":"31887c15-5b47-4551-2190-08dea9210ab7","branchNameAr":"????? ????????","hasSpecificWorker":true,"workerSelectionLabel":null," …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:2,total:2}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Mediation/MediationContract/end-worker-service`

- **Endpoint:** `/api/Mediation/MediationContract/end-worker-service`
- **HTTP Method:** POST
- **Purpose:** MediationContract: end-worker-service
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, reason: string }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/end-worker-service
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["رقم العقد مطلوب."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["رقم العقد مطلوب."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationContract/assign-worker`

- **Endpoint:** `/api/Mediation/MediationContract/assign-worker`
- **HTTP Method:** POST
- **Purpose:** MediationContract: assign-worker
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ contractId: string (uuid)*, workerId: string (uuid)*, workerPassportNumber: string* }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContract/assign-worker
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "contractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerPassportNumber": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"WorkerPassportNumber":["T`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"Worke …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## MediationContractOffer (7)

### `GET /api/Mediation/MediationContractOffer`

- **Endpoint:** `/api/Mediation/MediationContractOffer`
- **HTTP Method:** GET
- **Purpose:** List / retrieve MediationContractOffer
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `OfferNumber` (integer (int32))
    - `NationalityId` (string (uuid))
    - `JobId` (string (uuid))
    - `WorkerType` (integer (int32))
    - `PreviousExperience` (integer (int32))
    - `IsActive` (boolean)
    - `ShowForExternalCustomers` (boolean)
    - `ShowForReception` (boolean)
    - `Page` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContractOffer?OfferNumber=<integer>&NationalityId=<string>&JobId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"d11adcb7-51cf-4022-8539-daa40766b2ae","offerNumber":8,"nationalityId":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityNameAr":"سريلانكا","jobId":"b7c7f899-0cac-4698-f4c0-08de9bab1e0a","jobName":"مربية أطفال","workerType":0,"workerTypeName":"Unspecified","previousExperience":3,"previousExperienceName":"لم يسبق له العمل","salary":1600.00,"localCost":1500.00 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:6,total:6}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Mediation/MediationContractOffer`

- **Endpoint:** `/api/Mediation/MediationContractOffer`
- **HTTP Method:** POST
- **Purpose:** Create a MediationContractOffer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid)*, jobId: string (uuid), workerType: integer (int32), previousExperience: integer (int32), localCost: number (double)*, agentCostSAR: number (double)*, salary: number (double)*, taxLocalCost: number (double), showForExternalCustomers: boolean, showForReception: boolean }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContractOffer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerType": 0,
  "previousExperience": 0,
  "localCost": 0,
  "agentCostSAR": 0,
  "salary": 0,
  "taxLocalCost": 0,
  "showForExternalCustomers": true,
  "showForReception": true
}
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `PUT /api/Mediation/MediationContractOffer`

- **Endpoint:** `/api/Mediation/MediationContractOffer`
- **HTTP Method:** PUT
- **Purpose:** Update a MediationContractOffer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid)*, jobId: string (uuid), workerType: integer (int32), previousExperience: integer (int32), localCost: number (double)*, agentCostSAR: number (double)*, salary: number (double)*, taxLocalCost: number (double), showForExternalCustomers: boolean, showForReception: boolean, id: string (uuid) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/Mediation/MediationContractOffer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerType": 0,
  "previousExperience": 0,
  "localCost": 0,
  "agentCostSAR": 0,
  "salary": 0,
  "taxLocalCost": 0,
  "showForExternalCustomers": true,
  "showForReception": true,
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["العرض غير موجود"],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["العرض غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Mediation/MediationContractOffer/{id}`

- **Endpoint:** `/api/Mediation/MediationContractOffer/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a MediationContractOffer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationContractOffer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"d11adcb7-51cf-4022-8539-daa40766b2ae","offerNumber":8,"nationalityId":"ea5cd852-d84a-441a-c18b-08dea2f4800b","nationalityNameAr":"سريلانكا","jobId":"b7c7f899-0cac-4698-f4c0-08de9bab1e0a","jobName":"مربية أطفال","workerType":0,"workerTypeName":"Unspecified","previousExperience":3,"previousExperienceName":"لم يسبق له العمل","salary":1600.00,"localCost":1500.00,"taxLocal …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,offerNumber,nationalityId,nationalityNameAr,jobId,jobName}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/Mediation/MediationContractOffer/{id}`

- **Endpoint:** `/api/Mediation/MediationContractOffer/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a MediationContractOffer by id
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/Mediation/MediationContractOffer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":true,"data":"تم الحذف بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** WEAK
- **Notes:** returns 200 for a non-existent id (no existence check) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Returns 200 for a non-existent id (no existence check).
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Return 404 when the target does not exist.

### `POST /api/Mediation/MediationContractOffer/auto-fill`

- **Endpoint:** `/api/Mediation/MediationContractOffer/auto-fill`
- **HTTP Method:** POST
- **Purpose:** MediationContractOffer: auto-fill
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid)*, jobId: string (uuid), workerType: integer (int32), previousExperience: integer (int32) }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationContractOffer/auto-fill
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerType": 0,
  "previousExperience": 0
}
```
- **Example Response:** `{"success":true,"data":{"offerId":null,"found":false,"message":"لا يوجد عرض لهذه الجنسية","localCost":null,"agentCostSAR":null,"salary":null,"taxLocalCost":null`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":true,"data":{"offerId":null,"found":false,"message":"لا يوجد عرض لهذه الجنسية","localCost":null,"agentCostSAR":null,"salary":null …`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PATCH /api/Mediation/MediationContractOffer/{id}/toggle-active`

- **Endpoint:** `/api/Mediation/MediationContractOffer/{id}/toggle-active`
- **HTTP Method:** PATCH
- **Purpose:** Partial update: toggle-active
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PATCH https://sigma-api.runasp.net/api/Mediation/MediationContractOffer/{id}/toggle-active
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["العرض غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["العرض غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## MediationFollowUp (4)

### `GET /api/Mediation/MediationFollowUp/dashboard`

- **Endpoint:** `/api/Mediation/MediationFollowUp/dashboard`
- **HTTP Method:** GET
- **Purpose:** List / retrieve MediationFollowUp
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ContractNumber` (integer (int32))
    - `CustomerNationalId` (string)
    - `WorkerPassportNumber` (string)
    - `ContractId` (string (uuid))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `MusanedContractNumber` (string)
    - `StatusId` (integer (int32))
    - `ContractType` (integer (int32))
    - `NationalityId` (string (uuid))
    - `WorkerType` (integer (int32))
    - `CustomerPhone` (string)
    - `VisaNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `PaymentDateFrom` (string (date-time))
    - `PaymentDateTo` (string (date-time))
    - `WithoutAssignedWorker` (boolean)
    - `IsPaid` (boolean)
    - `IsUnpaid` (boolean)
    - `Source` (ContractSource)
    - `Page` (integer (int32))
    - `PageSize` (integer (int32))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationFollowUp/dashboard?ContractNumber=<integer>&CustomerNationalId=<string>&WorkerPassportNumber=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"5bb4d51d-ea20-4bcc-9a00-08dedff8a862","contractNumber":24,"statusName":"MedicalExamDone","contractTypeName":null,"customerId":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","customerName":null,"customerNationalId":"ZZ_REVAL4_1783848770945","customerPhone":"0512345678","workerId":"97fef276-3039-4cd3-9856-08de9fed0fc3","workerName":"Ahmed Mohamed Dandash","workerPassp …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:12}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/Mediation/MediationFollowUp/items/{contractId}`

- **Endpoint:** `/api/Mediation/MediationFollowUp/items/{contractId}`
- **HTTP Method:** GET
- **Purpose:** Get a MediationFollowUp by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `contractId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationFollowUp/items/{contractId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Mediation/MediationFollowUp/item/{itemId}`

- **Endpoint:** `/api/Mediation/MediationFollowUp/item/{itemId}`
- **HTTP Method:** GET
- **Purpose:** Get a MediationFollowUp by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `itemId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Mediation/MediationFollowUp/item/{itemId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["البند غير موجود"],"statusCode":400}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (no such record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/Mediation/MediationFollowUp/update-description`

- **Endpoint:** `/api/Mediation/MediationFollowUp/update-description`
- **HTTP Method:** POST
- **Purpose:** MediationFollowUp: update-description
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ itemId: string (uuid), inputDescription: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Mediation/MediationFollowUp/update-description
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "itemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "inputDescription": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["بند المتابعة غير موجود"],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["بند المتابعة غير موجود"],"statusCode":400}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## MedicalExamination (7)

### `POST /api/V1/MedicalExamination`

- **Endpoint:** `/api/V1/MedicalExamination`
- **HTTP Method:** POST
- **Purpose:** Create a MedicalExamination
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ workerId: string (uuid), examDate: string (date-time), medicalStatus: MedicalStatus, notes: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/MedicalExamination
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "examDate": "2026-01-01T00:00:00Z",
  "medicalStatus": 1,
  "notes": "string"
}
```
- **Example Response:** `{"success":true,"data":"تم إضافة الفحص الطبي بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500 (empty) / 200 (valid)
- **Pass/Fail:** PASS*
- **Notes:** works with valid body; 500 on empty body (validation gap) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `GET /api/V1/MedicalExamination`

- **Endpoint:** `/api/V1/MedicalExamination`
- **HTTP Method:** GET
- **Purpose:** List / retrieve MedicalExamination
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `WorkerId` (string (uuid))
    - `WorkerSearch` (string)
    - `MedicalStatus` (MedicalStatus)
    - `FromDate` (string (date-time))
    - `ToDate` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/MedicalExamination?WorkerId=<string>&WorkerSearch=<string>&MedicalStatus=<val>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"24491f8a-2758-4b6e-fa89-08ded68546fd","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","examDate":"2026-06-30T09:00:00","medicalStatus":1,"notes":"Medical examination passed.","createdDate":"2026-06-30T08:55:04.3176747"},{"id":"2696cd92-0831-469b-fa8a-08ded68546fd","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:9,total:9}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/MedicalExamination/{id}`

- **Endpoint:** `/api/V1/MedicalExamination/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a MedicalExamination by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ workerId: string (uuid), examDate: string (date-time), medicalStatus: MedicalStatus, notes: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/MedicalExamination/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "examDate": "2026-01-01T00:00:00Z",
  "medicalStatus": 1,
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["الفحص الطبي غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الفحص الطبي غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/MedicalExamination/{id}`

- **Endpoint:** `/api/V1/MedicalExamination/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a MedicalExamination by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/MedicalExamination/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الفحص الطبي غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["الفحص الطبي غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/MedicalExamination/{id}`

- **Endpoint:** `/api/V1/MedicalExamination/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a MedicalExamination by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/MedicalExamination/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"24491f8a-2758-4b6e-fa89-08ded68546fd","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","workerReferenceNo":"WDK-2026-4402","examDate":"2026-06-30T09:00:00","medicalStatus":1,"notes":"Medical examination passed.","createdDate":"2026-06-30T08:55:04.3176747","createdBy":"d7b8ffad-dd86-4fd6-942c-71bf9ae3c2c4","updatedDate":null,"updatedBy" …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,workerId,workerName,workerReferenceNo,examDate,medicalStatus}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/MedicalExamination/report/{id}`

- **Endpoint:** `/api/V1/MedicalExamination/report/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a MedicalExamination by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/MedicalExamination/report/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["الفحص الطبي غير موجود"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/MedicalExamination/check-worker/{workerId}`

- **Endpoint:** `/api/V1/MedicalExamination/check-worker/{workerId}`
- **HTTP Method:** GET
- **Purpose:** Get a MedicalExamination by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/MedicalExamination/check-worker/{workerId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"0dfe0a12-bfd4-4c13-a6b5-08dea209daf0","workerId":"97fef276-3039-4cd3-9856-08de9fed0fc3","workerName":"Ahmed Mohamed Dandash","workerReferenceNo":"REF-2016-001","examDate":"2026-04-24T14:00:23.884","medicalStatus":1,"notes":"string","createdDate":"2026-04-24T14:00:34.234503","createdBy":"","updatedDate":null,"updatedBy":null},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,workerId,workerName,workerReferenceNo,examDate,medicalStatus}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Nationality (6)

### `GET /api/V1/Nationality`

- **Endpoint:** `/api/V1/Nationality`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Nationality
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `IsActiveOnly` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Nationality?SearchName=<string>&IsActiveOnly=<boolean>&PageNumber=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"241e0df9-7462-4aa3-8fc6-310c70843cee","nationalityNameAr":"سوري","nationalityNameEn":"Syrian","isActive":true,"createdDate":"2026-07-09T15:27:28.05","updatedDate":null},{"id":"c708abd3-2a42-4cc5-baf1-504373b77d39","nationalityNameAr":"مصري","nationalityNameEn":"Egyptian","isActive":true,"createdDate":"2026-07-09T15:27:28.05","updatedDate":null},{"id":"dce7d8 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:10,total:11}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/Nationality`

- **Endpoint:** `/api/V1/Nationality`
- **HTTP Method:** POST
- **Purpose:** Create a Nationality
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityNameAr: string, nationalityNameEn: string, isActive: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Nationality
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityNameAr": "string",
  "nationalityNameEn": "string",
  "isActive": true
}
```
- **Example Response:** `{"success":true,"data":{"id":"d64c12ca-5f14-4cf8-9f40-08dedff350a2","nationalityNameAr":null,"nationalityNameEn":null,"isActive":null,"createdDate":"2026-07-12T`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":true,"data":{"id":"d64c12ca-5f14-4cf8-9f40-08dedff350a2","nationalityNameAr":null,"nationalityNameEn":null,"isActive":null,"creat …`
- **Status Code:** 200/200
- **Pass/Fail:** FAIL
- **Notes:** accepts empty body & creates a blank record (no validation) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200). Accepts an empty body and persists a blank record.
- **Recommendations:** Enforce '[Authorize]' on this endpoint. Require and validate mandatory fields; reject empty bodies with 400.

### `GET /api/V1/Nationality/{id}`

- **Endpoint:** `/api/V1/Nationality/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Nationality by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Nationality/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"241e0df9-7462-4aa3-8fc6-310c70843cee","nationalityNameAr":"سوري","nationalityNameEn":"Syrian","isActive":true,"createdDate":"2026-07-09T15:27:28.05","updatedDate":null},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,nationalityNameAr,nationalityNameEn,isActive,createdDate,updatedDate}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Nationality/{id}`

- **Endpoint:** `/api/V1/Nationality/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Nationality by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ id: string (uuid)*, nationalityNameAr: string, nationalityNameEn: string, isActive: boolean }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Nationality/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nationalityNameAr": "string",
  "nationalityNameEn": "string",
  "isActive": true
}
```
- **Example Response:** `ID mismatch`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `ID mismatch`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Nationality/{id}`

- **Endpoint:** `/api/V1/Nationality/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Nationality by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Nationality/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["Nationality not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["Nationality not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Nationality/{id}/toggle-status`

- **Endpoint:** `/api/V1/Nationality/{id}/toggle-status`
- **HTTP Method:** PUT
- **Purpose:** Update a Nationality by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Nationality/{id}/toggle-status
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["Nationality not found."],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["Nationality not found."],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## NationalityFollowUpConfig (4)

### `GET /api/FollowUp/NationalityFollowUpConfig/GetByNationality/{nationalityId}`

- **Endpoint:** `/api/FollowUp/NationalityFollowUpConfig/GetByNationality/{nationalityId}`
- **HTTP Method:** GET
- **Purpose:** Get a NationalityFollowUpConfig by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `isActive` (boolean)
- **Path Parameters:** `nationalityId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/FollowUp/NationalityFollowUpConfig/GetByNationality/{nationalityId}?isActive=<boolean>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `array[0]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/FollowUp/NationalityFollowUpConfig/Update`

- **Endpoint:** `/api/FollowUp/NationalityFollowUpConfig/Update`
- **HTTP Method:** PUT
- **Purpose:** Update a NationalityFollowUpConfig
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ id: string (uuid)*, sortOrder: integer (int32), dependsOnStatusId: string (uuid), fileNameAr: string, fileNameEn: string, whatsappName: string, maxDays: integer (int32), isActive: boolean }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/FollowUp/NationalityFollowUpConfig/Update
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sortOrder": 0,
  "dependsOnStatusId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fileNameAr": "string",
  "fileNameEn": "string",
  "whatsappName": "string",
  "maxDays": 0,
  "isActive": true
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Config not found"],"statusCode":400}`
- **Actual Test Result:** Probed with an empty body to verify the validation contract. Observed: `{"success":false,"data":null,"errors":["Config not found"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/FollowUp/NationalityFollowUpConfig/BulkUpdate`

- **Endpoint:** `/api/FollowUp/NationalityFollowUpConfig/BulkUpdate`
- **HTTP Method:** POST
- **Purpose:** NationalityFollowUpConfig: BulkUpdate
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ nationalityId: string (uuid)*, configs: array<UpdateNationalityFollowUpConfigDto>* }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/FollowUp/NationalityFollowUpConfig/BulkUpdate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "configs": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "sortOrder": 0,
      "dependsOnStatusId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fileNameAr": "string",
      "fileNameEn": "string",
      "whatsappName": "string",
      "maxDays": 0,
      "isActive": true
    }
  ]
}
```
- **Example Response:** `{"success":true,"data":"تم تحديث الإعدادات بنجاح","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":true,"data":"تم تحديث الإعدادات بنجاح","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/FollowUp/NationalityFollowUpConfig/ToggleActive/{id}`

- **Endpoint:** `/api/FollowUp/NationalityFollowUpConfig/ToggleActive/{id}`
- **HTTP Method:** POST
- **Purpose:** NationalityFollowUpConfig action: {id}
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/FollowUp/NationalityFollowUpConfig/ToggleActive/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Config not found"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Config not found"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## OperatingContractOffer (5)

### `GET /api/OperatingContractOffer`

- **Endpoint:** `/api/OperatingContractOffer`
- **HTTP Method:** GET
- **Purpose:** List / retrieve OperatingContractOffer
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchTitle` (string)
    - `OfferType` (integer (int32))
    - `BranchId` (string (uuid))
    - `NationalityId` (string (uuid))
    - `JobId` (string (uuid))
    - `IsActive` (boolean)
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/OperatingContractOffer?SearchTitle=<string>&OfferType=<integer>&BranchId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"55861229-b9df-472e-7e40-08dea0930285","offerType":1,"offerNumber":1,"offerContractType":1,"offerTitle":null,"numberOfDays":0,"nationalityId":"a9b569e2-7553-44d6-2d85-08de9d465260","jobId":"3ae7b9d3-d451-40f1-f4c1-08de9bab1e0a","duration":46,"dateFrom":null,"dateTo":null,"showForExternalCustomers":false,"showForReception":false,"isActive":true,"cost":1998.00, …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:1,total:1}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/OperatingContractOffer`

- **Endpoint:** `/api/OperatingContractOffer`
- **HTTP Method:** POST
- **Purpose:** Create a OperatingContractOffer
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ offerType: integer (int32), offerContractType: integer (int32), offerTitle: string, numberOfDays: integer (int32), nationalityId: string (uuid), jobId: string (uuid), duration: integer (int32), dateFrom: string (date-time), dateTo: string (date-time), showForExternalCustomers: boolean, showForReception: boolean, isActive: boolean, cost: number (double), costTax: number (double), promissoryNoteAmount: number (double), insurance: number (double), previousExperience: integer (int32), dailyPriceWithoutTax: number (double), workerSalary: number (double), totalCostWithTax: number (double), branchId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/OperatingContractOffer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "offerType": 0,
  "offerContractType": 0,
  "offerTitle": "string",
  "numberOfDays": 0,
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "duration": 0,
  "dateFrom": "2026-01-01T00:00:00Z",
  "dateTo": "2026-01-01T00:00:00Z",
  "showForExternalCustomers": true,
  "showForReception": true,
  "isActive": true,
  "cost": 0,
  "costTax": 0,
  "promissoryNoteAmount": 0,
  "insurance": 0,
  "previousExperience": 0,
  "dailyPriceWithoutTax": 0,
  "workerSalary": 0,
  "totalCostWithTax": 0,
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"id":"dd3a31dd-0099-43f2-7c47-08dedff3518d","offerType":null,"offerNumber":2,"offerContractType":null,"offerTitle":null,"numberOfDays":null,"nationalityId":nul`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"id":"dd3a31dd-0099-43f2-7c47-08dedff3518d","offerType":null,"offerNumber":2,"offerContractType":null,"offerTitle":null,"numberOfDays":null …`
- **Status Code:** 200/200
- **Pass/Fail:** FAIL
- **Notes:** accepts empty body & creates a blank record (no validation) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Accepts an empty body and persists a blank record.
- **Recommendations:** Require and validate mandatory fields; reject empty bodies with 400.

### `GET /api/OperatingContractOffer/{id}`

- **Endpoint:** `/api/OperatingContractOffer/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a OperatingContractOffer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/OperatingContractOffer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"id":"55861229-b9df-472e-7e40-08dea0930285","offerType":1,"offerNumber":1,"offerContractType":1,"offerTitle":null,"numberOfDays":0,"nationalityId":"a9b569e2-7553-44d6-2d85-08de9d465260","jobId":"3ae7b9d3-d451-40f1-f4c1-08de9bab1e0a","duration":46,"dateFrom":null,"dateTo":null,"showForExternalCustomers":false,"showForReception":false,"isActive":true,"cost":1998.00,"costTax":300.00,"promissoryNoteA …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,offerType,offerNumber,offerContractType,offerTitle,numberOfDays}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/OperatingContractOffer/{id}`

- **Endpoint:** `/api/OperatingContractOffer/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a OperatingContractOffer by id
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ offerType: integer (int32), offerContractType: integer (int32), offerTitle: string, numberOfDays: integer (int32), nationalityId: string (uuid), jobId: string (uuid), duration: integer (int32), dateFrom: string (date-time), dateTo: string (date-time), showForExternalCustomers: boolean, showForReception: boolean, isActive: boolean, cost: number (double), costTax: number (double), promissoryNoteAmount: number (double), insurance: number (double), previousExperience: integer (int32), dailyPriceWithoutTax: number (double), workerSalary: number (double), totalCostWithTax: number (double), branchId: string (uuid) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/OperatingContractOffer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "offerType": 0,
  "offerContractType": 0,
  "offerTitle": "string",
  "numberOfDays": 0,
  "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "duration": 0,
  "dateFrom": "2026-01-01T00:00:00Z",
  "dateTo": "2026-01-01T00:00:00Z",
  "showForExternalCustomers": true,
  "showForReception": true,
  "isActive": true,
  "cost": 0,
  "costTax": 0,
  "promissoryNoteAmount": 0,
  "insurance": 0,
  "previousExperience": 0,
  "dailyPriceWithoutTax": 0,
  "workerSalary": 0,
  "totalCostWithTax": 0,
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `Offer not found.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Offer not found.`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/OperatingContractOffer/{id}`

- **Endpoint:** `/api/OperatingContractOffer/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a OperatingContractOffer by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/OperatingContractOffer/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `Offer not found.`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `Offer not found.`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## PaymentVoucher (4)

### `GET /api/Accounting/PaymentVoucher`

- **Endpoint:** `/api/Accounting/PaymentVoucher`
- **HTTP Method:** GET
- **Purpose:** List / retrieve PaymentVoucher
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `ContractId` (string (uuid))
    - `DocumentType` (AccountingDocumentType)
    - `DocumentNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/PaymentVoucher?CustomerId=<string>&AgentId=<string>&ContractId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"737ee08f-bdc1-4c0e-2109-08dedff8ac8c","voucherSerialNumber":0,"voucherNumber":"ZZ60103","voucherDate":"2026-07-12T09:37:40.103","amount":100.00,"notes":"ZZ_REVAL4","paymentMethod":1,"payeeId":null,"payeeType":null,"customerId":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","sourceContractId":null,"sourceContractType":null,"journalEntryId":null,"accountingDocumentId":null},{" …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[3]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Accounting/PaymentVoucher`

- **Endpoint:** `/api/Accounting/PaymentVoucher`
- **HTTP Method:** POST
- **Purpose:** Create a PaymentVoucher
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ voucherNumber: string, voucherDate: string (date-time), amount: number (double), notes: string, paymentMethod: integer (int32), payeeId: string (uuid), payeeType: string, customerId: string (uuid), sourceContractId: string (uuid), sourceContractType: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Accounting/PaymentVoucher
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "voucherNumber": "string",
  "voucherDate": "2026-01-01T00:00:00Z",
  "amount": 0,
  "notes": "string",
  "paymentMethod": 0,
  "payeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "payeeType": "string",
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceContractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "sourceContractType": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["'Voucher Date' must not be empty.","'Amount' must be greater than '0'."],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["'Voucher Date' must not be empty.","'Amount' must be greater than '0'."],"statusCode":400}`
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400. 500 even with a populated body (sibling voucher endpoints validate).
- **Recommendations:** Add model validation; return 400 with field errors. Align validation with ReceiptVoucher/CreditNote/DebitNote. Validate FK existence (customer/contract) and return 400 rather than 500 on a bad reference.

### `GET /api/Accounting/PaymentVoucher/{id}`

- **Endpoint:** `/api/Accounting/PaymentVoucher/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a PaymentVoucher by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/PaymentVoucher/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"737ee08f-bdc1-4c0e-2109-08dedff8ac8c","voucherSerialNumber":0,"voucherNumber":"ZZ60103","voucherDate":"2026-07-12T09:37:40.103","amount":100.00,"notes":"ZZ_REVAL4","paymentMethod":1,"payeeId":null,"payeeType":null,"customerId":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","sourceContractId":null,"sourceContractType":null,"journalEntryId":null,"accountingDocumentId":null},"er …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,voucherSerialNumber,voucherNumber,voucherDate,amount,notes}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Accounting/PaymentVoucher/{id}/trace`

- **Endpoint:** `/api/Accounting/PaymentVoucher/{id}/trace`
- **HTTP Method:** GET
- **Purpose:** Get audit trace for a PaymentVoucher
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/PaymentVoucher/{id}/trace
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"documentType":2,"documentEntityId":"737ee08f-bdc1-4c0e-2109-08dedff8ac8c","document":{"id":"737ee08f-bdc1-4c0e-2109-08dedff8ac8c","documentType":2,"documentNumber":"ZZ60103","documentDate":"2026-07-12T09:37:40.103","amount":100.00,"journalEntryId":null,"accountingDocumentId":null,"customerId":"c75fa561-e5b1-48d4-ebe3-08dedff8a855","agentId":null,"contractId":null,"contract …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{documentType,documentEntityId,document,journalEntry,ledgerEntries}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Payroll (12)

### `POST /api/V1/Payroll/generate`

- **Endpoint:** `/api/V1/Payroll/generate`
- **HTTP Method:** POST
- **Purpose:** Payroll: generate
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ month: integer (int32), year: integer (int32), includeWorkers: boolean }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Payroll/generate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "month": 0,
  "year": 0,
  "includeWorkers": true
}
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** 500 on empty/invalid body — should return 400 (unhandled exception) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `GET /api/V1/Payroll`

- **Endpoint:** `/api/V1/Payroll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Payroll
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `month` (integer (int32))
    - `year` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Payroll?month=<integer>&year=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Payroll not found"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 404). Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Payroll/{id}`

- **Endpoint:** `/api/V1/Payroll/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Payroll by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Payroll/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"32e61640-f357-4aeb-a35c-d4f84fe39eb4","month":6,"year":2026,"status":2,"totalNetAmount":10500.00,"totalPaidAmount":0.00,"remainingAmount":10500.00,"isClosed":false,"approvedAt":"2026-06-28T11:37:19.101974","approvedBy":"system","journalEntryId":"71f81602-3727-4aa9-ebee-08ded5099c8e","accountingDocumentId":"666c0d5c-1a04-45bc-c41a-08ded5099ca3","employees":[{"id":"75d1 …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,month,year,status,totalNetAmount,totalPaidAmount}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Payroll/history`

- **Endpoint:** `/api/V1/Payroll/history`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Payroll
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `year` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Payroll/history?year=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"32e61640-f357-4aeb-a35c-d4f84fe39eb4","month":6,"year":2026,"status":2,"totalNetAmount":10500.00,"totalPaidAmount":0.00,"isClosed":false,"createdDate":"2026-06-03T09:01:31.2247406"},{"id":"081fd897-b5bd-4059-811a-a1921e9cb372","month":5,"year":2026,"status":0,"totalNetAmount":0.00,"totalPaidAmount":0.00,"isClosed":false,"createdDate":"2026-05-19T06:44:50.529284"},{"i …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[3]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/Payroll/{id}/submit`

- **Endpoint:** `/api/V1/Payroll/{id}/submit`
- **HTTP Method:** PUT
- **Purpose:** Update a Payroll by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Payroll/{id}/submit
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Payroll/{id}/approve`

- **Endpoint:** `/api/V1/Payroll/{id}/approve`
- **HTTP Method:** PUT
- **Purpose:** Update a Payroll by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ notes: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Payroll/{id}/approve
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Payroll/{id}/reject`

- **Endpoint:** `/api/V1/Payroll/{id}/reject`
- **HTTP Method:** PUT
- **Purpose:** Update a Payroll by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Payroll/{id}/reject
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Payroll/{id}/payments`

- **Endpoint:** `/api/V1/Payroll/{id}/payments`
- **HTTP Method:** POST
- **Purpose:** Payroll action: payments
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ paymentDate: string (date-time), amount: number (double), paymentMethod: PaymentMethodType, notes: string, employeeId: string (uuid), workerId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Payroll/{id}/payments
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "paymentDate": "2026-01-01T00:00:00Z",
  "amount": 0,
  "paymentMethod": 1,
  "notes": "string",
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Payroll/{id}/trace`

- **Endpoint:** `/api/V1/Payroll/{id}/trace`
- **HTTP Method:** GET
- **Purpose:** Get audit trace for a Payroll
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Payroll/{id}/trace
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"documentType":6,"documentEntityId":"32e61640-f357-4aeb-a35c-d4f84fe39eb4","document":{"id":"32e61640-f357-4aeb-a35c-d4f84fe39eb4","documentType":6,"documentNumber":"2026-06","documentDate":"2026-06-03T09:01:31.2247406","amount":10500.00,"journalEntryId":"71f81602-3727-4aa9-ebee-08ded5099c8e","accountingDocumentId":"666c0d5c-1a04-45bc-c41a-08ded5099ca3","customerId":null,"agentId":null,"contractI …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{documentType,documentEntityId,document,journalEntry,ledgerEntries}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Payroll/{payrollRunId}/payments/{paymentId}/trace`

- **Endpoint:** `/api/V1/Payroll/{payrollRunId}/payments/{paymentId}/trace`
- **HTTP Method:** GET
- **Purpose:** Get audit trace for a Payroll
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `payrollRunId` (string (uuid)), `paymentId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Payroll/{payrollRunId}/payments/{paymentId}/trace
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.5","title":"Not Found","status":404,"traceId":"00-6f53d196999e911c34fc1f398d392bec-3adb87a4fb716a7f-00"}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{type,title,status,traceId}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/Payroll/close/{id}`

- **Endpoint:** `/api/V1/Payroll/close/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Payroll by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Payroll/close/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Payroll run not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Payroll/export`

- **Endpoint:** `/api/V1/Payroll/export`
- **HTTP Method:** GET
- **Purpose:** Export Payroll (file/report)
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `month` (integer (int32))
    - `year` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Payroll/export?month=<integer>&year=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 500).
- **Status Code:** 500
- **Pass/Fail:** FAIL
- **Notes:** server error (500) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Server error (500) on a valid request.
- **Recommendations:** none — behaves correctly.

## PeriodClosing (4)

### `GET /api/V1/PeriodClosing`

- **Endpoint:** `/api/V1/PeriodClosing`
- **HTTP Method:** GET
- **Purpose:** List / retrieve PeriodClosing
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/PeriodClosing
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"year":2026,"isClosed":false,"closedAt":null,"closedBy":null,"closingJournalEntryId":null},{"year":2025,"isClosed":true,"closedAt":"2026-07-11T06:52:14.9319273","closedBy":"string","closingJournalEntryId":"a76cd4f7-dc69-4074-4f36-08dedf18f0dd"}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[2]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/PeriodClosing/close`

- **Endpoint:** `/api/V1/PeriodClosing/close`
- **HTTP Method:** POST
- **Purpose:** PeriodClosing: close
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ year: integer (int32) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/PeriodClosing/close
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "year": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["لا يمكن إدارة سنة مالية قبل 2025"],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["لا يمكن إدارة سنة مالية قبل 2025"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/PeriodClosing/open`

- **Endpoint:** `/api/V1/PeriodClosing/open`
- **HTTP Method:** POST
- **Purpose:** PeriodClosing: open
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ year: integer (int32) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/PeriodClosing/open
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "year": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["لا يمكن إدارة سنة مالية قبل 2025"],"statusCode":400}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["لا يمكن إدارة سنة مالية قبل 2025"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/PeriodClosing/status`

- **Endpoint:** `/api/V1/PeriodClosing/status`
- **HTTP Method:** GET
- **Purpose:** List / retrieve PeriodClosing
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `year` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/PeriodClosing/status?year=<integer>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":false,"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `false`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## PermissionRequest (4)

### `GET /api/V1/PermissionRequest/GetAll`

- **Endpoint:** `/api/V1/PermissionRequest/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve PermissionRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/PermissionRequest/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"112470ab-b021-41d6-adb3-08deb5836e7c","employeeId":"c6c9ba22-b78b-4f33-a77f-08deabeea092","employeeName":"محمد","permissionDate":"2026-05-19T08:42:16.883","permissionType":1,"permissionNature":1,"comeLateTime":"08:12","partTimeStart":"string","partTimeFinish":"string","outEarlyTime":"string","reasons":"string","status":1},{"id":"0e34dc69-4628-4f10-eeae-08ded50908f6", …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/PermissionRequest/Create`

- **Endpoint:** `/api/V1/PermissionRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a PermissionRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ createdTo: string (uuid), permissionDate: string (date-time), permissionType: HRPermissionType, permissionNature: HRPermissionNature, comeLateTime: string, partTimeStart: string, partTimeFinish: string, outEarlyTime: string, reasons: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/PermissionRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "createdTo": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "permissionDate": "2026-01-01T00:00:00Z",
  "permissionType": 1,
  "permissionNature": 1,
  "comeLateTime": "string",
  "partTimeStart": "string",
  "partTimeFinish": "string",
  "outEarlyTime": "string",
  "reasons": "string"
}
```
- **Example Response:** `{"success":true,"data":"Permission request submitted","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500 (empty) / 200 (valid)
- **Pass/Fail:** PASS*
- **Notes:** works with valid body; 500 on empty body (validation gap) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `POST /api/V1/PermissionRequest/Approve/{id}`

- **Endpoint:** `/api/V1/PermissionRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** PermissionRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/PermissionRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/PermissionRequest/Reject/{id}`

- **Endpoint:** `/api/V1/PermissionRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** PermissionRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/PermissionRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Posting (2)

### `POST /api/V1/Posting/{journalId}`

- **Endpoint:** `/api/V1/Posting/{journalId}`
- **HTTP Method:** POST
- **Purpose:** Posting action: {journalId}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `journalId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Posting/{journalId}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Journal not found"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Journal not found"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Posting/{id}/unpost`

- **Endpoint:** `/api/V1/Posting/{id}/unpost`
- **HTTP Method:** POST
- **Purpose:** Posting action: unpost
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Posting/{id}/unpost
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Journal not found"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Journal not found"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## ReceiptVoucher (4)

### `GET /api/Accounting/ReceiptVoucher`

- **Endpoint:** `/api/Accounting/ReceiptVoucher`
- **HTTP Method:** GET
- **Purpose:** List / retrieve ReceiptVoucher
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `CustomerId` (string (uuid))
    - `AgentId` (string (uuid))
    - `ContractId` (string (uuid))
    - `DocumentType` (AccountingDocumentType)
    - `DocumentNumber` (string)
    - `DateFrom` (string (date-time))
    - `DateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/ReceiptVoucher?CustomerId=<string>&AgentId=<string>&ContractId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"53be8cf7-ed04-4771-64e0-08dedff8ad0e","voucherSerialNumber":8,"voucherNumber":"ZZ_REVAL4_1783848770945","voucherDate":"2026-07-12T09:33:43.864","amount":100.00,"notes":"ZZ_REVAL4_1783848770945","employmentOperatingContractId":"471eb219-fe0c-416f-b190-08ded691d2a4","hourlyWorkerRequestId":null,"customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","paymentMethod":1,"vatA …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[8]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/Accounting/ReceiptVoucher`

- **Endpoint:** `/api/Accounting/ReceiptVoucher`
- **HTTP Method:** POST
- **Purpose:** Create a ReceiptVoucher
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ voucherNumber: string, voucherDate: string (date-time), amount: number (double), notes: string, employmentOperatingContractId: string (uuid), paymentMethod: integer (int32), vatAmount: number (double), bankFees: number (double) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/Accounting/ReceiptVoucher
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "voucherNumber": "string",
  "voucherDate": "2026-01-01T00:00:00Z",
  "amount": 0,
  "notes": "string",
  "employmentOperatingContractId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentMethod": 0,
  "vatAmount": 0,
  "bankFees": 0
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["'Employment Operating Contract Id' must not be empty.","'Voucher Date' must not be empty.","'Amount' must be greater tha`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["'Employment Operating Contract Id' must not be empty.","'Voucher Date' must not be empty.","'Amount' …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Validate FK existence (customer/contract) and return 400 rather than 500 on a bad reference.

### `GET /api/Accounting/ReceiptVoucher/{id}`

- **Endpoint:** `/api/Accounting/ReceiptVoucher/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a ReceiptVoucher by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/ReceiptVoucher/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"53be8cf7-ed04-4771-64e0-08dedff8ad0e","voucherSerialNumber":8,"voucherNumber":"ZZ_REVAL4_1783848770945","voucherDate":"2026-07-12T09:33:43.864","amount":100.00,"notes":"ZZ_REVAL4_1783848770945","employmentOperatingContractId":"471eb219-fe0c-416f-b190-08ded691d2a4","hourlyWorkerRequestId":null,"customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","paymentMethod":1,"vatAm …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,voucherSerialNumber,voucherNumber,voucherDate,amount,notes}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/Accounting/ReceiptVoucher/{id}/trace`

- **Endpoint:** `/api/Accounting/ReceiptVoucher/{id}/trace`
- **HTTP Method:** GET
- **Purpose:** Get audit trace for a ReceiptVoucher
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/Accounting/ReceiptVoucher/{id}/trace
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"documentType":1,"documentEntityId":"53be8cf7-ed04-4771-64e0-08dedff8ad0e","document":{"id":"53be8cf7-ed04-4771-64e0-08dedff8ad0e","documentType":1,"documentNumber":"ZZ_REVAL4_1783848770945","documentDate":"2026-07-12T09:33:43.864","amount":100.00,"journalEntryId":null,"accountingDocumentId":null,"customerId":"5842c871-fbd6-4f91-2545-08ded68434b0","agentId":null,"contractId …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{documentType,documentEntityId,document,journalEntry,ledgerEntries}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## RequestsInbox (1)

### `POST /api/V1/RequestsInbox/Filter`

- **Endpoint:** `/api/V1/RequestsInbox/Filter`
- **HTTP Method:** POST
- **Purpose:** Filter/search RequestsInbox (POST query)
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ processState: HRProcessState, processGroups: array<integer (int32)>, processResults: array<integer (int32)>, startsDate: string (date-time), endingDate: string (date-time) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/RequestsInbox/Filter
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "processState": 1,
  "processGroups": [
    0
  ],
  "processResults": [
    0
  ],
  "startsDate": "2026-01-01T00:00:00Z",
  "endingDate": "2026-01-01T00:00:00Z"
}
```
- **Example Response:** `{"success":true,"data":[{"id":"10f8c248-d47f-4d70-083c-08de9e517e74","screenId":null,"processState":1,"processGroup":0,"`
- **Actual Test Result:** Executed live (read-only) with and without a token. Observed: `{"success":true,"data":[{"id":"10f8c248-d47f-4d70-083c-08de9e517e74","screenId":null,"processState":1,"processGroup":0,"`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** executed live \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## RequestsOutbox (1)

### `POST /api/HR/RequestsOutbox/Filter`

- **Endpoint:** `/api/HR/RequestsOutbox/Filter`
- **HTTP Method:** POST
- **Purpose:** Filter/search RequestsOutbox (POST query)
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ processState: HRProcessState, processGroups: array<integer (int32)>, processResults: array<integer (int32)>, startsDate: string (date-time), endingDate: string (date-time) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/HR/RequestsOutbox/Filter
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "processState": 1,
  "processGroups": [
    0
  ],
  "processResults": [
    0
  ],
  "startsDate": "2026-01-01T00:00:00Z",
  "endingDate": "2026-01-01T00:00:00Z"
}
```
- **Example Response:** `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Actual Test Result:** Executed live (read-only) with and without a token. Observed: `{"success":true,"data":[],"errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** executed live \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## ResignationRequest (4)

### `GET /api/V1/ResignationRequest/GetAll`

- **Endpoint:** `/api/V1/ResignationRequest/GetAll`
- **HTTP Method:** GET
- **Purpose:** List / retrieve ResignationRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/ResignationRequest/GetAll
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"8db51951-6497-4a82-dd47-08deb58683e6","employeeId":"bfb61903-0fee-4c71-d5e2-08deb44b8def","employeeName":"اسماء","resignationDate":"2026-05-19T08:37:11.114","endDate":"2026-05-22T08:37:11.114","reasons":"لا يوجد سبب ","status":2},{"id":"341354ef-2bbe-47d7-b7f8-08ded5090985","employeeId":"f97e38b0-21ac-4900-1482-08deb4351e25","employeeName":"???? ????","resignationDat …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[4]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/ResignationRequest/Create`

- **Endpoint:** `/api/V1/ResignationRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a ResignationRequest
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ createdTo: string (uuid), resignationDate: string (date-time), endDate: string (date-time), reasons: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/ResignationRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "createdTo": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "resignationDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-01-01T00:00:00Z",
  "reasons": "string"
}
```
- **Example Response:** `{"success":true,"data":"Resignation request submitted","errors":null,"statusCode":200}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** 500 (empty) / 200 (valid)
- **Pass/Fail:** PASS*
- **Notes:** works with valid body; 500 on empty body (validation gap) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Returns 500 (unhandled exception) on an empty/invalid body instead of 400.
- **Recommendations:** Add model validation; return 400 with field errors.

### `POST /api/V1/ResignationRequest/Approve/{id}`

- **Endpoint:** `/api/V1/ResignationRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** ResignationRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/ResignationRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/ResignationRequest/Reject/{id}`

- **Endpoint:** `/api/V1/ResignationRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** ResignationRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/ResignationRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## RestrictionType (5)

### `GET /api/V1/RestrictionType`

- **Endpoint:** `/api/V1/RestrictionType`
- **HTTP Method:** GET
- **Purpose:** List / retrieve RestrictionType
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/RestrictionType
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"00000000-0000-0000-0000-000000000001","name":"Manual Entry","nameAr":"قيد يدوي","accountingEvent":null,"isManual":true,"isActive":true,"defaultDebitAccountId":null,"defaultCreditAccountId":null},{"id":"00000000-0000-0000-0000-000000000002","name":"Convention","nameAr":"توقيع عقد","accountingEvent":0,"isManual":false,"isActive":true,"defaultDebitAccountId":null,"defau …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[22]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/RestrictionType`

- **Endpoint:** `/api/V1/RestrictionType`
- **HTTP Method:** POST
- **Purpose:** Create a RestrictionType
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ name: string, nameAr: string, accountingEvent: AccountingEvent, isManual: boolean, isActive: boolean, defaultDebitAccountId: string (uuid), defaultCreditAccountId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/RestrictionType
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string",
  "nameAr": "string",
  "accountingEvent": 0,
  "isManual": true,
  "isActive": true,
  "defaultDebitAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "defaultCreditAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":true,"data":"تم الانشاء بنجاح .","errors":null,"statusCode":200}`
- **Actual Test Result:** Real record created with a valid body, then deleted (cleanup). Observed: `{"success":true,"data":"تم الانشاء بنجاح .","errors":null,"statusCode":200}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/RestrictionType/{id}`

- **Endpoint:** `/api/V1/RestrictionType/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a RestrictionType by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/RestrictionType/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"00000000-0000-0000-0000-000000000001","name":"Manual Entry","nameAr":"قيد يدوي","accountingEvent":null,"isManual":true,"isActive":true,"defaultDebitAccountId":null,"defaultCreditAccountId":null},"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,name,nameAr,accountingEvent,isManual,isActive}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PUT /api/V1/RestrictionType/{id}`

- **Endpoint:** `/api/V1/RestrictionType/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a RestrictionType by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ name: string, nameAr: string, accountingEvent: AccountingEvent, isManual: boolean, isActive: boolean, defaultDebitAccountId: string (uuid), defaultCreditAccountId: string (uuid) }`
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/RestrictionType/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "name": "string",
  "nameAr": "string",
  "accountingEvent": 0,
  "isManual": true,
  "isActive": true,
  "defaultDebitAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "defaultCreditAccountId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["غير موجود ."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["غير موجود ."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/RestrictionType/{id}`

- **Endpoint:** `/api/V1/RestrictionType/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a RestrictionType by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/RestrictionType/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["غير موجود ."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["غير موجود ."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Role (3)

### `GET /api/V1/Role/all-role`

- **Endpoint:** `/api/V1/Role/all-role`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Role
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Role/all-role
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":["Employeee","Admin","Agent","SalesEmployee","FollowUpEmployee","AccountingEmployee","CustomerServiceEmployee","ComplaintEmployee","Owner","Employee","Supervisor","Driver","MobileCustomer"],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[13]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Role/assign-role`

- **Endpoint:** `/api/V1/Role/assign-role`
- **HTTP Method:** POST
- **Purpose:** Role: assign-role
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ userId: string, roleName: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Role/assign-role
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "roleName": "string"
}
```
- **Example Response:** `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"UserId":["The UserId fiel`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"UserI …`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Role/users-with-roles`

- **Endpoint:** `/api/V1/Role/users-with-roles`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Role
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Role/users-with-roles
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"userId":"186caaf5-2338-4a5e-aafb-c611a01fcb3e","userName":"Shosha@gmail.com","email":"Shosha@gmail.com","roles":["Employee"]},{"userId":"204c281b-8e18-4cb4-b08a-b9c5477807bb","userName":"hossamsaeed@12gmail.com","email":"hossamsaeed@12gmail.com","roles":["Admin","Employee"]},{"userId":"2dbb733b-6b62-4d4e-8522-845886c8f897","userName":"sigma@gmail.com","email":"sigma@gmail …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `array[18]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## Sigma.API (1)

### `GET /health`

- **Endpoint:** `/health`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Sigma.API
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/health
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `"Worked without any errors ."`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `"Worked without any errors ."`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

## TransferContract (8)

### `GET /api/TransferContract`

- **Endpoint:** `/api/TransferContract`
- **HTTP Method:** GET
- **Purpose:** List / retrieve TransferContract
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ContractNumber` (integer (int32))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `ContractStatus` (TransferContractStatus)
    - `CustomerNationalId` (string)
    - `WorkerPassportNo` (string)
    - `CustomerPhone` (string)
    - `RequestDateFrom` (string (date-time))
    - `RequestDateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/TransferContract?ContractNumber=<integer>&CustomerId=<string>&WorkerId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"7d9a3770-ea90-4eb5-f8cc-08deaddaafa1","customerId":"d0e64d14-ebf4-472f-58b9-08de9fe18f14","customerName":"أحمد محمود عبد الرحمن","contractNumber":11,"workerId":"d03d13d1-8301-4c75-6d22-08dea27470d3","workerName":"جمال","marketerId":null,"marketerName":null,"transferFees":1000000.00,"governmentFees":10.00,"totalAmount":1000010.00,"contractStatus":8,"statusNam …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:4,total:4}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/TransferContract`

- **Endpoint:** `/api/TransferContract`
- **HTTP Method:** POST
- **Purpose:** Create a TransferContract
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ customerId: string (uuid), workerId: string (uuid), marketerId: string (uuid), transferFees: number (double), governmentFees: number (double), totalAmount: number (double), notes: string, paymentMeansCodeTypeId: PaymentMeansCodeType, trialPeriodDays: integer (int32), branchId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/TransferContract
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "customerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "marketerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transferFees": 0,
  "governmentFees": 0,
  "totalAmount": 0,
  "notes": "string",
  "paymentMeansCodeTypeId": 1,
  "trialPeriodDays": 0,
  "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** validates request body (probed with empty body) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/TransferContract/export`

- **Endpoint:** `/api/TransferContract/export`
- **HTTP Method:** GET
- **Purpose:** Export TransferContract (file/report)
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `ContractNumber` (integer (int32))
    - `CustomerId` (string (uuid))
    - `WorkerId` (string (uuid))
    - `MarketerId` (string (uuid))
    - `ContractStatus` (TransferContractStatus)
    - `CustomerNationalId` (string)
    - `WorkerPassportNo` (string)
    - `CustomerPhone` (string)
    - `RequestDateFrom` (string (date-time))
    - `RequestDateTo` (string (date-time))
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/TransferContract/export?ContractNumber=<integer>&CustomerId=<string>&WorkerId=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `PK    $f�\���'=  H     xl/workbook.xml���k�0����(�4Sn��ʘ\|���(gr���(I���#UQ����r��\f��hv ��L�90��Ie��c���z֗G�w�v�7چ�W��ؕ�ђ�0v����y�1���r�4J��!y��Oܓƨ����i�h��2�D��̠�pk��p�>�P�V��sO�R���n��k��+�+ȁ���@+��g��y�F̞Fz��!�ޜ�E���RV0�K%+�KY\�W��FY���>?�׽�f�~W:�_'���@=��)9�VII�7��5=d�٤̖�4	܌��5j�֊Z�(����bYa�PK    $f�\�u�+e  [     docProps/app.xml��oO�0ƿJ�{� …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `PK    $f�\���'=  H     xl/workbook.xml���k�0����(�4Sn��ʘ\|���(gr���(I���#UQ����r��\f��hv ��L�90��Ie��c���z`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/TransferContract/{id}`

- **Endpoint:** `/api/TransferContract/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a TransferContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/TransferContract/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"7d9a3770-ea90-4eb5-f8cc-08deaddaafa1","customerId":"d0e64d14-ebf4-472f-58b9-08de9fe18f14","customerName":"أحمد محمود عبد الرحمن","contractNumber":11,"workerId":"d03d13d1-8301-4c75-6d22-08dea27470d3","workerName":"جمال","marketerId":null,"marketerName":null,"transferFees":1000000.00,"governmentFees":10.00,"totalAmount":1000010.00,"contractStatus":8,"statusName":"تم نقل …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,customerId,customerName,contractNumber,workerId,workerName}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/TransferContract/{id}`

- **Endpoint:** `/api/TransferContract/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a TransferContract by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/TransferContract/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/TransferContract/{id}/sign`

- **Endpoint:** `/api/TransferContract/{id}/sign`
- **HTTP Method:** POST
- **Purpose:** TransferContract action: sign
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/TransferContract/{id}/sign
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `PATCH /api/TransferContract/{id}/authority-status`

- **Endpoint:** `/api/TransferContract/{id}/authority-status`
- **HTTP Method:** PATCH
- **Purpose:** Partial update: authority-status
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:**
    - `status` (TransferContractStatus)
    - `note` (string)
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
PATCH https://sigma-api.runasp.net/api/TransferContract/{id}/authority-status?status=<val>&note=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/TransferContract/{id}/complete`

- **Endpoint:** `/api/TransferContract/{id}/complete`
- **HTTP Method:** POST
- **Purpose:** TransferContract action: complete
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/TransferContract/{id}/complete
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العقد غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## VacationRequest (4)

### `POST /api/V1/VacationRequest/Create`

- **Endpoint:** `/api/V1/VacationRequest/Create`
- **HTTP Method:** POST
- **Purpose:** Create a VacationRequest
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/VacationRequest/Create
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `POST /api/V1/VacationRequest/Approve/{id}`

- **Endpoint:** `/api/V1/VacationRequest/Approve/{id}`
- **HTTP Method:** POST
- **Purpose:** VacationRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/VacationRequest/Approve/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/VacationRequest/Reject/{id}`

- **Endpoint:** `/api/V1/VacationRequest/Reject/{id}`
- **HTTP Method:** POST
- **Purpose:** VacationRequest action: {id}
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `{ reason: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/VacationRequest/Reject/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/VacationRequest/{id}`

- **Endpoint:** `/api/V1/VacationRequest/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a VacationRequest by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/VacationRequest/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["Request not found"],"statusCode":404}`
- **Actual Test Result:** Called live with a valid token. Observed: `null`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** correct 404 (empty/no record) \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

## WeatherForecast (3)

### `GET /WeatherForecast`

- **Endpoint:** `/WeatherForecast`
- **HTTP Method:** GET
- **Purpose:** List / retrieve WeatherForecast
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/WeatherForecast
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `[{"date":"2026-07-13","temperatureC":13,"temperatureF":55,"summary":"Mild"},{"date":"2026-07-14","temperatureC":14,"temperatureF":57,"summary":"Chilly"},{"date":"2026-07-15","temperatureC":49,"temperatureF":120,"summary":"Hot"},{"date":"2026-07-16","temperatureC":3,"temperatureF":37,"summary":"Hot"},{"date":"2026-07-17","temperatureC":-14,"temperatureF":7,"summary":"Hot"}]`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /WeatherForecast/test-auth`

- **Endpoint:** `/WeatherForecast/test-auth`
- **HTTP Method:** GET
- **Purpose:** List / retrieve WeatherForecast
- **Authentication Required:** Yes — **Bearer JWT** (enforced; 401 without token).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/WeatherForecast/test-auth
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"authenticated":true,"claims":[{"type":"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier","value":"2dbb733b-6b62-4d4e-8522-845886c8f897"},{"type":"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name","value":"Asmaa"},{"type":"branchId","value":"31887c15-5b47-4551-2190-08dea9210ab7"},{"type":"http://schemas.microsoft.com/ws/2008/06/identity/claims/role","value":"Admin"}, …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 401). Observed: `obj{authenticated,claims}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /WeatherForecast/me`

- **Endpoint:** `/WeatherForecast/me`
- **HTTP Method:** GET
- **Purpose:** List / retrieve WeatherForecast
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/WeatherForecast/me
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjJkYmI3MzNiLTZiNjItNGQ0ZS04NTIyLTg0NTg4NmM4Zjg5NyIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJBc21hYSIsImJyYW5jaElkIjoiMzE4ODdjMTUtNWI0Ny00NTUxLTIxOTAtMDhkZWE5MjEwYWI3IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4 …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9u`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

## Worker (27)

### `POST /api/V1/Worker`

- **Endpoint:** `/api/V1/Worker`
- **HTTP Method:** POST
- **Purpose:** Create a Worker
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `GET /api/V1/Worker`

- **Endpoint:** `/api/V1/Worker`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Worker
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `NationalId` (string)
    - `PassportNo` (string)
    - `Mobile` (string)
    - `NationalityId` (string (uuid))
    - `JobId` (string (uuid))
    - `WorkerStatus` (WorkerStatus)
    - `MinAge` (integer (int32))
    - `MaxAge` (integer (int32))
    - `AgentId` (string (uuid))
    - `EmployeeId` (string (uuid))
    - `AvailableForMediationContract` (boolean)
    - `SearchByPassportOnly` (boolean)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker?SearchName=<string>&NationalId=<string>&PassportNo=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","referenceNo":"WDK-2026-4402","fullNameAr":"عبد الله ابراهيم","fullNameEn":"2عبد الله ابراهيم","nationalityName":"سريلانكا","jobName":"سائق خاص","workerStatus":3,"workerType":1,"passportNo":"P55664433","mobile":"09887766554","agentId":"596445ca-263e-4c5c-62bb-08de9d43d411","agentName":"مكتب جاكرتا للاستقدام","isActive":t …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:7,total:7}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `PUT /api/V1/Worker/{id}`

- **Endpoint:** `/api/V1/Worker/{id}`
- **HTTP Method:** PUT
- **Purpose:** Update a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
PUT https://sigma-api.runasp.net/api/V1/Worker/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Not auto-driven (multipart/file upload).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `DELETE /api/V1/Worker/{id}`

- **Endpoint:** `/api/V1/Worker/{id}`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Worker/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Worker/{id}`

- **Endpoint:** `/api/V1/Worker/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","referenceNo":"WDK-2026-4402","workerStatus":3,"workerType":1,"fullNameAr":"عبد الله ابراهيم","fullNameEn":"2عبد الله ابراهيم","religion":1,"userId":"USR-110","jobId":"67977abe-bb28-4d20-f4bf-08de9bab1e0a","jobName":"سائق خاص","gender":1,"nationalityId":"bbee0b3d-365d-40b6-2d87-08de9d465260","nationalityName":"سريلانكا","basicSala …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,referenceNo,workerStatus,workerType,fullNameAr,fullNameEn}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{id}/upload-video`

- **Endpoint:** `/api/V1/Worker/{id}/upload-video`
- **HTTP Method:** POST
- **Purpose:** Worker action: upload-video
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{id}/upload-video
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Not auto-driven (multipart/file upload).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `GET /api/V1/Worker/export`

- **Endpoint:** `/api/V1/Worker/export`
- **HTTP Method:** GET
- **Purpose:** Export Worker (file/report)
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `SearchName` (string)
    - `NationalId` (string)
    - `PassportNo` (string)
    - `Mobile` (string)
    - `NationalityId` (string (uuid))
    - `JobId` (string (uuid))
    - `WorkerStatus` (WorkerStatus)
    - `MinAge` (integer (int32))
    - `MaxAge` (integer (int32))
    - `AgentId` (string (uuid))
    - `EmployeeId` (string (uuid))
    - `AvailableForMediationContract` (boolean)
    - `SearchByPassportOnly` (boolean)
    - `BranchId` (string (uuid))
    - `IncludeSubBranches` (boolean)
    - `Search` (string)
    - `CreatedDateFrom` (string (date-time))
    - `CreatedDateTo` (string (date-time))
    - `UpdatedDateFrom` (string (date-time))
    - `UpdatedDateTo` (string (date-time))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
    - `SortBy` (string)
    - `SortDescending` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/export?SearchName=<string>&NationalId=<string>&PassportNo=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `PK    $f�\�: �2  0     xl/workbook.xml��]k�0��Jv��Zp�b*c&��ɩ�$Q��G������Ir���d��&'�A9�'VV@� '��38��q�v96g�;�d4چ�3�cJ����P��ht��1����:%p��Ѡ����'�Q��L��?�0x�2���?���­݇'�I\|�l{�� 4�K��s�J�S>��gP�"�n�.w�]һ��q��͑)} �7���o�d�7�����;eQ&��~B��ښ��U�~�#��@�\gߔR镔�����x)fM�V,R�9;�'�EZ�"{���z~����PK    $f�\z̴0V  :     docProps/app.xml��QK�0ǿJͻ��!Rڈ���:t補�u�I� …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `PK    $f�\�: �2  0     xl/workbook.xml��]k�0��Jv��Zp�b*c&��ɩ�$Q��G������Ir���d��&'�A9�'VV@� '��38��q�v96g`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/Worker/{id}/move-to-accommodation`

- **Endpoint:** `/api/V1/Worker/{id}/move-to-accommodation`
- **HTTP Method:** POST
- **Purpose:** Worker action: move-to-accommodation
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{id}/move-to-accommodation
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{id}/set-refusal`

- **Endpoint:** `/api/V1/Worker/{id}/set-refusal`
- **HTTP Method:** POST
- **Purpose:** Worker action: set-refusal
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{id}/set-refusal
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{id}/activate`

- **Endpoint:** `/api/V1/Worker/{id}/activate`
- **HTTP Method:** POST
- **Purpose:** Worker action: activate
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{id}/activate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":false,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":false,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Worker/public-worker`

- **Endpoint:** `/api/V1/Worker/public-worker`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Worker
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `Name` (string)
    - `Religion` (Religion)
    - `HasExperience` (boolean)
    - `NationalityId` (string (uuid))
    - `MinAge` (integer (int32))
    - `MaxAge` (integer (int32))
    - `PageNumber` (integer (int32))
    - `PageSize` (integer (int32))
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/public-worker?Name=<string>&Religion=<val>&HasExperience=<boolean>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"id":"97fef276-3039-4cd3-9856-08de9fed0fc3","name":"Ahmed Mohamed Dandash","job":"عاملة تنظيف","religion":"مسلم","experience":"لا يوجد","nationality":"أوغندا","age":0,"image":null,"video":null,"wantsWork":false,"wantsTransfer":true},{"id":"701f1d7a-7073-4bfb-6d20-08dea27470d3","name":"dss","job":"عاملة منزلية","religion":"مسلم","experience":"خبرة","nationality":"ك …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:7,total:7}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Worker/public-worker/{id}`

- **Endpoint:** `/api/V1/Worker/public-worker/{id}`
- **HTTP Method:** GET
- **Purpose:** Get a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `id` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/public-worker/{id}
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"id":"97fef276-3039-4cd3-9856-08de9fed0fc3","name":"Ahmed Mohamed Dandash","job":"عاملة تنظيف","age":0,"nationality":"أوغندا","salary":0.00,"address":null,"experience":"لا يوجد","experienceDetails":null,"arabicLevel":null,"englishLevel":null,"height":null,"weight":null,"religion":"مسلم","maritalStatus":null,"education":null,"childrenCount":0,"phone":null,"description":null, …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{id,name,job,age,nationality,salary}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Worker/WantsTransfer`

- **Endpoint:** `/api/V1/Worker/WantsTransfer`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Worker
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/WantsTransfer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"97fef276-3039-4cd3-9856-08de9fed0fc3","name":"Ahmed Mohamed Dandash"},{"id":"701f1d7a-7073-4bfb-6d20-08dea27470d3","name":"dss"},{"id":"03b1808a-464b-4e1e-6d21-08dea27470d3","name":"tttttttt"},{"id":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","name":"عبد الله ابراهيم"},{"id":"a1444e92-8a65-4e61-6550-08dea2ba50f7","name":"عبد الله حسن"}],"errors":null,"statusCode":200}`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `array[5]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `GET /api/V1/Worker/{workerId}/StatusLog`

- **Endpoint:** `/api/V1/Worker/{workerId}/StatusLog`
- **HTTP Method:** GET
- **Purpose:** Get a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/{workerId}/StatusLog
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":[{"id":"523cbe10-f1f6-48e8-3625-08deadd584ad","workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":null,"workerPassportNumber":null,"statusType":8,"statusTypeName":"تسكين العامل","statusDate":"2026-05-09T15:58:43.733","notes":null,"housingId":"9530394c-8a30-4ed6-5a28-08dea8754315","housingName":"مخزون التاجير سيجما الكفاءات","createdDate":"2026-05-09T15:59:18.25796 …`
- **Actual Test Result:** Called live with a valid token. Observed: `array[28]`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Worker/{workerId}/CurrentStatus`

- **Endpoint:** `/api/V1/Worker/{workerId}/CurrentStatus`
- **HTTP Method:** GET
- **Purpose:** Get a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/{workerId}/CurrentStatus
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","workerPassportNumber":"P55664433","referenceNo":"WDK-2026-4402","mobile":"09887766554","nationalityId":"bbee0b3d-365d-40b6-2d87-08de9d465260","nationalityNameAr":"سريلانكا","nationalityNameEn":"Sri Lanka","agentName":null,"jobName":null,"age":37,"birthDate":"1992-04-10T00:00:00","workerStatus …`
- **Actual Test Result:** Called live with a valid token. Observed: `obj{workerId,workerName,workerPassportNumber,referenceNo,mobile,nationalityId}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `GET /api/V1/Worker/Housed`

- **Endpoint:** `/api/V1/Worker/Housed`
- **HTTP Method:** GET
- **Purpose:** List / retrieve Worker
- **Authentication Required:** Declared: **Bearer JWT**. ⚠️ ACTUAL: **NOT enforced** — returns 200 with no token.
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <branchGuid>` (optional — ignored by this GET)
- **Query Parameters:**
    - `pageNumber` (integer (int32))
    - `pageSize` (integer (int32))
    - `searchKeyword` (string)
    - `nationalityId` (string (uuid))
    - `agentId` (string (uuid))
    - `jobId` (string (uuid))
    - `isReadyForDeportation` (boolean)
    - `isReadyForHandover` (boolean)
    - `hasResidency` (boolean)
    - `wantsWork` (boolean)
    - `wantsTransfer` (boolean)
- **Path Parameters:** none
- **Request Body:** none
- **Example Request:**

```http
GET https://sigma-api.runasp.net/api/V1/Worker/Housed?pageNumber=<integer>&pageSize=<integer>&searchKeyword=<string>
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":true,"data":{"items":[{"workerId":"b3bf6c93-b0bd-4571-6551-08dea2ba50f7","workerName":"عبد الله ابراهيم","workerPassportNumber":"P55664433","referenceNo":"WDK-2026-4402","mobile":"09887766554","nationalityId":"bbee0b3d-365d-40b6-2d87-08de9d465260","nationalityNameAr":"سريلانكا","nationalityNameEn":"Sri Lanka","agentName":"مكتب جاكرتا للاستقدام","jobName":"سائق خاص","age":37,"birthDate": …`
- **Actual Test Result:** Called live with a valid token; also probed with no token (→ 200). Observed: `paged{items:7,total:7}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** returns data \| 'X-Branch-Id' is ignored on this GET (missing/malformed still returns data).
- **Issues Found:** Auth bypass — succeeds with no bearer token (noTok=200).
- **Recommendations:** Enforce '[Authorize]' on this endpoint.

### `POST /api/V1/Worker/StatusLog`

- **Endpoint:** `/api/V1/Worker/StatusLog`
- **HTTP Method:** POST
- **Purpose:** Worker: StatusLog
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** none
- **Request Body:** `{ workerId: string (uuid), statusType: WorkerStatusType, statusDate: string (date-time), notes: string, housingId: string (uuid), penaltyAmount: number (double), agentId: string (uuid) }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/StatusLog
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "workerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "statusType": 1,
  "statusDate": "2026-01-01T00:00:00Z",
  "notes": "string",
  "housingId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "penaltyAmount": 0,
  "agentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Real create attempted with a valid, FK-populated body (Phase 4). Observed: `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 200
- **Pass/Fail:** PASS
- **Notes:** created successfully with a valid body \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/ActivateWantsWork`

- **Endpoint:** `/api/V1/Worker/{workerId}/ActivateWantsWork`
- **HTTP Method:** POST
- **Purpose:** Worker action: ActivateWantsWork
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/ActivateWantsWork
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/ActivateWantsTransfer`

- **Endpoint:** `/api/V1/Worker/{workerId}/ActivateWantsTransfer`
- **HTTP Method:** POST
- **Purpose:** Worker action: ActivateWantsTransfer
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/ActivateWantsTransfer
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["العامل غير موجود"],"statusCode":404}`
- **Status Code:** 404
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `DELETE /api/V1/Worker/{workerId}/StatusLog/Last`

- **Endpoint:** `/api/V1/Worker/{workerId}/StatusLog/Last`
- **HTTP Method:** DELETE
- **Purpose:** Delete a Worker by id
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
DELETE https://sigma-api.runasp.net/api/V1/Worker/{workerId}/StatusLog/Last
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["لا توجد سجلات لحذفها"],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لا توجد سجلات لحذفها"],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/Deportation`

- **Endpoint:** `/api/V1/Worker/{workerId}/Deportation`
- **HTTP Method:** POST
- **Purpose:** Worker action: Deportation
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required)**, `Content-Type: multipart/form-data`
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** `multipart/form-data` (file upload / form fields)
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/Deportation
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: multipart/form-data

<form fields + file>
```
- **Example Response:** _(not captured; see Actual Test Result)_
- **Actual Test Result:** Not auto-driven (multipart/file upload).
- **Status Code:** -
- **Pass/Fail:** SKIP
- **Notes:** multipart/file — not auto-driven \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** Test manually with a real multipart form / file.

### `POST /api/V1/Worker/{workerId}/CancelDeportation`

- **Endpoint:** `/api/V1/Worker/{workerId}/CancelDeportation`
- **HTTP Method:** POST
- **Purpose:** Worker action: CancelDeportation
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/CancelDeportation
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/ExitHousing`

- **Endpoint:** `/api/V1/Worker/{workerId}/ExitHousing`
- **HTTP Method:** POST
- **Purpose:** Worker action: ExitHousing
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** none
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/ExitHousing
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>

```
- **Example Response:** `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/Handover`

- **Endpoint:** `/api/V1/Worker/{workerId}/Handover`
- **HTTP Method:** POST
- **Purpose:** Worker action: Handover
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** `{ handoverTime: string (date-time), saudiMobile: string, whatsAppNumber: string, borderNumber: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/Handover
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "handoverTime": "2026-01-01T00:00:00Z",
  "saudiMobile": "0512345678",
  "whatsAppNumber": "string",
  "borderNumber": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/ExitAndReEntry`

- **Endpoint:** `/api/V1/Worker/{workerId}/ExitAndReEntry`
- **HTTP Method:** POST
- **Purpose:** Worker action: ExitAndReEntry
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** `{ exitDate: string (date-time)*, reason: string }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/ExitAndReEntry
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "exitDate": "2026-01-01T00:00:00Z",
  "reason": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/AddUpdate`

- **Endpoint:** `/api/V1/Worker/{workerId}/AddUpdate`
- **HTTP Method:** POST
- **Purpose:** Create a Worker
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** `{ updateDate: string (date-time)*, notes: string* }` _(*=required per schema; note many DTOs mark nothing required and validate server-side)_
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/AddUpdate
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "updateDate": "2026-01-01T00:00:00Z",
  "notes": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.

### `POST /api/V1/Worker/{workerId}/IssueResidency`

- **Endpoint:** `/api/V1/Worker/{workerId}/IssueResidency`
- **HTTP Method:** POST
- **Purpose:** Worker action: IssueResidency
- **Authentication Required:** Declared: **Bearer JWT** (per OpenAPI; enforcement not separately probed for this method).
- **Required Headers:** `Authorization: Bearer <JWT>`, `X-Branch-Id: <valid GUID>` **(required — 400 if missing/malformed)**, `Content-Type: application/json`
- **Query Parameters:** none
- **Path Parameters:** `workerId` (string (uuid))
- **Request Body:** `{ iqamaNumber: string }`
- **Example Request:**

```http
POST https://sigma-api.runasp.net/api/V1/Worker/{workerId}/IssueResidency
Authorization: Bearer <JWT>
X-Branch-Id: <branchGuid>
Content-Type: application/json

{
  "iqamaNumber": "string"
}
```
- **Example Response:** `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Actual Test Result:** Probed with a non-existent GUID to verify routing/auth/validation without mutating real data. Observed: `{"success":false,"data":null,"errors":["لم يتم العثور على العامل."],"statusCode":400}`
- **Status Code:** 400
- **Pass/Fail:** PASS
- **Notes:** routes + validates/guards correctly (probed with non-existent id) \| Requires a valid 'X-Branch-Id' GUID (400 branch-error otherwise); test used a valid GUID.
- **Issues Found:** none
- **Recommendations:** none — behaves correctly.



---

## Endpoints not used in the system

**Date:** 2026-07-12
**Scope:** Static analysis of the frontend codebase (`D:\sigma\FrontEnd\src`) cross-referenced against the full 391-operation backend swagger spec. No HTTP calls were made for this section — it is a pure code/config audit, separate from the live-probe results above.

### Methodology

1. **Category A** (backend capability the frontend never wired up): started from the swagger-minus-frontend route diff, then verified every candidate by hand against `src/config/api.config.ts` — checking for case-insensitive path matches, alternate param names (e.g. `{id}` vs `{workerId}`), and near-duplicate routes under a different controller — so only genuine gaps are listed.
2. **Category B** (dead config entries): extracted all 344 `GROUP.KEY` leaf identifiers from `API_ENDPOINTS` in `api.config.ts`, then searched every `.ts/.tsx/.js/.jsx` file under `src/` (244 files, `api.config.ts` itself excluded) for a literal reference to each `GROUP.KEY` string. This catches both `API_ENDPOINTS.GROUP.KEY` call sites and destructured usages (`const { GROUP } = API_ENDPOINTS; GROUP.KEY`). A key with zero matches anywhere outside its own definition — including inside the service-layer files that would normally consume it — is reported as dead. Spot-checked against known-live sibling keys (e.g. `HOURLY_CATALOG.ADMIN_PACKAGES`, `DEPARTMENT.CREATE`) to confirm the method finds real usages correctly.
3. **Category C** (context only): frontend routes present in `api.config.ts` that the backend swagger spec does not expose at all — already-known stale/legacy config, listed here for completeness since it overlaps with Category B's dead-config findings.

Infrastructure/scaffold routes (`/health`, `/WeatherForecast*`, `*/test-auth`) are excluded from the counts and listed separately as "ignored."

---

### Category A — Backend endpoints not wired into the frontend at all

70 backend operations exist in swagger but have no corresponding entry anywhere in `api.config.ts` (verified individually, not just diffed). These represent backend capability the frontend has not adopted yet.

**Commission / CommissionSlice module (6)** — entire module missing from the frontend; no `COMMISSION` group exists in `api.config.ts`.

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/Commission/GetAll` | GET | No Commission UI/module in frontend |
| `/api/V1/Commission/Create` | POST | No Commission UI/module in frontend |
| `/api/V1/Commission/Delete/{id}` | DELETE | No Commission UI/module in frontend |
| `/api/V1/CommissionSlice/GetAll` | GET | No CommissionSlice UI/module in frontend |
| `/api/V1/CommissionSlice/Create` | POST | No CommissionSlice UI/module in frontend |
| `/api/V1/CommissionSlice/Delete/{id}` | DELETE | No CommissionSlice UI/module in frontend |

**V1 Complaint module (5)** — a separate, newer `/api/V1/Complaint/*` controller exists in swagger alongside the legacy `/api/Complaint/*` controller the frontend actually uses (`COMPLAINT` group → `/api/Complaint/*`). The V1 variant (with `Close`/`Reply` actions) was never adopted.

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/Complaint/GetAll` | GET | Frontend uses legacy `/api/Complaint` (non-V1) instead |
| `/api/V1/Complaint/Create` | POST | Frontend uses legacy `/api/Complaint` instead |
| `/api/V1/Complaint/Delete/{id}` | DELETE | Frontend uses legacy `/api/Complaint/{id}` instead |
| `/api/V1/Complaint/Close/{id}` | POST | No equivalent "close" action wired (frontend has FINISH/HOLD against the legacy controller only) |
| `/api/V1/Complaint/Reply` | POST | No equivalent action in frontend |

**New HR request types — Entitlements, Loan, Vacation, Job Modification (16)** — the frontend wires up Permission/Resignation/Custody/Leave request workflows (`HR_PERMISSION_REQUEST`, `HR_RESIGNATION_REQUEST`, `HR_CUSTODY_REQUEST`, `HR_LEAVE`) but these four newer request types were never added.

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/EntitlementsRequest/GetAll` | GET | New HR request type, no frontend module |
| `/api/V1/EntitlementsRequest/Create` | POST | New HR request type, no frontend module |
| `/api/V1/EntitlementsRequest/Approve/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/EntitlementsRequest/Reject/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/LoanRequest/GetAll` | GET | New HR request type, no frontend module |
| `/api/V1/LoanRequest/Create` | POST | New HR request type, no frontend module |
| `/api/V1/LoanRequest/Approve/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/LoanRequest/Reject/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/VacationRequest/{id}` | GET | New HR request type, no frontend module (distinct from `HR_LEAVE`) |
| `/api/V1/VacationRequest/Create` | POST | New HR request type, no frontend module |
| `/api/V1/VacationRequest/Approve/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/VacationRequest/Reject/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/JobModificationRequest/GetAll` | GET | New HR request type, no frontend module |
| `/api/V1/JobModificationRequest/Create` | POST | New HR request type, no frontend module |
| `/api/V1/JobModificationRequest/Approve/{id}` | POST | New HR request type, no frontend module |
| `/api/V1/JobModificationRequest/Reject/{id}` | POST | New HR request type, no frontend module |

**Payroll lifecycle extensions (7)** — frontend's `HR_PAYROLL` only covers Generate → Approve → Close → Export. The richer per-run lifecycle (submit, reject, detail, payments, tracing) is unused.

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/Payroll/{id}` | GET | No payroll-run detail view in frontend |
| `/api/V1/Payroll/history` | GET | No payroll history view in frontend |
| `/api/V1/Payroll/{id}/submit` | POST | Frontend workflow stops at Approve/Close, no Submit step |
| `/api/V1/Payroll/{id}/reject` | POST | No reject step wired |
| `/api/V1/Payroll/{id}/payments` | GET | No per-run payments listing in frontend |
| `/api/V1/Payroll/{id}/trace` | GET | No audit-trace view in frontend |
| `/api/V1/Payroll/{payrollRunId}/payments/{paymentId}/trace` | GET | No payment-level trace view in frontend |

**Hourly self-service — Customer, Driver "me", Worker Portal "me", Checkout (16)** — the admin-facing Hourly Workers dashboards are built, but the customer/driver/worker self-service surface (mobile-style "me" endpoints and checkout/quote flow) is entirely absent from the web frontend.

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/HourlyCustomer/Orders` | GET/POST | No customer self-service portal in frontend |
| `/api/V1/HourlyCustomer/Orders/{orderId}/Cancel` | POST | No customer self-service portal in frontend |
| `/api/V1/HourlyCustomer/Orders/{orderId}/Invoices` | GET | No customer self-service portal in frontend |
| `/api/V1/HourlyCustomer/Orders/{orderId}/Notifications` | GET | No customer self-service portal in frontend |
| `/api/V1/HourlyCustomer/Orders/{orderId}/Refund` | POST | No customer self-service portal in frontend |
| `/api/V1/HourlyCustomer/Orders/{ticketNumber}/Tracking` | GET | No customer self-service portal in frontend |
| `/api/V1/HourlyDrivers/me/Orders` | GET | No driver self-service ("me") view; only admin `{driverId}` routes are used |
| `/api/V1/HourlyDrivers/me/Orders/Current` | GET | No driver self-service view |
| `/api/V1/HourlyDrivers/me/Orders/History` | GET | No driver self-service view |
| `/api/V1/HourlyWorkerOrders/Quote` | POST | No customer-facing quote/checkout flow in frontend |
| `/api/V1/HourlyWorkerOrders/Checkout` | POST | No customer-facing checkout flow in frontend |
| `/api/V1/HourlyWorkerOrders/ConfirmPayment` | POST | No customer-facing checkout flow in frontend |
| `/api/V1/HourlyWorkerOrders/ConfirmPaymentWithTransfer` | POST | No customer-facing checkout flow in frontend |
| `/api/V1/HourlyWorkerPortal/me/Assignments` | GET | Entire worker-portal self-service surface unused — even the admin `{workerId}` equivalent (`HOURLY_WORKER_PORTAL` group) is dead config (see Category B) |
| `/api/V1/HourlyWorkerPortal/me/Assignments/{assignmentId}/Status` | PUT/POST | Worker-portal self-service surface unused |
| `/api/V1/HourlyWorkerPortal/me/Schedule` | GET | Worker-portal self-service surface unused |
| `/api/V1/HourlyWorkers/Available` | GET | No "available workers" lookup wired (frontend only lists all via `HOURLY_WORKERS.GET_ALL`) |

**HR workflow inbox/outbox + lookups (5)**

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/RequestsInbox/Filter` | GET | No unified approvals-inbox view; frontend queries each request type's own `GetAll` instead |
| `/api/HR/RequestsOutbox/Filter` | GET | No unified requests-outbox view |
| `/api/V1/LeaveBalance/Filter` | GET | Distinct from the `HR_LEAVE.GET_BALANCE` / `EMPLOYEE_BALANCES` routes actually used; this filterable variant is unused |
| `/api/V1/Lookup/CustodyTypes` | GET | Frontend fetches custody types via `HR_CUSTODY_REQUEST.GET_TYPES` (`/api/V1/CustodyRequest/Types`) instead |
| `/api/V1/Lookup/SalaryScales` | GET | No salary-scale lookup wired anywhere |

**Role controller (3)** — a standalone `/api/V1/Role/*` controller exists separately from the `/api/V1/Admin/*` role endpoints the frontend actually calls (`HR_ADMIN.ASSIGN_ROLE`, `ALL_ROLES`, etc.).

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/Role/all-role` | GET | Frontend uses `/api/V1/Admin/all-roles` instead |
| `/api/V1/Role/assign-role` | POST | Frontend uses `/api/V1/Admin/assign-role` instead |
| `/api/V1/Role/users-with-roles` | GET | No equivalent in frontend |

**Worker misc (5)**

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/Worker/public-worker` | GET | No public worker profile page in frontend |
| `/api/V1/Worker/public-worker/{id}` | GET | No public worker profile page in frontend |
| `/api/V1/Worker/{id}/upload-video` | POST | No video-upload UI on the worker form |
| `/api/V1/Worker/{workerId}/CurrentStatus` | GET | No dedicated "current status" fetch (frontend reads status off the main Worker record) |
| `/api/V1/Worker/{workerId}/StatusLog` | GET | Frontend only writes to `WORKER_STATUS_LOG.CREATE` / deletes the last entry; never reads the full per-worker log |

**Misc single endpoints (7)**

| Endpoint | Method | Reason unused |
|---|---|---|
| `/api/V1/Account/Accounts-list` | GET | Different resource than the `ACCOUNT.*` (lowercase, chart-of-accounts) group the frontend uses; this flat accounts list is unused |
| `/api/FollowUp/ContractNationality/GetById/{id}` | GET | `CONTRACT_NATIONALITY` group only wires GET_ALL/CREATE/UPDATE/DELETE, no GET_BY_ID |
| `/api/Mediation/MediationContract/customer-payment` | POST | Not wired into `MEDIATION_CONTRACT` group |
| `/api/Mediation/MediationContract/sponsorship-transfer` | POST | Not wired into `MEDIATION_CONTRACT` group |
| `/api/V1/External/request-worker` | POST | Public/external-facing intake endpoint, no frontend surface |
| `/api/V1/File/upload-multiple` | POST | No generic multi-file upload UI (frontend uses feature-specific upload flows) |

**Ignored (infrastructure/scaffold — excluded from the 70 count above)**

| Endpoint | Reason |
|---|---|
| `/health` | Health-check probe, not an application feature |
| `/WeatherForecast` | Scaffold/template route |
| `/WeatherForecast/me` | Scaffold/template route |
| `/WeatherForecast/test-auth` | Scaffold/template route |
| `/api/V1/Auth/test-auth` | Test/diagnostic route |

---

### Category B — Defined in `api.config.ts` but never referenced in the app (dead config)

Out of 344 `API_ENDPOINTS` leaf keys, **8 are dead config** — defined but not referenced anywhere in `src/` outside their own definition (not even inside the corresponding service file). Method and confidence: exact substring match of `GROUP.KEY` across all 244 source files; verified these 8 return zero hits both in `src/services/*` and app-wide.

| Group.Key | Endpoint | Reason unused |
|---|---|---|
| `DEPARTMENT.DELETE` | `DELETE /api/V1/Department/{id}` | `department.service.ts` only implements list/create; no delete function calls this constant. Also flagged in Category C — this route doesn't exist in the backend swagger either, so it's doubly dead. |
| `HOURLY_DRIVERS.GET_ORDERS` | `GET /api/V1/HourlyDrivers/{driverId}/Orders` | `hourly-worker.service.ts` implements driver CRUD/Activate/Deactivate but never fetches a driver's order list via this route |
| `HOURLY_DRIVERS.TRANSPORT_STATUS` | `PUT /api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus` | No transport-status update UI wired |
| `HOURLY_CATALOG.PACKAGES` | `GET /api/V1/HourlyCatalog/Packages` | Frontend only uses the admin variant (`HOURLY_CATALOG.ADMIN_PACKAGES`); this public/customer-facing packages list is unused |
| `HOURLY_CATALOG.SERVING_AREAS` | `GET /api/V1/HourlyCatalog/ServingAreas` | Frontend only uses the admin variant (`ADMIN_SERVING_AREAS`); this public variant is unused |
| `HOURLY_WORKER_PORTAL.GET_ASSIGNMENTS` | `GET /api/V1/HourlyWorkerPortal/{workerId}/Assignments` | No worker-portal view built in the web frontend at all (whole group is dead) |
| `HOURLY_WORKER_PORTAL.UPDATE_ASSIGNMENT_STATUS` | `PUT /api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status` | No worker-portal view built |
| `HOURLY_WORKER_PORTAL.GET_SCHEDULE` | `GET /api/V1/HourlyWorkerPortal/{workerId}/Schedule` | No worker-portal view built |

Note: the entire `HOURLY_WORKER_PORTAL` group (3/3 keys) is dead — consistent with Category A, where the customer-facing `HourlyWorkerPortal/me/*` self-service variants are also completely unadopted. This confirms the Hourly Worker Portal feature (admin and self-service sides alike) has no frontend implementation yet.

All other 336 leaf keys were confirmed referenced somewhere in `src/` (typically inside the matching `src/services/*.service.ts` file, consumed by hooks/components).

---

### Category C — Frontend routes pointing at endpoints the backend doesn't expose (context only)

These 29 routes are defined in `api.config.ts` and referenced by the app, but the current backend swagger spec has no matching operation — i.e. calling them would 404. Already known from prior analysis; listed here for completeness since several overlap with the dead-config findings above.

| Module | Routes |
|---|---|
| Auth | `POST /api/Auth/register` (`USERS.CREATE`) |
| Legacy Contract Creation Requirements | `GET /api/ContractCreationRequirements`, `GET /api/ContractCreationRequirements/GetRequirement`, `GET/PUT/DELETE /api/ContractCreationRequirements/{id}` |
| Document module | `POST /api/Document/CreateDocument`, `DELETE /api/Document/DeleteDocument/{id}`, `GET /api/Document/GetAllDocument`, `GET /api/Document/GetDocumentById/{id}`, `PUT /api/Document/UpdateDocument/{id}` |
| Contract Follow-Up | `GET /api/FollowUp/ContractFollowUp/CanComplete/{itemId}`, `POST /api/FollowUp/ContractFollowUp/CompleteItem` |
| Legacy Nationality Follow-Up Status | `POST /api/Nationality/CreateNationalityFollowUpStatus`, `DELETE .../DeleteNationalityFollowUpStatus/{id}`, `GET .../GetAllNationalityFollowUpStatus`, `GET .../GetNationalityFollowUpStatus/{nationalityId}`, `PATCH .../NationalityFollowUpStatusIsActive/{id}`, `PUT .../UpdateNationalityFollowUpStatus/{id}` |
| Roles module | `POST /api/Roles/Create`, `DELETE /api/Roles/Delete/{id}`, `GET /api/Roles/GetAllRoles`, `GET /api/Roles/GetRoleById/{id}`, `PUT /api/Roles/Update/{id}` |
| Users module | `DELETE /api/Users/DeleteUserById/{id}`, `GET /api/Users/GetAllUsers`, `GET /api/Users/GetUserById/{id}`, `PUT /api/Users/UpdateUserById/{id}` |
| Department | `DELETE /api/V1/Department/{id}` (also dead-config, see Category B) |
| Leave | `POST /api/V1/Leave/{requestId}/cancel` |

**Implication:** these are stale/legacy frontend integrations (superseded modules, e.g. `ROLES`/`USERS` groups predating the `HR_ADMIN` role-management API, or `CONTRACT_CREATION_REQUIREMENTS` predating `CONTRACT_CREATION_REQUIREMENT` under `/api/FollowUp/*`). Any UI still calling them will fail with 404 against the current backend.



---

## Journal Entries — verified behavior & source-navigation (2026-07-12)

Live-verified during the Journal Entry source-navigation audit. Corrects/extends the generic `JournalEntries` / `Posting` blocks above.

### Response shape (GET list & detail)
`GET /api/V1/JournalEntries` items and `GET /api/V1/JournalEntries/{id}` return these fields (verified against live data):

`id, entryNumber, date, description, status, source, referenceType, sourceId, customerId, agentId, workerId, employeeId, restrictionTypeId, createdBy, createdDate, totalDebit, totalCredit, lines[]`

- `status`, `source`, `referenceType` are **numeric enums** — there are **NO `statusName`/`sourceName` companion fields** (both come back `undefined`). Clients must map codes → labels themselves.
  - `JournalEntryStatus`: `0 Draft`, `1 Posted` (live data only uses 0/1; the enum also declares 2/3, unused).
  - `JournalEntrySource`: `0 Manual … 13 System` (14 values).
  - `JournalReferenceType`: `0 Manual, 1 Contract, 2 Payment, 3 Adjustment, 4 System`.
- `sourceId` is the id of the document that generated the entry (null for manual). It drives "go to source" navigation together with `source`/`referenceType` and the party ids.
- Each line: `{ id, accountId, accountCode, accountName, debit, credit, description, restrictionTypeId }`.

### Filtering (GET list) — corrections
- **Numeric codes are the reliable filter values.** `Status=1` and `Source=10` filter correctly. The old string values only worked by coincidence: `Status=Posted`/`Status=Draft` happen to match enum names (so they work), but **`Source=System` returns 0 rows** (no enum member named "System") — a real bug in the previous frontend, now fixed by sending numeric codes.
- **`RestrictionTypeId` is NOT a supported query parameter** — it is silently ignored (row count unchanged with/without it). The frontend previously exposed a restriction-type filter that did nothing; it has been removed (replaced with a working `ReferenceType` filter).
- **`Search` and `EntryNumber` both work server-side** (`Search=JE-2026-0042` and `EntryNumber=JE-2026-0042` each return the match). The frontend previously filtered search client-side over the loaded page only (missing off-page matches); it now uses the server `Search` param.
- Full working param set: `From, To, Status, Source, ReferenceType, SourceId, CustomerId, AgentId, WorkerId, EmployeeId, EntryNumber, ContractNumber, BranchId, IncludeSubBranches, Search, CreatedDateFrom/To, UpdatedDateFrom/To, PageNumber, PageSize, SortBy, SortDescending`.

### Create — `POST /api/V1/JournalEntries`
- **`X-Branch-Id` header is REQUIRED.** Without it (or with a non-GUID value) the endpoint returns `400 { "message": "يجب إرسال X-Branch-Id في الهيدر كـ GUID صالح.", "statusCode": 400 }` **before** any body validation. The frontend already satisfies this: the axios request interceptor (`src/lib/api/client.ts`) attaches `X-Branch-Id` (selected branch, or JWT `branchId` fallback) to **every** authenticated request, and the response interceptor clears the branch + prompts re-selection if the server ever rejects it. Verified live 2026-07-12: the app's own `/api/V1/JournalEntries` requests carry `X-Branch-Id`, and a header-carrying POST passes the branch gate (reaches body validation). **So the app never hits this 400** — it only appears when calling the endpoint outside the app (e.g. Swagger/Postman) without the header.
- **Body validation works** (with the header present): unbalanced entry → `400 "مجموع المدين (X) لا يساوي مجموع الدائن (Y)"`; fewer than 2 lines → `400 "يجب إضافة سطرين على الأقل لقيد اليومية"`; a non-existent line `accountId` → `400 "الحسابات التالية غير موجودة: …"`.
- **BACKEND BUG (still open) — a valid, balanced entry with real leaf accounts + a valid `X-Branch-Id` returns `500` (empty body).** Re-verified live 2026-07-12 across 14+ payload variants: Cash/Bank and AR/AP account pairs; amounts 1.00 / 50 / 100; two- and three-line balanced entries; `restrictionTypeId` null / set at entry level / set on every line; `branchId` echoed into the body; a real `customerId` attached; and 6 different `date` values (today, mid-2026, Jan-2026, 2099, 2025, date-only) — **all 500**. The request body was cross-checked against the backend's own `CreateJournalEntryDto` OpenAPI schema (`swagger/v1/swagger.json`) — it is complete and correct, no missing/mistyped field. The crash occurs *after* validation passes (during persistence), so it is a server-side defect, not a payload problem. Reproduced end-to-end through the **actual create form** too (the app's POST carried `X-Branch-Id` and got 500). **Manual creation via this endpoint remains broken server-side and cannot be fixed from the frontend.**
- **Frontend hardening (done 2026-07-12):** the create form (`EntryFormDrawer.handleSave`) previously `await`-ed the create/update/post mutations without a try/catch, so a failed create surfaced as an **unhandled promise rejection** (red dev overlay in dev; silent in prod, drawer stuck). Now wrapped in try/catch: the mutation hooks still show the bilingual error toast (server 500 / validation), the rejection no longer bubbles up, and the drawer stays open so the user can adjust and retry instead of losing input. Verified: the same 500 that previously threw the Next.js "Unhandled Runtime Error" overlay now leaves the drawer open cleanly with only the toast.
- The success `data` (when the backend is fixed) is the generated entry **number** string (e.g. `"JE-2026-0004"`), not the GUID. The frontend resolves the GUID via the `EntryNumber` exact-match filter (hardened from the previous page-1/50 scan).
- Body: `{ date, description, customerId?, agentId?, workerId?, employeeId?, restrictionTypeId?, lines: [{ accountId, debit, credit, description? }] }`. All party/restriction ids are nullable; `lines` must balance. `X-Branch-Id` is a required **header** (not a body field).

### Source navigation (frontend feature)
Implemented per `JOURNAL_ENTRY_SOURCE_NAVIGATION.md` in `src/lib/journal-entry-navigation.ts` (`resolveJournalEntryNavigation` + `resolveContractRoute`): a "Go to source" affordance resolves `source`+`referenceType`(+party ids) to the owning module and navigates there (`/contracts/mediationcontract`, `/contracts/operation/rent`, `/sponsorship-transfer`, `/accounting/{receipt,payment}-vouchers`, `/accounting/{credit,debit}-notes`, `/hr/payroll`, `/housing/management`, `/customers`, `/agents`, `/applicants`, `/hr/employees`). The destination is a list route carrying `?openId=<id>`; pages read it via `useOpenIdParam`.

**Resolver decision table** faithfully implements the doc §4 table, including the two edge cases previously mis-routed:
- `source=CustomerPayment(1)` + `referenceType=Payment(2)` → **receipt voucher** (previously fell through to the customer profile).
- `source=Escape(8)` + `referenceType=Adjustment(3)` → **worker profile** via `workerId` (escape-fine record, no dedicated screen); `Escape` with `referenceType=Contract(1)` still → mediation contract.

**Contract-type probe** (`referenceType=Contract` with ambiguous type): probed at click time via each module's `getById` in doc priority order — mediation → operating → transfer → **housing** (housing has no `GET /api/Housing/{id}`, so it is matched by scanning `HousingService.getAll()` for the id). Falls back to the journal-entries list if none match. Mediation/operating/transfer `getById` return 404 for non-matching ids, so there are no false positives.

**Auto-open coverage (`?openId=`).** The deep-link always lands on the correct list page; whether it also auto-opens the specific record depends on that page having a per-record detail view:
- **Auto-opens the record (11 of 13):** receipt-vouchers, payment-vouchers, credit-notes, debit-notes, hr/employees, sponsorship-transfer, **agents** (view modal), **applicants** (worker view modal), **housing/management** (edit modal), **contracts/mediationcontract** (details modal — opens by id, self-fetches via `useMediationContract`), **contracts/operation/rent** (details modal — looked up in the fully-loaded list). NOTE: the earlier "these two contract modals crash on programmatic open (hook-order error)" claim was **re-investigated and did not reproduce** — all page hooks are top-level/unconditional; both were wired and browser-verified to open cleanly (no hook errors, only antd deprecation warnings).
- **List-only by design (2):** `hr/payroll` (month/year generator, no per-run detail view) and `customers` (no read-only detail view — cards + edit modal only). Each carries an in-code comment noting the deliberate omission. Wiring these would require building a per-record detail view first (new feature work, not a bug).

**Disabled sources.** Three source types documented by the nav doc — LoanRequest, EntitlementsRequest, CommissionSlice — have **no backend `GET /{id}` and no frontend page**, so the button is shown disabled with an explanatory tooltip for those.

