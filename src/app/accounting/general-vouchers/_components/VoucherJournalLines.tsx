'use client';

import { useMemo } from 'react';
import { Button, Input, InputNumber, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import AccountPicker from './AccountPicker';
import BalanceIndicator from './BalanceIndicator';
import { t as tr } from '../_lib/generalVoucherDisplay';
import type { GeneralVoucherLineInputDto } from '@/types/general-voucher.types';

/** A grid row — same shape as the DTO plus a stable key for React/antd. */
export interface JournalLineRow extends GeneralVoucherLineInputDto {
  key: string;
}

export interface VoucherJournalLinesProps {
  value: JournalLineRow[];
  onChange: (rows: JournalLineRow[]) => void;
  isAr: boolean;
  disabled?: boolean;
}

export function makeEmptyLine(): JournalLineRow {
  return {
    // crypto.randomUUID isn't available in every target browser here, and the
    // key only needs to be unique within this grid.
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    accountId: '',
    debit: 0,
    credit: 0,
    notes: '',
  };
}

/**
 * Dynamic debit/credit row grid for the Multiple Payment voucher.
 *
 * Entering a value on one side zeroes the other: a single journal line is
 * either a debit or a credit, never both, and letting both be non-zero is the
 * most common way to produce an entry that looks balanced in total but is
 * meaningless per-line.
 */
export default function VoucherJournalLines({
  value,
  onChange,
  isAr,
  disabled,
}: VoucherJournalLinesProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  const totals = useMemo(
    () => ({
      debit: value.reduce((sum, row) => sum + (Number(row.debit) || 0), 0),
      credit: value.reduce((sum, row) => sum + (Number(row.credit) || 0), 0),
    }),
    [value]
  );

  const updateRow = (key: string, patch: Partial<JournalLineRow>) => {
    onChange(value.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = () => onChange([...value, makeEmptyLine()]);

  const removeRow = (key: string) => {
    const next = value.filter((row) => row.key !== key);
    // A journal needs at least one debit and one credit row to ever balance,
    // so never leave the grid with fewer than two.
    onChange(next.length >= 2 ? next : [...next, makeEmptyLine()]);
  };

  const columns: ColumnsType<JournalLineRow> = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: t('الحساب', 'Account'),
      key: 'accountId',
      render: (_, record) => (
        <AccountPicker
          size="middle"
          disabled={disabled}
          allowClear={false}
          placeholder={t('اختر الحساب', 'Select account')}
          value={record.accountId || undefined}
          onChange={(accountId) => updateRow(record.key, { accountId: accountId ?? '' })}
        />
      ),
    },
    {
      title: t('مدين', 'Debit'),
      key: 'debit',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          disabled={disabled}
          value={record.debit || undefined}
          // Debit and credit are mutually exclusive on a line.
          onChange={(debit) => updateRow(record.key, { debit: debit ?? 0, credit: 0 })}
        />
      ),
    },
    {
      title: t('دائن', 'Credit'),
      key: 'credit',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          disabled={disabled}
          value={record.credit || undefined}
          onChange={(credit) => updateRow(record.key, { credit: credit ?? 0, debit: 0 })}
        />
      ),
    },
    {
      title: t('ملاحظات', 'Notes'),
      key: 'notes',
      width: 200,
      render: (_, record) => (
        <Input
          disabled={disabled}
          value={record.notes ?? ''}
          onChange={(e) => updateRow(record.key, { notes: e.target.value })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, record) => (
        <Tooltip title={t('حذف السطر', 'Remove line')}>
          <Button
            type="text"
            danger
            size="small"
            disabled={disabled || value.length <= 2}
            icon={<DeleteOutlined />}
            onClick={() => removeRow(record.key)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <Table<JournalLineRow>
        rowKey="key"
        size="small"
        bordered
        pagination={false}
        columns={columns}
        dataSource={value}
        scroll={{ x: 760 }}
      />
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={addRow}
        disabled={disabled}
        style={{ marginTop: 12 }}
      >
        {t('إضافة سطر', 'Add Line')}
      </Button>
      <div style={{ marginTop: 12 }}>
        <BalanceIndicator totalDebit={totals.debit} totalCredit={totals.credit} isAr={isAr} />
      </div>
    </div>
  );
}
