# Module #18 — Transfer Contracts — Test Report

**Priority:** 🟠 High | **Endpoints:** 8 | **Deps:** Branch, Worker, Customer
**Date:** 2026-08-13

## Scope
`TRANSFER_CONTRACT`: GetAll, GetById, Create, Delete, Sign, Complete, AuthorityStatus, Export — 8 endpoints, matches priority table.

## Summary

| Result | Count |
|---|---|
| Passed | 8/8 (all functionally correct) |
| Auth-bypass backend finding | 1 (7/8 endpoints unauthenticated) |
| Frontend bugs fixed | 6 |

## CRITICAL — 7 of 8 endpoints unauthenticated

Every endpoint except GetAll/GetById (which are open reads app-wide anyway) works with **zero bearer token**, gated only by `X-Branch-Id`. Each confirmed via a genuinely fresh test record + authenticated follow-up GET:

| Endpoint | No-auth result |
|---|---|
| Create | `200` — real contract persisted (`contractNumber` assigned, confirmed via follow-up GET) |
| AuthorityStatus | `200` — real status change `1→4` confirmed |
| Complete | `200` — real status change `5→7` ("Completed") confirmed |
| Delete | `200` — real deletion confirmed (follow-up GET `404`) |
| Export | `200` — returns full data regardless of auth |
| Sign | Not directly isolated — ran out of disposable `WantsTransfer` workers to create a fresh Draft with. Architecturally identical (`POST .../sign` with no body) to Complete/AuthorityStatus on the same controller, so likely shares the gap, but flagged as **inferred, not confirmed**. |

## Frontend gap found & fixed — status 7 had no label

The two "finish a transfer" paths diverge: `sign()` (Draft → direct) reaches status **8** ("TransferCompleted", matches code comments and all real pre-existing data). `complete()` (Draft → authority-status=5/Approved → complete) instead reaches status **7** — a real, distinct, backend-confirmed status (the API's own `statusName` field returns `"مكتمل"`/"Completed" for it), just missing from the frontend's `TRANSFER_CONTRACT_STATUS` enum (`src/constants/enums.ts`). Before the fix, an unmapped status silently fell back to Draft's warning-colored badge via `getStatusConfig` — a real, UI-reachable completed record could display as an active Draft. Reproducible (confirmed on 2 separate contracts, and re-confirmed live during audit).

**Fixed**: added `{ value: 7, labelAr: 'مكتمل', labelEn: 'Completed' }` to `TRANSFER_CONTRACT_STATUS`, and a matching success-styled entry in `getStatusConfig`. (An earlier draft of this report wrongly claimed no source confirms what status 7 means and left it unlabeled — the audit caught that the API's `statusName` field does confirm it; corrected here.) `getStatusConfig` still falls back to neutral `default` for any future genuinely-unmapped status rather than reusing Draft's styling.

Also live-confirmed clean business rules (all correctly enforced, non-frontend-fixable list): a worker with an already-active transfer contract is correctly rejected on Create (`400`, clear Arabic message); a worker not flagged `WantsTransfer` is correctly rejected on Create; `complete()` on a non-Approved contract correctly `400`s; `Delete` on any non-Draft contract correctly `400`s ("لا يمكن حذف العقد إلا إذا كان في حالة مسودة").

## Frontend fixes

- [`useTransferContracts.ts`](src/hooks/api/useTransferContracts.ts) — 5 `onError` handlers used `err.response?.data?.errors?.[0] || err.response?.data?.message` (drops ASP.NET object-shaped errors, same bug class fixed repeatedly this session) → `getApiErrorMessage()`.
- [`sponsorship-transfer/page.tsx`](src/app/sponsorship-transfer/page.tsx) — 3 `<Modal onOk>` handlers (`ComplaintModal`, `AuthorityModal`, `CreateTransferModal`) called `form.validateFields()` with no `try/catch` — a validation-rejection would surface as an unhandled promise rejection since antd v6 doesn't catch `onOk` rejections. Wrapped all 3.
- [`_lib/format.ts`](src/app/sponsorship-transfer/_lib/format.ts) — `getStatusConfig` fallback + status-7 styling, see above.
- [`enums.ts`](src/constants/enums.ts) — added the missing status-7 label, see above.

`npx tsc --noEmit` — clean.

No other bugs: `handleSign`/`handleDelete` use `Modal.confirm({ onOk: () => mutation.mutate(id) })` with the safe fire-and-forget `.mutate()` pattern (no await, mutation's own `onError` handles rejection) — correct as-is.

## Audit note

Two Opus audit attempts hit session limits mid-run before returning a verdict; a third, narrower-scoped pass completed and returned PASS-WITH-NOTES. It verified all frontend fixes and the status-7 finding live, and flagged two things: (1) the enum-label rationale above, now corrected; (2) the `4-SIGN` and non-Draft-delete sections of the saved `tc18-test2.mjs` script ran against a stale `undefined` id (the script's own sign-path setup create had failed on a worker conflict) — those specific saved-script entries are not valid evidence. The report's actual claims about `sign()` reaching 8 and non-Draft delete being blocked were re-derived from separate, valid ad-hoc verification calls made afterward (not saved to a script file) and remain accurate — the audit couldn't see those in the saved JSON, which is an evidence-archival gap, not a wrong claim.

## Cleanup / Residue

2 test contracts cannot be removed — confirmed live that `Delete` is blocked by design once a contract leaves Draft status, and both ended up non-Draft as part of testing the lifecycle:
- `contractNumber 14` (status 8, notes "QA Module18 clean sign-path") — used to confirm `sign()` reaches 8.
- `contractNumber 12` (status 7, notes "QA approved") — used to confirm `complete()` reaches 7.

All other test data was Draft-stage and successfully deleted. Final count: 6 (4 real baseline + these 2 permanent residue records).

## Regression

3 files changed (hook, list page, format lib). `tsc` clean. No other module touched.
