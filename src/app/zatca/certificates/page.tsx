'use client';

import { Card, Tabs, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SafetyOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useZatcaCertificates,
  useZatcaCertificateHistory,
  useZatcaCertificateExpiration,
} from '@/hooks/api/useZatca';
import { ZatcaLookupTag, ZatcaBoolTag, ZatcaSeverityTag, formatDateTime } from '../_lib/zatcaDisplay';
import type {
  ZatcaCertificate,
  ZatcaCertificateHistory,
  ZatcaCertificateExpiration,
} from '@/types/zatca.types';
import styles from '../zatca.module.css';

export default function ZatcaCertificatesPage() {
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: certificates = [], isLoading: isCertLoading } = useZatcaCertificates(branchId ?? undefined);
  const { data: history = [], isLoading: isHistoryLoading } = useZatcaCertificateHistory(branchId ?? undefined);
  const { data: expiration = [], isLoading: isExpirationLoading } = useZatcaCertificateExpiration(branchId ?? undefined);

  const certColumns: ColumnsType<ZatcaCertificate> = [
    { title: t('الرقم التسلسلي', 'Serial Number'), dataIndex: 'serialNumber', key: 'serialNumber', render: (v: string) => v || '—' },
    {
      title: t('النوع', 'Type'),
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (v: number) => <ZatcaLookupTag category="certificateTypes" value={v} />,
    },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <ZatcaLookupTag category="certificateStatuses" value={v} />,
    },
    {
      title: t('فعالة', 'Active'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <ZatcaBoolTag value={v} trueLabel={t('نعم', 'Yes')} falseLabel={t('لا', 'No')} />,
    },
    { title: t('تاريخ الإصدار', 'Issued'), dataIndex: 'issuedAt', key: 'issuedAt', render: (v: string) => formatDateTime(v) },
    { title: t('تاريخ الانتهاء', 'Expires'), dataIndex: 'expiresAt', key: 'expiresAt', render: (v: string) => formatDateTime(v) },
    { title: t('أيام متبقية', 'Days Left'), dataIndex: 'daysUntilExpiration', key: 'daysUntilExpiration' },
    {
      title: t('يحتوي CSID', 'Has CSID'),
      dataIndex: 'hasCsid',
      key: 'hasCsid',
      render: (v: boolean) => <ZatcaBoolTag value={v} trueLabel={t('نعم', 'Yes')} falseLabel={t('لا', 'No')} />,
    },
  ];

  const historyColumns: ColumnsType<ZatcaCertificateHistory> = [
    { title: t('الإجراء', 'Action'), dataIndex: 'action', key: 'action' },
    {
      title: t('النوع', 'Type'),
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (v: number) => <ZatcaLookupTag category="certificateTypes" value={v} />,
    },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <ZatcaLookupTag category="certificateStatuses" value={v} />,
    },
    { title: t('ساري من', 'Effective From'), dataIndex: 'effectiveFrom', key: 'effectiveFrom', render: (v: string) => formatDateTime(v) },
    { title: t('ساري حتى', 'Effective To'), dataIndex: 'effectiveTo', key: 'effectiveTo', render: (v: string) => formatDateTime(v) },
    { title: t('بواسطة', 'Performed By'), dataIndex: 'performedBy', key: 'performedBy', render: (v: string) => v || '—' },
    { title: t('ملاحظات', 'Notes'), dataIndex: 'notes', key: 'notes', render: (v: string) => v || <span className={styles.muted}>—</span> },
  ];

  const expirationColumns: ColumnsType<ZatcaCertificateExpiration> = [
    { title: t('الجهاز', 'Device'), dataIndex: 'deviceSerialNumber', key: 'deviceSerialNumber', render: (v: string) => v || '—' },
    {
      title: t('النوع', 'Type'),
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (v: number) => <ZatcaLookupTag category="certificateTypes" value={v} />,
    },
    { title: t('تاريخ الانتهاء', 'Expires'), dataIndex: 'expiresAt', key: 'expiresAt', render: (v: string) => formatDateTime(v) },
    { title: t('أيام متبقية', 'Days Left'), dataIndex: 'daysUntilExpiration', key: 'daysUntilExpiration' },
    {
      title: t('المستوى', 'Level'),
      dataIndex: 'expirationLevel',
      key: 'expirationLevel',
      render: (v: string) => <ZatcaSeverityTag value={v} />,
    },
    {
      title: t('فعالة', 'Active'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <ZatcaBoolTag value={v} trueLabel={t('نعم', 'Yes')} falseLabel={t('لا', 'No')} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <SafetyOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('الشهادات', 'Certificates')}</h1>
              <p className={styles.pageSubtitle}>
                {t('الشهادات الفعالة، سجل التغييرات، ومراقبة انتهاء الصلاحية', 'Active certificates, change history, and expiration monitoring')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        <Tabs
          items={[
            {
              key: 'active',
              label: t('الشهادات الفعالة', 'Active Certificates'),
              children: (
                <Table<ZatcaCertificate>
                  rowKey="id"
                  columns={certColumns}
                  dataSource={certificates}
                  loading={isCertLoading}
                  size="middle"
                  bordered
                  scroll={{ x: 1000 }}
                  pagination={false}
                />
              ),
            },
            {
              key: 'history',
              label: t('سجل التغييرات', 'History'),
              children: (
                <Table<ZatcaCertificateHistory>
                  rowKey="id"
                  columns={historyColumns}
                  dataSource={history}
                  loading={isHistoryLoading}
                  size="middle"
                  bordered
                  scroll={{ x: 900 }}
                  pagination={false}
                />
              ),
            },
            {
              key: 'expiration',
              label: t('مراقبة الانتهاء', 'Expiration Monitor'),
              children: (
                <Table<ZatcaCertificateExpiration>
                  rowKey="certificateId"
                  columns={expirationColumns}
                  dataSource={expiration}
                  loading={isExpirationLoading}
                  size="middle"
                  bordered
                  scroll={{ x: 800 }}
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
