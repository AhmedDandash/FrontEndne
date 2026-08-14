# Module 26 Test Report - HR Leave Types, Payroll & Permission Requests

Date: 2026-08-14
Status: PASS WITH KNOWN LIMITATIONS
Priority row: 26 - HR_LEAVE_TYPE, HR_PAYROLL, HR_PERMISSION_REQUEST
Inventory row: Module 31 - Human Resources - Leave Types, Payroll, Permissions

## Scope

Validated and aligned the frontend surfaces for:

- `/hr/leave-types`
- `/hr/payroll`
- `/hr/permission-request`
- `/hr/permission-requests`

Inventory coverage: 15 contracted endpoints inspected against frontend service wiring and live API behavior where safe.

## Endpoint Coverage

| Area | Endpoint | Frontend Status | Live Result |
| --- | --- | --- | --- |
| Leave Types | `GET /api/V1/LeaveType` | Wired | 200 |
| Leave Types | `GET /api/V1/LeaveType/{id}` | Service wired | 200 |
| Leave Types | `POST /api/V1/LeaveType` | Wired | 201 |
| Leave Types | `PUT /api/V1/LeaveType/{id}` | Wired | 200 |
| Leave Types | `DELETE /api/V1/LeaveType/{id}` | Wired | 200, then 404 on follow-up get |
| Payroll | `POST /api/V1/Payroll/generate` | Wired | Negative validation probe only; invalid payload returns backend 500 |
| Payroll | `GET /api/V1/Payroll` | Wired | 200 for existing June 2026, 404 for missing August 2026 |
| Payroll | `GET /api/V1/Payroll/history` | Added UI hook/table | 200 |
| Payroll | `GET /api/V1/Payroll/export` | Wired | Existing run returned file payload in earlier probe; missing run returns 500 |
| Payroll | `POST /api/V1/Payroll/{id}/approve` | Corrected by existing frontend to PUT | POST 405, PUT route exists |
| Payroll | `POST /api/V1/Payroll/close/{id}` | Corrected by existing frontend to PUT | POST 405, PUT route exists |
| Permissions | `GET /api/V1/PermissionRequest/GetAll` | Wired | 200 |
| Permissions | `POST /api/V1/PermissionRequest/Create` | Wired | 200 |
| Permissions | `POST /api/V1/PermissionRequest/Approve/{id}` | Wired | 200 |
| Permissions | `POST /api/V1/PermissionRequest/Reject/{id}` | Wired | 200, but backend also allows reject after approve |

## Fixes Applied

- Added payroll history visibility through `useHRPayrollHistory()` and a history table on `/hr/payroll`.
- Added `includeWorkers` to `GeneratePayrollDto` and the payroll generation modal.
- Invalidated payroll history after generate, approve, and close mutations.
- Wrapped leave type create/update/delete actions in handled promise flows so API failures keep the modal open and rely on mutation error toasts.
- Wrapped permission create/approve/reject actions to avoid uncaught promise rejections.
- Fixed permission requests filter badge and clear behavior so search text counts as an active filter and clears correctly.

## Backend/API Findings

- Payroll approve and close are `PUT` in Swagger/live behavior, while the inventory lists them as `POST`.
- `POST /api/V1/Payroll/generate` returns 500 for invalid payloads instead of a client validation error.
- `GET /api/V1/Payroll/export` returns 500 when no payroll run exists for the selected month/year.
- `POST /api/V1/PermissionRequest/Reject/{id}` accepts a request that was already approved. The frontend guards this by hiding actions once a request is no longer pending.
- Permission duplicate rules are enforced by the backend for the same employee/type/day.

## Disposable Data

- Leave type fixture was created, updated, deleted, and verified deleted.
- Permission approval probe remains as an audit record:
  - ID: `6d8af556-a315-4d55-4fef-08defa05eff4`
  - Final direct-probe state: approved then reject endpoint also accepted.
- No valid payroll generation or close action was executed to avoid creating or finalizing financial records.

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97 tests.
- `npm run lint` - passed with existing warnings outside this module.

## Final Assessment

Module 26 is frontend-aligned and usable with known backend limitations. The only unverified positive-path operation is valid payroll generation/closure because those operations create or finalize financial records and have no delete/rollback route in the inspected API surface.
