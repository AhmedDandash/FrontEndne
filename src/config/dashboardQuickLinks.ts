export interface DashboardQuickLink {
  key: string;
  path: string;
  labelAr: string;
  labelEn: string;
  color: string;
}

export type RouteAccessDecision = 'allow' | 'deny' | 'pending';

export const DASHBOARD_QUICK_LINKS: DashboardQuickLink[] = [
  { key: 'employees', path: '/hr/employees', labelAr: 'الموظفون', labelEn: 'Employees', color: '#00478c' },
  { key: 'workers', path: '/applicants', labelAr: 'العمالة', labelEn: 'Workers', color: '#00aa64' },
  { key: 'contracts', path: '/contracts/mediationcontract', labelAr: 'العقود', labelEn: 'Contracts', color: '#7b2fa8' },
  { key: 'housing', path: '/housing/management', labelAr: 'السكن', labelEn: 'Housing', color: '#d97706' },
  { key: 'customers', path: '/customers', labelAr: 'العملاء', labelEn: 'Customers', color: '#0891b2' },
  { key: 'complaints', path: '/complaints', labelAr: 'الشكاوى', labelEn: 'Complaints', color: '#dc2626' },
];

export function filterDashboardQuickLinksByAccess(
  links: readonly DashboardQuickLink[],
  checkRouteAccess: (path: string) => RouteAccessDecision
): DashboardQuickLink[] {
  return links.filter((link) => checkRouteAccess(link.path) === 'allow');
}
