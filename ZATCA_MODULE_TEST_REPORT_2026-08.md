# Module #23 — ZATCA E-Invoicing — Test Report

**Priority:** 🟠 High | **Endpoints:** 21 tested (15 GET + 6 write) of ~26 frontend-consumed | **Deps:** Branch, Accounting documents
**Date:** 2026-08-13

## Scope
`ZATCA`: Lookups, Dashboard Summary, Health, Branch Context, Connection Test, Diagnostics, Branch Profile update, EGS Units (get+create), Import Credentials, CSR (get+generate), Compliance/Production CSID request, Certificates (get+history+expiration), Settings (global get/put, branch get/put), Invoices (list+by-id), Logs (request list/by-id, submission list) — matches the frontend's actual consumed surface. The backend also exposes a full `ZatcaInvoice` processing controller (process/validate/sign/submit/retry-failed, ~10 more endpoints) that the frontend deliberately does not wire up (view/config-only scope, confirmed via prior-session memory and re-confirmed in code) — out of scope here since no frontend page calls them.

## HEADLINE — First module this session with complete auth enforcement

Every one of the 21 tested endpoints — all 15 reads **and** all 6 writes — correctly returns `401` with no bearer token, branch header alone included. This is the only module across 23 tested so far where writes are properly gated, not just reads. Genuinely well-built compliance module.

## CRITICAL bug — EGS unit creation crashes when set as default, reachable via real UI

`POST /egs-units` returns an uncaught `500` (empty body) when `isDefault: true` is sent for a branch that **already has a default EGS unit**. Bisected and confirmed (independently re-reproduced during audit too): identical full payload with `isDefault: false` succeeds (`200`); only the default-collision triggers the crash. Atomic — no orphan record is left behind by the crash (confirmed via follow-up `GET`, both originally and during audit).

**Reachable through the real UI**: [`branch-setup/page.tsx:266,282-284`](src/app/zatca/branch-setup/page.tsx) has a genuine "Set as default unit" checkbox. It defaults to checked only for a branch's *first* EGS unit (`isDefault: egsUnits.length === 0`) but nothing stops a user from checking it for a second/replacement device — a completely ordinary real-world action ("our device broke, register the replacement as default"). Any user doing this hits the crash.

Not frontend-fixable — the backend needs to either un-default the previous unit gracefully or return a proper validation error instead of crashing.

## Summary

| Result | Count |
|---|---|
| Passed | 20/21 |
| CRITICAL backend bug | 1 (EGS unit default-collision crash) |
| Frontend bugs fixed | 8 |
| Positive finding | Full auth enforcement (unique this session) |

## Evidence note

Several findings below (CSR-generation-is-local-crypto, CSR readiness validation, the real ZATCA-Sandbox compliance-CSID call, and OTP redaction in logs) come from ad-hoc follow-up calls made after the two saved test scripts, not from the saved JSON files themselves — necessary because the saved script's own EGS-unit setup step hit the CRITICAL crash above and never produced a usable `egsUnitId`/`csrRequestId` to chain from. Independently re-verified live during audit for 3 of these 4; not re-verified: the empty-`deviceSerialNumber`-rejects-CSR-generation claim.

## Other findings

- **Seller profile update**: genuine full update correctly flips `branch-context`'s `sellerProfileComplete` from `false` → `true`, missing-fields list clears. Clean.
- **CSR generation is genuinely local crypto** — no external call. Confirmed by response: a real EC private key + CSR PEM generated server-side, `csr` list correctly shows `status: 2/CsrGenerated`.
- **CSR generation validates EGS-unit readiness properly**: attempting it against an EGS unit with an empty `deviceSerialNumber` (the auto-defaulted first unit) correctly `400`s ("Device serial number is required to generate a ZATCA CSR.") — not a crash.
- **Compliance CSID request genuinely contacts the real ZATCA Sandbox** (`gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance`, confirmed via the resulting request log's `endpointUrl` + realistic ~421ms latency). Tested once, deliberately not retried (a real external government sandbox — repeated failed attempts risk rate-limiting, and no real OTP is available in this session to complete it). Correctly `400`s on a fake OTP; failure is cleanly proxied, not a crash.
- **Request logging is well-built**: the compliance-CSID attempt is fully logged (`logs/requests`) with correlation ID, HTTP method, real endpoint URL, timing, and response status — and the log detail endpoint correctly **redacts the OTP** (`"OTP":"****"`) rather than storing it in plaintext. Good security practice, not a bug.
- **Branch settings**: first-time save correctly creates the row (was `404`, now `200` on repeat `GET`) — matches the documented "`PUT` creates on first save" behavior.
- **Global settings**: tested via a strict GET-then-PUT-same-values roundtrip (this endpoint holds real, correctly configured production ZATCA base URLs — deliberately not overwritten with test data). Confirmed idempotent: values unchanged except audit fields (`updatedDate`/`updatedBy`).
- **`pageSize: 0`-on-empty-results quirk confirmed live** (`invoices` list with 0 records returned `pageSize: 0`, not the requested `20`) — matches prior-session documentation; the frontend's `unwrapZatcaPaged()` already guards this correctly, no fix needed.
- Malformed `branchId` on `branch-context` → clean `400` (ASP.NET model-binding rejection); nonexistent `branchId` → clean `404` Arabic message. `invoices/{id}` and `logs/requests/{id}` nonexistent → clean `404`. No crashes anywhere in the read surface.
- Credential import validation is clean: missing `certificatePem`/`privateKeyPem` and invalid `egsUnitId` both `400` (not tested with a real certificate — none available in this session).
- Production CSID request not reached (depends on a completed compliance CSID, which correctly did not complete given the fake OTP) — untested, disclosed rather than skipped silently.

## Frontend fixes

8 unguarded-mutation instances across 3 files — the largest batch of this session's dominant bug class found in one module:
- [`branch-setup/page.tsx`](src/app/zatca/branch-setup/page.tsx) — `handleSaveProfile`, `handleCreateEgsUnit`, `handleImportCredentials` (3)
- [`csr/page.tsx`](src/app/zatca/csr/page.tsx) — `handleGenerate`, `handleComplianceCsid`, `handleProductionCsid` (3)
- [`settings/page.tsx`](src/app/zatca/settings/page.tsx) — Global and Branch settings forms' `handleSave` (2)

All had `form.validateFields()` + `await mutateAsync(...)` with no `try/catch`, bound to raw button `onClick`s — a validation rejection or mutation failure would surface as an unhandled promise rejection. All wrapped in `try/catch`. `connection/page.tsx`'s `handleTest` was already safe (uses fire-and-forget `.mutate()`).

`npx tsc --noEmit` — clean. Error handling in `useZatca.ts` already correctly used `getApiErrorMessage()` everywhere — no wrong-pattern fixes needed here (first module this session where the hooks file needed zero error-handling fixes).

No other bugs: invoices, logs, and certificates pages are read-only, no mutations.

## Cleanup / Residue

No DELETE endpoints exist anywhere in this module (compliance records are permanent by design, consistent with accounting-document modules). Permanent test residue, all clearly QA-labeled:
- 3 EGS units (`QA-EGS-Module23-001`'s slot ended up empty-serial via the first default-slot create; `QA-EGS-bisect-1` is the real named one; `AUDIT-CHECK-1` added during the audit's independent bug reproduction)
- 1 CSR request (status `CsrGenerated`, tied to `QA-EGS-bisect-1`)
- 1 request log entry (the compliance-CSID attempt)
- Seller profile filled with clearly-fake QA company data (`"شركة سيجما التجريبية للاختبار QA"`)
- Branch settings created with `notes: "QA Module23 test settings"`

Global settings were touched only via a non-destructive roundtrip — no residue there.

## Audit note

Opus audit: PASS-WITH-NOTES. Independently reproduced the CRITICAL bug live (including the isDefault:true/false bisection), confirmed all 8 frontend fixes, and re-verified the auth-enforcement, OTP-redaction, and pageSize:0 claims against saved evidence plus live checks. Found two issues, both corrected above: an inverted "non-atomic" → should read "atomic" (no orphan record means the crash IS atomic), and an undisclosed reliance on unsaved ad-hoc evidence for several secondary findings — now flagged in the Evidence note.

## Regression

4 files changed (3 pages + none in services/hooks, since error handling was already correct). `tsc` clean. No other module touched.
