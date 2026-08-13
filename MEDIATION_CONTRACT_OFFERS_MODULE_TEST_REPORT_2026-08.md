# Module #16 — Mediation Contract Offers — Test Report

**Priority:** 🟠 High | **Endpoints:** 7 | **Dependencies:** Branch, Job, Nationality (via ContractNationality)
**Date:** 2026-08-13 (revised after Opus audit — see "Audit corrections")

## Scope

`MEDIATION_CONTRACT_OFFER`: GetAll, GetById, Create, Update (non-RESTful PUT on collection path, `id` in body), Delete, ToggleActive, AutoFill — 7 endpoints, matches the master priority table.

## Results Summary

| Result | Count |
|---|---|
| Passed (business logic works correctly) | 7 / 7 endpoints functionally correct |
| CRITICAL backend finding (not frontend-fixable) | 1 (all 7 endpoints unauthenticated) |
| Secondary backend findings (not frontend-fixable, none reachable via this app's UI) | 5 |
| Frontend bugs found & fixed | 1 |
| Blocked | 0 |

## HEADLINE FINDING — CRITICAL: Unauthenticated CRUD on the pricing table that gates the #1 revenue workflow

Every one of the 7 endpoints under `/api/Mediation/MediationContractOffer/*` works with **zero bearer token** — gated only by a valid `X-Branch-Id` header, the same systemic pattern found in nearly every module tested this session. This is a **backend** authorization gap; the frontend correctly sends the token on every call.

| Endpoint | No-auth result | Live verification |
|---|---|---|
| `GET` (list) | 200 anonymous (with **or without** branch header) | Returned all 5 real offers |
| `GET /{id}` | 200 anonymous | Full record returned |
| `POST` (create) | 201 anonymous (400 without branch header — that 400 is branch-header validation, not an auth gate) | Created record has `createdBy: "System"` — genuinely persisted |
| `PUT` (update, collection path) | 200 anonymous | Follow-up GET confirmed `salary` really changed from 500 → 5555.5 |
| `PATCH /{id}/toggle-active` | 200 anonymous | Follow-up GET confirmed `isActive` really flipped `true` → `false` |
| `DELETE /{id}` | 200 anonymous | Follow-up GET returned 404 — record genuinely deleted |
| `POST /auto-fill` | 200 anonymous | Returns full pricing data with no auth |

**Practical impact:** anyone who can reach the API can read, create, retarget, deactivate, or delete the pricing offers that determine what a mediation contract charges — with no login. This directly affects the module the priority table flagged as gating "the #1 revenue workflow."

## Secondary findings (backend, not frontend-fixable — none reachable through this app's own UI)

1. **Server-side required-field validation is not enforced on Create.** Swagger declares `agentCostSAR`, `localCost`, `nationalityId`, `salary` as required, but omitting `salary`/`localCost`/`agentCostSAR` silently defaults them to `0` and creates a real offer anyway (`201`, not `400`) — confirmed via a live test that created a genuine `$0` offer. **Not reachable via the app's own UI**: the create/edit form has `rules={[{ required: true }]}` on all three fields.
2. **Missing `nationalityId` on Create crashes with an uncaught `500`** (empty response body, no error message) instead of a clean `400`. **Not reachable via the UI** — `nationalityId` always comes from a populated dropdown, never omitted.
3. **An invalid/nonexistent `nationalityId` GUID on Create produces the same uncaught `500`** rather than a clean validation error. **Not reachable via the UI** for the same reason.
4. **Negative `salary` is accepted with no server-side validation** (`201`, `salary: -500`). **Not reachable via the UI** — the `InputNumber` has `min={0}`.
5. **`DELETE` on a nonexistent id returns `200 "تم الحذف بنجاح"`** ("deleted successfully") instead of `404`, inconsistent with `Update`/`ToggleActive` on the same input, which correctly return `404 "العرض غير موجود"` ("offer not found"). Harmless — the UI never fabricates ids — but worth flagging as a minor backend inconsistency.

Exact-duplicate offers (identical nationality + job + workerType + previousExperience) are freely allowed with no uniqueness constraint — confirmed live, not flagged as a defect since offers may legitimately be re-priced/superseded over time rather than edited in place; this looks like intentional design, not a bug.

## Correction to the Phase 2 priority-table description

The master priority table describes this module as: *"auto-fill pre-populates contract pricing."* Live code review found this does not reflect how the app actually works: `MediationContractOfferService.autoFill()` (`POST /auto-fill`) has **zero consumers anywhere in the frontend**. The real contract-pricing pre-fill mechanism is [`OfferSelector.tsx`](src/components/contracts/OfferSelector.tsx)'s manual row-click handler (`handleOfferSelect` in [`mediationcontract/add/page.tsx`](src/app/contracts/mediationcontract/add/page.tsx:83-99)), which copies fields directly from an already-fetched offer object in the picker table — it never calls the dedicated auto-fill endpoint. Both `AUTO_FILL` and the singular `useMediationOffer` (GetById) hook are dead code with no UI consumer. Both were tested anyway per the Phase 3 requirement to test every endpoint regardless of reachability, and both work correctly — `auto-fill` returns full matched pricing (`found: true`) for a real nationality+job+workerType combo and a clean `found: false` empty-data response for no match.

## Endpoint-by-Endpoint Results

- `GET` (list) — 200 anonymous and authenticated. `NationalityId` confirmed genuinely discriminating (5 → 2 records); an out-of-range `SalaryMin`/`SalaryMax` correctly returned empty; `PageSize=1&PageNumber=1` correctly returned exactly 1 record. `IsActive=true` returned all 5 records, but since all 5 were already active this doesn't independently confirm the filter discriminates — indistinguishable from the param being ignored. The remaining server-side filter params (`JobId`, `WorkerType`, `PreviousExperience`, `OfferNumber`, `LocalCost*`, `AgentCostSAR*`, `ShowFor*`, `PageNumber=2`) were sent as part of the query string but their discriminating effect on results wasn't independently confirmed.
- `GET /{id}` — 200 for a valid id (anon and authed); 404 for a well-formed but nonexistent GUID; 400 for a malformed id.
- `POST` (create) — see CRITICAL and secondary findings above. Genuine valid create confirmed live: correct field persistence, correctly server-computed `totalOfferCost` (`localCost + taxLocalCost + agentCostSAR`).
- `PUT` (update) — genuine valid update confirmed live: `salary`/`workerType`/etc. all correctly changed and persisted. 404 on a nonexistent id or a missing `id` field in the body (Arabic error `"العرض غير موجود"`, "offer not found").
- `PATCH /{id}/toggle-active` — genuine toggle confirmed live in both directions (`true`→`false`→`true`); 404 on a nonexistent id.
- `DELETE /{id}` — genuine delete confirmed live (follow-up `GET` → 404); see secondary finding #5 for the nonexistent-id edge case.
- `POST /auto-fill` — correctly returns full matched offer data (`found: true`) for a real combo, and an all-null `found: false` response with a clear message for no match or an empty body. Dead code, see correction above.

## Frontend Findings & Fix

**One bug found — HIGH severity, reachable through the app's own UI.** [`offers/page.tsx`](src/app/contracts/mediationcontract/offers/page.tsx): clearing any of the three filter `Select`s (Nationality, Job, Worker Type) via their `allowClear` "×" silently hid every row in the table.

**Root cause:** antd v6's `Select` (built on `@rc-component/select`) emits `undefined` (not `null`) when cleared — traced through `@rc-component/select`'s actual clear path (`BaseSelect/index.js`'s `onClearMouseDown` → `onDisplayValuesChange([], {type:'clear'})` → `Select.js`'s `triggerChange([])`, where single-mode `[][0]` is `undefined`). The three `onChange` handlers passed that value straight into state (`onChange={(v) => setNationalityFilter(v)}`), but the client-side filter predicate uses a strict `=== null` sentinel to mean "no filter" (`nationalityFilter === null || String(offer.nationalityId) === nationalityFilter`). With `undefined`, neither branch of the `||` is true for any row, so every offer gets excluded — while `activeCount` still (incorrectly) counted the cleared filter as active, since it also checks `!== null`. Only the panel's separate "Clear all" button (which explicitly sets `null`) recovered the table. The same file already had the correct fix applied six times over for its numeric `InputNumber` filters (`onChange={(value) => setSalaryMin(value ?? null)}` etc.) — the three `Select`s were simply missed.

**Fix:** normalized all three `Select` `onChange` handlers to `(v) => setNationalityFilter(v ?? null)` (and the same for `jobFilter`/`workerTypeFilter`), matching the pattern already used for the numeric filters in the same file.

`npx tsc --noEmit` — clean after the fix. Browser-based visual verification was attempted but could not be completed: the dev server on port 3100 was stuck at "Starting..." and never finished compiling — confirmed via a direct `curl` against it (no browser involved) hanging the same way, including after a fresh restart — so this was a hung dev server, not a code problem or a browser-extension/CDP issue. Verification instead relied on (a) the type-check passing, (b) exact code-pattern parity with the six already-live-verified-correct numeric filters in the same file, and (c) tracing the actual antd v6 clear-event source to confirm the `undefined`-vs-`null` mechanism, independently re-confirmed during the follow-up audit round. This should be spot-checked in a browser once the dev server is healthy, but the fix is low-risk and mechanically well-understood.

Also reviewed and confirmed correct, no further bugs:
- [`mediation-contract-offer.service.ts`](src/services/mediation-contract-offer.service.ts) — defensive envelope-unwrapping (`unwrap`/`unwrapList` with multiple shape fallbacks), correct numeric coercion on all payload fields. Note: `toggleActive()`'s declared return type (`Promise<MediationContractOffer>`) doesn't match what the backend actually returns (a plain success string, `"تم تغيير الحالة بنجاح"`) — harmless today since `useToggleMediationOffer` ignores the resolved value, but the type is misleading.
- [`useMediationOffers.ts`](src/hooks/api/useMediationOffers.ts) — every mutation (`create`, `update`, `delete`, `toggleActive`) has a proper `onError` handler using `getApiErrorMessage()`.
- [`offers/page.tsx`](src/app/contracts/mediationcontract/offers/page.tsx) — uses `.mutate()` (not `mutateAsync`) throughout for create/update/delete/toggle. Corrected understanding from the audit: `.mutate()` is unconditionally safe here regardless of whether `onError` is defined — React Query's `useMutation().mutate()` internally does `observer.mutate(variables, options).catch(noop)` (confirmed in `node_modules/@tanstack/react-query`), so it never produces an unhandled rejection on its own. This is a different (and more robust) guarantee than "the mutation's own onError handles it," which was the original, slightly-wrong framing. `handleModalSubmit`'s `form.validateFields()` call is correctly wrapped in `try/catch`.
- [`OfferSelector.tsx`](src/components/contracts/OfferSelector.tsx) — read-only, no mutations; uses truthiness checks (`if (nationalityFilter && ...)`) for its own local filters rather than a `null` sentinel, so it does not share the bug found in `offers/page.tsx`.
- Two stale code comments (not bugs) in `offers/page.tsx` describe `ContractNationality.id` as an "integer PK" — live data confirms it's actually a GUID (e.g. `ea5cd852-d84a-441a-c18b-08dea2f4800b`). The code itself is correct (always treats it as `String(cn.id)`), only the comment is outdated.
- The create/edit form's client-side `required` rules and `InputNumber min={0}` constraints are exactly what makes the backend-only validation gaps above unreachable through this app's own UI.

## Audit corrections (this section documents what changed after the Opus review)

An Opus-model audit of the first draft of this report confirmed the evidence discipline was solid (no fabricated claims, all 7 endpoints genuinely tested, cleanup independently re-verified live, the "AutoFill is dead code" claim confirmed via a full-tree grep) but found the headline "zero frontend bugs" claim was false — see the filter-clearing bug above, now fixed. It also corrected the reasoning given for why `.mutate()` was safe (see above), and flagged that the original "all filters function correctly" line in Endpoint-by-Endpoint Results overstated what was actually tested — only `NationalityId` was confirmed genuinely discriminating results (5 → 2 records); `IsActive=true` returned all 5 already-active records, indistinguishable from an ignored filter; the other server-side filter params (`JobId`, `WorkerType`, `PreviousExperience`, `OfferNumber`, `LocalCost*`, `AgentCostSAR*`, `ShowFor*`, `PageNumber=2`) were sent but their discriminating effect wasn't independently confirmed. That claim is corrected in the Endpoint-by-Endpoint section below to reflect only what was actually verified.

A second audit round independently re-derived the antd v6 clear-event mechanism from the actual `@rc-component/select` source (not just re-reading the first audit's claim), confirmed via `git diff` that exactly the three intended lines changed and nothing else regressed, confirmed the `.catch(noop)` claim directly against `node_modules/@tanstack/react-query`'s source, and re-ran `npx tsc --noEmit` independently (clean). It also corrected the diagnosis of the blocked browser verification: the actual cause was a hung dev server (stuck at "Starting...", reproduced with a plain `curl` — no browser involved), not a browser-extension/CDP issue as originally guessed; that correction is reflected above. Final verdict: PASS-WITH-NOTES.

## Cleanup / Residue

Six offers were created during testing (5 in the first pass, 1 dedicated disposable offer in the second pass for the Update/ToggleActive/Delete tests — that sixth one was itself removed by the no-auth-delete test before the explicit cleanup pass ran). All 5 remaining test-created offers (including the intentionally-invalid `$0` and negative-salary ones) were deleted via authenticated `DELETE` calls at the end of testing. Final live record count verified back at the pre-test baseline of 5 real offers (`offerNumber`s 5, 13, 14, 15, 16 — unchanged, ids byte-identical to the pre-test baseline). Zero residue.

## Regression

One file changed ([`offers/page.tsx`](src/app/contracts/mediationcontract/offers/page.tsx), the filter-clearing fix). `npx tsc --noEmit` clean. No other module's files were touched.
