'use client';

import { useState } from 'react';
import { Card, Table, DatePicker, Empty, Spin, Row, Col, Tag, Switch, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { BankOutlined } from '@ant-design/icons';
import { useBalanceSheet } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import type { BalanceSheetLine, BalanceSheetSection } from '@/types/ledger.types';
import { LedgerHeader } from '../_components/LedgerHeader';
import { BranchFilterSelect } from '@/components/filters';
import { fmtAmount, fmtBalance } from '../_components/ledgerFormat';
import styles from '../Ledger.module.css';

export default function BalanceSheetPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [asOf, setAsOf] = useState<Dayjs | null>(dayjs());
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [includeCurrentYearEarnings, setIncludeCurrentYearEarnings] = useState(false);

  const { data, isLoading, isFetching, refetch } = useBalanceSheet({
    asOfDate: asOf?.format('YYYY-MM-DD'),
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
    includeCurrentYearEarnings,
  });

  const sectionColumns = (label: string): ColumnsType<BalanceSheetLine> => [
    {
      title: t('رقم الحساب', 'Code'),
      dataIndex: 'accountCode',
      key: 'code',
      width: 120,
      render: (v) => <span className={styles.code}>{v}</span>,
    },
    {
      title: label,
      dataIndex: 'accountName',
      key: 'name',
      render: (v) => <span className={styles.accountName}>{v}</span>,
    },
    {
      title: t('الرصيد', 'Balance'),
      dataIndex: 'closingBalance',
      key: 'balance',
      width: 150,
      align: 'right',
      render: (v) => {
        const b = fmtBalance(v);
        return <span className={`${styles.amount} ${b.negative ? styles.negative : ''}`}>{b.text}</span>;
      },
    },
  ];

  const renderSection = (section: BalanceSheetSection | undefined, label: string) => (
    <Card
      className={styles.sectionCard}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{label}</span>
          <span className={styles.sectionTotal}>{fmtAmount(section?.total)}</span>
        </div>
      }
    >
      <Table<BalanceSheetLine>
        rowKey="accountId"
        columns={sectionColumns(label)}
        dataSource={section?.lines ?? []}
        size="small"
        bordered
        pagination={false}
        locale={{ emptyText: t('لا توجد حسابات', 'No accounts') }}
      />
    </Card>
  );

  const equationBalanced =
    !!data &&
    Math.round((data.totalAssets - (data.totalLiabilities + data.totalEquity)) * 100) === 0;

  return (
    <div className={styles.page}>
      <LedgerHeader
        icon={<BankOutlined />}
        title={t('الميزانية العمومية', 'Balance Sheet')}
        subtitle={t(
          'الأصول والخصوم وحقوق الملكية حتى تاريخ محدد',
          'Assets, liabilities and equity as of a specific date'
        )}
        isFetching={isFetching}
        onRefresh={() => refetch()}
        refreshLabel={t('تحديث', 'Refresh')}
        extra={
          <>
            <DatePicker
              value={asOf}
              onChange={(v) => setAsOf(v)}
              allowClear={false}
              format="YYYY-MM-DD"
              placeholder={t('حتى تاريخ', 'As of date')}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={setBranchId}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
            <Space>
              <Switch checked={includeCurrentYearEarnings} onChange={setIncludeCurrentYearEarnings} />
              <span>{t('شمل أرباح السنة الحالية', 'Include current-year earnings')}</span>
            </Space>
          </>
        }
      />

      {!asOf ? (
        <Card className={styles.tableCard}>
          <div className={styles.promptState}>
            <Empty description={t('اختر تاريخًا', 'Select a date')} />
          </div>
        </Card>
      ) : isLoading ? (
        <Card className={styles.tableCard}>
          <div className={styles.promptState}>
            <Spin size="large" />
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.metrics}>
            <div className={`${styles.metricCard} ${styles.debit}`}>
              <div className={styles.metricLabel}>{t('إجمالي الأصول', 'Total Assets')}</div>
              <div className={styles.metricValue}>{fmtAmount(data?.totalAssets)}</div>
            </div>
            <div className={`${styles.metricCard} ${styles.credit}`}>
              <div className={styles.metricLabel}>{t('إجمالي الخصوم', 'Total Liabilities')}</div>
              <div className={styles.metricValue}>{fmtAmount(data?.totalLiabilities)}</div>
            </div>
            <div className={`${styles.metricCard} ${styles.balance}`}>
              <div className={styles.metricLabel}>{t('إجمالي حقوق الملكية', 'Total Equity')}</div>
              <div className={styles.metricValue}>{fmtAmount(data?.totalEquity)}</div>
            </div>
            <div className={`${styles.metricCard} ${equationBalanced ? styles.balance : styles.warn}`}>
              <div className={styles.metricLabel}>{t('المعادلة المحاسبية', 'Accounting Equation')}</div>
              <div className={styles.metricValue} style={{ fontSize: 16 }}>
                {equationBalanced ? (
                  <Tag color="success">{t('متوازنة', 'Balanced')}</Tag>
                ) : (
                  <Tag color="error">{t('غير متوازنة', 'Off')}</Tag>
                )}
              </div>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              {renderSection(data?.assets, t('الأصول', 'Assets'))}
            </Col>
            <Col xs={24} lg={8}>
              {renderSection(data?.liabilities, t('الخصوم', 'Liabilities'))}
            </Col>
            <Col xs={24} lg={8}>
              {renderSection(data?.equity, t('حقوق الملكية', 'Equity'))}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
