# Workers Module — Phase 3 Test Report

**Priority #4 — 🔴 Critical.** Tested 2026-08-11 against the live backend `https://sigma-api.runasp.net`. Raw logs: `worker-test.mjs`/`worker-test-results.json` (main pass) and `worker-test2-statuswipe-verify.mjs`/`worker-test2-statuswipe-verify-results.json` (persisted, reproducible proof of the headline bug + fix, added after an Opus audit round flagged the original proof as ad hoc/unpersisted).

**Scope note**: this module covers exactly the 10 endpoints in `api.config.ts`'s `WORKERS` group (core CRUD + basic lifecycle: activate, move-to-accommodation, set-refusal, WantsTransfer, export). The live backend actually exposes ~25 more Worker-family endpoints (Deportation, Handover, StatusLog, IssueResidency, ExitAndReEntry, etc.) — these belong to Priority #5 "Worker Master & Status Log" per the master priority table and are deliberately **not** tested here.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/api/V1/Worker` | anonymous, authed, filter, export, list-vs-detail shape divergence re-verification |
| GET | `/api/V1/Worker/{id}` | valid, no-auth, non-existent GUID, malformed id |
| GET | `/api/V1/Worker/WantsTransfer` | authed, no-auth |
| POST | `/api/V1/Worker` (multipart) | no-auth+no-header, header-but-no-token, valid rich create, empty fields, missing required-ish fields |
| PUT | `/api/V1/Worker/{id}` (multipart) | full-edit-form-shaped payload, **status-only payload (the actual bug that matters)**, no-auth |
| POST | `/{id}/activate`, `/{id}/set-refusal`, `/{id}/move-to-accommodation` | empty-body (matches real usage), no-auth, non-existent id |
| DELETE | `/api/V1/Worker/{id}` | non-existent GUID, no-auth, verified-real cleanup |

**Coverage gap, acknowledged (flagged by Opus audit)**: only one filter param (`SearchName`) was exercised, and it returned zero rows with no positive-match control, so "filters work" is not actually proven. `WorkerFilterParams` has ~35 fields, plus `useAvailableMediationWorkers`'s undocumented `availableForMediationContract`/`searchByPassportOnly` params — none of these got a real positive test. Given how much this session already found, this was deprioritized in favor of the write-path bugs below; flagging rather than silently leaving it uncovered.

## 🔴 CRITICAL — one-click status actions destroy the entire worker record (fixed)

The single most severe bug found in this session — and independently re-verified live by an Opus audit round using its own fresh repro, not just this report's word. `PUT /api/V1/Worker/{id}` is a full replace (same defect class as Branch and Customer), and three places in `src/app/applicants/page.tsx` called `updateWorker({ id, data: { workerStatus: N } })` — **a bare one-field object** — to implement one-click actions:
- Auto-setting status to "Backout" (4) when a medical exam fails (~line 851)
- The "Mark as Received" action (~line 975, `workerStatus: 1`)
- The "Suspend" action (~line 978, `workerStatus: 6`)

**Proof, persisted and reproducible** (`worker-test2-statuswipe-verify.mjs`, Part A): created a worker with a full profile (name, passport, nationality, mobile — confirmed populated via a `GET` immediately before triggering the bug), then sent `PUT` with only `{ WorkerStatus: 1 }` — the exact payload shape the unfixed code produced. Result: `fullNameAr: null, fullNameEn: null, nationalityId: null, passportNo: null, mobile: null` — the entire worker reduced to just its id and the new status. **Every click of "Mark as Received," "Suspend," or a medical exam failing was silently destroying that worker's entire record.** These are routine, everyday actions in the applicants workflow, not an edge case.

**Fixed**: added `workerToPreservableDto()` and `updateWorkerPreservingRecord()` in `applicants/page.tsx` — the latter fetches the worker's current full record via a fresh `GET /{id}` (not the query cache) immediately before applying the status change, merges the patch on top, and only then calls `updateWorker`. All three call sites now route through it. **Fix proof, persisted and reproducible** (same script, Part B): the exact same status-only change, run through the fixed logic, now leaves `fullNameAr`, `passportNo`, `nationalityId`, `mobile` all intact, with only `workerStatus` changed.

**Known, deliberate residual gap in the fix**: `uploadImage`, `uploadVideo`, and `attachments` are excluded from the preservation merge, because on a fetched `Worker` these are URL strings (or a URL array), not `File` objects — resubmitting a URL into a binary multipart field isn't meaningful, and properly preserving them would require re-downloading and re-uploading the actual file, which is out of scope here. **Consequence, stated plainly since an earlier draft of this report under-flagged it**: every status-only action (Received/Suspend/medical-fail) still clears a worker's uploaded photo, video, and attachments, even after this fix. Only the catastrophic wipe of name/passport/nationality/etc. is resolved. If photo/video/attachment loss on a status change turns out to matter operationally, that needs a separate, deliberate fix (fetch-and-reattach the actual files, or a backend partial-update endpoint) — not something to silently accept as "the same fix already covers it."

**Also fixed alongside**: the three call sites fire `updateWorkerPreservingRecord()` without awaiting it (matching this file's existing fire-and-forget mutation style), which meant a failed pre-flight `GET` would previously have been an unhandled promise rejection — no error toast, no visible sign the status change didn't happen. Added a `try/catch` inside the helper itself so every caller gets a toast on failure without needing individual changes.

## 🔴 HIGH — the full-edit form also drops secondary fields (fixed)

Smaller-scope instance of the same full-replace-PUT issue. The edit form already spreads the **entire** fetched worker record into the form (`form.setFieldsValue({...editingWorker, ...})`) — architecturally better than Branch/Customer's curated-subset approach. But 7 `WorkerDto` fields have no corresponding `Form.Item` at all: `relativeNameAr`, `relativeNameEn`, `relativeMobile`, `skills`, `arabicLanguageLevel`, `englishLanguageLevel`, `responsibleUserId`. Spreading data into a form field that doesn't exist is a no-op — those 7 values were silently dropped from every full-form edit's submit payload, and the full-replace `PUT` then nulled them.

**Fixed**: `handleSubmit` now builds a `preservedUnmanagedFields` object from `editingWorker` for exactly those 7 fields, spread as the base before the form's own `restValues` override it. **Retested live**: created a worker with all 7 fields populated, ran the fixed submit logic changing only the name, confirmed via follow-up `GET` that all 7 survived alongside the name change.

**Minor, informational**: `workerToPreservableDto()`'s field-stripping list is built from the TS `Worker` interface, but the live API returns several fields not declared in that type at all (`userId`, `responsibleUserName`, `isActiveDate`, `workerEscapeDate`/`SickDate`/`OutDate`/`RefusedWorkDate`, `wantsWork`, `wantsTransfer`, `isReadyForDeportation`/`Handover`, `isResidencyIssued`, `iqamaNumber`, `notes`, `createdDate`, `createdBy`) — these ride along into the multipart body unstripped. Tested directly: the backend silently ignores them (still 200, still fully preserves the record), so this is benign, but noting it since it wasn't verified before this report first shipped.

## 🟡 MEDIUM — WorkerStatus 5/6 offered in the create/edit form but always rejected (fixed); Gender/MaritalStatus 0-indexing (documented, not fixed)

**Corrected from an earlier draft of this report**, which wrongly claimed all five enum constants (`GENDER`, `WORKER_TYPE`, `WORKER_STATUS`, `MARITAL_STATUS`, `RELIGION`) were 0-indexed and used directly by this page, and that no signal existed for the correct semantics. Neither claim survived scrutiny:

- The applicants page does **not** use `WORKER_STATUS`/`WORKER_TYPE` (the 0-indexed ones) at all. It uses `WORKER_SATUS` (a differently-named constant, 1-indexed: `1=Available, 2=Trial Worker, 3=Under Procedure, 4=Backout, 5=Inside Kingdom, 6=Deported`) and `WORKER_CONTRACT_TYPE` (1-indexed, `1=Mediation, 2=Operation/Rent, 3=Sponsorship Transfer`) — both already correctly aligned with the live backend's 1-indexed ranges. `RELIGION` is also used, but with an existing `.filter(o => o.value !== 0)` already excluding its invalid 0 option — someone had already fixed this one.
- Only `GENDER` and `MARITAL_STATUS` are genuinely 0-indexed in a form this page actually submits, so "selecting the first option in any of 5 dropdowns always fails" was wrong — it's these 2, not 5.
- `WORKER_SATUS`'s values 5 (Inside Kingdom) and 6 (Deported) **are** real, documented labels, but they're outside the live `WorkerStatus` enum's valid range `[1,2,3,4]` — confirmed live (`worker-test2-statuswipe-verify-results.json`, Part C: both 400 "The value is invalid"). Reading the surrounding code explains why: a comment at the worker-status tab bar and the existence of dedicated lifecycle endpoints (`POST /{id}/Deportation`, `/Handover`, `/IssueResidency`, etc. — Priority #5, untested this module) strongly suggest 5/6 are *derived* states reached through those specific actions, not something meant to be set directly via the generic edit form's status dropdown.

**Fixed**: removed options `5` and `6` from the create/edit form's `WorkerStatus` Select only (`.filter((o) => o.value !== 5 && o.value !== 6)`, mirroring the existing `RELIGION` precedent in the same file) — selecting either previously guaranteed a 400 on save. The read-side uses of `WORKER_SATUS` (the status filter dropdown, the tab bar) are untouched, since those are legitimately displaying/filtering data that may already carry a 5/6 status from elsewhere (e.g. once Priority #5's Deportation endpoint is used).

**Still not fixed, now more precisely characterized**: the "Suspend" action's `workerStatus: 6` doesn't map to "suspended" at all under `WORKER_SATUS`'s real labels — 6 is "Deported." Either the button is mislabeled relative to what it actually does, or "Suspend" is a distinct concept that doesn't exist in the current `WorkerStatus` enum and the original author mismapped it. Not fixed because the correct behavior here is a product/business question I can't resolve by reading code (should "Suspend" reuse "Backout" (4, already used for medical-exam failures — conflating two different business events), should it call the dedicated Deportation endpoint instead of the generic status field, or does it need a new backend status that doesn't exist yet?) — flagging for a decision rather than guessing. Separately, `GENDER`/`MARITAL_STATUS` being 0-indexed against a 1-indexed backend remains genuinely unresolved: I found no lookups endpoint for either, and existing live worker data doesn't disambiguate (every worker with a `gender` set shows the same value regardless of name, suggesting untrustworthy seed data rather than a confirmed mapping). Recommend backend-side confirmation before shifting these two.

## Other findings

| Finding | Severity | Status |
|---|---|---|
| Status-only updates nulling the entire worker record | 🔴 Critical — data destruction | ✅ **Fixed, retested live, independently re-verified by Opus** |
| That fix still clears `uploadImage`/`uploadVideo`/`attachments` on every status-only action | 🟡 Medium — residual data loss | **Known limitation, not fixed** — would require re-fetching and re-uploading actual file blobs, or a backend partial-update path. Documented rather than silently left implicit. |
| Full-edit form dropping 7 secondary fields | 🔴 High — data loss | ✅ **Fixed and retested live** |
| `WorkerStatus` 5/6 offered in the create/edit Select despite always being rejected | 🟡 Medium | ✅ **Fixed** — removed from that Select only |
| `workerStatus: 6` used by "Suspend" doesn't correspond to "suspended" under the real enum labels (it's "Deported") — the button has never done what its label claims | 🟡 Medium | **Documented, not fixed — needs a product/backend decision, not a guess** |
| `GENDER`/`MARITAL_STATUS` are 0-indexed against a 1-indexed backend enum | 🟡 Medium | **Documented, not fixed — needs backend-side enum semantics confirmation** |
| A failed pre-flight `GET` inside the new preservation helper was an unhandled rejection with no user feedback | 🟡 Medium | ✅ **Fixed** — wrapped in try/catch with an error toast |
| Entire write surface (create, update, all three lifecycle actions, delete) unauthenticated | 🔴 Critical | **Backend fix required — cannot fix from this repo.** Fourth consecutive module with this pattern (Auth, Branch, Customer, now Worker) — treat as one systemic backend gap, not four coincidences. |
| `POST /api/V1/Worker` with a completely empty body succeeds (200) and creates a blank junk worker row | 🟡 Medium | **Backend validation gap, cannot fix here** — same "silent no-op create" bug class documented in project memory for other modules. |
| `useCreateWorker`/`useUpdateWorker` typed their mutation's resolved value as `Worker`, but the backend returns a bare success-message string for both | 🟢 Low | ✅ **Fixed** — retyped and unwrapped correctly. Confirmed harmless: no consumer reads the resolved value. |

## What's working correctly (verified, not just assumed)

- List vs detail shape divergence, previously documented in project memory (6 days old), **re-confirmed live and still accurate**: the list is a slim projection lacking `nationalityId`/`jobId`/most detail fields; the detail endpoint returns everything.
- `GET /{id}`: proper 404 for non-existent GUID, proper 400 for malformed id.
- Lifecycle actions (`activate`, `set-refusal`, `move-to-accommodation`) all correctly accept an empty body and return success; `activate` on a non-existent id correctly 404s.
- `DELETE` of a non-existent GUID correctly 404s.

## Opus audit — findings and fixes

An independent Opus review came back **"pass-with-notes"** — it independently reproduced the headline wipe bug with its own fresh script before trusting this report's claim, confirmed the fix works, but caught real problems in the surrounding detail:

1. Reproduced the core finding independently and confirmed it's real, not a sparse-fixture artifact.
2. **Caught that the enum section named the wrong constants** — `WORKER_STATUS`/`WORKER_TYPE` (0-indexed, unused by this page) instead of `WORKER_SATUS`/`WORKER_CONTRACT_TYPE` (1-indexed, actually used and already mostly correct). This was a real diagnostic error, not just a phrasing issue — corrected above, along with the newly-found `WorkerStatus` 5/6 bug that only surfaced from reading the *right* constant.
3. **Pointed out the semantics I claimed were "unconfirmable" were actually documented in the codebase** (`WORKER_SATUS`'s own labels, a tab-bar comment repeating them) — I'd checked the wrong file section. Used this to correctly fix the 5/6 issue and re-characterize (not fix) the Suspend mismapping with real evidence instead of a shrug.
4. **Flagged that the headline proof wasn't persisted** — addressed with `worker-test2-statuswipe-verify.mjs`.
5. **Caught the unhandled-rejection risk** in the fire-and-forget async helper — fixed.
6. Noted the `uploadImage`/`uploadVideo`/`attachments` exclusion was mentioned in a code comment but under-stated in the report's actual findings — corrected above.
7. Flagged the filter-coverage gap — acknowledged above rather than fixed, given the session's time budget and that it's a coverage gap, not a confirmed defect.

## Cleanup

All test workers created across every test pass and fix-verification script (identified by Arabic test-name/passport prefixes) were deleted and verified gone. Final residue check against the live list after all passes: 0 matches, worker count back to the pre-session baseline of 14.

## Regression

`tsc --noEmit` clean after all changes (`applicants/page.tsx`, `useWorkers.ts`). Both major fixes (status-preservation, full-edit-form field-preservation) were retested live end-to-end against the real backend via direct `GET` verification, with the proof now persisted to reproducible scripts rather than left as unrecorded terminal output.
