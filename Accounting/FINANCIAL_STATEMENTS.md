# Financial Statements & Period Closing

Complete financial reporting module with account-type-aware calculations, period closing, and validation tests.

---

## Reports

| Report | Endpoint | Validates |
|--------|----------|-----------|
| General Ledger | `GET api/V1/Ledger/general-ledger` | Opening, debit/credit movement, closing, running balance |
| Trial Balance | `GET api/V1/Ledger/trial-balance` | Debit/credit columns, period movement, `IsBalanced` |
| Income Statement | `GET api/V1/Ledger/income-statement` | Revenue/expense sections, net income |
| Balance Sheet | `GET api/V1/Ledger/balance-sheet` | Assets = Liabilities + Equity, current year earnings |
| VAT Report | `GET api/V1/Ledger/vat-report` | Output/input VAT, net payable |

---

## Account-Type-Aware Balance Rules

| Type | Normal Balance | Closing Formula |
|------|----------------|-----------------|
| Asset / Expense | Debit | Opening + Debit − Credit |
| Liability / Equity / Revenue | Credit | Opening + Credit − Debit |

Implemented in `AccountingBalanceHelper` and `FinancialReportCalculator`.

---

## Period Closing

**Endpoint:** `POST api/V1/PeriodClosing/close`

```json
{ "year": 2026, "month": 3 }
```

### Closing entries (auto-posted)

1. **Close revenue** → DR Revenue accounts, CR Income Summary (390)
2. **Close expenses** → DR Income Summary, CR Expense accounts
3. **Transfer net income/loss** → DR/CR Income Summary ↔ Retained Earnings (302)

After close:
- Revenue and expense balances = 0
- Retained earnings reflects net income/loss
- Posting to closed period is blocked

**Check status:** `GET api/V1/PeriodClosing/status?year=2026&month=3`

---

## Equity Accounts (Seeded)

| Code | Name | Purpose |
|------|------|---------|
| 301 | Share Capital | Owner equity |
| 302 | Retained Earnings | Accumulated profits |
| 390 | Income Summary | Temporary closing account |

---

## Report Response Enhancements

### Trial Balance
- `OpeningDebit` / `OpeningCredit` / `ClosingDebit` / `ClosingCredit`
- `IsBalanced` — Σ closing debit columns = Σ closing credit columns
- `ExcludeZeroBalances` filter

### Income Statement
- Structured sections: Revenue, Operating Expenses, Admin Expenses
- `TotalRevenue`, `GrossProfit`, `NetIncome`, `IsValid`

### Balance Sheet
- `CurrentYearEarnings` computed line (pre-close)
- `IsBalanced`, `Difference` validation

### VAT Report
- Line-level detail with net movement per VAT account
- Custom date range via `from` / `to` query params

---

## Tests

250 report validation scenarios in `Sigma.IntegrationTests/Accounting/Reports/`:

| File | Tests |
|------|-------|
| `GeneralLedgerReportTests.cs` | 50 |
| `TrialBalanceReportTests.cs` | 50 |
| `IncomeStatementReportTests.cs` | 50 |
| `BalanceSheetReportTests.cs` | 50 |
| `VatReportReportTests.cs` | 50 |
| `PeriodClosingReportTests.cs` | 2 (integration) |

Run:
```bash
dotnet test Sigma.IntegrationTests --filter "FullyQualifiedName~Accounting.Reports"
```

---

## Migration

```bash
dotnet ef migrations add FinancialStatementsAndPeriodClosing --project Sigma.Infrastructure --startup-project Sigma.API
dotnet ef database update --project Sigma.Infrastructure --startup-project Sigma.API
```

---

## Related

- [Payroll Accounting](./PAYROLL_ACCOUNTING.md)
- [Accounting Documents](./ACCOUNTING_DOCUMENTS.md)
