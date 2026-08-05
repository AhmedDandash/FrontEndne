'use client';

import { Table, Collapse } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { QrcodeOutlined, CheckCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { ZatcaInvoiceDetail, ZatcaInvoiceLine } from '@/types/zatca.types';
import { ZatcaLookupTag, formatDateTime, formatMoney } from '../../_lib/zatcaDisplay';
import styles from '../../zatca.module.css';

export default function InvoiceDetailView({
  invoice,
  isAr,
}: {
  invoice: ZatcaInvoiceDetail;
  isAr: boolean;
}) {
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const lineColumns: ColumnsType<ZatcaInvoiceLine> = [
    { title: '#', dataIndex: 'lineNumber', key: 'lineNumber', width: 50 },
    { title: t('الصنف', 'Item'), dataIndex: 'itemName', key: 'itemName' },
    { title: t('الكمية', 'Qty'), dataIndex: 'quantity', key: 'quantity', align: 'right', width: 80 },
    {
      title: t('سعر الوحدة', 'Unit Price'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: t('صافي السطر', 'Net Amount'),
      dataIndex: 'lineNetAmount',
      key: 'lineNetAmount',
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: t('نسبة الضريبة', 'Tax Rate'),
      dataIndex: 'taxRate',
      key: 'taxRate',
      align: 'right',
      width: 90,
      render: (v: number) => `${v}%`,
    },
    {
      title: t('مبلغ الضريبة', 'Tax Amount'),
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      align: 'right',
      render: (v: number) => formatMoney(v),
    },
    {
      title: t('الإجمالي', 'Line Total'),
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right',
      render: (v: number) => <span className={styles.amount}>{formatMoney(v)}</span>,
    },
  ];

  return (
    <>
      <div className={styles.facts}>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('المصدر', 'Source')}</div>
          <div className={styles.factValue}>
            <ZatcaLookupTag category="sourceEntityTypes" value={invoice.sourceEntityType} />
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('نوع الفاتورة', 'Sub Type')}</div>
          <div className={styles.factValue}>
            <ZatcaLookupTag category="invoiceSubTypes" value={invoice.invoiceSubType} />
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('تاريخ الإصدار', 'Issue Date')}</div>
          <div className={styles.factValue}>{formatDateTime(invoice.issueDateTime)}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('معرف UUID', 'Invoice UUID')}</div>
          <div className={styles.factValue} style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {invoice.invoiceUuid || '—'}
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('العملة', 'Currency')}</div>
          <div className={styles.factValue}>{invoice.currencyCode || '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('عداد الفاتورة (ICV)', 'Invoice Counter (ICV)')}</div>
          <div className={styles.factValue}>{invoice.invoiceCounterValue ?? '—'}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('حالة الإرسال', 'Submission Status')}</div>
          <div className={styles.factValue}>
            <ZatcaLookupTag category="submissionStatuses" value={invoice.submissionStatus} />
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('حالة الاعتماد', 'Clearance Status')}</div>
          <div className={styles.factValue}>
            <ZatcaLookupTag category="clearanceStatuses" value={invoice.clearanceStatus} />
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('رمز QR', 'QR Code')}</div>
          <div className={styles.factValue}>
            {invoice.hasQrCode ? (
              <span style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> <QrcodeOutlined /> {t('متوفر', 'Available')}
              </span>
            ) : (
              <span style={{ color: '#9ca3af' }}>
                <MinusCircleOutlined /> {t('غير متوفر', 'Not available')}
              </span>
            )}
          </div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('عدد المحاولات', 'Retry Count')}</div>
          <div className={styles.factValue}>{invoice.retryCount}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('تاريخ الإرسال', 'Submitted At')}</div>
          <div className={styles.factValue}>{formatDateTime(invoice.submittedAt)}</div>
        </div>
        <div className={styles.factItem}>
          <div className={styles.factLabel}>{t('تاريخ الاعتماد', 'Cleared At')}</div>
          <div className={styles.factValue}>{formatDateTime(invoice.clearedAt)}</div>
        </div>
      </div>

      {invoice.lastErrorMessage && (
        <div className={styles.readOnlyNote} style={{ borderColor: '#ff4d4f', color: '#a8071a', background: '#fff1f0' }}>
          {t('آخر خطأ: ', 'Last error: ')}
          {invoice.lastErrorMessage}
        </div>
      )}

      <div className={styles.sectionTitle}>{t('بنود الفاتورة', 'Invoice Lines')}</div>
      <Table<ZatcaInvoiceLine>
        rowKey="lineNumber"
        size="small"
        columns={lineColumns}
        dataSource={invoice.lines}
        pagination={false}
        bordered
      />

      {(invoice.reportingResult || invoice.clearanceResult) && (
        <Collapse
          style={{ marginTop: 16 }}
          items={[
            invoice.reportingResult && {
              key: 'reporting',
              label: t('نتيجة الإبلاغ (Reporting)', 'Reporting Result'),
              children: <pre className={styles.codeBlock}>{invoice.reportingResult}</pre>,
            },
            invoice.clearanceResult && {
              key: 'clearance',
              label: t('نتيجة الاعتماد (Clearance)', 'Clearance Result'),
              children: <pre className={styles.codeBlock}>{invoice.clearanceResult}</pre>,
            },
          ].filter(Boolean) as any}
        />
      )}
    </>
  );
}
