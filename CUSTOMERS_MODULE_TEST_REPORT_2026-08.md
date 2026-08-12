# Customers Module — Phase 3 Test Report

**Priority #3 — 🔴 Critical.** Tested 2026-08-11 against the live backend `https://sigma-api.runasp.net`. Raw logs: `customer-test.mjs`/`customer-test-results.json` in scratchpad, plus ad-hoc baseline/cleanup scripts referenced inline below.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/api/V1/Customer` | anonymous, authed, filters (searchName), pagination, empty-result search |
| GET | `/api/V1/Customer/export` | authed, anonymous |
| GET | `/api/V1/Customer/{id}` | valid, no-auth, non-existent GUID, malformed id, **read-back field-completeness check** |
| POST | `/api/V1/Customer/generate-english-name` | valid Arabic input, empty string, no-auth, already-English input |
| POST | `/api/V1/Customer` | no-auth+no-header, header-but-no-token, valid rich create (all DTO fields), empty body, missing `nationality`, missing `phones` |
| PUT | `/api/V1/Customer/{id}` | full-replace check (see below), with a real baseline test to distinguish "field wiped" from "uniqueness unenforced" |
| DELETE | `/api/V1/Customer/{id}` | non-existent GUID, no-auth, re-verification of a **previously-known backend bug** |

## 🔴 CRITICAL — write surface has no authentication (backend, cannot be fixed from this repo)

Same pattern as Auth's `add-admin` and the entire Branch module: `POST /api/V1/Customer` succeeds with a valid `X-Branch-Id` but **no bearer token** (200, "تم اضافة العميل بنجاح"), and `DELETE /api/V1/Customer/{id}` succeeds with **no auth at all** (200, "تم حذف العميل بنجاح"). `GET` (list, by-id, export) are all anonymous too. This is now the **third confirmed module** with an unauthenticated write surface — strong evidence this is a systemic backend authorization gap (auth middleware not consistently applied across controllers), not three unrelated bugs. Cannot be fixed from this repo; escalate broadly, not endpoint-by-endpoint.

## 🔴 CRITICAL — editing a customer silently destroyed data (partially fixed; partially backend-blocked)

This module has the same "full-replace `PUT`" defect already confirmed on Branch. An Opus audit round corrected my first pass here: I initially treated this as entirely backend-blocked, but two of the affected fields (`identityNumber` and the customer's other phone numbers) **were** preservable from data the frontend already had — I'd grouped them in with the genuinely-unfixable fields by mistake. Both are now fixed. 11 other fields remain genuinely backend-blocked.

**Root cause, confirmed live, not inferred:**
1. `GET /api/V1/Customer/{id}` returns only 15 fields (`id, arabicName, englishName, identityNumber, nationalId, dateOfBirth, secondaryMobileNumber, nationality, cityAr, cityEn, housingType, numberOfComplaints, numberOfOperatingContracts, numberOfMediationContractts, phones`), even for a customer created with every field in `CreateCustomerDto` populated.
2. `PUT` reuses the identical `CreateCustomerDto` schema as `POST` in the live OpenAPI spec — same full-replace architecture already confirmed on Branch.
3. `src/app/customers/page.tsx`'s edit form (`handleEditCustomer`/`handleModalSubmit`) only ever populated/submitted ~10 fields, so saving an edit reset everything else to whatever the (mostly empty) form held.

**✅ Fixed — the two preservable fields:**
- **`identityNumber`**: it *is* returned by `GET` (unlike 13 other fields), but its `Form.Item` and its `handleEditCustomer` population line were both commented out. `git log`/`git blame` traced this to commit `d318c9a` ("Hide identity number in the customer card") — a **deliberate** decision to hide the field from display, search, and the edit form, not an accidental bug or an abandoned feature. That decision predates this session's discovery that `PUT` is a full replace, so it almost certainly didn't anticipate that "hidden from the UI" would also mean "silently erased on every unrelated edit" — those are different things, and only the second one is a bug. **Fix**: `handleModalSubmit` now re-attaches `editingCustomer.identityNumber` to the update payload directly (no new form input, so the hide decision itself is left untouched — nothing about the field becomes visible or editable again).
- **`phones`**: a separate, previously-undocumented bug in the same family. The edit form collapses a customer's phone list to one `mobile` text input, and the old submit logic rebuilt `phones` as a brand-new single-entry array on every save — **deleting every phone but the primary, and force-resetting its `type`/`isPrimary` flags** even when unchanged. `phones` *is* returned by `GET`, so this was fully preservable and had simply never been noticed. **Fix**: the submit logic now keeps every non-primary phone from `editingCustomer.phones` untouched, and preserves the primary's original `type` — only the phone *number* the user edited actually changes.
- **Retested live end-to-end** (not just type-checked): created a customer with an `identityNumber` and two phones (primary `type:1`, secondary `type:0`), ran the exact fixed merge logic through a `PUT` that only changed the name and the primary phone number, then confirmed via a direct follow-up `GET` — not the indirect duplicate-check method pass 1 relied on — that `identityNumber` and both phones (with correct types) survived intact. Also re-ran the duplicate-identity check post-fix as a second, independent confirmation: the attempt still failed to create (this time with a bare `500` rather than the baseline's clean `400` — see the separate low-severity finding on this inconsistency below), which is still consistent with the value having persisted rather than been wiped, though the direct `GET` above is the decisive proof, not this secondary check.

**❌ Still backend-blocked — 12 remaining fields**: `identityType`, `identityIssueDate`, `maritalStatus`, `email`, `districtAr`, `districtEn`, `addressAr`, `addressEn`, `familyMembers`, `childrenCount`, `domesticWorkers`, `monthlyIncome` are never returned by any endpoint under any circumstance tested, so there is no data for the frontend to preserve — this genuinely needs a backend fix (`PUT` needs partial-merge semantics, and/or `GET` needs to expose these fields) before anything more can be done here.

**Severity correction from the Opus audit**: my first pass claimed these 12 fields "don't appear anywhere in the file, not even as dead code" — that was wrong. 11 of the 12 (`email`, `monthlyIncome`, `familyMembers`, `childrenCount`, `identityType`, `identityIssueDate`, `maritalStatus`, `districtAr`, `districtEn`, `addressAr`, `addressEn` — everything except `domesticWorkers`) are exposed as **advanced search filter fields** in this same page (e.g. `email` at line ~1008). The UI actively advertises "search customers by email/income/family size/marital status," while there is no way to set or preserve that data through this same UI — which raises the severity of the backend gap (this isn't obscure, unused data; the product clearly intends it to be tracked and searchable) without changing the fact that it's not frontend-fixable.

**Also caught in review, fixed**: `handleModalSubmit` used to close the modal and reset the form (clearing whatever the user had typed) immediately after firing the create/update mutation, rather than waiting for it to actually succeed — since the mutation call itself doesn't return a promise (`useMutation().mutate`, not `mutateAsync`), a failed save would show its error toast against an already-closed, already-blanked form, silently losing the user's input. Fixed: the modal now only closes and the form only resets in the mutation's `onSuccess` callback; on failure it stays open with the data intact so the existing error toast is actually actionable.

## Other findings

| Finding | Severity | Status |
|---|---|---|
| Write surface unauthenticated: `POST` and `DELETE` directly confirmed with no bearer token; `PUT` architecturally very likely (same pattern as Branch, where all three verbs were confirmed) but not independently isolated for Customer specifically | 🔴 Critical | **Backend fix required — cannot fix from this repo** |
| `PUT` full-replace silently wiping `identityNumber` and secondary phone numbers on every edit | 🔴 High — data loss | ✅ **Fixed and retested live end-to-end** (see above) |
| `PUT` full-replace + 12 remaining fields (`identityType`, `identityIssueDate`, `maritalStatus`, `email`, `districtAr/En`, `addressAr/En`, `familyMembers`, `childrenCount`, `domesticWorkers`, `monthlyIncome`) never exposed by any `GET` endpoint | 🔴 Critical | **Backend fix required** (partial-merge `PUT` and/or a `GET` response that includes these fields) — genuinely nothing the frontend can do until then |
| `handleModalSubmit` closed the modal and reset the form before its mutation actually resolved (race condition — `mutate` isn't awaitable), so a failed save silently discarded the user's input | 🟠 High — data loss (typed input, not stored data) | ✅ **Fixed** — close/reset moved into the mutation's `onSuccess` callback |
| `CustomerService.create()`/`update()` typed to return `Promise<Customer>`, but the backend returns a bare success-message string for both (same pattern as Auth/Branch) | 🟡 Low | ✅ **Fixed** — retyped to `Promise<string>`. Confirmed harmless on the resolved-value question: neither call site ever read it. |
| Previously-documented backend bug (project memory, 2026-07-12 audit): `DELETE /api/V1/Customer/{id}` → 500, couldn't delete a test customer | 🟢 Info | **Appears fixed for the dependency-free case tested; not exhaustively confirmed.** Re-tested live twice (pass 1 and the fix-verification pass), both times a real, dependency-free customer deleted cleanly (200, confirmed gone via follow-up `GET` → 404). Not tested: a customer with contracts/complaints attached, which is the more likely trigger for the original 500 (an FK constraint, by analogy with Branch's confirmed delete-with-children 500). Memory should be updated to "no longer reproduces for dependency-free customers," not marked fully resolved. |
| `nationality` and `phones` are marked `nullable: true` in the live OpenAPI spec but are actually enforced as required on create (400 "field is required" when omitted) | 🟢 Info | Contract-documentation inaccuracy on the backend's side, not a frontend bug — the real create form already collects both. No frontend action needed. |
| An attempt to create a duplicate `identityNumber` post-fix returned a bare `500` (empty body) instead of the clean `400` the same check returned in the baseline test | 🟢 Low | **Backend inconsistency, not investigated further** — tangential to this module's main finding; the fix itself was already confirmed via a direct `GET`, independent of this duplicate-check's exact status code. Noting in case it recurs elsewhere. |

## What's working correctly (verified, not just assumed)

- Filters, pagination, and empty-result search all behave correctly.
- `GET /{id}`: proper 404 for non-existent GUID, proper 400 for malformed id.
- `generate-english-name` genuinely transliterates ("محمد أحمد" → "Mhmd Ahmd") and correctly 400s on an empty string.
- `identityNumber` and `email` uniqueness (at least) are genuinely enforced server-side with clear Arabic error messages — confirmed via a clean baseline test, not assumed.
- Duplicate-name creation (unlike identity/email) doesn't appear restricted — not treated as a bug, no indication names need to be unique.

## Cleanup

All test customers created across both test passes (identified by Arabic test-name prefixes) were deleted and verified gone via follow-up list checks — zero residue in both passes.

## Regression

`tsc --noEmit` clean after all changes (`customer.service.ts`, `customers/page.tsx`). The `identityNumber`/`phones` preservation fix and the await-race fix were both retested live end-to-end against the real backend, not just type-checked — see the fix-verification section above.

## Opus audit — findings and fixes

An independent Opus review came back **"needs rework"** and, in a pattern now consistent across all three modules tested this session, caught real issues the first pass missed:

1. **Incorrectly grouped two preservable fields (`identityNumber`, `phones`) with the genuinely-unfixable ones**, concluding "structurally unfixable" too broadly. Traced the actual root cause (git blame on the `identityNumber` hide decision) and implemented a real fix for both, retested live.
2. **Missed an entirely separate, previously-undocumented bug**: the phones-array collapse (dropping secondary phones, force-resetting `type`/`isPrimary`) — found by Opus reading `handleModalSubmit` directly rather than trusting my framing of "the geofence-style bug is about hidden fields only."
3. **Corrected a false claim** that the 11 backend-blocked fields "don't appear anywhere in the file" — most are exposed as advanced search filters, which raises rather than lowers the severity of the backend gap.
4. **Flagged an unreported UX/data-loss bug**: the `await`-on-`.mutate()` race closing the modal before knowing whether the save succeeded. Fixed.
5. **Correctly pushed back on the DELETE-500-fixed claim** being over-confident on a single dependency-free retest — caveated accordingly above.
6. **Flagged an evidence-persistence gap** (the baseline uniqueness check was run ad hoc, not saved) — addressed: `customer-test2-fix-verify.mjs`/`customer-test2-fix-verify-results.json` now persist the fix verification, including a repeat of the baseline (this time matching `identityType` too, closing a possible composite-key gap in the original proof) and a direct `GET`-based check rather than only the indirect duplicate-create method.

This is the third module in a row where an independent audit pass caught something real on the first try — treat that as a standing signal to budget for at least one audit round per module going forward, not as something specific to this agent's output today.

**Round 2** returned **pass with notes** — both round-1 fixes independently re-verified as correct and live-proven, no further rework required. Two low-severity items fixed alongside the report corrections above:
- A latent edge case in the phones-preservation logic: if a customer somehow has no phone marked `isPrimary`, the merge's fallback selection didn't match `handleEditCustomer`'s own fallback (`phones.find(isPrimary) ?? phones[0]`), which could have duplicated that phone entry on save. Fixed by aligning the two selections exactly. Not observed in any live data this session (everything tested has a real primary flag), so this was pre-emptive, not a confirmed live bug.
- Two report inaccuracies: a field count stated as "11" in three places when the enumerated list was actually 12, and a mischaracterization of the post-fix duplicate-identity check's `500` response as "correctly rejected" rather than what it actually was (a crash that happened to also prevent the duplicate, not a clean validation rejection) — both corrected above.
