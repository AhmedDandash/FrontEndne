# Parameter Gap Analysis

Source files reviewed:

- `website_filters_extracted.md`
- `simga-api.txt`
- `day-8-8.md`

Rule applied: a filter is implemented only when the target page endpoint exposes a matching query parameter. `day-8-8.md` supersedes the earlier gap list for the filters it marks backend-ready.

Supported mapping note: for Mediation Contracts and Automatic Follow-Up, **Client Name / اسم العميل** and **Worker Name / اسم العامل** are implemented as name-search selectors that submit the backed UUID parameters `CustomerId` and `WorkerId`.

## Remaining Backend Gaps

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** حالة عقد مساند / Musaned Contract Status
  **Expected Parameter Name (camelCase / snake_case):** `musanedContractStatus` / `musaned_contract_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Not supported per `day-8-8.md`; Musaned detail table was removed, so there is no backend column to filter. Keep hidden/disabled until backend support returns.

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** حالة عقد مساند / Musaned Contract Status
  **Expected Parameter Name (camelCase / snake_case):** `musanedContractStatus` / `musaned_contract_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Not supported per `day-8-8.md`; Musaned detail table was removed, so there is no backend column to filter. Keep hidden/disabled until backend support returns.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** الحالة المالية / Financial Status
  **Expected Parameter Name (camelCase / snake_case):** `financialStatus` / `financial_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Not supported per `day-8-8.md`; there is no financial-status field on operating contracts. Keep hidden/disabled until backend support returns.
