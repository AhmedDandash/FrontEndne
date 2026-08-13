# Agents Module — Phase 3 Test Report

**Priority #14 — 🟠 High.** Tested 2026-08-12 against the live backend `https://sigma-api.runasp.net`. Raw logs (scratchpad): `agent-test1.mjs`/`-results.json` (reads, truncation check, create validation, the `nationalityId` type-mismatch discovery), `agent-test2.mjs`/`-results.json` (isolated update/delete auth checks, cleanup).

> **Round-2 corrections (post Opus audit, verdict: needs-rework, minor):** the audit confirmed both fixes as correct, but found the `nationalityId` mismatch has a wider blast radius than originally scoped (it also breaks the agents list's nationality filter and both display surfaces, not just the create/edit form), caught a factual error in the nameless-agent finding (the form *does* have required-field validation — it isn't reachable through the UI after all), and corrected an inflated consumer count. All corrected below, marked **[round 2]**.

## Prior-session memory re-verified: the documented `getAll()` envelope fix is still intact

An 8-day-old memory note documented a real bug fixed on 2026-08-04: `AgentService.getAll()`'s envelope-unwrapping logic missed the doubly-nested paginated shape (`data.data.items`), silently returning `[]` and breaking all consumers of `useAgents()`. Confirmed this fix is still present and unregressed in the current code (the `Array.isArray(data.data?.items)` branch exists exactly as documented).

## 🔴 CRITICAL — the `nationalityId` int/GUID mismatch breaks every UI surface that touches an agent's nationality, not just the create/edit form (backend/frontend contract mismatch, cannot be fixed from this repo)

`CreateAgentDto.nationalityId` is typed `int32` in the live OpenAPI schema — but the entire rest of the application (Workers, Mediation Offers, every other module tested this session) has used GUID-based nationality ids exclusively since the Nationality module was migrated to `/api/V1/Nationality` (per that service's own code comment: "DTO simplified: removed nationalityId..."). Live-verified directly: `GET /Nationality` returns keys `[id, nationalityNameAr, nationalityNameEn, isActive, createdDate, updatedDate]` on all 12 real records — no numeric id anywhere. (`Nationality.nationalityId?: number` still exists in `api.types.ts`, but nothing on the wire ever populates it — dead.)

**[round 2, expanded scope]** This one root cause breaks four separate UI surfaces in `agents/page.tsx` and its supporting files, not just the create/edit form:

1. **Create/edit form crashes on save.** `getNationalityOptionValue` (`nationality?.nationalityId ?? nationality?.id ?? nationality?.value`) always falls through to the GUID `nationality.id`. `handleSubmit`'s normalization sends that GUID string through to a field the backend only accepts as an integer. **Live-verified: a real nationality GUID crashes with a clean `400` ASP.NET model-binding error** (`"The JSON value could not be converted to System.Nullable\`1[System.Int32]"`).
2. **[round 2, new]** The agents list's **Nationality filter dropdown is permanently empty and unusable.** `nationalityOptions` (`agents/page.tsx`, the advanced-filter block) computes `value: Number(getNationalityOptionValue(n))` then discards anything that isn't `Number.isFinite` — since every value is a GUID, `Number(guid)` is `NaN` for all 12 nationalities, every option is filtered out, and the dropdown always renders with zero choices.
3. **[round 2, new]** **`getNationalityLabel` (the list-card nationality label) and `AgentDetailView.tsx`'s detail-page label both degrade to garbage** once an agent record does carry some `nationalityId` value: `getNationalityLabel` compares `String(nationalityGuid) === String(agent.nationalityId /* int */)`, which can never match, so it falls through to printing the raw integer instead of a name. `AgentDetailView.tsx` reads `agent.nationalityNameAr`/`agent.nationalityNameEn` — fields the backend **never returns** on `GET /Agent/{id}` (live-confirmed) — so it also degrades to a raw number or a dash.
4. **[round 2, new]** **The backend applies no real validation on this field either** — live-verified by creating agents with `nationalityId` `1`, `5`, and `999999`: all three persisted with `200` and no rejection, no FK check, no relationship to any real nationality. The column is effectively vestigial on the backend side, not a validated foreign key — reinforcing that there is no value this field could ever meaningfully hold today, for either surface.

**Practical impact: nationality is unusable for agents anywhere in the app** — it cannot be set (create/edit crashes), cannot be filtered on (empty dropdown), and cannot be meaningfully displayed (raw numbers or dashes) even for the one pre-existing agent that might carry a legacy value. This is a genuine backend/frontend contract mismatch that cannot be resolved from this repo alone — either the backend needs to accept the real GUID (matching every other nationality-referencing field in the system) or expose a legacy numeric-id lookup, or the frontend needs a wholly different (currently nonexistent) numeric-nationality picker. Flagged rather than guessed at or cosmetically patched around, consistent with how ambiguous cross-cutting schema decisions were handled elsewhere this session — none of the four manifestations were "fixed" by hiding or working around them, since doing so wouldn't address the underlying mismatch and could mask it further.

**One real, safe improvement was made**: until the schema mismatch is resolved, a user hitting the create/edit crash previously saw only a generic "Failed to create agent" toast with zero indication of the actual cause (see the error-message fix below) — now they'll see the real validation detail, which at least makes the failure diagnosable instead of silent. **[round 2]** That fixed message is itself imperfect — it surfaces the raw ASP.NET validation strings verbatim, which are English-only technical text (`"The JSON value could not be converted..."`) shown inside an otherwise bilingual Arabic/English UI. An acceptable diagnostic aid for now, not a polished user-facing message; noted rather than further patched, since a real fix requires the backend/product decision above regardless.

## 🔴 HIGH — the exact same silent list-truncation pattern as Jobs/Nationalities, latent but not yet manifesting (frontend, fixed proactively)

`AgentService.getAll()` called `GET /api/V1/Agent` with no query parameters at all — the identical shape that caused live, active bugs in Modules #12 (Jobs) and #13 (Nationalities), both fixed earlier this session. With only 1 real agent currently on the system, this hasn't yet crossed the backend's default page-size threshold (10) to actually manifest — but the code was just as vulnerable. **[round 2, correction]** The consumer count was overstated: **11** real files call `useAgents()` directly (not 13), plus a 12th, separate direct caller — `src/hooks/api/useLedger.ts` calls `AgentService.getAll()` on its own, bypassing the hook entirely — for `usePartyOptions('agent')`, feeding the agent-ledger party picker. Both are covered by the same service-level fix.

**Fixed proactively, before it could bite**: `getAll()` now sends `PageSize: 9999`, matching the identical fix already applied to `JobService`/`NationalityService`. Re-verified live with the exact param casing the code sends (`PageSize`) — returns the 1 real agent correctly, and will continue returning everything once the agent count grows past 10. **[round 2, checked]** The module's *other* list method, `getPaged()`, was checked for the same risk and found safe: its only consumer, `useAgentsPaged` in `agents/page.tsx`, always supplies an explicit `PageSize` from component state — there is no unparameterized call path through it.

## 🟠 HIGH — full CRUD auth bypass on Agents (backend, cannot be fixed from this repo)

**Create, Update, and Delete are all unauthenticated**, each isolated-confirmed independently:

- **CREATE**: a no-token request with a valid `X-Branch-Id` header returned `200`/`201` with a real created record; confirmed persisted via a follow-up authenticated `GET`.
- **UPDATE**: on a fresh, isolated agent, a no-token `PUT` (with the required `id` field included in the body) returned `200`; a follow-up `GET` confirmed the submitted name change was genuinely saved.
- **DELETE**: on a fresh, isolated agent, a no-token `DELETE` returned `200`; a follow-up `GET` returned `404`, confirming it was genuinely gone.

Same systemic pattern found in nearly every module this session.

## 🟡 MEDIUM — an agent can be created with no name at all (backend, cannot be fixed from this repo)

`POST /api/V1/Agent` with an empty body, or with both `agentNameAr`/`agentNameEn` omitted, succeeds (`201`) and creates a real, permanent, completely nameless agent record — the same gap found in Jobs and Nationalities. **[round 2, correction]** This report originally claimed the live create form has no client-side required-field guard, making the gap reachable through the app's own UI — that was factually wrong. `agents/page.tsx`'s form does have `rules={[{ required: true, message: ... }]}` on `agentNameAr` (and on `contractType`); a user cannot submit the create form without a name. The backend gap is real and still worth a fix for defense-in-depth (anything calling the API directly, or a future UI surface, could still hit it), but — as with Jobs and Nationalities — it is **not** currently reachable through this app's own UI.

## Endpoints covered

| Method | Endpoint | Scenarios tested |
|---|---|---|
| GET | `/Agent` | anonymous, authed, unparameterized-call vs `PageSize=9999` comparison (no truncation observed yet at current count, fixed proactively) |
| GET | `/Agent/{id}` | valid, no-auth, non-existent, malformed |
| POST | `/Agent` (create) | no-auth+no-header, no-auth-with-header (the auth gap, isolated), empty body, missing both name fields, `nationalityId` type-mismatch (the CRITICAL finding, including a backend-side no-validation probe with integers `1`/`5`/`999999`), valid create |
| PUT | `/Agent/{id}` (update) | no-auth (isolated, the auth gap — with the required `id` field included), valid |
| DELETE | `/Agent/{id}` | no-auth (isolated, the auth gap), valid |

## What's working correctly (verified, not just assumed)

- **`GET /Agent/{id}`** returns `404` for both a non-existent and a malformed id — standard, correct behavior.
- **The prior-session `getAll()` envelope fix has not regressed** — re-verified against the current code and live behavior.
- **`createAgent`/`updateAgent` in `agents/page.tsx` are correctly gated on `onSuccess`** — the modal only closes once the mutation actually succeeds, not optimistically. No premature-close bug here.
- GET endpoints (list, by-id) are anonymous-accessible — consistent with the GET-endpoints-generally-unauthenticated pattern seen across the whole app.
- **[round 2, checked]** `agents/[id]/page.tsx` and `AgentDetailView.tsx` were reviewed for the same class of issues found elsewhere this session (unhandled mutations, missed catches) — neither has any mutation of its own (the detail route is read-only, rendering the presentational `AgentDetailView`), so there was nothing to find beyond the nationality-label degradation already covered above.
- **[round 2, noted, not fixed]** `useUpdateAgent`/`useDeleteAgent` are typed `id: number`, but real agent ids are GUID strings (the same `Job.id: number`-vs-GUID type inaccuracy pattern found in Module #12). It causes no runtime issue today (JS doesn't enforce the type; every real call site passes the actual GUID string through regardless of what TypeScript believes), so it's noted for accuracy rather than fixed as a standalone change.

## 🟡 MEDIUM — `useAgents.ts`'s error handlers discarded the actual validation detail from every failure (frontend, fixed)

All three write-mutation `onError` handlers read `error?.response?.data?.message` — but this backend's error envelopes for validation failures generally carry the detail in an `errors` array or object (`{errors: {...}}`), not a top-level `message` field (confirmed directly against the raw `nationalityId` crash body above: no `.message` key exists at all). This meant every validation failure — not just the nationalityId one — showed only the generic hardcoded fallback string ("Failed to create/update/delete agent"), with the actual reason silently discarded. Also removed three `console.error` debug calls tied to the same handlers.

**Fixed**: switched all three to the shared `getApiErrorMessage()` helper (`src/utils/api-error.ts`), which already correctly flattens both this backend's array-shaped and ASP.NET's object-shaped `errors` payloads — the same helper already used correctly elsewhere in this codebase, and the same fix already applied to `useAccounts.ts` in Module #9 for the identical bug class.

## Cleanup

All agents created during this module's testing were deleted and verified gone via a full-list sweep using the corrected (non-truncating) query. Final residue: **0** — the system is back to its original 1 real seed agent.

## Regression

`tsc --noEmit` clean after all fixes (`agent.service.ts`, `hooks/api/useAgents.ts` — two files changed) — independently re-run by the audit too. Browser pane verification not attempted this session (consistent with prior modules where the dev server/browser pane were unresponsive) — the fixes are type-checked; the truncation fix is live-verified at the API level with the exact parameter shape the code sends, and the error-message fix was verified by tracing `getApiErrorMessage()`'s flattening logic directly against the real captured crash body.

## Round-2 audit summary

The Opus audit returned **needs-rework (minor)** — both frontend fixes (truncation, error messages) were confirmed correct and unregressed, but it found a real, higher-severity bug in the same file the CRITICAL finding already covered: the agents list's Nationality filter is permanently empty for the identical root-cause reason the create form crashes, a consequence the original write-up never traced past the form itself. It also corrected a factual error (the nameless-agent gap was wrongly described as UI-reachable; the form does have required-field validation) and an inflated consumer count (11 real files, not 13, plus a 12th direct caller via `useLedger.ts` the original count missed entirely). All corrected above with expanded, verified evidence — including a new probe confirming the backend applies zero validation to `nationalityId` regardless of what integer is sent, which strengthens rather than weakens the original "cannot be fixed from this repo" conclusion. No further audit round requested; corrections applied directly.
