import type { PermissionMatrix } from './pagePermissions.config.ts';

export const STAFF_ROLES = [
  'Admin',
  'Owner',
  'CustomerServiceEmployee',
  'CustomerServiceCallCenter',
  'SalesEmployee',
  'CustomerServiceSales',
  'FollowUpEmployee',
  'Agent',
  'AccountingEmployee',
  'HREmployee',
] as const;

export const CUSTOMER_SERVICE_ROLES = [
  'CustomerServiceEmployee',
  'CustomerServiceCallCenter',
  'SalesEmployee',
  'CustomerServiceSales',
] as const;

export const FOLLOW_UP_ROLES = ['FollowUpEmployee'] as const;
export const AGENT_ROLES = ['Agent'] as const;
export const ACCOUNTING_ROLES = ['AccountingEmployee'] as const;
export const HR_ROLES = ['HREmployee'] as const;

const allStaff = [...STAFF_ROLES];
const customerService = [...CUSTOMER_SERVICE_ROLES];
const customerServiceAndFollowUp = [...CUSTOMER_SERVICE_ROLES, ...FOLLOW_UP_ROLES];
const customerServiceAndAgent = [...CUSTOMER_SERVICE_ROLES, ...AGENT_ROLES];
const accounting = [...ACCOUNTING_ROLES];
const hr = [...HR_ROLES];

export const DEFAULT_ROLE_PAGE_MATRIX: PermissionMatrix = {
  '/dashboard': allStaff,
  '/branch/management': [],
  '/customers': customerServiceAndFollowUp,
  '/complaints': customerServiceAndFollowUp,
  '/sponsorship-transfer': customerService,

  '/applicants': customerServiceAndAgent,
  '/applicants/available': customerServiceAndAgent,

  '/housing/management': [],
  '/housing/applicants': [],

  '/hourly-workers': [],
  '/hourly-workers/requests': [],
  '/hourly-workers/drivers': [],
  '/hourly-workers/packages': [],
  '/hourly-workers/serving-areas': [],
  '/hourly-workers/payments': [],
  '/hourly-workers/notifications': [],
  '/hourly-workers/reports': [],

  '/contracts/mediationcontract': customerService,
  '/contracts/mediationcontract/automaticfollowup': customerServiceAndFollowUp,
  '/contracts/mediationcontract/offers': customerService,
  '/contracts/mediationrequests': customerService,
  '/contracts/operation/rent': customerService,
  '/contracts/operation/collection-renewal': customerService,
  '/contracts/operation/rent-prices-offers': customerService,

  '/agents': [...FOLLOW_UP_ROLES, ...AGENT_ROLES],

  '/hr/employees': hr,
  '/hr/positions': hr,
  '/hr/departments': hr,
  '/hr/attendance': hr,
  '/hr/leave': hr,
  '/hr/leave-types': hr,
  '/hr/payroll': hr,
  '/hr/admin-users': [],
  '/hr/permission-request': hr,
  '/hr/permission-requests': hr,
  '/hr/resignation-request': hr,
  '/hr/resignation-requests': hr,
  '/hr/custody-request': hr,
  '/hr/custody-requests': hr,

  '/accounting/journal-entries': accounting,
  '/accounting/chart-of-accounts': accounting,
  '/accounting/account-settings': accounting,
  '/accounting/restriction-types': accounting,
  '/accounting/general-vouchers': accounting,
  '/accounting/receipt-vouchers': accounting,
  '/accounting/payment-vouchers': accounting,
  '/accounting/credit-notes': accounting,
  '/accounting/debit-notes': accounting,
  '/accounting/period-closing': accounting,
  '/accounting/ledger/general-ledger': accounting,
  '/accounting/ledger/agent-ledger': accounting,
  '/accounting/ledger/customer-ledger': accounting,
  '/accounting/ledger/worker-ledger': accounting,
  '/accounting/ledger/trial-balance': accounting,
  '/accounting/ledger/income-statement': accounting,
  '/accounting/ledger/balance-sheet': accounting,
  '/accounting/ledger/vat-report': accounting,

  '/settings/mediation': [],
  '/settings/marketer': [],
  '/settings/custody-types': [],
  '/settings/nationalities': [],
  '/register': [],
  '/settings/permissions': [],

  '/zatca': [],
  '/zatca/invoices': [],
  '/zatca/branch-setup': [],
  '/zatca/csr': [],
  '/zatca/certificates': [],
  '/zatca/settings': [],
  '/zatca/connection': [],
  '/zatca/logs': [],
};
