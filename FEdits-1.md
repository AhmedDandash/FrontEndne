# Front-End Filtering Guide — 2/8/2026

## Summary

All major **Get All** list endpoints now support **comprehensive, optional query filters**.

- Filters are **optional** → existing clients keep working without sending any new params.
- Multiple filters are combined with **AND**.
- `null` / empty / whitespace values are **ignored**.
- String input is **trimmed**.
- Filtering runs on **IQueryable / SQL** (before sort + pagination).
- Response models are **unchanged**.

---

## Shared query parameters (`PagedFilterQueryBase`)

Most list endpoints inherit these:

| Query Param | Type | Description |
|-------------|------|-------------|
| `BranchId` | `Guid?` | Branch scope |
| `IncludeSubBranches` | `bool` (default `true`) | Include child branches |
| `Search` | `string?` | Free-text search across main fields |
| `CreatedDateFrom` / `CreatedDateTo` | `DateTime?` | Audit created range |
| `UpdatedDateFrom` / `UpdatedDateTo` | `DateTime?` | Audit updated range |
| `PageNumber` | `int` (default `1`) | Page index |
| `PageSize` | `int` (default `10`) | Page size (server clamped) |
| `SortBy` | `string?` | Endpoint-specific sort key |
| `SortDescending` | `bool` | Descending sort |

---

## String match modes

For string fields, send:

- `FieldName=value`
- optional `FieldNameMatch=0|1|2|3`

| Value | Mode | Behavior |
|------:|------|----------|
| `0` (default) | `Contains` | Case-insensitive substring |
| `1` | `Exact` | Case-insensitive equality |
| `2` | `StartsWith` | Case-insensitive prefix |
| `3` | `EndsWith` | Case-insensitive suffix |

### Examples

```http
GET /api/V1/Customer?ArabicName=أحمد&ArabicNameMatch=2
GET /api/V1/Customer?NationalId=1234567890&NationalIdMatch=1
GET /api/V1/Worker?PassportNo=AB&PassportNoMatch=0
```

---

## Field-type rules

| Field type | Query shape | Notes |
|------------|-------------|-------|
| String | `Field` + optional `FieldMatch` | Default = Contains |
| Number | `Field` / `FieldMin` / `FieldMax` or `MinField` / `MaxField` | Inclusive |
| Date/DateTime | `FieldFrom` / `FieldTo` | Inclusive |
| Bool | `Field=true|false` | Exact |
| Enum | `Field=enumValue` | Exact |
| Guid | `Field=guid` | Exact |
| Nullable relations | `FieldId=guid` or `WithoutX=true` where available | Exact / null checks |

---

## Endpoints covered in this release

### Core business

| Endpoint | Filter DTO | Highlights |
|----------|------------|------------|
| `GET /api/V1/Customer` | `CustomerQuery` | Names, NationalId, IdentityNumber, IdentityType, Mobile/Phones, Email, City/District/Address, Tax/IBAN/Bank, income/family ranges, birth/issue dates |
| `GET /api/V1/Worker` | `WorkerQuery` | Full worker profile filters + nationality/job/agent + availability flags + salary/age/height ranges |
| `GET /api/EmploymentOperatingContract` | `EmploymentOperatingContractQuery` | Contract fields, customer/worker/marketer, dates, prices/cost ranges, IdentityNumber on customer |
| `GET /api/TransferContract` | `TransferContractQuery` | Contract + customer/worker passport/phone/national id + request dates + status |
| `GET /api/Complaint` | `ComplaintQuery` | Status/source/priority + customer phone/national id + related contract + notes |
| `GET /api/Mediation/MediationContract` | `FilterMediationContractDto` | Full mediation filters + AgentId/MarketerId wired |
| `GET /api/Mediation/MediationContract/recruitment-requests` | same | Same filters |

### Lookups / offers / housing

| Endpoint | Filter DTO | Highlights |
|----------|------------|------------|
| `GET /api/V1/Agent` | `AgentQuery` (**new**) | Names, license, phones, email, company, nationality, contract type, IsActive |
| `GET /api/V1/Job` | `JobQuery` | Names, code, HasWorkCard, fees range, IsActive |
| `GET /api/V1/Marketer` | `MarketerQuery` | Marketer entity fields + match modes |
| `GET /api/V1/Branch` | `BranchQuery` | Names, phones, email, licenses, tax/domain, manager, root/parent filters |
| `GET /api/V1/Nationality` | `NationalityQuery` | Names + IsActive + audit/search |
| `GET /api/Housing/GetAll` | `FilterHousingDto` | Name/address/capacity/IsActive/HasAvailableSlots |
| `GET /api/V1/MedicalExamination` | `MedicalExaminationQuery` | Worker + status + date ranges + notes |
| `GET /api/OperatingContractOffer` | `OperatingContractOfferQuery` | Title/type/nationality/job/active/price ranges |
| `GET /api/Mediation/MediationContractOffer` | `FilterMediationContractOfferDto` | Offer number/job/nationality/worker type + cost ranges |

### Accounting

| Endpoint | Filter DTO | Highlights |
|----------|------------|------------|
| `GET /api/V1/JournalEntries` | `JournalEntryQueryDto` | Entry number/status/source/reference + party ids + dates + search |
| `GET /api/Accounting/GeneralVoucher` | `GeneralVoucherFilterDto` | Voucher number/type/status/amount range/payment method/contract/worker |
| `GET /api/Accounting/PaymentVoucher` | `AccountingDocumentFilterDto` | DocumentNumber/Type + customer/contract/agent + amount/date ranges |
| `GET /api/Accounting/CreditNote` | same | Expanded filters |
| `GET /api/Accounting/DebitNote` | same | Expanded filters |
| `GET /api/Accounting/ReceiptVoucher` | same | Expanded filters |

### Hourly workers

| Endpoint | Filter DTO | Highlights |
|----------|------------|------------|
| `GET /api/V1/HourlyWorkers` | `FilterHourlyWorkerDto` | Search/IsActive + entity fields + branch/audit |
| `GET /api/V1/HourlyWorkerRequests` | `FilterHourlyOrderDto` | Ticket/customer/city/status/payment/package/dates/phone |
| `GET /api/V1/HourlyDrivers` | `FilterHourlyDriverDto` | Driver fields + IsActive/Search |
| `GET /api/V1/HourlyCatalog/Admin/Packages` | `FilterHourlyServicePackageDto` | Package fields |
| `GET /api/V1/HourlyCatalog/Admin/ServingAreas` | `FilterHourlyServingAreaDto` | Area/city/active |
| `GET /api/V1/HourlyOrderPayments` | `FilterHourlyPaymentsDto` | Order/status/date/search |
| `GET /api/V1/HourlyOrderNotifications` | `FilterHourlyOrderNotificationDto` | Order/delivery status/phone |

### HR

| Endpoint | Filter DTO | Highlights |
|----------|------------|------------|
| `GET /api/V1/Employee` | `EmployeeQuery` (**new**) | Names, employee number, id/mobile/email, department/position/nationality, hiring date, salary range, IsActive, bank fields. Legacy `searchName` still works. Prefer `PageNumber`/`PageSize` (also supports `page`). |

---

## Practical FE usage tips

1. **Do not send empty strings** for unused filters (or send `null` / omit the param).
2. Use **exact mode** (`Match=1`) for IDs like NationalId / Passport when you need precise match.
3. Combine freely:

```http
GET /api/EmploymentOperatingContract?ContractStatus=2&IsFinish=false&ContractDateFrom=2026-01-01&WorkerNameAr=فاطمة&WorkerNameArMatch=0&PageNumber=1&PageSize=20
```

4. Swagger now documents the new query properties (XML comments included).
5. Sorting/pagination behavior is unchanged — only richer filtering was added.

---

## Compatibility notes

- Old query params remain valid (`SearchName`, `Search`, `IdNumber`, `Mobile`, etc.).
- New fields are additive only.
- No response contract breaking changes.

---

## Still limited / follow-up

These list endpoints are still mostly unfiltered dumps (no rich Filter DTO yet):

- Most HR request `GetAll` endpoints (`PermissionRequest`, `CustodyRequest`, `ResignationRequest`, `LoanRequest`, `EntitlementsRequest`, `JobModificationRequest`, HR `Complaint`)
- Admin users/roles lists
- Some ZATCA log endpoints (already have light filters)
- Lookup-only endpoints (`Departments`, `SalaryScales`, etc.)

If you need the same full-model filtering on those next, send the priority list.

---

## Quick validation checklist for Front-End

- [ ] Open Swagger → any GetAll → confirm new query params appear
- [ ] Call endpoint with **no filters** → same results as before
- [ ] Call with one string filter + `Match=Exact`
- [ ] Call with date From/To
- [ ] Call with bool + enum together
- [ ] Confirm pagination still works with filters applied
