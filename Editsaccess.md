# Frontend RBAC Integration Guide

Apply these changes in the **FrontEnd** app so the UI matches the new backend Role-Based Access Control (RBAC).

> Backend is the source of truth. Hiding menus/buttons is UX only — unauthorized API calls still return `401` / `403`.

---

## 1. What changed on the backend

### Auth / identity

| Endpoint | Change |
|----------|--------|
| `POST /api/V1/Auth/login` | JWT now includes `permission` claims |
| `GET /api/V1/Auth/me` | Response now includes `permissions: string[]` **and** `roles: string[]` |

Example `/me` payload:

```json
{
  "success": true,
  "data": {
    "fullName": "Ahmed",
    "email": "ahmed@example.com",
    "roles": ["SalesEmployee"],
    "permissions": [
      "Customers.View",
      "Contracts.View",
      "Contracts.Status.View",
      "AutomaticFollowUp.View",
      "AutomaticFollowUp.Status.View",
      "Workers.View"
    ]
  }
}
```

### Roles (use these exact Identity names)

| UI label (EN) | UI label (AR) | Role name(s) in API |
|---------------|---------------|---------------------|
| Admin | مدير النظام | `Admin` (also treat `Owner` as full access) |
| Customer Service — Call Center | موظف خدمة عملاء (كول سنتر) | `CustomerServiceEmployee` **or** `CustomerServiceCallCenter` |
| Customer Service — Sales | موظف خدمة عملاء (مبيعات) | `SalesEmployee` **or** `CustomerServiceSales` |
| Follow-up Officer | موظف المتابعة | `FollowUpEmployee` |
| Agent | الوكيل | `Agent` |
| Accountant | المحاسب | `AccountingEmployee` |
| Human Resources | الموارد البشرية | `HREmployee` |

Keep Call Center and Sales as **separate roles** even if permissions look the same.

---

## 2. Permission catalog (for buttons / actions)

Use these exact strings (case-sensitive):

### Customers
- `Customers.View`
- `Customers.Create`
- `Customers.Update`
- `Customers.Delete`

### Contracts
- `Contracts.View`
- `Contracts.Create`
- `Contracts.Update`
- `Contracts.Delete`
- `Contracts.Approve`
- `Contracts.Status.View`

### Automatic follow-up
- `AutomaticFollowUp.View`
- `AutomaticFollowUp.Status.View`
- `AutomaticFollowUp.Manage`

### Workers
- `Workers.View`
- `Workers.Create`
- `Workers.Update`
- `Workers.Delete`
- `Workers.Own.View`
- `Workers.Own.Create`
- `Workers.Own.Update`

### Agents
- `Agents.View`
- `Agents.Create`
- `Agents.Update`
- `Agents.Delete`
- `Agents.OwnData.View`
- `Agents.OwnData.Create`
- `Agents.OwnData.Update`

### Domains
- `Accounting.FullAccess` / `Accounting.View` / `Accounting.Manage`
- `HR.FullAccess` / `HR.View` / `HR.Manage`
- `Administration.Manage`
- `System.FullAccess` → treat as **allow everything**

### Role × module matrix

| Role | Customers | Contracts | Follow-up | Contract Status | Workers | Agents | Accounting | HR |
|------|-----------|-----------|-----------|-----------------|---------|--------|------------|----|
| Admin | Full | Full | Full | Full | Full | Full | Full | Full |
| Call Center | View | View | View | View | View | No | No | No |
| Sales | View | View | View | View | View | No | No | No |
| Follow-up Officer | View | Status only | Status/View | View | No | View | No | No |
| Agent | No | No | No | No | Own Create/Edit | Own Data | No | No |
| Accountant | As required | As required | No | As required | As required | As required | Full | No |
| HR | No | No | No | No | As required | No | No | Full |

---

## 3. Frontend tasks checklist

### A. Types

Update `MeResponse`:

```ts
export interface MeResponse {
  fullName?: string | null;
  email?: string | null;
  roles?: string[] | null;
  permissions?: string[] | null; // NEW
}
```

### B. Load roles + permissions from `/Auth/me`

- Prefer `/me` over decoding JWT.
- Fallback: decode JWT claims `role` and `permission` if `/me` is slow/unavailable.
- After login, refetch `/me` (or decode the new token) so permissions are fresh.

### C. Menu + route guard (page access)

Users must **only see** modules they can access. Direct URL navigation must show Access Denied.

Recommended default page → roles matrix:

| Page key | Allowed roles |
|----------|---------------|
| `/dashboard` | all staff roles above |
| `/customers` | Call Center, Sales, Follow-up |
| `/applicants`, `/applicants/available` | Call Center, Sales, Agent |
| `/contracts/mediationcontract` (+ offers/operation pages) | Call Center, Sales |
| `/contracts/mediationcontract/automaticfollowup` | Call Center, Sales, Follow-up |
| `/agents` | Follow-up, Agent |
| `/hr/*` | `HREmployee` |
| `/hr/admin-users` | Admin only |
| `/accounting/*` | `AccountingEmployee` |
| `/settings/*`, `/register`, `/zatca/*`, `/hourly-workers/*`, `/branch/management` | Admin only |

Rules:
1. `Admin` / `Owner` always allowed.
2. Every registered page should have a matrix entry (do **not** leave pages “open to everyone”).
3. Empty allow-list `[]` = Admin only.

### D. Hide / disable Create, Edit, Delete, Approve buttons

Do **not** rely only on role names for actions. Use **permissions** from `/me`.

Example helper:

```ts
function hasPermission(userPermissions: string[], required: string | string[]) {
  const set = new Set(userPermissions.map((p) => p.toLowerCase()));
  if (set.has('system.fullaccess')) return true;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((p) => set.has(p.toLowerCase()));
}
```

Examples:

```tsx
{hasPermission(permissions, 'Customers.Create') && (
  <Button onClick={openCreate}>إضافة عميل</Button>
)}

{hasPermission(permissions, ['Workers.Create', 'Workers.Own.Create']) && (
  <Button onClick={openCreate}>إضافة عامل</Button>
)}

{hasPermission(permissions, 'Customers.Delete') && (
  <Button danger>حذف</Button>
)}
```

Suggested mapping:

| UI action | Required permission(s) |
|-----------|------------------------|
| Customers list | `Customers.View` |
| Add customer | `Customers.Create` |
| Edit customer | `Customers.Update` |
| Delete customer | `Customers.Delete` |
| Workers list | `Workers.View` **or** `Workers.Own.View` |
| Add worker | `Workers.Create` **or** `Workers.Own.Create` |
| Edit worker | `Workers.Update` **or** `Workers.Own.Update` |
| Delete worker | `Workers.Delete` |
| Agents list | `Agents.View` **or** `Agents.OwnData.View` |
| Edit agent | `Agents.Update` **or** `Agents.OwnData.Update` |
| Contracts create/edit/delete/approve | matching `Contracts.*` |
| Follow-up manage | `AutomaticFollowUp.Manage` |
| Accounting screens / mutations | `Accounting.FullAccess` |
| HR screens / mutations | `HR.FullAccess` |
| User roles / add admin / page permissions | `Administration.Manage` |

### E. Agent-specific UI rules

- Agent must **not** see Customers, Contracts, Accounting, HR, Follow-up, Settings, Admin.
- Agent may see Workers (own only) and own Agent profile.
- Prefer `GET /api/V1/Agent/me` for the agent’s own profile.
- Do not trust client-sent `agentId` filters for security; backend forces ownership.
- If agent has no linked profile, show a clear message (no data), not other agents’ data.

### F. Handle API errors

| Status | Meaning | UI |
|--------|---------|----|
| `401` | Not authenticated | Redirect to login |
| `403` | Authenticated but no permission | Access Denied / hide action |

---

## 4. Suggested file changes (FrontEnd)

| File | Action |
|------|--------|
| `src/types/api.types.ts` | Add `permissions?: string[]` to `MeResponse` |
| `src/config/appPermissions.ts` | **Add** constants matching backend permission strings |
| `src/config/defaultRolePageMatrix.ts` | **Add** default page→roles matrix (see §3C) |
| `src/services/permission.service.ts` | Merge saved localStorage matrix over defaults; never return `{}` open matrix |
| `src/hooks/api/usePagePermissions.ts` | Expose `permissions` + `useHasPermission()` |
| `src/components/layout/Sidebar.tsx` | Already filters via `useCanAccess` — ensure defaults are applied |
| `src/components/layout/MainLayout.tsx` | Keep route guard; ensure restricted pages deny |
| Feature pages (customers, workers, contracts, …) | Gate Create/Edit/Delete/Approve with `useHasPermission` |

### Example `useHasPermission`

```ts
export function useHasPermission() {
  const { permissions, isReady } = useCurrentRoles(); // must return permissions from /me

  const has = (required: string | string[]) => {
    if (!permissions?.length) return false;
    const set = new Set(permissions.map((p) => p.toLowerCase()));
    if (set.has('system.fullaccess')) return true;
    const needed = Array.isArray(required) ? required : [required];
    return needed.some((p) => set.has(p.toLowerCase()));
  };

  return { has, permissions, isReady };
}
```

Usage:

```tsx
const { has } = useHasPermission();

{has('Customers.Create') && <Button>Create</Button>}
{has(['Workers.Update', 'Workers.Own.Update']) && <Button>Edit</Button>}
```

---

## 5. Roles screen / user assignment

When assigning roles in Admin UI, show these role options (Identity names):

- `Admin`
- `CustomerServiceEmployee` / `CustomerServiceCallCenter`
- `SalesEmployee` / `CustomerServiceSales`
- `FollowUpEmployee`
- `Agent`
- `AccountingEmployee`
- `HREmployee`

Display Arabic labels from the table in §1.

For Agent users: admin should link the Identity user to an Agent record (`LinkedUserId` on create/update agent), otherwise ownership filtering will return empty/403.

---

## 6. Manual test plan (Frontend)

1. Login as **Admin** → all menus visible; create/edit/delete work.
2. Login as **Call Center** / **Sales** → see Customers, Contracts, Follow-up, Workers; **no** Create/Edit/Delete; **no** Accounting/HR/Agents/Settings.
3. Login as **Follow-up** → Follow-up, Agents, Customers, contract status; no Workers create; no Accounting/HR.
4. Login as **Agent** → Workers (own) + own agent data only; cannot open `/customers`, `/accounting`, `/hr` by URL.
5. Login as **Accountant** → Accounting menus only (plus required ledger views).
6. Login as **HR** → HR menus only.
7. Paste unauthorized URL → Access Denied.
8. DevTools: call forbidden API → expect `403` even if button was shown by mistake.
9. After role change: logout/login (or refresh token) so new permissions apply.

---

## 7. Important notes

- Never trust a role name sent from the browser for security decisions beyond UI.
- Permissions come from the authenticated user’s server identity (JWT / `/me`).
- Call Center and Sales must remain separate role values in UI/config.
- Existing page-permissions localStorage matrix can stay as an Admin override, but **defaults must match the matrix above** when storage is empty.
- Hourly-workers permissions (`hourly.*`) are separate and unchanged.

---

## 8. Quick reference — who sees what

```
Admin          → Everything
Call Center    → Customers / Contracts / Follow-up / Workers (VIEW only)
Sales          → Same as Call Center (VIEW only) — separate role
Follow-up      → Follow-up / Agents / Customers / Contract status (VIEW only)
Agent          → Own agent profile + own workers (Create/Edit own)
Accountant     → Accounting (Full)
HR             → HR (Full)
```

If something is unclear, check backend docs: `docs/RBAC.md` in Sigma.API.
