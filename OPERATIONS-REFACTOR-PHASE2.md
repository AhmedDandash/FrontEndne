# Operations Module — Phase 2: Refactoring & Alignment

Documentation of all refactoring performed on the Operations Contract module,
following the Phase 1 gap analysis. Two goals: **align** the implementation with
the documented endpoint contract (`Operation-Endpoints..md`) and **refactor** for
maintainability and consistency.

Verification: `npx tsc --noEmit` → **0 errors** project-wide; both Operations
routes compile and serve HTTP 200 with no server or client-console errors.

---

## 1. Alignment fixes (functional)

| # | Phase 1 finding | Fix |
|---|-----------------|-----|
| 1 | **Terminate sent a raw string body**; spec requires `{ note, refundAmount }` | `terminate()` now posts a JSON object; UI modal gained a `refundAmount` field |
| 2 | **`customer-refund` endpoint entirely missing** | Added end-to-end: config → service → hook → UI modal + action on Finished contracts |
| 3 | **`TerminateContractDto` incomplete** (`{ note }`) | Now `{ note?, refundAmount? }`; added `CustomerRefundDto` |
| 4 | **Collection-Renewal renew was a `console.log` stub** | Wired to the real `renewContract` mutation via the shared `RenewModal` |
| 5 | **Receipt Voucher service unreachable from the UI** | Added `ReceiptVoucherModal`, surfaced as an action on Executing contracts |

Additional correctness fixes made during the refactor:
- Corrected a broken route in the rent page (`/operation/rent` → `/contracts/operation/rent`).
- Replaced hardcoded placeholder values in collection-renewal (`contractNumber: 760`,
  `contractId: 1`, `customerUuid: "uuid-${id}"`) with the real contract fields.
- Removed leftover `console.log` debugging from collection-renewal.

---

## 2. Standardization

### API integration patterns
- **New shared helper `src/utils/api-response.ts`** — single source of truth for
  unwrapping API responses (`unwrap<T>` for envelopes, `unwrapList<T>` for the
  many list shapes: arrays, `{ data: { items } }`, `{ items }`, `{ result }`,
  `{ $values }`). Previously every service — and both Operations UI pages —
  re-implemented its own partial version of this logic.
- `EmploymentOperatingContractService` and `ReceiptVoucherService` now delegate
  all unwrapping to this helper. The triplicated unwrap logic in the UI pages was
  removed.

### Error handling
- **New shared helper `src/utils/api-error.ts`** — `getApiErrorMessage(err, fallback)`
  extracts server validation details from `errors[]`, then `message` / `title`,
  then a bilingual fallback. Replaces the copy-pasted
  `error.response?.data?.message || '...'` pattern in every mutation.
- Applied across `useEmploymentOperatingContracts` and `useReceiptVouchers`.

### Loading states
- Every mutation exposes an `isX` pending flag; the contract card receives them as
  a single `loading` object and disables/spins the relevant buttons. Added
  `isRefunding` for the new refund action.

### Validation
- All required fields use Ant Design `Form` rules with bilingual messages.
- The new refund amount uses `min={0.01}`; terminate refund uses `min={0}`.

### Naming conventions
- Service method names match the lifecycle verbs (`terminate`, `recordCustomerRefund`).
- Enum drift resolved: payment-method literals were hardcoded inline three
  different ways. Introduced two named enums in `src/constants/enums.ts`:
  - `OPERATING_PAYMENT_METHOD` (contract form: Cash / Card / Bank Transfer)
  - `REFUND_PAYMENT_METHOD` (refund: 1=Cash, 2=Bank, 3=Card — per spec)

### Folder structure
- The 1,492-line `rent/page.tsx` was extracted into a slim orchestrator (~430
  lines of wiring) plus a co-located `_components/` folder, mirroring the
  accounting module's established pattern.

---

## 3. File inventory

### New files
```
src/utils/api-response.ts                              shared unwrap / unwrapList
src/utils/api-error.ts                                 shared getApiErrorMessage
src/app/contracts/operation/rent/_components/
  types.ts                 RentContract view model + status types
  mapping.tsx              API → view-model projection, status badge meta
  format.ts                locale-aware date / currency formatters
  ContractFormFields.tsx   shared create/edit field set
  ContractFormModal.tsx    create + edit modal shell (mode prop)
  RenewModal.tsx           renew date picker (SHARED with collection-renewal)
  TerminateModal.tsx       note + refundAmount
  CustomerRefundModal.tsx  NEW — amount + paymentMethod + description
  ReceiptVoucherModal.tsx  NEW — receipt voucher against a contract
  ContractCard.tsx         card body + status-conditional actions
  ContractDetailsModal.tsx read-only details
```

### Modified files
```
src/config/api.config.ts                               + CUSTOMER_REFUND endpoint
src/constants/enums.ts                                 + OPERATING/REFUND payment-method enums
src/types/api.types.ts                                 TerminateContractDto fixed; + CustomerRefundDto
src/services/employment-operating-contract.service.ts  shared unwrap; terminate DTO; + recordCustomerRefund
src/services/receipt-voucher.service.ts                shared unwrap / unwrapList
src/hooks/api/useEmploymentOperatingContracts.ts       shared error helper; + customerRefund mutation
src/hooks/api/useReceiptVouchers.ts                    shared error helper
src/app/contracts/operation/rent/page.tsx              extracted to slim orchestrator
src/app/contracts/operation/collection-renewal/page.tsx renew wired; shared unwrap; cleanup
```

---

## 4. Behaviour-preservation notes

To keep the refactor behaviour-neutral, financial display logic carried over
verbatim was **not** silently changed:
- `contractNumber` (`R${2024000 + id}`), `totalCollected`, and `remainingAmount`
  in the rent view model remain derived/placeholder values — the list endpoint
  does not yet return real collection figures. Documented in `mapping.tsx`.

---

## 5. Recommended follow-ups (not in this phase)
1. Replace the derived `totalCollected` / `remainingAmount` with real
   receipt-voucher totals once a contract-financials endpoint is available.
2. Build a dedicated print view that renders `ContractPrintReceiptData` (today the
   data is fetched, then `window.print()` prints the current page).
3. Surface the "draft revenue journal created" confirmation on contract create
   (UI recommendation #1 in the spec).
4. Consider migrating the remaining ~16 services to the shared
   `unwrap` / `unwrapList` helpers for full consistency.
