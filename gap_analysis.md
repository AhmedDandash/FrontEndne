# Gap Analysis: عقد توسط .pdf vs page.tsx
**Source of truth**: `عقد توسط .pdf` (Mediation Module API Guide)
**Analysed file**: `src/app/contracts/mediationcontract/page.tsx` + supporting service/type/config files

---

## 1. Contract Lifecycle — PDF vs Code Comparison

| Step | PDF Status | Code Status |
|------|-----------|-------------|
| Offer auto-fill (POST /auto-fill) | ✅ Defined | ✅ Implemented |
| Create Draft (POST /MediationContract) | ✅ Defined | ⚠️ Missing `workerId` + `workerPassportNumber` (required by PDF) |
| Sign — Musaned (POST /sign) | ✅ Defined | ✅ Implemented |
| Generate Delivery Form (POST /delivery-form) | ✅ Defined | ✅ Implemented |
| Confirm Delivery / Customer Signed (POST /delivery-form/sign) | ✅ Defined | ✅ Implemented |
| Warranty Return (POST /warranty-return) | ✅ Defined | ✅ Implemented |
| Manual Status Update (PUT /update-status) | ✅ Defined | ✅ Implemented |
| Cancel (POST /cancel) | ✅ Defined | ✅ Implemented |
| Status History Timeline (GET /status-history/{id}) | ✅ Defined | ✅ Implemented |
| Update Offer (PUT /MediationContractOffer/{id}) | ✅ Defined | ❌ **BROKEN** — `UPDATE` is a string not a function; `id` missing from body |

---

## 2. Fields Present in Code BUT NOT in PDF

### A. Dead State / Handlers in `page.tsx`
The **create modal was removed** from `page.tsx` (creation now routes to `/add` page), but the following dead code remains:

| Dead Item | Type | Lines |
|-----------|------|-------|
| `createForm` | `Form.useForm()` | 117 |
| `createSelectedOffer` | `useState<MediationContractOffer>` | 112–114 |
| `createContract` | API destructure | 130 |
| `isCreating` | API destructure | 137 |
| `handleCreateOfferSelect()` | Handler fn | 318–330 |
| `handleCreateContract()` | Handler fn | 333–371 |
| `computeTotalCost()` | Helper fn | 303–315 |

### B. Dead Imports in `page.tsx`

| Import | Reason Dead |
|--------|------------|
| `Switch` (antd) | Only used in removed create form |
| `OfferSelector` | Only used in removed create form |
| `MediationContractOffer` (type) | Only used by `createSelectedOffer` |
| `CreateMediationContractDto` (type) | Only used by `handleCreateContract` |

### C. Dead Translation Keys in `page.tsx`

| Key | Reason Dead |
|-----|------------|
| `selectCustomer` | Customer select modal uses inline strings |
| `visaInfo` | Not used in any remaining modal/JSX |
| `costDescription` | Not used in any remaining modal/JSX |
| `comprehensiveVisa` | Not used in any remaining modal/JSX |
| `contractCategory` | Not used in any remaining modal/JSX |
| `documentationNumber` | Sign modal uses `musanedDocNumber` |
| `hasInsurance` | Not used in any remaining modal/JSX |

### D. Fields in `CreateMediationContractDto` NOT in PDF Create Body

| Field | PDF Verdict |
|-------|-------------|
| `statusId` | Not in PDF create payload |
| `musanedDocumentationNumber` | PDF: only sent at sign step |
| `visaDateHijri` | Not in PDF at all |
| `isComprehensiveQualificationVisa` | Not in PDF |
| `agentCostSAR` (direct input) | Comes from offer auto-fill; backend uses offer |
| `totalTaxValue` (direct input) | Computed server-side from offer |
| `costDiscount` | Not in PDF create body |
| `totalCost` (direct input) | Computed server-side (backend rejects frontend value) |
| `costDescription` | Not in PDF |
| `domesticWorkerInsurance` (direct amount) | Only `hasContractInsurance: bool` in PDF create |

---

## 3. Fields Present in PDF BUT NOT in Code

### A. `CreateMediationContractDto` — Missing Required Fields

| Field | PDF Requirement | Current Code |
|-------|----------------|--------------|
| `workerId` (Guid, required) | ✅ Required by PDF | ❌ Missing |
| `workerPassportNumber` (string, required) | ✅ Required by PDF | ❌ Missing |

### B. `UpdateMediationContractOfferDto` — Missing Fields (PDF body schema)

| Field | PDF Body Schema | Current DTO |
|-------|----------------|-------------|
| `id` (Guid, required in body) | ✅ Required | ❌ Missing |
| `offerNumber` (int) | ✅ Present in example | ❌ Missing |
| `totalOfferCost` (decimal) | ✅ Present | ❌ Missing |
| `isActive` (bool) | ✅ Present | ❌ Missing |

---

## 4. API Configuration Bugs

### `api.config.ts` — `MEDIATION_CONTRACT_OFFER.UPDATE`
- **Current**: `UPDATE: '/api/Mediation/MediationContractOffer'` (plain string)
- **Bug**: Service calls `API_ENDPOINTS.MEDIATION_CONTRACT_OFFER.UPDATE(id)` → `TypeError: not a function`
- **Fix**: `UPDATE: (id: number | string) => \`/api/Mediation/MediationContractOffer/\${id}\``

### `mediation-contract-offer.service.ts` — `update()` method
- **Current**: Payload does NOT include `id`
- **PDF spec**: `id` must be in both URL path AND request body
- **Fix**: Add `id` as first field of payload object

---

## 5. Financial Formula Compliance

| Formula | PDF Definition | Code Implementation | Status |
|---------|---------------|--------------------|----|
| TotalCost | `(LocalCost + TotalTaxValue + AgentCostSAR + OtherCosts + DomesticWorkerInsurance) - (ManagerDiscount + CostDiscount)` | `computeTotalCost()` in page.tsx (dead) | ✅ Formula correct, dead code to remove |
| RefundAmount | `if days>=90 → 0; else TotalCost - (TotalCost/90 × days)` | Warranty modal inline calc | ✅ Correct |
| Salary | Informational only — NOT in TotalCost | Comment at line 303 | ✅ Documented |
| TaxLocalCost | `LocalCost × TaxRate` (from accounting settings) | Hardcoded as 15% in /add page | ⚠️ Should come from API |

---

## 6. Summary

| Category | Count |
|----------|-------|
| Dead state/handlers to remove from page.tsx | 7 items |
| Dead imports to remove from page.tsx | 4 items |
| Dead translation keys to remove from page.tsx | 7 keys |
| API config bugs | 1 critical bug |
| Service body bugs | 1 critical bug |
| Missing required fields (Create DTO) | 2 fields |
| Missing fields (Update DTO) | 4 fields |
| Lifecycle steps correct per PDF | 9/10 |
