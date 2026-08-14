# Module 32 - Medical Examination (MEDICAL_EXAMINATION) Test Report

Date: 2026-08-14
Status: FAIL - FURTHER WORK REQUIRED

## Scope

Priority row: `Medical Examination (MEDICAL_EXAMINATION)` with 7 endpoints used by worker eligibility checks and applicant medical-exam modals.

Inventory endpoints validated:

- `GET /api/V1/MedicalExamination`
- `GET /api/V1/MedicalExamination/{id}`
- `GET /api/V1/MedicalExamination/check-worker/{workerId}`
- `POST /api/V1/MedicalExamination`
- `PUT /api/V1/MedicalExamination/{id}`
- `DELETE /api/V1/MedicalExamination/{id}`
- `GET /api/V1/MedicalExamination/report/{id}`

## Live API Results

Authenticated branch used for probes: `31887c15-5b47-4551-2190-08dea9210ab7`.

| Endpoint | Result |
| --- | --- |
| `GET /api/V1/MedicalExamination?PageSize=100&PageNumber=1` | 200; returns paged `{ items, totalCount, pageNumber, pageSize }`. |
| `GET /api/V1/MedicalExamination/{id}` | 200 for existing exam `f5bb39bb-6b7f-4a04-2149-08def78c00de`; public read also returned 200. |
| `GET /api/V1/MedicalExamination/check-worker/{workerId}` | 200 for worker `0853aaf3-cc38-4a83-799f-08def782f773`; public read also returned 200. A worker with no exam returns 404. |
| `POST /api/V1/MedicalExamination` | 200; returns success message string. Disposable records were created and cleaned up. |
| `PUT /api/V1/MedicalExamination/{id}` | 200 for disposable exam update. |
| `DELETE /api/V1/MedicalExamination/{id}` | 200; cleanup verified with authenticated `GET` returning 404. |
| `GET /api/V1/MedicalExamination/report/{id}` | 200; returns report object with worker, passport, nationality, job, status, notes, creator, and date fields. Public read also returned 200. |

## Blocking Backend Defect

Unauthenticated write access is possible when the caller supplies a valid `X-Branch-Id` header:

- Unauthenticated `POST /api/V1/MedicalExamination` with a valid branch header returned 200 and created a disposable exam.
- A controlled disposable exam `3cdfc925-79f4-47b5-b161-08defa1e605f` confirmed unauthenticated `PUT` and `DELETE` both returned 200 with only `X-Branch-Id` supplied; authenticated `GET` then returned 404.
- Without `X-Branch-Id`, unauthenticated writes return 400 for the missing branch header before auth is enforced.

Backend should enforce authentication and authorization before allowing `POST`, `PUT`, or `DELETE` medical-exam mutations.

## Frontend Changes

- Centralized Medical Examination response unwrapping in `MedicalExaminationService`, including paged `{ items }` list responses, standard `{ data }` envelopes, single-record reads, check-worker reads, and report reads.
- Updated the active applicant hooks in `useWorkers.ts` to use `MedicalExaminationService` and request the full medical exam list with `PageSize=9999`; this fixes existing medical exam indicators/actions disappearing because the live list endpoint is paged.
- Changed `check-worker` handling so 404 maps to "no exam", while non-404 failures still surface instead of silently looking like eligibility.
- Added a `View Report` button to the applicant medical-exam view modal that calls `GET /api/V1/MedicalExamination/report/{id}` and displays the report fields.
- Re-enabled the medical-exam update action in `/applicants/followup` and made exam-to-worker comparisons UUID string-safe.

Touched files:

- `src/services/medical-examination.service.ts`
- `src/hooks/api/useWorkers.ts`
- `src/app/applicants/page.tsx`
- `src/app/applicants/followup/page.tsx`

## Verification

- `npx tsc --noEmit` - passed.
- `npm test` - passed, 97/97.
- `npm run lint` - passed with existing unrelated React hook dependency warnings.

## Cleanup

All disposable Module 32 medical examinations were deleted. No Module 32 live test data is intentionally left behind.
