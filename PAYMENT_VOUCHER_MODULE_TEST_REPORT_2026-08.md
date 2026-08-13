# Module #19 — Accounting: Payment Voucher — Test Report

**Priority:** 🟠 High | **Endpoints:** 4 | **Deps:** Branch, Agent, Customer
**Date:** 2026-08-13

## Scope
`PAYMENT_VOUCHER`: GetAll, GetById, Trace, Create — 4 endpoints, matches priority table.

## Priority-table flag re-verified: previously-known Create 500 no longer reproduces

The priority table ranked this module first among legacy vouchers specifically because of a "confirmed backend defect — 500 even with a valid payload." Re-tested with 3 distinct valid payload shapes (minimal required-only, full with agent payee, full with source-contract fields) — **all succeeded** (envelope `statusCode: 201`, HTTP `200`), each with a real `journalEntryId` and `accountingDocumentId` populated (ledger posting works). Independently re-confirmed once more during audit. This defect appears **resolved** since the priority table was written; no longer a live issue.

## Summary

| Result | Count |
|---|---|
| Passed | 4/4 |
| Auth-bypass backend finding | 1 (Create unauthenticated) |
| Secondary backend findings | 2 (invalid FK → 500; GetAll pagination ignored) |
| Frontend bugs fixed | 1 |

## Findings

- **Create unauthenticated**: `200`/envelope `201` with no token (branch header only) — real voucher persisted, confirmed via response body + journal linkage. Consistent with this session's dominant pattern; GetAll/GetById/Trace are open reads app-wide anyway.
- **Validation is clean where it matters**: missing `amount` → `400 "'Amount' must be greater than '0'."`; missing `voucherDate` → `400 "'Voucher Date' must not be empty."` — proper server-side validation, not a silent default or crash.
- **Secondary gap**: an invalid/nonexistent `customerId` GUID crashes with an uncaught `500` (empty body) instead of a clean `400`. Confirmed live (not in the saved test script — an ad-hoc follow-up check). **Not reachable via the UI for `customerId`/`payeeId`** (populated `Select`s sourced from real records) — `sourceContractId` is a free-text field that COULD carry a fabricated GUID, but a fabricated `sourceContractId` was tested and did not crash (only `customerId` does), so the practical UI-reachability conclusion still holds.
- **Secondary gap**: `GetAll`'s `pageSize`/`pageNumber` query params are ignored server-side — `?pageSize=1&pageNumber=1` returned all records, not 1. Only 3-8 real/test records exist so far, so this hasn't caused a visible problem yet, but would silently break pagination once the table grows. Not frontend-fixable (the frontend sends the params correctly).
- `GetById`/`Trace` on a nonexistent id → clean `404`; malformed id → `404` (route-binding miss, not `400` — a minor cross-module inconsistency, harmless).
- `customerId` filter on GetAll was only exercised with a non-matching value (returned `[]`); a positive-match case wasn't independently confirmed.

## Frontend fix

[`payment-vouchers/page.tsx`](src/app/accounting/payment-vouchers/page.tsx) — `handleCreate` called `form.validateFields()` + `await createVoucher(dto)` with no `try/catch`, bound to a raw `onClick`. A validation rejection would surface as an unhandled promise rejection. Wrapped in `try/catch`.

`npx tsc --noEmit` — clean.

No other bugs: `[id]/page.tsx` and `PaymentVoucherDetailView.tsx` are read-only, no mutations.

## Audit note

Opus audit: PASS-WITH-NOTES. Independently re-ran a fresh Create (succeeded, real journal entry) and the invalid-FK crash (reproduced). Caught the pagination-ignored finding sitting unremarked in the saved evidence, and flagged the invalid-FK test as not having a saved script — both corrected above.

## Cleanup / Residue

5 test vouchers created total (4 during initial testing + 1 during the audit's independent re-verification) — **no DELETE endpoint exists for this module**, so all are permanent residue (each with its own auto-generated journal entry). Disclosed, not hidden.

## Regression

1 file changed. `tsc` clean. No other module touched.
