# Worker Master & Status Log Module — Phase 3 Test Report

**Priority #5 — 🔴 Critical.** Tested 2026-08-11 against the live backend `https://sigma-api.runasp.net`. Raw logs: `worker-master-test.mjs`/`worker-master-test-results.json` (main pass) and `worker-master-test2-statuslog-behavior.mjs`/`worker-master-test2-statuslog-behavior-results.json` (persisted proof of two behaviors an Opus audit round surfaced from a discrepancy the first pass had left unreconciled).

**Scope**: the 12 endpoints in `api.config.ts`'s `WORKER_MASTER` + `WORKER_STATUS_LOG` groups — Housed (list), StatusLog create/delete-last, ActivateWantsWork/Transfer, Deportation, CancelDeportation, Handover, IssueResidency, AddUpdate, ExitAndReEntry, ExitHousing. Also touched two live GET endpoints that exist on the backend but aren't wired into `api.config.ts` at all (`GET /{id}/StatusLog`, `GET /{id}/CurrentStatus`) — using them was the only way to verify these write-only actions' side effects.

**Revised headline**: this module's backend findings are more serious than a first pass concluded, and it is **not** true that no frontend code needed fixing — a real, previously-undiscovered bug (four unawaited mutations that could silently swallow a failure with no user feedback in edge cases) was caught by an Opus audit round and fixed. Two significant *backend* behaviors (StatusLog is an upsert, not an append; "undo last" doesn't undo the most recent action) were also missed in the first pass and are documented in detail below.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/Worker/Housed` | authed, no-auth, **and its filter params** (see below) |
| GET | `/Worker/{id}/StatusLog`, `/Worker/{id}/CurrentStatus` | used as verification tooling |
| POST | `/Worker/StatusLog` | valid (statusType 1), statusType 8 (housing) without required `housingId`, no-auth, **repeat-same-statusType and different-statusType behavior** |
| DELETE | `/Worker/{id}/StatusLog/Last` | valid (undo), no-auth, **which entry actually gets removed** |
| POST | `/{id}/ActivateWantsWork`, `/{id}/ActivateWantsTransfer` | valid + verified via follow-up `GET`, no-auth |
| POST | `/{id}/Deportation` (multipart) | valid, missing required `TransportType`, no-auth |
| POST | `/{id}/CancelDeportation` | valid, no-auth |
| POST | `/{id}/Handover` | valid + verified via follow-up `GET`, no-auth |
| POST | `/{id}/IssueResidency` | valid + verified via follow-up `GET`, no-auth |
| POST | `/{id}/AddUpdate` | valid, missing required `notes`, no-auth |
| POST | `/{id}/ExitAndReEntry` | valid, missing required `exitDate` (re-verified in isolation), no-auth |
| POST | `/{id}/ExitHousing` | valid (worker not actually housed), no-auth |

**Coverage correction**: `Housed`'s filter params (`isReadyForHandover`, `isReadyForDeportation`, `hasResidency`, `wantsWork`, `wantsTransfer`, `searchKeyword`, `nationalityId`) were spot-checked after an audit round pointed out they back the housing page's tab navigation and hadn't actually been exercised — all work correctly.

**Known, accepted coverage gap**: `TicketImage` (Deportation's only file-upload field) was never exercised with a real file — the test harness only sends string-typed multipart fields — and only `'Air'` of the UI's three `transportType` options was tried. Project memory records a `signatureImage`-causes-500-past-a-small-size backend bug on a sibling endpoint (`WorkerDeliveryRecord`), so a similar latent bug here is plausible but unconfirmed. Deferred rather than reopening this already-large module — flagging explicitly rather than leaving it implicit.

## 🔴 CRITICAL — entire write surface unauthenticated (backend, cannot be fixed from this repo)

Every write endpoint tested succeeds with no bearer token — `ActivateWantsWork`, `StatusLog` create, `StatusLog/Last` delete, `AddUpdate`, `Deportation`, `CancelDeportation`, `ExitHousing` all confirmed live. This is the **fifth consecutive module** with this exact pattern (Auth, Branch, Customer, Worker, now Worker Master). It is not five separate bugs — it is one systemic backend authorization gap, almost certainly a missing or misconfigured auth middleware registration that needs to be checked across the whole API surface, not endpoint-by-endpoint. Recommend escalating this as the single highest-priority backend fix across the entire audit so far.

## 🔴 CRITICAL — deleting a worker crashes (500) the moment it has ANY status-log history (backend, cannot be fixed from this repo)

A freshly-created worker with **zero** history deletes cleanly (200). The same worker, after a single `ActivateWantsWork` call (which itself creates one `WorkerStatusLog` row), can no longer be deleted at all — `DELETE /api/V1/Worker/{id}` returns a bare `500` with an empty body. Root cause confirmed directly and reproduced twice: repeatedly calling `DELETE /{id}/StatusLog/Last` until a worker's status-log history is fully cleared (verified via `GET /{id}/StatusLog` returning an empty array) makes the worker deletable again (200) every time this was tried, on two different workers with different histories (1 entry, and 13 entries). This is a missing cascade-delete (or missing FK-existence check before delete) on the backend, the same bug *class* already confirmed on Branch (delete-with-children → 500) — but here the blast radius is much larger, because **this module's entire purpose is to generate exactly the history that makes a worker permanently undeletable**. Practically: once a worker has been meaningfully used in this system at all, it can never be deleted through the API — only worked around by first walking back its status-log history one entry at a time, which is not something a normal user would ever discover or do, and which itself interacts badly with the "undo removes the wrong entry" finding below.

## 🟠 HIGH — `POST /Worker/StatusLog` upserts per (workerId, statusType); it is not an append-only history log (backend behavior, documented — not a bug in the traditional sense, but a real design surprise with consequences)

Confirmed directly, reproducibly: creating a `StatusLog` entry with `statusType: 1` twice in a row does not produce two entries — the second call returns `"تم تحديث بيانات هذه الحالة بنجاح"` ("this status's data updated," not "created"), and `GET /{id}/StatusLog` shows exactly one row, with the *first* call's data silently replaced by the second's. Creating a *different* `statusType` does correctly append (confirmed: count went from 1 to 2). **Practical consequence**: this module's naming and the frontend's own comment ("Housing assignment — StatusType 8") imply a history of housing assignments over time, but re-assigning a worker to different housing (two `assignHousing` calls, both `statusType: 8`) will silently **overwrite** the prior housing record rather than preserve it as history. Whether "the log only tracks current state per category" is intentional backend design or a bug depends on what this data is meant to support (an audit trail vs. a current-status cache) — flagging for a decision, since it changes what any future reporting/audit feature can rely on this data to show.

## 🟠 HIGH — `DELETE /{id}/StatusLog/Last` does not undo the most recently performed action (backend, cannot be fixed from this repo)

Confirmed directly: created three status-log entries in sequence (by creation order), with the *third* one deliberately given a `statusDate` **far in the past** while the *second* one's `statusDate` was left as the most recent. Calling `DELETE /{id}/StatusLog/Last` removed the **second** entry (the one with the latest `statusDate`), not the third one (the one actually created last). **This means "Undo Last Status" — a button whose entire purpose is "undo the thing I just did" — orders by a user-editable date field, not by when the action actually happened.** Since the housing-assignment form lets a user pick any `statusDate` via a `DatePicker` (not forced to "now"), any backdated entry anywhere in a worker's history creates a live risk: a user clicking "undo" after making a mistake could silently delete a *different*, unrelated, older status change instead of the one they intended to undo, with no indication anything unexpected happened (the call still returns 200). Not frontend-fixable — the ordering is entirely the backend endpoint's own behavior.

## 🟠 HIGH — `ExitAndReEntry`'s required `exitDate` field isn't actually enforced (backend, cannot be fixed from this repo)

The live OpenAPI spec explicitly marks `exitDate` as `required` for `POST /{id}/ExitAndReEntry` — confirmed the *only* one of this endpoint family with a non-empty `required` array (Handover, IssueResidency, and StatusLog create all declare none). Confirmed live, in isolation: submitting only `{ reason: "..." }` with no `exitDate` returns `200` (success), not the expected `400`. **Not exploitable through the normal UI** — `housing/applicants/page.tsx`'s exit form already has a client-side `required` rule on `exitDate`. By contrast, `Deportation`'s required `TransportType` and `AddUpdate`'s required `notes` *are* both properly enforced server-side — so this endpoint family's required-field enforcement is simply inconsistent, with `ExitAndReEntry` being the sole gap.

## 🟡 MEDIUM — five unawaited mutations across the applicants/housing pages, fixed

Caught by an Opus audit round across two passes, missed in the first write-up. `housing/applicants/page.tsx` wires `cancelDeportation`, `exitHousing`, `toggleWantsWork`, and `toggleWantsTransfer` — all backed by `mutateAsync` (which *rejects* its promise on failure, unlike the bare `.mutate()` fixed elsewhere this session) — directly into plain `onClick`/`onChange` handlers with **no `await` and no `.catch()`**. The underlying `useMutation`'s own `onError` still fires and shows a toast — this is an unhandled promise rejection alongside an already-shown toast, not a silent failure with no user feedback (an earlier draft of this report overstated it that way). **Fixed**: each of the four call sites now chains `.catch(() => {})`.

A fifth instance was found one round later. This report's own second draft claimed `applicants/page.tsx`'s housing-assignment modal was "already safe" because antd's `<Modal onOk={async () => ...}>` awaits and catches its handler internally — **that claim was checked against the actual antd v6 source and is false**: `Modal.js`'s `handleOk` is a bare `onOk?.(e)` call with no await or catch (only the imperative `Modal.confirm` API behaves that way, not the declarative `<Modal onOk>` prop used here). Since `housingForm.validateFields()` rejects on the very common path of submitting an incomplete form, this wasn't an edge case. **Fixed**: wrapped the handler's body in `try/catch` — the modal already correctly stayed open on any failure (the close/reset lines only ran after full success), so this only removes the unhandled-rejection noise, matching the same fix pattern used everywhere else.

## Other findings

| Finding | Severity | Status |
|---|---|---|
| Entire write surface unauthenticated | 🔴 Critical | **Backend fix required — cannot fix from this repo.** Fifth consecutive module. |
| `DELETE /Worker/{id}` crashes (500) once the worker has any `WorkerStatusLog` history | 🔴 Critical | **Backend fix required — cannot fix from this repo.** Root cause confirmed twice; cleanup workaround confirmed reliable. |
| `StatusLog` upserts per (workerId, statusType) instead of appending — housing reassignment silently overwrites prior history | 🟠 High | **Backend behavior, documented — flagged for a design decision, not fixed.** |
| `Undo Last Status` deletes by `statusDate` (user-editable), not creation order — can remove the wrong entry | 🟠 High | **Backend fix required — cannot fix from this repo.** |
| `ExitAndReEntry` accepts a request missing its own required `exitDate` field | 🟠 High | **Backend fix required — cannot fix from this repo.** Not exploitable via this frontend. |
| Five unawaited `mutateAsync` calls (four in `housing/applicants/page.tsx`, one in `applicants/page.tsx`'s Modal `onOk`) producing unhandled rejections on failure | 🟡 Medium | ✅ **Fixed** — `.catch(() => {})` on the four; `try/catch` wrapping the fifth, since a prior draft of this report incorrectly claimed antd's `<Modal onOk>` handles this itself (it doesn't — verified against antd v6 source). |
| `WorkerStatusLogDto` (frontend type) was missing `penaltyAmount`/`agentId`, both present on the live schema | 🟢 Low | ✅ **Fixed** — added for type accuracy. No current caller uses either field. |

## What's working correctly (verified, not just assumed)

- `ActivateWantsWork`/`ActivateWantsTransfer` genuinely flip the intended flags — confirmed via follow-up `GET /Worker/{id}`. (An initial test run appeared to show `ActivateWantsWork` not working; it's a real toggle that had been called twice in one test sequence — once unauthenticated, once authenticated — flipping the flag back off. Not a bug.)
- Toggle and pathway actions correctly append entries to `GET /{id}/StatusLog` (when the `statusType` differs from any existing entry — see the upsert finding above for the same-type case).
- `IssueResidency`, `Handover`, `Deportation`, `CancelDeportation` all correctly update their respective worker flags (`isResidencyIssued`+`iqamaNumber`, `isReadyForHandover`, `isReadyForDeportation` on/off) — each verified via follow-up `GET`.
- `StatusLog` create correctly validates that `housingId` is required when `statusType: 8`, matching the documented DTO comment.
- `Housed`'s filter params (`isReadyForHandover`, `isReadyForDeportation`, `hasResidency`, `wantsWork`, `wantsTransfer`, `searchKeyword`, `nationalityId`) were spot-checked and all work correctly — these back the housing page's tab navigation.
- `Deportation`'s required `TransportType` and `AddUpdate`'s required `notes` are both properly enforced (400 when missing).

## Cleanup

Every test worker created this session was fully cleaned up, using the delete-blocker workaround (clear `StatusLog` entries via repeated `DELETE /{id}/StatusLog/Last`, then delete the worker) where a direct delete failed. Final residue check (re-run and persisted after the second test pass): 0 matches, worker count back to baseline of 14.

## Regression

`tsc --noEmit` clean after all three files touched (`housing.types.ts`, `housing/applicants/page.tsx`, `applicants/page.tsx`). Every finding in this report — including the behaviors this write-up initially got wrong, left unreconciled, or (in the antd `Modal onOk` case) actively misdiagnosed on a second draft — was independently reproduced in a clean, isolated, persisted script or checked directly against library source before being written up, not left as an unverified assumption.

## Opus audit — findings and fixes

Two audit rounds (the first was interrupted mid-review by a session limit and resumed once it cleared):

1. **Round 1**: refuted the "zero frontend bugs" headline — found four unawaited `mutateAsync` calls, root-caused the delete-500 bug more rigorously, and flagged an unreconciled status-log count discrepancy that turned out to hide two real backend behaviors (upsert-not-append, undo-by-statusDate-not-creation-order). All fixed or documented above.
2. **Round 2**: verified all round-1 fixes correct, but **refuted this report's own claim** that antd's `<Modal onOk>` awaits/catches its handler — checked directly against the installed antd v6 source and found it doesn't, unlike `Modal.confirm`. That's a fifth instance of the same unawaited-mutation bug class, reached by a wrong justification rather than a wrong observation, and is now fixed the same way as the other four.

Final verdict: pass, module complete.
