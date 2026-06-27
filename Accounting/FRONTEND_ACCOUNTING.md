# دليل تكامل الفرونت إند — وحدة المحاسبة (Sigma.API)

> **الجمهور:** فريق الفرونت إند  
> **الهدف:** مرجع واحد كامل لبناء شاشات المحاسبة وربطها بالـ API  
> **آخر تحديث:** يونيو 2026

---

## فهرس المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [اتفاقيات الـ API](#2-اتفاقيات-الapi)
3. [خريطة الشاشات المطلوبة](#3-خريطة-الشاشات-المطلوبة)
4. [دليل الحسابات (Chart of Accounts)](#4-دليل-الحسابات-chart-of-accounts)
5. [الـ Enums](#5-ال-enums)
6. [شجرة الحسابات وإعداداتها](#6-شجرة-الحسابات-وإعداداتها)
7. [قيود اليومية (Journal Entries)](#7-قيود-اليومية-journal-entries)
8. [الترحيل وإلغاء الترحيل (Posting)](#8-الترحيل-وإلغاء-الترحيل-posting)
9. [مستندات المحاسبة](#9-مستندات-المحاسبة)
10. [التقارير المالية](#10-التقارير-المالية)
11. [إقفال الفترة المحاسبية](#11-إقفال-الفترة-المحاسبية)
12. [أنواع القيود (Restriction Types)](#12-أنواع-القيود-restriction-types)
13. [كشوف الأطراف (Agent / Customer / Worker)](#13-كشوف-الأطراف-agent--customer--worker)
14. [التكامل التلقائي من وحدات أخرى](#14-التكامل-التلقائي-من-وحدات-أخرى)
15. [الرواتب والسلف (HR)](#15-الرواتب-والسلف-hr)
16. [سلسلة التتبع (Traceability)](#16-سلسلة-التتبع-traceability)
17. [قواعد العمل المهمة](#17-قواعد-العمل-المهمة)
18. [أخطاء شائعة من الـ API](#18-أخطاء-شائعة-من-الapi)
19. [TypeScript Interfaces مقترحة](#19-typescript-interfaces-مقترحة)
20. [Checklist تنفيذ الفرونت](#20-checklist-تنفيذ-الفرونت)
21. [مراجع إضافية](#21-مراجع-إضافية)

---

## 1. نظرة عامة

وحدة المحاسبة في Sigma تتكون من:

| المكوّن | الوصف |
|---------|--------|
| **شجرة الحسابات** | دليل حسابات هرمي (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات) |
| **قيود اليومية** | قيود يدوية أو تلقائية — تبدأ دائماً بحالة `Draft` |
| **الترحيل** | تحويل القيد من مسودة إلى مُرحَّل وتحديث أرصدة الحسابات |
| **مستندات محاسبية** | سند قبض، سند صرف، إشعار دائن، إشعار مدين |
| **التقارير** | دفتر أستاذ، ميزان مراجعة، قائمة دخل، ميزانية، ضريبة VAT |
| **إقفال الفترة** | إقفال شهري مع قيود إغلاق تلقائية |
| **التكامل** | عقود تشغيل، وساطة، رواتب، سلف — تولّد قيوداً تلقائياً |

### سير العمل الأساسي

```
إنشاء مستند / قيد تلقائي
        ↓
   حالة Draft (مسودة)
        ↓
   مراجعة المحاسب
        ↓
POST api/V1/Posting/{journalId}  ← الترحيل
        ↓
   حالة Posted + حركات في دفتر الأستاذ
        ↓
   تظهر في التقارير والكشوف
```

> **مهم:** لا يؤثر أي قيد على الأرصدة أو التقارير إلا بعد **الترحيل**.

---

## 2. اتفاقيات الـ API

### Base URLs

| المجموعة | البادئة |
|----------|---------|
| الحسابات، القيود، التقارير، الترحيل، الإقفال، أنواع القيود | `api/V1/{Controller}` |
| مستندات المحاسبة (سندات وإشعارات) | `api/Accounting/{Controller}` |
| الرواتب | `api/V1/Payroll` |

### شكل الاستجابة الموحّد `ApiResponse<T>`

```json
{
  "success": true,
  "data": { },
  "errors": null,
  "statusCode": 200
}
```

عند الخطأ:

```json
{
  "success": false,
  "data": null,
  "errors": ["رسالة الخطأ"],
  "statusCode": 400
}
```

### Pagination `PagedResponse<T>`

```json
{
  "items": [],
  "totalCount": 150,
  "pageNumber": 1,
  "pageSize": 20
}
```

### المصادقة (Auth)

| Controller | يتطلب Token؟ |
|------------|-------------|
| `Posting` | نعم `[Authorize]` |
| `PeriodClosing` | نعم `[Authorize]` |
| باقي controllers المحاسبة | **لا** (حالياً بدون Authorize — قد يُفعَّل لاحقاً) |

أرسل الـ JWT في الهيدر:
```
Authorization: Bearer {token}
```

### تواريخ

- أرسل التواريخ بصيغة ISO 8601: `"2026-06-25T00:00:00Z"`
- فلاتر التقارير تستخدم `from` / `to` / `asOfDate` حسب الـ endpoint

---

## 3. خريطة الشاشات المطلوبة

### 3.1 الإعدادات

| الشاشة | الـ APIs | الحالة المتوقعة |
|--------|----------|----------------|
| شجرة الحسابات | `GET full-tree-structure`, CRUD | أساسية |
| إعدادات التقارير للحساب | `GET settings`, `PUT reporting/{id}` | قد تكون ناقصة |
| أنواع القيود | `GET/POST/PUT/DELETE RestrictionType` | قد تكون ناقصة |

### 3.2 العمليات اليومية

| الشاشة | الـ APIs |
|--------|----------|
| قائمة قيود اليومية | `GET JournalEntries` + فلاتر |
| إنشاء/تعديل قيد يدوي | `POST/PUT JournalEntries` |
| تفاصيل قيد | `GET JournalEntries/{id}` |
| ترحيل / إلغاء ترحيل | `POST Posting/{id}`, `POST Posting/{id}/unpost` |
| سندات القبض | `api/Accounting/ReceiptVoucher` |
| سندات الصرف | `api/Accounting/PaymentVoucher` |
| إشعارات دائنة | `api/Accounting/CreditNote` |
| إشعارات مدينة | `api/Accounting/DebitNote` |
| شاشة تتبع المستند | `GET .../{id}/trace` |

### 3.3 التقارير

| الشاشة | الـ API |
|--------|---------|
| دفتر الأستاذ العام | `GET Ledger/general-ledger` |
| ميزان المراجعة | `GET Ledger/trial-balance` |
| قائمة الدخل | `GET Ledger/income-statement` |
| الميزانية العمومية | `GET Ledger/balance-sheet` |
| تقرير ضريبة القيمة المضافة | `GET Ledger/vat-report` |
| كشف حساب عميل | `GET Ledger/customer-ledger` |
| كشف حساب وكيل | `GET Ledger/agent-ledger` |
| كشف حساب عاملة | `GET Ledger/worker-ledger` |

### 3.4 الإقفال

| الشاشة | الـ API |
|--------|---------|
| حالة الفترة | `GET PeriodClosing/status?year=&month=` |
| إقفال شهر | `POST PeriodClosing/close` |

### 3.5 التكامل (شاشات موجودة — تحتاج ربط محاسبي)

| الوحدة | ما يظهر للمستخدم |
|--------|-----------------|
| عقد تشغيل | رسالة "تم إنشاء قيد مسودة" + رابط للقيد |
| عقد وساطة | نفس الشيء عند التوقيع/الدفع/الإلغاء |
| الرواتب | `journalEntryId` بعد الموافقة + trace |
| السلف والمستحقات | `journalEntryId` بعد الموافقة |

---

## 4. دليل الحسابات (Chart of Accounts)

الحسابات مُهيَّأة مسبقاً (Seeded). استخدم `GET api/V1/Account/full-tree-structure` لعرض الشجرة.

### الحسابات الرئيسية

| الكود | الاسم | النوع | GUID |
|-------|-------|-------|------|
| 101 | Cash (نقدية) | Asset | `11111111-0000-0000-0000-000000000001` |
| 102 | Bank (بنك) | Asset | `11111111-0000-0000-0000-000000000002` |
| 103 | Accounts Receivable (عملاء مدينون) | Asset | `11111111-0000-0000-0000-000000000003` |
| 105 | VAT Receivable | Asset | `11111111-0000-0000-0000-000000000007` |
| 106 | Employee Advances (سلف موظفين) | Asset | `11111111-0000-0000-0000-000000000008` |
| 201 | Accounts Payable | Liability | `22222222-0000-0000-0000-000000000001` |
| 202 | VAT Payable | Liability | `22222222-0000-0000-0000-000000000002` |
| 203 | Agent Payable (وكلاء دائنون) | Liability | `22222222-0000-0000-0000-000000000003` |
| 204 | Customer Payable | Liability | `22222222-0000-0000-0000-000000000004` |
| 205 | Salary Payable | Liability | `22222222-0000-0000-0000-000000000005` |
| 301 | Share Capital | Equity | `33333333-0000-0000-0000-000000000001` |
| 302 | Retained Earnings (أرباح محتجزة) | Equity | `33333333-0000-0000-0000-000000000002` |
| 390 | Income Summary (ملخص الدخل — مؤقت) | Equity | `33333333-0000-0000-0000-000000000090` |
| 401 | Service Revenue | Revenue | `44444444-0000-0000-0000-000000000001` |
| 402 | Mediation Revenue (إيراد وساطة) | Revenue | `44444444-0000-0000-0000-000000000002` |
| 403 | Penalty Income | Revenue | `44444444-0000-0000-0000-000000000003` |
| 404 | Operating Revenue (إيراد تشغيل) | Revenue | `44444444-0000-0000-0000-000000000004` |
| 501 | Salaries | OperatingExpense | `55555555-0000-0000-0000-000000000001` |
| 502 | Agent Commission Expense | OperatingExpense | `55555555-0000-0000-0000-000000000002` |
| 503 | Payment Processing Fees | OperatingExpense | `55555555-0000-0000-0000-000000000003` |
| 504 | Customer Refunds | OperatingExpense | `55555555-0000-0000-0000-000000000004` |
| 505 | Travel & Deportation | OperatingExpense | `55555555-0000-0000-0000-000000000005` |
| 506 | Housing Operations | OperatingExpense | `55555555-0000-0000-0000-000000000006` |

### قواعد الأرصدة حسب نوع الحساب

| النوع | الرصيد الطبيعي | معادلة الإغلاق |
|-------|---------------|----------------|
| Asset / OperatingExpense / AdminExpense | مدين | Opening + Debit − Credit |
| Liability / Equity / Revenue | دائن | Opening + Credit − Debit |

---

## 5. الـ Enums

### AccountType

| القيمة | الاسم | الوصف |
|--------|-------|-------|
| 1 | Asset | أصول |
| 2 | Liability | خصوم |
| 3 | Equity | حقوق ملكية |
| 4 | Revenue | إيرادات |
| 5 | OperatingExpense | مصروفات تشغيل |
| 6 | AdminExpense | مصروفات إدارية |

### JournalEntryStatus

| القيمة | الاسم | وصف للـ UI |
|--------|-------|-----------|
| 0 | Draft | مسودة — قابل للتعديل والحذف |
| 1 | Posted | مُرحَّل — يظهر في التقارير |
| 2 | PendingApproval | بانتظار موافقة (رواتب) |
| 3 | Cancelled | ملغي |

### JournalEntrySource

| القيمة | الاسم |
|--------|-------|
| 0 | Manual |
| 1 | CustomerPayment |
| 2 | AgentPayment |
| 3 | Salary |
| 4 | Advance |
| 5 | Visa |
| 6 | Ticket |
| 7 | Arrival |
| 8 | Escape |
| 9 | Transfer |
| 10 | Contract |
| 11 | Payment |
| 12 | Adjustment |
| 13 | System |

### JournalReferenceType

| القيمة | الاسم |
|--------|-------|
| 0 | Manual |
| 1 | Contract |
| 2 | Payment |
| 3 | Adjustment |
| 4 | System |

### AccountingDocumentType

| القيمة | الاسم |
|--------|-------|
| 0 | JournalEntry |
| 1 | ReceiptVoucher |
| 2 | PaymentVoucher |
| 3 | CreditNote |
| 4 | DebitNote |
| 5 | Invoice |
| 6 | PayrollRun |
| 7 | PayrollPayment |

### PaymentMethodType

| القيمة | الاسم | الحساب المحاسبي |
|--------|-------|----------------|
| 1 | Cash | 101 |
| 2 | Bank | 102 |
| 3 | Card | 102 |

### AccountReportSide (إعدادات التقارير)

| القيمة | الاسم |
|--------|-------|
| 1 | Debit |
| 2 | Credit |
| 3 | Hidden |

### PayrollRunStatus

| القيمة | الاسم | Badge مقترح |
|--------|-------|------------|
| 0 | Draft | رمادي |
| 1 | PendingApproval | أصفر |
| 2 | Approved | أزرق |
| 3 | PartiallyPaid | برتقالي |
| 4 | Paid | أخضر |
| 5 | Closed | داكن |

---

## 6. شجرة الحسابات وإعداداتها

**Base:** `api/V1/Account`

### Endpoints

| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/full-tree-structure` | الشجرة الكاملة (للعرض) |
| GET | `/subtree/{parentId}` | فرع من حساب أب |
| GET | `/Accounts-list` | قائمة الحسابات غير النهائية (للـ parent dropdown) |
| GET | `/settings?searchTerm=&pageNumber=1&pageSize=10` | إعدادات التقارير (paginated) |
| POST | `/create-account` | إنشاء حساب |
| PUT | `/update-account/{accountId}` | تعديل الاسم فقط |
| PUT | `/reporting/{accountId}` | تعديل إعدادات التقرير |
| DELETE | `/delete-account/{accountId}` | حذف (leaf فقط، بدون حركات) |

### CreateAccount — Request

```json
{
  "code": "1043",
  "name": "أجهزة حاسب",
  "parentId": "11111111-0000-0000-0000-000000000004"
}
```

**قواعد:**
- `code` يجب أن يبدأ بكود الحساب الأب
- أول رقم في الكود يحدد النوع: `1`=Asset, `2`=Liability, `3`=Equity, `4`=Revenue, `5`=OperatingExpense, `6`=AdminExpense

### UpdateAccountReportSide — Request

```json
{
  "incomeStatementSide": 1,
  "profitLossSide": 2,
  "isGroupedInTrialBalance": true
}
```

### AccountTreeDto — Response

```json
{
  "id": "guid",
  "code": "1",
  "name": "Assets",
  "isLeaf": false,
  "level": 1,
  "children": []
}
```

---

## 7. قيود اليومية (Journal Entries)

**Base:** `api/V1/JournalEntries`

### Endpoints

| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/` | قائمة مع فلاتر وترقيم |
| GET | `/{id}` | تفاصيل قيد |
| POST | `/` | إنشاء قيد يدوي |
| PUT | `/{id}` | تعديل (Draft فقط) |
| DELETE | `/{id}` | حذف (Draft فقط) |

> **ملاحظة:** الترحيل ليس هنا — استخدم `api/V1/Posting/{id}`

### Query Filters — `JournalEntryQueryDto`

| Parameter | Type | الوصف |
|-----------|------|-------|
| pageNumber | int | افتراضي 1 |
| pageSize | int | افتراضي 20 |
| from | DateTime? | من تاريخ |
| to | DateTime? | إلى تاريخ |
| status | int? | JournalEntryStatus |
| source | int? | JournalEntrySource |
| referenceType | int? | JournalReferenceType |
| sourceId | Guid? | معرّف المصدر (عقد مثلاً) |
| customerId | Guid? | |
| agentId | Guid? | |
| entryNumber | string? | بحث جزئي |
| search | string? | بحث في الرقم والوصف |

### Create — Request

```json
{
  "date": "2026-06-25T00:00:00Z",
  "description": "قيد تسوية",
  "customerId": null,
  "agentId": null,
  "workerId": null,
  "employeeId": null,
  "restrictionTypeId": "00000000-0000-0000-0000-000000000001",
  "lines": [
    { "accountId": "11111111-0000-0000-0000-000000000001", "debit": 1000, "credit": 0, "description": "" },
    { "accountId": "44444444-0000-0000-0000-000000000004", "debit": 0, "credit": 1000, "description": "" }
  ]
}
```

**قواعد التحقق:**
- سطران على الأقل
- مجموع المدين = مجموع الدائن
- الحسابات يجب أن تكون `isLeaf = true`
- `restrictionTypeId` اختياري — الافتراضي: قيد يدوي

### Response عند الإنشاء

```json
{
  "success": true,
  "data": "JE-2026-0001",
  "statusCode": 200
}
```

يعيد `entryNumber` وليس الـ `id` — استخدم القائمة أو ابحث بالرقم للحصول على الـ id.

### JournalEntryDetailsDto — Response (GET by id)

```json
{
  "id": "guid",
  "entryNumber": "JE-2026-0001",
  "date": "2026-06-25T00:00:00Z",
  "description": "...",
  "status": 0,
  "source": 0,
  "referenceType": 0,
  "sourceId": null,
  "restrictionTypeId": "guid",
  "customerId": null,
  "agentId": null,
  "workerId": null,
  "employeeId": null,
  "branchId": null,
  "totalDebit": 1000,
  "totalCredit": 1000,
  "isBalanced": true,
  "createdBy": "user-id",
  "createdDate": "2026-06-25T10:00:00Z",
  "updatedDate": null,
  "lines": [
    {
      "id": "guid",
      "accountId": "guid",
      "accountCode": "101",
      "accountName": "Cash",
      "debit": 1000,
      "credit": 0,
      "description": "",
      "restrictionTypeId": "guid"
    }
  ]
}
```

---

## 8. الترحيل وإلغاء الترحيل (Posting)

**Base:** `api/V1/Posting` — **يتطلب Authorization**

| Method | Route | الوصف |
|--------|-------|-------|
| POST | `/{journalId}` | ترحيل قيد |
| POST | `/{journalId}/unpost` | إلغاء ترحيل |

### Response نجاح

```json
{
  "success": true,
  "data": "Journal posted successfully",
  "statusCode": 200
}
```

### شروط الترحيل

- الحالة = `Draft`
- القيد متوازن (مدين = دائن)
- الحسابات leaf فقط
- الفترة المحاسبية **غير مغلقة**
- لا يمكن ترحيل `PendingApproval` أو `Cancelled`

### بعد الترحيل

- `status` → `Posted`
- تُنشأ حركات في `AccountLedger`
- تتحدث `balance` على الحسابات
- تظهر في التقارير وفي `trace` للمستندات

---

## 9. مستندات المحاسبة

**Base:** `api/Accounting/{Controller}`

Controllers: `ReceiptVoucher`, `PaymentVoucher`, `CreditNote`, `DebitNote`

### Endpoints مشتركة

| Method | Route | الوصف |
|--------|-------|-------|
| GET | `/` | قائمة مع فلاتر |
| GET | `/{id}` | تفاصيل |
| GET | `/{id}/trace` | سلسلة التتبع الكاملة |
| POST | `/` | إنشاء + قيد مسودة تلقائي |

### فلاتر القائمة — `AccountingDocumentFilterDto`

| Parameter | Type |
|-----------|------|
| customerId | Guid? |
| agentId | Guid? |
| contractId | Guid? |
| dateFrom | DateTime? |
| dateTo | DateTime? |

---

### 9.1 سند قبض — ReceiptVoucher

**نمط القيد:** DR نقدية/بنك → CR عملاء مدينون (103)

```json
// POST
{
  "voucherNumber": "RV-001",
  "voucherDate": "2026-06-25T00:00:00Z",
  "amount": 1150.00,
  "notes": "دفعة عميل",
  "employmentOperatingContractId": "guid-مطلوب",
  "paymentMethod": 1,
  "vatAmount": null,
  "bankFees": null
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "guid",
    "voucherSerialNumber": 1,
    "voucherNumber": "RV-001",
    "voucherDate": "...",
    "amount": 1150,
    "employmentOperatingContractId": "guid",
    "customerId": "guid",
    "paymentMethod": 1,
    "journalEntryId": "guid",
    "accountingDocumentId": "guid"
  },
  "statusCode": 201
}
```

---

### 9.2 سند صرف — PaymentVoucher

**نمط القيد:** DR وكلاء دائنون (203) أو موردون (201) → CR نقدية/بنك

```json
{
  "voucherNumber": "PV-001",
  "voucherDate": "2026-06-25T00:00:00Z",
  "amount": 500.00,
  "notes": "صرف وكيل",
  "paymentMethod": 2,
  "payeeId": "agent-guid",
  "payeeType": "Agent",
  "customerId": null,
  "sourceContractId": "optional-contract-guid",
  "sourceContractType": "MediationContract"
}
```

**payeeType:** استخدم `"Agent"` مع `payeeId` لصرف وكيل.

**sourceContractType أمثلة:** `MediationContract`, `EmploymentOperatingContract`

---

### 9.3 إشعار دائن — CreditNote

**نمط القيد:** DR مردودات عملاء (504) + DR ضريبة → CR عملاء مدينون

```json
{
  "creditNoteNumber": "CN-001",
  "creditNoteDate": "2026-06-25T00:00:00Z",
  "amount": 800.00,
  "vatAmount": null,
  "reason": "تسوية خدمة",
  "notes": "",
  "customerId": "guid-مطلوب",
  "sourceContractId": null,
  "sourceContractType": "EmploymentOperatingContract"
}
```

---

### 9.4 إشعار مدين — DebitNote

**نمط القيد:** DR وكلاء دائنون → CR إيراد غرامات (403)

```json
{
  "debitNoteNumber": "DN-001",
  "debitNoteDate": "2026-06-25T00:00:00Z",
  "amount": 400.00,
  "vatAmount": null,
  "reason": "غرامة وكيل",
  "agentId": "guid-مطلوب",
  "sourceContractId": null,
  "sourceContractType": "MediationContract"
}
```

---

### ⚠️ تغييرات Routes (Breaking Changes)

| القديم | الجديد |
|--------|--------|
| `POST api/ReceiptVoucher` | `POST api/Accounting/ReceiptVoucher` |
| `GET api/ReceiptVoucher` | `GET api/Accounting/ReceiptVoucher` |
| `POST api/V1/PaymentVoucher` | `POST api/Accounting/PaymentVoucher` |
| `POST api/V1/CreditNote` | `POST api/Accounting/CreditNote` |
| `POST api/V1/DebitNote` | `POST api/Accounting/DebitNote` |

---

## 10. التقارير المالية

**Base:** `api/V1/Ledger`

> كل التقارير تعتمد على قيود **مُرحَّلة** فقط.

---

### 10.1 دفتر الأستاذ العام — General Ledger

```
GET /general-ledger?accountId={guid}&from={date}&to={date}
```

**Response:**

```json
{
  "accountId": "guid",
  "accountCode": "101",
  "accountName": "Cash",
  "accountType": 1,
  "openingBalance": 5000,
  "totalDebit": 2000,
  "totalCredit": 1000,
  "closingBalance": 6000,
  "isValid": true,
  "lines": [
    {
      "date": "2026-06-01",
      "entryNumber": "JE-2026-0001",
      "description": "...",
      "debit": 1000,
      "credit": 0,
      "balanceAfter": 6000
    }
  ]
}
```

---

### 10.2 ميزان المراجعة — Trial Balance

```
GET /trial-balance?from={date}&to={date}&groupedOnly=true&excludeZeroBalances=false
```

| Parameter | Default | الوصف |
|-----------|---------|-------|
| groupedOnly | true | حسابات مجمّعة في الميزان |
| excludeZeroBalances | false | إخفاء الأرصدة الصفرية |

**Response:**

```json
{
  "totalDebit": 50000,
  "totalCredit": 50000,
  "totalOpeningDebit": 40000,
  "totalOpeningCredit": 40000,
  "totalClosingDebit": 50000,
  "totalClosingCredit": 50000,
  "isBalanced": true,
  "difference": 0,
  "lines": [
    {
      "accountId": "guid",
      "accountCode": "101",
      "accountName": "Cash",
      "accountType": 1,
      "openingBalance": 5000,
      "openingDebit": 5000,
      "openingCredit": 0,
      "debit": 2000,
      "credit": 1000,
      "closingBalance": 6000,
      "closingDebit": 6000,
      "closingCredit": 0,
      "isValid": true
    }
  ]
}
```

**UI:** اعرض تحذير إذا `isBalanced = false` مع قيمة `difference`.

---

### 10.3 قائمة الدخل — Income Statement

```
GET /income-statement?from={date}&to={date}&pageNumber=1&pageSize=10
```

**Response:**

```json
{
  "from": "2026-01-01",
  "to": "2026-06-30",
  "totalRevenue": 100000,
  "totalOperatingExpenses": 30000,
  "totalAdminExpenses": 10000,
  "grossProfit": 70000,
  "netIncome": 60000,
  "isValid": true,
  "revenue": {
    "sectionName": "Revenue",
    "accountType": 4,
    "total": 100000,
    "lines": []
  },
  "operatingExpenses": {
    "sectionName": "Operating Expenses",
    "accountType": 5,
    "total": 30000,
    "lines": []
  },
  "adminExpenses": {
    "sectionName": "Admin Expenses",
    "accountType": 6,
    "total": 10000,
    "lines": []
  }
}
```

---

### 10.4 الميزانية العمومية — Balance Sheet

```
GET /balance-sheet?asOfDate={date}&includeCurrentYearEarnings=true
```

**Response:**

```json
{
  "totalAssets": 200000,
  "totalLiabilities": 80000,
  "totalEquity": 120000,
  "currentYearEarnings": 15000,
  "isBalanced": true,
  "difference": 0,
  "assets": { "sectionName": "Assets", "total": 200000, "lines": [] },
  "liabilities": { "sectionName": "Liabilities", "total": 80000, "lines": [] },
  "equity": { "sectionName": "Equity", "total": 120000, "lines": [] }
}
```

**قاعدة:** `Assets = Liabilities + Equity` — تحقق من `isBalanced`.

---

### 10.5 تقرير ضريبة القيمة المضافة — VAT Report

```
GET /vat-report?year=2026&quarter=2
```

أو بنطاق مخصص:

```
GET /vat-report?year=2026&quarter=2&from=2026-04-01&to=2026-06-30
```

**Response:**

```json
{
  "year": 2026,
  "quarter": 2,
  "periodStart": "2026-04-01",
  "periodEnd": "2026-06-30",
  "outputVat": 15000,
  "inputVat": 3000,
  "netVatPayable": 12000,
  "isValid": true,
  "lines": [
    {
      "accountCode": "202",
      "accountName": "VAT Payable",
      "debit": 0,
      "credit": 15000,
      "netMovement": 15000
    }
  ]
}
```

---

## 11. إقفال الفترة المحاسبية

**Base:** `api/V1/PeriodClosing` — **يتطلب Authorization**

### إقفال شهر

```
POST /close
```

```json
{
  "year": 2026,
  "month": 6
}
```

**Response:**

```json
{
  "year": 2026,
  "month": 6,
  "closingJournalEntryId": "guid-or-null",
  "netIncomeTransferred": 60000,
  "isClosed": true
}
```

### ماذا يحدث عند الإقفال؟

1. إغلاق حسابات الإيرادات → DR إيراد / CR ملخص الدخل (390)
2. إغلاق المصروفات → DR ملخص الدخل / CR مصروف
3. تحويل صافي الربح/الخسارة → ملخص الدخل ↔ أرباح محتجزة (302)
4. القيد يُنشأ ويُرحَّل تلقائياً
5. تُسجَّل الفترة كمغلقة — **لا يمكن الترحيل لفترة مغلقة**

### التحقق من حالة الفترة

```
GET /status?year=2026&month=6
```

```json
{
  "success": true,
  "data": true,
  "statusCode": 200
}
```

`true` = مغلقة، `false` = مفتوحة

### UI مقترح

- تقويم شهري يُظهر الأشهر المغلقة
- تأكيد قبل الإقفال مع تحذير أن العملية لا تُلغى بسهولة
- عرض `netIncomeTransferred` وربط بـ `closingJournalEntryId`

---

## 12. أنواع القيود (Restriction Types)

**Base:** `api/V1/RestrictionType`

| Method | Route |
|--------|-------|
| GET | `/` |
| GET | `/{id}` |
| POST | `/` |
| PUT | `/{id}` |
| DELETE | `/{id}` |

### RestrictionTypeDto

```json
{
  "id": "guid",
  "name": "Manual Entry",
  "nameAr": "قيد يدوي",
  "accountingEvent": null,
  "isManual": true,
  "isActive": true,
  "defaultDebitAccountId": null,
  "defaultCreditAccountId": null
}
```

### Create — Request

```json
{
  "name": "Custom Type",
  "nameAr": "نوع مخصص",
  "accountingEvent": null,
  "isManual": true,
  "isActive": true,
  "defaultDebitAccountId": null,
  "defaultCreditAccountId": null
}
```

**للقيد اليدوي:** استخدم `00000000-0000-0000-0000-000000000001` (قيد يدوي).

---

## 13. كشوف الأطراف (Agent / Customer / Worker)

**Base:** `api/V1/Ledger`

| Endpoint | Parameter مطلوب | فلاتر اختيارية |
|----------|----------------|----------------|
| `GET /agent-ledger` | agentId | from, to |
| `GET /customer-ledger` | customerId | from, to |
| `GET /worker-ledger` | workerId | from, to |

### Response Structure

```json
{
  "agentId": "guid",
  "totalDebit": 5000,
  "totalCredit": 3000,
  "balance": 2000,
  "lines": [
    {
      "date": "2026-06-01",
      "entryNumber": "JE-2026-0001",
      "description": "...",
      "accountCode": "203",
      "accountName": "Agent Payable",
      "debit": 1000,
      "credit": 0,
      "source": "Contract",
      "sourceId": "contract-guid"
    }
  ]
}
```

**UI:** اربط `sourceId` بصفحة العقد المناسب حسب `source`.

---

## 14. التكامل التلقائي من وحدات أخرى

هذه العمليات **لا تحتاج شاشة محاسبة منفصلة** — لكن الفرونت يجب أن يعرض حالة القيد ويربط بالتتبع.

### 14.1 عقود التشغيل (Employment Operating Contract)

| الحدث | Endpoint | القيد التلقائي |
|-------|----------|---------------|
| إنشاء عقد | `POST api/EmploymentOperatingContract` | DR عملاء / CR إيراد تشغيل + ضريبة |
| تجديد | `POST .../{id}/renew` | نفس نمط الإنشاء |
| سند قبض | `POST api/Accounting/ReceiptVoucher` | DR نقدية / CR عملاء |
| إنهاء | `POST .../{id}/terminate` | إشعار دائن (عكس إيراد) |
| رد مبلغ للعميل | `POST .../{id}/customer-refund` | DR عملاء دائنون / CR نقدية |

**تغيير مهم — إنهاء العقد:**

```json
// POST .../terminate  (كان string — أصبح object)
{
  "note": "إنهاء مبكر",
  "refundAmount": 500.00
}
```

**رد المبلغ للعميل (بعد الإنهاء):**

```json
// POST .../customer-refund
{
  "amount": 500.00,
  "paymentMethod": 1,
  "description": "رد بعد إنهاء العقد"
}
```

> **توقيع العقد (`sign`) لا يُنشئ قيداً** — الإيراد عند الإنشاء وليس التوقيع.

---

### 14.2 عقود الوساطة (Mediation Contract)

القيود تُنشأ تلقائياً من الـ backend عند:

| الحدث | نمط القيد |
|-------|----------|
| توقيع العقد | DR عملاء / CR إيراد وساطة + ضريبة |
| دفع عميل | DR نقدية / CR عملاء |
| عمولة تأشيرة | DR مصروف عمولة / CR وكلاء دائنون |
| عمولة وصول | DR مصروف عمولة / CR وكلاء دائنون |
| غرامة هروب | DR وكلاء / CR إيراد غرامات |
| غرامة ترحيل | DR وكلاء / CR إيراد غرامات |
| نقل كفالة | DR عملاء / CR إيراد |
| إلغاء + استرداد | عكس إيراد + رد نقدي |
| استرداد | DR مردودات + ضريبة / CR نقدية |

**للفرونت:** بعد كل عملية على عقد الوساطة، ابحث عن القيود بـ:
```
GET api/V1/JournalEntries?sourceId={contractId}
```

---

### 14.3 عقود النقل والإسكان

تُنشأ قيود تلقائياً من خدمات `TransferContract` و `Housing` — نفس مبدأ العرض: اعرض `journalEntryId` إن وُجد في الـ response.

---

## 15. الرواتب والسلف (HR)

**Base:** `api/V1/Payroll`

| Method | Route | الوصف |
|--------|-------|-------|
| POST | `/generate` | توليد مسيرة رواتب |
| GET | `/?month=&year=` | مسيرة شهر معيّن |
| GET | `/{id}` | تفاصيل |
| GET | `/history?year=` | السجل |
| PUT | `/{id}/submit` | إرسال للموافقة |
| PUT | `/{id}/approve` | موافقة + قيد استحقاق |
| PUT | `/{id}/reject` | رفض |
| POST | `/{id}/payments` | تسجيل دفعة |
| PUT | `/close/{id}` | إغلاق |
| GET | `/{id}/trace` | تتبع قيد الاستحقاق |
| GET | `/{runId}/payments/{paymentId}/trace` | تتبع دفعة |
| GET | `/export?month=&year=` | Excel |

### Generate

```json
{ "month": 6, "year": 2026, "includeWorkers": true }
```

### Record Payment

```json
{
  "paymentDate": "2026-06-25T00:00:00Z",
  "amount": 5000,
  "paymentMethod": 2,
  "notes": "راتب يونيو",
  "employeeId": "optional-guid",
  "workerId": null
}
```

اترك `employeeId` و `workerId` فارغين للدفع الإجمالي.

### PayrollRunDto — حقول محاسبية مهمة

```json
{
  "journalEntryId": "guid",
  "accountingDocumentId": "guid",
  "status": 2,
  "totalNetAmount": 50000,
  "totalPaidAmount": 20000,
  "remainingAmount": 30000
}
```

### سلف ومستحقات (طلبات HR)

| الطلب | Endpoint الموافقة | القيد |
|-------|------------------|-------|
| سلفة | `PUT api/V1/LoanRequest/Approve/{id}` | DR سلف / CR بنك |
| مستحقات | `PUT api/V1/EntitlementsRequest/Approve/{id}` | DR رواتب / CR رواتب مستحقة |

---

## 16. سلسلة التتبع (Traceability)

### AccountingDocumentTraceDto

```json
{
  "documentType": 1,
  "documentEntityId": "guid",
  "document": {
    "id": "guid",
    "documentType": 1,
    "documentNumber": "RV-001",
    "documentDate": "2026-06-25",
    "amount": 1150,
    "journalEntryId": "guid",
    "accountingDocumentId": "guid",
    "customerId": "guid",
    "agentId": null,
    "contractId": "guid",
    "contractType": null,
    "journalStatus": 0
  },
  "journalEntry": {
    "id": "guid",
    "entryNumber": "JE-2026-0001",
    "date": "...",
    "description": "...",
    "status": 0,
    "sourceId": "guid",
    "customerId": "guid",
    "agentId": null,
    "lines": [
      { "accountId": "guid", "accountCode": "101", "accountName": "Cash", "debit": 1150, "credit": 0 }
    ]
  },
  "ledgerEntries": []
}
```

| الحالة | ledgerEntries |
|--------|--------------|
| Draft | `[]` فارغ |
| Posted | حركات دفتر الأستاذ |

### Endpoints التتبع

| المستند | Route |
|---------|-------|
| سند قبض | `GET api/Accounting/ReceiptVoucher/{id}/trace` |
| سند صرف | `GET api/Accounting/PaymentVoucher/{id}/trace` |
| إشعار دائن | `GET api/Accounting/CreditNote/{id}/trace` |
| إشعار مدين | `GET api/Accounting/DebitNote/{id}/trace` |
| مسيرة رواتب | `GET api/V1/Payroll/{id}/trace` |
| دفعة راتب | `GET api/V1/Payroll/{runId}/payments/{paymentId}/trace` |

> **ملاحظة:** trace الرواتب يرجع الـ object مباشرة بدون `ApiResponse` wrapper.

---

## 17. قواعد العمل المهمة

1. **كل القيود التلقائية = Draft** حتى يرحّلها المحاسب
2. **لا تعديل/حذف** لقيد مُرحَّل — فقط `unpost` ثم تعديل (إن الفترة مفتوحة)
3. **لا ترحيل** لفترة مغلقة
4. **القيد على حسابات leaf فقط** — لا تختار حسابات أب في الواجهة
5. **ضريبة VAT** = 15% (`AccountingConstants.VatRate`)
6. **التحمل في المقارنة** = 0.01 ريال (`BalanceTolerance`)
7. **بعد إقفال الفترة:** أرصدة الإيرادات والمصروفات = 0، الأرباح في 302

---

## 18. أخطاء شائعة من الـ API

| الرسالة | السبب | الحل في UI |
|---------|-------|-----------|
| `Unbalanced journal entry` | مدين ≠ دائن | تحقق فوري أثناء الإدخال |
| `Cannot post to a closed accounting period` | شهر مغلق | امنع الترحيل + اعرض تحذير |
| `Journal already posted` | ترحيل مكرر | أخفِ زر الترحيل |
| `Cannot post to non-leaf account` | حساب أب | فلتر الحسابات leaf فقط |
| `Period is already closed` | إقفال مكرر | تحقق من status أولاً |
| `لا يمكن حذف قيد تم ترحيله` | حذف قيد مرحّل | أخفِ زر الحذف للـ Posted |
| `Journal entry requires approval before posting` | قيد رواتب | اعرض حالة PendingApproval |

---

## 19. TypeScript Interfaces مقترحة

```typescript
// api-response.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: string[] | null;
  statusCode: number;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// enums.ts
export enum JournalEntryStatus {
  Draft = 0,
  Posted = 1,
  PendingApproval = 2,
  Cancelled = 3,
}

export enum PaymentMethodType {
  Cash = 1,
  Bank = 2,
  Card = 3,
}

export enum AccountType {
  Asset = 1,
  Liability = 2,
  Equity = 3,
  Revenue = 4,
  OperatingExpense = 5,
  AdminExpense = 6,
}

// journal-entry.ts
export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
  restrictionTypeId?: string;
}

export interface JournalEntryDetails {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  source: number;
  referenceType: number;
  sourceId?: string;
  customerId?: string;
  agentId?: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lines: JournalEntryLine[];
}

// trial-balance.ts
export interface TrialBalanceLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingDebit: number;
  openingCredit: number;
  debit: number;
  credit: number;
  closingDebit: number;
  closingCredit: number;
  closingBalance: number;
  isValid: boolean;
}

export interface TrialBalanceReport {
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
  difference: number;
  lines: TrialBalanceLine[];
}
```

---

## 20. Checklist تنفيذ الفرونت

### أولوية عالية (Core)

- [ ] شاشة قائمة قيود اليومية مع فلاتر (status, date, customer, agent)
- [ ] شاشة إنشاء/تعديل قيد يدوي مع تحقق توازن فوري
- [ ] أزرار ترحيل / إلغاء ترحيل مع تأكيد
- [ ] شجرة الحسابات (عرض + إنشاء)
- [ ] سندات القبض/الصرف والإشعارات (CRUD + قائمة)
- [ ] شاشة Trace موحّدة للمستندات
- [ ] ميزان المراجعة + قائمة الدخل + الميزانية
- [ ] دفتر الأستاذ لحساب واحد

### أولوية متوسطة

- [ ] كشوف العميل / الوكيل / العاملة
- [ ] تقرير VAT مع اختيار ربع/نطاق
- [ ] إقفال الفترة + عرض حالة الأشهر
- [ ] إعدادات الحسابات (IncomeStatementSide, TrialBalance grouping)
- [ ] أنواع القيود (Restriction Types)
- [ ] ربط عقود التشغيل: terminate + customer-refund الجديد
- [ ] ربط الرواتب: journalEntryId + trace بعد الموافقة

### أولوية منخفضة / تحسينات

- [ ] Badge حالة القيد في كل الشاشات المرتبطة
- [ ] فلتر `excludeZeroBalances` في ميزان المراجعة
- [ ] تصدير التقارير PDF/Excel (حالياً Excel للرواتب فقط)
- [ ] منع إدخال قيود بتاريخ في فترة مغلقة (client-side)
- [ ] Dashboard محاسبي: إجمالي أرصدة، قيود معلقة، فترات غير مغلقة

### Routes يجب تحديثها إن كانت قديمة

- [ ] `api/ReceiptVoucher` → `api/Accounting/ReceiptVoucher`
- [ ] `api/V1/PaymentVoucher` → `api/Accounting/PaymentVoucher`
- [ ] `api/JournalEntries/{id}/post` → `api/V1/Posting/{id}`

---

## 21. مراجع إضافية

| الملف | المحتوى |
|-------|---------|
| [ACCOUNTING_DOCUMENTS.md](./ACCOUNTING_DOCUMENTS.md) | تفاصيل المستندات والتتبع |
| [OPERATING_CONTRACT_ACCOUNTING.md](./OPERATING_CONTRACT_ACCOUNTING.md) | دورة عقد التشغيل |
| [PAYROLL_ACCOUNTING.md](./PAYROLL_ACCOUNTING.md) | الرواتب والسلف |
| [FINANCIAL_STATEMENTS.md](./FINANCIAL_STATEMENTS.md) | التقارير والإقفال (تقني) |

---

## ملحق: هيكل الموديولات في الفرونت المقترح

```
/accounting
  /chart-of-accounts      → شجرة الحسابات
  /journal-entries        → قيود اليومية
  /journal-entries/:id    → تفاصيل + ترحيل
  /receipt-vouchers
  /payment-vouchers
  /credit-notes
  /debit-notes
  /documents/:type/:id/trace
  /reports
    /general-ledger
    /trial-balance
    /income-statement
    /balance-sheet
    /vat
  /party-ledgers
    /customers/:id
    /agents/:id
    /workers/:id
  /period-closing
  /restriction-types
```

---

*لأي استفسار عن endpoint غير موثّق هنا، راجع الـ Controller المقابل في `Sigma.API/Controllers/Accounting/` أو تواصل مع فريق الـ Backend.*
