# Mediation Contracts Module — Phase 3 Test Report

**Priority #6 — 🔴 Critical.** Tested 2026-08-12 against the live backend `https://sigma-api.runasp.net`. Raw logs: `mediation-contract-test.mjs`/`mediation-contract-test-partial.json` (list/get/create pass), `mediation-contract-test2-statemachine.mjs`/`-results.json` (full lifecycle walkthrough), and `mediation-contract-test3-corrections.mjs`/`-results.json` (isolated re-verification of every claim an Opus audit round found under-evidenced or wrong — see "Opus audit" section at the end).

**Frontend result, revised**: still no frontend code changed, but with a narrower claim than the first draft made. Every mutation call site (10, across **three** page files — `contracts/mediationcontract/page.tsx`, `contracts/mediationcontract/[id]/page.tsx`, and `contracts/mediationcontract/add/page.tsx`, the last of which the first draft of this report never opened) is genuinely wrapped in `try/catch`, verified by reading each one directly. All findings below are backend-only.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/MediationContract` | anonymous, authed, filters, pagination (including the documented `Page` vs `PageNumber` quirk) |
| GET | `/MediationContract/export`, `/recruitment-requests` | authed, no-auth |
| GET | `/MediationContract/{id}`, `/status-history/{id}` | valid, no-auth, non-existent GUID, malformed id |
| POST | `/MediationContract` (multipart, create) | no-auth+no-header, missing required fields, valid rich create, **and a second, cleanly isolated no-auth create using a confirmed-available worker** |
| POST | `/sign`, `/customer-payment`, `/delivery-form`, `/delivery-form/sign`, `/warranty-return`, `/end-worker-service`, `/assign-worker` | no-auth + valid, each verified via a follow-up `GET` |
| POST | `/cancel` | valid (with token, freeing a busy worker) **and a cleanly isolated no-auth cancel on a fresh contract** |
| PUT | `/update-status` | no-auth + valid (single value only — see coverage gap below) |

**Coverage gap, acknowledged**: `update-status` was only tested with one target value; `assign-worker` was never tested against a contract that had no worker at all (only as a re-assignment after `end-worker-service`); no negative tests for a mismatched/bad worker passport on `assign-worker`. Deferred given the volume of findings already surfaced — flagging rather than leaving implicit.

## 🔴 CRITICAL — entire write surface unauthenticated (backend, cannot be fixed from this repo)

**Sixth consecutive module.** An Opus audit round correctly challenged the first draft's evidence here: two of the originally-claimed endpoints (`create`, `cancel`) had not actually been proven unauthenticated in isolation — the `create` no-auth attempts had failed for an unrelated reason (the test worker was already busy on another contract), and `cancel` had only ever been called *with* a token. **Both have since been re-tested cleanly and confirmed**: `create` succeeds (200, real contract created) with no bearer token when the referenced worker is genuinely available; `cancel` succeeds (200, contract genuinely moves to `Cancelled`, verified via follow-up `GET`) with no bearer token at all. Combined with `sign`, `customer-payment`, `delivery-form`, `delivery-form/sign`, `update-status`, `warranty-return`, `end-worker-service`, and `assign-worker` — all independently confirmed unauthenticated in the original pass — every write endpoint in this module accepts unauthenticated requests. This is the company's primary revenue workflow. Six modules in, this is unambiguously one systemic backend authorization gap; escalate as a single fix, not per-endpoint.

`update-status` deserves a specific callout: it's a "manual override" feature that the frontend's own Select intentionally leaves unrestricted (by design, for staff corrections — not a bug on its own). Confirmed live: an unauthenticated call reset a contract that had already been signed, paid, and delivered all the way back to "Draft" status in one request. The override capability is legitimate; having zero authentication in front of it is what makes it dangerous. (Only one target value was tested, so "no restriction on which value" is an inference from the single case tried, not confirmed across the full range — noted as a coverage gap above.)

## 🔴 CRITICAL — `cancel` does not end the active worker assignment on the contract's own record (newly found, backend, cannot be fixed from this repo)

Missed in the first pass, caught by an Opus audit round and independently re-confirmed live on a fresh contract. After a successful `cancel` (status correctly becomes `Cancelled`), the same contract's own detail response still reports `hasAssignedWorker: true`, and the `workerAssignments` array shows the assignment with `isActive: true, endedAt: null` — i.e. genuinely still open, not just a stale cached read. The *pool-level* "is this worker available for a new contract" count does update correctly (confirmed separately — cancelling freed the worker up for a new assignment), so the practical booking conflict is avoided, but the cancelled contract's own record is left permanently inconsistent with its actual status: any report, filter (`WithoutAssignedWorker`), or downstream feature that trusts the contract's own `hasAssignedWorker`/`workerAssignments` fields rather than re-deriving availability from scratch will see a cancelled contract as if it still has a live worker on it.

## 🔴 CRITICAL — warranty-return's calculated refund amount ignores what was actually paid (newly found, backend, cannot be fixed from this repo)

Missed in the first pass — the warranty-return payload was never inspected, only its status code. Caught by an Opus audit round, re-confirmed live: on the test contract, exactly **1 SAR** was ever recorded as paid (`totalPaid: 1`), yet the warranty-return record calculated `refundAmount: 2101.39` — a figure in the same range as the contract's total value (`totalCost: 2225`), not the amount actually received. If a refund of this size were ever actually issued against a contract that was never meaningfully paid, that's a direct, real financial loss, not a cosmetic bug — on the module the business runs its revenue on. This needs urgent backend investigation into whether `refundAmount` is computed from `totalCost`/offer value instead of `totalPaid`, and whether any downstream process (accounting, vouchers) actually acts on this number.

## 🟠 HIGH — the known 2nd-payment bug is confirmed still broken (backend, cannot be fixed from this repo)

Project memory (21 days old at test time) documented this as a critical unfixed backend bug: recording a second payment on any mediation contract that already has one payment fails with a generic EF Core save exception. **Re-confirmed live, unchanged**: the first payment succeeded (`totalPaid` correctly updated), every subsequent payment attempt failed with the identical error signature — `"An error occurred while saving the entity changes. See the inner exception for details."` — and `totalPaid` correctly stayed unchanged (no partial/corrupt write). Do not attempt a frontend workaround, per the existing memory note.

## 🟡 MEDIUM — `warranty-return` also produces the same generic crash on a second call — correction: not confidently the same root cause as the payment bug

An earlier draft of this report grouped this with the payment bug as likely sharing a root cause. **An Opus audit round pushed back on that, correctly**: `warrantyReturn` is a 1:1 relationship on the contract (a second call is plausibly hitting a unique-constraint conflict — arguably *correct* rejection behavior, just poorly surfaced as a raw exception instead of a clean validation message), whereas `payments` is a 1:many collection where a second insert should be entirely legitimate. Separately, by the time the second warranty-return call in this test ran, the contract had already been manually reset to `Draft` by an intervening `update-status` call in the same test sequence — so the failure may simply reflect an invalid-precondition state, unrelated to the payment bug's cause. Downgraded from "likely the same bug" to: **both endpoints crash with an unhandled generic exception instead of a clean 400 message**, which is worth the backend team's attention as a shared *symptom* (missing validation before `SaveChanges`), without assuming a shared *cause*.

## 🟡 MEDIUM — creating a worker with certain nationality IDs crashes (500), traced to offers referencing nationalities no longer served by the live list (backend, cannot be fixed from this repo)

Found as a side effect of building a realistic test fixture. `POST /api/V1/Worker` with `NationalityId` set to either of two IDs pulled directly from live `MediationContractOffer` records (Kenya, one "Sri Lanka" record) crashed with a bare `500`. Isolated and independently re-verified by an Opus audit round:
- All 12 nationalities currently returned by `GET /api/V1/Nationality` work fine for worker creation (not a sampling artifact — 12 is the confirmed `totalCount`, and this system only has 5 mediation offers total, not a sample of a larger set).
- **`GET /api/V1/Nationality/{id}` returns a bare 404 for all offers' nationality IDs** — they are not resolvable as standalone records — yet the offers still display the correct nationality *name* (e.g. "سريلانكا") when read back, meaning they resolve via some other, more permissive path (a cache, a soft-delete-tolerant join, or historical denormalized data) rather than a true dangling foreign key. **Correction from the first draft**, which called this a "stale FK" — the more accurate read, per the Opus audit, is that these nationality rows are filtered out of (or soft-deleted from) the primary list/lookup, while writes that validate against that same primary source reject them outright.

**Practical consequence, unchanged**: creating a *new* worker matching an *existing* offer's nationality — a natural step when fulfilling a mediation request — crashes. Existing pre-made workers with these nationalities already attached still work fine for contract creation (confirmed by reusing one successfully). Needs backend attention: either repoint the offers' nationality references to currently-listed rows, or make worker creation degrade gracefully instead of crashing when given one of these IDs.

## What's working correctly (verified, not just assumed)

- List filters, pagination (including the `Page`-not-`PageNumber` behavior — the wrong key name is silently ignored, matching the code comment), export, and recruitment-requests all behave correctly.
- `GET /{id}`: proper 404 for non-existent GUID, proper 400 for malformed id.
- Nationality-mismatch validation works correctly: creating a contract with a worker whose nationality doesn't match the offer's nationality is cleanly rejected with a clear message, not a crash.
- The full lifecycle was exercised end-to-end on a real contract, and every transition's *own* stated effect was verified via a follow-up `GET`: create → sign (status → Signed) → payment (totalPaid/paymentStatus updated correctly for the first payment) → delivery-form + sign (status → Delivered) → update-status (status → Draft, by design) → warranty-return (status → Returned — corrected from the first draft, which mistakenly credited this transition to `end-worker-service`) → cancel (status → Cancelled, though see the unended-assignment finding above). Several of the raw log's 400 responses during this sequence were not failures of the endpoint under test — they were duplicate/already-done actions, a consequence of this test design calling each endpoint unauthenticated-then-authenticated in sequence on the same contract (which is itself how several of the auth-bypass findings were discovered) — reconciled against the raw bodies before being written up here, not asserted at face value.
- `end-worker-service` and `assign-worker` both give clean, specific validation errors on invalid preconditions (already-ended, already-assigned) rather than crashing.
- There is no `DELETE` endpoint for mediation contracts by design, consistent with treating them as an immutable financial/audit record; `cancel` is the correct terminal action, used here for all test cleanup.

## Cleanup

Test workers created while investigating the nationality-crash bug (15 total, across the diagnostic pass) were deleted using the status-log-clearing workaround from the Worker Master module; verified live, 0 residue, worker count back to baseline of 14. **Three** test contracts were created during testing — contract #35 (`c5fa5360…`, main pass), #36 (`3af58b43…`, an inline diagnostic run between passes 2 and 3 checking whether `cancel` frees a worker for reuse — not originally tallied here), and #37 (`f42717e0…`, the isolated no-auth re-verification pass). All three were moved to `Cancelled` — the correct and only terminal action available, since this module has no delete endpoint by design — and each cancellation was independently verified via follow-up `GET`.

## Regression

No code was changed in this module, so no `tsc` pass was needed. Every finding was verified via a follow-up `GET` showing the actual resulting state, not just a response status code — including, in this revised version, findings the first draft had gotten wrong or left unverified.

## Opus audit — findings and fixes

An independent Opus review came back **needs-rework on the report itself** (the "nothing to fix" frontend conclusion held up, but the write-up contained real errors), continuing the pattern from module #5:

1. **The headline auth-bypass finding overclaimed two endpoints** (`create`, `cancel`) that had never actually been isolated-tested cleanly — both re-tested and confirmed genuinely unauthenticated, addressed above.
2. **Missed a real bug**: `cancel` doesn't end the contract's own worker-assignment record. Found by directly re-reading a live contract's detail response, not by trusting the original narrative. Added as its own Critical finding.
3. **Missed a financial anomaly**: warranty-return's `refundAmount` was never checked against `totalPaid`. Found by the same direct inspection. Added as its own Critical finding — arguably the most consequential thing found in this module.
4. **Corrected an over-grouped diagnosis**: the warranty-return/payment "shared root cause" claim was weakened to "shared symptom, cause unconfirmed," with two concrete alternative explanations (1:1 vs 1:many relationship; an intervening state reset) that the first draft hadn't ruled out.
5. **Corrected a misattributed transition**: `end-worker-service` did not cause the `Returned` status; `warranty-return` did, per direct re-inspection of the live status history.
6. **Corrected the "dangling FK" framing** for the nationality-crash finding to "soft-deleted/filtered, not truly dangling," based on the `GET /Nationality/{id}` → 404-but-name-still-resolves evidence.
7. **Found a third page file** (`contracts/mediationcontract/add/page.tsx`) with a mutation call site the first draft never opened — confirmed it's also correctly wrapped in try/catch, so no behavioral fix was needed, but the file count and coverage claim were corrected.
8. **Flagged thin cleanup evidence** (no persisted script) — addressed with `mediation-contract-test3-corrections.mjs`, which also carries the re-verification of findings 1-3 above.

No further round was required beyond this one — every point raised was independently re-verified live (not just corrected in prose) before this version was written.
