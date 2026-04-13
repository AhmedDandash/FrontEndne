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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  DownOutlined,
  RightOutlined,
  DeleteOutlined,
  LinkOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useMediationFollowUpStatuses,
  useCreateMediationFollowUpStatus,
  useMediationSubStatuses,
  useCreateMediationSubStatus,
  useUpdateMediationSubStatus,
  useToggleSubStatusActive,
  useToggleSubStatusFinish,
  useUpdateSubStatusCaseOrder,
} from '@/hooks/api/useMediationFollowUpStatuses';
import {
  useNationalityFollowUpStatuses,
  useCreateNationalityFollowUp,
  useToggleNationalityFollowUpActive,
  useDeleteNationalityFollowUp,
} from '@/hooks/api/useNationalityFollowUpStatuses';
import { useNationalities } from '@/hooks/api/useNationalities';
import type {
  MediationFollowUpStatus,
  MediationStatus,
  NationalityFollowUpStatus,
} from '@/types/api.types';
import { NATIONALITIES, getEnumLabel } from '@/constants/enums';
import styles from './MediationSettings.module.css';

export default function MediationSettingsPage() {
  const { language } = useAuthStore();
  const isRTL = language === 'ar';

  // ==================== Data Hooks ====================
  const { data: parentStatuses = [], isLoading } = useMediationFollowUpStatuses();
  const createParentMutation = useCreateMediationFollowUpStatus();

  // ==================== State ====================
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [expandedParentId, setExpandedParentId] = useState<number | null>(null);
  const [selectedParentForSub, setSelectedParentForSub] = useState<number | null>(null);
  const [parentForm] = Form.useForm();
  const [subForm] = Form.useForm();

  // ==================== Translations ====================
  const t = useMemo(() => {
    const tr: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'إعدادات المتابعة الالية', en: 'Automatic Follow-Up Settings' },
      parentTab: { ar: 'حالات المتابعة', en: 'Follow-Up Statuses' },
      nationalityTab: { ar: 'ربط الجنسيات', en: 'Nationality Configuration' },
      addParent: { ar: 'إضافة حالة متابعة', en: 'Add Follow-Up Status' },
      addSub: { ar: 'إضافة حالة فرعية', en: 'Add Sub-Status' },
      addAssociation: { ar: 'ربط جنسية بحالة متابعة', en: 'Link Nationality to Status' },
      nameAr: { ar: 'الاسم بالعربي', en: 'Arabic Name' },
      nameEn: { ar: 'الاسم بالإنجليزي', en: 'English Name' },
      whatsappName: { ar: 'اسم الواتساب', en: 'WhatsApp Name' },
      caseOrder: { ar: 'الترتيب', en: 'Order' },
      isActive: { ar: 'مفعل', en: 'Active' },
      isFinish: { ar: 'إجراء نهائي', en: 'Final Action' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
      noStatuses: { ar: 'لا توجد حالات متابعة', en: 'No follow-up statuses found' },
      noSubStatuses: { ar: 'لا توجد حالات فرعية', en: 'No sub-statuses found' },
      noAssociations: { ar: 'لا توجد ربطات جنسيات', en: 'No nationality associations found' },
      saveRow: { ar: 'حفظ', en: 'Save' },
      actions: { ar: 'إجراءات', en: 'Actions' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      followUpStatus: { ar: 'حالة المتابعة', en: 'Follow-Up Status' },
      selectNationality: { ar: 'اختر الجنسية', en: 'Select Nationality' },
      selectStatus: { ar: 'اختر حالة المتابعة', en: 'Select Follow-Up Status' },
      confirmDelete: { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
      delete: { ar: 'حذف', en: 'Delete' },
    };
    return (key: string) => tr[key]?.[language] || tr[key]?.['en'] || key;
  }, [language]);

  // ==================== Handlers ====================
  const handleToggleExpand = (parentId: number) => {
    setExpandedParentId(expandedParentId === parentId ? null : parentId);
  };

  const handleCreateParent = async () => {
    try {
      const values = await parentForm.validateFields();
      await createParentMutation.mutateAsync(values);
      setParentModalOpen(false);
      parentForm.resetFields();
    } catch {
      // Validation errors
    }
  };

  const handleOpenSubModal = (parentId: number) => {
    setSelectedParentForSub(parentId);
    subForm.resetFields();
    setSubModalOpen(true);
  };

  // ==================== Render ====================
  if (isLoading) {
    return (
      <div
        className={styles.container}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
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
            label: t('parentTab'),
            children: (
              <FollowUpStatusesTab
                parentStatuses={parentStatuses}
                createParentMutation={createParentMutation}
                parentForm={parentForm}
                subForm={subForm}
                parentModalOpen={parentModalOpen}
                setParentModalOpen={setParentModalOpen}
                subModalOpen={subModalOpen}
                setSubModalOpen={setSubModalOpen}
                expandedParentId={expandedParentId}
                selectedParentForSub={selectedParentForSub}
                setSelectedParentForSub={setSelectedParentForSub}
                handleToggleExpand={handleToggleExpand}
                handleCreateParent={handleCreateParent}
                handleOpenSubModal={handleOpenSubModal}
                language={language}
                t={t}
                isRTL={isRTL}
              />
            ),
          },
          {
            key: 'nationality',
            label: t('nationalityTab'),
            children: (
              <NationalityFollowUpTab
                parentStatuses={parentStatuses}
                language={language}
                t={t}
                isRTL={isRTL}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

// ==================== Follow-Up Statuses Tab ====================
interface FollowUpStatusesTabProps {
  parentStatuses: MediationFollowUpStatus[];
  createParentMutation: any;
  parentForm: any;
  subForm: any;
  parentModalOpen: boolean;
  setParentModalOpen: (v: boolean) => void;
  subModalOpen: boolean;
  setSubModalOpen: (v: boolean) => void;
  expandedParentId: number | null;
  selectedParentForSub: number | null;
  setSelectedParentForSub: (v: number | null) => void;
  handleToggleExpand: (parentId: number) => void;
  handleCreateParent: () => void;
  handleOpenSubModal: (parentId: number) => void;
  language: string;
  t: (key: string) => string;
  isRTL: boolean;
}

function FollowUpStatusesTab({
  parentStatuses,
  createParentMutation,
  parentForm,
  subForm,
  parentModalOpen,
  setParentModalOpen,
  subModalOpen,
  setSubModalOpen,
  expandedParentId,
  selectedParentForSub,
  setSelectedParentForSub,
  handleToggleExpand,
  handleCreateParent,
  handleOpenSubModal,
  language,
  t,
  isRTL,
}: FollowUpStatusesTabProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            parentForm.resetFields();
            setParentModalOpen(true);
          }}
          style={{ background: '#00aa64', borderColor: '#00aa64' }}
          aria-label={t('addParent')}
        >
          {t('addParent')}
        </Button>
      </div>

      {parentStatuses.length === 0 ? (
        <div className={styles.emptyState}>
          <Empty description={t('noStatuses')} />
        </div>
      ) : (
        parentStatuses.map((parent) => (
          <div key={parent.id} className={styles.parentCard}>
            <div
              className={styles.parentHeader}
              onClick={() => handleToggleExpand(parent.id)}
              role="button"
              tabIndex={0}
              aria-expanded={expandedParentId === parent.id}
              onKeyDown={(e) => e.key === 'Enter' && handleToggleExpand(parent.id)}
            >
              <div className={styles.parentInfo}>
                {expandedParentId === parent.id ? (
                  <DownOutlined style={{ color: '#003366' }} />
                ) : (
                  <RightOutlined style={{ color: '#003366' }} />
                )}
                <div>
                  <span className={styles.parentName}>{parent.nameAr}</span>
                  {parent.nameEn && <span className={styles.parentNameEn}> — {parent.nameEn}</span>}
                </div>
                <Tag color={parent.isActive ? 'green' : 'default'}>
                  {parent.isActive ? (isRTL ? 'مفعل' : 'Active') : isRTL ? 'معطل' : 'Inactive'}
                </Tag>
              </div>
              <div className={styles.parentActions}>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenSubModal(parent.id);
                  }}
                  aria-label={t('addSub')}
                >
                  {t('addSub')}
                </Button>
              </div>
            </div>

            {expandedParentId === parent.id && (
              <SubStatusTable parentId={parent.id} language={language} t={t} isRTL={isRTL} />
            )}
          </div>
        ))
      )}

      {/* Create Parent Modal */}
      <Modal
        open={parentModalOpen}
        title={t('addParent')}
        onCancel={() => {
          setParentModalOpen(false);
          parentForm.resetFields();
        }}
        onOk={handleCreateParent}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createParentMutation.isPending}
        destroyOnClose
      >
        <Form form={parentForm} layout="vertical" style={{ marginTop: 16 }}>
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
        </Form>
      </Modal>

      {/* Create Sub-Status Modal */}
      <SubStatusModal
        open={subModalOpen}
        parentId={selectedParentForSub}
        form={subForm}
        t={t}
        isRTL={isRTL}
        onClose={() => {
          setSubModalOpen(false);
          setSelectedParentForSub(null);
        }}
      />
    </>
  );
}

// ==================== Nationality Follow-Up Tab ====================
interface NationalityFollowUpTabProps {
  parentStatuses: MediationFollowUpStatus[];
  language: string;
  t: (key: string) => string;
  isRTL: boolean;
}

function NationalityFollowUpTab({ parentStatuses, t, isRTL }: NationalityFollowUpTabProps) {
  const { data: associations = [], isLoading } = useNationalityFollowUpStatuses();
  const { data: nationalities = [] } = useNationalities();
  const createMutation = useCreateNationalityFollowUp();
  const toggleActiveMutation = useToggleNationalityFollowUpActive();
  const deleteMutation = useDeleteNationalityFollowUp();

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const nationalityOptions = useMemo(
    () =>
      nationalities
        .filter((n) => n.nationalityId != null)
        .map((n) => ({
          value: n.nationalityId as number,
          label:
            getEnumLabel(NATIONALITIES, n.nationalityId, isRTL ? 'ar' : 'en') ||
            n.nationalityName ||
            String(n.nationalityId),
        })),
    [nationalities, isRTL]
  );

  const statusOptions = useMemo(
    () =>
      parentStatuses.map((s) => ({
        value: s.id,
        label: isRTL ? s.nameAr || s.nameEn : s.nameEn || s.nameAr,
      })),
    [parentStatuses, isRTL]
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createMutation.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation
    }
  };

  const columns = [
    {
      title: t('nationality'),
      key: 'nationality',
      render: (_: any, record: NationalityFollowUpStatus) => {
        return (
          getEnumLabel(NATIONALITIES, record.nationalityId, isRTL ? 'ar' : 'en') ||
          record.nationalityNameAr ||
          record.nationalityNameEn ||
          record.nationalityId ||
          '—'
        );
      },
    },
    {
      title: t('followUpStatus'),
      key: 'followUpStatus',
      render: (_: any, record: NationalityFollowUpStatus) =>
        record.nameAr ||
        parentStatuses.find((s) => s.id === record.followUpStatusId)?.[
          isRTL ? 'nameAr' : 'nameEn'
        ] ||
        '—',
    },
    {
      title: t('isActive'),
      key: 'isActive',
      width: 100,
      render: (_: any, record: NationalityFollowUpStatus) => (
        <Switch
          size="small"
          checked={!!record.isActive}
          onChange={() => toggleActiveMutation.mutate(record.id)}
          loading={toggleActiveMutation.isPending}
        />
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 80,
      render: (_: any, record: NationalityFollowUpStatus) => (
        <Popconfirm
          title={t('confirmDelete')}
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText={t('delete')}
          cancelText={t('cancel')}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            aria-label={t('delete')}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<LinkOutlined />}
          onClick={() => {
            form.resetFields();
            setModalOpen(true);
          }}
          style={{ background: '#00aa64', borderColor: '#00aa64' }}
          aria-label={t('addAssociation')}
        >
          {t('addAssociation')}
        </Button>
      </div>

      <Table
        dataSource={associations}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: <Empty description={t('noAssociations')} /> }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => (isRTL ? `الإجمالي: ${total}` : `Total: ${total}`),
        }}
        size="middle"
        bordered
      />

      <Modal
        open={modalOpen}
        title={t('addAssociation')}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreate}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nationalityId"
            label={t('nationality')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('selectNationality')}
              options={nationalityOptions}
              aria-label={t('nationality')}
            />
          </Form.Item>
          <Form.Item
            name="followUpStatusId"
            label={t('followUpStatus')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('selectStatus')}
              options={statusOptions}
              aria-label={t('followUpStatus')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ==================== Sub-Status Table Component ====================
interface SubStatusTableProps {
  parentId: number;
  language: string;
  t: (key: string) => string;
  isRTL: boolean;
}

function SubStatusTable({ parentId, t, isRTL }: SubStatusTableProps) {
  const { data: subStatuses = [], isLoading } = useMediationSubStatuses(parentId);
  const updateMutation = useUpdateMediationSubStatus();
  const toggleActiveMutation = useToggleSubStatusActive();
  const toggleFinishMutation = useToggleSubStatusFinish();
  const updateOrderMutation = useUpdateSubStatusCaseOrder();

  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<MediationStatus>>({});

  const handleStartEdit = (sub: MediationStatus) => {
    setEditingRow(sub.id);
    setEditValues({
      nameStatusAr: sub.nameStatusAr,
      nameStatusEn: sub.nameStatusEn,
      nameStatusWhatsAppEn: sub.nameStatusWhatsAppEn,
    });
  };

  const handleSaveRow = async (sub: MediationStatus) => {
    await updateMutation.mutateAsync({
      id: sub.id,
      data: {
        ...editValues,
        mediationFollowUpStatusesId: parentId,
      },
    });
    setEditingRow(null);
    setEditValues({});
  };

  const handleToggleActive = (sub: MediationStatus, checked: boolean) => {
    toggleActiveMutation.mutate({ id: sub.id, parentId, nextValue: checked });
  };

  const handleToggleFinish = (sub: MediationStatus, checked: boolean) => {
    toggleFinishMutation.mutate({ id: sub.id, parentId, nextValue: checked });
  };

  const handleOrderChange = (sub: MediationStatus, newOrder: number) => {
    updateOrderMutation.mutate({ id: sub.id, order: newOrder });
  };

  if (isLoading) {
    return (
      <div className={styles.subStatusContainer} style={{ textAlign: 'center', padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (subStatuses.length === 0) {
    return (
      <div className={styles.subStatusContainer}>
        <Empty description={t('noSubStatuses')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div className={styles.subStatusContainer}>
      {/* Header row */}
      <div className={styles.subStatusHeader}>
        <span className={styles.subStatusHeaderLabel}>{t('nameAr')}</span>
        <span className={styles.subStatusHeaderLabel}>{t('nameEn')}</span>
        <span className={styles.subStatusHeaderLabel}>{t('whatsappName')}</span>
        <span className={styles.subStatusHeaderLabel}>{t('caseOrder')}</span>
        <span className={styles.subStatusHeaderLabel}>{t('isActive')}</span>
        <span className={styles.subStatusHeaderLabel}>{t('isFinish')}</span>
        <span className={styles.subStatusHeaderLabel}>{t('actions')}</span>
      </div>

      {/* Data rows */}
      {subStatuses.map((sub) => (
        <div key={sub.id} className={styles.subStatusRow}>
          {/* Arabic Name */}
          {editingRow === sub.id ? (
            <Input
              size="small"
              value={editValues.nameStatusAr ?? ''}
              onChange={(e) => setEditValues({ ...editValues, nameStatusAr: e.target.value })}
              aria-label={t('nameAr')}
            />
          ) : (
            <span style={{ fontWeight: 500 }}>{sub.nameStatusAr}</span>
          )}

          {/* English Name */}
          {editingRow === sub.id ? (
            <Input
              size="small"
              value={editValues.nameStatusEn ?? ''}
              onChange={(e) => setEditValues({ ...editValues, nameStatusEn: e.target.value })}
              aria-label={t('nameEn')}
            />
          ) : (
            <span style={{ color: '#6c757d' }}>{sub.nameStatusEn}</span>
          )}

          {/* WhatsApp Name */}
          {editingRow === sub.id ? (
            <Input
              size="small"
              value={editValues.nameStatusWhatsAppEn ?? ''}
              onChange={(e) =>
                setEditValues({ ...editValues, nameStatusWhatsAppEn: e.target.value })
              }
              aria-label={t('whatsappName')}
            />
          ) : (
            <span style={{ color: '#6c757d', fontSize: 13 }}>
              {sub.nameStatusWhatsAppEn || '—'}
            </span>
          )}

          {/* Case Order */}
          <InputNumber
            size="small"
            value={sub.caseOrder ?? 0}
            min={0}
            onChange={(val) => val !== null && handleOrderChange(sub, val)}
            style={{ width: 60 }}
            aria-label={t('caseOrder')}
          />

          {/* Active Toggle */}
          <Switch
            size="small"
            checked={!!sub.isActive}
            onChange={(checked) => handleToggleActive(sub, checked)}
            loading={
              toggleActiveMutation.isPending && toggleActiveMutation.variables?.id === sub.id
            }
            aria-label={t('isActive')}
          />

          {/* Finish Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Switch
              size="small"
              checked={!!sub.isActionFinish}
              onChange={(checked) => handleToggleFinish(sub, checked)}
              loading={
                toggleFinishMutation.isPending && toggleFinishMutation.variables?.id === sub.id
              }
              aria-label={t('isFinish')}
            />
            {sub.isActionFinish && (
              <span className={styles.completedBadge}>
                <CheckCircleOutlined /> {t('completed')}
              </span>
            )}
          </div>

          {/* Actions */}
          <div>
            {editingRow === sub.id ? (
              <Tooltip title={t('save')}>
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  loading={updateMutation.isPending}
                  onClick={() => handleSaveRow(sub)}
                  aria-label={t('saveRow')}
                />
              </Tooltip>
            ) : (
              <Tooltip title={isRTL ? 'تعديل' : 'Edit'}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleStartEdit(sub)}
                  aria-label={isRTL ? 'تعديل' : 'Edit'}
                />
              </Tooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Sub-Status Creation Modal ====================
interface SubStatusModalProps {
  open: boolean;
  parentId: number | null;
  form: any;
  t: (key: string) => string;
  isRTL: boolean;
  onClose: () => void;
}

function SubStatusModal({ open, parentId, form, t, isRTL, onClose }: SubStatusModalProps) {
  const createSubMutation = useCreateMediationSubStatus();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createSubMutation.mutateAsync({
        ...values,
        mediationFollowUpStatusesId: parentId!,
        isActive: values.isActive ?? true,
        isActionFinish: values.isActionFinish ?? false,
      });
      onClose();
      form.resetFields();
    } catch {
      // Validation errors
    }
  };

  return (
    <Modal
      open={open}
      title={t('addSub')}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={handleSubmit}
      okText={t('save')}
      cancelText={t('cancel')}
      confirmLoading={createSubMutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="nameStatusAr"
          label={t('nameAr')}
          rules={[{ required: true, message: t('required') }]}
        >
          <Input placeholder={isRTL ? 'الاسم بالعربي' : 'Arabic name'} aria-label={t('nameAr')} />
        </Form.Item>
        <Form.Item
          name="nameStatusEn"
          label={t('nameEn')}
          rules={[{ required: true, message: t('required') }]}
        >
          <Input
            placeholder={isRTL ? 'الاسم بالإنجليزي' : 'English name'}
            aria-label={t('nameEn')}
          />
        </Form.Item>
        <Form.Item name="nameStatusWhatsAppEn" label={t('whatsappName')}>
          <Input
            placeholder={isRTL ? 'اسم الواتساب' : 'WhatsApp name'}
            aria-label={t('whatsappName')}
          />
        </Form.Item>
        <Form.Item name="caseOrder" label={t('caseOrder')} initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} aria-label={t('caseOrder')} />
        </Form.Item>
        <Form.Item
          name="isActive"
          label={t('isActive')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch aria-label={t('isActive')} />
        </Form.Item>
        <Form.Item
          name="isActionFinish"
          label={t('isFinish')}
          valuePropName="checked"
          initialValue={false}
        >
          <Switch aria-label={t('isFinish')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
