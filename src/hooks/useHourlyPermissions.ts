/**
 * Hourly module permissions.
 *
 * The Sigma backend authorizes hourly endpoints via JWT claims of type
 * `permission` (e.g. "hourly.employee.manage_orders"). These are NOT in the
 * page-permissions matrix and NOT returned by /Auth/me — they live only in the
 * access token. This hook decodes them so the UI can hide/disable actions the
 * user cannot perform (and avoid inevitable 403s).
 *
 * `hourly.admin.full_access` is treated as a wildcard that grants everything.
 */

import { useMemo } from 'react';

export const HOURLY_PERMISSIONS = {
  MANAGE_ORDERS: 'hourly.employee.manage_orders',
  ASSIGN_WORKERS: 'hourly.employee.assign_workers',
  ASSIGN_DRIVERS: 'hourly.employee.assign_drivers',
  MANAGE_WORKERS: 'hourly.employee.manage_workers',
  MANAGE_PACKAGES: 'hourly.employee.manage_packages',
  MANAGE_DRIVERS: 'hourly.employee.manage_drivers',
  REPORTS: 'hourly.employee.reports',
  TRACK_ORDER: 'hourly.customer.track_order',
  VIEW_INVOICES: 'hourly.customer.view_invoices',
  VIEW_NOTIFICATIONS: 'hourly.customer.view_notifications',
  DRIVER_TRACKING: 'hourly.driver.tracking',
  FULL_ACCESS: 'hourly.admin.full_access',
} as const;

export type HourlyPermission = (typeof HOURLY_PERMISSIONS)[keyof typeof HOURLY_PERMISSIONS];

function decodeHourlyPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token) return [];
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(
      atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    );
    const raw = payload?.permission;
    if (!raw) return [];
    return Array.isArray(raw) ? raw.map(String) : [String(raw)];
  } catch {
    return [];
  }
}

export function useHourlyPermissions() {
  return useMemo(() => {
    const perms = decodeHourlyPermissions();
    const set = new Set(perms);
    const isFull = set.has(HOURLY_PERMISSIONS.FULL_ACCESS);
    const can = (p: HourlyPermission) => isFull || set.has(p);
    return {
      permissions: perms,
      isFullAccess: isFull,
      can,
      canManageOrders: can(HOURLY_PERMISSIONS.MANAGE_ORDERS),
      canAssignWorkers: can(HOURLY_PERMISSIONS.ASSIGN_WORKERS),
      canAssignDrivers: can(HOURLY_PERMISSIONS.ASSIGN_DRIVERS),
      canManageWorkers: can(HOURLY_PERMISSIONS.MANAGE_WORKERS),
      canManagePackages: can(HOURLY_PERMISSIONS.MANAGE_PACKAGES),
      canManageDrivers: can(HOURLY_PERMISSIONS.MANAGE_DRIVERS),
      canViewReports: can(HOURLY_PERMISSIONS.REPORTS),
      canViewInvoices: can(HOURLY_PERMISSIONS.VIEW_INVOICES),
      canViewNotifications: can(HOURLY_PERMISSIONS.VIEW_NOTIFICATIONS),
    };
  }, []);
}
