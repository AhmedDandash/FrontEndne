# Journal Entries & Posting Module — Phase 3 Test Report

**Priority #8 — 🔴 Critical.** Tested 2026-08-12 against the live backend `https://sigma-api.runasp.net`. Raw logs (scratchpad): `je-test1.mjs`/`-results.json` (list/get/create validation), `je-test2-lifecycle.mjs`/`-results.json` (full lifecycle, first auth pass — one result confounded, see below), `je-test3-isolated-auth.mjs`/`-results.json` (isolated re-verification of the auth-gap findings), `je-test4-closed-year.mjs`/`-results.json` (closed-fiscal-year gating). A 30-day-old memory note (`journal-entry-module.md`) claimed manual JE create crashes with a 500 — re-verified live as part of this pass; see below.

> **Round-2 corrections (post Opus audit):** the Opus audit of the round-1 report confirmed the headline auth-bypass finding as cleanly evidenced, but caught a misdescribed control test in the DELETE-500 section, a false "all module test data cleaned up" claim (one entry was left behind), and imprecise phrasing on the closed-year test. All three were re-investigated live and are corrected in place below, marked **[round 2]**. The DELETE-500 root cause turned out to be broader than originally reported — see that section.

## Headline: full CRUD auth bypass on JournalEntries, but Posting/Unposting correctly require a token

**Create, Update, and Delete on `/api/V1/JournalEntries` are all unauthenticated.** Each was isolated-confirmed independently (not inferred from a single confounded run — pass 2's first no-auth-UPDATE check ran an authenticated update right after it, which could have masked the result, so pass 3 re-ran each check in true isolation with nothing else touching the record in between):

- **CREATE**: a request with no bearer token (valid `X-Branch-Id` header) returned `200` and a real entry number; confirmed via follow-up `GET` that it genuinely persisted.
- **UPDATE**: on a fresh, isolated seed entry, a no-token `PUT` returned `200` with a real success message (`"تم تعديل القيد بنجاح"`); a follow-up `GET` confirmed the new description/amounts it submitted were genuinely saved.
- **DELETE**: on a second fresh, isolated seed entry, a no-token `DELETE` returned `200`; a follow-up `GET` returned `400` (this controller's not-found status), confirming it was genuinely gone.

**Posting and Unposting, by contrast, correctly require authentication** — both return `401` with no token. This caps the direct financial blast radius (an anonymous caller cannot write a ledger movement without a token), but the CRUD gap is still serious on its own: anyone can create clutter/spoofed Draft entries, or edit/delete a legitimate accountant's in-progress Draft entry before they get a chance to post it — a data-integrity and denial-of-service risk on the accounting module's own source records. This is the same systemic no-auth pattern found in Modules #1–6, breaking from Module #7's mostly-authenticated pattern.

## ✅ No longer reproduces this session: the documented "manual create → 500" bug

The 30-day-old memory note stated `POST /JournalEntries` with a valid, balanced, real-account body crashed with an empty-body `500` (reproduced 6 ways in that session). Re-tested live across this session — **13 of 13 valid balanced creates succeeded (200)**, each one verified as genuinely persisted via follow-up `GET`. **[round 2, hedged]** That's solid evidence it doesn't reproduce *today*, but one session's worth of successes against a 6-way reproduction 30 days ago isn't enough to confidently call this "fixed" — it could equally be intermittent (data-dependent, environment-dependent, or since-patched-and-re-broken). Stated as "no longer reproduces" rather than "resolved"; worth a quick re-check before fully closing this out. Memory updated accordingly.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/JournalEntries` | anonymous, authed, status/source/referenceType filters, search, entryNumber, pagination, amount-range filters, empty result |
| GET | `/JournalEntries/{id}` | valid, no-auth, non-existent, malformed |
| POST | `/JournalEntries` (create) | no-auth+no-header, no-auth-with-header (the auth gap), empty body, <2 lines, 0 lines, unbalanced, invalid accountId, missing description, valid create, create inside a closed fiscal year |
| PUT | `/JournalEntries/{id}` (update) | no-auth (isolated, the auth gap), valid update, verified persistence |
| DELETE | `/JournalEntries/{id}` | no-auth (isolated, the auth gap), valid delete on Draft, blocked on Posted, crash on any system-sourced entry whether its source is live or dangling (new finding) |
| POST | `/Posting/{journalId}` | no-auth (401, correctly gated), valid post, double-post, post inside a closed fiscal year |
| POST | `/Posting/{id}/unpost` | no-auth (401, correctly gated), valid unpost, double-unpost, unpost of the system year-closing entry |
| GET | `/Ledger/general-ledger` | used as an independent oracle to verify posting writes a real ledger line and unposting removes it |

## 🟠 MEDIUM — new backend bug: `DELETE` crashes (500) on ANY system-sourced entry, whether or not its source record still exists (backend, cannot be fixed from this repo)

Found while sweeping for residual test data: 14 system-generated journal entries left over from Modules #6/#7's contract testing (`source=Payment/Contract/Adjustment`, all still `Draft`, each carrying a `sourceId` pointing at a test contract already deleted in those modules' own cleanup) **all failed to delete with a bare empty-body `500`**.

**[round 2, corrected root cause]** Round 1 attributed this specifically to the *dangling* `sourceId` (a reference to an already-deleted contract), based on a control test that turned out to be misdescribed — the control entry used the backend's default `restrictionTypeId`, not the same one the residual entries carried, so it didn't actually isolate anything. Re-ran a proper discriminating test live: created a fresh Employment Operating Contract, took it through terminate (generating two real source-linked Draft journal entries, `source=10` and `source=12`, both pointing at the contract via `sourceId` **while the contract was still fully alive**), and attempted to delete one of those entries immediately — **still crashed with `500`**, even though the source record it pointed to was live and fetchable. Deleting the other after the contract was subsequently removed (making its reference dangling) also crashed with `500` — same result either way.

So the actual rule is broader and simpler than first reported: **any Draft journal entry with a non-manual source (`referenceType != 0`, non-null `sourceId`) cannot be deleted through this endpoint at all — regardless of whether the linked source record still exists.** A genuinely manual entry (created directly through this module, `referenceType = 0`, `sourceId = null`) deletes cleanly every time; anything system-generated does not. The "dangling reference" framing was incorrect — a live reference crashes identically.

**Real-world impact**: no auto-generated journal entry (from a contract, payment, or adjustment) can ever be deleted through this endpoint, at any point in its lifecycle, whether its source is alive or gone. The 14 residual entries found here — plus 2 more created in the course of isolating this root cause (see Cleanup) — are stuck as unremovable residue.

## 🟡 MEDIUM — 6 UI action handlers fired `mutateAsync` without awaiting or catching it (frontend, fixed)

Both the list page and the detail drawer expose Post/Delete/Unpost as `mutateAsync` (matching the module's memory-documented `EntryFormDrawer.handleSave` fix pattern) — but that try/catch discipline was applied only to Create/Update/Save-and-post in `EntryFormDrawer.tsx`, not to the other 6 call sites:

- `src/app/accounting/journal-entries/page.tsx` — 3 row-action `Popconfirm.onConfirm` handlers (`postEntry(record.id)`, `deleteEntry(record.id)`, `unpostEntry(record.id)`) called their `mutateAsync` function directly with no `await` and no `.catch()`.
- `src/app/accounting/journal-entries/_components/EntryDetailDrawer.tsx` — `handleDelete`/`handlePost`/`handleUnpost` all did `await xEntry(entry.id)` with no try/catch.

In both places, any rejection (a business-rule 400 like delete-blocked-on-Posted, the closed-year post rejection, or a network error) became an unhandled promise rejection — the mutation's own `onError` still shows a toast, but in dev this also triggers Next's red overlay, and it's generally sloppy error handling regardless of environment.

**Fixed**: `page.tsx`'s 3 handlers now append `.catch(() => {})`; `EntryDetailDrawer.tsx`'s 3 handlers are now wrapped in try/catch (mirroring the pattern the module's own `EntryFormDrawer.handleSave` already used).

## What's working correctly (verified, not just assumed)

- **Business-rule validation, all backend-enforced and confirmed live**: unbalanced entries rejected (400), fewer than 2 lines rejected (400), 0 lines rejected (400), invalid `accountId` rejected (400), double-post rejected (400), double-unpost rejected (400), deleting a Posted entry blocked (400). **[round 2, added]** Updating a Posted entry is also correctly blocked (400, `"لا يمكن تعديل قيد تم ترحيله"` — "cannot edit a posted entry"), verified live with a follow-up `GET` confirming the values and ledger line were untouched — this was the highest-value untested business rule flagged by the audit and is now confirmed correct.
- **Posting/unposting genuinely move the ledger, not just a status flag**: verified independently via `GET /Ledger/general-ledger` — a posted entry's line appears in the Cash account's ledger with the correct amount and entry number; after unposting, that same line is gone. Confirmed on a disposable entry created solely for this check.
- **Closed-fiscal-year gating is real, not just a frontend cosmetic disable**: creating a Draft entry dated inside the closed 2025 year is allowed (harmless — Drafts don't touch the ledger) and this create *did* genuinely persist a new entry, which was deleted immediately after as part of the same check. `POST /Posting/{id}` on that entry, and an attempt to unpost the system's own 2025 year-closing entry, were both correctly rejected (400) — the backend prevents an already-closed year from being reopened by unposting its closing entry, which would otherwise silently desync `PeriodClosing.isClosed` from reality. **[round 2]** Independently re-verified current live state: `GET /PeriodClosing` still shows 2025 `isClosed: true` with the same `closedAt`/`closingJournalEntryId`, and the closing entry itself is still `status: 1` (Posted) — nothing was left in a bad state.
- **[round 2, added]** `X-Branch-Id` is not enforced as an actual ownership/authorization check on Posting, only validated as a well-formed GUID: posting an entry while sending a completely fake, non-existent branch GUID in `X-Branch-Id` still succeeded (200). This matches the systemic pattern already documented across other modules this session (the header gates on shape, not membership) — noted here for completeness rather than as a new category of bug.
- **Not tested**: role-based authorization on `Posting`/`Unposting` (only token-present-vs-absent was checked, not whether a non-privileged authenticated user is blocked) — consistent with the same gap left open in every module tested so far this session, since the app has no role-scoped permission checks to test against yet.
- **List/filter/pagination/search** all behave as documented in memory: numeric status/source/referenceType codes work, `Source=System` (string) still returns 0 rows (the string-vs-numeric quirk from the memory note reproduces identically), `EntryNumber` exact-match and free-text `Search` both work server-side, amount-range filters work.
- **`GET /{id}`** returns `400` (not `404`) for both non-existent and malformed ids — this is just this controller's own convention (differs from the flat-object/404 conventions seen in other modules), not a defect.
- Omitting `description` on create succeeds (200) even though the frontend form requires it — the backend schema correctly marks it nullable; a deliberate stricter-than-API frontend UX choice, not a bug.

## Cleanup

**[round 2, corrected]** Round 1 claimed all of this module's own test entries were deleted and verified gone — that was false; one entry (`JE-2026-50166374`, a control record used to test the restrictionTypeId hypothesis) was left behind and only caught by the audit's own residue sweep. It has now been deleted and verified gone, along with every other entry created directly by this module's testing, including a later branch-scope-check entry (posted, then correctly unposted, then deleted — cleanup requires unposting first since Posted entries can't be deleted directly, a step missed on the first attempt and corrected immediately).

A residue sweep turned up **14 pre-existing entries left over from Modules #6/#7's contract testing** (their `description`s reference cancel/refund/termination QA scenarios from those modules, not this one). Attempting to clean these up (in scope here since they surfaced during this module's own hygiene check) is what led to discovering the DELETE-500 bug above — all 14 deletions failed with `500`. Re-diagnosing the bug's true root cause required creating one more disposable contract and letting it generate 2 more system-linked Draft entries (`50dda5a3…`, `2fab4d7a…`) to test deletion against a *live* source record — both also failed to delete with the same `500`, which is exactly what proved the root cause is broader than "dangling reference" (see above). Those 2 entries could not be cleaned up either, for the same reason; the disposable contract itself was successfully deleted.

**Final accurate residue: 16 entries** (14 from Modules #6/#7 + 2 created during this module's own root-cause diagnosis), all Draft, all inert (never posted, zero ledger impact), all currently undeletable due to the backend bug documented above. Documented here in full rather than understated.

## Regression

`tsc --noEmit` clean after the fix (`page.tsx`, `EntryDetailDrawer.tsx` — two files changed). The Browser pane was unresponsive when attempting live verification (consistent with prior modules this session where the dev server/browser pane were unavailable) — not separately browser-verified, but the change is type-checked and structurally identical to the already-shipped, memory-documented `EntryFormDrawer.handleSave` fix in this same codebase.

## Round-2 audit summary

The Opus audit (round 1) returned **pass-with-notes**: the headline auth-bypass claim (CREATE/UPDATE/DELETE all unauthenticated) was independently walked through against the raw evidence and confirmed clean and properly isolated — explicitly not a repeat of Module #6's earlier overclaim. The closed-year test was independently re-verified live as safe (2025 still closed, closing entry still posted, nothing broken). The frontend fix (6 call sites across 2 files) was confirmed correct and complete, with no missed consumers — the hook is used nowhere else in the repo. Two real gaps were found and are corrected above: the DELETE-500 root cause was mischaracterized (dangling-reference framing, when the actual cause is any non-manual source reference, live or dangling) based on a control test that didn't actually isolate what it claimed to, and the cleanup section falsely claimed zero leftover test data when one entry remained. Both were re-diagnosed and corrected with fresh live evidence; the "resolved" language on the create-500 bug was also hedged to avoid overclaiming a fix from one session's worth of non-reproduction. No further audit round requested by the user at this checkpoint; corrections applied directly per standard practice for the gaps found.
