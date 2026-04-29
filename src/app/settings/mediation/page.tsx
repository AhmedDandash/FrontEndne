'use client';

import React, { useState, useMemo } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Tag,
  Tooltip,
  Spin,
  Empty,
  Tabs,
  Popconfirm,
  Table,
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  DownOutlined,
  RightOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useFollowUpStatuses,
  useCreateFollowUpStatus,
  useUpdateFollowUpStatus,
  useDeleteFollowUpStatus,
} from '@/hooks/api/useFollowUpStatuses';
import {
  useContractNationalities,
  useCreateContractNationality,
  useUpdateContractNationality,
  useDeleteContractNationality,
} from '@/hooks/api/useContractNationalities';
import { useNationalities } from '@/hooks/api/useNationalities';
import type {
  FollowUpStatus,
  ContractNationality,
} from '@/types/api.types';
import styles from './MediationSettings.module.css';
import { NationalityConfigGrid } from './NationalityConfigGrid';

// ==================== Translations ====================
function useT(language: string) {
  return useMemo(() => {
    const map: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'إعدادات المتابعة الآلية', en: 'Automatic Follow-Up Settings' },
      statusesTab: { ar: 'حالات المتابعة الأساسية', en: 'Follow-Up Statuses' },
      nationalitiesTab: { ar: 'جنسيات العقود', en: 'Contract Nationalities' },
      addStatus: { ar: 'إضافة حالة', en: 'Add Status' },
      addNationality: { ar: 'إضافة جنسية', en: 'Add Nationality' },
      nameAr: { ar: 'الاسم بالعربي', en: 'Arabic Name' },
      nameEn: { ar: 'الاسم بالإنجليزي', en: 'English Name' },
      sortOrder: { ar: 'الترتيب الافتراضي', en: 'Default Sort Order' },
      isActive: { ar: 'مفعل', en: 'Active' },
      configuredCount: { ar: 'الحالات المضبوطة', en: 'Configured Statuses' },
      actions: { ar: 'إجراءات', en: 'Actions' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
      confirmDelete: { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
      delete: { ar: 'حذف', en: 'Delete' },
      edit: { ar: 'تعديل', en: 'Edit' },
      selectNationality: { ar: 'اختر الجنسية', en: 'Select Nationality' },
      noStatuses: { ar: 'لا توجد حالات متابعة', en: 'No follow-up statuses' },
      noNationalities: { ar: 'لا توجد جنسيات مضافة', en: 'No nationalities added' },
      configureSettings: { ar: 'ضبط الإعدادات', en: 'Configure Settings' },
    };
    return (key: string) => map[key]?.[language] || map[key]?.['en'] || key;
  }, [language]);
}

// ==================== Page ====================
export default function MediationSettingsPage() {
  const { language } = useAuthStore();
  const isRTL = language === 'ar';
  const t = useT(language);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <SettingOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey="statuses"
        size="large"
        style={{ marginTop: 8 }}
        items={[
          {
            key: 'statuses',
            label: t('statusesTab'),
            children: <FollowUpStatusesTab language={language} t={t} isRTL={isRTL} />,
          },
          {
            key: 'nationalities',
            label: t('nationalitiesTab'),
            children: <ContractNationalitiesTab language={language} t={t} isRTL={isRTL} />,
          },
        ]}
      />
    </div>
  );
}

// ==================== Tab 1: Follow-Up Statuses ====================
interface TabProps {
  language: string;
  t: (key: string) => string;
  isRTL: boolean;
}

function FollowUpStatusesTab({ t, isRTL }: TabProps) {
  const { data: statuses = [], isLoading } = useFollowUpStatuses();
  const createMutation = useCreateFollowUpStatus();
  const updateMutation = useUpdateFollowUpStatus();
  const deleteMutation = useDeleteFollowUpStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUpStatus | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: FollowUpStatus) => {
    setEditing(record);
    form.setFieldsValue({
      nameAr: record.nameAr,
      nameEn: record.nameEn,
      defaultSortOrder: record.defaultSortOrder ?? 1,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation errors
    }
  };

  const columns = [
    {
      title: t('nameAr'),
      dataIndex: 'nameAr',
      key: 'nameAr',
      render: (v: string) => <span style={{ fontWeight: 600, color: '#003366' }}>{v}</span>,
    },
    {
      title: t('nameEn'),
      dataIndex: 'nameEn',
      key: 'nameEn',
      render: (v: string) => <span style={{ color: '#6c757d' }}>{v}</span>,
    },
    {
      title: t('sortOrder'),
      dataIndex: 'defaultSortOrder',
      key: 'defaultSortOrder',
      width: 120,
      render: (v: number) => (
        <Tag color="blue">{v ?? 1}</Tag>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 100,
      render: (_: any, record: FollowUpStatus) => (
        <Space size="small">
          <Tooltip title={t('edit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('confirmDelete')}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t('delete')}
            cancelText={t('cancel')}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: '#00aa64', borderColor: '#00aa64' }}
        >
          {t('addStatus')}
        </Button>
      </div>

      <Table
        dataSource={statuses}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: <Empty description={t('noStatuses')} /> }}
        pagination={{ pageSize: 15, showSizeChanger: false }}
        size="middle"
        bordered
      />

      <Modal
        open={modalOpen}
        title={editing ? t('edit') : t('addStatus')}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSave}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nameAr"
            label={t('nameAr')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Input placeholder={isRTL ? 'أدخل الاسم بالعربي' : 'Enter Arabic name'} />
          </Form.Item>
          <Form.Item
            name="nameEn"
            label={t('nameEn')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Input placeholder={isRTL ? 'أدخل الاسم بالإنجليزي' : 'Enter English name'} />
          </Form.Item>
          <Form.Item name="defaultSortOrder" label={t('sortOrder')} initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ==================== Tab 2: Contract Nationalities ====================
function ContractNationalitiesTab({ t, isRTL }: TabProps) {
  const { data: contractNationalities = [], isLoading } = useContractNationalities();
  const { data: allNationalities = [] } = useNationalities();
  const createMutation = useCreateContractNationality();
  const updateMutation = useUpdateContractNationality();
  const deleteMutation = useDeleteContractNationality();

  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Build options from the Nationality master list, excluding already-enrolled ones
  const enrolledIds = new Set(contractNationalities.map((cn) => cn.nationalityId));
  const nationalityOptions = useMemo(
    () =>
      allNationalities
        .filter((n) => n.isActive && !enrolledIds.has(n.id))
        .map((n) => ({
          value: n.id,
          label: isRTL
            ? n.nationalityNameAr || n.nationalityNameEn || n.id
            : n.nationalityNameEn || n.nationalityNameAr || n.id,
        })),
    [allNationalities, enrolledIds, isRTL]
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      // nationalityId is the UUID from the Nationality master list
      await createMutation.mutateAsync({ nationalityId: values.nationalityId });
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation
    }
  };

  const handleToggleActive = (cn: ContractNationality, checked: boolean) => {
    updateMutation.mutate({ id: cn.id, isActive: checked });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { form.resetFields(); setModalOpen(true); }}
          style={{ background: '#00aa64', borderColor: '#00aa64' }}
        >
          {t('addNationality')}
        </Button>
      </div>

      {contractNationalities.length === 0 ? (
        <div className={styles.emptyState}>
          <Empty
            description={t('noNationalities')}
            image={<GlobalOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          />
        </div>
      ) : (
        contractNationalities.map((cn) => (
          <div key={cn.id} className={styles.parentCard}>
            <div
              className={styles.parentHeader}
              onClick={() => setExpandedId(expandedId === cn.id ? null : cn.id)}
              role="button"
              tabIndex={0}
              aria-expanded={expandedId === cn.id}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedId(expandedId === cn.id ? null : cn.id)}
            >
              <div className={styles.parentInfo}>
                {expandedId === cn.id ? (
                  <DownOutlined style={{ color: '#003366' }} />
                ) : (
                  <RightOutlined style={{ color: '#003366' }} />
                )}
                <div>
                  <span className={styles.parentName}>{cn.nameAr}</span>
                  {cn.nameEn && (
                    <span className={styles.parentNameEn}> — {cn.nameEn}</span>
                  )}
                </div>
                {cn.configuredStatusCount != null && (
                  <Tag color="blue">
                    {cn.configuredStatusCount}{' '}
                    {isRTL ? 'حالة مضبوطة' : 'configured'}
                  </Tag>
                )}
                <Tag color={cn.isActive ? 'green' : 'default'}>
                  {cn.isActive ? (isRTL ? 'مفعل' : 'Active') : isRTL ? 'معطل' : 'Inactive'}
                </Tag>
              </div>

              <div className={styles.parentActions} onClick={(e) => e.stopPropagation()}>
                <Tooltip title={t('isActive')}>
                  <Switch
                    size="small"
                    checked={!!cn.isActive}
                    onChange={(checked) => handleToggleActive(cn, checked)}
                    loading={
                      updateMutation.isPending &&
                      (updateMutation.variables as any)?.id === cn.id
                    }
                  />
                </Tooltip>
                <Popconfirm
                  title={t('confirmDelete')}
                  onConfirm={() => deleteMutation.mutate(cn.id)}
                  okText={t('delete')}
                  cancelText={t('cancel')}
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </div>
            </div>

            {expandedId === cn.id && (
              <NationalityConfigGrid
                contractNationalityId={cn.id}
                isRTL={isRTL}
              />
            )}
          </div>
        ))
      )}

      <Modal
        open={modalOpen}
        title={t('addNationality')}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nationalityId"
            label={t('selectNationality')}
            rules={[{ required: true, message: t('required') }]}
            extra={
              isRTL
                ? 'بمجرد الإضافة، يقوم النظام بتوليد إعدادات افتراضية لهذه الجنسية تلقائياً'
                : 'Upon adding, the system automatically generates default configs for this nationality'
            }
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('selectNationality')}
              options={nationalityOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
