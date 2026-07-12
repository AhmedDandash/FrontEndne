# دليل تنقل مصدر قيد اليومية — للفرونت إند

> **الجمهور:** فريق الفرونت إند  
> **الهدف:** من بيانات القيد الموجودة في الـ API، اعرف تروح لأي شاشة وبأي `id`  
> **لا يوجد endpoint جديد** — استخدم الحقول الموجودة في استجابة `GET api/V1/JournalEntries` و `GET api/V1/JournalEntries/{id}`

---

## 1. الحقول المستخدمة للتنقل

كل قيد يومية يرجع الحقول دي:

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `source` | `number` | نوع العملية اللي ولّدت القيد (`JournalEntrySource`) |
| `referenceType` | `number` | تصنيف المرجع (`JournalReferenceType`) |
| `sourceId` | `string \| null` | **الـ id الأساسي** للتنقل لمصدر القيد |
| `customerId` | `string \| null` | عميل مرتبط (مساعد للتنقل أو عرض) |
| `agentId` | `string \| null` | وكيل مرتبط |
| `workerId` | `string \| null` | عاملة مرتبطة |
| `employeeId` | `string \| null` | موظف مرتبط |

### مثال استجابة

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "entryNumber": "JE-2026-0042",
    "date": "2026-06-14T00:00:00Z",
    "description": "Mediation contract cost recognition",
    "status": 0,
    "source": 10,
    "referenceType": 1,
    "sourceId": "f47ac10b-...",
    "customerId": "6ba7b810-...",
    "agentId": null,
    "workerId": null,
    "employeeId": null,
    "totalDebit": 5000,
    "totalCredit": 5000,
    "lines": []
  }
}
```

---

## 2. الـ Enums

### `JournalReferenceType` — `referenceType`

| القيمة | الاسم | المعنى |
|--------|-------|--------|
| `0` | Manual | قيد يدوي — مفيش مصدر خارجي |
| `1` | Contract | مرتبط بعقد |
| `2` | Payment | مرتبط بدفع / سند |
| `3` | Adjustment | تسوية / إشعار / غرامة |
| `4` | System | عملية نظام (رواتب، إيواء، ترحيل، …) |

### `JournalEntrySource` — `source`

| القيمة | الاسم | المعنى |
|--------|-------|--------|
| `0` | Manual | قيد يدوي |
| `1` | CustomerPayment | دفعة عميل |
| `2` | AgentPayment | عمولة / دفع وكيل |
| `3` | Salary | راتب / مستحقات |
| `4` | Advance | سلفة |
| `5` | Visa | إصدار تأشيرة |
| `6` | Ticket | تذكرة ترحيل |
| `7` | Arrival | وصول عاملة |
| `8` | Escape | هروب / غرامة هروب |
| `9` | Transfer | نقل كفالة |
| `10` | Contract | عقد (إيراد / تكلفة) |
| `11` | Payment | دفع (سند قبض / صرف) |
| `12` | Adjustment | تسوية / إلغاء / استرداد |
| `13` | System | عملية نظام عامة |

---

## 3. قاعدة التنقل الأساسية

```
لو referenceType = 0 (Manual)  →  مفيش تنقل (أو اعرض تفاصيل القيد فقط)

غير كده:
  1. حدّد الشاشة من الجدول في القسم 4 (باستخدام source + referenceType)
  2. استخدم sourceId كـ id في الرابط
  3. لو sourceId = null استخدم الحقل المساعد (customerId / agentId / employeeId / workerId)
```

---

## 4. جدول التنقل — `source` + `referenceType` → الشاشة

> **الأولوية:** استخدم `source` أولاً لأنه أوضح. `referenceType` يكمّل أو يحل التعارض.

### 4.1 قيود يدوية

| `source` | `referenceType` | التنقل | الـ id المستخدم |
|----------|---------------|--------|----------------|
| `0` | `0` | — | لا يوجد |

---

### 4.2 عقود

| `source` | `referenceType` | الشاشة | الـ id | API للتفاصيل |
|----------|---------------|--------|--------|--------------|
| `10` Contract | `1` Contract | عقد وساطة **أو** عقد تشغيل | `sourceId` | جرّب بالترتيب: `GET api/Mediation/MediationContract/{sourceId}` ثم `GET api/EmploymentOperatingContract/{sourceId}` |
| `5` Visa | `1` Contract | عقد وساطة | `sourceId` | `GET api/Mediation/MediationContract/{sourceId}` |
| `7` Arrival | `1` Contract | عقد وساطة | `sourceId` | `GET api/Mediation/MediationContract/{sourceId}` |
| `8` Escape | `1` Contract | عقد وساطة | `sourceId` | `GET api/Mediation/MediationContract/{sourceId}` |
| `2` AgentPayment | `1` Contract | عقد وساطة | `sourceId` | `GET api/Mediation/MediationContract/{sourceId}` |
| `9` Transfer | `1` Contract | عقد نقل كفالة | `sourceId` | `GET api/TransferContract/{sourceId}` |
| `11` Payment | `1` Contract | عقد تشغيل (سند قبض) | `sourceId` | `GET api/EmploymentOperatingContract/{sourceId}` |
| `12` Adjustment | `1` Contract | عقد (تسوية / إلغاء / استرداد) | `sourceId` | جرّب: وساطة → تشغيل → نقل كفالة |
| `10` Contract | `1` Contract + `customerId` | عقد تشغيل (إيراد تشغيل) | `sourceId` | `GET api/EmploymentOperatingContract/{sourceId}` |
| `10` Contract | `1` Contract + `agentId` | عقد وساطة | `sourceId` | `GET api/Mediation/MediationContract/{sourceId}` |

**ملاحظة مهمة عن العقود:**  
القيد مش بيحفظ نوع العقد صراحة. لما `referenceType = 1` و `source` مش محدد (مثلاً `10` Contract بدون `agentId`):
- جرّب `MediationContract` أولاً
- لو `404` جرّب `EmploymentOperatingContract`
- لو `404` جرّب `TransferContract`

---

### 4.3 سندات القبض والصرف

| `source` | `referenceType` | الشاشة | الـ id | API |
|----------|---------------|--------|--------|-----|
| `11` Payment | `2` Payment | سند قبض | `sourceId` | `GET api/Accounting/ReceiptVoucher/{sourceId}` |
| `11` Payment | `1` Contract | سند قبض مرتبط بعقد تشغيل | `sourceId` = **عقد** | `GET api/EmploymentOperatingContract/{sourceId}` |
| `11` Payment | `2` Payment (بدون عقد) | سند صرف | `sourceId` | `GET api/Accounting/PaymentVoucher/{sourceId}` |
| `1` CustomerPayment | `2` Payment | سند قبض | `sourceId` | `GET api/Accounting/ReceiptVoucher/{sourceId}` |

**تفرقة سند قبض vs صرف لما `source = 11` و `referenceType = 2`:**
- لو `customerId` موجود → سند **قبض**
- لو `agentId` موجود أو مفيش `customerId` → سند **صرف**

---

### 4.4 إشعارات دائن ومدين

| `source` | `referenceType` | الشاشة | الـ id | API |
|----------|---------------|--------|--------|-----|
| `12` Adjustment | `3` Adjustment | إشعار دائن | `sourceId` | `GET api/Accounting/CreditNote/{sourceId}` |
| `12` Adjustment | `1` Contract | إشعار دائن مرتبط بعقد | `sourceId` = **عقد** | `GET api/EmploymentOperatingContract/{sourceId}` أو وساطة |
| `12` Adjustment | `3` Adjustment + `agentId` | إشعار مدين | `sourceId` | `GET api/Accounting/DebitNote/{sourceId}` |
| `12` Adjustment | `1` Contract + `agentId` | إشعار مدين مرتبط بعقد | `sourceId` = **عقد** | جرّب عقود حسب النوع |

**تفرقة إشعار دائن vs مدين لما `source = 12`:**
- `agentId` موجود → **إشعار مدين** (`DebitNote`)
- `customerId` موجود و `agentId` = null → **إشعار دائن** (`CreditNote`)
- `referenceType = 1` → `sourceId` يشير للعقد مش للإشعار

---

### 4.5 الرواتب والموارد البشرية

| `source` | `referenceType` | الشاشة | الـ id | API |
|----------|---------------|--------|--------|-----|
| `3` Salary | `4` System | مسير رواتب | `sourceId` | `GET api/V1/Payroll/{sourceId}` |
| `3` Salary | `4` System + `employeeId` | طلب مستحقات | `sourceId` | `GET api/V1/EntitlementsRequest/{sourceId}` |
| `3` Salary | `2` Payment | دفعة راتب (ضمن مسير) | `sourceId` = **مسير الرواتب** | `GET api/V1/Payroll/{sourceId}` |
| `4` Advance | `4` System | سلفة من مسير رواتب | `sourceId` = **مسير الرواتب** | `GET api/V1/Payroll/{sourceId}` |
| `4` Advance | `4` System + `employeeId` | طلب سلفة | `sourceId` | `GET api/V1/LoanRequest/{sourceId}` |
| `2` AgentPayment | `4` System + `employeeId` | شريحة عمولة | `sourceId` | `GET api/V1/CommissionSlice/{sourceId}` |
| `12` Adjustment | `3` Adjustment + `employeeId` | شريحة عمولة (تسوية) | `sourceId` | `GET api/V1/CommissionSlice/{sourceId}` |

---

### 4.6 إيواء وترحيل وعمليات نظام

| `source` | `referenceType` | الشاشة | الـ id | API |
|----------|---------------|--------|--------|-----|
| `13` System | `4` System | إيواء عاملة | `sourceId` | `GET api/Housing/{sourceId}` |
| `10` Contract | `1` Contract (إيراد إيواء) | إيواء عاملة | `sourceId` | `GET api/Housing/{sourceId}` |
| `6` Ticket | `4` System + `workerId` | ترحيل عاملة | `sourceId` | `GET api/Worker/{workerId}` (الترحيل مرتبط بالعاملة) |
| `8` Escape | `3` Adjustment | غرامة هروب (سجل حالة) | `sourceId` | سجل الهروب — استخدم `workerId` → `GET api/Worker/{workerId}` |
| `9` Transfer | `3` Adjustment | نقل يدوي | `sourceId` | حسب السياق — غالباً `TransferContract` |

---

### 4.7 أطراف مرتبطة (تنقل ثانوي)

لو مفيش شاشة واضحة للمصدر، استخدم الحقول المساعدة:

| الحقل | الشاشة | API |
|-------|--------|-----|
| `customerId` | ملف العميل | `GET api/V1/Customer/{customerId}` |
| `agentId` | ملف الوكيل | `GET api/V1/Agent/{agentId}` |
| `workerId` | ملف العاملة | `GET api/Worker/{workerId}` |
| `employeeId` | ملف الموظف | `GET api/V1/Employee/{employeeId}` |

---

## 5. مسارات الفرونت المقترحة (Routes)

> عدّل البادئات حسب مشروعكم. المهم: الـ `id` من `sourceId` (أو الحقل المساعد).

| الكيان | Route مقترح |
|--------|-------------|
| قيد يومية | `/accounting/journal-entries/{id}` |
| عقد وساطة | `/mediation/contracts/{sourceId}` |
| عقد تشغيل | `/operating/contracts/{sourceId}` |
| عقد نقل كفالة | `/transfer/contracts/{sourceId}` |
| سند قبض | `/accounting/receipt-vouchers/{sourceId}` |
| سند صرف | `/accounting/payment-vouchers/{sourceId}` |
| إشعار دائن | `/accounting/credit-notes/{sourceId}` |
| إشعار مدين | `/accounting/debit-notes/{sourceId}` |
| مسير رواتب | `/hr/payroll/{sourceId}` |
| طلب سلفة | `/hr/loan-requests/{sourceId}` |
| طلب مستحقات | `/hr/entitlements-requests/{sourceId}` |
| شريحة عمولة | `/hr/commission-slices/{sourceId}` |
| إيواء | `/housing/{sourceId}` |
| عميل | `/customers/{customerId}` |
| وكيل | `/agents/{agentId}` |
| عاملة | `/workers/{workerId}` |
| موظف | `/hr/employees/{employeeId}` |

---

## 6. دالة TypeScript جاهزة للفرونت

```typescript
export enum JournalReferenceType {
  Manual = 0,
  Contract = 1,
  Payment = 2,
  Adjustment = 3,
  System = 4,
}

export enum JournalEntrySource {
  Manual = 0,
  CustomerPayment = 1,
  AgentPayment = 2,
  Salary = 3,
  Advance = 4,
  Visa = 5,
  Ticket = 6,
  Arrival = 7,
  Escape = 8,
  Transfer = 9,
  Contract = 10,
  Payment = 11,
  Adjustment = 12,
  System = 13,
}

export interface JournalEntryNavInput {
  source: JournalEntrySource;
  referenceType: JournalReferenceType;
  sourceId?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  workerId?: string | null;
  employeeId?: string | null;
}

export interface JournalEntryNavTarget {
  /** null = لا يوجد تنقل */
  route: string | null;
  /** id المستخدم في الرابط */
  id: string | null;
  /** وصف للعرض في UI */
  label: string;
  /** هل محتاج resolve لنوع العقد؟ */
  needsContractResolve?: boolean;
}

export function resolveJournalEntryNavigation(
  entry: JournalEntryNavInput
): JournalEntryNavTarget {
  const { source, referenceType, sourceId, customerId, agentId, workerId, employeeId } = entry;

  // يدوي
  if (referenceType === JournalReferenceType.Manual || source === JournalEntrySource.Manual) {
    return { route: null, id: null, label: 'قيد يدوي' };
  }

  if (!sourceId && !customerId && !agentId && !workerId && !employeeId) {
    return { route: null, id: null, label: 'مصدر غير معروف' };
  }

  // رواتب
  if (source === JournalEntrySource.Salary && referenceType === JournalReferenceType.System) {
    if (employeeId) {
      return { route: '/hr/entitlements-requests', id: sourceId!, label: 'طلب مستحقات' };
    }
    return { route: '/hr/payroll', id: sourceId!, label: 'مسير رواتب' };
  }
  if (source === JournalEntrySource.Salary && referenceType === JournalReferenceType.Payment) {
    return { route: '/hr/payroll', id: sourceId!, label: 'دفعة راتب' };
  }

  // سلف
  if (source === JournalEntrySource.Advance && employeeId && referenceType === JournalReferenceType.System) {
    return { route: '/hr/loan-requests', id: sourceId!, label: 'طلب سلفة' };
  }
  if (source === JournalEntrySource.Advance && referenceType === JournalReferenceType.System) {
    return { route: '/hr/payroll', id: sourceId!, label: 'سلفة من مسير الرواتب' };
  }

  // عمولة
  if (
    (source === JournalEntrySource.AgentPayment || source === JournalEntrySource.Adjustment) &&
    employeeId &&
    referenceType === JournalReferenceType.System
  ) {
    return { route: '/hr/commission-slices', id: sourceId!, label: 'شريحة عمولة' };
  }

  // إيواء
  if (source === JournalEntrySource.System && referenceType === JournalReferenceType.System) {
    return { route: '/housing', id: sourceId!, label: 'إيواء' };
  }

  // نقل كفالة
  if (source === JournalEntrySource.Transfer) {
    return { route: '/transfer/contracts', id: sourceId!, label: 'عقد نقل كفالة' };
  }

  // تأشيرة / وصول / هروب / عمولة وكيل → وساطة
  if (
    source === JournalEntrySource.Visa ||
    source === JournalEntrySource.Arrival ||
    source === JournalEntrySource.Escape ||
    (source === JournalEntrySource.AgentPayment && referenceType === JournalReferenceType.Contract)
  ) {
    return { route: '/mediation/contracts', id: sourceId!, label: 'عقد وساطة' };
  }

  // ترحيل
  if (source === JournalEntrySource.Ticket && workerId) {
    return { route: '/workers', id: workerId, label: 'عاملة (ترحيل)' };
  }

  // سندات وإشعارات
  if (source === JournalEntrySource.Payment && referenceType === JournalReferenceType.Payment) {
    if (customerId) {
      return { route: '/accounting/receipt-vouchers', id: sourceId!, label: 'سند قبض' };
    }
    return { route: '/accounting/payment-vouchers', id: sourceId!, label: 'سند صرف' };
  }
  if (source === JournalEntrySource.Payment && referenceType === JournalReferenceType.Contract) {
    return { route: '/operating/contracts', id: sourceId!, label: 'عقد تشغيل (دفعة)' };
  }

  if (source === JournalEntrySource.Adjustment && referenceType === JournalReferenceType.Adjustment) {
    if (agentId) {
      return { route: '/accounting/debit-notes', id: sourceId!, label: 'إشعار مدين' };
    }
    if (customerId) {
      return { route: '/accounting/credit-notes', id: sourceId!, label: 'إشعار دائن' };
    }
    if (employeeId) {
      return { route: '/hr/commission-slices', id: sourceId!, label: 'تسوية عمولة' };
    }
  }

  // عقد عام
  if (referenceType === JournalReferenceType.Contract) {
  return {
      route: '/contracts', // resolve لاحقاً
      id: sourceId!,
      label: 'عقد',
      needsContractResolve: true,
    };
  }

  // fallback بالأطراف
  if (customerId) return { route: '/customers', id: customerId, label: 'عميل' };
  if (agentId) return { route: '/agents', id: agentId, label: 'وكيل' };
  if (workerId) return { route: '/workers', id: workerId, label: 'عاملة' };
  if (employeeId) return { route: '/hr/employees', id: employeeId, label: 'موظف' };

  return { route: null, id: sourceId ?? null, label: 'مصدر غير معروف' };
}
```

### Resolve نوع العقد (لما `needsContractResolve = true`)

```typescript
async function resolveContractRoute(sourceId: string): Promise<string> {
  const tryGet = async (url: string) => {
    const res = await fetch(url, { headers: { /* auth */ } });
    return res.ok;
  };

  if (await tryGet(`/api/Mediation/MediationContract/${sourceId}`))
    return `/mediation/contracts/${sourceId}`;

  if (await tryGet(`/api/EmploymentOperatingContract/${sourceId}`))
    return `/operating/contracts/${sourceId}`;

  if (await tryGet(`/api/TransferContract/${sourceId}`))
    return `/transfer/contracts/${sourceId}`;

  if (await tryGet(`/api/Housing/${sourceId}`))
    return `/housing/${sourceId}`;

  return `/accounting/journal-entries`; // fallback
}
```

---

## 7. UI — زر "الذهاب للمصدر"

في شاشة تفاصيل القيد أو قائمة القيود:

```
┌─────────────────────────────────────────────┐
│  قيد JE-2026-0042                           │
│  المصدر: عقد وساطة                          │
│  [ الذهاب للمصدر → ]                        │
└─────────────────────────────────────────────┘
```

**السلوك:**
1. استدعِ `resolveJournalEntryNavigation(entry)`
2. لو `route = null` → اخفِ الزر أو اعرض "قيد يدوي"
3. لو `needsContractResolve` → نفّذ `resolveContractRoute` ثم `router.push`
4. غير كده → `router.push(`${route}/${id}`)`

---

## 8. حالات خاصة يجب معرفتها

| الحالة | التفسير |
|--------|---------|
| `sourceId` = عقد لكن `referenceType` = Payment | سند قبض مرتبط بعقد تشغيل — `sourceId` هو **العقد** مش السند |
| `sourceId` = عقد لكن القيد من CreditNote | `referenceType` = Contract يعني `sourceId` للعقد؛ الإشعار نفسه مش محفوظ في القيد |
| `sourceId` = payrollRunId لدفعة راتب | `referenceType` = Payment و `source` = Salary — روح لمسير الرواتب |
| قيد Manual | `source=0`, `referenceType=0`, `sourceId=null` — مفيش تنقل |
| أكثر من قيد لنفس العقد | طبيعي — نفس `sourceId` يتكرر |

---

## 9. ملخص سريع (Cheat Sheet)

```
referenceType=0  →  لا تنقل
referenceType=1  →  عقد (sourceId) — resolve نوع العقد
referenceType=2  →  سند قبض/صرف (sourceId) — فرّق بـ customerId/agentId
referenceType=3  →  إشعار/تسوية (sourceId) — فرّق بـ customerId/agentId/employeeId
referenceType=4  →  نظام: رواتب / إيواء / عمولة (sourceId + employeeId/workerId)

source=9   →  TransferContract
source=5,7,8  →  MediationContract
source=11 + referenceType=1  →  EmploymentOperatingContract
source=13  →  Housing
source=3,4 + employeeId  →  HR requests
```

---

## 10. مراجع

- [FRONTEND_ACCOUNTING.md](./FRONTEND_ACCOUNTING.md) — دليل المحاسبة الكامل
- [ACCOUNTING_DOCUMENTS.md](./ACCOUNTING_DOCUMENTS.md) — سندات وإشعارات
- [PAYROLL_ACCOUNTING.md](./PAYROLL_ACCOUNTING.md) — رواتب وسلف
