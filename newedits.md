# Hourly Workers — Dashboard / Frontend Integration

Complete API reference for integrating the **employee dashboard** and **admin panel** with Sigma.API Hourly Workers backend.

| Item | Value |
|------|-------|
| **Base URL** | `/api/V1` |
| **Auth** | `Authorization: Bearer <JWT>` |
| **Swagger** | `/swagger` (development) |
| **Content-Type** | `application/json` (unless noted `multipart/form-data`) |

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication & Permissions](#2-authentication--permissions)
3. [Master Endpoint Index](#3-master-endpoint-index)
4. [Orders — HourlyWorkerRequests](#4-orders--hourlyworkerrequests)
5. [Order Operations — HourlyWorkerOrders](#5-order-operations--hourlyworkerorders)
6. [Workers — HourlyWorkers](#6-workers--hourlyworkers)
7. [Drivers — HourlyDrivers](#7-drivers--hourlydrivers)
8. [Catalog — HourlyCatalog](#8-catalog--hourlycatalog)
9. [Payments — HourlyOrderPayments](#9-payments--hourlyorderpayments)
10. [Notifications — HourlyOrderNotifications](#10-notifications--hourlyordernotifications)
11. [Reports — HourlyWorkerReports](#11-reports--hourlyworkerreports)
12. [Worker Portal (Staff) — HourlyWorkerPortal](#12-worker-portal-staff--hourlyworkerportal)
13. [Transfer Proof Review](#13-transfer-proof-review)
14. [Enum Reference](#14-enum-reference)
15. [Status Transitions](#15-status-transitions)
16. [Dashboard Screen Map](#16-dashboard-screen-map)
17. [Frontend Code Examples](#17-frontend-code-examples)
18. [Error Handling](#18-error-handling)

---

## 1. Conventions

### Response envelope

Every endpoint returns:

```json
{
  "success": true,
  "data": { },
  "errors": null,
  "statusCode": 200
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "errors": ["Order is read-only."],
  "statusCode": 400
}
```

### Paginated lists

List endpoints return `data` as:

```json
{
  "items": [ ],
  "totalCount": 120,
  "pageNumber": 1,
  "pageSize": 10
}
```

Default pagination: `pageNumber=1`, `pageSize=10`.

### Time formats

| Type | Format | Example |
|------|--------|---------|
| `date` | ISO 8601 date | `"2026-06-28"` |
| `time` | `HH:mm:ss` | `"09:00:00"` |
| `datetime` | ISO 8601 UTC | `"2026-06-28T10:30:00Z"` |

### HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation / business rule error — read `errors` |
| 401 | Missing or expired JWT |
| 403 | Missing permission or ownership denied |
| 404 | Resource not found |

---

## 2. Authentication & Permissions

### Request header

```
Authorization: Bearer <access_token>
```

Permissions are JWT claims of type `permission`. Policies are checked per endpoint.

### Roles (typical dashboard users)

| Role | Dashboard access |
|------|------------------|
| `Admin` / `Owner` | Full access (`hourly.admin.full_access`) |
| `Supervisor` | Orders, assignments, workers, packages, drivers, reports |
| `Employee` | Orders, assignments, reports, track, invoices, notifications |
| Staff sub-roles (`SalesEmployee`, `CustomerServiceEmployee`, etc.) | Same as `Employee` |

### Permission constants

| Permission | Value |
|------------|-------|
| Manage orders | `hourly.employee.manage_orders` |
| Assign workers | `hourly.employee.assign_workers` |
| Assign drivers | `hourly.employee.assign_drivers` |
| Manage workers | `hourly.employee.manage_workers` |
| Manage packages | `hourly.employee.manage_packages` |
| Manage drivers | `hourly.employee.manage_drivers` |
| Reports | `hourly.employee.reports` |
| Track order | `hourly.customer.track_order` |
| View invoices | `hourly.customer.view_invoices` |
| View notifications | `hourly.customer.view_notifications` |
| Driver tracking | `hourly.driver.tracking` |
| Full access | `hourly.admin.full_access` |

### Roles & permissions matrix

| Permission | Admin | Supervisor | Employee |
|------------|:-----:|:----------:|:--------:|
| `manage_orders` | ✓ | ✓ | ✓ |
| `assign_workers` | ✓ | ✓ | ✓ |
| `assign_drivers` | ✓ | ✓ | ✓ |
| `manage_workers` | ✓ | ✓ | |
| `manage_packages` | ✓ | ✓ | |
| `manage_drivers` | ✓ | ✓ | |
| `reports` | ✓ | ✓ | ✓ |
| `view_notifications` | ✓ | ✓ | ✓ |
| `view_invoices` | ✓ | ✓ | ✓ |
| `track_order` | ✓ | ✓ | ✓ |
| `driver.tracking` | ✓ | ✓ | |
| `full_access` | ✓ | | |

---

## 3. Master Endpoint Index

| # | Method | Endpoint | Permission | Dashboard use |
|---|--------|----------|------------|---------------|
| **Orders** |
| 1 | GET | `/HourlyWorkerRequests` | `manage_orders` | Orders list |
| 2 | GET | `/HourlyWorkerRequests/{id}` | `manage_orders` | Order summary |
| 3 | GET | `/HourlyWorkerRequests/{id}/Detail` | `manage_orders` | Order detail (full) |
| 4 | GET | `/HourlyWorkerRequests/{id}/Timeline` | `manage_orders` | Timeline tab |
| 5 | GET | `/HourlyWorkerRequests/{id}/Logs` | `manage_orders` | Audit logs tab |
| 6 | GET | `/HourlyWorkerRequests/{id}/Payments` | `manage_orders` | Payments tab |
| 7 | GET | `/HourlyWorkerRequests/{id}/Assignments` | `manage_orders` | Assignments tab |
| 8 | PUT | `/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status` | `manage_orders` | Update assignment |
| 9 | DELETE | `/HourlyWorkerRequests/{id}/Assignments/{assignmentId}` | `manage_orders` | Unassign worker |
| 10 | POST | `/HourlyWorkerRequests/{id}/Approve` | `manage_orders` | Approve |
| 11 | POST | `/HourlyWorkerRequests/{id}/Reject` | `manage_orders` | Reject |
| 12 | POST | `/HourlyWorkerRequests/{id}/Assign` | `assign_workers` | Assign workers |
| 13 | POST | `/HourlyWorkerRequests/{id}/InProgress` | `manage_orders` | Mark in progress |
| 14 | POST | `/HourlyWorkerRequests/{id}/Complete` | `manage_orders` | Mark completed |
| 15 | POST | `/HourlyWorkerRequests/{id}/Cancel` | `manage_orders` | Cancel |
| 16 | POST | `/HourlyWorkerRequests/{id}/InternalNotes` | `manage_orders` | Add note |
| 17 | GET | `/HourlyWorkerRequests/Track/{ticketNumber}` | `track_order` | Public track |
| **Order operations** |
| 18 | GET | `/HourlyWorkerOrders/{orderId}/RecommendedWorkers` | `assign_workers` | Worker picker |
| 19 | POST | `/HourlyWorkerOrders/{orderId}/AssignDriver` | `assign_drivers` | Assign driver |
| 20 | POST | `/HourlyWorkerOrders/{orderId}/Tracking` | `driver.tracking` | Record milestone |
| 21 | GET | `/HourlyWorkerOrders/{orderId}/Tracking` | `track_order` | GPS history |
| 22 | GET | `/HourlyWorkerOrders/{orderId}/Invoices` | `manage_orders` | List invoices |
| 23 | POST | `/HourlyWorkerOrders/{orderId}/Invoices` | `manage_orders` | Issue invoice |
| 24 | GET | `/HourlyWorkerOrders/{orderId}/Accommodation` | `manage_orders` | Get accommodation |
| 25 | POST | `/HourlyWorkerOrders/{orderId}/Accommodation` | `manage_orders` | Book accommodation |
| 26 | PUT | `/HourlyWorkerOrders/{orderId}/Accommodation/{id}/Status` | `manage_orders` | Update accommodation |
| **Workers** |
| 27 | GET | `/HourlyWorkers` | `manage_workers` | Workers list |
| 28 | GET | `/HourlyWorkers/{id}` | `manage_workers` | Worker detail |
| 29 | POST | `/HourlyWorkers` | `full_access` | Create worker |
| 30 | PUT | `/HourlyWorkers/{id}` | `full_access` | Update worker |
| 31 | DELETE | `/HourlyWorkers/{id}` | `full_access` | Delete worker |
| 32 | POST | `/HourlyWorkers/{id}/Activate` | `full_access` | Activate |
| 33 | POST | `/HourlyWorkers/{id}/Deactivate` | `full_access` | Deactivate |
| 34 | GET | `/HourlyWorkers/Available` | Anonymous | Availability lookup |
| **Drivers** |
| 35 | GET | `/HourlyDrivers` | `manage_drivers` | Drivers list |
| 36 | GET | `/HourlyDrivers/{id}` | `manage_drivers` | Driver detail |
| 37 | POST | `/HourlyDrivers` | `full_access` | Create driver |
| 38 | PUT | `/HourlyDrivers/{id}` | `full_access` | Update driver |
| 39 | DELETE | `/HourlyDrivers/{id}` | `full_access` | Delete driver |
| 40 | POST | `/HourlyDrivers/{id}/Activate` | `full_access` | Activate |
| 41 | POST | `/HourlyDrivers/{id}/Deactivate` | `full_access` | Deactivate |
| 42 | GET | `/HourlyDrivers/{driverId}/Orders` | `view_assigned_orders` | Driver orders |
| 43 | POST | `/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus` | `update_transport_status` | Transport update |
| **Catalog** |
| 44 | GET | `/HourlyCatalog/Packages` | Anonymous | Public packages |
| 45 | GET | `/HourlyCatalog/ServingAreas` | Anonymous | Public areas |
| 46 | GET | `/HourlyCatalog/Admin/Packages` | `manage_packages` | Admin packages list |
| 47 | GET | `/HourlyCatalog/Admin/Packages/{id}` | `manage_packages` | Package detail |
| 48 | POST | `/HourlyCatalog/Admin/Packages` | `full_access` | Create package |
| 49 | PUT | `/HourlyCatalog/Admin/Packages/{id}` | `full_access` | Update package |
| 50 | DELETE | `/HourlyCatalog/Admin/Packages/{id}` | `full_access` | Delete package |
| 51 | GET | `/HourlyCatalog/Admin/ServingAreas` | `manage_packages` | Areas list |
| 52 | GET | `/HourlyCatalog/Admin/ServingAreas/{id}` | `manage_packages` | Area detail |
| 53 | POST | `/HourlyCatalog/Admin/ServingAreas` | `full_access` | Create area |
| 54 | PUT | `/HourlyCatalog/Admin/ServingAreas/{id}` | `full_access` | Update area |
| 55 | DELETE | `/HourlyCatalog/Admin/ServingAreas/{id}` | `full_access` | Delete area |
| **Payments** |
| 56 | GET | `/HourlyOrderPayments` | `manage_orders` | Payments list |
| 57 | POST | `/HourlyOrderPayments/{id}/Refund` | `full_access` | Refund |
| **Notifications** |
| 58 | GET | `/HourlyOrderNotifications` | `view_notifications` | Notifications list |
| 59 | POST | `/HourlyOrderNotifications/{id}/Retry` | `full_access` | Retry failed |
| **Reports** |
| 60 | GET | `/HourlyWorkerReports/OrdersSummary` | `reports` | Orders KPIs |
| 61 | GET | `/HourlyWorkerReports/Revenue` | `reports` | Revenue |
| 62 | GET | `/HourlyWorkerReports/WorkerUtilization` | `reports` | Worker stats |
| 63 | GET | `/HourlyWorkerReports/DriverPerformance` | `reports` | Driver stats |
| **Worker portal (staff view)** |
| 64 | GET | `/HourlyWorkerPortal/{workerId}/Assignments` | `manage_workers` | Worker assignments |
| 65 | POST | `/HourlyWorkerPortal/{workerId}/Assignments/{id}/Status` | `manage_workers` | Update status |
| 66 | GET | `/HourlyWorkerPortal/{workerId}/Schedule` | `manage_workers` | Worker schedule |

---

## 4. Orders — HourlyWorkerRequests

Base: `/api/V1/HourlyWorkerRequests`

### 4.1 List orders

```
GET /api/V1/HourlyWorkerRequests
Permission: hourly.employee.manage_orders
```

**Query parameters (`FilterHourlyOrderDto`)**

| Param | Type | Description |
|-------|------|-------------|
| `ticketNumber` | string | Partial ticket search |
| `customerName` | string | Partial name search |
| `status` | int | `HourlyWorkerRequestStatus` (0–6) |
| `paymentStatus` | int | `HourlyOrderPaymentStatus` (0–4) |
| `serviceCity` | string | Filter by city |
| `serviceDistrict` | string | Filter by district |
| `packageId` | guid | Filter by package |
| `servingAreaId` | guid | Filter by serving area |
| `search` | string | General search |
| `dateFrom` | date | Request date from |
| `dateTo` | date | Request date to |
| `sortBy` | string | `ticketNumber`, `customerName`, `requestDate`, `status`, `createdDate` |
| `sortDescending` | bool | Default `false` |
| `pageNumber` | int | Default `1` |
| `pageSize` | int | Default `10` |

**Response `data`:** `PagedResponse<HourlyWorkerRequestDto>`

```json
{
  "items": [
    {
      "id": "guid",
      "ticketNumber": "TK-2026-000001",
      "customerName": "Mohammed",
      "customerPhone": "0509999999",
      "customerAddress": "Riyadh",
      "requestDate": "2026-06-28T00:00:00",
      "requestedStartTime": "09:00:00",
      "requestedEndTime": "12:00:00",
      "numberOfWorkers": 2,
      "status": 0,
      "statusName": "Pending",
      "assignedWorkersCount": 0,
      "createdDate": "2026-06-28T08:00:00Z"
    }
  ],
  "totalCount": 45,
  "pageNumber": 1,
  "pageSize": 10
}
```

---

### 4.2 Get order (summary)

```
GET /api/V1/HourlyWorkerRequests/{id}
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyWorkerRequestDto` — includes `assignments` and `history`.

---

### 4.3 Get order detail (full)

```
GET /api/V1/HourlyWorkerRequests/{id}/Detail
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyOrderDetailDto`

Primary screen for order review. Includes pricing, package, payments with **transfer proof URL**, timeline, tracking, logs, driver assignment.

```json
{
  "id": "guid",
  "ticketNumber": "TK-2026-000001",
  "customerName": "Mohammed",
  "customerPhone": "0509999999",
  "customerAddress": "King Fahd Road",
  "serviceCity": "Riyadh",
  "serviceDistrict": "Olaya",
  "packageId": "guid",
  "packageName": "3-Hour Cleaning",
  "numberOfWorkers": 2,
  "subTotal": 300.00,
  "taxAmount": 45.00,
  "discountAmount": 0,
  "totalAmount": 345.00,
  "paymentStatus": 2,
  "status": 0,
  "statusName": "Pending",
  "requiresDriver": true,
  "requiresAccommodation": false,
  "serviceLatitude": 24.7136,
  "serviceLongitude": 46.6753,
  "transferProofUrl": "https://cdn.example.com/hourly-orders/transfer-proofs/...",
  "internalNotes": null,
  "assignments": [
    {
      "id": "guid",
      "workerId": "guid",
      "workerName": "Ahmed Ali",
      "workerPhone": "0501234567",
      "assignedDate": "2026-06-28T09:00:00Z"
    }
  ],
  "payments": [
    {
      "id": "guid",
      "amount": 345.00,
      "paymentMethod": 2,
      "paymentMethodName": "Bank Transfer",
      "status": 1,
      "transactionReference": "TRX-987654",
      "transferProofUrl": "https://cdn.example.com/...",
      "paidAt": "2026-06-28T08:30:00Z"
    }
  ],
  "driverAssignment": {
    "id": "guid",
    "driverId": "guid",
    "driverName": "Khalid",
    "driverPhone": "0505555555",
    "status": 1,
    "statusName": "Assigned",
    "assignedDate": "2026-06-28T09:15:00Z"
  },
  "timeline": [ ],
  "tracking": [ ],
  "history": [ ]
}
```

---

### 4.4 Get timeline

```
GET /api/V1/HourlyWorkerRequests/{id}/Timeline
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyOrderTimelineDto[]`

| Field | Type | Description |
|-------|------|-------------|
| `eventType` | int | See [Timeline events](#hourlytimelineeventtype) |
| `title` | string | Display title |
| `description` | string | Details |
| `occurredAt` | datetime | When it happened |
| `createdBy` | string | User ID |

---

### 4.5 Get audit logs

```
GET /api/V1/HourlyWorkerRequests/{id}/Logs
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyOrderLogDto[]`

| Field | Description |
|-------|-------------|
| `action` | Log title |
| `details` | Additional info |
| `performedBy` | User ID |
| `occurredAt` | Timestamp |

---

### 4.6 Get payments

```
GET /api/V1/HourlyWorkerRequests/{id}/Payments
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyOrderPaymentDto[]`

Includes `transferProofUrl` and `paymentMethodName` for bank transfer review.

---

### 4.7 Get assignments

```
GET /api/V1/HourlyWorkerRequests/{id}/Assignments
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyWorkerAssignmentDetailDto[]`

| Field | Description |
|-------|-------------|
| `assignmentStatus` | Worker assignment status enum |
| `assignmentStatusName` | Human-readable |
| `confirmedAt` | When worker confirmed |
| `notes` | Assignment notes |

---

### 4.8 Update assignment status

```
PUT /api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status
Permission: hourly.employee.manage_orders
```

**Request body (`UpdateAssignmentStatusDto`)**

```json
{
  "status": 2,
  "notes": "Worker en route"
}
```

**Response `data`:** `"Assignment status updated."` (string)

---

### 4.9 Unassign worker

```
DELETE /api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}
Permission: hourly.employee.manage_orders
```

**Response `data`:** success message string.

---

### 4.10 Approve order

```
POST /api/V1/HourlyWorkerRequests/{id}/Approve
Permission: hourly.employee.manage_orders
```

No body. Order must be `Pending` and paid (if `totalAmount > 0`).

**Response `data`:** success message string.

---

### 4.11 Reject order

```
POST /api/V1/HourlyWorkerRequests/{id}/Reject
Permission: hourly.employee.manage_orders
```

**Request body (`RejectHourlyWorkerRequestDto`)**

```json
{
  "notes": "Customer location outside service area"
}
```

---

### 4.12 Assign workers

```
POST /api/V1/HourlyWorkerRequests/{id}/Assign
Permission: hourly.employee.assign_workers
```

**Request body (`AssignWorkersDto`)**

```json
{
  "workerId": "guid"
}
```

Or multiple workers:

```json
{
  "workerIds": ["guid-1", "guid-2"]
}
```

**Rules:** Order must be `Approved` or `Assigned`. Workers must be available for the slot.

---

### 4.13 Mark in progress

```
POST /api/V1/HourlyWorkerRequests/{id}/InProgress
Permission: hourly.employee.manage_orders
```

Requires at least one assigned worker.

---

### 4.14 Mark completed

```
POST /api/V1/HourlyWorkerRequests/{id}/Complete
Permission: hourly.employee.manage_orders
```

Order must be `InProgress`.

---

### 4.15 Cancel order

```
POST /api/V1/HourlyWorkerRequests/{id}/Cancel
Permission: hourly.employee.manage_orders
```

Cannot cancel terminal orders (`Completed`, `Rejected`, `Cancelled`).

---

### 4.16 Add internal note

```
POST /api/V1/HourlyWorkerRequests/{id}/InternalNotes
Permission: hourly.employee.manage_orders
```

**Request body (`AddInternalNoteDto`)**

```json
{
  "note": "Customer requested extra supplies"
}
```

---

### 4.17 Track by ticket

```
GET /api/V1/HourlyWorkerRequests/Track/{ticketNumber}
Permission: hourly.customer.track_order
```

**Response `data`:** `TrackHourlyWorkerRequestDto`

Use on dashboard "quick track" widget or link from order list.

---

## 5. Order Operations — HourlyWorkerOrders

Base: `/api/V1/HourlyWorkerOrders`

### 5.1 Get recommended workers

```
GET /api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers?maxResults=10
Permission: hourly.employee.assign_workers
```

**Response `data`:** `RecommendedWorkerDto[]`

| Field | Description |
|-------|-------------|
| `score` | Recommendation score (higher = better) |
| `isAvailable` | Available for order slot |
| `recommendationReason` | Why recommended |

Use in assign-worker modal.

---

### 5.2 Assign driver

```
POST /api/V1/HourlyWorkerOrders/{orderId}/AssignDriver
Permission: hourly.employee.assign_drivers
```

**Request body (`AssignDriverDto`)**

```json
{
  "driverId": "guid"
}
```

Order must have `requiresDriver = true`. One driver per order.

---

### 5.3 Record tracking milestone

```
POST /api/V1/HourlyWorkerOrders/{orderId}/Tracking
Permission: hourly.driver.tracking
```

**Request body (`RecordOrderTrackingDto`)**

```json
{
  "eventType": 6,
  "subjectType": 0,
  "subjectId": "worker-guid",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "device": "Dashboard",
  "notes": "Manual entry by employee",
  "trackingSource": 3
}
```

**Milestone `eventType` values (sequenced):**

| Value | Milestone |
|-------|-----------|
| 5 | Worker left accommodation |
| 6 | Worker arrived at customer |
| 7 | Service started |
| 8 | Service finished |
| 9 | Worker left customer |
| 10 | Worker returned to accommodation |

**Response `data`:** `HourlyOrderTrackingDto` (201)

Side effects: timeline, audit log, order log, notifications to all parties.

---

### 5.4 Get tracking history

```
GET /api/V1/HourlyWorkerOrders/{orderId}/Tracking
Permission: hourly.customer.track_order
```

**Response `data`:** `HourlyOrderTrackingDto[]` ordered by `recordedAt`.

---

### 5.5 List invoices

```
GET /api/V1/HourlyWorkerOrders/{orderId}/Invoices
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyOrderInvoiceDto[]`

---

### 5.6 Issue invoice

```
POST /api/V1/HourlyWorkerOrders/{orderId}/Invoices
Permission: hourly.employee.manage_orders
```

**Request body (`IssueHourlyOrderInvoiceDto`)**

```json
{
  "dueDate": "2026-07-15",
  "notes": "Net 30"
}
```

Order must be paid. **Response:** `HourlyOrderInvoiceDto` (201).

---

### 5.7 Get accommodation

```
GET /api/V1/HourlyWorkerOrders/{orderId}/Accommodation
Permission: hourly.employee.manage_orders
```

**Response `data`:** `HourlyOrderAccommodationDto` or 404 if none.

---

### 5.8 Book accommodation

```
POST /api/V1/HourlyWorkerOrders/{orderId}/Accommodation
Permission: hourly.employee.manage_orders
```

**Request body (`BookHourlyOrderAccommodationDto`)**

```json
{
  "housingId": "guid",
  "checkInDate": "2026-06-28",
  "checkOutDate": "2026-06-29",
  "numberOfWorkers": 2,
  "cost": 500.00,
  "notes": "Near service location"
}
```

---

### 5.9 Update accommodation status

```
PUT /api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status
Permission: hourly.employee.manage_orders
```

**Request body (`UpdateHourlyAccommodationStatusDto`)**

```json
{
  "status": 1,
  "notes": "Confirmed with housing"
}
```

**`HourlyAccommodationStatus`:** 0=Requested, 1=Confirmed, 2=CheckedIn, 3=CheckedOut, 4=Cancelled

---

## 6. Workers — HourlyWorkers

Base: `/api/V1/HourlyWorkers`  
**Class policy:** `hourly.employee.manage_workers`

### 6.1 List workers

```
GET /api/V1/HourlyWorkers
```

**Query (`FilterHourlyWorkerDto`)**

| Param | Description |
|-------|-------------|
| `search` | Name, phone, national ID |
| `isActive` | Active filter |
| `isAvailableNow` | Currently available |
| `sortBy` | `fullName`, `hourlyRate`, `createdDate` |
| `sortDescending` | bool |
| `pageNumber` / `pageSize` | Pagination |

**Response:** `PagedResponse<HourlyWorkerDto>`

---

### 6.2 Get worker

```
GET /api/V1/HourlyWorkers/{id}
```

**Response:** `HourlyWorkerDto`

---

### 6.3 Create worker

```
POST /api/V1/HourlyWorkers
Permission: hourly.admin.full_access
```

**Request body (`CreateHourlyWorkerDto`)**

```json
{
  "fullName": "Ahmed Ali",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890",
  "hourlyRate": 50,
  "availableFromTime": "08:00:00",
  "availableToTime": "17:00:00",
  "notes": "Experienced",
  "linkedUserId": "aspnet-user-id"
}
```

| Field | Rules |
|-------|-------|
| `fullName` | Required, max 200 |
| `phoneNumber` | Required, max 20 |
| `hourlyRate` | > 0 |
| `availableToTime` | After `availableFromTime` |
| `linkedUserId` | Links worker portal login |

**Response:** `HourlyWorkerDto` (201)

---

### 6.4 Update worker

```
PUT /api/V1/HourlyWorkers/{id}
Permission: hourly.admin.full_access
```

Same body as create (`UpdateHourlyWorkerDto`).

---

### 6.5 Delete worker

```
DELETE /api/V1/HourlyWorkers/{id}
Permission: hourly.admin.full_access
```

Soft delete. Fails with 400 if worker has active assignments.

---

### 6.6 Activate / Deactivate

```
POST /api/V1/HourlyWorkers/{id}/Activate
POST /api/V1/HourlyWorkers/{id}/Deactivate
Permission: hourly.admin.full_access
```

---

### 6.7 Available workers (slot lookup)

```
GET /api/V1/HourlyWorkers/Available?requestDate=2026-06-28&startTime=09:00:00&endTime=12:00:00
Auth: Anonymous
```

**Response:** `AvailableWorkerDto[]`

Use in assignment picker when filtering by date/time.

---

## 7. Drivers — HourlyDrivers

Base: `/api/V1/HourlyDrivers`  
**Class policy:** `[Authorize]` (authenticated)

### 7.1 List drivers

```
GET /api/V1/HourlyDrivers
Permission: hourly.employee.manage_drivers
```

**Query (`FilterHourlyDriverDto`)**

| Param | Description |
|-------|-------------|
| `search` | Name, phone, plate |
| `isActive` | bool |
| `sortBy` | `fullName`, `createdDate` |
| `pageNumber` / `pageSize` | Pagination |

**Response:** `PagedResponse<HourlyDriverDto>`

---

### 7.2 Get driver

```
GET /api/V1/HourlyDrivers/{id}
Permission: hourly.employee.manage_drivers
```

---

### 7.3 Create driver

```
POST /api/V1/HourlyDrivers
Permission: hourly.admin.full_access
```

**Request body (`CreateHourlyDriverDto`)**

```json
{
  "fullName": "Khalid Omar",
  "phoneNumber": "0505555555",
  "nationalId": "9876543210",
  "licenseNumber": "DL-12345",
  "vehicleType": "Van",
  "vehiclePlateNumber": "ABC 1234",
  "notes": "",
  "linkedUserId": "aspnet-user-id"
}
```

---

### 7.4 Update driver

```
PUT /api/V1/HourlyDrivers/{id}
Permission: hourly.admin.full_access
```

Body: `UpdateHourlyDriverDto` (same fields as create).

---

### 7.5 Delete driver

```
DELETE /api/V1/HourlyDrivers/{id}
Permission: hourly.admin.full_access
```

Soft delete.

---

### 7.6 Activate / Deactivate

```
POST /api/V1/HourlyDrivers/{id}/Activate
POST /api/V1/HourlyDrivers/{id}/Deactivate
Permission: hourly.admin.full_access
```

---

### 7.7 Driver orders (staff view)

```
GET /api/V1/HourlyDrivers/{driverId}/Orders
Permission: hourly.driver.view_assigned_orders
```

**Response:** `HourlyDriverOrderDto[]`

Staff can view any driver. Driver role can only access own `linkedUserId`.

---

### 7.8 Update transport status

```
POST /api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus
Permission: hourly.driver.update_transport_status
```

**Request body (`UpdateDriverTransportStatusDto`)**

```json
{
  "status": 2,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "device": "Driver App",
  "notes": "On the way",
  "trackingSource": 2
}
```

**Driver status flow:** Assigned(1) → EnRoute(2) → Arrived(3) → Completed(4)

---

## 8. Catalog — HourlyCatalog

Base: `/api/V1/HourlyCatalog`

### 8.1 Public packages

```
GET /api/V1/HourlyCatalog/Packages
Auth: Anonymous
```

**Response:** `HourlyServicePackageDto[]`

---

### 8.2 Public serving areas

```
GET /api/V1/HourlyCatalog/ServingAreas?city=Riyadh
Auth: Anonymous
```

**Response:** `HourlyServingAreaDto[]`

---

### 8.3 Admin — List packages

```
GET /api/V1/HourlyCatalog/Admin/Packages
Permission: hourly.employee.manage_packages
```

**Query (`FilterHourlyServicePackageDto`)**

| Param | Description |
|-------|-------------|
| `search` | Code, name |
| `isActive` | bool |
| `sortBy` | `code`, `nameEn`, `basePrice`, `sortOrder`, `createdDate` |
| `pageNumber` / `pageSize` | Pagination |

**Response:** `PagedResponse<HourlyServicePackageDto>`

---

### 8.4 Admin — Get package

```
GET /api/V1/HourlyCatalog/Admin/Packages/{id}
Permission: hourly.employee.manage_packages
```

---

### 8.5 Admin — Create package

```
POST /api/V1/HourlyCatalog/Admin/Packages
Permission: hourly.admin.full_access
```

**Request body (`CreateHourlyServicePackageDto`)**

```json
{
  "code": "PKG-3H",
  "nameAr": "باقة 3 ساعات",
  "nameEn": "3-Hour Package",
  "descriptionAr": "تنظيف منزلي",
  "descriptionEn": "Home cleaning",
  "durationHours": 3,
  "numberOfWorkers": 1,
  "basePrice": 150.00,
  "hourlyRate": 50.00,
  "sortOrder": 1,
  "isActive": true
}
```

---

### 8.6 Admin — Update package

```
PUT /api/V1/HourlyCatalog/Admin/Packages/{id}
Permission: hourly.admin.full_access
```

Body: `UpdateHourlyServicePackageDto`

---

### 8.7 Admin — Delete package

```
DELETE /api/V1/HourlyCatalog/Admin/Packages/{id}
Permission: hourly.admin.full_access
```

Soft delete.

---

### 8.8 Admin — Serving areas CRUD

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/HourlyCatalog/Admin/ServingAreas` | `manage_packages` |
| GET | `/HourlyCatalog/Admin/ServingAreas/{id}` | `manage_packages` |
| POST | `/HourlyCatalog/Admin/ServingAreas` | `full_access` |
| PUT | `/HourlyCatalog/Admin/ServingAreas/{id}` | `full_access` |
| DELETE | `/HourlyCatalog/Admin/ServingAreas/{id}` | `full_access` |

**Create body (`CreateHourlyServingAreaDto`)**

```json
{
  "nameAr": "العليا",
  "nameEn": "Olaya",
  "cityAr": "الرياض",
  "cityEn": "Riyadh",
  "districtAr": "العليا",
  "districtEn": "Olaya",
  "postalCode": "12211",
  "centerLatitude": 24.7136,
  "centerLongitude": 46.6753,
  "radiusKm": 5.0,
  "isActive": true
}
```

---

## 9. Payments — HourlyOrderPayments

Base: `/api/V1/HourlyOrderPayments`  
**Class policy:** `hourly.employee.manage_orders`

### 9.1 List payments

```
GET /api/V1/HourlyOrderPayments
```

**Query (`FilterHourlyPaymentsDto`)**

| Param | Description |
|-------|-------------|
| `orderId` | Filter by order |
| `status` | `HourlyPaymentRecordStatus` |
| `dateFrom` / `dateTo` | Created date range |
| `search` | Checkout ref, transaction ref, ticket |
| `sortBy` | `amount`, `status`, `createdDate` |
| `pageNumber` / `pageSize` | Pagination |

**Response:** `PagedResponse<HourlyPaymentListItemDto>`

```json
{
  "items": [
    {
      "id": "guid",
      "orderId": "guid",
      "ticketNumber": "TK-2026-000001",
      "checkoutReference": "CHK-2026-000001",
      "amount": 345.00,
      "paymentMethod": 2,
      "paymentMethodName": "Bank Transfer",
      "status": 1,
      "transactionReference": "TRX-987654",
      "transferProofUrl": "https://cdn.example.com/...",
      "paidAt": "2026-06-28T08:30:00Z",
      "createdDate": "2026-06-28T08:00:00Z"
    }
  ],
  "totalCount": 25,
  "pageNumber": 1,
  "pageSize": 10
}
```

---

### 9.2 Refund payment

```
POST /api/V1/HourlyOrderPayments/{id}/Refund
Permission: hourly.admin.full_access
```

**Request body (`RefundHourlyPaymentDto`)**

```json
{
  "notes": "Customer cancellation — full refund"
}
```

Payment must be `Completed`. Updates order `paymentStatus` to `Refunded`.

---

## 10. Notifications — HourlyOrderNotifications

Base: `/api/V1/HourlyOrderNotifications`  
**Class policy:** `hourly.customer.view_notifications`

### 10.1 List notifications

```
GET /api/V1/HourlyOrderNotifications
```

**Query (`FilterHourlyOrderNotificationDto`)**

| Param | Description |
|-------|-------------|
| `orderId` | Filter by order |
| `deliveryStatus` | 0=Pending, 1=Sent, 2=Delivered, 3=Failed |
| `recipientPhone` | Phone filter |
| `search` | General search |
| `pageNumber` / `pageSize` | Pagination |

**Response:** `PagedResponse<HourlyOrderNotificationDto>`

---

### 10.2 Retry failed notification

```
POST /api/V1/HourlyOrderNotifications/{id}/Retry
Permission: hourly.admin.full_access
```

Re-sends WhatsApp for failed deliveries.

---

## 11. Reports — HourlyWorkerReports

Base: `/api/V1/HourlyWorkerReports`  
**Class policy:** `hourly.employee.reports`

**Shared query (`FilterHourlyReportDto`)**

| Param | Description |
|-------|-------------|
| `dateFrom` | Report start date |
| `dateTo` | Report end date |
| `serviceCity` | City filter |
| `status` | Order status filter |

### 11.1 Orders summary

```
GET /api/V1/HourlyWorkerReports/OrdersSummary
```

**Response (`HourlyOrdersSummaryReportDto`)**

```json
{
  "totalOrders": 150,
  "pendingOrders": 12,
  "approvedOrders": 8,
  "assignedOrders": 25,
  "inProgressOrders": 10,
  "completedOrders": 80,
  "cancelledOrders": 10,
  "rejectedOrders": 5,
  "totalRevenue": 52000.00,
  "paidRevenue": 48000.00
}
```

---

### 11.2 Revenue report

```
GET /api/V1/HourlyWorkerReports/Revenue
```

**Response (`HourlyRevenueReportDto`)**

| Field | Description |
|-------|-------------|
| `totalCollected` | Sum of completed payments |
| `totalRefunded` | Sum of refunds |
| `netRevenue` | Collected − refunded |
| `completedPayments` | Count |
| `pendingPayments` | Count |
| `failedPayments` | Count |

---

### 11.3 Worker utilization

```
GET /api/V1/HourlyWorkerReports/WorkerUtilization
```

**Response:** `HourlyWorkerUtilizationReportDto[]`

| Field | Description |
|-------|-------------|
| `totalAssignments` | All assignments in period |
| `completedAssignments` | Finished |
| `activeAssignments` | In progress |
| `utilizationRate` | 0–100 percentage |

---

### 11.4 Driver performance

```
GET /api/V1/HourlyWorkerReports/DriverPerformance
```

**Response:** `HourlyDriverPerformanceReportDto[]`

| Field | Description |
|-------|-------------|
| `totalTrips` | All trips |
| `completedTrips` | Finished |
| `cancelledTrips` | Cancelled |
| `completionRate` | 0–100 percentage |

---

## 12. Worker Portal (Staff) — HourlyWorkerPortal

Base: `/api/V1/HourlyWorkerPortal`  
Staff endpoints for viewing/managing a specific worker's portal data.

### 12.1 List worker assignments

```
GET /api/V1/HourlyWorkerPortal/{workerId}/Assignments
Permission: hourly.employee.manage_workers
```

**Query (`FilterWorkerPortalAssignmentsDto`)**

| Param | Description |
|-------|-------------|
| `status` | `HourlyWorkerAssignmentStatus` |
| `dateFrom` / `dateTo` | Assignment date range |
| `pageNumber` / `pageSize` | Pagination |

**Response:** `PagedResponse<WorkerPortalAssignmentDto>`

---

### 12.2 Update worker assignment status (staff)

```
POST /api/V1/HourlyWorkerPortal/{workerId}/Assignments/{assignmentId}/Status
Permission: hourly.employee.manage_workers
```

**Request body (`UpdateWorkerAssignmentStatusDto`)**

```json
{
  "status": 2,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "device": "Dashboard",
  "notes": "Updated by supervisor",
  "trackingSource": 3
}
```

`trackingSource: 3` = EmployeeDashboard. Triggers tracking milestone when applicable.

---

### 12.3 Get worker schedule

```
GET /api/V1/HourlyWorkerPortal/{workerId}/Schedule
Permission: hourly.employee.manage_workers
```

**Response:** `HourlyWorkerScheduleDto[]`

| Field | Description |
|-------|-------------|
| `dayOfWeek` | 0=Sunday … 6=Saturday |
| `startTime` / `endTime` | Weekly window |
| `isAvailable` | Available that day |

---

## 13. Transfer Proof Review

Bank transfer orders include a screenshot uploaded by the customer.

### API fields

| Field | Endpoint | Use |
|-------|----------|-----|
| `transferProofUrl` | `GET .../Detail` | Primary image URL for `<img>` |
| `payments[].transferProofUrl` | `GET .../Detail`, `GET .../Payments` | Per-payment proof |
| `payments[].paymentMethodName` | Same | `"Bank Transfer"` |
| `payments[].transactionReference` | Same | Bank reference number |
| `transferProofUrl` | `GET /HourlyOrderPayments` | Payments list column |

### UI component example

```html
<div v-if="order.transferProofUrl" class="transfer-proof-panel">
  <h3>Bank Transfer Confirmation</h3>
  <dl>
    <dt>Method</dt><dd>{{ order.payments[0]?.paymentMethodName }}</dd>
    <dt>Reference</dt><dd>{{ order.payments[0]?.transactionReference || '—' }}</dd>
    <dt>Amount</dt><dd>{{ order.totalAmount }} SAR</dd>
  </dl>
  <img :src="order.transferProofUrl" alt="Transfer screenshot" class="proof-image" />
  <a :href="order.transferProofUrl" target="_blank">Open full size</a>
</div>
```

### Review workflow

1. Filter orders: `status=0` (Pending), `paymentStatus=2` (Paid)
2. Open `GET /HourlyWorkerRequests/{id}/Detail`
3. Display `transferProofUrl` — use lightbox/zoom
4. Verify amount matches `totalAmount`
5. `POST /Approve` or `POST /Reject`

---

## 14. Enum Reference

### HourlyWorkerRequestStatus (order)

| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Approved |
| 2 | Rejected |
| 3 | Assigned |
| 4 | In Progress |
| 5 | Completed |
| 6 | Cancelled |

### HourlyOrderPaymentStatus (order payment state)

| Value | Name |
|-------|------|
| 0 | Unpaid |
| 1 | Partially Paid |
| 2 | Paid |
| 3 | Refunded |
| 4 | Failed |

### HourlyPaymentRecordStatus (payment record)

| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Completed |
| 2 | Failed |
| 3 | Refunded |
| 4 | Cancelled |

### HourlyPaymentMethod

| Value | Name |
|-------|------|
| 1 | Card |
| 2 | Bank Transfer |

### HourlyWorkerAssignmentStatus

| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Confirmed |
| 2 | En Route |
| 3 | Arrived |
| 4 | In Service |
| 5 | Service Completed |
| 6 | Cancelled |
| 7 | No Show |
| 8 | Left Customer |
| 9 | Returned to Accommodation |

### HourlyDriverAssignmentStatus

| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Assigned |
| 2 | En Route |
| 3 | Arrived |
| 4 | Completed |
| 5 | Cancelled |

### HourlyTrackingEventType (milestones)

| Value | Name |
|-------|------|
| 5 | Worker left accommodation |
| 6 | Worker arrived at customer |
| 7 | Service started |
| 8 | Service finished |
| 9 | Worker left customer |
| 10 | Worker returned to accommodation |

### HourlyTrackingSource

| Value | Name |
|-------|------|
| 0 | Api |
| 1 | Worker Portal |
| 2 | Driver Portal |
| 3 | Employee Dashboard |
| 4 | Mobile Customer |
| 5 | System |

### HourlyAccommodationStatus

| Value | Name |
|-------|------|
| 0 | Requested |
| 1 | Confirmed |
| 2 | Checked In |
| 3 | Checked Out |
| 4 | Cancelled |

### HourlyNotificationDeliveryStatus

| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Sent |
| 2 | Delivered |
| 3 | Failed |

---

## 15. Status Transitions

### Order status (manual)

| From | Allowed to |
|------|------------|
| Pending | Approved, Rejected, Cancelled |
| Approved | Assigned, Cancelled |
| Assigned | In Progress, Cancelled |
| In Progress | Completed, Cancelled |
| Rejected / Completed / Cancelled | *(terminal)* |

### Automated (from tracking)

| Milestone | Order status |
|-----------|--------------|
| Service Started (7) | → In Progress |
| Worker Returned to Accommodation (10) | → Completed |

### Dashboard actions by order status

| Status | Available buttons |
|--------|-------------------|
| Pending | Approve, Reject, Cancel, View transfer proof |
| Approved | Assign workers, Assign driver, Cancel |
| Assigned | Mark In Progress, Unassign, Cancel |
| In Progress | Mark Complete, Cancel, View tracking |
| Completed | View only, Issue invoice |
| Rejected / Cancelled | View only |

---

## 16. Dashboard Screen Map

| Screen | Primary endpoints |
|--------|-------------------|
| **Orders list** | `GET /HourlyWorkerRequests` |
| **Order detail** | `GET /HourlyWorkerRequests/{id}/Detail` |
| **Approve flow** | Detail → transfer proof → `POST /Approve` |
| **Assign workers** | `GET /RecommendedWorkers` → `POST /Assign` |
| **Assign driver** | `GET /HourlyDrivers` → `POST /AssignDriver` |
| **Tracking map** | `GET /HourlyWorkerOrders/{id}/Tracking` |
| **Timeline** | `GET /HourlyWorkerRequests/{id}/Timeline` |
| **Workers CRUD** | `/HourlyWorkers` |
| **Drivers CRUD** | `/HourlyDrivers` |
| **Packages CRUD** | `/HourlyCatalog/Admin/Packages` |
| **Serving areas CRUD** | `/HourlyCatalog/Admin/ServingAreas` |
| **Payments** | `GET /HourlyOrderPayments` |
| **Notifications** | `GET /HourlyOrderNotifications` |
| **Reports dashboard** | `/HourlyWorkerReports/*` |
| **Accommodation** | `GET/POST /HourlyWorkerOrders/{id}/Accommodation` |
| **Invoices** | `GET/POST /HourlyWorkerOrders/{id}/Invoices` |

---

## 17. Frontend Code Examples

### API client setup (TypeScript + Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/V1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const hourlyOrdersApi = {
  list: (params: Record<string, unknown>) =>
    api.get('/HourlyWorkerRequests', { params }),

  getDetail: (id: string) =>
    api.get(`/HourlyWorkerRequests/${id}/Detail`),

  approve: (id: string) =>
    api.post(`/HourlyWorkerRequests/${id}/Approve`),

  reject: (id: string, notes?: string) =>
    api.post(`/HourlyWorkerRequests/${id}/Reject`, { notes }),

  assignWorkers: (id: string, workerIds: string[]) =>
    api.post(`/HourlyWorkerRequests/${id}/Assign`, { workerIds }),

  getRecommendedWorkers: (orderId: string, maxResults = 10) =>
    api.get(`/HourlyWorkerOrders/${orderId}/RecommendedWorkers`, {
      params: { maxResults },
    }),

  getTracking: (orderId: string) =>
    api.get(`/HourlyWorkerOrders/${orderId}/Tracking`),

  assignDriver: (orderId: string, driverId: string) =>
    api.post(`/HourlyWorkerOrders/${orderId}/AssignDriver`, { driverId }),

  recordTracking: (orderId: string, body: Record<string, unknown>) =>
    api.post(`/HourlyWorkerOrders/${orderId}/Tracking`, body),
};

export const hourlyWorkersApi = {
  list: (params: Record<string, unknown>) =>
    api.get('/HourlyWorkers', { params }),

  create: (body: Record<string, unknown>) =>
    api.post('/HourlyWorkers', body),

  update: (id: string, body: Record<string, unknown>) =>
    api.put(`/HourlyWorkers/${id}`, body),
};

export const hourlyReportsApi = {
  ordersSummary: (params: Record<string, unknown>) =>
    api.get('/HourlyWorkerReports/OrdersSummary', { params }),

  revenue: (params: Record<string, unknown>) =>
    api.get('/HourlyWorkerReports/Revenue', { params }),
};
```

### Fetch order detail with transfer proof (React)

```tsx
const { data } = await hourlyOrdersApi.getDetail(orderId);
const order = data.data;

return (
  <div>
    <h1>{order.ticketNumber} — {order.statusName}</h1>
    <p>{order.customerName} · {order.customerPhone}</p>
    <p>Total: {order.totalAmount} SAR</p>

    {order.transferProofUrl && (
      <section>
        <h2>Transfer Proof</h2>
        <img src={order.transferProofUrl} alt="Bank transfer" style={{ maxWidth: '100%' }} />
      </section>
    )}

    {order.status === 0 && (
      <>
        <button onClick={() => hourlyOrdersApi.approve(order.id)}>Approve</button>
        <button onClick={() => hourlyOrdersApi.reject(order.id, reason)}>Reject</button>
      </>
    )}
  </div>
);
```

### Paginated orders table (Vue)

```javascript
async function loadOrders(page = 1) {
  const { data } = await api.get('/HourlyWorkerRequests', {
    params: {
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      pageNumber: page,
      pageSize: 20,
      sortBy: 'createdDate',
      sortDescending: true,
    },
  });

  if (!data.success) throw new Error(data.errors?.join(', '));
  orders.value = data.data.items;
  totalCount.value = data.data.totalCount;
}
```

---

## 18. Error Handling

### Validation errors (400)

```json
{
  "success": false,
  "errors": [
    "Customer Name must not be empty.",
    "Requested end time must be after start time."
  ],
  "statusCode": 400
}
```

Display all items in `errors` array to the user.

### Permission denied (403)

User lacks required permission. Show "Insufficient permissions" and hide the action button.

### Common business errors

| Error message | Cause | UI action |
|---------------|-------|-----------|
| `Order is read-only.` | Terminal status | Disable action buttons |
| `Order not found.` | Invalid ID | Redirect to list |
| `Worker is not available for the requested period.` | Booking conflict | Show in assign modal |
| `Invalid tracking milestone sequence.` | Wrong milestone order | Show stepper state |
| `This order does not require a driver.` | `requiresDriver=false` | Hide driver assign |

### Recommended error handler

```typescript
function handleApiError(error: unknown) {
  const res = (error as { response?: { data?: { errors?: string[] } } })?.response?.data;
  const messages = res?.errors ?? ['An unexpected error occurred'];
  toast.error(messages.join('\n'));
}
```

---

## Related docs

- [Mobile Integration](MOBILE_INTEGRATION.md) — customer app & worker portal (mobile)
- [Module README](../new_hourlyworker/README.md) — architecture, workflows, deployment
- [CHANGELOG](../../CHANGELOG.md) — release notes

**Swagger:** Run the API locally and open `/swagger` for interactive testing of all endpoints.
