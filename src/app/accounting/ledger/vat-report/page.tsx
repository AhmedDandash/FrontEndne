'use client';

import { useState } from 'react';
import { Card, Select, InputNumber, Empty, Spin, Alert, Row, Col, Statistic } from 'antd';
import dayjs from 'dayjs';
import { PercentageOutlined } from '@ant-design/icons';
import { useVatReport } from '@/hooks/api/useLedger';
import { useAuthStore } from '@/store/authStore';
import { LedgerHeader } from '../_components/LedgerHeader';
import { BranchFilterSelect } from '@/components/filters';
import { fmtAmount, fmtDate } from '../_components/ledgerFormat';
import styles from '../Ledger.module.css';

const now = dayjs();

export default function VatReportPage() {
  const isAr = useAuthStore((s) => s.language) !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [year, setYear] = useState<number>(now.year());
  const [quarter, setQuarter] = useState<number>(Math.floor(now.month() / 3) + 1);
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);

  const { data, isLoading, isFetching, refetch, error } = useVatReport({
    year,
    quarter,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
  });

  const quarters = [1, 2, 3, 4].map((q) => ({ value: q, label: `${t('الربع', 'Q')} ${q}` }));

  return (
    <div className={styles.page}>
      <LedgerHeader
        icon={<PercentageOutlined />}
        title={t('تقرير ضريبة القيمة المضافة', 'VAT Report')}
        subtitle={t(
          'ملخص ربع سنوي لضريبة المخرجات والمدخلات وصافي الضريبة المستحقة',
          'Quarterly output VAT, input VAT and net VAT payable summary'
        )}
        isFetching={isFetching}
        onRefresh={() => refetch()}
        refreshLabel={t('تحديث', 'Refresh')}
      />

      <Card className={styles.tableCard} style={{ marginBlockEnd: 16 }}>
        <div className={styles.filters}>
          <InputNumber
            size="large"
            min={2000}
            max={2100}
            value={year}
            onChange={(v) => v && setYear(v)}
            style={{ width: 140 }}
            prefix={t('السنة', 'Year')}
          />
          <Select
            size="large"
            value={quarter}
            onChange={setQuarter}
            options={quarters}
            style={{ width: 140 }}
          />
          <BranchFilterSelect
            value={branchId}
            onChange={setBranchId}
            includeSubBranches={includeSubBranches}
            onIncludeSubBranchesChange={setIncludeSubBranches}
          />
        </div>

        {isLoading ? (
          <div className={styles.promptState}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message={t('تعذّر تحميل التقرير', 'Could not load the report')}
            description={t('تأكد أن رقم الربع بين 1 و 4.', 'Make sure the quarter is between 1 and 4.')}
          />
        ) : !data ? (
          <div className={styles.promptState}>
            <Empty description={t('لا توجد بيانات', 'No data')} />
          </div>
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              style={{ marginBlockEnd: 16 }}
              message={
                <span>
                  {t('الفترة', 'Period')}: <strong>{fmtDate(data.periodStart)}</strong> →{' '}
                  <strong>{fmtDate(data.periodEnd)}</strong>
                </span>
              }
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card className={styles.sectionCard}>
                  <Statistic
                    title={t('ضريبة المخرجات (مبيعات)', 'Output VAT (sales)')}
                    value={fmtAmount(data.outputVat)}
                    valueStyle={{ color: '#1677ff', fontFamily: 'Courier New, monospace' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className={styles.sectionCard}>
                  <Statistic
                    title={t('ضريبة المدخلات (مشتريات)', 'Input VAT (purchases)')}
                    value={fmtAmount(data.inputVat)}
                    valueStyle={{ color: '#fa8c16', fontFamily: 'Courier New, monospace' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className={styles.sectionCard}>
                  <Statistic
                    title={t('صافي الضريبة المستحقة', 'Net VAT Payable')}
                    value={fmtAmount(data.netVatPayable)}
                    valueStyle={{
                      color: data.netVatPayable >= 0 ? '#cf1322' : '#52c41a',
                      fontFamily: 'Courier New, monospace',
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Card>
    </div>
  );
}
