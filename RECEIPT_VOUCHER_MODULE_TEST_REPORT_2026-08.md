# Module #20 — Accounting: Receipt Voucher — Test Report

**Priority:** 🟠 High | **Endpoints:** 4 | **Deps:** Branch, Agent, Customer
**Date:** 2026-08-13

## Scope
`RECEIPT_VOUCHER`: GetAll, GetById, Trace, Create — 4 endpoints, matches priority table. Mirror of Module #19 (Payment Voucher), same controller shape, but `employmentOperatingContractId` is a **required** FK here (Payment Voucher's fields are all optional).

## Summary

| Result | Count |
|---|---|
| Passed | 4/4 |
| Auth-bypass backend finding | 1 (Create unauthenticated) |
| Secondary backend findings | 2 (invalid FK → 500, not reachable via UI; GetAll pagination ignored) |
| Frontend bugs fixed | 1 |

## Findings

- **Create unauthenticated**: `200` with no token (branch header only) — real voucher persisted with journal linkage. Same pattern as every voucher/offer module this session.
- **Validation is clean for the common cases**: missing `employmentOperatingContractId` → `400 "'Employment Operating Contract Id' must not be empty."`; missing `amount` → `400 "'Amount' must be greater than '0'."`.
- **Secondary gap**: a well-formed but nonexistent `employmentOperatingContractId` (not `Guid.Empty` — a realistic-looking fake GUID) crashes with an uncaught `500` (empty body). **Not reachable via the UI** — the create form's contract field is a `Select` populated from real contracts, never free text.
- **Secondary gap (repeat of Module #19's finding, confirmed again here)**: `GetAll`'s `pageSize`/`pageNumber` are ignored server-side — `?pageSize=1` still returned all 24 records. Not frontend-fixable.
- `DELETE`/`PUT` confirmed unsupported (`405`) — matches the pre-existing code comment in `ReceiptVoucherModal.tsx`. No edit/delete path exists for this document type.
- `GetById`/`Trace` on nonexistent id → clean `404`; malformed id → `404` (route-binding miss, consistent with Module #19).

## Frontend fix

[`receipt-vouchers/page.tsx`](src/app/accounting/receipt-vouchers/page.tsx) — `handleCreate` called `form.validateFields()` + `await createVoucher(dto)` with no `try/catch`, bound to a raw `onClick` — same bug already found and fixed in Payment Voucher's twin page. Wrapped in `try/catch`.

`npx tsc --noEmit` — clean.

No other bugs: [`ReceiptVoucherModal.tsx`](src/app/contracts/operation/rent/_components/ReceiptVoucherModal.tsx) (the second Create consumer, used from the rent-contract detail flow) already correctly uses `try/catch` + the safe fire-and-forget `.mutate()` pattern. [`ContractReceiptsModal.tsx`](src/app/contracts/operation/rent/_components/ContractReceiptsModal.tsx) and `[id]/page.tsx`/`ReceiptVoucherDetailView.tsx` are read-only, no mutations.

## Cleanup / Residue

3 test vouchers created (2 authed + 1 no-auth) — **no DELETE endpoint exists** (confirmed `405` live), so all 3 are permanent residue, each with an auto-generated journal entry. Disclosed, not hidden.

## Regression

1 file changed. `tsc` clean. No other module touched.
