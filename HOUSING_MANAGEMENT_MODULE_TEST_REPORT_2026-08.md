# Module 31 - Housing Management (HOUSING) Test Report

Date: 2026-08-14
Status: FAIL - FURTHER WORK REQUIRED

## Scope

Priority row: `Housing Management (HOUSING)` with 6 inventory endpoints for `/housing/management` and `/housing/applicants`.

Inventory endpoints validated:

- `GET /api/Housing/GetAll`
- `GET /api/Housing/GetActiveList`
- `POST /api/Housing`
- `PUT /api/Housing/{id}`
- `POST /api/Housing/ToggleActive/{id}`
- `DELETE /api/Housing/{id}`

Additional live Swagger endpoint discovered and aligned:

- `GET /api/Housing/{id}`

Worker housing endpoints mentioned in the priority row (`move-to-accommodation`, `Housed`, `ExitHousing`) are dependencies of housing workflows, but they are not part of the 6 HOUSING inventory endpoints for this module.

## Live API Results

Authenticated branch used for probes: `31887c15-5b47-4551-2190-08dea9210ab7`.

| Endpoint | Result |
| --- | --- |
| `GET /api/Housing/GetAll?PageSize=9999&PageNumber=1` | 200; returns paged `{ items, totalCount, pageNumber, pageSize }`. |
| `GET /api/Housing/GetActiveList` | 200; returns active housing array. |
| `POST /api/Housing` | 200; returns success message string. Disposable housing `dc985b9f-b55d-4690-4c65-08defa100977` was created and deleted. |
| `GET /api/Housing/{id}` | 200 for existing housing; 404 after deletion. Swagger exposes this endpoint although the local inventory omitted it. |
| `PUT /api/Housing/{id}` | 200. Live API accepts the old body without `id`, but the frontend now sends `id` to match `UpdateHousingDto`. |
| `POST /api/Housing/ToggleActive/{id}` | 200; toggles active state and `GetActiveList` excludes inactive housing. |
| `DELETE /api/Housing/{id}` | 200; cleanup verified by `GET /api/Housing/{id}` returning 404. |

## Blocking Backend Defect

Unauthenticated write access is possible when the caller supplies a valid `X-Branch-Id` header:

- Unauthenticated `POST /api/Housing` with a valid branch header returned 200 and created disposable housing `3d3b5cb6-f44d-43e4-4c66-08defa100977`; it was cleaned up.
- A second disposable housing `96a8ed07-8ea0-4b8e-4c67-08defa100977` confirmed unauthenticated `PUT`, `ToggleActive`, and `DELETE` all returned 200 with only `X-Branch-Id` supplied; the unauthenticated delete removed the record and authenticated `GET` then returned 404.
- Without `X-Branch-Id`, unauthenticated writes return 400 for the missing branch header before auth is enforced.

Backend should enforce authentication and authorization before allowing `POST`, `PUT`, `ToggleActive`, or `DELETE` housing mutations.

## Frontend Changes

- Added `API_ENDPOINTS.HOUSING.GET_BY_ID` and `HousingService.getById()`.
- Added `useHousing(id)` for single-record housing queries.
- Updated `/housing/management/[id]` to fetch the record through `GET /api/Housing/{id}` instead of loading the full list and filtering client-side.
- Updated housing updates to include `id` in the JSON body to match live Swagger `UpdateHousingDto`.
- Updated journal-entry contract-source routing to probe housing with `HousingService.getById()`.

Touched files:

- `src/config/api.config.ts`
- `src/services/housing.service.ts`
- `src/hooks/api/useHousing.ts`
- `src/app/housing/management/[id]/page.tsx`
- `src/lib/journal-entry-navigation.ts`

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97/97.
- `npm run lint` - passed with existing unrelated React hook dependency warnings.

## Cleanup

All disposable housing records created during this module were deleted. No Module 31 live test data is intentionally left behind.
