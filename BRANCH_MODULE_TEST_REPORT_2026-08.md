# Branch Management Module — Phase 3 Test Report

**Priority #2 — 🔴 Critical.** Tested 2026-08-11 against the live backend `https://sigma-api.runasp.net`. Raw logs in scratchpad: `branch-test.mjs`/`branch-test-results.json` (pass 1 — has some known-bad tests from a script bug, see below), `branch-test2.mjs`/`branch-test2-results.json` (pass 2), `branch-test3-isolated.mjs`/`branch-test3-isolated-results.json` (pass 3 — clean, isolated re-tests of the auth-bypass claims after an Opus audit round flagged pass-1/2's versions as under-evidenced).

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/api/V1/Branch` | anonymous, authed, filters (SearchName, NameAr Arabic substring), pagination, empty-result search, raw-byte encoding check |
| GET | `/api/V1/Branch/{id}` | valid, no-auth, non-existent GUID, malformed id, geofence-fields-present-on-detail check |
| GET | `/api/V1/Branch/{id}/sub-branches` | valid parent, non-existent parent, malformed id |
| POST | `/api/V1/Branch` | no-auth+no-header, header-but-no-token, valid (with/without geofence fields), empty body, missing nameEn, out-of-range latitude, non-existent parentBranchId, 3-level-nesting attempt |
| PUT | `/api/V1/Branch/{id}` | partial update without geofence fields, full update, update non-existent id, no-auth (isolated, real id), **full-replace-wipes-other-fields check** |
| DELETE | `/api/V1/Branch/{id}` | non-existent GUID, no-auth (isolated, real id), delete-while-has-children (orphan guard) |

## 🔴 CRITICAL — the entire write surface has no authentication (backend, cannot be fixed from this repo)

`POST`, `PUT`, and `DELETE` on `/api/V1/Branch` all succeed with **no bearer token**. An initial pass mislabeled some of this evidence (see "Opus audit" below) — the claim is now backed by clean, isolated, persisted tests using real GUIDs with a follow-up `GET` proving the mutation actually took effect, not just that the endpoint returned 200:

- `POST /api/V1/Branch` with no `Authorization` and no `X-Branch-Id` → **200**, branch created (confirmed present via list lookup).
- `PUT /api/V1/Branch/{id}` with **zero headers beyond `Content-Type`** (no bearer, no `X-Branch-Id` at all) → **200**, and a follow-up `GET` confirms the rename actually persisted.
- `DELETE /api/V1/Branch/{id}` with a valid `X-Branch-Id` but no `Authorization` → **200**, and a follow-up `GET` confirms 404 — genuinely deleted.

This is worse than the Auth module's `add-admin` finding: that one at least required a (separately unauthenticated, but present) `X-Branch-Id` header. Branch's write endpoints don't even require that. Combined with `GET /api/V1/Branch` also being anonymous (branch GUIDs are freely enumerable), **anyone with network access to the API can create, rename, relocate (via lat/long), or delete any branch in the system with no credentials whatsoever.**

Business impact is severe because Branch is the root of the whole app's authorization model: every other write endpoint across every other module is scoped by `X-Branch-Id`. An anonymous actor can mint a fresh branch GUID via the open `POST`, then immediately use it as a valid `X-Branch-Id` on other modules' write endpoints (which, per the Auth-module and prior-session findings, mostly only validate that the header is a *syntactically valid* GUID, not that the caller is authorized).

**This is a backend authorization defect — no backend source exists in this repo, so it cannot be fixed here.** Needs urgent backend-team action, same as the Auth module's `add-admin` finding — together they suggest a possible **systemic pattern** (auth middleware not applied consistently across controllers) worth the backend team checking broadly, not endpoint-by-endpoint.

**`/branch/management`'s page-level access is a UX/least-privilege default, not a security control, and I'm not presenting it as one.** Like every page in this app, it defaults to open-to-any-authenticated-role unless an admin manually restricts it. Given the backend enforces zero authorization on these endpoints, restricting the *frontend page* would have **no actual security value** — a determined actor bypasses the UI entirely and hits the API directly, which is exactly what the finding above demonstrates. Whether to restrict the page anyway (as a courtesy guardrail against a legitimate-but-under-privileged employee's UI clicks, not as a defense against attackers) is a product call, not a security fix, and Branch Management plausibly has legitimate non-admin users (branch managers, ops staff) unlike Add-Admin — so left as-is, flagged for your judgment.

## 🔴 Frontend bug — editing a branch from the main table silently corrupts its data (fixed)

Caught by an Opus audit round, not the original test pass. Two compounding bugs in `src/app/branch/management/page.tsx`:

1. **The edit form was populated from shallow list-row data.** `GET /api/V1/Branch` (the list, feeding the main table) returns a slim summary — confirmed live it omits `latitude`/`longitude`/`allowedRadiusMeters` and about a dozen other fields (`poBox`, `postalCode`, `domain`, `appUrl`, `managerNameAr`, `organizationTypeAr`, `cityAr`, `taxNumber`, `zaka_*`, `laborLicense*`, etc. — only the by-id detail endpoint returns them). `handleEditBranch()` populated the form directly from whatever row object was clicked, so editing via the main table's row action or a sub-branch row action left `latitude`/`longitude`/`allowedRadiusMeters` `undefined` even though they're `required` on save. Only the one edit entry point that went through the detail drawer (`viewBranchData`, itself a real by-id fetch) happened to be safe.
2. **`PUT /api/V1/Branch/{id}` is a full replace, not a partial merge — confirmed live.** Any `BranchDto` field omitted from the body gets wiped to `null` server-side. Verified directly: created a branch with `poBox`, `domain`, `managerNameAr`, `organizationTypeAr` set, then `PUT` with only the fields the real edit form's own inputs cover — all four came back `null` afterward. Since the edit form has no input for ~15 of `BranchDto`'s ~35 fields at all, **every single save through this page was silently destroying those fields on every branch it touched**, independent of bug #1.

Combined, this meant editing almost anything about an existing branch — even just a phone number — risked either blanking its live attendance-geofence location (bug #1, directly threatening `31887c15…`'s already-configured geofence from a prior session) or silently erasing its address/license/tax/ZATCA fields (bug #2), with no error and no warning.

**Fixed:**
- `handleEditBranch()` now always re-fetches the branch by id (`BranchService.getById()`) before populating the form, regardless of entry point, so the form always starts from complete, current data. Added a loading state on the edit buttons/menu item so this is visible rather than silent.
- `handleModalSubmit()` now builds the `PUT` payload by merging the form's edited values **on top of** the full record already fetched into `editingBranch` (via a new `branchToDto()` helper that strips the response-only fields `id`/`subBranches`/`parentBranchName*`/`created*`), instead of sending only the form's fields. Fields the form doesn't manage now survive an edit instead of being wiped.
- **Retested live end-to-end**: created a branch with `poBox`/`domain`/`managerNameAr`/`organizationTypeAr` set, simulated the exact fixed code path (fetch full record → merge with a form-values-shaped edit → `PUT`), and confirmed via follow-up `GET` that the touched field (`nameEn`) updated while all four untouched fields survived intact. See `branch-test3-isolated-results.json`-adjacent ad-hoc script output referenced above (the merge-verification run).

## Other findings

| Finding | Severity | Status |
|---|---|---|
| Entire write surface (POST/PUT/DELETE) unauthenticated | 🔴 Critical | **Backend fix required — cannot fix from this repo** |
| Edit form uses shallow list data + PUT full-replace wipes untouched fields | 🔴 High-severity data loss | ✅ **Fixed** (see above) |
| Root branch `31887c15…`'s `nameAr` AND `nameEn` are both literal repeated `?` (ASCII 0x3F) bytes — confirmed by decoding the raw response bytes as UTF-8 (not a display artifact; response `Content-Type` correctly declares `charset=utf-8`, and valid UTF-8 Arabic cannot decode to literal `?` characters, so the stored bytes themselves are corrupted — a classic symptom of a `varchar` write path used for `nvarchar` data at some point) | 🔴 Data integrity | **Not fixed.** This branch has `mainBranch: 1` (there are two such branches in the live data — `31887c15…` and `ae56eb05…` — so "the root branch" was imprecise phrasing on my part; corrected here). The corruption is **per-record, not systemic**: its own sub-branch (`ابحر`) stores Arabic correctly, and every other branch in the system displays fine. `createdBy` on the corrupted record (`d7b8ffad…`) differs from the account used this session. I grepped this repo for the branch's GUID and found no historical name reference to recover from. No original text is recoverable — someone who knows the intended name needs to re-enter it via the (now-fixed) edit form. I will not guess-write a name into live data. |
| `DELETE` on a branch that still has a sub-branch returns a bare `500` (empty body) instead of a clean validation error | 🟠 High | **Backend bug, cannot fix here.** Frontend degrades gracefully (generic error toast via the existing fallback in `useBranches.ts`'s `onError`) — no crash, just an unhelpful message. |
| `BranchService.create()`/`update()` typed to return `Promise<Branch>`, but the backend returns a bare success-message string for both (same pattern as Auth's `add-admin`) | 🟡 Low | ✅ **Fixed** — retyped to `Promise<string>`. Confirmed harmless in practice: both call sites (`useBranches.ts`) only use `mutate()` fire-and-forget, neither reads the resolved value. |
| `BranchDto`'s `latitude`/`longitude`/`allowedRadiusMeters` were typed as optional/nullable, contradicting both the live backend contract (400s if omitted) and this file's own comment ("required for attendance validation") | 🟡 Low | ✅ **Fixed** — retyped to required non-nullable numbers on `BranchDto` (the write contract). Only one file in the codebase constructs a `BranchDto` (`branch/management/page.tsx`, already sends them), so this is purely a compile-time safety net for future callers, not a behavior change. |
| A 44-day-old memory claimed `PUT` allows true partial updates (name-only, no geofence fields). Live retest shows `PUT` requires the same fields as `POST` and is in fact a **full replace** of every field, not just geofence ones (see the finding above) — that memory is now stale and understated the issue. | 🟢 Info | No code issue beyond the fix above; noting for memory hygiene. |

## What's working correctly (verified, not just assumed)

- Filters (`SearchName`, `NameAr` with a raw Arabic query string), pagination, and empty-result search all behave correctly.
- `GET /{id}`: proper 404 for a well-formed-but-non-existent GUID, proper 400 for a malformed (non-GUID) id.
- `GET /{id}/sub-branches`: correctly returns an empty array (not an error) for a non-existent parent.
- **2-level nesting limit is correctly enforced server-side on create** with a clear message ("لا يمكن إضافة فرع تابع لفرع فرعي. النظام يدعم مستويين فقط") — this is consistent with `BranchGate.tsx`'s `flattenBranches()` helper (which only recurses one level deep) and suggests it isn't a frontend bug. **Caveat, per Opus review: this is only proven for the create path.** Re-parenting an existing branch to a 3rd level via `PUT` (e.g., taking a top-level branch and setting its `parentBranchId` to a sub-branch's id) was never tested, so it isn't confirmed the cap holds there too. Worst case if it doesn't is a missing option in the branch selector, not data corruption — left untested rather than treated as fully proven.
- Non-existent `parentBranchId` on create correctly 404s with a clear message; out-of-range latitude correctly 400s with a clear message.
- `DELETE` of a non-existent GUID correctly 404s (not the "silent 200 for missing row" bug class seen elsewhere in this backend in earlier audits).
- Geofence fields only appear on the by-id detail response, never the list response — matches a prior session's documented finding.
- Duplicate branch names are permitted (live data already has two branches both named "Jeddah Branch") — not tested by me directly, observed in existing data; not treated as a bug since nothing here implies names need to be unique.

## Known coverage gaps (not tested this pass)

- `mainBranch` semantics beyond the UI's simple `=== 1` display check: newly-created branches come back with `mainBranch: null` (not `0` or `1`), a third value the "is this a main branch" comparisons don't explicitly account for (though functionally anything not `=== 1` still displays as "sub", so no visible bug found — just not exhaustively tested).
- `organizationTypeAr`/`cityAr` enum validation (do invalid integer values get rejected?).
- Re-parenting an existing branch via `PUT` (changing `parentBranchId` on a branch that already has children).

## Opus audit — findings and fixes

An independent Opus review came back **"pass with notes"** and caught the two 🔴 items above (the edit-form data-loss bug, and under-evidenced PUT/DELETE no-auth claims in the original results files) that the first test pass missed or under-supported:

1. Missed the edit-form/full-replace data-loss bug entirely — traced it by reading `page.tsx` directly rather than trusting my "geofence fields only" framing of the original bug.
2. Correctly identified that `branch-test-results.json` and `branch-test2-results.json`'s PUT/DELETE no-auth results were artifacts of a `createdId`-extraction script bug (targeting a malformed/undefined id), not genuine auth-bypass evidence, even though my own ad-hoc terminal retests (not persisted at the time) had already shown the real behavior. **Fixed**: wrote `branch-test3-isolated.mjs`, a clean, self-contained repro with real GUIDs and follow-up `GET` verification, persisted to `branch-test3-isolated-results.json`.
3. Flagged a dropped finding (the `BranchDto` optional-type contract mismatch, logged by the harness but never fixed) — now fixed.
4. Corrected imprecise framing: the `/branch/management` non-fix was originally presented as a security trade-off; reframed above to state plainly that a frontend page restriction has no security value given the backend enforces none, so it's a UX default question, not a mitigation.
5. Corrected the "root/main branch" claim (there are two branches with `mainBranch: 1`) and tightened the encoding-corruption methodology description (UTF-8 decode of the response body, not literal raw-byte inspection — the conclusion was already right, the description of how I got there wasn't precise).

**Round 2** caught one real regression in the round-1 fixes: my claim that `tsc --noEmit` was clean was **false** — making `BranchDto.latitude/longitude/allowedRadiusMeters` required (non-nullable) broke `branchToDto()`'s return type, since it's fed a `Branch` where those fields are still nullable (existing branches predating geofencing can genuinely have them unset). First attempted fix (`Partial<BranchDto>`) was itself still wrong — `Partial<T>` only adds `| undefined` to each field, not `| null`, so it didn't actually fit `Branch`'s `number | null` geofence fields either, and `tsc` caught that too on re-verification. **Correctly fixed on the second attempt**: `branchToDto()` now returns a dedicated `BranchDtoOverlap` type (`Omit<Branch, 'id' | 'subBranches' | 'parentBranchNameAr' | 'parentBranchNameEn' | 'createdAt' | 'createdDate' | 'createdBy'>`) — i.e. "a `Branch` minus its response-only fields," which is what the function actually produces, rather than forcing it into a `BranchDto`-shaped type it doesn't structurally match. It's still only ever used as a spread base with the form's `values` layered on top in `handleModalSubmit` (which always supplies real geofence numbers, since they're required form fields), so the final merged payload is a valid `BranchDto` at runtime. Re-ran `tsc --noEmit` **synchronously with an explicit success marker** this time (not backgrounded) to remove any ambiguity about whether it actually completed before being reported as clean — confirmed genuinely zero errors project-wide. Everything else from round 1 — the edit-form fix's correctness, the persisted no-auth evidence, cleanup — was independently re-verified by Opus and confirmed sound.

## Cleanup

All test/junk branches created across all three passes (10 total, including several created by the no-auth vulnerability tests themselves) were deleted and verified gone via follow-up `GET`/list calls. Branch's `DELETE` endpoint works normally, so cleanup was fully successful — no residue left in your system, unlike the Auth module's two undeletable disposable admin accounts.

## Regression

`tsc --noEmit` clean across the whole project after all changes (`branch.service.ts`, `api.types.ts`, `branch/management/page.tsx`). The merge-fix for the full-replace bug was retested live end-to-end against the real backend (not just type-checked) — see the finding above.
