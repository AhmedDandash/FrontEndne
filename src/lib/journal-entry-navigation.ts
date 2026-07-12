/**
 * Journal Entry → source-document navigation.
 *
 * Implements JOURNAL_ENTRY_SOURCE_NAVIGATION.md: from a journal entry's existing
 * fields (source, referenceType, sourceId + party ids) resolve which screen to
 * open and with which id. No new backend endpoint is used.
 *
 * Route reality (2026-07): the target modules are flat LIST pages, not `/{id}`
 * detail routes, so navigation targets a list route with an `?openId=<id>` query
 * param that the destination page reads to auto-open that record's detail view.
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
  /** Id to pass as `?openId=` on the destination page. */
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
    return { route: JE_SOURCE_ROUTES.housing, id: sourceId!, labelAr: 'إيواء', labelEn: 'Housing' };
  }

  // ── Transfer contract ─────────────────────────────────────────
  if (source === S.Transfer) {
    return { route: JE_SOURCE_ROUTES.transferContract, id: sourceId!, labelAr: 'عقد نقل كفالة', labelEn: 'Transfer contract' };
  }

  // ── Escape fine (state record) → worker profile ───────────────
  // §4.6: source=Escape + referenceType=Adjustment is an escape-fine record with
  // no dedicated screen; navigate to the worker via workerId.
  if (source === S.Escape && referenceType === R.Adjustment && workerId) {
    return { route: JE_SOURCE_ROUTES.worker, id: workerId, labelAr: 'غرامة هروب (عاملة)', labelEn: 'Escape fine (worker)' };
  }

  // ── Visa / Arrival / Escape / agent-commission → mediation ────
  if (
    source === S.Visa ||
    source === S.Arrival ||
    source === S.Escape ||
    (source === S.AgentPayment && referenceType === R.Contract)
  ) {
    return { route: JE_SOURCE_ROUTES.mediationContract, id: sourceId!, labelAr: 'عقد وساطة', labelEn: 'Mediation contract' };
  }

  // ── Deportation ticket → worker profile ───────────────────────
  if (source === S.Ticket && referenceType === R.System && workerId) {
    return { route: JE_SOURCE_ROUTES.worker, id: workerId, labelAr: 'عاملة (ترحيل)', labelEn: 'Worker (deportation)' };
  }

  // ── Vouchers ──────────────────────────────────────────────────
  // §4.3: a customer payment (source=CustomerPayment) is always a receipt voucher.
  if (source === S.CustomerPayment && referenceType === R.Payment) {
    return { route: JE_SOURCE_ROUTES.receiptVoucher, id: sourceId!, labelAr: 'سند قبض', labelEn: 'Receipt voucher' };
  }
  if (source === S.Payment && referenceType === R.Payment) {
    if (customerId) {
      return { route: JE_SOURCE_ROUTES.receiptVoucher, id: sourceId!, labelAr: 'سند قبض', labelEn: 'Receipt voucher' };
    }
    return { route: JE_SOURCE_ROUTES.paymentVoucher, id: sourceId!, labelAr: 'سند صرف', labelEn: 'Payment voucher' };
  }
  if (source === S.Payment && referenceType === R.Contract) {
    return { route: JE_SOURCE_ROUTES.operatingContract, id: sourceId!, labelAr: 'عقد تشغيل (دفعة)', labelEn: 'Operating contract (payment)' };
  }

  // ── Credit / debit notes ──────────────────────────────────────
  if (source === S.Adjustment && referenceType === R.Adjustment) {
    if (agentId) {
      return { route: JE_SOURCE_ROUTES.debitNote, id: sourceId!, labelAr: 'إشعار مدين', labelEn: 'Debit note' };
    }
    if (customerId) {
      return { route: JE_SOURCE_ROUTES.creditNote, id: sourceId!, labelAr: 'إشعار دائن', labelEn: 'Credit note' };
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
  if (customerId) return { route: JE_SOURCE_ROUTES.customer, id: customerId, labelAr: 'عميل', labelEn: 'Customer' };
  if (agentId) return { route: JE_SOURCE_ROUTES.agent, id: agentId, labelAr: 'وكيل', labelEn: 'Agent' };
  if (workerId) return { route: JE_SOURCE_ROUTES.worker, id: workerId, labelAr: 'عاملة', labelEn: 'Worker' };
  if (employeeId) return { route: JE_SOURCE_ROUTES.employee, id: employeeId, labelAr: 'موظف', labelEn: 'Employee' };

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
  // Housing has no `GET /api/Housing/{id}` endpoint (§4.6 housing-revenue contract);
  // probe the list and match by id instead.
  if (
    await tryGet(async () => {
      const list = await HousingService.getAll();
      if (!list.some((h) => h.id === sourceId)) throw new Error('not found');
    })
  ) {
    return JE_SOURCE_ROUTES.housing;
  }
  // Fallback: stay on the journal entries screen if nothing matched.
  return JE_SOURCE_ROUTES.journalEntry;
}

/** Build the final navigable URL (`route?openId=id`) for a resolved target. */
export function buildSourceUrl(route: string, id: string | null): string {
  return id ? `${route}?openId=${encodeURIComponent(id)}` : route;
}
