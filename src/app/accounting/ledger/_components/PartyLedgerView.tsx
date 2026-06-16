'use client';

import { useState, type ReactNode } from 'react';
import { Card, Table, Input, DatePicker, Button, Empty, Spin, Alert, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { SearchOutlined } from '@ant-design/icons';
import { usePartyLedger } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import type { PartyKind, PartyLedgerLine } from '@/types/ledger.types';
import { LedgerHeader } from './LedgerHeader';
import { fmtAmount, fmtDate } from './ledgerFormat';
import styles from '../Ledger.module.css';

const { RangePicker } = DatePicker;

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

  const [idInput, setIdInput] = useState('');
  const [activeId, setActiveId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data, isLoading, isFetching, refetch, error } = usePartyLedger(kind, activeId, {
    from: range?.[0]?.startOf('day').toISOString(),
    to: range?.[1]?.endOf('day').toISOString(),
  });

  const runReport = () => setActiveId(idInput.trim() || undefined);

  const columns: ColumnsType<PartyLedgerLine> = [
    { title: t('التاريخ', 'Date'), dataIndex: 'date', key: 'date', width: 105, render: fmtDate },
    {
      title: t('رقم القيد', 'Entry No.'),
      dataIndex: 'entryNumber',
      key: 'entryNumber',
      width: 115,
      render: (v) => <span className={styles.entryNumber}>{v || '—'}</span>,
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
        onRefresh={activeId ? () => refetch() : undefined}
        refreshLabel={t('تحديث', 'Refresh')}
      />

      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input
            allowClear
            size="large"
            style={{ flex: '1 1 320px', maxWidth: 460 }}
            prefix={<SearchOutlined />}
            placeholder={idLabel}
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            onPressEnter={runReport}
          />
          <RangePicker
            value={range as any}
            onChange={(v) => setRange(v as any)}
            placeholder={[t('من', 'From'), t('إلى', 'To')]}
          />
          <Button type="primary" size="large" onClick={runReport} disabled={!idInput.trim()}>
            {t('عرض', 'Run')}
          </Button>
        </div>

        {!activeId ? (
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
