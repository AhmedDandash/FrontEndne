# Parameter Gap Analysis

Source files reviewed:

- `website_filters_extracted.md`
- `simga-api.txt`

Rule applied: a filter is implemented only when the target page endpoint exposes a matching query parameter. The items below are required by the extracted UI list but are not backed by a same-purpose query parameter in `simga-api.txt`.

## Mediation Contracts / عقود التوسط

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** اسم العميل / Client Name
  **Expected Parameter Name (camelCase / snake_case):** `customerName` / `customer_name`
  **Expected Data Type:** `string`
  **Description / Options:** Dedicated customer-name search. The API only exposes generic `Search`, not a customer-name-specific parameter.

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** الحالة الخارجية / External Status
  **Expected Parameter Name (camelCase / snake_case):** `externalStatusId` / `external_status_id`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Current recruitment/processing status in the origin country.

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** حالة عقد مساند / Musaned Contract Status
  **Expected Parameter Name (camelCase / snake_case):** `musanedContractStatus` / `musaned_contract_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Live status synced from Musaned.

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** حالة العقد اليدوي / Manual Contract Status
  **Expected Parameter Name (camelCase / snake_case):** `manualContractStatus` / `manual_contract_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Offline/manual contract state.

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** اسم العامل / Worker Name
  **Expected Parameter Name (camelCase / snake_case):** `workerName` / `worker_name`
  **Expected Data Type:** `string`
  **Description / Options:** Dedicated worker-name search. The API only exposes generic `Search`.

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** رقم العامل / Worker ID / Number
  **Expected Parameter Name (camelCase / snake_case):** `workerNumber` / `worker_number`
  **Expected Data Type:** `string | number`
  **Description / Options:** Internal human-readable worker number. API exposes `WorkerId` as UUID only.

- **Page Name / Context:** Mediation Contracts / عقود التوسط
  **UI Label (Arabic & English):** حالة التأشيرة / Visa Status
  **Expected Parameter Name (camelCase / snake_case):** `visaStatus` / `visa_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Visa processing stage.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** حالة خارجية لم تتم / Incomplete External Status
  **Expected Parameter Name (camelCase / snake_case):** `incompleteExternalStatusId` / `incomplete_external_status_id`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Uncompleted or blocked external agency step.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** حالة خارجية مرت على العقد / Past External Status
  **Expected Parameter Name (camelCase / snake_case):** `pastExternalStatusId` / `past_external_status_id`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Historical external status state.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** حالات الضمان / Warranty / Guarantee Status
  **Expected Parameter Name (camelCase / snake_case):** `warrantyStatus` / `warranty_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Trial period and warranty condition.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** تم الإنشاء بواسطة / Created By
  **Expected Parameter Name (camelCase / snake_case):** `createdBy` / `created_by`
  **Expected Data Type:** `string | uuid`
  **Description / Options:** User or system account that created the record.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** تاريخ الإلغاء / Cancellation Date
  **Expected Parameter Name (camelCase / snake_case):** `cancellationDateFrom`, `cancellationDateTo` / `cancellation_date_from`, `cancellation_date_to`
  **Expected Data Type:** `date`
  **Description / Options:** Contract cancellation date range.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** تاريخ الوصول / Arrival Date
  **Expected Parameter Name (camelCase / snake_case):** `arrivalDateFrom`, `arrivalDateTo` / `arrival_date_from`, `arrival_date_to`
  **Expected Data Type:** `date`
  **Description / Options:** Worker arrival date range.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** استبدال العقود / Contract Replacement
  **Expected Parameter Name (camelCase / snake_case):** `isReplacement` / `is_replacement`
  **Expected Data Type:** `boolean`
  **Description / Options:** Whether the contract is a replacement/substitution.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** سداد مساند / Musaned Payment
  **Expected Parameter Name (camelCase / snake_case):** `musanedPaymentStatus` / `musaned_payment_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Musaned platform payment status.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** Ref / Reference Number
  **Expected Parameter Name (camelCase / snake_case):** `referenceNumber` / `reference_number`
  **Expected Data Type:** `string`
  **Description / Options:** Internal tracking/reference code.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** عمالة تم إضافتها اليوم / Workers Added Today
  **Expected Parameter Name (camelCase / snake_case):** `workersAddedToday` / `workers_added_today`
  **Expected Data Type:** `boolean`
  **Description / Options:** Quick filter for workers added today.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** الديانة / Religion
  **Expected Parameter Name (camelCase / snake_case):** `religion` / `religion`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Worker religion.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** سبق له العمل / Prior Experience
  **Expected Parameter Name (camelCase / snake_case):** `hasPreviousExperience` / `has_previous_experience`
  **Expected Data Type:** `boolean | enum`
  **Description / Options:** Yes/no prior work experience.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** الوظيفة / Occupation / Job Title
  **Expected Parameter Name (camelCase / snake_case):** `jobId` / `job_id`
  **Expected Data Type:** `string | uuid`
  **Description / Options:** Worker job/occupation.

- **Page Name / Context:** Mediation Contracts / Advanced Search
  **UI Label (Arabic & English):** عميل مهم / VIP / Important Client
  **Expected Parameter Name (camelCase / snake_case):** `isVip` / `is_vip`
  **Expected Data Type:** `boolean`
  **Description / Options:** Priority customer flag.

## Automatic Follow-Up / المتابعة التلقائية

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** اسم العميل / Client Name
  **Expected Parameter Name (camelCase / snake_case):** `customerName` / `customer_name`
  **Expected Data Type:** `string`
  **Description / Options:** Dedicated customer-name search. The API only exposes generic `Search`.

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** الحالة الخارجية / External Status
  **Expected Parameter Name (camelCase / snake_case):** `externalStatusId` / `external_status_id`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Foreign agency recruitment status.

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** حالة عقد مساند / Musaned Contract Status
  **Expected Parameter Name (camelCase / snake_case):** `musanedContractStatus` / `musaned_contract_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Agreement state on Musaned.

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** حالة العقد اليدوي / Manual Contract Status
  **Expected Parameter Name (camelCase / snake_case):** `manualContractStatus` / `manual_contract_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** State of offline/manual contract entries.

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** اسم العامل / Worker Name
  **Expected Parameter Name (camelCase / snake_case):** `workerName` / `worker_name`
  **Expected Data Type:** `string`
  **Description / Options:** Dedicated worker-name search. The API only exposes generic `Search`.

- **Page Name / Context:** Automatic Follow-Up / المتابعة التلقائية
  **UI Label (Arabic & English):** حالة التأشيرة / Visa Status
  **Expected Parameter Name (camelCase / snake_case):** `visaStatus` / `visa_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Visa processing stage.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** تاريخ الحالة الخارجية / External Status Date
  **Expected Parameter Name (camelCase / snake_case):** `externalStatusDateFrom`, `externalStatusDateTo` / `external_status_date_from`, `external_status_date_to`
  **Expected Data Type:** `date`
  **Description / Options:** Latest external status update date range.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** حالات الضمان / Warranty / Guarantee Status
  **Expected Parameter Name (camelCase / snake_case):** `warrantyStatus` / `warranty_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Worker trial period warranty condition.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** تم الإنشاء بواسطة / Created By
  **Expected Parameter Name (camelCase / snake_case):** `createdBy` / `created_by`
  **Expected Data Type:** `string | uuid`
  **Description / Options:** Account that created the record.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** تاريخ الوصول / Arrival Date
  **Expected Parameter Name (camelCase / snake_case):** `arrivalDateFrom`, `arrivalDateTo` / `arrival_date_from`, `arrival_date_to`
  **Expected Data Type:** `date`
  **Description / Options:** Worker arrival date range.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** استبدال العقود / Contract Replacement
  **Expected Parameter Name (camelCase / snake_case):** `isReplacement` / `is_replacement`
  **Expected Data Type:** `boolean`
  **Description / Options:** Replaced worker contracts.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** سداد مساند / Musaned Payment
  **Expected Parameter Name (camelCase / snake_case):** `musanedPaymentStatus` / `musaned_payment_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Platform payment status.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** Ref / Reference Number
  **Expected Parameter Name (camelCase / snake_case):** `referenceNumber` / `reference_number`
  **Expected Data Type:** `string`
  **Description / Options:** Internal tracking reference.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** عمالة تم إضافتها اليوم / Workers Added Today
  **Expected Parameter Name (camelCase / snake_case):** `workersAddedToday` / `workers_added_today`
  **Expected Data Type:** `boolean`
  **Description / Options:** Newly registered workers.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** الديانة / Religion
  **Expected Parameter Name (camelCase / snake_case):** `religion` / `religion`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Worker religion.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** سبق له العمل / Prior Experience
  **Expected Parameter Name (camelCase / snake_case):** `hasPreviousExperience` / `has_previous_experience`
  **Expected Data Type:** `boolean | enum`
  **Description / Options:** Yes/no prior work history.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** الوظيفة / Occupation / Job Title
  **Expected Parameter Name (camelCase / snake_case):** `jobId` / `job_id`
  **Expected Data Type:** `string | uuid`
  **Description / Options:** Selected job position.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** عقود لها تاريخ وصول ولم يتم وصولها منذ أكثر من / Contracts with Arrival Date but Not Arrived in > X Days
  **Expected Parameter Name (camelCase / snake_case):** `notArrivedAfterArrivalDateDays` / `not_arrived_after_arrival_date_days`
  **Expected Data Type:** `number`
  **Description / Options:** Numeric threshold in days.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** عقود لها تاريخ توقيع ولم يتم وصولها منذ أكثر من / Contracts with Signing Date but Not Arrived in > X Days
  **Expected Parameter Name (camelCase / snake_case):** `notArrivedAfterSigningDateDays` / `not_arrived_after_signing_date_days`
  **Expected Data Type:** `number`
  **Description / Options:** Numeric threshold in days.

- **Page Name / Context:** Automatic Follow-Up / Advanced Search
  **UI Label (Arabic & English):** البريد الإلكتروني / Email Address
  **Expected Parameter Name (camelCase / snake_case):** `customerEmail` / `customer_email`
  **Expected Data Type:** `string`
  **Description / Options:** Customer email search.

## Rental / Operating Contracts / عقود التشغيل - الإيجار

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** الاسم عربي / Arabic Name
  **Expected Parameter Name (camelCase / snake_case):** `customerArabicName` / `customer_arabic_name`
  **Expected Data Type:** `string`
  **Description / Options:** Dedicated Arabic customer/employer name search. The API only exposes generic `Search`.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** جوال / الهاتف / Mobile / Phone
  **Expected Parameter Name (camelCase / snake_case):** `customerPhone` / `customer_phone`
  **Expected Data Type:** `string`
  **Description / Options:** Client contact phone number. The API exposes `WorkerPhone`, not customer phone.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** البريد الإلكتروني / Email Address
  **Expected Parameter Name (camelCase / snake_case):** `customerEmail` / `customer_email`
  **Expected Data Type:** `string`
  **Description / Options:** Client email address.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** تم الإنشاء بواسطة / Created By
  **Expected Parameter Name (camelCase / snake_case):** `createdBy` / `created_by`
  **Expected Data Type:** `string | uuid`
  **Description / Options:** Staff member who logged the record.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** ينتهي بعد / Expires After
  **Expected Parameter Name (camelCase / snake_case):** `expiresAfterDays` / `expires_after_days`
  **Expected Data Type:** `number`
  **Description / Options:** Contracts expiring within X days.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** تاريخ نهاية العقد / Contract Expiration Condition
  **Expected Parameter Name (camelCase / snake_case):** `expirationCondition` / `expiration_condition`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Condition/status for contract expiration.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** الحالة المالية / Financial Status
  **Expected Parameter Name (camelCase / snake_case):** `financialStatus` / `financial_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Payment/balance state.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** حالة اختيار العمالة / Labor Selection Status
  **Expected Parameter Name (camelCase / snake_case):** `laborSelectionStatus` / `labor_selection_status`
  **Expected Data Type:** `number | enum`
  **Description / Options:** Worker selection/assignment status. The API exposes `LaborManagement`, but the spec does not document options or confirm it is the same concept.

- **Page Name / Context:** Rental / Operating Contracts / عقود التشغيل - الإيجار
  **UI Label (Arabic & English):** رقم جواز السفر / Passport Number
  **Expected Parameter Name (camelCase / snake_case):** `workerPassportNumber` / `worker_passport_number`
  **Expected Data Type:** `string`
  **Description / Options:** Worker passport number.
