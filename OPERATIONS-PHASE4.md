# Operations Module — Phase 4: End-to-End Testing & Verification

## Test environment
- Node **v24.16.0** (built-in `node --test` runner + native TypeScript type-stripping)
- Runnable via **`npm test`** (added: `node --test "src/**/*.test.ts"`)
- Type safety: **`npx tsc --noEmit` → 0 errors** project-wide
- Dev-server route compile: rent + collection-renewal both compile and serve **HTTP 200**, no server/console errors
- ⚠️ **No `NEXT_PUBLIC_API_BASE_URL` configured and no backend reachable** in this environment — see Blockers.

---

## 1. Test results report

### 1a. Automated unit tests — `src/__tests__/operations-logic.test.ts`
**21 tests, 21 passed, 0 failed.** Coverage of the request/response-mapping and
error-handling logic the whole module depends on:

| Area | Cases | Result |
|------|-------|--------|
| `unwrap` (envelope peeling) | plain, `{data}`, `{data:{value}}`, `{value}` | ✅ 4/4 |
| `unwrapList` (response→array) | array, `{data:[]}`, `{data:{items}}`, `{items}`, `{result}`, `{$values}`, `{data:{$values}}`, null/undefined/non-list | ✅ 9/9 |
| `getApiErrorMessage` | `errors[]` join, `message`, `title`, empty-errors fallback, network-error fallback | ✅ 5/5 |
| `toReceiptSections` (print) | null payload, key humanization + value formatting (dates/booleans/empties), empty-section omission, RTL titles | ✅ 4/4 |

### 1b. Static contract-conformance audit (vs. `Operation-Endpoints..md`)
Every request body and response handler verified against the spec by code review:

| Endpoint | Request model | Conforms? |
|----------|---------------|:--:|
| POST /EmploymentOperatingContract | `CreateEmploymentOperatingContractDto` | ✅ |
| PUT /EmploymentOperatingContract/{id} | `UpdateEmploymentOperatingContractDto` | ✅ |
| POST /{id}/sign · /start-execution | no body | ✅ |
| POST /{id}/renew | raw ISO date-time string (`application/json`) | ✅ matches "body: DateTime" |
| POST /{id}/terminate | `{ note, refundAmount }` (object; default refund 0) | ✅ fixed in Ph2 |
| POST /{id}/customer-refund | `{ amount, paymentMethod=1, description }` | ✅ added in Ph2 |
| POST /ReceiptVoucher | `{ voucherNumber, voucherDate, amount, notes, employmentOperatingContractId }` | ✅ |
| PUT/DELETE /ReceiptVoucher/{id} | id in path; body mirrors create | ✅ |
| GET (all reads) | via shared `unwrap`/`unwrapList` (tested above) | ✅ |
| GET /{id}/print-receipt-form | `ContractPrintReceiptData` → preview/print | ✅ wired in Ph3 |

### 1c. Reference-integrity check
Grep for stale call signatures / renamed handlers after the Phase 2–3 refactor
(`onReceiptVoucher`, `receiptModal`, raw-string `.terminate('…')`): **no matches** —
the terminate/refund/receipts wiring is consistent service → hook → page → modal.

### 1d. Workflow verification (static trace)
The full lifecycle — Create → Sign → Start → Receipts(CRUD) → Renew → Terminate
(`refundAmount`) → Customer Refund, plus Print at any stage — was traced end to
end through config → service → hook → UI action → modal. Action availability is
gated by contract status (Draft/Signed/Executing/Finished) as documented in
`OPERATIONS-PHASE3.md`.

---

## 2. Resolved issues

| # | Issue | Found by | Resolution |
|---|-------|----------|------------|
| 1 | `humanizeKey` only capitalized the first letter of the whole string → print labels read "Total cost", "Is vip" | Phase 4 unit test | Title-case each word + collapse whitespace → "Total Cost", "Is Vip" |
| 2 | (Carried, confirmed fixed) Terminate sent a raw string body | Ph1/Ph2 | Now posts `{ note, refundAmount }` — re-verified ✅ |
| 3 | (Carried, confirmed fixed) `customer-refund` missing | Ph1/Ph2 | Full path present and conformant — re-verified ✅ |
| 4 | (Carried, confirmed fixed) Print data fetched then discarded | Ph1/Ph3 | Rendered in preview + dedicated print window — re-verified ✅ |
| 5 | (Carried, confirmed fixed) Renew `console.log` stub | Ph1/Ph2 | Wired to real mutation via shared `RenewModal` — re-verified ✅ |

---

## 3. Remaining risks & blockers

| Severity | Item | Detail |
|----------|------|--------|
| **Blocker** | No live backend / `API_BASE_URL` | Real HTTP status codes, server-side validation messages, and authenticated UI click-through could **not** be exercised here. Needs a reachable API + test credentials. |
| Medium | Print payload field names are server-defined | `customerData`/`workerData`/`priceDetails` are open maps; rendering is generic, but exact labels/units depend on the backend's actual keys (untestable without a sample response). |
| Medium | `paymentMethod` enum ambiguity | Contract form uses Cash/Card/Bank; central `PAYMENT_METHOD` is Cash/Installments; refund uses Cash/Bank/Card. Valid values must be confirmed with the backend. |
| Low | Placeholder financials | `totalCollected` / `remainingAmount` / synthetic `contractNumber` are derived (carried verbatim from the original) — not backed by real data yet. |
| Low | List fetch uses `PageSize: 9999` | Works now, but will not scale; server-side pagination should replace it. |

---

## 4. Recommended improvements
1. **Live E2E pass** — point at a real API and run the full lifecycle (ideally Playwright): assert status codes, server validation surfacing, and the worker-status side effects (AtCustomer / InAccommodation).
2. **Service contract tests with MSW** — mock the documented envelope shapes and assert each service maps requests/responses correctly (extends today's pure-logic tests to the network boundary).
3. **Component tests (React Testing Library)** for the modals — validation rules, refund-amount edge values, receipts add/edit/delete — once a JSX-capable runner is configured.
4. Replace placeholder financials with real receipt-voucher totals (depends on a backend figure or a per-contract financial endpoint).
5. Confirm and centralize the contract `paymentMethod` valid values with the backend.
6. Move the contract list to server-side pagination.

---

## Summary
Everything testable **without a backend** passes: 21/21 unit tests, 0 type errors,
clean route compilation, and a full static contract/workflow audit with no
nonconformities. One real display bug was found and fixed. The single hard
blocker to *true* end-to-end sign-off is the absence of a reachable API in this
environment; items 1–2 above are the path to closing it.
