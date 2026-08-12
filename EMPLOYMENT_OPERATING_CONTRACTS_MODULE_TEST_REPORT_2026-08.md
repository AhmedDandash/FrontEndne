# Employment Operating Contracts Module — Phase 3 Test Report

**Priority #7 — 🔴 Critical.** Tested 2026-08-12 against the live backend `https://sigma-api.runasp.net`. Raw logs: `employment-contract-test.mjs`/`-partial.json` (list/get/create), `employment-contract-test2-statemachine.mjs`/`-results.json` (first lifecycle pass — contains real test-script bugs, superseded below, kept for the record), `employment-contract-test3-corrections.mjs`/`-results.json` (corrected re-verification with fixed field access and body encoding, plus isolated critical-finding checks), and `employment-contract-test4-audit-followup.mjs`/`-results.json` (round-2 follow-up after an Opus audit pass — see "Audit corrections" below).

> **Audit corrections (round 2, post Opus review):** the Opus audit of the round-1 report caught three real gaps: (1) two more consumers of the same `.mutate()` hooks, outside `contracts/operation/rent/page.tsx`, had the identical premature-close bug and were never checked; (2) the `customer-refund` CRITICAL finding was asserted from a bare `200` with no follow-up verification of what actually got persisted; (3) `print-delivery-form`/`delivery-form` were mischaracterized as "read-only." All three were re-investigated live and are corrected in place below — see the callouts marked **[round 2]**.

## Headline: this module's backend auth is mostly correct — the first in seven modules to break the pattern

Unlike every module tested so far, **most write endpoints here genuinely enforce authentication**: `create`, `update`, `sign`, `start-execution`, `renew`, `terminate`, `customer-refund`, and `delivery-form` (POST) all return a clean `401 Unauthorized` (standard ASP.NET problem-details format) with no bearer token — verified directly, not inferred. This is worth stating plainly to whoever owns the backend: **the fix for the other six modules' auth gap already exists in this same codebase** — whatever attribute/middleware configuration this controller's actions use correctly is the template to apply everywhere else, not a new capability that needs building.

**One exception in the same controller**: `DELETE /api/EmploymentOperatingContract/{id}` has no auth enforcement at all — confirmed live, isolated, on a fresh contract: a request with no bearer token returned 200 and the contract was genuinely gone on a follow-up `GET` (404). Every sibling action in this controller correctly requires a token; this one specific action doesn't. Given how consistent everything else in this controller is, this reads as a single missing attribute on one action rather than a deeper problem — a precise, cheap fix for the backend team.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/EmploymentOperatingContract` | anonymous, authed, filters |
| GET | `/EmploymentOperatingContract/{id}` | valid, no-auth, non-existent, malformed |
| POST | `/EmploymentOperatingContract` (create) | no-auth+no-header, no-auth-with-header (401), missing fields (500), valid create |
| PUT | `/EmploymentOperatingContract/{id}` (update) | no-auth (401), valid partial body (500) |
| DELETE | `/EmploymentOperatingContract/{id}` | no-auth (200 — the one gap), verified via follow-up GET |
| POST | `/sign`, `/start-execution`, `/renew`, `/terminate`, `/customer-refund` | no-auth (401 each) + valid, each verified via follow-up GET on real state |
| GET | `/print-receipt-form`, `/print-delivery-form` | authed, no-auth |
| POST | `/delivery-form` | no-auth (401), valid |

## 🔴 CRITICAL — `customer-refund` accepts unlimited, repeated refunds with no ledger trace (backend, cannot be fixed from this repo)

The one endpoint in this module where authentication being correctly enforced isn't enough on its own. **[round 2, re-verified with stronger evidence]** The round-1 write-up rested on a single `200` with no follow-up check of what actually got persisted — the round-2 Opus audit correctly called this out as under-evidenced. Re-tested live (`employment-contract-test4-audit-followup.mjs`) on a fresh contract taken through the full lifecycle:

1. Terminated with `refundAmount: 500` (the amount the business owes the customer per the termination record).
2. Called `customer-refund` with `amount: 500` (matching the ceiling) — accepted (200).
3. Called `customer-refund` **a second time on the same contract** with `amount: 999999` — **also accepted (200)**, with no memory of the refund already paid in step 2. This rules out a simple "one refund per contract" or running-total guard — the endpoint has no state tracking of prior refunds at all.
4. Searched `GET /api/Accounting/PaymentVoucher` (the module that would carry a real cash-out ledger entry) for any trace of either refund by contract ID or description — **zero matches**. Neither the valid 500 refund nor the 999999 over-refund produced any discoverable ledger row.

So the finding is both worse and more precisely evidenced than round 1 claimed: it isn't just "no ceiling check" — there is no running total, no duplicate-prevention, and (as far as this API surface can show) no queryable financial record of the refund actually happening at all beyond the 200 response and the success toast. An authenticated user can call this endpoint any number of times for any amount with no system-level guardrail and no visible audit trail. Needs urgent backend attention: `customer-refund` should validate `amount` against the outstanding balance from `terminate`, track cumulative refunds per contract, and write to whatever ledger table `PaymentVoucher` reads from (or expose wherever it does write, if it writes somewhere not visible via this endpoint).

## 🟠 HIGH — `DELETE` is unauthenticated while every sibling action in the same controller correctly requires a token

See headline above — repeated here as its own line-item because of its severity, distinct from the "customer-refund validation" finding. Confirmed live, isolated (fresh contract, no-auth `DELETE` → 200 → follow-up `GET` → 404).

## 🟡 MEDIUM — a partial `PUT` update crashes with a bare 500 instead of a clean response (backend, cannot be fixed from this repo)

Confirmed reproducibly: `PUT /{id}` with a body containing only one field (`{ workerPhone: "..." }`) crashes with an empty-body `500`, not a graceful partial update or a clean validation error. **Likely not exploitable through the normal UI**: the real edit form (`contracts/operation/rent/page.tsx`) always submits a large, mostly-complete payload matching nearly every field on the DTO, not a bare single-field body — so this specific crash shape wasn't reproduced through the app itself, only via a direct API call. Still a real backend robustness gap worth fixing, since anything else calling this endpoint with a genuinely partial body (a future feature, a script, direct API use) will crash rather than fail cleanly.

## 🟡 MEDIUM — seven modal handlers across three files closed and reset their form before knowing whether the save succeeded (frontend, fixed)

A real, previously-undiscovered bug. Unlike Mediation Contracts (which uses `mutateAsync` everywhere, all properly `try/catch`-wrapped), this module's `useEmploymentOperatingContracts` hook exposes 8 of its 11 mutations as bare `.mutate()` — including create, update, sign, start-execution, renew, terminate, and customer-refund. Five consumers of that hook in `contracts/operation/rent/page.tsx` (`handleCreateSubmit`, `handleEditSubmit`, `handleRenewSubmit`, `handleTerminateSubmit`, `handleRefundSubmit`) closed their modal and reset their form **unconditionally, immediately after firing the mutation** — not gated on success in any way. Since `.mutate()` is fire-and-forget, this meant: on any failure (a validation error, the partial-PUT crash above, a business-rule rejection), the modal had already closed and the form had already reset before the request even resolved. The mutation's own `onError` still shows a toast, but the user has already moved on, with no visual link between the toast and the form they just filled in.

**[round 2]** The round-1 pass only checked call sites inside `contracts/operation/rent/page.tsx` and missed that the same two hooks are consumed elsewhere with the identical bug — caught by the Opus audit:
- `src/app/customers/page.tsx` — a "create contract from customer record" modal called `createContract(contractData)` then unconditionally closed/reset, same pattern.
- `src/app/contracts/operation/collection-renewal/page.tsx` — `handleRenewSubmit` called `renewContract({...})` then unconditionally cleared `renewTarget`/`selectedContract`, same pattern.

**Fixed**: all seven handlers (five in `rent/page.tsx`, one in `customers/page.tsx`, one in `collection-renewal/page.tsx`) now pass `{ onSuccess: () => { ...close/reset... } }` as the second argument to `.mutate()`, so the modal only closes and the form only resets once the request has actually succeeded. `sign`/`start-execution`/`delete` (simple one-click row actions with no modal to prematurely close) were not affected by this specific bug and were left as-is. Repo-wide search confirmed no further consumers of `useEmploymentOperatingContracts` exist outside these three files.

## What's working correctly (verified, not just assumed)

- List, filters, `GET /{id}` (proper 404/400 for non-existent/malformed ids) all behave correctly.
- The full lifecycle was exercised end-to-end and every transition's own stated effect was verified via a follow-up `GET`, corrected for a test-script field-access bug (this module's `GET /{id}` returns a flat object, not wrapped in the standard `{success,data,...}` envelope — confirmed the shared `unwrap()` frontend utility already handles this correctly regardless): create (`Draft`) → sign (`Signed`) → start-execution (`Executing`, and the documented side effect of setting the worker's own status to `AtCustomer` was independently confirmed via the worker's own record) → renew (`contractEndDate` genuinely extended to the requested date) → terminate (`Finished`, `isFinish: true`, `finishDate` set, and the worker's status correctly auto-set to `InAccommodation`).
- `customer-refund` correctly requires authentication — see the CRITICAL finding above for what it doesn't check.
- `GET print-receipt-form`/`GET print-delivery-form` are anonymous — consistent with the broader pattern of GETs generally not requiring auth across this whole backend, not specific to this module.
- **[round 2, correction]** Round 1 called these endpoints "read-only," which is wrong — `POST .../delivery-form` genuinely writes and persists (re-verified: saved `employeeName: "QA Named Employee"`, `notes: "persistence check"` via POST, then confirmed a subsequent `GET print-delivery-form` returns those exact values back, not a stale echo). One real but minor quirk found in the process: **before any delivery form has ever been explicitly saved, `GET print-delivery-form` auto-populates `employeeName` with the current user's raw GUID** (e.g. `2dbb733b-6b62-4d4e-8522-845886c8f897`) instead of `null` or a display name — a cosmetic backend default worth fixing but not a functional bug, since any real save immediately overwrites it with the actual name typed into the form.

## Cleanup

All test contracts created during this session (4 total, across passes 1/3/4 — pass 2 reused pass 1's contract rather than creating a new one) were confirmed cleaned up. **[round 2 correction]** The round-1 report claimed "0 residue" but the Opus audit prompted a re-check that found pass 3's first contract (`36a2bb5a-...`, the one taken through the full sign→start-execution→renew→terminate→refund lifecycle) had never actually been deleted by that script — a genuine gap between the report's claim and reality. Deleted it directly and confirmed via follow-up `GET` → `404`. Final residue sweep (fresh `GET` list, all 17 remaining contracts, filtered for the `QA`/`فحص` test markers used throughout this module's testing): **0 matches**. Worker pool back to the pre-session baseline of 14.

## Regression

`tsc --noEmit` clean after all fixes (`contracts/operation/rent/page.tsx`, `customers/page.tsx`, `contracts/operation/collection-renewal/page.tsx` — three files changed total, the latter two added in round 2). The handler fixes follow the exact pattern already established and verified in the Customer module's equivalent bug — gate UI state transitions on the mutation's `onSuccess`, not on the call returning. Not separately browser-verified this session (the dev server/browser pane were unavailable, consistent with earlier modules), but the change is type-checked and structurally identical to an already-verified fix elsewhere in this codebase.

## Round-2 audit summary

The Opus audit (round 1) returned **pass-with-notes**: the module's headline claim — that auth is genuinely enforced on nearly every write endpoint here, breaking the six-module pattern — held up under direct scrutiny of the raw evidence (ruled out both "malformed body rejected before auth" and "global middleware" alternative explanations). The DELETE-unauthenticated exception was independently re-confirmed. Three real gaps were found and are now corrected above: the two missed `.mutate()` consumers (fixed), the under-verified refund finding (re-tested with stronger evidence, finding confirmed and sharpened), and the delivery-form mischaracterization (corrected — it's a working, persisting write endpoint with one minor cosmetic default-value quirk, not read-only). No further audit round requested by the user at this checkpoint; corrections applied directly per standard practice for the gaps found.
