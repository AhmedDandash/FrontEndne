/**
 * Journal Entry → source-document navigation.
 *
 * Implements JOURNAL_ENTRY_SOURCE_NAVIGATION.md: from a journal entry's existing
 * fields (source, referenceType, sourceId + party ids) resolve which screen to
 * open and with which id. No new backend endpoint is used.
 *
 * Route reality (2026-07): Phase 1 gave the 3 contract modules (mediation,
 * operating/rent, transfer) real `/{id}` detail routes; Phase 2 did the same
 * for the 4 accounting documents (receipt/payment vouchers, credit/debit
 * notes); Phase 3 did the same for the party/HR entities (agents, workers,
 * employees, housing). Navigation to any of those targets the route with the
 * id as a path segment. `customer` and `payroll` are still flat LIST pages,
 * so navigation targets the list route with an `?openId=<id>` query param
 * that the destination page reads to auto-open that record's (modal) detail
 * view. `buildSourceUrl` picks between the two automatically — see its doc
 * comment.
 *
 * Three source types referenced by the doc (§4.5) have neither a frontend page
 * nor a backend `GET /{id}` endpoint — LoanRequest, EntitlementsRequest,
 * CommissionSlice. Those resolve to a `disabled` target so the UI can show a
 * disabled "Go to source" with an explanatory tooltip instead of a dead link.
 */
// Relative (not `@/`) + explicit extension so Node's test runner can load the
// pure resolver directly; webpack/TS resolve it the same.
import { JE_SOURCE, JE_REFERENCE_TYPE } from '../types/journal-entry.types.ts';
// Contract-type services are imported lazily inside resolveContractRoute() so the
// pure resolver below (and its unit tests) don't pull the whole service graph.

/** Actual app routes for each navigable source entity (list pages). */
export const JE_SOURCE_ROUTES = {
  journalEntry: '/accounting/journal-entries',
  mediationContract: '/contracts/mediationcontract',
  operatingContract: '/contracts/operation/rent',
  transferContract: '/sponsorship-transfer',
  generalVoucher: '/accounting/general-vouchers',
  receiptVoucher: '/accounting/receipt-vouchers',
  paymentVoucher: '/accounting/payment-vouchers',
  creditNote: '/accounting/credit-notes',
  debitNote: '/accounting/debit-notes',
  payroll: '/hr/payroll',
  housing: '/housing/management',
  customer: '/customers',
  agent: '/agents',
  worker: '/applicants',
  employee: '/hr/employees',
} as const;

export interface JournalEntryNavInput {
  source: number;
  referenceType: number;
  sourceId?: string | null;
  customerId?: string | null;
  agentId?: string | null;
  workerId?: string | null;
  employeeId?: string | null;
}

export interface JournalEntryNavTarget {
  /** List route to navigate to (null = no navigation available). */
  route: string | null;
  /** Id to append — as `/{id}` (pathParam) or `?openId={id}` — on the destination page. */
  id: string | null;
  /** Bilingual label describing the target, for the button/tooltip. */
  labelAr: string;
  labelEn: string;
  /** True when contract type is ambiguous and must be probed at click time. */
  needsContractResolve?: boolean;
  /** True when the target module has no page/endpoint yet (button shown disabled). */
  disabled?: boolean;
  disabledReasonAr?: string;
  disabledReasonEn?: string;
  /**
   * True when `route` is a real `/{id}` detail route (Phase 1: the 3 contract
   * modules) rather than a list page read via `?openId=`. Left undefined for
   * the generic-contract branch (`needsContractResolve`) since the actual
   * route is only known after `resolveContractRoute` runs at click time —
   * `buildSourceUrl` falls back to detecting it from the resolved route.
   */
  pathParam?: boolean;
}

const S = JE_SOURCE;
const R = JE_REFERENCE_TYPE;

/** Resolve the destination screen + id for a journal entry. Pure / synchronous. */
export function resolveJournalEntryNavigation(entry: JournalEntryNavInput): JournalEntryNavTarget {
  const { source, referenceType, sourceId, customerId, agentId, workerId, employeeId } = entry;

  // Manual entry — no source document.
  if (referenceType === R.Manual || source === S.Manual) {
    return { route: null, id: null, labelAr: 'قيد يدوي', labelEn: 'Manual entry' };
  }

  if (!sourceId && !customerId && !agentId && !workerId && !employeeId) {
    return { route: null, id: null, labelAr: 'مصدر غير معروف', labelEn: 'Unknown source' };
  }

  const disabledTarget = (labelAr: string, labelEn: string): JournalEntryNavTarget => ({
    route: null,
    id: sourceId ?? null,
    labelAr,
    labelEn,
    disabled: true,
    disabledReasonAr: 'لا توجد شاشة لهذا المصدر بعد',
    disabledReasonEn: 'No screen available for this source yet',
  });

  // ── Salaries / HR ─────────────────────────────────────────────
  if (source === S.Salary && referenceType === R.System) {
    if (employeeId) return disabledTarget('طلب مستحقات', 'Entitlements request');
    return { route: JE_SOURCE_ROUTES.payroll, id: sourceId!, labelAr: 'مسير رواتب', labelEn: 'Payroll run' };
  }
  if (source === S.Salary && referenceType === R.Payment) {
    return { route: JE_SOURCE_ROUTES.payroll, id: sourceId!, labelAr: 'دفعة راتب', labelEn: 'Salary payment' };
  }

  // ── Advances ──────────────────────────────────────────────────
  if (source === S.Advance && employeeId && referenceType === R.System) {
    return disabledTarget('طلب سلفة', 'Loan request');
  }
  if (source === S.Advance && referenceType === R.System) {
    return { route: JE_SOURCE_ROUTES.payroll, id: sourceId!, labelAr: 'سلفة من مسير الرواتب', labelEn: 'Advance (payroll)' };
  }

  // ── Commission ────────────────────────────────────────────────
  // Note: the Adjustment-source commission case is keyed on referenceType=Adjustment
  // (§4.5) and is handled below in the credit/debit-notes block via employeeId.
  if (source === S.AgentPayment && employeeId && referenceType === R.System) {
    return disabledTarget('شريحة عمولة', 'Commission slice');
  }

  // ── Housing ───────────────────────────────────────────────────
  if (source === S.System && referenceType === R.System) {
    return { route: JE_SOURCE_ROUTES.housing, id: sourceId!, labelAr: 'إيواء', labelEn: 'Housing', pathParam: true };
  }

  // ── Transfer contract ─────────────────────────────────────────
  if (source === S.Transfer) {
    return { route: JE_SOURCE_ROUTES.transferContract, id: sourceId!, labelAr: 'عقد نقل كفالة', labelEn: 'Transfer contract', pathParam: true };
  }

  // ── Escape fine (state record) → worker profile ───────────────
  // §4.6: source=Escape + referenceType=Adjustment is an escape-fine record with
  // no dedicated screen; navigate to the worker via workerId.
  if (source === S.Escape && referenceType === R.Adjustment && workerId) {
    return { route: JE_SOURCE_ROUTES.worker, id: workerId, labelAr: 'غرامة هروب (عاملة)', labelEn: 'Escape fine (worker)', pathParam: true };
  }

  // ── Visa / Arrival / Escape / agent-commission → mediation ────
  if (
    source === S.Visa ||
    source === S.Arrival ||
    source === S.Escape ||
    (source === S.AgentPayment && referenceType === R.Contract)
  ) {
    return { route: JE_SOURCE_ROUTES.mediationContract, id: sourceId!, labelAr: 'عقد وساطة', labelEn: 'Mediation contract', pathParam: true };
  }

  // ── Deportation ticket → worker profile ───────────────────────
  if (source === S.Ticket && referenceType === R.System && workerId) {
    return { route: JE_SOURCE_ROUTES.worker, id: workerId, labelAr: 'عاملة (ترحيل)', labelEn: 'Worker (deportation)', pathParam: true };
  }

  // ── Vouchers ──────────────────────────────────────────────────
  // §4.3: a customer payment (source=CustomerPayment) is always a receipt voucher.
  if (source === S.CustomerPayment && referenceType === R.Payment) {
    return { route: JE_SOURCE_ROUTES.receiptVoucher, id: sourceId!, labelAr: 'سند قبض', labelEn: 'Receipt voucher', pathParam: true };
  }
  if (source === S.Payment && referenceType === R.Payment) {
    if (customerId) {
      return { route: JE_SOURCE_ROUTES.receiptVoucher, id: sourceId!, labelAr: 'سند قبض', labelEn: 'Receipt voucher', pathParam: true };
    }
    return { route: JE_SOURCE_ROUTES.paymentVoucher, id: sourceId!, labelAr: 'سند صرف', labelEn: 'Payment voucher', pathParam: true };
  }
  if (source === S.Payment && referenceType === R.Contract) {
    return { route: JE_SOURCE_ROUTES.operatingContract, id: sourceId!, labelAr: 'عقد تشغيل (دفعة)', labelEn: 'Operating contract (payment)', pathParam: true };
  }

  // ── Credit / debit notes ──────────────────────────────────────
  if (source === S.Adjustment && referenceType === R.Adjustment) {
    if (agentId) {
      return { route: JE_SOURCE_ROUTES.debitNote, id: sourceId!, labelAr: 'إشعار مدين', labelEn: 'Debit note', pathParam: true };
    }
    if (customerId) {
      return { route: JE_SOURCE_ROUTES.creditNote, id: sourceId!, labelAr: 'إشعار دائن', labelEn: 'Credit note', pathParam: true };
    }
    if (employeeId) {
      return disabledTarget('تسوية عمولة', 'Commission adjustment');
    }
  }

  // ── Generic contract (type unknown → probe at click time) ─────
  if (referenceType === R.Contract) {
    return {
      route: JE_SOURCE_ROUTES.mediationContract, // provisional; resolved by resolveContractRoute()
      id: sourceId!,
      labelAr: 'عقد',
      labelEn: 'Contract',
      needsContractResolve: true,
    };
  }

  // ── Fallback: related party ───────────────────────────────────
  // Customer stays out of Phase 3 scope (no detail page/route yet) and keeps
  // the `?openId=` form; agent/worker/employee are now real `/{id}` routes.
  if (customerId) return { route: JE_SOURCE_ROUTES.customer, id: customerId, labelAr: 'عميل', labelEn: 'Customer' };
  if (agentId) return { route: JE_SOURCE_ROUTES.agent, id: agentId, labelAr: 'وكيل', labelEn: 'Agent', pathParam: true };
  if (workerId) return { route: JE_SOURCE_ROUTES.worker, id: workerId, labelAr: 'عاملة', labelEn: 'Worker', pathParam: true };
  if (employeeId) return { route: JE_SOURCE_ROUTES.employee, id: employeeId, labelAr: 'موظف', labelEn: 'Employee', pathParam: true };

  return { route: null, id: sourceId ?? null, labelAr: 'مصدر غير معروف', labelEn: 'Unknown source' };
}

/**
 * When `needsContractResolve` is true, probe the three contract types (in the
 * doc's priority order) via their existing `getById` services to pick the right
 * module route. Returns the resolved list route (with the contract id available
 * for the destination page to open).
 */
export async function resolveContractRoute(sourceId: string): Promise<string> {
  const tryGet = async (fn: () => Promise<unknown>): Promise<boolean> => {
    try {
      await fn();
      return true;
    } catch {
      return false;
    }
  };

  const [{ MediationContractService }, { EmploymentOperatingContractService }, { TransferContractService }, { HousingService }] =
    await Promise.all([
      import('@/services/mediation-contract.service'),
      import('@/services/employment-operating-contract.service'),
      import('@/services/transfer-contract.service'),
      import('@/services/housing.service'),
    ]);

  if (await tryGet(() => MediationContractService.getById(sourceId))) {
    return JE_SOURCE_ROUTES.mediationContract;
  }
  if (await tryGet(() => EmploymentOperatingContractService.getById(sourceId))) {
    return JE_SOURCE_ROUTES.operatingContract;
  }
  if (await tryGet(() => TransferContractService.getById(sourceId))) {
    return JE_SOURCE_ROUTES.transferContract;
  }
  if (await tryGet(() => HousingService.getById(sourceId))) {
    return JE_SOURCE_ROUTES.housing;
  }
  // Fallback: stay on the journal entries screen if nothing matched.
  return JE_SOURCE_ROUTES.journalEntry;
}

/**
 * List routes that are now real `/{id}` detail routes rather than a flat list
 * read via `?openId=`. Used by `buildSourceUrl` as a fallback when the caller
 * doesn't know `pathParam` up front — e.g. after `resolveContractRoute`
 * resolves the generic-contract branch to one of the contract routes (or, for
 * housing/journalEntry, to a route NOT in this set — those correctly keep the
 * `?openId=` form since they aren't migrated yet).
 *
 * Phase 1 (2026-07): the 3 contract modules (mediation, operating/rent, transfer).
 * Phase 2 (2026-07): the 4 accounting documents (receipt/payment vouchers, credit/debit notes).
 * Phase 3 (2026-07): the party/HR entities — agents, workers, employees, housing.
 *   `customer` and `payroll` are intentionally NOT in this set: neither has a
 *   detail route yet, so they correctly keep the `?openId=` form.
 */
const PATH_PARAM_ROUTES: ReadonlySet<string> = new Set([
  JE_SOURCE_ROUTES.generalVoucher,
  JE_SOURCE_ROUTES.mediationContract,
  JE_SOURCE_ROUTES.operatingContract,
  JE_SOURCE_ROUTES.transferContract,
  JE_SOURCE_ROUTES.receiptVoucher,
  JE_SOURCE_ROUTES.paymentVoucher,
  JE_SOURCE_ROUTES.creditNote,
  JE_SOURCE_ROUTES.debitNote,
  JE_SOURCE_ROUTES.agent,
  JE_SOURCE_ROUTES.worker,
  JE_SOURCE_ROUTES.employee,
  JE_SOURCE_ROUTES.housing,
]);

/**
 * Build the final navigable URL for a resolved target: `route/id` for a real
 * detail route, `route?openId=id` for a list page that auto-opens a modal.
 *
 * `pathParam` is normally taken from `JournalEntryNavTarget.pathParam`. Pass
 * it explicitly as `undefined` (or omit it) to fall back to detecting it from
 * `route` itself — needed for the generic-contract branch, where the real
 * route is only known after `resolveContractRoute` runs.
 */
export function buildSourceUrl(route: string, id: string | null, pathParam?: boolean): string {
  if (!id) return route;
  const usePathParam = pathParam ?? PATH_PARAM_ROUTES.has(route);
  return usePathParam
    ? `${route}/${encodeURIComponent(id)}`
    : `${route}?openId=${encodeURIComponent(id)}`;
}
