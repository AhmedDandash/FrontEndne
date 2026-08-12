# Authentication Module — Phase 3 Test Report

**Priority #1 — 🔴 Critical.** Tested 2026-08-11 against the live backend `https://sigma-api.runasp.net`. Raw request/response log: `auth-test.mjs` + `auth-test-results.json` (scratchpad), 42 scenarios across 6 documented endpoints + 1 undocumented one discovered live.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| POST | `/api/V1/Auth/login` | valid, wrong password, unknown email, missing email/password, empty/null body, malformed email, uppercase email, trailing-space password, SQLi-shaped payload |
| GET | `/api/V1/Auth/me` | valid token, no token, malformed token, tampered signature |
| POST | `/api/V1/Auth/refresh-token` | valid, reuse-after-use (rotation), garbage token, missing/empty field |
| PATCH | `/api/V1/Auth/change-password` | wrong current password, missing fields, empty body, weak password, no-auth attempt, valid change + old/new login verification |
| POST | `/api/V1/Auth/add-admin` | no-auth attempt, valid create, duplicate email, missing fields, empty body, login-as-created-user verification |
| POST | `/api/V1/Auth/logout` | no-auth baseline, valid revoke + bearer + branch header, post-revoke reuse check, garbage token, missing field |
| GET | `/api/V1/Auth/test-auth` | **undocumented** — exists live, absent from `api.config.ts`. With/without token. |

**Credential note:** the task's given login (`simga@gmail.com`) had a typo; confirmed correct with the user mid-session (`sigma@gmail.com`). No other credential issue.

## 🔴 CRITICAL — unauthenticated privilege escalation (backend, cannot be fixed from this repo)

`POST /api/V1/Auth/add-admin` returns **200 "Admin user created successfully."` with NO bearer token at all** — the only requirement is a valid `X-Branch-Id` GUID, itself obtainable from the equally-unauthenticated `GET /api/V1/Branch`. The created account logs in normally and receives a JWT with `role: "Admin"` and the full permission list (`hourly.admin.full_access`, etc.), verified live.

This means **anyone with network access to the API — no login, no session, nothing — can mint themselves a full Admin account** with two unauthenticated HTTP calls. This is a backend authorization defect (a missing `[Authorize]`/role check on the `add-admin` action); there is no backend source in this repository, so it cannot be fixed here. **This needs immediate backend-team action** — it is the single most severe finding possible for this module.

**Compounding frontend gap (fixed this session):** the deployed frontend also exposed `/register` (the Add Admin UI) more broadly than intended:
- `middleware.ts` listed `/register` under `publicRoutes` (edge-level, no session check), inconsistent with `MainLayout.tsx`'s own stricter list which did NOT include it.
- The page-permission matrix (`pagePermissions.config.ts`) had no default restriction for `/register` — under this app's "unconfigured = open" model, **any authenticated user of any role**, not just Admins, could reach the Add-Admin form.

**Fix applied:**
- [middleware.ts](middleware.ts) — moved `/register` from `publicRoutes` to `protectedRoutes` (now requires a session at the edge).
- [pagePermissions.config.ts](src/config/pagePermissions.config.ts) — added a `DEFAULT_RESTRICTED_PAGES` override so `/register` is admin-only **by default**, without requiring an admin to manually configure it via Settings first (secure-by-default for this one dangerous page; every other page's existing opt-in behavior is unchanged).

This closes the in-app exploitation path for a logged-in non-admin user. It does **not** close the raw-API path — that remains open until the backend adds real authorization to `add-admin`, and (worth checking once fixed there) likely to `GET /api/V1/Branch` and other unauthenticated GETs used to obtain the branch GUID.

**⚠️ Cleanup could not be completed.** Two disposable test accounts were created during testing to safely exercise `add-admin`/`change-password` without touching your real login. There is **no working delete-user endpoint** for Identity-backed admin accounts — `DELETE /api/Users/DeleteUserById/{id}` returned 404 for both (it appears to target a different/legacy user store than the one `add-admin` writes to), and no other delete/deactivate route exists in the frontend's endpoint inventory. These two Admin accounts are still live in your system:
- `noauth-check-1786442971879@sigma-test.local` (id `bd522fde-d533-4f35-ac31-1c5dcb86b562`)
- `qa-audit-authmodule-1786442971879@sigma-test.local` (id `ed87b5f2-5789-4b44-9fcd-b9720c082d1d`)

Both need manual removal (direct DB access) by whoever owns the backend. This also surfaces a secondary gap: **there is no way for anyone — not even a legitimate admin — to delete or deactivate an admin account once created.**

## Other findings

| Finding | Severity | Status |
|---|---|---|
| `add-admin` unauthenticated write | 🔴 Critical | **Backend fix required — cannot fix from this repo** |
| `/register` reachable by non-admins / at the edge without a session | 🔴 Critical | ✅ Fixed this session (frontend) |
| No delete/deactivate route for admin accounts | 🟠 High | Documented, not fixed (no endpoint exists) |
| Undocumented `GET /api/V1/Auth/test-auth` live on backend, absent from `api.config.ts` | 🟢 Low | Documented only — properly auth-gated (401 without token), looks like a harmless debug/health route. No frontend action needed. |
| Stale code comment claiming `/api/V1/Auth/me` requires `X-Branch-Id` | 🟢 Low | Verified live: **not required**. Comment in [client.ts:52](src/lib/api/client.ts:52) is outdated; the defensive fallback logic it justifies is harmless so left in place, just flagging the inaccuracy. |
| `ChangePasswordRequestDTO` frontend type declares `confirmNewPassword`; live backend DTO has no such field | 🟢 Low | Cosmetic type-contract mismatch, not exercised by the actual UI in a way that breaks anything. No fix applied — not worth the churn. |

## What's working correctly (verified, not just assumed)

- Login: correct credential matching, case-insensitive email, generic "Invalid Email or Password" for both wrong-password AND unknown-email (no user-enumeration leak), proper 400s on missing/malformed body, no SQL-injection behavior on adversarial input, password not silently trimmed.
- `/me`: JWT signature genuinely verified (tampered-signature token correctly rejected with 401), no-token and malformed-token correctly rejected.
- Refresh-token: **single-use rotation is enforced** — reusing an already-used refresh token correctly fails with 401. This is good security practice and was confirmed live, not assumed.
- Logout/revoke: correctly requires a valid bearer token + `X-Branch-Id`; once revoked, the refresh token is genuinely dead (confirmed via a follow-up refresh attempt returning 401).
- Change-password: correctly validates wrong current password, missing fields, and rejects weak passwords (`"1"` → 400) — real server-side password-strength validation exists.

## Opus audit round 1 — findings and fixes

An independent Opus review of this report + the raw test evidence + the diff came back **"needs rework"** and caught two real bugs the first pass missed:

1. **🔴 The `/register` fix was dead code.** `canAccessPage`'s `DEFAULT_RESTRICTED_PAGES` fallback was correct in isolation, but the actual runtime gate — `useCanAccess().check()` in [usePagePermissions.ts](src/hooks/api/usePagePermissions.ts), consumed by both `MainLayout.tsx` (the 403 page gate) and `Sidebar.tsx` (menu visibility) — had its **own, earlier** "matrix entry undefined → allow" short-circuit that returned before `canAccessPage` was ever called. A non-admin with a fresh/unconfigured permission matrix could still reach `/register`. **Fixed**: extracted the "is this page configured" decision into a shared pure function `isPageConfigured()` (in pagePermissions.config.ts) that both `canAccessPage` and `check()` now consult, so the two can't drift apart again. Added 7 regression tests to `pagePermissions-logic.test.ts` covering exactly this gap (`node --test` — all 18 tests pass).
2. **🟠 The real "Log out" button never actually revoked the session server-side.** `AuthService.logout()` called `POST /Auth/logout` with **no body**; live testing proved that shape 400s ("The RefreshToken field is required"), so in the shipped app, clicking Logout cleared local state but left the refresh token live on the backend indefinitely. **Fixed**: `logout()` now reads the stored refresh token and sends it in the body, matching the DTO the backend actually requires. **Retested live**: logout now returns `200 "Refresh token revoked successfully."` and a subsequent refresh attempt with that token correctly 401s (`"Refresh token has been revoked."`) — confirmed against the real backend, not assumed.
3. **🟠 Compounding cookie bug.** `logout()` also only ever cleared the `authToken` cookie, never `refreshToken` — so `middleware.ts`'s edge-level session gate stayed open after logout. Fixed alongside #2 (both cookies now cleared). Also corrected a factually wrong comment in both `client.ts` and `middleware.ts` claiming the refresh cookie is HttpOnly — it isn't (it's set via `document.cookie` client-side in `login()`), so the middleware edge gate is UX convenience, not a real security boundary, and the comments now say so.
4. **🟡 Minor over-claims corrected**: the original report implied `add-admin`'s "created account logs in as Admin" verification chained from the no-auth create (`aa0`); it actually used the token-authed create (`aa1`) — both are real findings, just not one continuous chain. Also newly-noted: admins created via `add-admin` get `branchId: ""` in their JWT (unassigned to any branch).

## Opus audit round 2 — final verdict: PASS WITH NOTES

Independent re-verification (re-traced both fixed code paths line-by-line with an empty matrix for both admin and non-admin roles, and re-ran the test suite itself: 18/18 pass). One residual nit caught: the round-1 fix summary claimed the stale `/api/V1/Auth/me` + `X-Branch-Id` comment in `client.ts` was corrected, but only `middleware.ts`'s comment had been fixed — `client.ts`'s was still wrong. **Fixed**: corrected the comment at `client.ts` (the `getCurrentBranchId()` docblock) to state plainly that `/me` does NOT require `X-Branch-Id` (re-verified live), while explaining the fallback is still needed for write endpoints. No further round required — module complete.

## Regression

- `node --test src/__tests__/pagePermissions-logic.test.ts` — 18/18 pass, including the 7 new cases targeting this exact bug class.
- `tsc --noEmit` clean on all touched files: `middleware.ts`, `pagePermissions.config.ts`, `usePagePermissions.ts`, `auth.service.ts`, `pagePermissions-logic.test.ts`.
- Logout fix retested live end-to-end against the real backend (see #2 above) — not just type-checked.
- `canAccessPage`'s admin bypass (`isAdminRole` short-circuit) still fires before any matrix/default lookup, so legitimate Admins are unaffected by any of these changes — traced explicitly, not assumed.

**Verification gap, still open:** the Browser preview pane and local dev-server HTTP checks were both unresponsive for the entire session (infrastructure issue — `next dev` never reached "Ready" in server logs, unrelated to these code changes). The `/register` redirect fix is verified by unit test + full manual trace of the exact function now used at runtime, not by a live click-through in a running app. Worth a quick manual sanity check on your end before considering this fully closed.
