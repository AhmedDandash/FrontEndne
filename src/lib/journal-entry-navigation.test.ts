/**
 * Unit tests for the Journal Entry source-navigation resolver.
 * Run with Node's built-in test runner (Node 24 strips TS types natively):
 *   node --test src/lib/journal-entry-navigation.test.ts
 *
 * Covers the doc §4 decision table (JOURNAL_ENTRY_SOURCE_NAVIGATION.md), with
 * emphasis on the branches fixed in the 2026-07 audit. The contract-type probe
 * (resolveContractRoute) hits the live backend and is not covered here.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveJournalEntryNavigation,
  buildSourceUrl,
  JE_SOURCE_ROUTES,
} from './journal-entry-navigation.ts';
import { JE_SOURCE as S, JE_REFERENCE_TYPE as R } from '../types/journal-entry.types.ts';

// ── Manual / unknown ──────────────────────────────────────────────
test('manual entry → no route', () => {
  const t = resolveJournalEntryNavigation({ source: S.Manual, referenceType: R.Manual });
  assert.equal(t.route, null);
});

test('referenceType Manual short-circuits regardless of source', () => {
  const t = resolveJournalEntryNavigation({ source: S.Contract, referenceType: R.Manual });
  assert.equal(t.route, null);
});

test('no source id and no party ids → no route', () => {
  const t = resolveJournalEntryNavigation({ source: S.Contract, referenceType: R.Contract });
  assert.equal(t.route, null);
});

// ── Fixed bug #1: CustomerPayment → receipt voucher ───────────────
test('CustomerPayment + Payment → receipt voucher (not customer profile)', () => {
  const t = resolveJournalEntryNavigation({
    source: S.CustomerPayment,
    referenceType: R.Payment,
    sourceId: 'rv-1',
    customerId: 'cust-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.receiptVoucher);
  assert.equal(t.id, 'rv-1');
  assert.equal(t.pathParam, true);
});

// ── Fixed bug #2: Escape + Adjustment → worker ────────────────────
test('Escape + Adjustment → worker profile via workerId', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Escape,
    referenceType: R.Adjustment,
    sourceId: 'esc-1',
    workerId: 'wk-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.worker);
  assert.equal(t.id, 'wk-1');
});

test('Escape + Contract still → mediation contract', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Escape,
    referenceType: R.Contract,
    sourceId: 'med-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.mediationContract);
  assert.equal(t.id, 'med-1');
});

// ── Vouchers ──────────────────────────────────────────────────────
test('Payment + Payment with customerId → receipt voucher', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Payment,
    referenceType: R.Payment,
    sourceId: 'v-1',
    customerId: 'c-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.receiptVoucher);
  assert.equal(t.pathParam, true);
});

test('Payment + Payment without customerId → payment voucher', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Payment,
    referenceType: R.Payment,
    sourceId: 'v-2',
    agentId: 'a-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.paymentVoucher);
  assert.equal(t.pathParam, true);
});

test('Payment + Contract → operating contract', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Payment,
    referenceType: R.Contract,
    sourceId: 'op-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.operatingContract);
});

// ── Credit / debit notes ──────────────────────────────────────────
test('Adjustment + Adjustment with agentId → debit note', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Adjustment,
    referenceType: R.Adjustment,
    sourceId: 'dn-1',
    agentId: 'a-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.debitNote);
  assert.equal(t.pathParam, true);
});

test('Adjustment + Adjustment with customerId (no agent) → credit note', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Adjustment,
    referenceType: R.Adjustment,
    sourceId: 'cn-1',
    customerId: 'c-1',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.creditNote);
  assert.equal(t.pathParam, true);
});

test('Adjustment + Adjustment with employeeId → disabled commission adjustment', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Adjustment,
    referenceType: R.Adjustment,
    sourceId: 'cs-1',
    employeeId: 'e-1',
  });
  assert.equal(t.route, null);
  assert.equal(t.disabled, true);
});

// ── HR / payroll ──────────────────────────────────────────────────
test('Salary + System (no employee) → payroll', () => {
  const t = resolveJournalEntryNavigation({ source: S.Salary, referenceType: R.System, sourceId: 'p-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.payroll);
});

test('Salary + System with employeeId → disabled entitlements request', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Salary,
    referenceType: R.System,
    sourceId: 'er-1',
    employeeId: 'e-1',
  });
  assert.equal(t.route, null);
  assert.equal(t.disabled, true);
});

test('Advance + System with employeeId → disabled loan request', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Advance,
    referenceType: R.System,
    sourceId: 'lr-1',
    employeeId: 'e-1',
  });
  assert.equal(t.disabled, true);
});

test('AgentPayment + System with employeeId → disabled commission slice', () => {
  const t = resolveJournalEntryNavigation({
    source: S.AgentPayment,
    referenceType: R.System,
    sourceId: 'c-1',
    employeeId: 'e-1',
  });
  assert.equal(t.disabled, true);
});

// ── Housing / transfer / mediation ────────────────────────────────
test('System + System → housing', () => {
  const t = resolveJournalEntryNavigation({ source: S.System, referenceType: R.System, sourceId: 'h-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.housing);
});

test('Transfer → transfer contract', () => {
  const t = resolveJournalEntryNavigation({ source: S.Transfer, referenceType: R.Contract, sourceId: 'tc-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.transferContract);
});

test('Visa → mediation contract', () => {
  const t = resolveJournalEntryNavigation({ source: S.Visa, referenceType: R.Contract, sourceId: 'm-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.mediationContract);
});

test('Ticket + System with workerId → worker', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Ticket,
    referenceType: R.System,
    sourceId: 't-1',
    workerId: 'wk-9',
  });
  assert.equal(t.route, JE_SOURCE_ROUTES.worker);
  assert.equal(t.id, 'wk-9');
});

// ── Generic contract + party fallbacks ────────────────────────────
test('generic Contract referenceType flags needsContractResolve', () => {
  const t = resolveJournalEntryNavigation({ source: S.Contract, referenceType: R.Contract, sourceId: 'x-1' });
  assert.equal(t.needsContractResolve, true);
});

test('party fallback → agent profile when only agentId present', () => {
  const t = resolveJournalEntryNavigation({ source: S.System, referenceType: R.Payment, agentId: 'ag-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.agent);
  assert.equal(t.id, 'ag-1');
  assert.equal(t.pathParam, true);
});

// ── buildSourceUrl ────────────────────────────────────────────────
// `customer` has no detail route yet (out of Phase 3 scope), so it's still a
// representative "non-migrated" route for these two tests.
test('buildSourceUrl appends openId query param for a non-migrated route', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.customer, 'c-1'),
    '/customers?openId=c-1'
  );
});

test('buildSourceUrl returns bare route when id is null', () => {
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.customer, null), '/customers');
});

// ── Phase 1: contract routes are now real /{id} detail routes ─────
test('mediation contract target carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({ source: S.Visa, referenceType: R.Contract, sourceId: 'm-1' });
  assert.equal(t.pathParam, true);
});

test('operating contract target carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({ source: S.Payment, referenceType: R.Contract, sourceId: 'op-1' });
  assert.equal(t.pathParam, true);
});

test('transfer contract target carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({ source: S.Transfer, referenceType: R.Contract, sourceId: 'tc-1' });
  assert.equal(t.pathParam, true);
});

test('buildSourceUrl(pathParam=true) appends the id as a path segment', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.mediationContract, 'm-1', true),
    '/contracts/mediationcontract/m-1'
  );
});

test('buildSourceUrl auto-detects a contract route without an explicit pathParam (generic-contract branch)', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.operatingContract, 'op-1'),
    '/contracts/operation/rent/op-1'
  );
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.transferContract, 'tc-1'),
    '/sponsorship-transfer/tc-1'
  );
});

test('buildSourceUrl keeps ?openId= for non-migrated routes even without an explicit pathParam', () => {
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.customer, 'c-1'), '/customers?openId=c-1');
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.payroll, 'p-1'), '/hr/payroll?openId=p-1');
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.journalEntry, 'je-1'), '/accounting/journal-entries?openId=je-1');
});

// ── Phase 2: the 4 accounting documents are now real /{id} detail routes ──
test('buildSourceUrl(JE_SOURCE_ROUTES.receiptVoucher) appends the id as a path segment', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.receiptVoucher, 'x'),
    '/accounting/receipt-vouchers/x'
  );
});

test('buildSourceUrl(JE_SOURCE_ROUTES.paymentVoucher) appends the id as a path segment', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.paymentVoucher, 'x'),
    '/accounting/payment-vouchers/x'
  );
});

test('buildSourceUrl(JE_SOURCE_ROUTES.creditNote) appends the id as a path segment', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.creditNote, 'x'),
    '/accounting/credit-notes/x'
  );
});

test('buildSourceUrl(JE_SOURCE_ROUTES.debitNote) appends the id as a path segment', () => {
  assert.equal(
    buildSourceUrl(JE_SOURCE_ROUTES.debitNote, 'x'),
    '/accounting/debit-notes/x'
  );
});

// ── Phase 3: the party/HR entities are now real /{id} detail routes ───────
test('buildSourceUrl(JE_SOURCE_ROUTES.agent) appends the id as a path segment', () => {
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.agent, 'x'), '/agents/x');
});

test('buildSourceUrl(JE_SOURCE_ROUTES.worker) appends the id as a path segment', () => {
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.worker, 'x'), '/applicants/x');
});

test('buildSourceUrl(JE_SOURCE_ROUTES.employee) appends the id as a path segment', () => {
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.employee, 'x'), '/hr/employees/x');
});

test('buildSourceUrl(JE_SOURCE_ROUTES.housing) appends the id as a path segment', () => {
  assert.equal(buildSourceUrl(JE_SOURCE_ROUTES.housing, 'x'), '/housing/management/x');
});

test('housing target (System + System) carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({ source: S.System, referenceType: R.System, sourceId: 'h-1' });
  assert.equal(t.pathParam, true);
});

test('Escape + Adjustment worker target carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Escape,
    referenceType: R.Adjustment,
    sourceId: 'esc-1',
    workerId: 'wk-1',
  });
  assert.equal(t.pathParam, true);
});

test('Ticket + System worker target carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({
    source: S.Ticket,
    referenceType: R.System,
    sourceId: 't-1',
    workerId: 'wk-9',
  });
  assert.equal(t.pathParam, true);
});

test('party fallback → worker profile carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({ source: S.System, referenceType: R.Payment, workerId: 'wk-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.worker);
  assert.equal(t.pathParam, true);
});

test('party fallback → employee profile carries pathParam: true', () => {
  const t = resolveJournalEntryNavigation({ source: S.System, referenceType: R.Payment, employeeId: 'e-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.employee);
  assert.equal(t.pathParam, true);
});

test('party fallback → customer profile stays without pathParam (customer not yet migrated)', () => {
  const t = resolveJournalEntryNavigation({ source: S.System, referenceType: R.Payment, customerId: 'c-1' });
  assert.equal(t.route, JE_SOURCE_ROUTES.customer);
  assert.equal(t.pathParam, undefined);
});
