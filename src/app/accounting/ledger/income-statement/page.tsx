'use client';

import { useState } from 'react';
import { Card, Table, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { LineChartOutlined } from '@ant-design/icons';
import { useIncomeStatement } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import { getAccountType } from '@/types/accounting.types';
import type { IncomeStatementLine } from '@/types/ledger.types';
import { LedgerHeader } from '../_components/LedgerHeader';
import { fmtAmount, fmtBalance } from '../_components/ledgerFormat';
import styles from '../Ledger.module.css';

const { RangePicker } = DatePicker;

export default function IncomeStatementPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().subtract(1, 'month'), dayjs()]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isFetching, refetch } = useIncomeStatement({
    from: range?.[0]?.startOf('day').toISOString(),
    to: range?.[1]?.endOf('day').toISOString(),
    pageNumber,
    pageSize,
  });

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

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <RangePicker
            value={range as any}
            onChange={(v) => {
              setRange(v as any);
              setPageNumber(1);
            }}
            placeholder={[t('من', 'From'), t('إلى', 'To')]}
          />
        </div>

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
