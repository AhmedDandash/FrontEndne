# Hourly Workers — Dashboard API Integration

Base URL: `api/V1/HourlyWorkers` and `api/V1/HourlyWorkerRequests`

Authentication: **JWT Bearer** required for all dashboard endpoints.

Response envelope (all endpoints):

```json
{
  "success": true,
  "data": { },
  "errors": null,
  "statusCode": 200
}
```

---

## Workers API (`api/V1/HourlyWorkers`)

### List Workers

`GET /api/V1/HourlyWorkers`

**Query parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name, phone, or national ID |
| `isActive` | bool | Filter active/inactive |
| `isAvailableNow` | bool | Filter by computed availability |
| `sortBy` | string | `fullName`, `hourlyRate`, `createdDate` (default) |
| `sortDescending` | bool | Default `false` |
| `pageNumber` | int | Default `1` |
| `pageSize` | int | Default `10` |

**Response `data`**

```json
{
  "items": [
    {
      "id": "guid",
      "fullName": "Ahmed Ali",
      "phoneNumber": "0501234567",
      "nationalId": "1234567890",
      "hourlyRate": 50.00,
      "availableFromTime": "08:00:00",
      "availableToTime": "17:00:00",
      "isActive": true,
      "isAvailableNow": true,
      "notes": "Optional notes",
      "createdDate": "2026-06-25T09:00:00Z",
      "updatedDate": null
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 10
}
```

### Get Worker Details

`GET /api/V1/HourlyWorkers/{id}`

### Create Worker

`POST /api/V1/HourlyWorkers`

**Request body (`CreateHourlyWorkerDto`)**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `fullName` | string | Yes | Max 200 |
| `phoneNumber` | string | Yes | Max 20 |
| `nationalId` | string | No | Max 20 |
| `hourlyRate` | decimal | Yes | > 0 |
| `availableFromTime` | time | Yes | e.g. `"08:00:00"` |
| `availableToTime` | time | Yes | Must be after `availableFromTime` |
| `notes` | string | No | Max 1000 |

**Example**

```json
{
  "fullName": "Ahmed Ali",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890",
  "hourlyRate": 50,
  "availableFromTime": "08:00:00",
  "availableToTime": "17:00:00",
  "notes": "Experienced cleaner"
}
```

### Update Worker

`PUT /api/V1/HourlyWorkers/{id}`

Same body as create (`UpdateHourlyWorkerDto`).

### Delete Worker

`DELETE /api/V1/HourlyWorkers/{id}`

Fails with `400` if worker has active assignments (`Assigned` or `In Progress` requests).

### Activate / Deactivate

`POST /api/V1/HourlyWorkers/{id}/Activate`  
`POST /api/V1/HourlyWorkers/{id}/Deactivate`

---

## Requests API (`api/V1/HourlyWorkerRequests`)

### List Requests

`GET /api/V1/HourlyWorkerRequests`

**Query parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketNumber` | string | Partial ticket search |
| `customerName` | string | Partial customer name search |
| `status` | int | `0=Pending, 1=Approved, 2=Rejected, 3=Assigned, 4=InProgress, 5=Completed, 6=Cancelled` |
| `dateFrom` | date | Request date range start |
| `dateTo` | date | Request date range end |
| `sortBy` | string | `ticketNumber`, `customerName`, `requestDate`, `status`, `createdDate` (default) |
| `sortDescending` | bool | Default `false` |
| `pageNumber` | int | Default `1` |
| `pageSize` | int | Default `10` |

### Get Request Details

`GET /api/V1/HourlyWorkerRequests/{id}`

Includes assignments and full status history.

**Response `data` (summary)**

```json
{
  "id": "guid",
  "ticketNumber": "TK-2026-000001",
  "customerName": "Mohammed",
  "customerPhone": "0509999999",
  "customerAddress": "Riyadh",
  "requestDate": "2026-06-26T00:00:00",
  "requestedStartTime": "09:00:00",
  "requestedEndTime": "12:00:00",
  "numberOfWorkers": 2,
  "notes": null,
  "status": 3,
  "statusName": "Assigned",
  "assignedWorkersCount": 2,
  "assignments": [
    {
      "id": "guid",
      "workerId": "guid",
      "workerName": "Ahmed Ali",
      "workerPhone": "0501234567",
      "assignedDate": "2026-06-25T10:00:00Z"
    }
  ],
  "history": [
    {
      "oldStatus": 1,
      "oldStatusName": "Approved",
      "newStatus": 3,
      "newStatusName": "Assigned",
      "changedBy": "admin-user-id",
      "changedAt": "2026-06-25T10:00:00Z",
      "notes": "Workers assigned."
    }
  ]
}
```

### Approve Request

`POST /api/V1/HourlyWorkerRequests/{id}/Approve`

### Reject Request

`POST /api/V1/HourlyWorkerRequests/{id}/Reject`

```json
{
  "notes": "Reason for rejection (optional)"
}
```

### Assign Worker

`POST /api/V1/HourlyWorkerRequests/{id}/Assign`

```json
{
  "workerId": "worker-guid"
}
```

**Rules**

- Request must be `Approved` or `Assigned`
- Exactly **one** worker per request
- Worker must be available for the request period
- If worker was already selected on mobile at create time, this call confirms assignment and moves status to `Assigned`

### Mark In Progress

`POST /api/V1/HourlyWorkerRequests/{id}/InProgress`

Requires at least one assigned worker.

### Mark Completed

`POST /api/V1/HourlyWorkerRequests/{id}/Complete`

### Cancel Request

`POST /api/V1/HourlyWorkerRequests/{id}/Cancel`

---

## Status Transitions

| From | Allowed transitions |
|------|---------------------|
| Pending | Approved, Rejected, Cancelled |
| Approved | Assigned, Cancelled |
| Assigned | In Progress, Cancelled |
| In Progress | Completed, Cancelled |
| Rejected | *(terminal — read-only)* |
| Completed | *(terminal — read-only)* |
| Cancelled | *(terminal — read-only)* |

Every status change is recorded in `HourlyWorkerRequestHistories`.

---

## Dashboard Forms

### Worker Form

| Field | Control | Validation |
|-------|---------|------------|
| Full Name | text | required, max 200 |
| Phone | tel | required, max 20 |
| National ID | text | optional, max 20 |
| Hourly Rate | number | required, > 0 |
| Available From | time picker | required |
| Available To | time picker | required, after From |
| Notes | textarea | optional, max 1000 |

### Request Review Form

Display read-only customer/request fields. Actions depend on status:

- **Pending**: Approve, Reject, Cancel
- **Approved**: Assign workers, Cancel
- **Assigned**: Mark In Progress, Cancel
- **In Progress**: Mark Completed, Cancel
- **Rejected / Completed / Cancelled**: view only

### Assign Workers Form

- Multi-select from workers list (filter `isActive=true`)
- Selection count must match `numberOfWorkers`
- Show availability indicator (`isAvailableNow`)

---

## Error Handling

| HTTP | Meaning |
|------|---------|
| 400 | Validation or business rule failure — check `errors` array |
| 401 | Missing or invalid JWT |
| 404 | Worker or request not found |

**Example error**

```json
{
  "success": false,
  "data": null,
  "errors": ["Worker 'Ahmed Ali' is not available for the requested period."],
  "statusCode": 400
}
```
