# Module #15 — HR: Resignation, Custody & Admin — Test Report

**Priority:** 🟠 High | **Endpoints:** 21 | **Dependencies:** Branch, Employee, Role, CustodyType
**Date:** 2026-08-13 (revised after Opus audit — see "Audit corrections" section)

## Scope

- `HR_RESIGNATION_REQUEST` — GetAll, Create, Approve, Reject (4)
- `HR_CUSTODY_REQUEST` — GetAll, Create, Approve, Reject, GetTypes, GetType, CreateType (7)
- `HR_REQUESTS_INBOX` — Filter (1)
- `HR_REQUESTS_OUTBOX` — Filter (1)
- `HR_ADMIN` — AddUser, AssignRole, RemoveRole, AllUsers, AllRoles, Positions, CreatePosition, DeletePosition (8)

Total 21, matches the master priority table. All 21 endpoints now have direct live test evidence (see "Audit corrections").

## Results Summary

| Result | Count |
|---|---|
| Passed (correctly secured / correctly functioning) | 13 |
| Backend findings (not frontend-fixable) | 1 critical (8 endpoints), 1 medium (1 endpoint, isolation-confirmed) |
| Frontend bugs found & fixed | 7 files |
| Blocked | 0 |

13 passed + 8 endpoints under the one critical Admin finding = 21.

## HEADLINE FINDING — CRITICAL: Unauthenticated privilege escalation via `/api/V1/Admin/*`

This is the most severe finding of the entire 15-module audit to date. Every endpoint under `/api/V1/Admin/*` — the app's entire user-and-role administration surface — accepts requests **with no bearer token at all**. This is a **backend** authorization gap, not a frontend defect (the frontend correctly sends the token on every call; the backend simply doesn't check it on this controller).

Isolated, live-verified, each confirmed via an independent authenticated follow-up GET showing real persistence:

| Endpoint | No-auth result |
|---|---|
| `GET all-users` | 200 — exposed 20 real accounts' names/emails/roles, including the test operator's own Admin-role account |
| `GET all-roles` | 200 — exposed full role list |
| `GET positions` | 200 |
| `POST add-user` | 200 — created a real account with `role: "Admin"` specified at creation time, zero auth |
| `POST assign-role` | 200 — added `role: "Owner"` to the test account, zero auth |
| `POST remove-role` | 200 — removed `"Owner"`, zero auth |
| `POST create-position` | 200 — zero auth |
| `DELETE delete-position/{id}` | 200 — zero auth |

Full role list observed: `Employeee, Admin, Agent, SalesEmployee, FollowUpEmployee, AccountingEmployee, CustomerServiceEmployee, ComplaintEmployee, Owner, Employee, Supervisor, Driver, MobileCustomer`.

**Practical impact:** anyone who can reach the API (no login required) can grant themselves `Owner` or `Admin` on a brand-new account, or reassign roles on any existing account, with a single unauthenticated POST.

**Secondary finding (medium), now isolation-confirmed:** authenticated `remove-role` returns an empty-body `500` specifically when removing a user's *last* remaining role, though the removal still takes effect server-side despite the crash. Re-tested in isolation (`hr15-test5-gaps-fix.mjs`, section 4): took the disposable test account from `roles: []` → assigned exactly one role (`Employee`) → removed that single role as the only state change. The `500` reproduced on that single, isolated removal (empty response body), and the follow-up GET confirmed `roles: []` afterward — so the crash is real and specifically tied to "this is the account's last role," not an artifact of the account's prior history. Not security-critical, but the 500 with no error payload will break any UI that tries to surface a real error message.

**Strong positive contrast:** Resignation Request, Custody Request, Custody Types, Requests Inbox, and Requests Outbox all correctly return `401` for every anonymous read *and* write tested. Proper auth exists right next to the catastrophically unsecured Admin sub-module within the same priority-table entry — this is not a project-wide "auth is off" situation, it's isolated to `/api/V1/Admin/*`.

**Test methodology (isolated, minimal blast radius):** used exactly one clearly-marked, permanently unremovable test account (`qa.module15.privesc.test@sigma-audit-test.invalid`, `fullName: "QA MODULE15 PRIVESC TEST — DO NOT USE"`) for the entire add-user → assign-role → remove-role chain (and its later last-role-removal isolation retest), then left it de-privileged (`roles: []`) at the end (no delete-user endpoint exists, so this is the best achievable cleanup). The temporary test position created during the create-position/delete-position isolation check was fully removed by the (also-unauthenticated) delete call itself, verified via follow-up GET.

## Frontend Findings & Fixes

All seven findings are the same recurring bug class seen throughout this session: a mutation call with no `try/catch`/`.catch()`, bound to a UI control (`Modal onOk`, raw button `onClick`, or a `Popconfirm onConfirm` piped through a `.finally()`-only helper) that does not itself await or catch rejections — so a failed mutation surfaces only as an unhandled promise rejection in the console instead of being cleanly swallowed after the mutation's own `onError` toast already told the user.

| File | Handler(s) | Fix |
|---|---|---|
| [src/app/hr/admin-users/page.tsx](src/app/hr/admin-users/page.tsx) | `handleAddUser`, `handleRoleAction` (both bound to plain `<Modal onOk>`) | Wrapped in `try/catch` |
| [src/app/hr/resignation-request/page.tsx](src/app/hr/resignation-request/page.tsx) | `handleSubmit` (raw button `onClick`) | Wrapped in `try/catch` |
| [src/app/hr/resignation-requests/page.tsx](src/app/hr/resignation-requests/page.tsx) | `runAction` (feeds `Popconfirm onConfirm`) | Added `.catch(() => {})` before the existing `.finally()` |
| [src/app/hr/custody-request/page.tsx](src/app/hr/custody-request/page.tsx) | `handleAddType` (plain `<Modal onOk>`), `handleSubmit` (raw button `onClick`) | Both wrapped in `try/catch` |
| [src/app/hr/custody-requests/page.tsx](src/app/hr/custody-requests/page.tsx) | `runAction` (feeds `Popconfirm onConfirm`) | Added `.catch(() => {})` before the existing `.finally()` |
| [src/app/hr/positions/page.tsx](src/app/hr/positions/page.tsx) | `handleSubmit` (plain `<Modal onOk>`), delete `Popconfirm onConfirm={() => deletePosition(record.id)}` | `handleSubmit` wrapped in `try/catch`; delete call given `.catch(() => {})` |
| [src/app/settings/custody-types/page.tsx](src/app/settings/custody-types/page.tsx) | `handleOk` (plain `<Modal onOk>`) | Wrapped in `try/catch` |

The last two (`positions/page.tsx`, `settings/custody-types/page.tsx`) were missed in the initial pass — both consume this module's own `HR_ADMIN.CREATE_POSITION`/`DELETE_POSITION` and `HR_CUSTODY_REQUEST.CREATE_TYPE` endpoints and carry the identical bug pattern; found and fixed during the audit-correction pass below.

`npx tsc --noEmit` — clean after all 7 fixes, no new errors introduced.

Confirmed all mutations behind these fixes (`useHR.ts`: `useHRResignationRequest`, `useHRResignationRequests`, `useHRCustodyRequest`, `useHRCustodyRequests`, `useHRCustodyTypes`; `useAdmin.ts`: `useAdminUsers`, `useAdminPositions`) are `mutateAsync` with a proper `onError` handler using `extractApiError()` from `@/lib/api/unwrap` — so every swallowed rejection still surfaces a toast to the user; nothing is silently dropped.

## Endpoint-by-Endpoint Results

### Resignation Request — properly secured (4/4 endpoints tested)
- `GET GetAll` — 401 anonymous; 200 authenticated.
- `POST Create` — 401 anonymous (both with and without `X-Branch-Id`); 200 authenticated + branch header. Discovered a real backend business rule in the process: a second same-day create for the same employee correctly 400s with `"عفواً، لقد قمت بتقديم طلب استقالة في هذا اليوم مسبقاً."` ("you have already submitted a resignation request today") — working as intended, not a bug.
- `POST Approve/{id}` — 401 anonymous.
- `POST Reject/{id}` — 401 anonymous; 200 authenticated (with the same `{}` empty-object body the frontend's `HRResignationRequestService.reject()` actually sends), confirmed via follow-up GET the record's `status` transitioned from 3 (Pending) to 2 (Rejected).

### Custody Request & Custody Types — properly secured (7/7 endpoints tested)
- `GET GetAll`, `GET Types`, `GET Types/{id}` — 401 anonymous; 200 authenticated.
- `POST Create` — 401 anonymous; 200 authenticated, confirmed persisted via follow-up GetAll.
- `POST Types/Create` — 401 anonymous (did not persist, verified); 200 authenticated, confirmed persisted via follow-up GET.
- `POST Approve/{id}` — 401 anonymous (record's status unchanged, verified); 200 authenticated, confirmed via follow-up GET the record's `status` transitioned to 1 (Approved).
- `POST Reject/{id}` — 401 anonymous (record's status unchanged, verified); 200 authenticated (with the `{}` body the frontend's `HRCustodyRequestService.reject()` actually sends), confirmed via follow-up GET the record's `status` transitioned to 2 (Rejected).

### Requests Inbox / Requests Outbox (2/2 endpoints tested)
- `POST /api/V1/RequestsInbox/Filter` — 401 anonymous (with or without branch header); 400 authenticated-but-no-branch-header (`"يجب إرسال X-Branch-Id في الهيدر كـ GUID صالح."`, the same validation-order pattern confirmed across the rest of the app: auth gate first, then branch-header validation); 200 authenticated + branch header, returned **3 real pre-existing records** (dated 2026-04-19, predating this session). A deliberately malformed body (`processState: "not-a-number"`) correctly 400s (ASP.NET model-binding rejection, not a custom validator).
- `POST /api/HR/RequestsOutbox/Filter` — same auth/validation behavior; returned 0 records.
- Note: the codebase comment describing these as "plumbing only, no UI feature exists yet" is accurate re: no frontend page consumes them, but Inbox is **not** empty — it holds 3 real backend records with no UI surface to view them. Not a bug (nothing is broken), just a note that "plumbing" here means real, currently-invisible data, not an empty stub.

### Admin (8/8 endpoints tested) — see CRITICAL finding above
- `GET all-users`, `GET all-roles`, `GET positions`, `POST add-user`, `POST assign-role`, `POST remove-role`, `POST create-position`, `DELETE delete-position/{id}` — all unauthenticated. See above for full detail.

## Audit corrections (this section documents what changed after the Opus review)

An Opus-model audit of the first draft of this report found real problems, all now corrected:

1. **Fabricated "confirmed" claims for endpoints that were never actually called.** The original report's Custody section claimed `Reject` returned "401 anonymous; 200 authenticated," and the Resignation section claimed `Reject` was "401 anonymous" — but the original test script (`hr15-test3-resig-custody.mjs`) gated the custody-reject test behind a `create` call that itself had 401'd, so that block never ran, and never called `ResignationRequest/Reject` at all. **Root cause of the gap:** my original test script called `Reject` with no request body, but both `CustodyRequest/Reject` and `ResignationRequest/Reject` require a `RejectRequestDto` body per the live swagger spec (unlike `Approve`, which takes none) — the frontend's actual service code already sends the correct `{}` empty-object body (`HRCustodyRequestService.reject()` / `HRResignationRequestService.reject()` in `hr.service.ts`), so this was purely a test-script gap, not a frontend bug.

   `hr15-test5-gaps-fix.mjs` (saved script) still reproduces the *no-body* 400 for both endpoints — that's expected and intentionally left in the saved evidence to document the discovery. The **actual** 401-anonymous / 200-authenticated / status-transition evidence in the endpoint tables above comes from two follow-up ad-hoc Node one-liners run directly in the shell (not saved as separate files, since they were single-purpose verification runs) that resend the same calls with the `{}` body the frontend really uses. Their raw output, for the record:
   - `CustodyRequest/Reject/e891886a-9ced-4ef5-aa02-08def904ae22` with `{}` body, authed: `200 {"success":true,"data":"Request rejected","errors":null,"statusCode":200}`; follow-up GetAll shows `status: 2`.
   - `CustodyRequest/Reject` on a fresh disposable record (`6c848089-a6ec-465a-aa03-08def904ae22`) with `{}` body, **no token**: `401`; follow-up GetAll confirms `status` unchanged at `3`.
   - `ResignationRequest/Create` for employee `c6e62d25-3581-4b1c-497c-08dedb607ec1` (a different employee than the one already used today, to avoid the daily-limit rule): `200`, record id `eed5f35c-9435-4173-f40b-08def902a8e5`. `Reject` on that id with `{}` body, **no token**: `401`, status stays `3`. Same call authenticated: `200`, status transitions to `2`.

   Re-verified live a second time during the follow-up audit pass, independent of these scripts, with identical results.
2. **3 of 21 endpoints had never been invoked in any test script**: `ResignationRequest/Reject`, `CustodyRequest/Approve`, `CustodyRequest/Reject`. `CustodyRequest/Approve` wasn't even mentioned in the original report. All three now have direct live evidence (auth-gate + happy-path + status-transition verification) — see the endpoint tables above.
3. **2 frontend files with the identical bug pattern were missed** in the initial fix pass: `src/app/hr/positions/page.tsx` and `src/app/settings/custody-types/page.tsx`, both consuming this module's own endpoints. Now fixed — see Frontend Findings & Fixes.
4. **The remove-role-on-last-role 500 root cause was under-evidenced (n=1, confounded with the account's history).** Re-tested in true isolation (single state change: reach exactly one role, then remove it) — the 500 reproduced. Now a confirmed, not merely inferred, root cause.
5. **Result counts didn't reconcile** (13 passed + 5 fixed ≠ 21, "Blocked: 0" while 3 endpoints were silently untested). Corrected above: 13 passed + 8 endpoints under the one Admin critical finding = 21; frontend-fix count corrected from 5 files to 7.

## Cleanup / Residue

Items that cannot be removed — no DELETE endpoint exists for these entities — disclosed honestly rather than claimed as cleaned:
- **HR Admin test account** `qa.module15.privesc.test@sigma-audit-test.invalid` — permanently exists, left at `roles: []` (best achievable de-privilege given no delete-user endpoint; briefly held role `Employee` mid-audit purely to isolate the last-role-removal 500, then that role was removed again).
- **One real Resignation Request**, `reasons: "QA Module15 valid resignation test"`, status = 3 (Pending) — from the original create test.
- **One additional disposable Resignation Request** created during the gap-fix pass, now status = 2 (Rejected) via the genuine authenticated Reject happy-path test (`reasons: "QA Module15 gap-fix reject test v2"`, id `eed5f35c-9435-4173-f40b-08def902a8e5`). A separate, *earlier* gap-fix create attempt for a different employee correctly hit the daily-limit business rule and never persisted — no record exists from that attempt.
- **Two disposable Custody Requests**, both now resolved (one status = 1/Approved, one status = 2/Rejected) via the genuine authenticated Approve/Reject happy-path tests; a third disposable Custody Request used only for the no-auth-reject isolation check remains status = 3/Pending (the no-auth attempt correctly failed to change it, and no authenticated cleanup follow-up was run since the record itself is harmless test data).
- **One Custody Type**, `nameEn: "QA Module15 gap-fix authed type"` — created during the authenticated happy-path test; no delete endpoint exists for custody types.

One item was fully cleaned: the temporary test position created during the create-position/delete-position isolation check — removed by the (also unauthenticated) delete call itself, verified via follow-up GET.

## Regression

Ran `npx tsc --noEmit` after all 7 fixes — clean. No other module's files were touched. All previously-passing endpoint behavior in this module (properly-secured Resignation/Custody/Inbox/Outbox paths) re-verified unchanged after the frontend fixes (the fixes only changed client-side error handling, not request payloads).
