'use client';

import { useEffect, useMemo } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Tooltip,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRestrictionTypes } from '@/hooks/api/useRestrictionTypes';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAgents } from '@/hooks/api/useAgents';
import { useWorkers } from '@/hooks/api/useWorkers';
import { useHREmployees } from '@/hooks/api/useHR';
import {
  useJournalEntryDetail,
  useJournalEntryMutations,
} from '@/hooks/api/useJournalEntries';
import { sumLines, type JournalEntryInput } from '@/types/journal-entry.types';
import { AccountSelect } from '@/components/filters';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import styles from '../JournalEntries.module.css';

interface EntryFormDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  entryId?: string | null;
  onClose: () => void;
}

interface LineField {
  accountId?: string;
  accountLabel?: string;
  debit?: number;
  credit?: number;
  description?: string;
}

interface FormValues {
  date: dayjs.Dayjs;
  restrictionTypeId?: string;
  customerId?: string;
  agentId?: string;
  workerId?: string;
  employeeId?: string;
  description: string;
  lines: LineField[];
}

const EMPTY_LINES: LineField[] = [
  { debit: 0, credit: 0 },
  { debit: 0, credit: 0 },
];

export function EntryFormDrawer({ open, mode, entryId, onClose }: EntryFormDrawerProps) {
  // language label helper (kept local; mirrors the platform t(ar,en) idiom)
  const t = (ar: string, en: string) => ar + ' / ' + en;

  const [form] = Form.useForm<FormValues>();
  const { restrictionTypes } = useRestrictionTypes();
  const { customers = [] } = useCustomers();
  const { data: agents = [] } = useAgents();
  const { data: workers = [] } = useWorkers();
  const { employees = [] } = useHREmployees({ PageSize: 200 });
  const { data: detail, isLoading: loadingDetail } = useJournalEntryDetail(
    mode === 'edit' && open ? entryId ?? null : null
  );
  const {
    createEntry,
    updateEntry,
    postEntry,
    isCreating,
    isUpdating,
    isPosting,
  } = useJournalEntryMutations();
  const accountingGates = useAccountingActionGates();
  const canSubmit = mode === 'create' ? accountingGates.canCreate : accountingGates.canUpdate;

  const busy = isCreating || isUpdating || isPosting;

  // Populate / reset the form whenever the drawer opens.
  useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      form.setFieldsValue({
        date: dayjs(),
        description: '',
        restrictionTypeId: undefined,
        customerId: undefined,
        agentId: undefined,
        workerId: undefined,
        employeeId: undefined,
        lines: EMPTY_LINES.map((l) => ({ ...l })),
      });
    } else if (detail) {
      form.setFieldsValue({
        date: detail.date ? dayjs(detail.date) : dayjs(),
        description: detail.description ?? '',
        restrictionTypeId: detail.restrictionTypeId ?? undefined,
        customerId: detail.customerId ?? undefined,
        agentId: detail.agentId ?? undefined,
        workerId: detail.workerId ?? undefined,
        employeeId: detail.employeeId ?? undefined,
        lines: detail.lines.map((l) => ({
          accountId: l.accountId,
          accountLabel: `${l.accountCode} — ${l.accountName}`,
          debit: l.debit,
          credit: l.credit,
          description: l.description ?? undefined,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, detail]);

  // Live balance — recomputed on every line change.
  const watchedLines = Form.useWatch('lines', form) as LineField[] | undefined;
  const balance = useMemo(
    () =>
      sumLines(
        (watchedLines ?? []).map((l) => ({
          debit: Number(l?.debit) || 0,
          credit: Number(l?.credit) || 0,
        }))
      ),
    [watchedLines]
  );

  const restrictionOptions = useMemo(
    () =>
      restrictionTypes.map((r) => ({
        value: r.id,
        label: r.nameAr || r.name || r.id,
      })),
    [restrictionTypes]
  );
  const customerOptions = useMemo(
    () =>
      (customers as any[]).map((c) => ({
        value: String(c.id),
        label: c.arabicName || c.englishName || String(c.id),
      })),
    [customers]
  );
  const agentOptions = useMemo(
    () =>
      (agents as any[]).map((a) => ({
        value: String(a.id),
        label: a.agentNameAr || a.agentNameEn || String(a.id),
      })),
    [agents]
  );
  const workerOptions = useMemo(
    () =>
      (workers as any[]).map((w) => ({
        value: String(w.id),
        label: w.fullNameAr || w.fullNameEn || w.passportNo || String(w.id),
      })),
    [workers]
  );
  const employeeOptions = useMemo(
    () =>
      (employees as any[]).map((e) => ({
        value: String(e.id),
        label: e.nameAr || e.nameEn || e.employeeName || String(e.id),
      })),
    [employees]
  );

  const buildInput = (values: FormValues): JournalEntryInput => ({
    date: values.date.toISOString(),
    description: values.description.trim(),
    customerId: values.customerId ?? null,
    agentId: values.agentId ?? null,
    workerId: values.workerId ?? null,
    employeeId: values.employeeId ?? null,
    restrictionTypeId: values.restrictionTypeId ?? null,
    lines: (values.lines ?? []).map((l) => ({
      accountId: l.accountId as string,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      description: l.description?.trim() || null,
    })),
  });

  /** Shared validation beyond antd field rules: ≥2 lines, each one-sided, balanced. */
  const validateBusinessRules = (values: FormValues): string | null => {
    const lines = values.lines ?? [];
    if (lines.length < 2) return t('يجب إدخال سطرين على الأقل', 'At least two lines are required');
    for (const [i, l] of lines.entries()) {
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;
      if (!l.accountId) return t(`السطر ${i + 1}: اختر حسابًا`, `Line ${i + 1}: select an account`);
      if (debit === 0 && credit === 0)
        return t(`السطر ${i + 1}: أدخل مبلغًا مدينًا أو دائنًا`, `Line ${i + 1}: enter a debit or credit amount`);
      if (debit > 0 && credit > 0)
        return t(`السطر ${i + 1}: لا يمكن أن يكون مدينًا ودائنًا معًا`, `Line ${i + 1}: cannot be both debit and credit`);
    }
    const b = sumLines(lines.map((l) => ({ debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })));
    if (!b.isBalanced)
      return t('القيد غير متوازن — يجب أن يتساوى المدين والدائن', 'Entry is unbalanced — debits must equal credits');
    return null;
  };

  const handleSave = async (postAfter: boolean) => {
    if (!canSubmit || (postAfter && !accountingGates.canPost)) return;
    const values = await form.validateFields();
    const ruleError = validateBusinessRules(values);
    if (ruleError) {
      void import('antd').then(({ message }) => message.error(ruleError));
      return;
    }
    const input = buildInput(values);

    try {
      let id = entryId ?? null;
      if (mode === 'create') {
        id = await createEntry(input);
      } else if (id) {
        await updateEntry({ id, data: input });
      }

      if (postAfter && id) {
        await postEntry(id);
      }
      onClose();
    } catch {
      // The mutation hooks already surface a bilingual error toast (server 500,
      // validation, etc). Swallow the re-thrown rejection here so it doesn't
      // bubble up as an unhandled promise rejection, and keep the drawer open so
      // the user can adjust and retry (or cancel) instead of losing their input.
    }
  };

  return (
    <Drawer
      open={open && canSubmit}
      onClose={onClose}
      width={620}
      destroyOnHidden
      title={
        <Space>
          <PlusOutlined />
          {mode === 'create'
            ? t('قيد يومية جديد', 'New Journal Entry')
            : t('تعديل القيد', 'Edit Journal Entry')}
        </Space>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onClose} disabled={busy}>
            {t('إلغاء', 'Cancel')}
          </Button>
          <Button
            type="default"
            icon={<SaveOutlined />}
            loading={isCreating || isUpdating}
            disabled={isPosting || !canSubmit}
            onClick={() => handleSave(false)}
          >
            {t('حفظ كمسودة', 'Save as Draft')}
          </Button>
          <Tooltip
            title={
              balance.isBalanced
                ? ''
                : t('يجب أن يكون القيد متوازنًا للاعتماد', 'Entry must be balanced to post')
            }
          >
            <Button
              type="primary"
              icon={<CheckCircleFilled />}
              loading={isPosting}
              disabled={!balance.isBalanced || busy || !canSubmit || !accountingGates.canPost}
              onClick={() => handleSave(true)}
            >
              {t('حفظ واعتماد', 'Save & Post')}
            </Button>
          </Tooltip>
        </div>
      }
    >
      {mode === 'edit' && loadingDetail ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Form.Item
              name="date"
              label={t('التاريخ', 'Date')}
              rules={[{ required: true, message: t('التاريخ مطلوب', 'Date is required') }]}
              style={{ flex: '1 1 200px' }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="restrictionTypeId"
              label={t('نوع القيد', 'Restriction Type')}
              style={{ flex: '1 1 240px' }}
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('اختر النوع (اختياري)', 'Select type (optional)')}
                options={restrictionOptions}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={t('الوصف', 'Description')}
            rules={[{ required: true, message: t('الوصف مطلوب', 'Description is required') }]}
          >
            <Input.TextArea
              rows={2}
              placeholder={t('وصف القيد...', 'Entry description...')}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <Form.Item name="customerId" label={t('العميل', 'Customer')}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('اختر العميل عند ارتباط القيد بعميل', 'Select customer when relevant')}
                options={customerOptions}
              />
            </Form.Item>
            <Form.Item name="agentId" label={t('الوكيل', 'Agent')}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('اختر الوكيل عند الحاجة', 'Select agent when relevant')}
                options={agentOptions}
              />
            </Form.Item>
            <Form.Item name="workerId" label={t('العاملة', 'Worker')}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('اختر العاملة عند الحاجة', 'Select worker when relevant')}
                options={workerOptions}
              />
            </Form.Item>
            <Form.Item name="employeeId" label={t('الموظف', 'Employee')}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('اختر الموظف عند الحاجة', 'Select employee when relevant')}
                options={employeeOptions}
              />
            </Form.Item>
          </div>

          {/* ── Lines editor ─────────────────────────────────────── */}
          <div className={styles.linesHeader}>
            <span className={styles.linesTitle}>{t('سطور القيد', 'Entry Lines')}</span>
          </div>

          <div className={styles.lineRowHead}>
            <span>{t('الحساب', 'Account')}</span>
            <span style={{ textAlign: 'center' }}>{t('مدين', 'Debit')}</span>
            <span style={{ textAlign: 'center' }}>{t('دائن', 'Credit')}</span>
            <span />
          </div>

          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => {
                  const label = form.getFieldValue(['lines', name, 'accountLabel']);
                  return (
                    <div className={styles.lineRow} key={key}>
                      <Form.Item
                        {...rest}
                        name={[name, 'accountId']}
                        rules={[{ required: true, message: t('مطلوب', 'Required') }]}
                        style={{ margin: 0 }}
                      >
                        <AccountSelect
                          placeholder={t('ابحث عن حساب...', 'Search account...')}
                          fallbackLabel={label}
                        />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'debit']} style={{ margin: 0 }}>
                        <InputNumber
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                          placeholder="0.00"
                          onChange={(v) => {
                            if (v && Number(v) > 0)
                              form.setFieldValue(['lines', name, 'credit'], 0);
                          }}
                        />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'credit']} style={{ margin: 0 }}>
                        <InputNumber
                          min={0}
                          step={0.01}
                          style={{ width: '100%' }}
                          placeholder="0.00"
                          onChange={(v) => {
                            if (v && Number(v) > 0)
                              form.setFieldValue(['lines', name, 'debit'], 0);
                          }}
                        />
                      </Form.Item>
                      <Tooltip title={t('حذف السطر', 'Remove line')}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={fields.length <= 2}
                          onClick={() => remove(name)}
                        />
                      </Tooltip>
                    </div>
                  );
                })}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ debit: 0, credit: 0 })}
                  style={{ marginBlockStart: 4 }}
                >
                  {t('إضافة سطر', 'Add Line')}
                </Button>
              </>
            )}
          </Form.List>

          {/* ── Live balance bar ─────────────────────────────────── */}
          <div
            className={`${styles.balanceBar} ${
              balance.isBalanced ? styles.balanced : styles.unbalanced
            }`}
          >
            <div className={styles.balanceStatus}>
              {balance.isBalanced ? <CheckCircleFilled /> : <CloseCircleFilled />}
              {balance.isBalanced
                ? t('القيد متوازن', 'Balanced')
                : t('غير متوازن', 'Unbalanced')}
            </div>
            <div className={styles.balanceTotals}>
              <span>
                {t('مدين', 'Debit')}: <b>{balance.totalDebit.toLocaleString()}</b>
              </span>
              <span>
                {t('دائن', 'Credit')}: <b>{balance.totalCredit.toLocaleString()}</b>
              </span>
              <span>
                {t('الفرق', 'Diff')}:{' '}
                <b className={balance.isBalanced ? undefined : styles.unbalancedAmount}>
                  {balance.difference.toLocaleString()}
                </b>
              </span>
            </div>
          </div>
        </Form>
      )}
    </Drawer>
  );
}
