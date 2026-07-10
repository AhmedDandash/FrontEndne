# Front-end تغييرات مطلوبة (09-07-2026)

> ملخص شامل لكل ما يجب تطبيقه في الواجهة بعد تحديثات الـ Backend في طلب تحسينات الـ ERP.

---

## 1) الفرع في العقود (جميع أنواع العقود)

### المطلوب
- عرض **اسم الفرع** في:
  - تفاصيل العقد
  - قائمة العقود
  - التقارير / التصدير Excel

### حقول API الجديدة (عقود الوساطة / الاستقدام)
| الحقل | الوصف |
|--------|--------|
| `branchId` | معرّف الفرع |
| `branchNameAr` | اسم الفرع بالعربية |
| `branchNameEn` | اسم الفرع بالإنجليزية |

### حقول API (عقود التشغيل)
نفس الحقول أعلاه + بيانات العميل:
`customerNameAr`, `customerNameEn`, `customerPhone`, `customerNationalId`

### ملاحظة
- عند إنشاء عقد، يُربط تلقائياً بفرع الموظف الحالي (هيدر `CurrentBranchId`).
- لا حاجة لحقل إدخال يدوي للفرع في الإنشاء العادي.

---

## 2) وحدة العملاء (Customer)

### حقول جديدة في النماذج والجداول
| الحقل API | الوصف | ملاحظة |
|-----------|--------|--------|
| `dateOfBirth` | تاريخ الميلاد | يُرسل/يُستقبل كـ `dateOfBirth` أو `birthDate` |
| `nationalId` | رقم الهوية الوطنية | إن تُرك فارغاً يُنسخ من `identityNumber` |
| `secondaryMobileNumber` | رقم جوال ثانوي | حقل جديد |

### تحديث الشاشات
- **نموذج الإنشاء / التعديل**: إضافة الحقول الثلاثة + التحقق المناسب.
- **صفحة التفاصيل**: عرض الحقول الجديدة.
- **الجدول (Grid)**: إضافة أعمدة `nationalId`, `dateOfBirth`, `secondaryMobileNumber` حسب الحاجة.

### توليد الاسم الإنجليزي تلقائياً
عند إدخال الاسم العربي:
1. استدعِ:
   ```
   POST api/Customer/generate-english-name
   Body: { "arabicName": "محمد أحمد" }
   ```
2. املأ حقل `englishName` بالقيمة المُرجعة.
3. **اسمح للمستخدم بالتعديل اليدوي** بعد التعبئة التلقائية.

> يمكن أيضاً الاعتماد على أن الـ Backend يولّد الاسم الإنجليزي عند الحفظ إذا كان فارغاً.

### قائمة الجنسية (للعملاء)
- استبدل القائمة الثابتة في الواجهة بـ:
  ```
  GET api/Nationality?isActiveOnly=true&pageSize=100
  ```
- اعرض `nationalityNameAr` في القائمة المنسدلة.
- تم تعطيل جنسيات مثل بنغلاديش وكينيا من قاعدة البيانات.

---

## 3) عقود الاستقدام / الوساطة (Mediation Contracts)

### 3.1 اختيار العامل — عمال متاحون فقط

عند فتح نافذة اختيار العامل استخدم:
```
GET api/Worker?availableForMediationContract=true&searchByPassportOnly=true&passportNo={جزء من رقم الجواز}
```

| باراميتر | الوصف |
|----------|--------|
| `availableForMediationContract=true` | نشط + غير مسند لعقد نشط |
| `searchByPassportOnly=true` | البحث برقم الجواز فقط |
| `passportNo` | مطابقة جزئية (Contains) |

> **لا تعرض** العمال غير النشطين أو المسندين لعقد آخر.

### 3.2 حقول إنشاء العقد الإضافية
تأكد من إرسالها في `POST api/Mediation/MediationContract` (form-data):
| الحقل | الوصف |
|--------|--------|
| `musanedContractNumber` | رقم عقد مساند |
| `musanedDocumentationNumber` | رقم التوثيق |
| `contractCategory` | تصنيف العقد (1=Standard, 2=VIP, 3=Corporate) |

### 3.3 إزالة نوع التأشيرة (Visa Type)
- **احذف** حقل `visaType` من واجهة الإنشاء والتحقق.
- لا ترسل `visaType` في الطلب (اختياري في الـ API).
- باقي حقول التأشيرة (`visaNumber`, `visaDate`, ...) تبقى كما هي إن كانت مستخدمة.

### 3.4 صورة العامل
اعرض `workerPhotoUrl` في:
- تفاصيل العقد
- ملخص العقد
- صفحات الطباعة

### 3.5 إنهاء خدمة العامل + إسناد عامل جديد

#### إنهاء خدمة العامل
زر: **إنهاء خدمة العامل** ضمن إجراءات العقد
```
POST api/Mediation/MediationContract/end-worker-service
Body: { "contractId": "...", "reason": "سبب اختياري" }
```

#### إسناد عامل جديد (بعد الإنهاء)
```
POST api/Mediation/MediationContract/assign-worker
Body: {
  "contractId": "...",
  "workerId": "...",
  "workerPassportNumber": "..."
}
```

#### سجل الإسنادات
في تفاصيل العقد اعرض `workerAssignments[]`:
- `workerNameAr`, `workerPassportNumber`, `workerPhotoUrl`
- `assignedAt`, `endedAt`, `endReason`, `isActive`

### 3.6 البحث المتقدم — فلاتر جديدة

`GET api/Mediation/MediationContract` يدعم الآن:

| باراميتر | الوصف |
|----------|--------|
| `withoutAssignedWorker=true` | عقود بدون عامل |
| `isPaid=true` | عقود مدفوعة |
| `isUnpaid=true` | عقود غير مدفوعة |
| `dateFrom` / `dateTo` | تاريخ الإنشاء |
| `paymentDateFrom` / `paymentDateTo` | تاريخ سداد الفاتورة |
| `customerId` | العميل |
| `workerId` | العامل |
| `statusId` | الحالة |
| `branchId` | الفرع |

### 3.7 طلبات الاستقدام (Recruitment Requests)
```
GET api/Mediation/MediationContract/recruitment-requests
```

اعرض لكل طلب:
- إن وُجد عامل (`hasSpecificWorker=true`):
  - `workerName`, `workerPassportNumber`, `workerPhotoUrl`
- وإلا:
  - اعرض النص: **"أي عامل مطابق"** (`workerSelectionLabel`)

---

## 4) عقود التشغيل (Operation Contracts)

### 4.1 مدة العقد — خيارات مقروءة

استبدل القيم الرقمية 1/2/3 بقائمة:

| القيمة `duration` | عربي | إنجليزي |
|-------------------|------|---------|
| `1` | شهري | Monthly |
| `3` | ربع سنوي | Quarterly |
| `6` | نصف سنوي | Semi Annual |
| `12` | سنوي | Annual |

اعرض في الواجهة `durationNameAr` / `durationNameEn` من الـ API.

### 4.2 أتمتة الإسكان → التسليم
عند إسناد عامل لعقد تشغيل (إنشاء أو تعديل بـ `workerId`):
- **لا تطلب** من المستخدم إزالة العامل من السكن يدوياً.
- الـ Backend يزيله من السكن وينقله لقائمة التسليم تلقائياً.

### 4.3 نموذج تسليم العامل للعميل

#### زر جديد
**طباعة نموذج التسليم** داخل عقد التشغيل

#### جلب بيانات الطباعة
```
GET api/EmploymentOperatingContract/{id}/print-delivery-form
```

#### حفظ التوقيعات / تاريخ التسليم
```
POST api/EmploymentOperatingContract/{id}/delivery-form
Body: {
  "deliveryDate": "2026-07-09",
  "employeeName": "...",
  "notes": "...",
  "customerSignedAt": null,
  "workerSignedAt": null,
  "companyRepresentativeSignedAt": null
}
```

#### محتوى النموذج (من `OperatingContractDeliveryFormDto`)
- بيانات العميل: الاسم، الجوال، الهوية، العنوان
- بيانات العامل: الاسم، الجوال، الجواز، الصورة
- رقم العقد، تاريخ التسليم، الفرع، اسم الموظف
- مساحات توقيع: العميل، العامل (اختياري)، ممثل الشركة
- دعم **طباعة** و **تصدير PDF** من الواجهة

---

## 5) تحسينات UI/UX المقترحة

| المنطقة | التحسين |
|---------|---------|
| البحث | فلاتر واضحة + debounce للبحث برقم الجواز |
| الحالات الفارغة | رسائل عربية واضحة ("لا توجد عقود مطابقة") |
| التحميل | Skeleton / Spinner أثناء جلب العمال والعقود |
| التحقق | رسائل خطأ عربية من `ApiResponse.errors` |
| التسميات | توحيد المصطلحات العربية (فرع، مساند، تسليم، ...) |
| التجاوب | جداول قابلة للتمرير أفقياً على الشاشات الصغيرة |

---

## 6) قاعدة البيانات

- شغّل الـ migration: `ErpImprovementsJul2026`
- يضيف: `Customers.NationalId`, `Customers.SecondaryMobileNumber`
- يضيف جداول: `MediationContractWorkerAssignments`, `OperatingContractDeliveryForms`
- يحدّث قائمة الجنسيات (تعطيل بنغلاديش/كينيا + إضافة سعودي/مصري/سوري/يمني)

---

## 7) قائمة تحقق للواجهة

- [ ] العقود الحالية تعمل بدون كسر
- [ ] إنشاء عميل بالحقول الجديدة
- [ ] توليد الاسم الإنجليزي من العربي
- [ ] اختيار عامل متاح فقط (بحث بالجواز)
- [ ] إنشاء عقد وساطة بالحقول الجديدة (بدون visaType)
- [ ] عرض صورة العامل في التفاصيل والطباعة
- [ ] إنهاء خدمة عامل + إسناد عامل جديد
- [ ] البحث المتقدم في عقود الوساطة
- [ ] طلبات الاستقدام تعرض اختيار العامل
- [ ] مدة عقد التشغيل بالخيارات المقروءة
- [ ] إسناد عامل تشغيل بدون خطوة إزالة السكن اليدوية
- [ ] طباعة نموذج تسليم عقد التشغيل
- [ ] عرض الفرع في قوائم العقود والتقارير
- [ ] لا أخطاء Console / API

---

## 8) ملخص Endpoints الجديدة / المحدّثة

| Method | Endpoint | الغرض |
|--------|----------|--------|
| POST | `api/Customer/generate-english-name` | توليد الاسم الإنجليزي |
| GET | `api/Nationality?isActiveOnly=true` | قائمة جنسيات العملاء |
| GET | `api/Worker?availableForMediationContract=true&searchByPassportOnly=true` | عمال متاحون للوساطة |
| GET | `api/Mediation/MediationContract/recruitment-requests` | طلبات الاستقدام |
| POST | `api/Mediation/MediationContract/end-worker-service` | إنهاء خدمة العامل |
| POST | `api/Mediation/MediationContract/assign-worker` | إسناد عامل جديد |
| GET | `api/EmploymentOperatingContract/{id}/print-delivery-form` | بيانات نموذج التسليم |
| POST | `api/EmploymentOperatingContract/{id}/delivery-form` | حفظ نموذج التسليم |
