# Payroll Accounting Integration

This document describes the payroll accounting module: payroll runs, approval workflow, journal generation, employee/worker payments, loan (سلفة) integration, and HR entitlement accruals.

All generated journal entries remain in **Draft** status until posted via `POST api/JournalEntries/{id}/post`.

---

## Overview

| Component | Purpose | Journal Pattern |
|-----------|---------|-----------------|
| Payroll Run (approval) | Monthly salary accrual | DR Salaries (501) → CR Salary Payable (205) |
| Payroll Payment | Salary disbursement | DR Salary Payable (205) → CR Cash/Bank (101/102) |
| Loan Disbursement (سلفة) | Employee advance on approve | DR Employee Advances (106) → CR Cash/Bank |
| Loan Repayment (payroll) | Deduct advance from payroll | DR Salary Payable (205) → CR Employee Advances (106) |
| Employee Entitlement | Bonus/allowance accrual | DR Salaries (501) → CR Salary Payable (205) |

---

## Payroll Workflow

```
Generate Payroll (Draft)
    → Submit for Approval (PendingApproval)
    → Approve (Approved) + Accrual Journal + Loan Repayment Journals
    → Record Payment(s) (PartiallyPaid / Paid) + Payment Journal(s)
    → Close (Closed)
```

### Status lifecycle (`PayrollRunStatus`)

| Value | Name | Description |
|-------|------|-------------|
| 0 | Draft | Generated, editable |
| 1 | PendingApproval | Submitted for review |
| 2 | Approved | Accrual journal created |
| 3 | PartiallyPaid | Some payments recorded |
| 4 | Paid | Fully paid |
| 5 | Closed | Locked |

---

## Journal Entry Patterns (Draft)

### 1. Payroll Accrual (on approve)

| Account | Code | Debit | Credit |
|---------|------|-------|--------|
| Salaries | 501 | Net total | |
| Salary Payable | 205 | | Net total |

- Method: `RecordPayrollAccrualAsync`
- Document type: `PayrollRun`
- Linked to: `PayrollRun.JournalEntryId`, `PayrollRun.AccountingDocumentId`

### 2. Payroll Payment

| Account | Code | Debit | Credit |
|---------|------|-------|--------|
| Salary Payable | 205 | Amount | |
| Cash or Bank | 101/102 | | Amount |

- Method: `RecordPayrollPaymentAsync`
- Document type: `PayrollPayment`
- Supports partial payments per employee, worker, or bulk (no `employeeId`/`workerId`)

### 3. Loan Disbursement (سلفة — on loan approve)

| Account | Code | Debit | Credit |
|---------|------|-------|--------|
| Employee Advances | 106 | Loan amount | |
| Cash or Bank | 101/102 | | Loan amount |

- Method: `RecordLoanDisbursementAsync`
- Triggered by: `LoanRequestService.ApproveAsync`
- Linked to: `LoanRequest.JournalEntryId`

### 4. Loan Repayment (on payroll approve)

| Account | Code | Debit | Credit |
|---------|------|-------|--------|
| Salary Payable | 205 | Deduction | |
| Employee Advances | 106 | | Deduction |

- Method: `RecordLoanRepaymentAsync`
- One journal per employee with `LoanDeduction > 0`
- Updates `LoanRequest.OutstandingBalance` and `IsFullyRepaid`

### 5. Employee Entitlement (on entitlement approve)

| Account | Code | Debit | Credit |
|---------|------|-------|--------|
| Salaries | 501 | Amount | |
| Salary Payable | 205 | | Amount |

- Method: `RecordEmployeeEntitlementAsync`
- Triggered by: `EntitlementsRequestService.ApproveAsync`
- Linked to: `EntitlementsRequest.JournalEntryId`

---

## Entities

| Entity | Table | Accounting Link |
|--------|-------|-----------------|
| `PayrollRun` | PayrollRuns | `IAccountingDocumentEntity` — accrual journal |
| `PayrollEmployee` | PayrollEmployees | Per-employee salary lines |
| `PayrollWorker` | PayrollWorkers | Per-worker salary lines |
| `PayrollPayment` | PayrollPayments | `IAccountingDocumentEntity` — payment journal |
| `PayrollApproval` | PayrollApprovals | Approval audit trail |
| `LoanRequest` | LoanRequests | `HRRequestBase` journal fields — disbursement |
| `EntitlementsRequest` | EntitlementsRequests | `HRRequestBase` journal fields — entitlement |

### Payroll calculation (employees)

```
NetSalary = BaseSalary + Overtime + Bonus
          - Late - Absence - Leave - AdditionalDeduction - LoanDeduction
```

Workers use: `BaseSalary + Overtime + Bonus - Deductions`

Loan deduction is computed from approved loans with `OutstandingBalance > 0`.

---

## API Endpoints

Base route: `api/V1/Payroll`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/generate` | Generate payroll for month/year |
| GET | `/` | Get payroll by `month` + `year` query params |
| GET | `/{id}` | Get payroll run by ID |
| GET | `/history` | List payroll history (`?year=` optional) |
| PUT | `/{id}/submit` | Submit for approval |
| PUT | `/{id}/approve` | Approve + create accrual journal |
| PUT | `/{id}/reject` | Reject back to draft |
| POST | `/{id}/payments` | Record partial/full payment |
| PUT | `/close/{id}` | Close payroll run |
| GET | `/export` | Export Excel (`month`, `year`) |
| GET | `/{id}/trace` | Accrual journal traceability |
| GET | `/{payrollRunId}/payments/{paymentId}/trace` | Payment journal traceability |

### Generate payroll

```json
{
  "month": 6,
  "year": 2026,
  "includeWorkers": true
}
```

### Record payment (partial or full)

```json
{
  "paymentDate": "2026-06-22T00:00:00Z",
  "amount": 5000.00,
  "paymentMethod": 2,
  "notes": "June salary - employee partial",
  "employeeId": "optional-employee-guid",
  "workerId": null
}
```

Payment method: `1` = Cash, `2` = Bank, `3` = Card

Omit both `employeeId` and `workerId` for a bulk payment against the run total.

---

## HR Request Accounting

Employee-related financial requests automatically create draft journals on **approval**:

| Request | API | Journal on Approve |
|---------|-----|-------------------|
| Loan (سلفة) | `api/V1/LoanRequest/Approve/{id}` | Employee Advances / Bank |
| Entitlements | `api/V1/EntitlementsRequest/Approve/{id}` | Salaries / Salary Payable |

Both store `journalEntryId` and `accountingDocumentId` on the request entity for traceability.

---

## Traceability

```
PayrollRun / PayrollPayment / LoanRequest / EntitlementsRequest
    ├── JournalEntryId          → JournalEntry (Draft)
    ├── AccountingDocumentId    → AccountingDocument (unified trace)
    └── GET .../trace           → Document + Journal Lines + Ledger (after posting)
```

Trace endpoints:
- `GET api/V1/Payroll/{id}/trace` — payroll accrual
- `GET api/V1/Payroll/{runId}/payments/{paymentId}/trace` — salary payment

---

## Database Migration

Apply the payroll accounting migration:

```bash
dotnet ef database update --project Sigma.Infrastructure --startup-project Sigma.API
```

Migration: `20260622091751_PayrollAccountingIntegration`

Adds:
- `PayrollWorkers`, `PayrollPayments`, `PayrollApprovals` tables
- Enhanced `PayrollRuns` (status, totals, journal links, approval fields)
- `PayrollEmployees` loan/paid tracking columns
- `LoanRequests` outstanding balance + journal links
- `JournalEntryId` / `AccountingDocumentId` on all HR request tables
- Account seed: Salary Payable (205)

---

## Code Structure

| Layer | Key Files |
|-------|-----------|
| Domain | `Sigma.Domain/Entities/HR/Payroll*.cs`, `LoanRequest.cs`, `EntitlementsRequest.cs` |
| Application | `Sigma.Application/Services/HR/PayrollService.cs` |
| Accounting | `Sigma.Application/Services/Accounting/AccountingIntegrationService.cs` |
| API | `Sigma.API/Controllers/HR/PayrollController.cs` |
| Validators | `Sigma.Application/Validators/HR/PayrollValidators.cs` |
| EF Config | `Sigma.Infrastructure/Data/Configration/PayrollConfiguration.cs` |
| Tests | `Sigma.IntegrationTests/Accounting/AccountingIntegrationTests.cs` |

---

## Front-End Integration Notes

1. **Generate** → show employee/worker lines with net amounts
2. **Submit / Approve** → after approve, display `journalEntryId` and pending draft status
3. **Payments** → allow per-employee, per-worker, or bulk; track `remainingAmount`
4. **History** → use `GET /history` for period list with status badges
5. **Loans** → show `outstandingBalance` on employee profile; deduct automatically on payroll approve
6. **Post journals** → accountant posts via journal API; ledger entries appear in trace

---

## Related Documentation

- [Accounting Documents](./ACCOUNTING_DOCUMENTS.md) — voucher patterns and trace APIs
- [Accounting Integration](../ACCOUNTING_INTEGRATION_IMPLEMENTATION.md) — broader integration module
