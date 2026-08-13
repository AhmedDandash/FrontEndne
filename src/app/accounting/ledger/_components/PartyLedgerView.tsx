'use client';

import { useState, type ReactNode } from 'react';
import { Card, Table, Select, Empty, Spin, Alert, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { usePartyLedger, usePartyOptions } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import type { PartyKind, PartyLedgerLine } from '@/types/ledger.types';
import { LedgerHeader } from './LedgerHeader';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { fmtAmount, fmtDate } from './ledgerFormat';
import { linkProps } from '@/lib/navigation/linkProps';
import styles from '../Ledger.module.css';

interface PartyLedgerViewProps {
  kind: PartyKind;
  icon: ReactNode;
  title: string;
  subtitle: string;
  idLabel: string;
}

/** Shared report used by the Agent, Customer and Worker ledger pages. */
export function PartyLedgerView({ kind, icon, title, subtitle, idLabel }: PartyLedgerViewProps) {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    dayjs().subtract(1, 'month').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);

  const { data: partyOptions = [], isLoading: optionsLoading } = usePartyOptions(kind);
  const selectedPartyLabel =
    partyOptions.find((option) => String(option.value) === String(selectedId))?.label ?? '';

  const { data, isLoading, isFetching, refetch, error } = usePartyLedger(kind, selectedId, {
    from: range[0],
    to: range[1],
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
  });

  const activeFilterCount = [selectedId, range[0]].filter(Boolean).length;
  const clearFilters = () => {
    setSelectedId(undefined);
    setRange([
      dayjs().subtract(1, 'month').startOf('day').toISOString(),
      dayjs().endOf('day').toISOString(),
    ]);
  };

  const columns: ColumnsType<PartyLedgerLine> = [
    { title: t('التاريخ', 'Date'), dataIndex: 'date', key: 'date', width: 105, render: fmtDate },
    {
      title: t('رقم القيد', 'Entry No.'),
      dataIndex: 'entryNumber',
      key: 'entryNumber',
      width: 115,
      render: (v, row) => {
        if (!v) return <span className={styles.entryNumber}>—</span>;
        const href = row.journalEntryId
          ? `/accounting/journal-entries?openId=${encodeURIComponent(row.journalEntryId)}`
          : `/accounting/journal-entries?entryNumber=${encodeURIComponent(v)}`;
        return (
          <a className={styles.entryNumber} {...linkProps(href, router)}>
            {v}
          </a>
        );
      },
    },
    ...(kind === 'customer'
      ? [
          {
            title: t('العميل', 'Customer'),
            key: 'customerName',
            width: 180,
            render: (_: unknown, row: PartyLedgerLine) =>
              row.customerName || selectedPartyLabel || row.customerId || '—',
          },
        ]
      : []),
    {
      title: t('رقم العقد', 'Contract No.'),
      key: 'contractNumber',
      width: 110,
      render: (_, l) =>
        l.contractNumber ? <Tag color="geekblue">#{l.contractNumber}</Tag> : <span className={styles.muted}>—</span>,
    },
    {
      title: t('الحساب', 'Account'),
      key: 'account',
      width: 200,
      render: (_, l) => (
        <div>
          <span className={styles.code}>{l.accountCode}</span>
          <span className={styles.accountSub}>{l.accountName}</span>
        </div>
      ),
    },
    {
      title: t('الوصف', 'Description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: t('مدين', 'Debit'),
      dataIndex: 'debit',
      key: 'debit',
      width: 120,
      align: 'right',
      render: (v) => <span className={styles.amount}>{fmtAmount(v, true)}</span>,
    },
    {
      title: t('دائن', 'Credit'),
      dataIndex: 'credit',
      key: 'credit',
      width: 120,
      align: 'right',
      render: (v) => <span className={styles.amount}>{fmtAmount(v, true)}</span>,
    },
    {
      title: t('المصدر', 'Source'),
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (v: string) =>
        v ? <Tag color={v === 'System' ? 'blue' : 'gold'}>{v}</Tag> : <span className={styles.muted}>—</span>,
    },
  ];

  return (
    <div className={styles.page}>
      <LedgerHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        isFetching={isFetching}
        onRefresh={selectedId ? () => refetch() : undefined}
        refreshLabel={t('تحديث', 'Refresh')}
      />

      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        quickFilters={
          <>
            <Select
              showSearch
              allowClear
              size="large"
              loading={optionsLoading}
              style={{ flex: '1 1 320px', maxWidth: 460 }}
              placeholder={idLabel}
              value={selectedId}
              onChange={(v) => setSelectedId(v)}
              optionFilterProp="label"
              options={partyOptions}
              notFoundContent={optionsLoading ? <Spin size="small" /> : undefined}
            />
            <DateRangeFilter
              value={range}
              onChange={setRange}
              placeholder={[t('من', 'From'), t('إلى', 'To')]}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={setBranchId}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
      />

      <Card className={styles.tableCard}>
        {!selectedId ? (
          <div className={styles.promptState}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={idLabel} />
          </div>
        ) : isLoading ? (
          <div className={styles.promptState}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            type="info"
            showIcon
            message={t('لا توجد حركات', 'No movements found')}
            description={t(
              'لا توجد قيود معمدة لهذا المعرّف في الفترة المحددة.',
              'No posted entries were found for this ID in the selected period.'
            )}
          />
        ) : (
          <>
            <div className={styles.metrics}>
              <div className={`${styles.metricCard} ${styles.debit}`}>
                <div className={styles.metricLabel}>{t('إجمالي المدين', 'Total Debit')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.totalDebit)}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.credit}`}>
                <div className={styles.metricLabel}>{t('إجمالي الدائن', 'Total Credit')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.totalCredit)}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.balance}`}>
                <div className={styles.metricLabel}>{t('صافي الرصيد', 'Net Balance')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.balance)}</div>
              </div>
            </div>

            <Table<PartyLedgerLine>
              rowKey={(_, idx) => String(idx)}
              columns={columns}
              dataSource={data?.lines ?? []}
              loading={isFetching}
              size="middle"
              bordered
              scroll={{ x: 950 }}
              locale={{ emptyText: t('لا توجد حركات', 'No movements') }}
              pagination={{ pageSize: 20, showSizeChanger: true }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
