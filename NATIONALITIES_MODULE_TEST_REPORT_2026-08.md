# Nationalities Module — Phase 3 Test Report

**Priority #13 — 🟠 High.** Tested 2026-08-12 against the live backend `https://sigma-api.runasp.net`. Raw logs (scratchpad): `nat-test1.mjs`/`-results.json` (reads, truncation check, create validation), `nat-test2.mjs`/`-results.json` (isolated update/toggle-status/delete auth checks, cleanup), `nat-audit-verify.mjs`/`-results.json` (the audit's own saved re-verification of the no-auth update claim — see round-2 below).

> **Round-2 corrections (post Opus audit, verdict: pass-with-notes):** the audit confirmed the truncation fix, the auth-bypass findings, and cleanup as genuine — but found a real frontend bug in the one component this report had explicitly cleared as needing no fix, plus a 10th consumer of the truncating `getAll()` call this report's count missed, plus an unsaved verification claim. All three are corrected below, marked **[round 2]**.

## This module was checked specifically for the pattern found in the prior module (Jobs)

Module #12 (Jobs) found a live list-truncation bug where the service's "get everything" method sent no pagination parameters, silently capping at the backend's default page size. `NationalityService.getAll()` has the same "send no params if the caller didn't provide any" shape, and 9 pages call `useNationalities()` with no params at all — so this module was tested for the identical pattern before anything else.

## 🔴 HIGH — the exact same silent list-truncation bug as Jobs, confirmed live (frontend, fixed)

With 12 real nationalities on the system, `GET /api/V1/Nationality` called with no query parameters returned only `10` (the backend's default page size); the same call with `PageSize=9999` returned all `12`. `NationalityService.getAll()` only added its own `pageSize`/`isActiveOnly`/etc. params to the request when the *caller* supplied at least one — every one of the 9 real consumers that call `useNationalities()` bare (`agents`, `applicants`, `RentOfferSelector`, `rent-prices-offers`, `settings/mediation`, `rent`, `rent/[id]`, `mediationcontract`, `automaticfollowup`) triggered the unparameterized, truncating call. **[round 2, correction]** This undercounted the exposure by one: `src/hooks/api/useNationalityFollowUpStatuses.ts` calls `NationalityService.getAll()` **directly**, bypassing `useNationalities()` entirely — a 10th bare call site this report's original enumeration missed. Since the fix below is at the service level, this consumer is already covered with no additional code change needed; it's corrected here for an accurate count, not because anything was left unfixed. (That hook has zero consumers of its own and a separate, unrelated pre-existing bug — its `nationalityId` filter can never match this DTO's current `id` field, so it always returns an empty list regardless of truncation — out of scope for this report.)

**Fixed**: `getAll()` now always sends `pageSize: params?.pageSize ?? 9999` — callers that specify their own `pageSize` keep it; everyone else gets the full list. Re-verified live with the exact param casing the code actually sends (`pageSize`, lowercase — ASP.NET's query binding is case-insensitive, confirmed) — returns all 12.

## 🟠 HIGH — full CRUD-plus-toggle auth bypass on Nationalities (backend, cannot be fixed from this repo)

**Create, Update, Delete, and Toggle-Status are all unauthenticated**, each isolated-confirmed independently:

- **CREATE**: a no-token request with a valid `X-Branch-Id` header returned `200` with a real created record; confirmed persisted via a follow-up authenticated `GET`.
- **UPDATE**: on a fresh, isolated nationality, a no-token `PUT` (with the required `id` field included in the body — the update DTO validates it matches the URL) returned `200`; a follow-up `GET` confirmed the submitted name change was genuinely saved. (An earlier attempt without `id` in the body returned `400 "ID mismatch"` — a test-script gap, not an auth finding, corrected before drawing any conclusion.) **[round 2, correction]** The corrected re-test wasn't actually saved to its own script/log file in round 1 — an evidence gap, even though the underlying claim was true. The audit re-ran it independently and saved the result (`nat-audit-verify.mjs`/`-results.json`): a fresh no-token `PUT` with `id` correctly included → `200`, follow-up authed `GET` confirms the new name persisted. It also found that the `400 "ID mismatch"` isn't specific to the no-auth case — an *authenticated* request with a mismatched body `id` gets the same `400`, and that omitting `X-Branch-Id` (not the bearer token) is what actually gates that particular call — both consistent with, and now more precisely evidenced than, the original claim.
- **TOGGLE-STATUS**: a no-token `PUT .../toggle-status` (no body) returned `200`; a follow-up `GET` confirmed `isActive` genuinely flipped from `true` to `false`.
- **DELETE**: on a fresh, isolated nationality, a no-token `DELETE` returned `200`; a follow-up `GET` returned `404`, confirming it was genuinely gone.

Same systemic pattern found in nearly every module this session.

## 🟡 MEDIUM — a nationality can be created with no name at all (backend, cannot be fixed from this repo)

`POST /api/V1/Nationality` with an empty body, or with both `nationalityNameAr`/`nationalityNameEn` omitted, succeeds (`200`) — the same gap found in Jobs. Unlike Jobs, however, this module's one live create path (`NationalitySelect.tsx`'s inline "add new nationality" affordance) already validates both fields as required *client-side* before ever calling the API (`if (!ar || !en) { setErrorMsg(...); return; }`), so a real user cannot currently trigger this through the app's own UI — only a direct API call can. Still worth a backend fix for defense in depth, since nothing stops a second UI surface (or a future one) from skipping that same client-side check.

## 🟠 MEDIUM — the "add new nationality" duplicate check only saw an already-filtered list, letting real duplicates through the UI (frontend, fixed)

**[round 2, new finding — this report had explicitly cleared this exact component as needing no fix, and that clearance was wrong]** `NationalitySelect.tsx` fetches its nationality list via `useNationalityOptions({ isActiveOnly })`, forwarding whatever `isActiveOnly` the parent page passes in, and its inline "add new" form checks for duplicate names against that *same, potentially-filtered* list. Two live call sites pass `isActiveOnly` while leaving the "Others — add new" affordance enabled: `customers/page.tsx` and `agents/page.tsx`. Since the system currently has two real nationalities marked inactive (Kenya, Bangladesh), a user on either of those pages typing "Kenya" into the add-new form would find no match in the filtered list and get past the duplicate guard — creating a genuine second "Kenya" record. Live-verified this isn't caught server-side either: the backend accepts duplicate names with no rejection (a disposable duplicate "Saudi" was created and deleted to confirm, by the audit).

**Fixed**: added a second, always-unfiltered `useNationalityOptions()` call solely for the duplicate check, so it now always compares against every nationality — active or not — regardless of what filter the parent page applies to the *displayed* dropdown list. The displayed options themselves are unaffected; only the duplicate-detection logic now sees the complete picture.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/Nationality` | anonymous, authed, unparameterized-call truncation at 10 (the HIGH finding), `PageSize=9999` comparison, `isActiveOnly` filter, `searchName` filter |
| GET | `/Nationality/{id}` | valid, no-auth, non-existent, malformed |
| POST | `/Nationality` (create) | no-auth+no-header, no-auth-with-header (the auth gap, isolated), empty body, missing both name fields, valid create |
| PUT | `/Nationality/{id}` (update) | no-auth (isolated, the auth gap — with the required `id` field correctly included), valid |
| PUT | `/Nationality/{id}/toggle-status` | no-auth (isolated, the auth gap), valid, verified via before/after `isActive` |
| DELETE | `/Nationality/{id}` | no-auth (isolated, the auth gap), valid |

## What's working correctly (verified, not just assumed)

- **`GET /Nationality/{id}`** returns `404` for both a non-existent and a malformed id — standard, correct behavior (differs slightly from Jobs, where a malformed id returned `400` — a harmless per-controller convention difference, not a defect).
- **The update DTO's `id`-in-body validation works correctly**: a `PUT` with a body `id` that doesn't match the URL (or is simply absent) is cleanly rejected (`400 "ID mismatch"`), not silently accepted or crashed.
- **The one live write consumer (`NationalitySelect.tsx`) has solid error handling**: `handleSave` is properly wrapped in try/catch and surfaces server errors inline via `setErrorMsg` — not a silently-swallowed rejection, and re-confirmed by the audit as the correct pattern. **[round 2, correction]** Round 1 extended this to "no frontend bug found here" — true for error handling, false for correctness: the duplicate-check logic itself had a real bug, fixed above.
- **`useUpdateNationality`, `useDeleteNationality`, and `useToggleNationalityStatus` are fully implemented (hooks, DTOs, error handling) but have zero consumers anywhere in the app** — the same "backend has full CRUD, frontend only exposes a slice of it" pattern found in Jobs, though less extreme here since Create genuinely is wired up and used.
- GET endpoints (list, by-id) are anonymous-accessible — consistent with the GET-endpoints-generally-unauthenticated pattern seen across the whole app.

## Cleanup

All nationalities created during this module's testing were deleted and verified gone via a full-list sweep using the corrected (non-truncating) query. Final residue: **0** — the system is back to its original 12 real nationalities.

## Regression

`tsc --noEmit` clean after all fixes (`nationality.service.ts`, `components/common/NationalitySelect.tsx` — two files changed, the latter added in round 2). Browser pane verification not attempted this session (consistent with prior modules where the dev server/browser pane were unresponsive) — the fixes are type-checked and the truncation fix is live-verified at the API level with the exact parameter shape the code sends.

## Round-2 audit summary

The Opus audit returned **pass-with-notes**, explicitly checking this report harder than usual given the immediately-preceding module's (Jobs) first-pass audit had returned "needs-rework." It confirmed the truncation fix is correct for every call shape, confirmed the auth-bypass findings are cleanly isolated with no confounds, and independently re-verified cleanup as genuine. It found one real issue this report had gotten backwards: `NationalitySelect.tsx` was cleared as needing no fix, when its duplicate-check logic actually had a live, reachable bug (blind to inactive nationalities on the two pages that filter by `isActiveOnly`) — fixed above. It also added a 10th consumer to the truncation-exposure count (already covered by the service-level fix, just undercounted) and flagged that the corrected no-auth-update re-test hadn't been saved to its own script — reproduced and saved by the audit itself. No further audit round requested; corrections applied directly.
