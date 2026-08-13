'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Table, Drawer, Select, Checkbox, Space, Collapse } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ShopOutlined, PlusOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useZatcaBranchContext,
  useUpdateZatcaSellerProfile,
  useZatcaEgsUnits,
  useCreateZatcaEgsUnit,
  useImportZatcaCredentials,
  useZatcaLookups,
} from '@/hooks/api/useZatca';
import { ZatcaLookupTag, ZatcaBoolTag, formatDateTime } from '../_lib/zatcaDisplay';
import type { ZatcaEgsUnit, CreateZatcaEgsUnitDto, ImportZatcaCredentialsDto } from '@/types/zatca.types';
import styles from '../zatca.module.css';

export default function ZatcaBranchSetupPage() {
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: lookups } = useZatcaLookups();
  const { data: context, isLoading: isContextLoading } = useZatcaBranchContext(branchId ?? undefined);
  const { data: egsUnits = [], isLoading: isUnitsLoading } = useZatcaEgsUnits(branchId ?? undefined);

  const updateProfile = useUpdateZatcaSellerProfile();
  const createEgsUnit = useCreateZatcaEgsUnit();
  const importCredentials = useImportZatcaCredentials();

  const [profileForm] = Form.useForm();
  const [egsForm] = Form.useForm();
  const [importForm] = Form.useForm();
  const [egsDrawerOpen, setEgsDrawerOpen] = useState(false);

  useEffect(() => {
    if (context) {
      profileForm.setFieldsValue({
        registrationNameAr: context.zakaRegistrationNameAr,
        commercialRegistrationNumber: context.commercialRegistrationNumber,
        taxNumber: context.zakaTaxNumber,
        cityName: context.zakaCityName,
        districtAr: context.zakaDistrictAr,
        streetAr: context.zakaStreetAr,
        buildingNumber: context.zakaBuildingNumber,
        postalZone: context.zakaPostalZone,
      });
    }
  }, [context, profileForm]);

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      if (!branchId) return;
      await updateProfile.mutateAsync({ branchId, ...values });
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble as an unhandled
      // promise rejection.
    }
  };

  const handleCreateEgsUnit = async () => {
    try {
      const values = await egsForm.validateFields();
      if (!branchId) return;
      const dto: CreateZatcaEgsUnitDto = { branchId, ...values };
      await createEgsUnit.mutateAsync(dto);
      setEgsDrawerOpen(false);
      egsForm.resetFields();
    } catch {
      // Form-validation rejection or mutation failure; swallow.
    }
  };

  const handleImportCredentials = async () => {
    try {
      const values = await importForm.validateFields();
      if (!branchId) return;
      const dto: ImportZatcaCredentialsDto = { branchId, ...values };
      await importCredentials.mutateAsync(dto);
      importForm.resetFields();
    } catch {
      // Form-validation rejection or mutation failure; swallow.
    }
  };

  const egsColumns: ColumnsType<ZatcaEgsUnit> = [
    { title: t('الرقم التسلسلي', 'Serial Number'), dataIndex: 'deviceSerialNumber', key: 'deviceSerialNumber' },
    { title: t('اسم الحل', 'Solution'), dataIndex: 'solutionName', key: 'solutionName' },
    { title: t('الموديل', 'Model'), dataIndex: 'model', key: 'model' },
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
      render: (v: number) => <ZatcaLookupTag category="egsUnitStatuses" value={v} />,
    },
    {
      title: t('افتراضية', 'Default'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (v: boolean) => <ZatcaBoolTag value={v} trueLabel={t('نعم', 'Yes')} falseLabel={t('لا', 'No')} />,
    },
    { title: t('عداد الفاتورة', 'ICV'), dataIndex: 'invoiceCounterValue', key: 'invoiceCounterValue' },
    { title: t('آخر إرسال', 'Last Submitted'), dataIndex: 'lastSubmittedAt', key: 'lastSubmittedAt', render: (v: string) => formatDateTime(v) },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <ShopOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إعداد الفرع لزاتكا', 'ZATCA Branch Setup')}</h1>
              <p className={styles.pageSubtitle}>
                {t('بيانات البائع ووحدات EGS واستيراد بيانات الاعتماد', 'Seller profile, EGS units and credential import')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {context && !context.sellerProfileComplete && (
        <div className={styles.readOnlyNote} style={{ borderColor: '#faad14', color: '#ad6800', background: '#fffbe6' }}>
          {t('حقول ناقصة: ', 'Missing fields: ')}
          {context.sellerProfileMissingFields.join(', ')}
        </div>
      )}

      <Card
        className={styles.detailCard}
        style={{ marginBottom: 16 }}
        title={t('بيانات البائع', 'Seller Profile')}
        loading={isContextLoading}
      >
        <Form form={profileForm} layout="vertical">
          <div className={styles.facts} style={{ marginBottom: 0 }}>
            <Form.Item name="registrationNameAr" label={t('اسم التسجيل (عربي)', 'Registration Name (Arabic)')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="commercialRegistrationNumber" label={t('السجل التجاري', 'Commercial Registration No.')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="taxNumber" label={t('الرقم الضريبي', 'Tax Number')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="cityName" label={t('المدينة', 'City')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="districtAr" label={t('الحي', 'District')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="streetAr" label={t('الشارع', 'Street')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="buildingNumber" label={t('رقم المبنى', 'Building Number')}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="postalZone" label={t('الرمز البريدي', 'Postal Zone')}>
              <Input size="large" />
            </Form.Item>
          </div>
          <Button type="primary" icon={<SaveOutlined />} loading={updateProfile.isPending} onClick={handleSaveProfile}>
            {t('حفظ بيانات البائع', 'Save Seller Profile')}
          </Button>
        </Form>
      </Card>

      <Card
        className={styles.tableCard}
        style={{ marginBottom: 16 }}
        title={t('وحدات EGS', 'EGS Units')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEgsDrawerOpen(true)}>
            {t('إضافة وحدة', 'New EGS Unit')}
          </Button>
        }
      >
        <Table<ZatcaEgsUnit>
          rowKey="id"
          columns={egsColumns}
          dataSource={egsUnits}
          loading={isUnitsLoading}
          size="middle"
          bordered
          scroll={{ x: 900 }}
          pagination={false}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'import',
            label: (
              <span>
                <ImportOutlined /> {t('استيراد بيانات اعتماد جاهزة (اختياري)', 'Import Existing Credentials (optional)')}
              </span>
            ),
            children: (
              <Form form={importForm} layout="vertical">
                <div className={styles.facts} style={{ marginBottom: 0 }}>
                  <Form.Item name="egsUnitId" label={t('وحدة EGS', 'EGS Unit')} rules={[{ required: true }]}>
                    <Select
                      size="large"
                      options={egsUnits.map((u) => ({ value: u.id, label: u.deviceSerialNumber }))}
                      placeholder={t('اختر وحدة', 'Select a unit')}
                    />
                  </Form.Item>
                  <Form.Item name="certificateType" label={t('نوع الشهادة', 'Certificate Type')} rules={[{ required: true }]}>
                    <Select
                      size="large"
                      options={lookups?.certificateTypes.map((c) => ({ value: c.value, label: c.name }))}
                      placeholder={t('اختر النوع', 'Select type')}
                    />
                  </Form.Item>
                  <Form.Item name="csid" label={t('CSID', 'CSID')}>
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="secret" label={t('السر (Secret)', 'Secret')}>
                    <Input.Password size="large" />
                  </Form.Item>
                </div>
                <Form.Item name="certificatePem" label={t('الشهادة (PEM)', 'Certificate (PEM)')}>
                  <Input.TextArea rows={4} style={{ fontFamily: 'monospace' }} />
                </Form.Item>
                <Form.Item name="privateKeyPem" label={t('المفتاح الخاص (PEM)', 'Private Key (PEM)')}>
                  <Input.TextArea rows={4} style={{ fontFamily: 'monospace' }} />
                </Form.Item>
                <Form.Item name="activateImmediately" valuePropName="checked">
                  <Checkbox>{t('تفعيل فوري', 'Activate immediately')}</Checkbox>
                </Form.Item>
                <Button type="primary" icon={<ImportOutlined />} loading={importCredentials.isPending} onClick={handleImportCredentials}>
                  {t('استيراد', 'Import')}
                </Button>
              </Form>
            ),
          },
        ]}
      />

      <Drawer
        title={t('إضافة وحدة EGS', 'New EGS Unit')}
        open={egsDrawerOpen}
        onClose={() => setEgsDrawerOpen(false)}
        width={420}
        footer={
          <Space style={{ float: isAr ? 'left' : 'right' }}>
            <Button onClick={() => setEgsDrawerOpen(false)}>{t('إلغاء', 'Cancel')}</Button>
            <Button type="primary" loading={createEgsUnit.isPending} onClick={handleCreateEgsUnit}>
              {t('حفظ', 'Save')}
            </Button>
          </Space>
        }
      >
        <Form form={egsForm} layout="vertical" initialValues={{ isDefault: egsUnits.length === 0 }}>
          <Form.Item name="deviceSerialNumber" label={t('الرقم التسلسلي', 'Device Serial Number')} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="solutionName" label={t('اسم الحل', 'Solution Name')} rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="model" label={t('الموديل', 'Model')}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="version" label={t('الإصدار', 'Version')}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="environment" label={t('البيئة', 'Environment')} rules={[{ required: true }]}>
            <Select size="large" options={lookups?.environments.map((e) => ({ value: e.value, label: e.name }))} />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>{t('تعيين كوحدة افتراضية', 'Set as default unit')}</Checkbox>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
