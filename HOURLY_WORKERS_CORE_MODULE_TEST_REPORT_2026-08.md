# Module 27 Test Report - Hourly Workers Core

Date: 2026-08-14
Status: PASS
Priority row: 27 - Hourly Workers Core (HOURLY_WORKERS)
Inventory row: Module 36 - Hourly Workers - Core (Workers Pool, Requests, Orders, Drivers)

## Scope

Validated and aligned the core hourly worker pool surface:

- `/hourly-workers`
- `HourlyWorkerService`
- `useHourlyWorkers`, `useHourlyWorker`, `useHourlyWorkerMutations`
- Zero-footprint availability endpoint plumbing

Inventory coverage: 8 contracted endpoints.

## Endpoint Coverage

| Endpoint | Frontend Status | Live Result |
| --- | --- | --- |
| `GET /api/V1/HourlyWorkers` | Wired through `useHourlyWorkers` and `/hourly-workers` | 200 |
| `GET /api/V1/HourlyWorkers/{id}` | Wired through detail drawer/deep link hook | 200 |
| `POST /api/V1/HourlyWorkers` | Wired through create drawer | 200 |
| `PUT /api/V1/HourlyWorkers/{id}` | Wired through edit drawer | 200 |
| `DELETE /api/V1/HourlyWorkers/{id}` | Wired through delete action | 200; follow-up get returned 404 |
| `POST /api/V1/HourlyWorkers/{id}/Activate` | Wired through action button | 200 |
| `POST /api/V1/HourlyWorkers/{id}/Deactivate` | Wired through action button | 200 |
| `GET /api/V1/HourlyWorkers/Available` | Added typed hook/service alignment; no page UI by inventory note | 200 |

## Fixes Applied

- Aligned hourly worker list service query parameters to Swagger names: `Search`, `IsActive`, `HourlyRateFrom`, `BranchId`, `PageNumber`, etc.
- Added missing optional `linkedUserId` to create/update worker DTOs.
- Corrected availability params from `date` to Swagger's `requestDate`, and limited the request to `requestDate`, `startTime`, and `endTime`.
- Added `useAvailableHourlyWorkers()` for the inventory-listed availability endpoint, while keeping it zero-footprint because no dedicated UI exists.
- Wrapped worker create/edit submit in handled async flow so failed API mutations keep the drawer open.
- Fixed `/hourly-workers` filter active count and clear behavior for search and branch filters.
- Reset pagination when branch include-sub-branches changes or filters are cleared.

## Live API Probe

Used a disposable worker:

- Created: `Codex Module 27 Worker 20260814162814`
- ID: `f6249e4a-9433-4d40-29a0-08defa07ed99`
- Updated successfully.
- Deactivated and activated successfully.
- Availability endpoint returned 200 using `requestDate/startTime/endTime`.
- Deleted successfully.
- Follow-up detail lookup returned 404, confirming cleanup.

## Backend/API Notes

- Swagger declares Activate/Deactivate with no request body. The frontend keeps `{}` in Axios POST calls because this module was documented as having a historical 411 issue on empty-body POSTs; live backend accepted both no-body and `{}` probes.
- `GET /api/V1/HourlyWorkers/Available` has no branch query params in Swagger, even though the module is branch-scoped by auth/header context.
- List query binding likely tolerated lowercase names, but service now emits the documented Swagger parameter names exactly.

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97 tests.
- `npm run lint` - passed with existing unrelated warnings.

## Final Assessment

Module 27 is aligned end-to-end. No disposable hourly worker data remains from this run.
