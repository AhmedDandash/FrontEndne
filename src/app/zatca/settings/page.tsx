'use client';

import { useEffect } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Select, Switch, Button } from 'antd';
import { SettingOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useZatcaGlobalSettings,
  useUpdateZatcaGlobalSettings,
  useZatcaBranchSettings,
  useUpdateZatcaBranchSettings,
  useZatcaLookups,
} from '@/hooks/api/useZatca';
import styles from '../zatca.module.css';

function GlobalSettingsForm({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { data, isLoading } = useZatcaGlobalSettings();
  const update = useUpdateZatcaGlobalSettings();
  const [form] = Form.useForm();

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await update.mutateAsync(values);
    } catch {
      // Form-validation rejection or mutation failure; swallow.
    }
  };

  return (
    <Form form={form} layout="vertical" disabled={isLoading}>
      <div className={styles.facts} style={{ marginBottom: 0, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Form.Item name="isIntegrationEnabled" label={t('تفعيل التكامل', 'Integration Enabled')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="defaultVatRate" label={t('نسبة الضريبة الافتراضية', 'Default VAT Rate')} rules={[{ required: true }]}>
          <InputNumber size="large" min={0} max={1} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="sandboxApiBaseUrl" label={t('رابط بيئة الاختبار', 'Sandbox API Base URL')}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="productionApiBaseUrl" label={t('رابط بيئة الإنتاج', 'Production API Base URL')}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="maxSubmissionRetries" label={t('الحد الأقصى لمحاولات الإرسال', 'Max Submission Retries')} rules={[{ required: true }]}>
          <InputNumber size="large" min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="requestTimeoutSeconds" label={t('مهلة الطلب (ثانية)', 'Request Timeout (seconds)')} rules={[{ required: true }]}>
          <InputNumber size="large" min={1} style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Button type="primary" icon={<SaveOutlined />} loading={update.isPending} onClick={handleSave}>
        {t('حفظ الإعدادات العامة', 'Save Global Settings')}
      </Button>
    </Form>
  );
}

function BranchSettingsForm({ isAr, branchId }: { isAr: boolean; branchId: string }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { data, isLoading } = useZatcaBranchSettings(branchId);
  const { data: lookups } = useZatcaLookups();
  const update = useUpdateZatcaBranchSettings();
  const [form] = Form.useForm();

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    } else {
      form.setFieldsValue({
        isEnabled: false,
        autoSubmitOnIssue: false,
        reportingEnabled: false,
        clearanceEnabled: false,
      });
    }
  }, [data, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await update.mutateAsync({ branchId, ...values });
    } catch {
      // Form-validation rejection or mutation failure; swallow.
    }
  };

  return (
    <Form form={form} layout="vertical" disabled={isLoading}>
      {!data && !isLoading && (
        <div className={styles.readOnlyNote} style={{ marginBottom: 16 }}>
          {t('لا توجد إعدادات محفوظة لهذا الفرع بعد — سيتم إنشاؤها عند الحفظ', 'No settings saved for this branch yet — they will be created on save')}
        </div>
      )}
      <div className={styles.facts} style={{ marginBottom: 0, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Form.Item name="isEnabled" label={t('تفعيل زاتكا لهذا الفرع', 'Enable ZATCA for this branch')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="environment" label={t('البيئة', 'Environment')} rules={[{ required: true }]}>
          <Select size="large" options={lookups?.environments.map((e) => ({ value: e.value, label: e.name }))} />
        </Form.Item>
        <Form.Item name="defaultInvoiceSubType" label={t('نوع الفاتورة الافتراضي', 'Default Invoice Sub Type')} rules={[{ required: true }]}>
          <Select size="large" options={lookups?.invoiceSubTypes.map((e) => ({ value: e.value, label: e.name }))} />
        </Form.Item>
        <Form.Item name="autoSubmitOnIssue" label={t('إرسال تلقائي عند الإصدار', 'Auto-submit on Issue')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="reportingEnabled" label={t('تفعيل الإبلاغ (Reporting)', 'Reporting Enabled')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="clearanceEnabled" label={t('تفعيل الاعتماد (Clearance)', 'Clearance Enabled')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="sellerNameOverrideAr" label={t('اسم البائع البديل (عربي)', 'Seller Name Override (Arabic)')}>
          <Input size="large" />
        </Form.Item>
        <Form.Item name="sellerNameOverrideEn" label={t('اسم البائع البديل (إنجليزي)', 'Seller Name Override (English)')}>
          <Input size="large" />
        </Form.Item>
      </div>
      <Form.Item name="notes" label={t('ملاحظات', 'Notes')}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Button type="primary" icon={<SaveOutlined />} loading={update.isPending} onClick={handleSave}>
        {t('حفظ إعدادات الفرع', 'Save Branch Settings')}
      </Button>
    </Form>
  );
}

export default function ZatcaSettingsPage() {
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <SettingOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إعدادات زاتكا', 'ZATCA Settings')}</h1>
              <p className={styles.pageSubtitle}>
                {t('الإعدادات العامة للنظام وإعدادات الفرع الحالي', 'System-wide settings and the current branch\'s settings')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className={styles.detailCard}>
        <Tabs
          items={[
            { key: 'global', label: t('عام', 'Global'), children: <GlobalSettingsForm isAr={isAr} /> },
            {
              key: 'branch',
              label: t('الفرع الحالي', 'Current Branch'),
              children: branchId ? (
                <BranchSettingsForm isAr={isAr} branchId={branchId} />
              ) : (
                <div className={styles.readOnlyNote}>{t('اختر فرعًا أولاً', 'Select a branch first')}</div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
