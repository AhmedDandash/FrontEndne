# Branch Geofencing — Frontend Integration Guide

This document describes the API changes for location-based attendance validation. Apply these changes to Branch Create/Edit screens and Attendance Check-In/Check-Out flows.

---

## Overview

Employees can only check in or check out when their GPS coordinates are within the configured radius of their **assigned branch**. Validation is enforced on the **backend** — the frontend must collect coordinates but cannot bypass geofencing.

---

## 1. Branch Create / Edit

**Endpoints:** `POST api/V1/Branch` · `PUT api/V1/Branch/{id}`

### New required fields

| Field | Type | Validation |
|-------|------|------------|
| `latitude` | number | Required, -90 to 90 |
| `longitude` | number | Required, -180 to 180 |
| `allowedRadiusMeters` | integer | Required, > 0 |

### Example request body (partial)

```json
{
  "nameAr": "الفرع الرئيسي",
  "nameEn": "Main Branch",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "allowedRadiusMeters": 150,
  "...": "other existing branch fields"
}
```

### Response (`GET api/V1/Branch/{id}`)

`BranchDetailsDto` now includes:

```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "allowedRadiusMeters": 150
}
```

### UI recommendations

- Add a map picker or manual lat/long inputs on Create and Edit Branch forms.
- Show the radius field with a label like "Allowed Attendance Radius (meters)".
- Validate client-side before submit (same rules as backend).
- Existing branches without geofence data will block employee attendance until an admin updates the branch.

---

## 2. Attendance Check-In / Check-Out

**Endpoints:** `POST api/V1/Attendance/CheckIn` · `POST api/V1/Attendance/CheckOut`

### Breaking change

Both endpoints now require a **JSON body** with GPS coordinates. Calls without a body will be rejected.

### Request body — `AttendanceLocationDto`

```json
{
  "latitude": 24.7138,
  "longitude": 46.6751
}
```

| Field | Type | Validation |
|-------|------|------------|
| `latitude` | number | Required, -90 to 90 |
| `longitude` | number | Required, -180 to 180 |

### Frontend flow

```
1. User taps Check-In or Check-Out
2. Request browser/device location permission (navigator.geolocation)
3. If permission denied or position unavailable:
   → Show error, do NOT call the API
4. On success, POST coordinates with the attendance request
5. Handle API response (success or geofence rejection)
```

### Example (JavaScript)

```javascript
async function checkIn() {
  let position;
  try {
    position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  } catch {
    alert("Location permission is required to register attendance.");
    return;
  }

  const response = await fetch("/api/V1/Attendance/CheckIn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
  });

  const result = await response.json();
  if (!result.success) {
    alert(result.errors?.[0] ?? "Attendance failed");
  }
}
```

### Success response

```json
{
  "success": true,
  "data": "Check-in recorded successfully",
  "statusCode": 200
}
```

### Error responses

| Scenario | Example message |
|----------|----------------|
| Missing body | `Location coordinates are required for attendance registration.` |
| Outside geofence | `You are outside the allowed attendance area. Distance: 320m, allowed: 150m.` |
| No branch assigned | `Employee is not assigned to a branch.` |
| Branch not configured | `Branch attendance location is not configured. Contact your administrator.` |
| Already checked in | `Already checked in today` |

---

## 3. Attendance audit data (Filter / Reports)

**Endpoint:** `POST api/V1/Attendance/Filter`

`AttendanceDto` now includes geolocation audit fields:

| Field | When set |
|-------|----------|
| `employeeLatitude` | Check-in |
| `employeeLongitude` | Check-in |
| `distanceFromBranchMeters` | Check-in distance from branch |
| `checkOutEmployeeLatitude` | Check-out |
| `checkOutEmployeeLongitude` | Check-out |
| `checkOutDistanceFromBranchMeters` | Check-out distance from branch |

Use these in attendance reports and audit screens.

---

## 4. Checklist

- [ ] Add latitude, longitude, allowedRadiusMeters to Branch Create form
- [ ] Add same fields to Branch Edit form with validation
- [ ] Update existing branches with geofence coordinates
- [ ] Request geolocation permission before check-in/out
- [ ] Send `AttendanceLocationDto` body on CheckIn and CheckOut
- [ ] Handle geofence rejection errors in UI
- [ ] Block attendance if location permission denied (do not call API)
- [ ] Display audit coordinates in attendance detail/report views

---

## Related backend files

| File | Purpose |
|------|---------|
| `Sigma.Application/Common/GeofenceHelper.cs` | Haversine distance calculation |
| `Sigma.Application/Services/HR/FinancialHRServices.cs` | Attendance geofence validation |
| `Sigma.Application/Validators/Branch/BranchValidators.cs` | Branch coordinate validation |
| `Sigma.Application/Validators/HR/AttendanceValidators.cs` | Attendance coordinate validation |

Migration: `BranchGeofencingAndAttendanceLocation`
