# Accounting Documents — Complete Implementation Report

This document describes the full accounting document module for **Receipt Vouchers**, **Payment Vouchers**, **Credit Notes**, and **Debit Notes**, including APIs, journal linkage, traceability, and front-end integration notes.

All generated journal entries remain in **Draft** status until posted by an accountant via the journal posting API.

---

## Overview

| Document | Purpose | Journal Pattern | Linked Entities |
|----------|---------|-----------------|-----------------|
| Receipt Voucher | Customer payment received | DR Cash/Bank → CR Accounts Receivable | Customer, Operating Contract |
| Payment Voucher | Outbound payment (agent/vendor) | DR Payable → CR Cash/Bank | Customer (optional), Agent (optional), Contract (optional) |
| Credit Note | Reduce customer balance / refund adjustment | DR Refund Expense + DR VAT → CR A/R | Customer, Contract (optional) |
| Debit Note | Agent penalty / charge | DR Agent Payable → CR Penalty Income | Agent, Contract (optional) |

---

## Traceability Chain

Every document follows this chain:

```
Business Document (ReceiptVoucher / PaymentVoucher / CreditNote / DebitNote)
    ├── JournalEntryId          → JournalEntry (Draft)
    ├── AccountingDocumentId    → AccountingDocument (unified trace record)
    └── GET {id}/trace          → Document + Journal Lines + Ledger Entries (after posting)
```

### AccountingDocument table

| Field | Description |
|-------|-------------|
| `DocumentType` | ReceiptVoucher, PaymentVoucher, CreditNote, DebitNote |
| `DocumentNumber` | Business document number |
| `JournalEntryId` | Linked journal entry |
| `SourceEntityId` | ID of the business document |
| `SourceEntityType` | Entity type name |

### Ledger entries

Created only when the linked journal entry is **posted** (`POST api/JournalEntries/{id}/post`). Until then, `ledgerEntries` in the trace response is empty.

---

## Journal Entry Patterns (Draft)

### 1. Receipt Voucher

| Account | Debit | Credit |
|---------|-------|--------|
| Cash (101) or Bank (102) | Amount | |
| Accounts Receivable (103) | | Amount |

- `SourceId` = Operating Contract ID  
- `CustomerId` = Contract customer ID  
- Method: `RecordOperatingReceiptVoucherAsync`

### 2. Payment Voucher

| Account | Debit | Credit |
|---------|-------|--------|
| Agent Payable (203) or Accounts Payable (201) | Amount | |
| Cash (101) or Bank (102) | | Amount |

- `SourceId` = Contract ID when provided, else voucher ID  
- `CustomerId` / `AgentId` when applicable  
- Method: `RecordPaymentVoucherAsync`

### 3. Credit Note

| Account | Debit | Credit |
|---------|-------|--------|
| Customer Refunds (504) | Net | |
| VAT Payable (202) | VAT | |
| Accounts Receivable (103) | | Gross |

- `SourceId` = Contract ID when provided, else credit note ID  
- `CustomerId` required  
- Method: `RecordCreditNoteAsync`

### 4. Debit Note

| Account | Debit | Credit |
|---------|-------|--------|
| Agent Payable (203) | Amount | |
| Penalty Income (403) | | Amount |

- `SourceId` = Contract ID when provided, else debit note ID  
- `AgentId` required  
- Method: `RecordDebitNoteAsync`

---

## API Endpoints

Base route for all documents: `api/Accounting/{Controller}`

### Receipt Voucher — `api/Accounting/ReceiptVoucher`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List with optional filters |
| GET | `/{id}` | Get by ID |
| GET | `/{id}/trace` | Full traceability chain |
| POST | `/` | Create + auto journal |

**Create body:**
```json
{
  "voucherNumber": "RV-001",
  "voucherDate": "2026-06-14T00:00:00Z",
  "amount": 1150.00,
  "notes": "Customer payment",
  "employmentOperatingContractId": "guid",
  "paymentMethod": 1,
  "vatAmount": null,
  "bankFees": null
}
```

**Response includes:** `journalEntryId`, `accountingDocumentId`, `customerId`, `employmentOperatingContractId`

### Payment Voucher — `api/Accounting/PaymentVoucher`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List with filters |
| GET | `/{id}` | Get by ID |
| GET | `/{id}/trace` | Traceability |
| POST | `/` | Create + auto journal |

**Create body:**
```json
{
  "voucherNumber": "PV-001",
  "voucherDate": "2026-06-14T00:00:00Z",
  "amount": 500.00,
  "notes": "Agent payout",
  "paymentMethod": 2,
  "payeeId": "agent-guid",
  "payeeType": "Agent",
  "customerId": "optional-customer-guid",
  "sourceContractId": "optional-contract-guid",
  "sourceContractType": "MediationContract"
}
```

### Credit Note — `api/Accounting/CreditNote`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List with filters |
| GET | `/{id}` | Get by ID |
| GET | `/{id}/trace` | Traceability |
| POST | `/` | Create + auto journal |

**Create body:**
```json
{
  "creditNoteNumber": "CN-001",
  "creditNoteDate": "2026-06-14T00:00:00Z",
  "amount": 800.00,
  "vatAmount": null,
  "reason": "Service adjustment",
  "notes": "Optional notes",
  "customerId": "guid",
  "sourceContractId": "optional-contract-guid",
  "sourceContractType": "EmploymentOperatingContract"
}
```

### Debit Note — `api/Accounting/DebitNote`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List with filters |
| GET | `/{id}` | Get by ID |
| GET | `/{id}/trace` | Traceability |
| POST | `/` | Create + auto journal |

**Create body:**
```json
{
  "debitNoteNumber": "DN-001",
  "debitNoteDate": "2026-06-14T00:00:00Z",
  "amount": 400.00,
  "vatAmount": null,
  "reason": "Agent penalty",
  "agentId": "guid",
  "sourceContractId": "optional-contract-guid",
  "sourceContractType": "MediationContract"
}
```

### Shared query filters (`AccountingDocumentFilterDto`)

| Parameter | Applies to |
|-----------|------------|
| `customerId` | Receipt, Payment, Credit |
| `agentId` | Payment (payee), Debit |
| `contractId` | All (contract/source field) |
| `dateFrom` / `dateTo` | Document date range |

### Trace response (`AccountingDocumentTraceDto`)

```json
{
  "documentType": "ReceiptVoucher",
  "documentEntityId": "guid",
  "document": {
    "id": "guid",
    "journalEntryId": "guid",
    "accountingDocumentId": "guid",
    "customerId": "guid",
    "contractId": "guid",
    "journalStatus": "Draft"
  },
  "journalEntry": {
    "entryNumber": "JE-2026-0001",
    "status": "Draft",
    "lines": [
      { "accountCode": "101", "accountName": "Cash", "debit": 1150, "credit": 0 }
    ]
  },
  "ledgerEntries": []
}
```

---

## Code Changes Summary

### New files
| File | Purpose |
|------|---------|
| `Sigma.Domain/Entities/Accounting/IAccountingDocumentEntity.cs` | Shared journal link interface |
| `Sigma.Application/Common/Accounting/AccountingDocumentHelper.cs` | Payment method mapping + journal link helper |
| `Sigma.Application/Services/Accounting/AccountingDocumentTraceService.cs` | Document → journal → ledger trace |
| `Sigma.Application/Validators/Accounting/AccountingDocumentValidators.cs` | FluentValidation for all create DTOs |
| `docs/ACCOUNTING_DOCUMENTS.md` | This report |

### Modified — Domain
- `ReceiptVoucher` — `CustomerId`, `AccountingDocumentId`, `IAccountingDocumentEntity`
- `PaymentVoucher` — `CustomerId`, `SourceContractId`, `SourceContractType`, `AccountingDocumentId`
- `CreditNote` / `DebitNote` — explicit `AccountingDocumentId`, required customer/agent IDs on create

### Modified — Application
- Expanded `AccountingDocumentDtos.cs` — response DTOs, filters, trace DTOs
- `AccountingDocumentServices.cs` — full CRUD-style services with journal + document linkage
- `ReceiptVoucherService` — filters, mandatory journal on create, `AccountingDocumentId`
- `AccountingIntegrationService` — payment/credit/debit journals now carry contract/customer/agent refs
- `IAccountingDocumentServices.cs` — trace service + expanded interfaces

### Modified — API
- `ReceiptVoucherController` — moved to `api/Accounting/ReceiptVoucher`, validation, trace endpoint
- `AccountingDocumentControllers.cs` — full REST for Payment/Credit/Debit with validation + trace
- **Removed** legacy `api/V1/PaymentVoucher` routes (replaced by `api/Accounting/*`)

### Modified — Infrastructure
- `ReceiptVoucherConfiguration.cs` — added Payment/Credit/Debit EF configurations
- EF migration: `EnhanceAccountingDocumentLinks` (CustomerId on ReceiptVoucher, contract fields on PaymentVoucher)

### Tests
- Updated integration tests for new integration method signatures
- Added `PaymentVoucher_CreatesAccountingDocumentTrace` test

---

## Validation Rules

| DTO | Key rules |
|-----|-----------|
| `CreateReceiptVoucherDto` | Contract required, amount > 0, date required |
| `CreatePaymentVoucherDto` | Amount > 0, date required |
| `CreateCreditNoteDto` | Number required, customer required, amount > 0 |
| `CreateDebitNoteDto` | Number required, agent required, amount > 0 |

---

## Database Migration

```bash
dotnet ef database update --project Sigma.Infrastructure --startup-project Sigma.API
```

---

## Front-End Integration

### Route changes (breaking)

| Old route | New route |
|-----------|-----------|
| `POST api/ReceiptVoucher` | `POST api/Accounting/ReceiptVoucher` |
| `GET api/ReceiptVoucher` | `GET api/Accounting/ReceiptVoucher` |
| `POST api/V1/PaymentVoucher` | `POST api/Accounting/PaymentVoucher` |
| `POST api/V1/CreditNote` | `POST api/Accounting/CreditNote` |
| `POST api/V1/DebitNote` | `POST api/Accounting/DebitNote` |

### New endpoints for UI

- `GET api/Accounting/{DocumentType}/{id}/trace` — audit trail screen
- `GET api/Accounting/{DocumentType}?customerId=&contractId=&dateFrom=&dateTo=` — filtered lists

### Response shape change

All create/list/get responses now return wrapped `ApiResponse<T>` with:

- `journalEntryId` — link to journal review screen  
- `accountingDocumentId` — link to unified document trace  
- `customerId` / `agentId` / `contractId` fields where applicable

### Payment method values

| Value | Meaning |
|-------|---------|
| `1` | Cash |
| `2` | Bank |
| `3` | Card |

### UI workflow

1. **Create document** → API returns draft journal IDs  
2. **Show pending status** → `journalStatus: "Draft"` from trace endpoint  
3. **Accountant posts journal** → ledger entries appear in trace  
4. **Use trace endpoint** for document detail / audit pages

### Payee type for payment vouchers

Set `payeeType: "Agent"` and `payeeId: {agentId}` for agent payouts; omit or use other values for general payables.

---

## Related Documentation

- [Operating Contract Accounting](./OPERATING_CONTRACT_ACCOUNTING.md) — auto receipt vouchers on operating contracts
- [Payroll Accounting](./PAYROLL_ACCOUNTING.md) — payroll runs, approval, payments, employee advances
- [Accounting Integration Implementation](../ACCOUNTING_INTEGRATION_IMPLEMENTATION.md) — broader integration module
