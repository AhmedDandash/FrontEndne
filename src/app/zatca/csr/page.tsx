'use client';

import { useState } from 'react';
import { Card, Steps, Form, Select, Input, Button, Table, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { KeyOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useZatcaEgsUnits,
  useZatcaCsrRequests,
  useZatcaLookups,
  useGenerateZatcaCsr,
  useRequestZatcaComplianceCsid,
  useRequestZatcaProductionCsid,
} from '@/hooks/api/useZatca';
import { ZatcaLookupTag, formatDateTime } from '../_lib/zatcaDisplay';
import type { ZatcaCsrRequest } from '@/types/zatca.types';
import styles from '../zatca.module.css';

export default function ZatcaCsrPage() {
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: egsUnits = [] } = useZatcaEgsUnits(branchId ?? undefined);
  const { data: lookups } = useZatcaLookups();
  const { data: csrRequests = [], isLoading: isHistoryLoading } = useZatcaCsrRequests(branchId ?? undefined);

  const generateCsr = useGenerateZatcaCsr();
  const requestComplianceCsid = useRequestZatcaComplianceCsid();
  const requestProductionCsid = useRequestZatcaProductionCsid();

  const [egsUnitId, setEgsUnitId] = useState<string | undefined>();
  const [environment, setEnvironment] = useState<number | undefined>();
  const [csrRequestId, setCsrRequestId] = useState<string | undefined>();
  const [csrPem, setCsrPem] = useState<string | undefined>();
  const [complianceRequestId, setComplianceRequestId] = useState<string | undefined>();

  const [otp, setOtp] = useState('');

  const step = csrRequestId ? (complianceRequestId ? 2 : 1) : 0;

  const handleGenerate = async () => {
    if (!branchId || !egsUnitId || environment === undefined) return;
    try {
      const result = await generateCsr.mutateAsync({
        branchId,
        egsUnitId,
        requestType: 1,
        environment,
      });
      setCsrRequestId(result.csrRequestId);
      setCsrPem(result.csrPem ?? undefined);
    } catch {
      // Mutation failure; toast already shown by onError. Swallow.
    }
  };

  const handleComplianceCsid = async () => {
    if (!branchId || !egsUnitId || !csrRequestId) return;
    try {
      const result = await requestComplianceCsid.mutateAsync({
        branchId,
        egsUnitId,
        csrRequestId,
        otp: otp || undefined,
      });
      setComplianceRequestId(result.requestId ?? 'done');
    } catch {
      // Mutation failure; toast already shown by onError. Swallow.
    }
  };

  const handleProductionCsid = async () => {
    if (!branchId || !egsUnitId || !csrRequestId) return;
    try {
      await requestProductionCsid.mutateAsync({
        branchId,
        egsUnitId,
        csrRequestId,
        complianceRequestId,
      });
    } catch {
      // Mutation failure; toast already shown by onError. Swallow.
    }
  };

  const columns: ColumnsType<ZatcaCsrRequest> = [
    { title: t('الجهاز', 'Device'), dataIndex: 'deviceSerialNumber', key: 'deviceSerialNumber', render: (v: string) => v || '—' },
    {
      title: t('نوع الطلب', 'Request Type'),
      dataIndex: 'requestType',
      key: 'requestType',
      render: (v: number) => <ZatcaLookupTag category="csrRequestStatuses" value={v} />,
    },
    {
      title: t('البيئة', 'Environment'),
      dataIndex: 'environment',
      key: 'environment',
      render: (v: number) => <ZatcaLookupTag category="environments" value={v} />,
    },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: number) => <ZatcaLookupTag category="csrRequestStatuses" value={v} />,
    },
    { title: t('تاريخ الطلب', 'Requested'), dataIndex: 'requestedAt', key: 'requestedAt', render: (v: string) => formatDateTime(v) },
    { title: t('تاريخ الإكمال', 'Completed'), dataIndex: 'completedAt', key: 'completedAt', render: (v: string) => formatDateTime(v) },
    { title: t('رسالة الخطأ', 'Error'), dataIndex: 'errorMessage', key: 'errorMessage', render: (v: string) => v || <span className={styles.muted}>—</span> },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <KeyOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('طلبات CSR والشهادات', 'CSR & Certificate Requests')}</h1>
              <p className={styles.pageSubtitle}>
                {t('إنشاء CSR ثم طلب شهادة الالتزام ثم شهادة الإنتاج', 'Generate a CSR, then request the compliance CSID, then the production CSID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.detailCard} style={{ marginBottom: 16 }}>
        <Steps
          current={step}
          items={[
            { title: t('إنشاء CSR', 'Generate CSR') },
            { title: t('شهادة الالتزام', 'Compliance CSID') },
            { title: t('شهادة الإنتاج', 'Production CSID') },
          ]}
          style={{ marginBottom: 24 }}
        />

        <Form layout="vertical">
          <div className={styles.facts} style={{ marginBottom: 0, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <Form.Item label={t('وحدة EGS', 'EGS Unit')} required>
              <Select
                size="large"
                value={egsUnitId}
                onChange={setEgsUnitId}
                disabled={!!csrRequestId}
                options={egsUnits.map((u) => ({ value: u.id, label: u.deviceSerialNumber }))}
                placeholder={t('اختر وحدة', 'Select a unit')}
              />
            </Form.Item>
            <Form.Item label={t('البيئة', 'Environment')} required>
              <Select
                size="large"
                value={environment}
                onChange={setEnvironment}
                disabled={!!csrRequestId}
                options={lookups?.environments.map((e) => ({ value: e.value, label: e.name }))}
                placeholder={t('اختر البيئة', 'Select environment')}
              />
            </Form.Item>
          </div>
        </Form>

        {step === 0 && (
          <Button
            type="primary"
            loading={generateCsr.isPending}
            disabled={!egsUnitId || environment === undefined}
            onClick={handleGenerate}
          >
            {t('إنشاء CSR', 'Generate CSR')}
          </Button>
        )}

        {csrPem && (
          <pre className={styles.codeBlock} style={{ marginTop: 16 }}>
            {csrPem}
          </pre>
        )}

        {step === 1 && (
          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
            <Form.Item label={t('رمز التحقق OTP (من بوابة فاتورة)', 'OTP (from the Fatoora portal)')}>
              <Input size="large" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ maxWidth: 300 }} />
            </Form.Item>
            <Button type="primary" loading={requestComplianceCsid.isPending} onClick={handleComplianceCsid}>
              {t('طلب شهادة الالتزام', 'Request Compliance CSID')}
            </Button>
          </Space>
        )}

        {step === 2 && (
          <Button type="primary" style={{ marginTop: 16 }} loading={requestProductionCsid.isPending} onClick={handleProductionCsid}>
            {t('طلب شهادة الإنتاج', 'Request Production CSID')}
          </Button>
        )}
      </Card>

      <Card className={styles.tableCard} title={t('سجل طلبات CSR', 'CSR Request History')}>
        <Table<ZatcaCsrRequest>
          rowKey="id"
          columns={columns}
          dataSource={csrRequests}
          loading={isHistoryLoading}
          size="middle"
          bordered
          scroll={{ x: 900 }}
          pagination={false}
        />
      </Card>
    </div>
  );
}
