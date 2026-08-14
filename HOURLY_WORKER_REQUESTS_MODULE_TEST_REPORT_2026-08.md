# Module 28 Test Report - Hourly Worker Requests

Date: 2026-08-14
Status: PASS WITH KNOWN LIMITATIONS
Priority row: 28 - Hourly Workers - Requests (HOURLY_WORKER_REQUESTS)
Inventory row: Module 37 - Hourly Workers - Requests (Service Requests Workflow)

## Scope

Validated and aligned:

- `/hourly-workers/requests`
- `/hourly-workers/requests/[id]`
- `/hourly-workers/track`
- `HourlyWorkerRequestService`
- `useHourlyWorkerRequests`, request actions, sub-resource hooks, ticket tracking hook

Inventory coverage: 17 contracted endpoints.

## Endpoint Coverage

| Endpoint | Frontend Status | Live Result |
| --- | --- | --- |
| `GET /api/V1/HourlyWorkerRequests` | Wired, query names aligned to Swagger | 200 |
| `GET /api/V1/HourlyWorkerRequests/{id}` | Wired | 200 |
| `GET /api/V1/HourlyWorkerRequests/{id}/Detail` | Wired on detail page | 200 |
| `GET /api/V1/HourlyWorkerRequests/{id}/Timeline` | Wired on detail tab | 200 |
| `GET /api/V1/HourlyWorkerRequests/{id}/Logs` | Wired on detail tab | 200 |
| `GET /api/V1/HourlyWorkerRequests/{id}/Payments` | Wired on detail tab | 200 |
| `GET /api/V1/HourlyWorkerRequests/{id}/Assignments` | Wired on detail tab | 200 |
| `PUT /api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}/Status` | Wired | 200 |
| `DELETE /api/V1/HourlyWorkerRequests/{id}/Assignments/{assignmentId}` | Wired | 200 |
| `POST /api/V1/HourlyWorkerRequests/{id}/InternalNotes` | Wired | 200 |
| `GET /api/V1/HourlyWorkerRequests/Track/{ticketNumber}` | Added tracking hook and `/hourly-workers/track` page | 200 with bearer; 401 without bearer |
| `POST /api/V1/HourlyWorkerRequests/{id}/Approve` | Wired | 200 |
| `POST /api/V1/HourlyWorkerRequests/{id}/Reject` | Wired | 200 |
| `POST /api/V1/HourlyWorkerRequests/{id}/Assign` | Wired | 200 |
| `POST /api/V1/HourlyWorkerRequests/{id}/InProgress` | Wired | 200 |
| `POST /api/V1/HourlyWorkerRequests/{id}/Complete` | Wired | 200 |
| `POST /api/V1/HourlyWorkerRequests/{id}/Cancel` | Wired | 200 |

## Fixes Applied

- Aligned request-list query parameter names to Swagger: `Search`, `TicketNumber`, `CustomerName`, `Status`, `DateFrom`, `BranchId`, `PageNumber`, etc.
- Added match-mode fields to `HourlyWorkerRequestListParams`.
- Added `useHourlyWorkerRequestTracking()` for the ticket tracking endpoint.
- Added `/hourly-workers/track` page and linked it from the requests list header.
- Fixed request-list filter badge and clear behavior for search and branch filters.
- Reset pagination when include-sub-branches changes.
- Wrapped request list and detail action/modal submissions in handled async flows so failed API mutations keep the modal/action context open.

## Live Workflow Probe

Used the out-of-inventory `POST /api/V1/HourlyWorkerRequests` endpoint only to create disposable fixtures for the inventory workflow endpoints.

Fixtures created:

- `TK-2026-000006` - final status `Cancelled`
  - Covered read/detail/timeline/logs/payments/assignments/track, internal note, approve, assign, assignment status update, assignment delete, cancel.
- `TK-2026-000007` - final status `Rejected`
  - Covered reject path.
- `TK-2026-000008` - final status `Completed`
  - Covered approve, assign, in-progress, complete path.

Disposable worker:

- ID: `817ac97f-171f-48d5-29a1-08defa07ed99`
- Name: `Codex Module 28 Worker 20260814163603`
- Final state: inactive
- Delete attempts returned backend 500 after historical request links existed.

## Backend/API Findings

- Swagger exposes `POST /api/V1/HourlyWorkerRequests`, but the inventory excludes it and the dashboard correctly has no create UI because requests originate from mobile.
- `POST /api/V1/HourlyWorkerRequests` sometimes returns a payload with ticket/status but no `id`; the ID had to be resolved by listing by ticket number.
- `GET /api/V1/HourlyWorkerRequests/Track/{ticketNumber}` is marked public in inventory, but live backend returned 401 without bearer token.
- Deleting a disposable hourly worker after terminal historical requests returned 500, even after the worker was deactivated.

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97 tests.
- `npm run lint` - passed with existing unrelated warnings.

## Final Assessment

Module 28 is frontend-aligned and workflow-verified. Remaining limitations are backend-side: ticket tracking is not truly public, request create response can omit `id`, and worker deletion fails with 500 after historical request links.
