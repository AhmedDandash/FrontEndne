# Module 29 Test Report: Hourly Orders, Drivers, Catalog, Payments & Notifications

Date: 2026-08-14
Status: PASS WITH KNOWN LIMITATIONS

## Scope

Priority row 29 covers `/hourly-workers/drivers`, `/packages`, `/serving-areas`, `/payments`, `/notifications`, and order subresources under `/api/V1/HourlyWorkerOrders/*`.

Inventory also lists `/api/V1/HourlyWorkerReports/*` near this family, but the priority table assigns reports to Module 42, so reports were intentionally deferred.

## Frontend Changes

- Aligned Module 29 list services to live Swagger PascalCase query params:
  - `HourlyDrivers`: `Search`, `IsActive`, `SortBy`, `SortDescending`, `PageNumber`, `PageSize`
  - Admin packages / serving areas: `Search`, `IsActive`, `City`, `SortBy`, `SortDescending`, `PageNumber`, `PageSize`
  - Payments: `OrderId`, `Status`, `DateFrom`, `DateTo`, `Search`, paging/sorting
  - Notifications: `OrderId`, `DeliveryStatus`, `RecipientPhone`, `Search`, paging/sorting
- Added missing driver order and transport status service/hook coverage:
  - `GET /api/V1/HourlyDrivers/{driverId}/Orders`
  - `POST /api/V1/HourlyDrivers/{driverId}/Orders/{orderId}/TransportStatus`
- Added driver order history drawer and transport status modal on `/hourly-workers/drivers`.
- Added order tracking creation UI for `POST /api/V1/HourlyWorkerOrders/{orderId}/Tracking`.
- Added accommodation status UI for `PUT /api/V1/HourlyWorkerOrders/{orderId}/Accommodation/{accommodationId}/Status`.
- Wrapped driver/package/serving-area/invoice/accommodation/refund/retry writes so failed API validation does not close the current drawer/modal.

## Files Changed

- `src/services/hourly-worker.service.ts`
- `src/hooks/api/useHourlyDrivers.ts`
- `src/hooks/api/useHourlyOrders.ts`
- `src/types/hourly-worker.types.ts`
- `src/app/hourly-workers/drivers/page.tsx`
- `src/app/hourly-workers/requests/[id]/page.tsx`
- `src/app/hourly-workers/packages/page.tsx`
- `src/app/hourly-workers/serving-areas/page.tsx`
- `src/app/hourly-workers/payments/page.tsx`
- `src/app/hourly-workers/notifications/page.tsx`

## Live API Results

Auth used `sigma@gmail.com`; bearer token was kept in memory only.

Branch used: `31887c15-5b47-4551-2190-08dea9210ab7`.

Disposable records created and deleted successfully:

- Driver `6a2c8d87-0fa2-40b6-6f58-08defa0de8a9`
- Package `f9c1b51c-bff7-42fd-cc54-08defa0de955`
- Serving area `30abb46d-cd7a-42ef-65a5-08defa0de9a0`

Successful probes:

- `GET /api/V1/HourlyDrivers`
- `POST /api/V1/HourlyDrivers`
- `GET /api/V1/HourlyDrivers/{id}`
- `PUT /api/V1/HourlyDrivers/{id}`
- `POST /api/V1/HourlyDrivers/{id}/Deactivate`
- `POST /api/V1/HourlyDrivers/{id}/Activate`
- `GET /api/V1/HourlyDrivers/{driverId}/Orders`
- `DELETE /api/V1/HourlyDrivers/{id}`
- `GET /api/V1/HourlyCatalog/Packages`
- `GET /api/V1/HourlyCatalog/ServingAreas`
- `GET /api/V1/HourlyCatalog/Admin/Packages`
- `POST /api/V1/HourlyCatalog/Admin/Packages`
- `GET /api/V1/HourlyCatalog/Admin/Packages/{id}`
- `PUT /api/V1/HourlyCatalog/Admin/Packages/{id}`
- `DELETE /api/V1/HourlyCatalog/Admin/Packages/{id}`
- `GET /api/V1/HourlyCatalog/Admin/ServingAreas`
- `POST /api/V1/HourlyCatalog/Admin/ServingAreas`
- `GET /api/V1/HourlyCatalog/Admin/ServingAreas/{id}`
- `PUT /api/V1/HourlyCatalog/Admin/ServingAreas/{id}`
- `DELETE /api/V1/HourlyCatalog/Admin/ServingAreas/{id}`
- `GET /api/V1/HourlyWorkerOrders/{orderId}/RecommendedWorkers`
- `GET /api/V1/HourlyWorkerOrders/{orderId}/Tracking`
- `GET /api/V1/HourlyWorkerOrders/{orderId}/Invoices`
- `GET /api/V1/HourlyWorkerOrders/{orderId}/Accommodation` returned expected 404 for no booking
- `GET /api/V1/HourlyOrderPayments`
- `GET /api/V1/HourlyOrderNotifications`

Known limitations / backend follow-up:

- `POST /api/V1/HourlyWorkerOrders/{orderId}/Tracking` returned 400 `"Order is read-only."` against disposable completed order `TK-2026-000008`; no non-terminal disposable order was available after the Module 28 cleanup workflow.
- `POST /api/V1/HourlyOrderNotifications/{id}/Retry` returned 502 `"Notification retry failed."` for failed notification `49d66258-e543-462b-8841-08defa090531`, likely due missing WhatsApp template/provider setup (`Template not found` on the notification row).
- Refund was not success-executed because `GET /api/V1/HourlyOrderPayments` returned zero payment rows; no disposable refundable payment existed.
- Invoice creation, accommodation booking/status, assign-driver, and driver transport-status writes were not success-executed because the current request create schema has no driver/accommodation flags and the available disposable orders are terminal/read-only.

## Verification

- `npx tsc --noEmit` passed.
- `npm test` passed: 97 tests.
- `npm run lint` passed with existing hook dependency warnings in unrelated files.

## Leftovers

No new Module 29 driver/package/serving-area disposable records remain.

Existing leftovers from prior module work remain unchanged:

- Inactive Module 28 worker `817ac97f-171f-48d5-29a1-08defa07ed99`
- Module 28 disposable order audit rows `TK-2026-000006`, `TK-2026-000007`, `TK-2026-000008`
