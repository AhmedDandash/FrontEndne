# Module 34 - Accounting Restriction Types (RESTRICTION_TYPE) Test Report

Date: 2026-08-14
Status: FAIL - FURTHER WORK REQUIRED

## Scope

Priority row: `Accounting — Restriction Types (RESTRICTION_TYPE)` with 5 endpoints for `/accounting/restriction-types` and journal-entry classification.

Inventory endpoints validated:

- `GET /api/V1/restrictiontype`
- `GET /api/V1/restrictiontype/{id}`
- `POST /api/V1/restrictiontype`
- `PUT /api/V1/restrictiontype/{id}`
- `DELETE /api/V1/restrictiontype/{id}`

Swagger lists the same paths as `/api/V1/RestrictionType` with uppercase `R`/`T`; the live server accepts both lowercase and uppercase route casing.

## Live API Results

Authenticated branch used for probes: `31887c15-5b47-4551-2190-08dea9210ab7`.

| Endpoint | Result |
| --- | --- |
| `GET /api/V1/restrictiontype` | 200; returns an array of 22 restriction types. Public read also returned 200. |
| `GET /api/V1/restrictiontype/{id}` | 200 for existing built-in type `00000000-0000-0000-0000-000000000001`. Public read also returned 200. |
| `POST /api/V1/restrictiontype` | 200; create now works despite the old inventory note saying 501. Response is a success-message string. |
| `PUT /api/V1/restrictiontype/{id}` | 200; no-op update on existing built-in row succeeded. |
| `DELETE /api/V1/restrictiontype/{id}` | 200 for disposable records; fake-id delete returns 400. |

## Blocking Backend Defect

Unauthenticated write access is possible when the caller supplies a valid `X-Branch-Id` header:

- Unauthenticated `POST /api/V1/restrictiontype` with a valid branch header returned 200 and created disposable record `08c12714-2e67-4b91-eaa5-08defa270671`.
- A controlled disposable record `660f6bd0-49e9-42e1-eaa7-08defa270671` confirmed unauthenticated `PUT` and `DELETE` both returned 200 with only `X-Branch-Id` supplied.
- Without `X-Branch-Id`, unauthenticated create returned 400 for the missing branch header before auth was enforced.

Backend should enforce authentication and authorization before allowing restriction-type create, update, or delete mutations.

## Frontend Review

- Existing endpoint constants and service calls work with the live server.
- Create UI is now valid because the backend no longer returns 501.
- The page supports create, edit/no-op update, active toggle via update, and delete. No frontend code change was required for this module.
- Journal-entry form lookup remains wired through `useRestrictionTypes()` and receives the live list correctly.

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97/97.
- `npm run lint` - passed with existing unrelated React hook dependency warnings.

## Cleanup

All disposable Module 34 restriction types were deleted:

- `08c12714-2e67-4b91-eaa5-08defa270671`
- `b1be763a-9411-4a46-eaa6-08defa270671`
- `660f6bd0-49e9-42e1-eaa7-08defa270671`

No Module 34 live test data is intentionally left behind.
