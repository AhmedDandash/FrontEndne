# Module 33 - Complaints (COMPLAINT) Test Report

Date: 2026-08-14
Status: FAIL - FURTHER WORK REQUIRED

## Scope

Priority row: `Complaints (COMPLAINT)` with 9 endpoints for `/complaints`.

Inventory endpoints validated:

- `GET /api/Complaint`
- `GET /api/Complaint/{id}`
- `POST /api/Complaint`
- `DELETE /api/Complaint/{id}`
- `POST /api/Complaint/{id}/finish`
- `POST /api/Complaint/{id}/toggle-hold`
- `POST /api/Complaint/issue`
- `GET /api/Complaint/{id}/issue`
- `POST /api/Complaint/update`

## Live API Results

Authenticated branch used for probes: `31887c15-5b47-4551-2190-08dea9210ab7`.

Disposable complaint created during testing: `38c048e3-c6ee-43cc-b005-08defa257f11`.

| Endpoint | Result |
| --- | --- |
| `GET /api/Complaint?PageSize=10&PageNumber=1` | 200; returns paged `{ items, totalCount, pageNumber, pageSize }`. Public read also returned 200. |
| `GET /api/Complaint/{id}` | 200 for existing and disposable complaint. Public read also returned 200. |
| `POST /api/Complaint` | 200; created disposable complaint `38c048e3-c6ee-43cc-b005-08defa257f11`. |
| `POST /api/Complaint/update` | 200; added update note to disposable complaint. |
| `POST /api/Complaint/issue` | 200 without binary files; 500 when `file1` binary upload is included. |
| `GET /api/Complaint/{id}/issue` | 404 when no issue exists; 200 after no-file issue creation. Public read returned 200. |
| `POST /api/Complaint/{id}/toggle-hold` | 200; hold and resume both returned boolean success. |
| `POST /api/Complaint/{id}/finish` | 200; returns boolean success. |
| `DELETE /api/Complaint/{id}` | 405 Method Not Allowed. Swagger also omits DELETE for `/api/Complaint/{id}`. |

## Blocking Backend Defects

- `DELETE /api/Complaint/{id}` is documented in inventory and wired in the frontend service, but live API returns 405 and Swagger does not list the operation. The disposable complaint `38c048e3-c6ee-43cc-b005-08defa257f11` could not be deleted.
- `POST /api/Complaint/issue` returns 500 when a real binary `file1` upload is sent, even though Swagger declares `file1` and `file2` as binary multipart fields.
- Unauthenticated `POST /api/Complaint/{id}/finish` with only a valid `X-Branch-Id` returned 200 against the already-finished disposable complaint. Backend should enforce authentication and authorization before complaint lifecycle mutations.

## Frontend Changes

- Removed the broken UI edit action that reopened the create modal and submitted a duplicate complaint, because there is no complaint PUT endpoint.
- Added an `Add Update` action and modal backed by `POST /api/Complaint/update`.
- Removed the delete action from the complaint action menu because the live backend returns 405.
- Added a client-side guard that prevents issue submission with binary attachments while the live upload path returns 500; users can still create issue records without attachments.
- Fixed React Query cache updates for complaint list queries, which store `{ complaints, total }`, not a raw complaint array.

Touched files:

- `src/app/complaints/page.tsx`
- `src/hooks/api/useComplaints.ts`

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97/97.
- `npm run lint` - passed with existing unrelated React hook dependency warnings.

## Cleanup

Cleanup attempted with authenticated `DELETE /api/Complaint/38c048e3-c6ee-43cc-b005-08defa257f11`, but the backend returned 405. The disposable complaint remains in the backend:

- Complaint ID: `38c048e3-c6ee-43cc-b005-08defa257f11`
- Notes marker: `Codex Module 33 disposable 2026-08-14T17:06:20.855Z`
- Final state: finished, with one update note and no-file issue records from endpoint validation.
