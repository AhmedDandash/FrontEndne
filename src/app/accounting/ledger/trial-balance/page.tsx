'use client';

import { useState } from 'react';
import { Card, Table, DatePicker, Switch, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { TableOutlined } from '@ant-design/icons';
import { useTrialBalance } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import { getAccountType } from '@/types/accounting.types';
import type { TrialBalanceLine } from '@/types/ledger.types';
import { LedgerHeader } from '../_components/LedgerHeader';
import { fmtAmount, fmtBalance } from '../_components/ledgerFormat';
import styles from '../Ledger.module.css';

const { RangePicker } = DatePicker;

export default function TrialBalancePage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [groupedOnly, setGroupedOnly] = useState(false);

  const { data, isLoading, isFetching, refetch } = useTrialBalance({
    from: range?.[0]?.startOf('day').toISOString(),
    to: range?.[1]?.endOf('day').toISOString(),
    groupedOnly,
  });

  const balanced =
    !!data && Math.round((data.totalDebit - data.totalCredit) * 100) === 0;

  const columns: ColumnsType<TrialBalanceLine> = [
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
      render: (v) => <span className={styles.accountName}>{v}</span>,
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
      width: 130,
      align: 'right',
      render: (v) => <span className={styles.amount}>{fmtAmount(v, true)}</span>,
    },
    {
      title: t('دائن', 'Credit'),
      dataIndex: 'credit',
      key: 'credit',
      width: 130,
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
        icon={<TableOutlined />}
        title={t('ميزان المراجعة', 'Trial Balance')}
        subtitle={t(
          'أرصدة جميع الحسابات الطرفية مع حركة الفترة',
          'Opening, period movement and closing balances for all leaf accounts'
        )}
        isFetching={isFetching}
        onRefresh={() => refetch()}
        refreshLabel={t('تحديث', 'Refresh')}
      />

      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.debit}`}>
          <div className={styles.metricLabel}>{t('إجمالي المدين', 'Total Debit')}</div>
          <div className={styles.metricValue}>{fmtAmount(data?.totalDebit)}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.credit}`}>
          <div className={styles.metricLabel}>{t('إجمالي الدائن', 'Total Credit')}</div>
          <div className={styles.metricValue}>{fmtAmount(data?.totalCredit)}</div>
        </div>
        <div className={`${styles.metricCard} ${balanced ? styles.balance : styles.warn}`}>
          <div className={styles.metricLabel}>{t('الحالة', 'Status')}</div>
          <div className={styles.metricValue} style={{ fontSize: 18 }}>
            {balanced ? t('متوازن', 'Balanced') : t('غير متوازن', 'Unbalanced')}
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <RangePicker
            value={range as any}
            onChange={(v) => setRange(v as any)}
            placeholder={[t('من', 'From'), t('إلى', 'To')]}
          />
          <Space>
            <Switch checked={groupedOnly} onChange={setGroupedOnly} />
            <span>{t('الحسابات المجمعة فقط', 'Grouped accounts only')}</span>
          </Space>
        </div>

        <Table<TrialBalanceLine>
          rowKey="accountId"
          columns={columns}
          dataSource={data?.lines ?? []}
          loading={isLoading || isFetching}
          size="middle"
          bordered
          scroll={{ x: 900 }}
          pagination={{ pageSize: 25, showSizeChanger: true, showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`) }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3} align="center">
                  <strong>{t('الإجمالي', 'Total')}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <strong className={styles.amount}>{fmtAmount(data?.totalDebit)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <strong className={styles.amount}>{fmtAmount(data?.totalCredit)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right" />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}
