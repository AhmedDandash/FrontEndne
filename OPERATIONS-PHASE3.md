# Operations Module — Phase 3: Missing Endpoint Implementation

Completes the last unconnected endpoints from the Phase 1 gap analysis. (The
`customer-refund`, terminate-`refundAmount`, receipt-voucher-create, and renew
fixes were delivered in Phase 2's "alignment + refactor" pass.)

Verification: `npx tsc --noEmit` → **0 errors** project-wide; the rent route
compiles (7,936 modules) and serves HTTP 200 with no server or client-console errors.

---

## 1. What this phase implemented

### A. Print receipt form — `GET /{id}/print-receipt-form`
**Before:** the data was fetched then thrown away; `window.print()` printed the
whole app page.
**Now:** the fetched `ContractPrintReceiptData` is rendered in a preview modal and
printed in a dedicated, receipt-only print window.

- `_components/print-receipt.ts` — `toReceiptSections()` projects the payload into
  display sections; `printReceipt()` opens a styled, RTL-aware print window.
- `_components/PrintReceiptModal.tsx` — on-screen preview + Print button.
- The Print action now: opens the modal with a loading state → fetches → renders;
  the Print button is disabled while loading or when there is no data.

**Edge cases handled**
- `customerData` / `workerData` / `priceDetails` are open `Record<string, any>`
  maps — rendered generically as humanised key/value rows, so unknown/new server
  fields still display.
- ISO date strings auto-format; booleans render as ✓/✗; empty values show "—".
- Sections with no rows are omitted; a fully empty payload shows an empty state.
- API failure keeps the modal open on an empty state (the hook shows the toast).
- Pop-up blocked → a warning message instead of a silent no-op.
- HTML is escaped before injection into the print window.

### B. Receipt voucher management — `GET` / `PUT` / `DELETE /api/ReceiptVoucher`
**Before:** only `POST` (create) was wired; list/edit/delete had no screen.
**Now:** a per-contract receipts manager connects all four CRUD endpoints.

- `_components/ContractReceiptsModal.tsx` — lists the contract's vouchers (with a
  collected total), plus add / edit / delete.
- `_components/ReceiptVoucherModal.tsx` — extended from create-only to **create +
  edit** (`PUT` via `useUpdateReceiptVoucher`).
- Entry points: the **Receipts** button on Executing contracts and a **Receipts**
  item in the card menu for every non-Draft contract.

**Edge cases handled**
- `GET` is filtered server-side by `employmentOperatingContractId` **and**
  re-filtered client-side, so a contract never shows another contract's vouchers
  even if the API ignores the query param.
- Delete is guarded by a `Popconfirm` with a loading state.
- Empty state when a contract has no vouchers yet.
- Create/edit reuse one modal; the form pre-fills on edit and resets on create.

---

## 2. Updated end-to-end workflow

```
Create ─ POST /EmploymentOperatingContract ───► DR A/R, CR Revenue + VAT   [Draft JE]
  │                                              (UI: Create modal)
  ▼
Sign ── POST /{id}/sign ──────────────────────► status only, no journal
  │                                              (UI: Sign action — Draft cards)
  ▼
Start ─ POST /{id}/start-execution ───────────► worker → AtCustomer
  │                                              (UI: Start Execution — Signed cards)
  ▼
Collect payments (repeatable, Executing/Finished)
  │   POST   /ReceiptVoucher ───────────────────► DR Cash/Bank, CR A/R         [Draft JE]
  │   GET    /ReceiptVoucher ───────────────────► list per contract
  │   PUT    /ReceiptVoucher/{id} ──────────────► edit
  │   DELETE /ReceiptVoucher/{id} ──────────────► remove
  │                                              (UI: Receipts manager modal)
  ▼
Renew (optional) ─ POST /{id}/renew ──────────► extend end date              [Draft JE]
  │                                              (UI: Renew modal — rent &
  │                                               collection-renewal pages)
  ▼
Terminate ─ POST /{id}/terminate ─────────────► DR Revenue + VAT,            [Draft credit note]
  │   body { note, refundAmount }                CR A/R + Customer Payable
  │                                              (UI: Terminate modal)
  ▼
Customer Refund ─ POST /{id}/customer-refund ─► DR Customer Payable,         [Draft JE]
      body { amount, paymentMethod, description } CR Cash/Bank
                                                 (UI: Customer Refund — Finished cards)

Any time: Print ─ GET /{id}/print-receipt-form ► preview + print window
```

### Action availability by contract status
| Status | Actions |
|--------|---------|
| Draft (1) | Sign, Edit, Delete, Print |
| Signed (2) | Start Execution, Edit, Receipts, Print |
| Executing (3) | Renew, Receipts, Terminate, Print |
| Finished (4) | Customer Refund, Receipts, Print |

---

## 3. File inventory

### New files
```
src/app/contracts/operation/rent/_components/
  print-receipt.ts            payload → sections + print-window renderer
  PrintReceiptModal.tsx       print preview + Print button
  ContractReceiptsModal.tsx   per-contract voucher list (GET/DELETE + add/edit)
```

### Modified files
```
src/app/contracts/operation/rent/_components/ReceiptVoucherModal.tsx  create → create + edit (PUT)
src/app/contracts/operation/rent/_components/ContractCard.tsx         Receipts entry points (button + menu)
src/app/contracts/operation/rent/page.tsx                             print fetch→preview; receipts manager wiring
```

All endpoints from `Operation-Endpoints..md` and the Phase 1 inventory are now
fully integrated and connected to a UI screen.

---

## 4. Endpoint integration status (final)

| Method | Endpoint | Service | Hook | UI |
|--------|----------|:---:|:---:|:---:|
| GET | /EmploymentOperatingContract | ✓ | ✓ | ✓ |
| GET | /EmploymentOperatingContract/{id} | ✓ | ✓ | ✓ |
| POST | /EmploymentOperatingContract | ✓ | ✓ | ✓ |
| PUT | /EmploymentOperatingContract/{id} | ✓ | ✓ | ✓ |
| DELETE | /EmploymentOperatingContract/{id} | ✓ | ✓ | ✓ |
| POST | /{id}/sign | ✓ | ✓ | ✓ |
| POST | /{id}/start-execution | ✓ | ✓ | ✓ |
| POST | /{id}/renew | ✓ | ✓ | ✓ |
| POST | /{id}/terminate | ✓ | ✓ | ✓ |
| POST | /{id}/customer-refund | ✓ | ✓ | ✓ |
| GET | /{id}/print-receipt-form | ✓ | ✓ | ✓ |
| GET | /ReceiptVoucher | ✓ | ✓ | ✓ |
| GET | /ReceiptVoucher/{id} | ✓ | ✓ | — (not needed; list carries detail) |
| POST | /ReceiptVoucher | ✓ | ✓ | ✓ |
| PUT | /ReceiptVoucher/{id} | ✓ | ✓ | ✓ |
| DELETE | /ReceiptVoucher/{id} | ✓ | ✓ | ✓ |
