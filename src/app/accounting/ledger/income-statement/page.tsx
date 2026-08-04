'use client';

import { useState } from 'react';
import { Card, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { LineChartOutlined } from '@ant-design/icons';
import { useIncomeStatement } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import { getAccountType } from '@/types/accounting.types';
import type { IncomeStatementLine } from '@/types/ledger.types';
import { LedgerHeader } from '../_components/LedgerHeader';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { fmtAmount, fmtBalance } from '../_components/ledgerFormat';
import styles from '../Ledger.module.css';

export default function IncomeStatementPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    dayjs().subtract(1, 'month').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);

  const { data, isLoading, isFetching, refetch } = useIncomeStatement({
    from: range[0],
    to: range[1],
    pageNumber,
    pageSize,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
  });

  const activeFilterCount = range[0] ? 1 : 0;
  const clearFilters = () => {
    setRange([
      dayjs().subtract(1, 'month').startOf('day').toISOString(),
      dayjs().endOf('day').toISOString(),
    ]);
    setPageNumber(1);
  };

  const columns: ColumnsType<IncomeStatementLine> = [
    {
      title: t('رقم الحساب', 'Code'),
      dataIndex: 'accountCode',
      key: 'accountCode',
      width: 130,
      render: (code: string) => {
        const type = getAccountType(code);
        return <span className={styles.code} style={type ? { color: type.color } : undefined}>{code}</span>;
      },
    },
    {
      title: t('اسم الحساب', 'Account Name'),
      dataIndex: 'accountName',
      key: 'accountName',
      render: (v, r) => (
        <span className={styles.accountName} style={{ paddingInlineStart: Math.max(0, (r.level - 1)) * 14 }}>
          {v}
        </span>
      ),
    },
    {
      title: t('المستوى', 'Level'),
      dataIndex: 'level',
      key: 'level',
      width: 80,
      align: 'center',
      render: (v) => <span className={styles.muted}>{v}</span>,
    },
    {
      title: t('رصيد افتتاحي', 'Opening'),
      dataIndex: 'openingBalance',
      key: 'openingBalance',
      width: 130,
      align: 'right',
      render: (v) => {
        const b = fmtBalance(v);
        return <span className={`${styles.amount} ${b.negative ? styles.negative : ''}`}>{b.text}</span>;
      },
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
      title: t('رصيد ختامي', 'Closing'),
      dataIndex: 'closingBalance',
      key: 'closingBalance',
      width: 140,
      align: 'right',
      render: (v) => {
        const b = fmtBalance(v);
        return <span className={`${styles.amount} ${b.negative ? styles.negative : ''}`}>{b.text}</span>;
      },
    },
  ];

  return (
    <div className={styles.page}>
      <LedgerHeader
        icon={<LineChartOutlined />}
        title={t('قائمة الدخل', 'Income Statement')}
        subtitle={t(
          'حسابات الإيرادات والمصروفات التشغيلية والإدارية خلال الفترة',
          'Revenue, operating and administrative expense accounts for the period'
        )}
        isFetching={isFetching}
        onRefresh={() => refetch()}
        refreshLabel={t('تحديث', 'Refresh')}
      />

      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        quickFilters={
          <>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>{t('الفترة', 'Period')}</label>
              <DateRangeFilter
                value={range}
                onChange={(v) => {
                  setRange(v);
                  setPageNumber(1);
                }}
                placeholder={[t('من', 'From'), t('إلى', 'To')]}
              />
            </div>
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setPageNumber(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
      />

      <Card className={styles.tableCard}>
        <Table<IncomeStatementLine>
          rowKey="accountId"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading || isFetching}
          size="middle"
          bordered
          scroll={{ x: 950 }}
          pagination={{
            current: pageNumber,
            pageSize,
            total: data?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
            onChange: (page, size) => {
              setPageNumber(page);
              setPageSize(size);
            },
          }}
        />
      </Card>
    </div>
  );
}
