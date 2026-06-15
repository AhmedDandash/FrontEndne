# Accounting Module — Implementation Handoff

**Project:** Sigma ERP — Frontend (Next.js App Router + Ant Design + React Query)
**Module:** Accounting (Chart of Accounts, Account Settings, Restriction Types)
**API base:** `/api/V1` (Sigma Accounting API — `Accounting.pdf`)
**Status:** ✅ Delivered & verified (`tsc` clean, `eslint` clean, `next build` clean)
**Date:** 2026-06-10

---

## 1. Completed

### 1.1 Features implemented
| Feature | Page | Operations |
|---|---|---|
| **Chart of Accounts** *(primary surface)* | `/accounting/chart-of-accounts` | Full **tree** (`full-tree-structure`) with expand/collapse all, search (highlights + auto-expands ancestors), account-type legend, details panel; **inline CRUD on every node** — add sub-account, rename, reporting settings, delete (leaf-only) — plus **Add Root Account**. Mirrors the original `/Accounts` page where the tree is the management surface. |
| **Account Settings** *(edit/delete/add list)* | `/accounting/account-settings` | Paginated/searchable flat list (`/account/settings`); same **Create / Rename / Reporting / Delete** operations via the **shared `AccountModals`** component; deep-link prefill via `?searchTerm=`. |
| **Restriction Types** | `/accounting/restriction-types` | List + client search/filter (mode, status); **Edit** (name/event/accounts/flags); **inline active toggle**; **Delete**; Create **disabled** (backend 501) |

### 1.2 Pages created
```
src/app/accounting/chart-of-accounts/page.tsx        + ChartOfAccounts.module.css
src/app/accounting/account-settings/page.tsx         + AccountSettings.module.css
src/app/accounting/restriction-types/page.tsx        + RestrictionTypes.module.css
```

### 1.3 Supporting code created
```
src/types/accounting.types.ts                 # DTOs, enums (AccountReportSide, AccountingEvent, account-type taxonomy), label helpers
src/services/account.service.ts               # Account CRUD + tree/settings normalization
src/services/restriction-type.service.ts      # RestrictionType CRUD
src/hooks/api/useAccounts.ts                  # useAccountTree() + useAccountSettings()
src/hooks/api/useRestrictionTypes.ts          # useRestrictionTypes()
```

### 1.4 Files modified
```
src/config/api.config.ts          # ACCOUNT + RESTRICTION_TYPE endpoint groups
src/services/index.ts             # barrel exports
src/components/layout/Sidebar.tsx # "Accounting" menu group + 3 children
```

### 1.5 Endpoints integrated (vs. `Accounting.pdf`)

**Account Controller — `/api/V1/account`**
| Method | Path | UI | Status |
|---|---|---|---|
| GET | `/full-tree-structure` | Chart (roots), Settings (parent picker), Restriction (account pickers) | ✅ |
| GET | `/subtree/{parentId}` | `getFullTree()` loads each non-leaf node's children to assemble the full nested tree | ✅ wired |
| GET | `/settings` (paged) | Account Settings list | ✅ |
| POST | `/create-account` | Settings → Add Account | ✅ |
| PUT | `/update-account/{id}` | Settings → Edit name | ✅ |
| PUT | `/reporting/{id}` | Settings → Reporting settings | ✅ |
| DELETE | `/delete-account/{id}` | Settings → Delete (leaf-only) | ✅ |

**RestrictionType Controller — `/api/V1/restrictiontype`**
| Method | Path | UI | Status |
|---|---|---|---|
| GET | `/` | Restriction Types list | ✅ |
| GET | `/{id}` | — (in service; UI edits from row data) | ✅ available |
| POST | `/` | Add Restriction Type modal | ✅ (backend now implemented) |
| PUT | `/{id}` | Edit + inline active toggle | ✅ |
| DELETE | `/{id}` | Delete | ✅ |

### 1.6 Backend enums wired (confirmed from source)
- **`AccountReportSide`**: `Debit=1, Credit=2, Hidden=3` → income-statement / P&L side selectors + labels.
- **`AccountingEvent`** (0-indexed): `ContractSigned=0, CustomerPayment=1, AgentCommission=2, VisaIssued=3, Arrival=4, Escape=5, Ticket=6, Transfer=7` → Restriction Types event column + selector.

### 1.7 UI/UX decisions
1. **Full-tree fetch** (not lazy `subtree`) — enables instant client-side search across all nodes; tree size is modest. `subtree` kept in the service for future lazy-loading.
2. **Account type by leading code digit** (1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 OpEx · 6 AdminEx) — color-coded tags + legend; per the PDF code convention.
3. **Leaf-only delete** enforced client-side (disabled + tooltip) to mirror the backend rule and avoid futile calls.
4. **Create code validation**: digits-only, must start with the parent code, must be longer than the parent — inferred from the PDF.
5. **Restriction create** is wired through the shared create/edit modal. (The endpoint previously returned **501**; it is now implemented server-side and verified working — POST returns 200 and persists. The backend requires **both** `Name` and `NameAr`, so English name is a required field.)
6. **`accountingEvent` required only when event-driven** (`isManual=false`); clearable for manual entries.
7. **Inline active toggle** uses `PUT` with the full DTO (no dedicated toggle endpoint exists).
8. **Default debit/credit pickers** are searchable selects sourced from the chart of accounts; the table resolves IDs to `code — name` via a tree-built map.
9. **Bilingual AR/EN + RTL** via `useAuthStore` language and a local `t()` helper, matching the platform.
10. **Shared visual language** — same gradient header, card, table, and CSS-module conventions as existing pages (custody-types, housing, etc.).
11. **Deep link** Chart → Settings (`?searchTerm=<code>`) is consumed on mount to prefill/filter.

---

## 2. Remaining Work

### 2.1 Not yet implemented (out of current scope / no API yet)
The legacy accounting menu (`accounting.txt`) contains many screens **not present in the API PDF** and therefore not built:
- Journal entries (قيود اليومية), Ledger (دفتر الأستاذ), Revenues & Expenses, Liquidity report
- Trial Balance (+ grouped), Account lists, Tax report, Contract profit reports, Account-balance analysis
- Fiscal-year closing, Budget, Financial position, Income statement, Balance sheet
- Vouchers (السندات: general + fixed-asset), Account statements (customer / customers / bank / agent / detailed)
- ZATCA tax invoices, Fixed assets (classification / management / balance), Worker salaries, Contract instalments

### 2.2 Blockers / missing backend functionality
- ~~`POST /restrictiontype` → 501 Not Implemented.~~ **Resolved** — endpoint is implemented and verified; create UI is live.
- **`GET /restrictiontype` has no server-side search/filter/paging** — handled client-side (fine for small lists; revisit at scale).
- **`POST /restrictiontype` returns a plain success string** (`"تم الانشاء بنجاح ."`) rather than the created entity, so the client can't optimistically use the new row — it relies on query invalidation + refetch (which works).
- **No query-error surface from the API envelope** beyond the global 401 interceptor; GET failures currently fall back to empty states.

### 2.3 Assumptions made
- Responses use the `ApiResponse` envelope `{ statusCode, isSuccess, message, data }` and may serialize arrays as `{ $values: [] }` (System.Text.Json reference handling) — **normalized in the services**.
- Account-type taxonomy is derived from the **leading code digit** (per PDF).
- `AccountingEvent` is serialized as an **integer** (consistent with every other enum in the API).
- `accountingEvent` may be null for manual entries (no `None` member, but the field is nullable).
- `PUT /reporting/{id}` expects all three fields together.
- Default debit/credit accounts may be **any** account (UI does not restrict to leaves).

---

## 3. Recommendations

### 3.1 Suggested next development tasks
1. **Query-error UI** (Ant `Result`/`Alert` + retry) on all three pages for GET failures.
2. ~~Flip Restriction "Create" live~~ — **done** (create modal wired to the now-working endpoint).
3. **Build the remaining reports/vouchers screens** as their endpoints are published (section 2.1).
4. **Wire `subtree` lazy-loading** if the chart grows large enough to affect first-paint.

### 3.2 Potential improvements
- **Debounce** the Account Settings search (currently one request per keystroke).
- **Restrict default debit/credit selectors to leaf (postable) accounts** if the backend requires it.
- Use **`getById`** for the Restriction edit modal if the list DTO ever diverges from the detail DTO.
- Add **role/permission gating** for accounting screens once accounting privileges are defined (today they rely on the global auth guard).

### 3.3 Technical debt / future refactoring
- Service unwrap helpers use `any` for tolerant parsing — could be tightened with generics or a schema validator (e.g. zod).
- Two unwrap styles exist (`account.service` has a bespoke `normalizeTree`; restriction/housing share a generic `unwrapList`) — consider a **single shared `api-normalize` util**.
- The full tree is fetched by both the Chart and Restriction pages; React Query **dedupes via a shared key**, so this is acceptable but worth keeping in mind.

---

## 4. Verification performed
- `npx tsc --noEmit` — **0 errors** (whole project).
- `npx eslint` (all accounting files) — **clean**.
- `npx next build` — **success**; all three routes prerendered static with **no accounting-specific warnings**:
  - `/accounting/account-settings` · `/accounting/chart-of-accounts` · `/accounting/restriction-types`
- Manual trace of each CRUD path against endpoint config + service body mapping.
- Edge cases checked: leaf-only delete guard, create-code rules, 501 create handling, event-required-when-event-driven, loading/empty states, RTL/i18n, deep-link prefill.
