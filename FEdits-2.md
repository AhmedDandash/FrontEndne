# Back-End Updates - 30/7

## Implemented Changes

### 1) Prevent Duplicate Customer Creation
- Added duplicate validation before customer create/update in:
  - `CustomerService.CreateCustomerAsync`
  - `CustomerService.UpdateCustomerAsync`
  - `ExternalContractService.CreateExternalContractAsync`
- Duplicate rules now check:
  - National ID
  - Mobile Number
  - Passport Number (when identity type is passport)
- If duplicate found, API returns `400 BadRequest` with a clear field-specific message and customer is not created.
- Added repository methods:
  - `ExistsByNationalIdAsync`
  - `ExistsByMobileNumberAsync`
  - `ExistsByPassportNumberAsync`
- Added DB unique indexes for stronger protection:
  - `Customers.NationalId` (filtered unique)
  - `Customers.(IdentityType, IdentityNumber)` for passport identity type (filtered unique)
  - `CustomerPhones.Number` (unique)

### 2) Mediation Contract Optional Fields
- Removed required behavior for **Musaned Contract Number** in sign DTO/validator:
  - `SignMediationContractDto.MusanedContractNumber` is now nullable.
  - FluentValidation no longer requires it; only validates max length when provided.
- `MusanedDocumentationNumber` and `ContractCategory` were already nullable in entity/DTO and remain optional.
- Added backward-compatible alias:
  - `ContractClassification` maps to `ContractCategory` in mediation DTOs.

### 3) Return Worker Image in Contract Details
- Added `WorkerImageUrl` (nullable) to contract details DTOs:
  - `EmploymentOperatingContractDto`
  - `OperatingContractDeliveryFormDto`
  - Mediation contract DTOs (`MediationContractListDto`, `MediationContractDto`, assignment DTO, recruitment list DTO)
- Existing `WorkerPhotoUrl` kept for backward compatibility.
- `WorkerImageUrl` resolves from the same source as `WorkerPhotoUrl`; returns `null` when no image exists.

### 4) Auto-Remove Worker From Housing on Operation Contract Assignment
- Updated assignment flow in `EmploymentOperatingContractService.HandleWorkerAssignedToOperatingContractAsync`:
  - Remove all `Housed` status logs for the assigned worker.
  - Set availability flags:
    - `WantsWork = false`
    - `WantsTransfer = false`
  - Keep/set `IsReadyForHandover = true`
  - Ensure `ReadyForHandover` status log exists.
- Result: worker is automatically removed from housing availability once assigned to an operation contract.

### 5) Worker Delivery Record Feature (Complete)
- Added new entity: `WorkerDeliveryRecord`
  - Fields: `Id`, `OperationContractId`, `WorkerId`, `CustomerId`, `DeliveryDate`, `ReceiverName`, `ReceiverNationalId`, `Notes`, `SignatureImage`, `CreatedBy`, `CreatedDate`.
- Added configuration + DbSet + migration wiring.
- Added repository + service + validators + controller.

#### New APIs
- `POST /api/WorkerDeliveryRecord`  
  Create delivery record.
- `GET /api/WorkerDeliveryRecord/{id}`  
  Get delivery record details.
- `PUT /api/WorkerDeliveryRecord/{id}`  
  Update delivery record.
- `GET /api/WorkerDeliveryRecord/{id}/print`  
  Get printable delivery data (contract, worker, customer, receiver, signature/image, branch data).

All new APIs are controller-based and automatically included in Swagger.

## Notes for Front-End
- Keep using `WorkerPhotoUrl` if already integrated; `WorkerImageUrl` is now also available.
- For mediation contract classification, both `ContractCategory` and `ContractClassification` are supported (alias mapping).
- Duplicate customer errors are now strict `400` and should be displayed directly to user.
