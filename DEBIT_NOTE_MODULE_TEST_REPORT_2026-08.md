# Module #22 — Accounting: Debit Note — Test Report

**Priority:** 🟠 High | **Endpoints:** 4 | **Deps:** Branch, Agent, Customer
**Date:** 2026-08-13

## Scope
`DEBIT_NOTE`: GetAll, GetById, Trace, Create — 4 endpoints, matches priority table. Mirror of Module #21 (Credit Note), keyed on `agentId` instead of `customerId`. All findings below were predicted from #19-21's pattern and confirmed directly in a single test pass — full parity across all four accounting-document controllers.

## Summary

| Result | Count |
|---|---|
| Passed | 4/4 |
| Auth-bypass backend finding | 1 (Create unauthenticated) |
| Secondary backend findings | 2 (invalid FK → 500, not reachable via UI; GetAll pagination ignored) |
| Frontend bugs fixed | 1 |

## Findings

- **Create unauthenticated**: `200` with no token (once `debitNoteNumber` is present) — real note persisted with journal linkage.
- **`debitNoteNumber` is actually required server-side** despite swagger marking it `nullable` — `400 "'Debit Note Number' must not be empty."` — same swagger/backend mismatch as Credit Note. The create form already has `rules={[{ required: true }]}` on it, zero real-world impact.
- **`agentId` required, clean validation**: missing → `400 "'Agent Id' must not be empty."`.
- **Secondary gap (4th confirmation of the #19-21 pattern)**: a well-formed but nonexistent `agentId` crashes with an uncaught `500` (empty body). **Not reachable via the UI** — `agentId` is a `Select` populated from real agents.
- **Secondary gap (4th confirmation)**: `GetAll` pagination ignored — confirmed with 3 real records present, `?pageSize=1` returned all 3.
- `DELETE` confirmed `405` — 4th module in a row with no edit/delete path.
- `GetById`/`Trace` on nonexistent id → clean `404`; malformed id → `404` (route-binding miss).

## Frontend fix

[`debit-notes/page.tsx`](src/app/accounting/debit-notes/page.tsx) — `handleCreate` had no `try/catch`, identical to the same bug in Payment/Receipt Voucher and Credit Note (all four accounting-document pages share the same template). Wrapped in `try/catch`.

`npx tsc --noEmit` — clean.

No other bugs: `[id]/page.tsx` and `DebitNoteDetailView.tsx` are read-only, no mutations.

## Cleanup / Residue

2 test notes created (1 authed, 1 no-auth) — no DELETE endpoint (`405` confirmed), permanent residue with auto-generated journal entries. Disclosed, not hidden.

## Regression

1 file changed. `tsc` clean. No other module touched.
