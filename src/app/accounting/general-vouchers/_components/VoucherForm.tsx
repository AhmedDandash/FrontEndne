'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Divider,
  Alert,
} from 'antd';
import type { FormInstance } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import AccountPicker from './AccountPicker';
import AttachmentUploader from './AttachmentUploader';
import VoucherJournalLines, { makeEmptyLine, type JournalLineRow } from './VoucherJournalLines';
import { BeneficiaryPicker, ContractPicker, WorkerPicker } from './VoucherEntityPickers';
import {
  BENEFICIARY_TYPE_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  VOUCHER_PAYMENT_METHOD_OPTIONS,
  formatMoney,
  getVoucherTypeShape,
  t as tr,
  voucherTypeLabel,
} from '../_lib/generalVoucherDisplay';
import type { CreateGeneralVoucherDto, GeneralVoucherDto } from '@/types/general-voucher.types';

export interface VoucherFormProps {
  form: FormInstance;
  voucherType: number;
  isAr: boolean;
  disabled?: boolean;
  /** Present in edit mode — prefills the form. */
  initialValue?: GeneralVoucherDto;
  /** Lifted so the submitting page can upload the file after save. */
  attachment: UploadFile[];
  onAttachmentChange: (files: UploadFile[]) => void;
}

/**
 * Create/edit form for all six voucher types.
 *
 * One form rather than six: the types share the same header (number, date,
 * payment method, amount, VAT, total, notes) and differ only in which extra
 * blocks they show. `getVoucherTypeShape` is the single source of truth for
 * that, so the fields rendered here and the DTO built by `buildVoucherDto`
 * below can never drift apart.
 */
export default function VoucherForm({
  form,
  voucherType,
  isAr,
  disabled,
  initialValue,
  attachment,
  onAttachmentChange,
}: VoucherFormProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);
  const shape = useMemo(() => getVoucherTypeShape(voucherType), [voucherType]);

  const [lines, setLines] = useState<JournalLineRow[]>(() =>
    // A journal needs at least one debit and one credit row.
    [makeEmptyLine(), makeEmptyLine()]
  );

  // Watched so the read-only computed fields below recalculate live.
  const amount = Form.useWatch('amount', form) ?? 0;
  const vatAmount = Form.useWatch('vatAmount', form) ?? 0;
  const beneficiaryType = Form.useWatch('beneficiaryType', form);
  const contractType = Form.useWatch('contractType', form);
  const foreignCurrencyAmount = Form.useWatch('foreignCurrencyAmount', form) ?? 0;
  const exchangeRate = Form.useWatch('exchangeRate', form) ?? 0;

  const totalAmount = Number(amount || 0) + Number(vatAmount || 0);
  const amountInSar = Number(foreignCurrencyAmount || 0) * Number(exchangeRate || 0);

  // Prefill in edit mode.
  useEffect(() => {
    if (!initialValue) return;
    form.setFieldsValue({
      voucherNumber: initialValue.voucherNumber ?? undefined,
      voucherDate: initialValue.voucherDate ? dayjs(initialValue.voucherDate) : undefined,
      paymentMethod: initialValue.paymentMethod ?? undefined,
      amount: initialValue.amount,
      vatAmount: initialValue.vatAmount ?? undefined,
      notes: initialValue.notes ?? undefined,
      beneficiaryId: initialValue.beneficiaryId ?? undefined,
      beneficiaryType: initialValue.beneficiaryType ?? undefined,
      beneficiaryName: initialValue.beneficiaryName ?? undefined,
      debitAccountId: initialValue.debitAccountId ?? undefined,
      creditAccountId: initialValue.creditAccountId ?? undefined,
      fromAccountId: initialValue.fromAccountId ?? undefined,
      toAccountId: initialValue.toAccountId ?? undefined,
      contractId: initialValue.contractId ?? undefined,
      contractType: initialValue.contractType ?? undefined,
      operationType: initialValue.operationType ?? undefined,
      workerId: initialValue.workerId ?? undefined,
      foreignCurrency: initialValue.foreignCurrency ?? undefined,
      foreignCurrencyAmount: initialValue.foreignCurrencyAmount ?? undefined,
      exchangeRate: initialValue.exchangeRate ?? undefined,
      amountDeducted: initialValue.amountDeducted ?? undefined,
      exchangeDifference: initialValue.exchangeDifference ?? undefined,
    });

    if (initialValue.lines?.length) {
      setLines(
        initialValue.lines.map((line, idx) => ({
          key: `existing-${line.id ?? idx}`,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          notes: line.notes ?? '',
        }))
      );
    }
  }, [initialValue, form]);

  // The grid lives in local state (antd Form can't cleanly own a dynamic
  // sub-table), so mirror it into the form for validation on submit.
  useEffect(() => {
    form.setFieldValue('lines', lines);
  }, [lines, form]);

  const required = (message: string) => [{ required: true, message }];

  return (
    <Form form={form} layout="vertical" disabled={disabled} initialValues={{ voucherDate: dayjs() }}>
      {/* ── Shared fields ─────────────────────────────────────────── */}
      <Card
        size="small"
        title={t(
          `بيانات ${voucherTypeLabel(voucherType, true)}`,
          `${voucherTypeLabel(voucherType, false)} Details`
        )}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="voucherNumber"
              label={t('رقم السند', 'Voucher Number')}
              tooltip={t(
                'يُولَّد تلقائيًا إذا تُرك فارغًا',
                'Generated automatically if left blank'
              )}
            >
              <Input placeholder={t('اختياري', 'Optional')} size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="voucherDate"
              label={t('التاريخ', 'Date')}
              rules={required(t('التاريخ مطلوب', 'Date is required'))}
            >
              <DatePicker size="large" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="paymentMethod" label={t('طريقة الدفع', 'Payment Method')}>
              <Select
                size="large"
                allowClear
                placeholder={t('اختر طريقة الدفع', 'Select payment method')}
                options={VOUCHER_PAYMENT_METHOD_OPTIONS(isAr)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="amount"
              label={t('المبلغ', 'Amount')}
              rules={[
                { required: true, message: t('المبلغ مطلوب', 'Amount is required') },
                {
                  type: 'number',
                  min: 0.01,
                  message: t('يجب أن يكون المبلغ أكبر من صفر', 'Amount must be greater than zero'),
                },
              ]}
            >
              <InputNumber size="large" min={0.01} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="vatAmount" label={t('ضريبة القيمة المضافة', 'VAT Amount')}>
              <InputNumber size="large" min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            {/* Derived (Amount + VAT) — shown read-only so the number the user
                sees is exactly what the payload carries. */}
            <Form.Item label={t('الإجمالي', 'Total Amount')}>
              <InputNumber
                size="large"
                readOnly
                value={totalAmount}
                precision={2}
                style={{ width: '100%', background: '#fafafa', fontWeight: 600 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* ── Beneficiary ───────────────────────────────────────────── */}
      {shape.beneficiary && (
        <Card size="small" title={t('المستفيد', 'Beneficiary')} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="beneficiaryType"
                label={t('نوع المستفيد', 'Beneficiary Type')}
                rules={required(t('نوع المستفيد مطلوب', 'Beneficiary type is required'))}
              >
                <Select
                  size="large"
                  placeholder={t('اختر النوع', 'Select type')}
                  options={BENEFICIARY_TYPE_OPTIONS(isAr)}
                  // Switching type invalidates the selected entity.
                  onChange={() =>
                    form.setFieldsValue({ beneficiaryId: undefined, beneficiaryName: undefined })
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                name="beneficiaryId"
                label={t('المستفيد', 'Beneficiary')}
                rules={required(t('المستفيد مطلوب', 'Beneficiary is required'))}
              >
                <BeneficiaryPicker
                  isAr={isAr}
                  beneficiaryType={beneficiaryType}
                  onChange={(id, name) =>
                    form.setFieldsValue({ beneficiaryId: id, beneficiaryName: name })
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          {/* Captured from the picker; kept out of sight but inside the form. */}
          <Form.Item name="beneficiaryName" hidden>
            <Input />
          </Form.Item>
        </Card>
      )}

      {/* ── Worker ────────────────────────────────────────────────── */}
      {shape.worker && (
        <Card size="small" title={t('العامل', 'Worker')} style={{ marginBottom: 16 }}>
          <Form.Item
            name="workerId"
            label={t('العامل', 'Worker')}
            rules={required(t('العامل مطلوب', 'Worker is required'))}
          >
            <WorkerPicker isAr={isAr} />
          </Form.Item>
        </Card>
      )}

      {/* ── Contract ──────────────────────────────────────────────── */}
      {shape.contract && (
        <Card size="small" title={t('العقد', 'Contract')} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="contractType"
                label={t('نوع العقد', 'Contract Type')}
                rules={required(t('نوع العقد مطلوب', 'Contract type is required'))}
              >
                <Select
                  size="large"
                  placeholder={t('اختر نوع العقد', 'Select contract type')}
                  options={CONTRACT_TYPE_OPTIONS(isAr)}
                  onChange={() => form.setFieldsValue({ contractId: undefined })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={shape.operationType ? 8 : 16}>
              <Form.Item name="contractId" label={t('العقد', 'Contract')}>
                <ContractPicker isAr={isAr} contractType={contractType} />
              </Form.Item>
            </Col>
            {shape.operationType && (
              <Col xs={24} md={8}>
                <Form.Item name="operationType" label={t('نوع العملية', 'Operation Type')}>
                  <Input size="large" placeholder={t('اختياري', 'Optional')} />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* ── Accounts ──────────────────────────────────────────────── */}
      {(shape.debitCreditAccounts || shape.fromToAccounts) && (
        <Card size="small" title={t('الحسابات', 'Accounts')} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {shape.debitCreditAccounts && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="debitAccountId"
                    label={t('الحساب المدين', 'Debit Account')}
                    rules={required(t('الحساب المدين مطلوب', 'Debit account is required'))}
                  >
                    <AccountPicker placeholder={t('اختر الحساب', 'Select account')} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="creditAccountId"
                    label={t('الحساب الدائن', 'Credit Account')}
                    rules={required(t('الحساب الدائن مطلوب', 'Credit account is required'))}
                  >
                    <AccountPicker placeholder={t('اختر الحساب', 'Select account')} />
                  </Form.Item>
                </Col>
              </>
            )}
            {shape.fromToAccounts && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fromAccountId"
                    label={t('من حساب', 'From Account')}
                    rules={required(t('الحساب المحوَّل منه مطلوب', 'From account is required'))}
                  >
                    <AccountPicker placeholder={t('اختر الحساب', 'Select account')} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="toAccountId"
                    label={t('إلى حساب', 'To Account')}
                    rules={required(t('الحساب المحوَّل إليه مطلوب', 'To account is required'))}
                  >
                    <AccountPicker placeholder={t('اختر الحساب', 'Select account')} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Card>
      )}

      {/* ── Foreign currency ──────────────────────────────────────── */}
      {shape.foreignCurrency && (
        <Card size="small" title={t('العملة الأجنبية', 'Foreign Currency')} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="foreignCurrency"
                label={t('العملة', 'Currency')}
                rules={required(t('العملة مطلوبة', 'Currency is required'))}
              >
                <Input size="large" placeholder="USD" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="foreignCurrencyAmount"
                label={t('المبلغ بالعملة', 'Foreign Amount')}
                rules={required(t('المبلغ بالعملة مطلوب', 'Foreign amount is required'))}
              >
                <InputNumber size="large" min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="exchangeRate"
                label={t('سعر الصرف', 'Exchange Rate')}
                rules={required(t('سعر الصرف مطلوب', 'Exchange rate is required'))}
              >
                <InputNumber size="large" min={0} precision={4} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              {/* Derived: foreign amount × rate. */}
              <Form.Item label={t('المبلغ بالريال', 'Amount in SAR')}>
                <InputNumber
                  size="large"
                  readOnly
                  value={amountInSar}
                  precision={2}
                  style={{ width: '100%', background: '#fafafa', fontWeight: 600 }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="amountDeducted" label={t('المبلغ المخصوم', 'Amount Deducted')}>
                <InputNumber size="large" min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="exchangeDifference" label={t('فرق العملة', 'Exchange Difference')}>
                <InputNumber size="large" precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )}

      {/* ── Multi-line journal grid ───────────────────────────────── */}
      {shape.lines && (
        <Card size="small" title={t('سطور القيد', 'Journal Lines')} style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            title={t(
              'يجب أن يتساوى إجمالي المدين مع إجمالي الدائن قبل الحفظ.',
              'Total debit must equal total credit before saving.'
            )}
          />
          <VoucherJournalLines value={lines} onChange={setLines} isAr={isAr} disabled={disabled} />
          <Form.Item name="lines" hidden>
            <Input />
          </Form.Item>
        </Card>
      )}

      {/* ── Notes + attachment ────────────────────────────────────── */}
      <Card size="small" title={t('ملاحظات ومرفقات', 'Notes & Attachment')}>
        <Form.Item name="notes" label={t('ملاحظات', 'Notes')}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Divider style={{ margin: '12px 0' }} />
        <Form.Item label={t('مرفق', 'Attachment')}>
          <AttachmentUploader
            isAr={isAr}
            disabled={disabled}
            value={attachment}
            onChange={onAttachmentChange}
          />
        </Form.Item>
        <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
          {t('الإجمالي المحسوب', 'Computed total')}: <strong>{formatMoney(totalAmount)}</strong>
        </div>
      </Card>
    </Form>
  );
}

/**
 * Build the API payload from raw form values.
 *
 * Only the fields the voucher type actually uses are emitted — sending a
 * stale `workerId` left over from a previous type would be accepted by the
 * schema but produce a wrong voucher. Derived amounts are computed here (not
 * read from the form) so they can't be tampered with via the read-only inputs.
 */
export function buildVoucherDto(
  values: any,
  voucherType: number,
  lines: JournalLineRow[]
): CreateGeneralVoucherDto {
  const shape = getVoucherTypeShape(voucherType);
  const amount = Number(values.amount) || 0;
  const vatAmount = Number(values.vatAmount) || 0;

  const dto: CreateGeneralVoucherDto = {
    voucherNumber: values.voucherNumber?.trim() || undefined,
    voucherDate: values.voucherDate?.toISOString?.() ?? values.voucherDate,
    voucherType,
    paymentMethod: values.paymentMethod ?? undefined,
    amount,
    vatAmount: vatAmount || undefined,
    totalAmount: amount + vatAmount,
    notes: values.notes?.trim() || undefined,
  };

  if (shape.beneficiary) {
    dto.beneficiaryId = values.beneficiaryId || undefined;
    dto.beneficiaryType = values.beneficiaryType || undefined;
    dto.beneficiaryName = values.beneficiaryName || undefined;
  }
  if (shape.debitCreditAccounts) {
    dto.debitAccountId = values.debitAccountId || undefined;
    dto.creditAccountId = values.creditAccountId || undefined;
  }
  if (shape.fromToAccounts) {
    dto.fromAccountId = values.fromAccountId || undefined;
    dto.toAccountId = values.toAccountId || undefined;
  }
  if (shape.contract) {
    dto.contractId = values.contractId || undefined;
    dto.contractType = values.contractType || undefined;
  }
  if (shape.operationType) {
    dto.operationType = values.operationType?.trim() || undefined;
  }
  if (shape.worker) {
    dto.workerId = values.workerId || undefined;
  }
  if (shape.foreignCurrency) {
    const fcAmount = Number(values.foreignCurrencyAmount) || 0;
    const rate = Number(values.exchangeRate) || 0;
    dto.foreignCurrency = values.foreignCurrency?.trim() || undefined;
    dto.foreignCurrencyAmount = fcAmount || undefined;
    dto.exchangeRate = rate || undefined;
    dto.amountInSar = fcAmount * rate;
    dto.amountDeducted = Number(values.amountDeducted) || undefined;
    dto.exchangeDifference = Number(values.exchangeDifference) || undefined;
  }
  if (shape.lines) {
    dto.lines = lines
      // Drop untouched rows so a blank spare line doesn't fail validation.
      .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0))
      .map((line) => ({
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        notes: line.notes?.trim() || undefined,
      }));
  }

  return dto;
}
