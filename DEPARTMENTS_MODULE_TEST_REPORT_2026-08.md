# HR Departments Module Test Report - 2026-08

## Module

- Priority order: Module 24
- Inventory section: Module 33 (numbering mismatch in reference files)
- Name: HR - Departments (DEPARTMENT)
- Priority: High

## Source References

- `API_MODULE_PRIORITY_2026-08.md`: Module 24 is `HR - Departments (DEPARTMENT)`.
- `API_MODULE_INVENTORY_2026-08.md`: DEPARTMENT inventory lists 3 endpoints under `Human Resources - Departments`.
- `simga-api.txt`: Confirms `POST /api/V1/Department` uses query parameters `nameAr` and `nameEn`; confirms `GET /api/V1/Lookup/Departments`.

## API Coverage

| Method | Endpoint | Frontend Usage | Status |
|---|---|---|---|
| GET | `/api/V1/Lookup/Departments` | `DepartmentService.getAll()` -> `useDepartments()` -> `/hr/departments` table and employee department selectors | Authenticated test passed; unauthenticated probe returned 401, so auth differs from inventory's public marking |
| POST | `/api/V1/Department?nameAr=&nameEn=` | `DepartmentService.create()` -> `useDepartments()` -> create modal | Authenticated test passed; correct query-param create contract preserved |
| DELETE | `/api/V1/Department/{id}` | Not exposed in UI | Backend-blocked: authenticated request to documented route returned 404 and did not delete the created fixture |

## Issues Found

### Documented Delete Endpoint Not Available

- Endpoint/UI: `DELETE /api/V1/Department/{id}` and `/hr/departments`
- Problem: Inventory documents a delete endpoint and `DepartmentDeleteButton`, but the authenticated backend route returned 404 for a department created during this run.
- Root cause: Backend/API documentation drift. The Swagger snapshot also does not list a department delete operation.
- Fix: The frontend intentionally does not expose a delete action for departments, so users are not offered an action the backend does not currently support.
- Verification: Authenticated `DELETE /api/V1/Department/{createdId}` returned 404; polling the lookup for 6 seconds showed the fixture still existed.

### Submit Error Handling Gap

- Endpoint/UI: `POST /api/V1/Department`
- Problem: Failed form/API submit could reject through Ant Design modal `onOk`.
- Root cause: `handleSubmit` awaited validation/mutation without catching the rejection.
- Fix: Wrapped submit in `try/catch`; validation errors and mutation toasts remain user-visible.
- Verification: TypeScript and lint pass.

### Reference/Auth Drift

- Endpoint/UI: `GET /api/V1/Lookup/Departments`
- Problem: Inventory marks the endpoint as public/unverified, but a safe live unauthenticated probe returned 401.
- Root cause: Backend auth behavior appears stricter than the inventory note.
- Fix: No frontend code change required; existing API client attaches bearer token and `X-Branch-Id` in authenticated app usage.
- Verification: `Invoke-WebRequest` against `https://sigma-api.runasp.net/api/V1/Lookup/Departments` returned 401 unauthenticated.

## UX/UI Changes

- Kept the department table list/create-only because the documented delete route is not available on the live backend.
- Improved modal submit error handling so failed validation/API requests do not bubble as unhandled promise rejections.
- Preserved existing Ant Design card/table/modal layout used by adjacent HR settings pages.

## Testing

- `npx tsc --noEmit`: pass
- `npm run lint`: pass with pre-existing warnings outside this module
- `npm test`: pass, 97 tests
- Live API probes:
  - Login with provided credentials: OK; token kept in-memory only and not printed.
  - `GET /api/V1/Branch` with bearer token: OK; branch id selected from JWT.
  - `GET /api/V1/Lookup/Departments` with bearer + `X-Branch-Id`: OK.
  - `POST /api/V1/Department?nameAr=&nameEn=` with bearer + `X-Branch-Id`: 200; created fixture appeared in lookup.
  - `DELETE /api/V1/Department/{createdId}` with bearer + `X-Branch-Id`: 404; fixture remained after polling.
  - Common delete-route variants were also probed for the disposable fixture and returned 404/405.
  - `GET /api/V1/Lookup/Departments` without auth: 401.

## Remaining Risks

- One disposable department fixture remains because the documented delete endpoint and common route variants did not remove it: `Codex Module 24 Route Test 20260814155652` (`c6522e5b-1ae2-4ad6-1054-08defa022387`).
- The Swagger snapshot in `simga-api.txt` does not list the department delete route, while the inventory does. Backend support is required before a department delete UI can be safely enabled.
- UI testing was API-level rather than browser-level in this follow-up; endpoint behavior was verified against the live backend.

## Final Status

MODULE 24: FAIL - FURTHER WORK REQUIRED

HARD STOP - Module 24 completed. Waiting for user review and approval before starting Module 25.
