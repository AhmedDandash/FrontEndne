# General Vouchers Module Update

## Overview

The General Vouchers module was redesigned to match the original Sigma Accounting System. The previous implementation only supported a simple receipt voucher tied to operating contracts (number, date, contract, amount, payment method, VAT, bank fees, notes). That model could not represent the full range of voucher types used in daily accounting operations.

The new module introduces a unified `GeneralVoucher` entity with six voucher types, shared fields, account-based journal integration, multi-line support, foreign currency handling, attachments, full CRUD, advanced filtering, Excel export, and print-ready data endpoints.

**Existing APIs are preserved.** `api/Accounting/ReceiptVoucher` and `api/Accounting/PaymentVoucher` continue to work unchanged. The new module is exposed at `api/Accounting/GeneralVoucher`.

## New Voucher Types

| Type | Enum Value | Arabic | Description |
|------|------------|--------|-------------|
| Receipt Voucher | `Receipt = 1` | سند قبض | Inbound payment with beneficiary, debit/credit accounts |
| Payment Voucher | `Payment = 2` | سند صرف | Outbound payment with beneficiary, debit/credit accounts |
| Contract Payment Voucher | `ContractPayment = 3` | سند صرف عقد | Contract-linked transfer between from/to accounts |
| Multiple Payment Voucher | `MultiplePayment = 4` | سند صرف متعدد | Multi-line journal with dynamic debit/credit rows |
| Worker Payment Voucher | `WorkerPayment = 5` | سند صرف عامل | Payment linked to a worker |
| Foreign Currency Payment Voucher | `ForeignCurrencyPayment = 6` | سند صرف عملة أجنبية | Foreign currency amount with exchange rate and SAR conversion |

## Shared Components

### Domain

- **`GeneralVoucher`** — unified voucher entity with all type-specific fields
- **`GeneralVoucherLine`** — journal lines for multiple payment vouchers
- **`GeneralVoucherType`** — voucher type enum
- Extended **`PaymentMethodType`**: Cash, Bank, Card, Transfer, Cheque

### Application Helpers

- **`GeneralVoucherCalculationHelper`** — total amount (`Amount + VAT`), foreign currency calculations, display names (EN/AR)
- **`AccountingDocumentHelper.MapPaymentMethod`** — extended for Transfer and Cheque

### DTOs

- **`GeneralVoucherDto`** — full read model with account names, worker name, journal status
- **`CreateGeneralVoucherDto` / `UpdateGeneralVoucherDto`** — create/update payloads
- **`GeneralVoucherFilterDto`** — list filters with pagination
- **`GeneralVoucherLineInputDto`** — multi-line row input
- **`GeneralVoucherPrintDto`** — print/PDF rendering data
- **`GeneralVoucherBalanceValidationDto`** — real-time balance check response

### Validators

- **`CreateGeneralVoucherDtoValidator`** — required fields per voucher type, positive amounts, balanced multi-line entries
- **`UpdateGeneralVoucherDtoValidator`** — same rules for updates

## Backend Changes

### New DTOs

Located in `Sigma.Application/DTOs/GeneralVouchers/GeneralVoucherDtos.cs`.

### New APIs

Base route: **`api/Accounting/GeneralVoucher`**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Paginated list with filters |
| GET | `/types` | Voucher type dropdown metadata |
| GET | `/payment-methods` | Payment method dropdown metadata |
| GET | `/{id}` | Voucher detail |
| GET | `/{id}/trace` | Accounting trace (document → journal → ledger) |
| GET | `/{id}/print` | Print-ready data for client PDF |
| GET | `/export` | Excel export |
| POST | `/` | Create voucher |
| PUT | `/{id}` | Update voucher (draft journal only) |
| DELETE | `/{id}` | Delete voucher (draft journal only) |
| POST | `/{id}/attachment` | Upload attachment (drag & drop supported) |
| POST | `/validate-balance` | Validate multi-line debit/credit balance |

### Modified Services

- **`AccountingIntegrationService`** — added `RecordGeneralVoucherAsync` with type-specific journal line builders
- **`AccountingDocumentTraceService`** — added `GetGeneralVoucherTraceAsync`
- **`AccountingDocumentHelper`** — Transfer/Cheque payment method mapping
- **`PaymentMethodType`** — added Transfer (4) and Cheque (5)

### Database Changes

Migration: **`AddGeneralVouchersModule`**

Tables:
- **`GeneralVouchers`** — main voucher storage
- **`GeneralVoucherLines`** — multi-line journal rows

Key columns on `GeneralVouchers`:
- Voucher identity: `VoucherSerialNumber`, `VoucherNumber`, `VoucherDate`, `VoucherType`
- Amounts: `Amount`, `VatAmount`, `TotalAmount`
- Accounts: `DebitAccountId`, `CreditAccountId`, `FromAccountId`, `ToAccountId`
- References: `BeneficiaryId/Type/Name`, `ContractId/Type`, `WorkerId`, `OperationType`
- Foreign currency: `ForeignCurrency`, `ForeignCurrencyAmount`, `ExchangeRate`, `AmountInSar`, `AmountDeducted`, `ExchangeDifference`
- Links: `JournalEntryId`, `AccountingDocumentId`, `AttachmentPath`

### Validation

- Required fields enforced per voucher type (FluentValidation)
- Positive amounts
- Leaf account validation (non-leaf accounts rejected)
- Contract existence check (Operating, Mediation, Transfer)
- Worker existence check
- Multi-line balance: `Total Debit == Total Credit`
- Attachment: allowed extensions `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`, `.xls`, `.xlsx`
- Update/delete blocked when linked journal is Posted

## Frontend Changes

> The frontend lives in a separate repository. Use the API contracts below when building the UI.

### Pages

| Route (proposed) | Purpose |
|------------------|---------|
| `/accounting/general-vouchers` | Unified voucher list |
| `/accounting/general-vouchers/new/:type` | Create form per voucher type |
| `/accounting/general-vouchers/:id` | View / edit |
| `/accounting/general-vouchers/:id/print` | Print preview |

### Components (recommended)

| Component | Purpose |
|-----------|---------|
| `VoucherTypeDropdown` | "Add Voucher" dropdown with 6 types |
| `VoucherSharedFields` | Number, date, payment method, amount, VAT, total, notes |
| `AccountPicker` | Leaf account selector from chart of accounts |
| `VoucherJournalLines` | Dynamic rows for multiple payment voucher |
| `BalanceIndicator` | Real-time debit/credit balance display |
| `AttachmentUploader` | Drag & drop file upload |
| `VoucherFilterPanel` | Advanced list filters |
| `VoucherPrintLayout` | Sigma-style printable voucher |

### Forms

Each voucher type renders `VoucherSharedFields` plus type-specific fields:

- **Receipt / Payment**: Beneficiary, debit account, credit account
- **Contract Payment**: Contract type, contract, from/to accounts, operation type
- **Worker Payment**: Worker picker, debit/credit accounts
- **Multiple Payment**: Dynamic journal line grid
- **Foreign Currency**: Beneficiary, contract, foreign amount, exchange rate, SAR fields (auto-calculated)

Auto-calculations:
- `TotalAmount = Amount + VatAmount`
- Foreign currency: `AmountInSar = ForeignCurrencyAmount × ExchangeRate`

### Tables

List columns: Serial, Number, Date, Type, Amount, VAT, Total, Payment Method, Status, Actions.

### Filters

`GeneralVoucherFilterDto` supports: voucher number, type, date range, contract, worker, payment method, amount range, status, search, branch, pagination.

### Printing

`GET /api/Accounting/GeneralVoucher/{id}/print` returns `GeneralVoucherPrintDto` with voucher details, branch name, and journal lines. Render client-side PDF using this data.

## Accounting Integration

Every general voucher creates a **Draft** journal entry via `AccountingIntegrationService.RecordGeneralVoucherAsync`:

| Voucher Type | Journal Pattern |
|--------------|-----------------|
| Receipt | DR Debit Account (total), CR Credit Account (amount), CR VAT Payable (VAT) |
| Payment / Worker | DR Debit Account (amount), DR VAT Receivable (VAT), CR Credit Account (total) |
| Contract Payment | DR To Account (amount), DR VAT (if any), CR From Account (total) |
| Multiple Payment | User-defined balanced lines |
| Foreign Currency | DR Debit (total), CR Credit (SAR amount), exchange difference on expense/revenue |

Flow:
1. Create voucher → journal entry (Draft) + accounting document trace
2. Accountant posts via `POST api/V1/Posting/{journalEntryId}`
3. Trace endpoint shows ledger entries after posting

## Future Improvements

- Migrate legacy `ReceiptVoucher` / `PaymentVoucher` records into `GeneralVouchers`
- Server-side PDF generation for vouchers
- Voucher approval workflow (PendingApproval status)
- Cheque tracking (cheque number, due date, bank)
- Bulk import from Excel
- Recurring voucher templates
- Multi-currency exchange rate API integration
- Link beneficiary picker to Customer/Agent master data
