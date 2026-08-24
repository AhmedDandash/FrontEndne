# Role-Based Access Control (RBAC)

This document describes the Sigma application RBAC model introduced on top of
ASP.NET Core Identity + JWT.

## Role mapping (official ↔ Identity name)

| Official role | Arabic | Identity role name(s) |
|---|---|---|
| Admin | مدير النظام | `Admin` (+ `Owner` elevated peer) |
| Customer Service — Call Center | موظف خدمة عملاء (كول سنتر) | `CustomerServiceEmployee`, `CustomerServiceCallCenter` |
| Customer Service — Sales | موظف خدمة عملاء (مبيعات) | `SalesEmployee`, `CustomerServiceSales` |
| Follow-up Officer | موظف المتابعة | `FollowUpEmployee` |
| Agent | الوكيل | `Agent` |
| Accountant | المحاسب | `AccountingEmployee` |
| Human Resources | الموارد البشرية | `HREmployee` |

Call Center and Sales are **separate roles** even when permissions match, so they can diverge later.

## Permission catalog

Defined in `Sigma.Application/Common/Constants/AppPermissions.cs`.

Examples: `Customers.View`, `Contracts.Status.View`, `Workers.Own.Create`,
`Accounting.FullAccess`, `HR.FullAccess`, `System.FullAccess`.

Role → permission map: `AppRolePermissions.cs`.

## Role × module matrix

| Role | Customers | Contracts | Follow-up | Contract Status | Workers | Agents | Accounting | HR |
|---|---|---|---|---|---|---|---|---|
| Admin | Full | Full | Full | Full | Full | Full | Full | Full |
| Call Center | View | View | View | View | View | No | No | No |
| Sales | View | View | View | View | View | No | No | No |
| Follow-up Officer | View | Status only | Status/View | View | No | View | No | No |
| Agent | No | No | No | No | Own Create/Edit | Own Data | No | No |
| Accountant | View (ledgers) | View (as required) | No | View | View | View | Full | No |
| HR | No | No | No | No | View (payroll) | No | No | Full |

## Enforcement

### Backend
- JWT includes `permission` claims derived from roles at login (`JwtService`).
- Policies registered for every `AppPermissions` value + composites (`Workers.ReadAccess`, `Contracts.ReadAccess`, …).
- `PermissionAuthorizationHandler` evaluates claims and role maps; elevated roles (`Admin`, `Owner`) always succeed.
- Controllers use `[Authorize(Policy = ...)]` on actions.
- Agent ownership via `IAgentAccessService` + `Agent.LinkedUserId` (fallback: Email/Username match).
  Agents cannot read/update another agent's workers or profile by changing IDs.
- **Attendance self-service:** every authenticated user with a role gets `Attendance.CheckInOut`
  (`CheckIn` / `CheckOut`). Filtering all attendance records remains HR-only (`HR.View`).
- **HR self-service requests:** every authenticated user with a role gets `HR.SelfService.Submit`
  to create own permission / resignation / custody / leave requests.
  Approve/Reject and viewing all requests remain HR-only (`HR.Manage` / `HR.View`).

### Frontend (sibling app `FrontEnd`)
- Menu + route guard already use `useCanAccess` + page→role matrix.
- `/Auth/me` now returns `permissions` in addition to `roles`.
- Recommended: seed `defaultRolePageMatrix` when localStorage matrix is empty, and gate Create/Edit/Delete buttons with permission claims from `/me` or JWT.
- Backend remains authoritative; UI hiding is defense-in-depth only.

## Seeding

- EF `SeedRoles` HasData includes all roles (idempotent migrations).
- Startup `RolePermissionSeeder.EnsureRolesAsync` creates missing roles without duplicates.
- Migration `AddRbacLinkedUserIdAndRoles` adds `Agents.LinkedUserId` + new roles.

## Preserved behavior

- Existing `Admin` users keep full access via `System.FullAccess`.
- Hourly Worker permission system unchanged and still registered.
- Legacy specialty roles (`ComplaintEmployee`, hourly portal roles) retained.
