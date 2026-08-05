'use client';

import { Card, Button, Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useZatcaDiagnostics, useZatcaConnectionTest } from '@/hooks/api/useZatca';
import { ZatcaLookupTag, ZatcaSeverityTag, formatDateTime } from '../_lib/zatcaDisplay';
import type { ZatcaDiagnosticItem, ZatcaConnectionTestResult } from '@/types/zatca.types';
import styles from '../zatca.module.css';

export default function ZatcaConnectionPage() {
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: diagnostics, isLoading: isDiagnosticsLoading, refetch: refetchDiagnostics } = useZatcaDiagnostics(branchId ?? undefined);
  const connectionTest = useZatcaConnectionTest();

  const handleTest = () => {
    if (branchId) connectionTest.mutate(branchId);
  };

  const result: ZatcaConnectionTestResult | undefined = connectionTest.data;

  const diagColumns: ColumnsType<ZatcaDiagnosticItem> = [
    {
      title: t('الفحص', 'Check'),
      key: 'title',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.title}</div>
          <div className={styles.muted} style={{ fontSize: 12.5 }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: t('الخطورة', 'Severity'),
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (v: string) => <ZatcaSeverityTag value={v} />,
    },
    {
      title: t('النتيجة', 'Result'),
      dataIndex: 'passed',
      key: 'passed',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <span style={{ color: '#52c41a' }}>
            <CheckCircleOutlined /> {t('نجح', 'Passed')}
          </span>
        ) : (
          <span style={{ color: '#f5222d' }}>
            <CloseCircleOutlined /> {t('فشل', 'Failed')}
          </span>
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <ApiOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('الاتصال والتشخيص', 'Connection & Diagnostics')}</h1>
              <p className={styles.pageSubtitle}>
                {t('اختبار الاتصال بمنظومة زاتكا وفحوصات الجاهزية الآلية', 'Test connectivity to ZATCA and run automated readiness checks')}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={connectionTest.isPending}
              onClick={handleTest}
              className={styles.addBtn}
            >
              {t('اختبار الاتصال', 'Run Connection Test')}
            </Button>
          </div>
        </div>
      </div>

      {result && (
        <div className={styles.facts} style={{ marginBottom: 16 }}>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('قابل للوصول', 'Reachable')}</div>
            <div className={styles.factValue}>
              {result.isReachable ? (
                <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> {t('نعم', 'Yes')}</span>
              ) : (
                <span style={{ color: '#f5222d' }}><CloseCircleOutlined /> {t('لا', 'No')}</span>
              )}
            </div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('البيئة', 'Environment')}</div>
            <div className={styles.factValue}><ZatcaLookupTag category="environments" value={result.environment} /></div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('رمز الاستجابة', 'HTTP Status')}</div>
            <div className={styles.factValue}>{result.httpStatusCode ?? '—'}</div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('زمن الاستجابة', 'Response Time')}</div>
            <div className={styles.factValue}>{result.responseTimeMs} ms</div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('الرابط المستهدف', 'Target URL')}</div>
            <div className={styles.factValue} style={{ fontSize: 12.5, fontFamily: 'monospace' }}>{result.targetUrl || '—'}</div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('وقت الاختبار', 'Tested At')}</div>
            <div className={styles.factValue}>{formatDateTime(result.testedAt)}</div>
          </div>
        </div>
      )}
      {result?.message && (
        <div className={styles.readOnlyNote} style={{ marginBottom: 16 }}>{result.message}</div>
      )}

      <Card
        className={styles.tableCard}
        title={t('فحوصات الجاهزية', 'Readiness Diagnostics')}
        extra={
          diagnostics && (
            <span className={styles.muted}>
              {t(`نجح ${diagnostics.passedCount} / فشل ${diagnostics.failedCount}`, `Passed ${diagnostics.passedCount} / Failed ${diagnostics.failedCount}`)}
            </span>
          )
        }
      >
        <Table<ZatcaDiagnosticItem>
          rowKey="code"
          columns={diagColumns}
          dataSource={diagnostics?.items ?? []}
          loading={isDiagnosticsLoading}
          size="middle"
          bordered
          pagination={false}
          locale={{ emptyText: <Empty description={t('لا توجد بيانات', 'No data')} /> }}
        />
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => refetchDiagnostics()}>{t('إعادة تشغيل الفحوصات', 'Re-run Diagnostics')}</Button>
        </div>
      </Card>
    </div>
  );
}
