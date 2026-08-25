# Nationality API — Frontend Guide

Base path: **`/api/V1/Nationality`**

Auth: all endpoints require a valid JWT (`Authorization: Bearer …`).

Write endpoints (create / update / delete / toggle) also require permission:

`Administration.Manage`

---

## Nationality type (`type`)

Each nationality belongs to **one** catalog:

| Value | Enum name | Arabic | Use for |
|------:|-----------|--------|---------|
| `1` | `Customers` | عملاء | Customer screens / dropdowns |
| `2` | `Contracts` | عقود | Contract screens / dropdowns |

Send the numeric value in JSON/query strings (ASP.NET binds enums from numbers or names).

Seeded defaults (startup) are **Customers** (`type = 1`): سعودي، سوري، مصري، يمني.

---

## Response envelope

Successful and failed calls use the shared `ApiResponse<T>` shape:

```json
{
  "success": true,
  "data": { },
  "errors": null,
  "statusCode": 200
}
```

Paged lists wrap items in:

```json
{
  "success": true,
  "data": {
    "pageSize": 10,
    "pageNumber": 1,
    "totalCount": 4,
    "data": [ /* NationalityDto[] */ ]
  },
  "statusCode": 200
}
```

### `NationalityDto`

| Field | Type | Notes |
|-------|------|--------|
| `id` | `guid` | |
| `nationalityNameAr` | `string?` | |
| `nationalityNameEn` | `string?` | |
| `isActive` | `bool?` | |
| `type` | `1 \| 2` | Customers / Contracts |
| `createdDate` | `datetime` | UTC |
| `updatedDate` | `datetime?` | UTC |

---

## Endpoints

### 1. List (with filters) — `GET /api/V1/Nationality`

Query parameters (all optional except paging defaults from `PagedFilterQueryBase`):

| Param | Type | Description |
|-------|------|-------------|
| `type` | `1` or `2` | **Filter by catalog.** Omit = return both Customers and Contracts |
| `searchName` | string | Search in AR **or** EN name (contains) |
| `nationalityNameAr` | string | Filter Arabic name |
| `nationalityNameArMatch` | string match mode | Default `Contains` |
| `nationalityNameEn` | string | Filter English name |
| `nationalityNameEnMatch` | string match mode | Default `Contains` |
| `isActive` | bool | Exact active flag |
| `isActiveOnly` | bool | Legacy: when `true`, only `isActive == true` |
| `pageNumber` | int | |
| `pageSize` | int | |
| (+ audit date filters from shared base, if used) | | |

**Frontend usage**

- Customer nationality dropdown: `GET /api/V1/Nationality?type=1&isActiveOnly=true`
- Contract nationality dropdown: `GET /api/V1/Nationality?type=2&isActiveOnly=true`
- Admin full list: `GET /api/V1/Nationality` (no `type`)

Example:

```http
GET /api/V1/Nationality?type=1&pageNumber=1&pageSize=50
Authorization: Bearer {token}
```

---

### 2. Get by id — `GET /api/V1/Nationality/{id}`

Returns one `NationalityDto`, or `404` if missing.

```http
GET /api/V1/Nationality/B2000001-0001-4000-8000-000000000001
```

---

### 3. Create — `POST /api/V1/Nationality`

Permission: `Administration.Manage`

Body (`CreateNationalityDto`):

```json
{
  "nationalityNameAr": "فلبيني",
  "nationalityNameEn": "Filipino",
  "isActive": true,
  "type": 2
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `nationalityNameAr` | no | |
| `nationalityNameEn` | no | |
| `isActive` | no | |
| `type` | **yes** | `1` = Customers, `2` = Contracts |

Success: `201` with created `NationalityDto` in `data`.

---

### 4. Update — `PUT /api/V1/Nationality/{id}`

Permission: `Administration.Manage`

- Path `id` **must equal** body `id` (otherwise `400` “ID mismatch”).

Body (`UpdateNationalityDto`):

```json
{
  "id": "B2000001-0001-4000-8000-000000000001",
  "nationalityNameAr": "سعودي",
  "nationalityNameEn": "Saudi",
  "isActive": true,
  "type": 1
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `id` | **yes** | Must match URL |
| `nationalityNameAr` | no | |
| `nationalityNameEn` | no | |
| `isActive` | no | |
| `type` | **yes** | `1` or `2` |

`404` if not found.

---

### 5. Delete — `DELETE /api/V1/Nationality/{id}`

Permission: `Administration.Manage`

Hard delete. Returns `data: true` on success, `404` if missing.

> Prefer toggle inactive if the nationality is referenced elsewhere.

---

### 6. Toggle active — `PUT /api/V1/Nationality/{id}/toggle-status`

Permission: `Administration.Manage`

Flips `isActive` (`null`/`false` → `true`, `true` → `false`). Returns `data: true`.

---

## Frontend checklist

1. Treat Customers and Contracts as **separate lists** (always pass `type` on module screens).
2. Send `type` on create/update; do not omit it.
3. Gate create/edit/delete/toggle UI with permission `Administration.Manage` (still rely on API for real enforcement).
4. Display labels:
   - `1` → عملاء / Customers
   - `2` → عقود / Contracts
5. After adding a nationality for contracts, refresh with `?type=2` (and vice versa for customers).

---

## String match modes (name filters)

Same shared `StringMatchMode` as other list APIs (typical values: `Contains`, `Equals`, `StartsWith`, …). Default for nationality name filters is **`Contains`**.
