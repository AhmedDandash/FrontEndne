# Operating Contract Accounting Lifecycle

This document describes the automatic journal entry generation for **Employment Operating Contracts**, implemented as part of the Sigma.API accounting integration module.

All generated journal entries are created in **Draft** status and require accountant review and posting before they affect account balances.

---

## Overview

| # | Business Event | Trigger | Document Type | Integration Method |
|---|----------------|---------|---------------|-------------------|
| 1 | Contract creation | `POST api/EmploymentOperatingContract` | Journal Entry | `RecordOperatingContractCreatedAsync` |
| 2 | Contract renewal | `POST api/EmploymentOperatingContract/{id}/renew` | Journal Entry | `RecordOperatingContractRenewalAsync` |
| 3 | Receipt voucher | `POST api/ReceiptVoucher` | Receipt Voucher | `RecordOperatingReceiptVoucherAsync` |
| 4 | Contract termination | `POST api/EmploymentOperatingContract/{id}/terminate` | Credit Note | `RecordOperatingContractTerminationCreditNoteAsync` |
| 5 | Customer refund payment | `POST api/EmploymentOperatingContract/{id}/customer-refund` | Journal Entry | `RecordOperatingCustomerRefundPaymentAsync` |

Every journal entry sets:
- `SourceId` = Operating Contract `Id`
- `CustomerId` = Contract customer `Id`
- `Status` = `Draft`

---

## Journal Entry Patterns

### 1. Contract Creation

Recognizes revenue when the operating contract is **created** (not on sign).

| Account | Debit | Credit |
|---------|-------|--------|
| Accounts Receivable (103) | Gross amount | |
| Operating Revenue (404) | | Net amount |
| VAT Payable (202) | | VAT amount |

**Gross amount** = `Cost + Insurance + OfferPrice`  
**VAT** = 15% inclusive split when `vatAmount` is not supplied.

### 2. Contract Renewal

Same pattern as creation. Posted when renewal endpoint is called.

| Account | Debit | Credit |
|---------|-------|--------|
| Accounts Receivable (103) | Renewal amount | |
| Operating Revenue (404) | | Net amount |
| VAT Payable (202) | | VAT amount |

**Renewal amount** = `OfferPrice ?? Cost ?? 0`

### 3. Receipt Voucher

Simple customer payment against accounts receivable. No payment processing fees line.

| Account | Debit | Credit |
|---------|-------|--------|
| Cash (101) or Bank (102) | Amount | |
| Accounts Receivable (103) | | Amount |

Payment account is selected from `PaymentMethod`: Cash → 101, Bank/Card → 102.

### 4. Contract Termination (Credit Note)

Reverses recognized revenue. When a refund is owed to the customer, **Customer Payable** is credited.

| Account | Debit | Credit |
|---------|-------|--------|
| Operating Revenue (404) | Net (revenue reversal) | |
| VAT Payable (202) | VAT (VAT reversal) | |
| Accounts Receivable (103) | | Outstanding balance (`gross − refund`) |
| Customer Payable (204) | | Refund amount (if > 0) |

- `RefundAmount = 0` → full gross credited to Accounts Receivable.
- `RefundAmount > 0` → split between A/R reduction and Customer Payable liability.

### 5. Customer Refund Payment

Separate step after termination when cash is returned to the customer.

| Account | Debit | Credit |
|---------|-------|--------|
| Customer Payable (204) | Refund amount | |
| Cash (101) or Bank (102) | | Refund amount |

---

## Chart of Accounts Added / Used

| Code | Name | GUID |
|------|------|------|
| 103 | Accounts Receivable | `11111111-0000-0000-0000-000000000003` |
| 101 | Cash | `11111111-0000-0000-0000-000000000001` |
| 102 | Bank | `11111111-0000-0000-0000-000000000002` |
| 202 | VAT Payable | `22222222-0000-0000-0000-000000000002` |
| 204 | Customer Payable | `22222222-0000-0000-0000-000000000004` *(new)* |
| 404 | Operating Revenue | `44444444-0000-0000-0000-000000000004` *(new)* |

Apply migration after pulling:
```bash
dotnet ef database update --project Sigma.Infrastructure --startup-project Sigma.API
```

---

## Code Changes Summary

### New files
- `Sigma.Application/Interfaces/IServices/IOperatingContractAccountingHandler.cs`
- `Sigma.Application/Services/OperatingContractAccountingHandler.cs`
- `docs/OPERATING_CONTRACT_ACCOUNTING.md`

### Modified — Application layer
- `AccountingConstants.cs` — `OperatingRevenueId`, `CustomerPayableId`
- `IAccountingIntegrationService.cs` — five operating-specific methods
- `AccountingIntegrationService.cs` — operating revenue, receipt, termination credit note, refund payment journals
- `EmploymentOperatingContractService.cs` — revenue on **create** (removed from **sign**); termination/refund handlers
- `ReceiptVoucherService.cs` — uses `RecordOperatingReceiptVoucherAsync` (contract-scoped, no bank fees line)
- `EmploymentOperatingContractDto.cs` — `TerminateOperatingContractDto`, `OperatingCustomerRefundDto`
- `IEmploymentOperatingContractService.cs` — updated terminate signature + `RecordCustomerRefundAsync`

### Modified — API layer
- `EmploymentOperatingContractController.cs` — terminate body changed to DTO; new refund endpoint
- `ServiceConfiguration.cs` — registers `IOperatingContractAccountingHandler`

### Modified — Infrastructure
- `AccountSeeder.cs` — accounts 204 Customer Payable, 404 Operating Revenue
- EF migration: `AddOperatingRevenueAndCustomerPayable` (generated)

### Modified — Tests
- `AccountingIntegrationTests.cs` — operating lifecycle tests (creation + full 5-stage flow)

### Behaviour changes
| Before | After |
|--------|-------|
| Revenue journal on **contract sign** | Revenue journal on **contract create** |
| Sign only updates contract status | Sign no longer creates a journal |
| Termination reversed revenue + optional cash refund in one step | Termination creates **credit note only**; refund is a separate API call |
| Receipt voucher journal used voucher ID as `SourceId` | Receipt voucher journal uses **contract ID** as `SourceId` |
| Receipt could include payment processing fees | Operating receipt: **Cash/Bank ↔ A/R only** |
| Revenue credited to Service Revenue (401) | Operating contracts use **Operating Revenue (404)** |

---

## Typical Flow

```
Create Contract ──► DR A/R, CR Operating Revenue + VAT          [Draft JE]
       │
       ▼
Receipt Voucher ──► DR Cash/Bank, CR A/R                        [Draft JE]
       │
       ▼
Renew (optional) ─► DR A/R, CR Operating Revenue + VAT          [Draft JE]
       │
       ▼
Terminate ────────► DR Revenue + VAT, CR A/R + Customer Payable [Draft Credit Note]
       │
       ▼
Customer Refund ──► DR Customer Payable, CR Cash/Bank           [Draft JE]
```

---

## Front-End Integration

### Breaking change — Terminate contract

**Endpoint:** `POST /api/EmploymentOperatingContract/{id}/terminate`

**Before:**
```json
"Terminated manually"
```
(plain string body)

**After:**
```json
{
  "note": "Early termination per customer request",
  "refundAmount": 500.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `note` | string | No | Termination reason / notes |
| `refundAmount` | decimal | No | Amount owed back to customer (defaults to 0). When > 0, credit note credits **Customer Payable** |

### New endpoint — Customer refund payment

**Endpoint:** `POST /api/EmploymentOperatingContract/{id}/customer-refund`

**Request body:**
```json
{
  "amount": 500.00,
  "paymentMethod": 1,
  "description": "Refund after contract termination"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | decimal | Yes | Cash refund amount |
| `paymentMethod` | int | No | `1` = Cash, `2` = Bank, `3` = Card (default: `1`) |
| `description` | string | No | Journal description |

**Response:** `200 OK` — `"Customer refund payment recorded successfully."`

Call this **after** termination when `refundAmount` was set and the business is ready to pay the customer.

### Unchanged endpoints (accounting now fires automatically)

| Method | Endpoint | Accounting effect |
|--------|----------|-------------------|
| `POST` | `/api/EmploymentOperatingContract` | Contract creation journal |
| `POST` | `/api/EmploymentOperatingContract/{id}/renew` | Renewal journal (body: `DateTime` new end date) |
| `POST` | `/api/EmploymentOperatingContract/{id}/sign` | **No journal** (status only) |
| `POST` | `/api/ReceiptVoucher` | Receipt voucher journal (linked to contract) |

### Receipt voucher — no API change

Existing `CreateReceiptVoucherDto` is unchanged. Journal traceability now uses `EmploymentOperatingContractId` as `SourceId` on the journal entry.

### UI recommendations

1. On **contract create** success — show message that a draft revenue journal was generated (pending accountant approval).
2. On **terminate** — collect `refundAmount` if customer is due a refund; do not expect immediate cash movement.
3. After accountant approves credit note — expose **Record customer refund** action calling `customer-refund` endpoint.
4. Remove any UI expectation that **sign** triggers accounting.

---

## Integration Tests

Run:
```bash
dotnet test Sigma.IntegrationTests/Sigma.IntegrationTests.csproj
```

Key tests:
- `OperatingContractCreated_CreatesOperatingRevenueJournal`
- `OperatingContractLifecycle_AllStagesReferenceContractAndCustomer`
