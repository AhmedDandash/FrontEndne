'use client';

import { useState } from 'react';
import { Card, Table, Empty, Spin, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ProfileOutlined } from '@ant-design/icons';
import { useGeneralLedger } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import type { GeneralLedgerLine } from '@/types/ledger.types';
import { AccountSelect, AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { LedgerHeader } from '../_components/LedgerHeader';
import { fmtAmount, fmtBalance, fmtDate } from '../_components/ledgerFormat';
import styles from '../Ledger.module.css';

export default function GeneralLedgerPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [accountId, setAccountId] = useState<string | undefined>();
  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    dayjs().subtract(1, 'month').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);

  const { data, isLoading, isFetching, refetch, error } = useGeneralLedger({
    accountId,
    from: range[0],
    to: range[1],
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
  });

  const activeFilterCount = [accountId, range[0]].filter(Boolean).length;
  const clearFilters = () => {
    setAccountId(undefined);
    setRange([
      dayjs().subtract(1, 'month').startOf('day').toISOString(),
      dayjs().endOf('day').toISOString(),
    ]);
  };

  const columns: ColumnsType<GeneralLedgerLine> = [
    { title: t('التاريخ', 'Date'), dataIndex: 'date', key: 'date', width: 110, render: fmtDate },
    {
      title: t('رقم القيد', 'Entry No.'),
      dataIndex: 'entryNumber',
      key: 'entryNumber',
      width: 120,
      render: (v) => <span className={styles.entryNumber}>{v || '—'}</span>,
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
      title: t('الرصيد', 'Balance'),
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
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
        icon={<ProfileOutlined />}
        title={t('دفتر الأستاذ العام', 'General Ledger')}
        subtitle={t(
          'حركات حساب محدد خلال فترة مع الرصيد الافتتاحي والختامي',
          'Movements for a specific account over a period, with opening and closing balance'
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
            <div style={{ flex: '1 1 320px', maxWidth: 460 }}>
              <AccountSelect
                value={accountId}
                onChange={setAccountId}
                placeholder={t('اختر حسابًا لعرض حركاته...', 'Select an account to view movements...')}
              />
            </div>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
              <DateRangeFilter
                value={range}
                onChange={setRange}
                placeholder={[t('من', 'From'), t('إلى', 'To')]}
              />
            </div>
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
        {!accountId ? (
          <div className={styles.promptState}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('اختر حسابًا لعرض دفتر الأستاذ', 'Select an account to view its ledger')}
            />
          </div>
        ) : isLoading ? (
          <div className={styles.promptState}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            type="warning"
            showIcon
            message={t('تعذّر تحميل دفتر الأستاذ', 'Could not load the ledger')}
            description={t(
              'تأكد من اختيار حساب صحيح يحتوي على حركات معمدة.',
              'Make sure the selected account exists and has posted movements.'
            )}
          />
        ) : (
          <>
            <div className={styles.metrics}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>{t('الرصيد الافتتاحي', 'Opening Balance')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.openingBalance)}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.debit}`}>
                <div className={styles.metricLabel}>{t('إجمالي المدين', 'Total Debit')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.totalDebit)}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.credit}`}>
                <div className={styles.metricLabel}>{t('إجمالي الدائن', 'Total Credit')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.totalCredit)}</div>
              </div>
              <div className={`${styles.metricCard} ${styles.balance}`}>
                <div className={styles.metricLabel}>{t('الرصيد الختامي', 'Closing Balance')}</div>
                <div className={styles.metricValue}>{fmtAmount(data?.closingBalance)}</div>
              </div>
            </div>

            <Table<GeneralLedgerLine>
              rowKey={(_, idx) => String(idx)}
              columns={columns}
              dataSource={data?.lines ?? []}
              loading={isFetching}
              size="middle"
              bordered
              scroll={{ x: 800 }}
              locale={{ emptyText: t('لا توجد حركات في هذه الفترة', 'No movements in this period') }}
              pagination={{ pageSize: 20, showSizeChanger: true }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
