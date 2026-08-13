# Module #17 — Operating Contract Offers — Test Report

**Priority:** 🟠 High | **Endpoints:** 5 | **Deps:** Branch, Job, Customer
**Date:** 2026-08-13

## Scope
`OPERATING_CONTRACT_OFFER`: GetAll, GetById, Create, Update, Delete — 5 endpoints, matches priority table.

## Summary

| Result | Count |
|---|---|
| Passed | 3/5 (GetAll, GetById, Create) |
| CRITICAL backend bug | 1 (Update crashes 500 always) |
| Auth-bypass backend finding | 1 (Delete unauthenticated) |
| Secondary backend findings | 4 |
| Frontend bugs fixed | 2 |

## CRITICAL — Update (`PUT /{id}`) crashes 500 on every parseable request

Confirmed across 6 isolated attempts (1 saved, 5 ad-hoc — independently reproduced a 6th time by the audit pass): `{}`, single field (`cost` only), full valid payload matching a successful Create, and a no-op update re-sending a pre-existing record's own current values — **all return `500`, empty body, no error message.** (A request with *no body at all* correctly `400`s first — "non-empty request body required" — so the crash is specifically in the handler once it has a body to work with, not in request parsing.) Non-atomic: target record's fields are unchanged after every crash (verified via follow-up GET each time).

**Root cause:** backend bug in the PUT handler itself — not a payload/validation issue, since even `{}` and a same-value no-op both crash identically.

**Impact:** breaks the app's real Edit-Offer flow (`handleUpdate` in [rent-prices-offers/page.tsx](src/app/contracts/operation/rent-prices-offers/page.tsx:312-339)) completely — every edit attempt from the actual UI fails. Not frontend-fixable.

## Auth findings

- **Create & Update: properly authenticated** (`401` with no token) — first genuinely-secured write pair found this session.
- **Delete: unauthenticated** (`200` with no token; follow-up GET confirmed real deletion) — inconsistent with Create/Update on the same controller.
- GetAll / GetById: open reads, no auth (consistent with the rest of the app).

## Secondary findings (backend, not frontend-fixable)

1. No server-side required-field validation on Create — an empty body creates a real all-`null` offer (`200`). Swagger itself declares every field optional (no `required` array on the DTO), so this may be intentional rather than a gap.
2. Invalid/nonexistent `nationalityId` GUID on Create → uncaught `500` (empty body) instead of a clean `400`.
3. Negative `cost` accepted with no validation (`200`).
4. GetAll's server-side filters (`NationalityId`, `CostMin`/`Max`) were only tested against non-matching/out-of-range values (both correctly returned empty) — no positive-match filter test was run, so filter discrimination itself isn't independently confirmed, only the empty-result path.

## Frontend fixes

- [`useEmploymentContractOffers.ts`](src/hooks/api/useEmploymentContractOffers.ts) — 3 `onError` handlers used `error.response?.data?.message` (drops real backend validation detail, same bug class fixed in `useAgents.ts`/`useAccounts.ts` earlier this session) → switched to `getApiErrorMessage()`.
- [`add-offer/page.tsx`](src/app/contracts/operation/rent-prices-offers/add-offer/page.tsx) — removed a leftover debug `console.log`/`console.error` block and the same wrong error-extraction pattern → `getApiErrorMessage()`.

`npx tsc --noEmit` — clean.

No other bugs found: `handleUpdate`/`handleSubmit` across the list page and all 3 add-offer variants already correctly wrap `mutateAsync` calls in `try/catch`/`finally`; `deleteOffer` uses safe fire-and-forget `.mutate()`.

## Audit correction

An Opus audit found the first fix pass left 2 more debug `console.log` lines in `add-offer/page.tsx` (lines 173-174, logging raw form values) — missed because the original edit only targeted the payload-log/console.error block a few lines below. Removed. Independently re-verified live: the CRITICAL Update crash, the Delete auth-bypass, and the cleanup/baseline claim all reproduced exactly as reported. Verdict: PASS-WITH-NOTES.

## Cleanup

All test-created offers (5 from this pass + 2 more created during the audit's independent live re-verification) deleted. Final live count re-confirmed back at baseline (2 real offers, `offerNumber` 4 and 1, unchanged). Zero residue.

## Regression

2 files changed (hook + one add-page). `tsc` clean. No other module touched.
