'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyCertificateOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useZatcaDashboardSummary } from '@/hooks/api/useZatca';
import {
  ZatcaLookupTag,
  ZatcaSeverityTag,
  ZatcaBoolTag,
  formatDateTime,
  formatMoney,
} from './_lib/zatcaDisplay';
import type { ZatcaInvoiceListItem, ZatcaSubmissionLog } from '@/types/zatca.types';
import styles from './zatca.module.css';

export default function ZatcaDashboardPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data, isLoading, isFetching, refetch } = useZatcaDashboardSummary(branchId ?? undefined);
  const health = data?.health;

  const invoiceColumns: ColumnsType<ZatcaInvoiceListItem> = [
    {
      title: t('رقم الفاتورة', 'Invoice #'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string, record) => (
        <a className={styles.docNumber} onClick={() => router.push(`/zatca/invoices/${record.id}`)}>
          {v || `#${record.id.slice(0, 8)}`}
        </a>
      ),
    },
    {
      title: t('التاريخ', 'Date'),
      dataIndex: 'issueDateTime',
      key: 'issueDateTime',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: t('الإجمالي', 'Total'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (v: number) => <span className={styles.amount}>{formatMoney(v)}</span>,
    },
    {
      title: t('حالة الإرسال', 'Submission'),
      dataIndex: 'submissionStatus',
      key: 'submissionStatus',
      render: (v: number) => <ZatcaLookupTag category="submissionStatuses" value={v} />,
    },
  ];

  const logColumns: ColumnsType<ZatcaSubmissionLog> = [
    { title: t('رقم الفاتورة', 'Invoice #'), dataIndex: 'invoiceNumber', key: 'invoiceNumber', render: (v: string) => v || '—' },
    { title: t('المحاولة', 'Attempt'), dataIndex: 'attemptNumber', key: 'attemptNumber', width: 90 },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <ZatcaLookupTag category="submissionStatuses" value={v} />,
    },
    { title: t('التاريخ', 'Date'), dataIndex: 'submittedAt', key: 'submittedAt', render: (v: string) => formatDateTime(v) },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <SafetyCertificateOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('لوحة زاتكا', 'ZATCA Dashboard')}</h1>
              <p className={styles.pageSubtitle}>
                {t('حالة التكامل مع منظومة الفوترة الإلكترونية', 'Compliance status for e-invoicing integration')}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => router.push('/zatca/branch-setup')} className={styles.addBtn} type="primary">
              {t('إعداد الفرع', 'Branch Setup')}
            </Button>
          </div>
        </div>
      </div>

      {health && (
        <div className={styles.facts} style={{ marginBottom: 16 }}>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('الحالة العامة', 'Overall Status')}</div>
            <div className={styles.factValue}>
              <ZatcaSeverityTag value={health.overallStatusLevel} /> {health.overallStatus}
            </div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('التكامل مفعل', 'Integration Enabled')}</div>
            <div className={styles.factValue}>
              <ZatcaBoolTag value={health.integrationEnabled} trueLabel={t('نعم', 'Yes')} falseLabel={t('لا', 'No')} />
            </div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('الفرع مفعل', 'Branch Enabled')}</div>
            <div className={styles.factValue}>
              <ZatcaBoolTag value={health.branchEnabled} trueLabel={t('نعم', 'Yes')} falseLabel={t('لا', 'No')} />
            </div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('بيانات البائع مكتملة', 'Seller Profile Complete')}</div>
            <div className={styles.factValue}>
              <ZatcaBoolTag value={health.sellerProfileComplete} trueLabel={t('مكتملة', 'Complete')} falseLabel={t('ناقصة', 'Incomplete')} />
            </div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('وحدة EGS فعالة', 'Active EGS Unit')}</div>
            <div className={styles.factValue}>
              <ZatcaBoolTag value={health.hasActiveEgsUnit} trueLabel={t('موجودة', 'Present')} falseLabel={t('غير موجودة', 'Missing')} />
            </div>
          </div>
          <div className={styles.factItem}>
            <div className={styles.factLabel}>{t('شهادة فعالة', 'Active Certificate')}</div>
            <div className={styles.factValue}>
              <ZatcaBoolTag value={health.hasActiveCertificate} trueLabel={t('موجودة', 'Present')} falseLabel={t('غير موجودة', 'Missing')} />
            </div>
          </div>
        </div>
      )}

      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.total}`}>
          <div className={styles.metricLabel}>{t('فواتير معلقة', 'Pending Invoices')}</div>
          <div className={styles.metricValue}>{health?.pendingInvoicesCount ?? '—'}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.critical}`}>
          <div className={styles.metricLabel}>{t('فواتير فاشلة', 'Failed Invoices')}</div>
          <div className={styles.metricValue}>{health?.failedInvoicesCount ?? '—'}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.active}`}>
          <div className={styles.metricLabel}>{t('فواتير معتمدة', 'Cleared Invoices')}</div>
          <div className={styles.metricValue}>{health?.clearedInvoicesCount ?? '—'}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.warning}`}>
          <div className={styles.metricLabel}>{t('فواتير مبلغ عنها', 'Reported Invoices')}</div>
          <div className={styles.metricValue}>{health?.reportedInvoicesCount ?? '—'}</div>
        </div>
      </div>

      {data?.branch && !data.branch.sellerProfileComplete && (
        <div className={styles.readOnlyNote} style={{ borderColor: '#faad14', color: '#ad6800', background: '#fffbe6' }}>
          {t('بيانات البائع غير مكتملة، الحقول الناقصة: ', 'Seller profile is incomplete, missing fields: ')}
          {data.branch.sellerProfileMissingFields.join(', ')}
          {' — '}
          <a onClick={() => router.push('/zatca/branch-setup')}>{t('إكمال البيانات', 'Complete now')}</a>
        </div>
      )}

      <div className={styles.detailGrid}>
        <Card
          className={styles.detailCard}
          title={t('آخر الفواتير', 'Recent Invoices')}
          extra={<a onClick={() => router.push('/zatca/invoices')}>{t('عرض الكل', 'View all')}</a>}
          style={{ gridColumn: 'span 2' }}
        >
          <Table<ZatcaInvoiceListItem>
            rowKey="id"
            size="small"
            columns={invoiceColumns}
            dataSource={data?.recentInvoices ?? []}
            loading={isLoading}
            pagination={false}
            locale={{ emptyText: <Empty description={t('لا توجد فواتير', 'No invoices yet')} /> }}
          />
        </Card>
        <Card className={styles.detailCard} title={t('الشهادة النشطة', 'Active Certificate')}>
          {data?.activeCertificate ? (
            <div className={styles.facts} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('النوع', 'Type')}</div>
                <div className={styles.factValue}>
                  <ZatcaLookupTag category="certificateTypes" value={data.activeCertificate.certificateType} />
                </div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('تنتهي في', 'Expires')}</div>
                <div className={styles.factValue}>{formatDateTime(data.activeCertificate.expiresAt)}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('أيام متبقية', 'Days Left')}</div>
                <div className={styles.factValue}>{data.activeCertificate.daysUntilExpiration}</div>
              </div>
            </div>
          ) : (
            <Empty description={t('لا توجد شهادة نشطة', 'No active certificate')}>
              <Button icon={<FileTextOutlined />} onClick={() => router.push('/zatca/csr')}>
                {t('بدء إجراءات CSR', 'Start CSR Workflow')}
              </Button>
            </Empty>
          )}
        </Card>
      </div>

      <Card className={styles.detailCard} style={{ marginTop: 16 }} title={t('آخر عمليات الإرسال', 'Recent Submission Logs')}>
        <Table<ZatcaSubmissionLog>
          rowKey="id"
          size="small"
          columns={logColumns}
          dataSource={data?.recentSubmissionLogs ?? []}
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: <Empty description={t('لا توجد سجلات', 'No logs yet')} /> }}
        />
      </Card>
    </div>
  );
}
