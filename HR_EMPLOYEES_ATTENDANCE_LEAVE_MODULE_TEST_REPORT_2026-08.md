# HR Employees, Attendance & Leave Module Test Report - 2026-08

## Module

- Priority order: Module 25
- Inventory section: Module 30 (numbering mismatch in reference files)
- Name: HR - Employees, Attendance & Leave (HR_EMPLOYEE, HR_ATTENDANCE, HR_LEAVE)
- Priority: High

## Source References

- `API_MODULE_PRIORITY_2026-08.md`: Module 25 is `HR - Employees, Attendance & Leave`.
- `API_MODULE_INVENTORY_2026-08.md`: lists 16 endpoints for `HR_EMPLOYEE`, `HR_ATTENDANCE`, and `HR_LEAVE`.
- `simga-api.txt`: confirms live Swagger method contracts for employee reset password and leave approval/rejection are `PUT`, not `POST`.

## API Coverage

| Method | Endpoint | Frontend Usage | Status |
|---|---|---|---|
| GET | `/api/V1/Employee` | `HREmployeeService.getAll()` -> employee list/selectors | Authenticated test passed |
| GET | `/api/V1/Employee/{id}` | `HREmployeeService.getById()` -> employee detail page | Authenticated test passed |
| POST | `/api/V1/Employee` | employee create modal | Authenticated test passed with disposable employee |
| PUT | `/api/V1/Employee/{id}` | employee edit modal | Authenticated test passed |
| DELETE | `/api/V1/Employee/{id}` | employee disable/delete action | Authenticated test returned 200; detail remains readable, consistent with soft-delete/disable UX |
| PUT | `/api/V1/Employee/{id}/reset-password` | reset password action | Authenticated test passed; inventory incorrectly says POST |
| POST | `/api/V1/Attendance/CheckIn` | current-user check-in button | Authenticated geofence rejection test passed with location body |
| POST | `/api/V1/Attendance/CheckOut` | current-user check-out button | Authenticated geofence rejection test passed with location body |
| POST | `/api/V1/Attendance/Filter` | attendance filter/report page | Authenticated test passed |
| GET | `/api/V1/Leave` | leave request list page | Authenticated test passed |
| POST | `/api/V1/Leave` | leave create modal | Authenticated test passed |
| GET | `/api/V1/Leave/balance/{leaveTypeId}` | leave balance checker/service | Authenticated test passed, but response envelope had `success:false` with valid `data.balance` |
| GET | `/api/V1/Leave/employee-balances` | employee detail leave balances | Authenticated test passed |
| PUT | `/api/V1/Leave/{requestId}/approve` | leave approve action | Authenticated test passed; inventory incorrectly says POST |
| PUT | `/api/V1/Leave/{requestId}/reject` | leave reject action | Authenticated test passed; inventory incorrectly says POST |
| POST/PUT | `/api/V1/Leave/{requestId}/cancel` | not exposed in UI | Backend-blocked: live route returns 404 and Swagger omits it |

## Issues Found

### Stale Leave Cancel API Surface

- Endpoint/UI: `/api/V1/Leave/{requestId}/cancel`
- Problem: Inventory documents cancel, but live backend returns 404 and Swagger does not list it.
- Root cause: API documentation/backend drift.
- Fix: Removed the unused frontend cancel endpoint, service method, and hook return so future UI cannot accidentally call a broken path.
- Verification: `PUT /api/V1/Leave/{id}/cancel` returned 404; TypeScript confirms no remaining HR leave cancel references.

### Inventory Method Drift

- Endpoint/UI: reset password, leave approve, leave reject.
- Problem: Inventory marks reset/approve/reject as POST, but live Swagger and backend require PUT.
- Root cause: Inventory is stale for these methods.
- Fix: No code change required; frontend already used PUT. Report documents the confirmed contract.
- Verification: `PUT reset-password` 200, `POST reset-password` 405; `PUT reject` 200, `POST reject` 405; `PUT approve` 200.

### Modal Mutation Rejections

- Endpoint/UI: employee create/edit modal and leave create/decision modals.
- Problem: API failures could reject through Ant Design `Modal onOk`.
- Root cause: handlers awaited mutation promises without catching failures.
- Fix: Wrapped employee submit, leave create, and leave approve/reject handlers in `try/catch`; mutation toasts still display API errors and modals stay open on failed decisions.
- Verification: `npx tsc --noEmit`, `npm run lint`, and `npm test` pass.

### Leave Filter Clear UX

- Endpoint/UI: `/hr/leave` local search/status filters.
- Problem: filter badge and clear action only counted/cleared status, not the visible search field.
- Root cause: `AdvancedFilterPanel` `activeCount` and `onClear` ignored `searchText`.
- Fix: Search now contributes to active filter count and clears with status.
- Verification: TypeScript/lint pass.

## UX/UI Changes

- Employee and leave modals no longer close or throw unhandled errors when API mutations fail.
- Leave decision modal remains open after an approval/rejection failure so the user can retry or edit the comment.
- Leave search and status filters now clear consistently.
- Cancel leave remains hidden because the backend route is unavailable.

## Testing

- `npx tsc --noEmit`: pass
- `npm run lint`: pass with pre-existing warnings outside this module
- `npm test`: pass, 97 tests
- Live authenticated API tests:
  - Login with provided credentials: OK; token kept in-memory only.
  - Employee list, create, detail, update, reset password, and delete/disable: OK.
  - Attendance filter: OK.
  - Attendance check-in/check-out with far coordinates: correctly rejected by geofence with backend error.
  - Leave list, create, approve, reject, balance, and employee balances: OK.
  - Leave cancel: 404 backend-blocked.

## Remaining Risks

- Browser-level UI interaction was not run in this pass; validation was by code inspection, static checks, and live API probes.
- Disposable leave requests remain as approved/rejected audit rows because no delete/cancel endpoint exists:
  - `Codex no employee probe 20260814155709` rejected, status 2.
  - `Codex Module 25 approve probe 20260814160225` approved, status 1.
- The disposable employee used for CRUD was deleted/disabled, but detail remains readable after delete, which appears to be the backend's soft-delete behavior.
- The leave balance endpoint returned `success:false` with a valid `data.balance` and HTTP 200; the frontend tolerates this, but the envelope is semantically inconsistent.

## Final Status

MODULE 25: PASS WITH KNOWN LIMITATIONS

HARD STOP - Module 25 completed. Waiting for user review and approval before starting Module 26.
