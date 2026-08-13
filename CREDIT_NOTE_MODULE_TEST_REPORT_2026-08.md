# Module #21 — Accounting: Credit Note — Test Report

**Priority:** 🟠 High | **Endpoints:** 4 | **Deps:** Branch, Agent, Customer
**Date:** 2026-08-13

## Scope
`CREDIT_NOTE`: GetAll, GetById, Trace, Create — 4 endpoints, matches priority table. Third accounting-document module tested (mirror of #19 Payment Voucher / #20 Receipt Voucher).

## Summary

| Result | Count |
|---|---|
| Passed | 4/4 |
| Auth-bypass backend finding | 1 (Create unauthenticated) |
| Secondary backend findings | 2 (invalid FK → 500, not reachable via UI; GetAll pagination ignored) |
| Frontend bugs fixed | 1 |

## Findings

- **Create unauthenticated**: `200` with no token (once `creditNoteNumber` is present — the saved script's first no-auth attempt omitted it and got the validation 400 above instead; a follow-up with a valid note number confirmed the real bypass) — real note persisted with journal linkage. Same pattern as #19/#20.
- **`creditNoteNumber` is actually required server-side**, despite swagger marking it `nullable`. Omitting it → clean `400 "'Credit Note Number' must not be empty."`. The frontend's create form already has `rules={[{ required: true }]}` on this field, so the swagger/backend mismatch has zero real-world impact.
- **Secondary gap (3rd confirmation of the #19/#20 pattern)**: a well-formed but nonexistent `customerId` crashes with an uncaught `500` (empty body) once the note-number requirement is satisfied. **Not reachable via the UI** — `customerId` is a `Select` populated from real customers.
- **Secondary gap (3rd confirmation of the #19/#20 pattern)**: `GetAll` pagination is ignored — confirmed with 3 real records present, `?pageSize=1` still returned all 3. Not frontend-fixable.
- `DELETE` confirmed `405` (unsupported) — 3rd module in a row with no edit/delete path.
- `GetById`/`Trace` on nonexistent id → clean `404`; malformed id → `404` (route-binding miss, consistent with #19/#20).

## Frontend fix

[`credit-notes/page.tsx`](src/app/accounting/credit-notes/page.tsx) — `handleCreate` had no `try/catch` around `form.validateFields()` + `await createNote(dto)`, bound to a raw `onClick`. Same bug as #19/#20's twin pages (identical template across all three). Wrapped in `try/catch`.

`npx tsc --noEmit` — clean.

No other bugs: `[id]/page.tsx` and `CreditNoteDetailView.tsx` are read-only, no mutations.

## Audit note

Opus audit: PASS. Independently re-confirmed the invalid-FK 500, the no-auth bypass, the pagination-ignored finding, and the 405 delete block, all live. Its own verification pass created one additional test note (no DELETE endpoint exists, so it's residue too — included in the count below).

## Cleanup / Residue

3 test notes total (2 from this pass + 1 from the audit's independent re-verification) — no DELETE endpoint (`405` confirmed), so all are permanent residue with auto-generated journal entries. Disclosed, not hidden.

## Regression

1 file changed. `tsc` clean. No other module touched.
