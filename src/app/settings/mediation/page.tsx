'use client';

import { useState, useMemo } from 'react';
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
import { FollowUpStatusService } from '@/services/follow-up-status.service';
import {
  useContractNationalities,
  useCreateContractNationality,
  useUpdateContractNationality,
  useDeleteContractNationality,
} from '@/hooks/api/useContractNationalities';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import {
  useFollowUpRequirement,
  useCreateFollowUpRequirement,
  useUpdateFollowUpRequirement,
  useDeleteFollowUpRequirement,
} from '@/hooks/api/useFollowUpRequirements';
import type {
  FollowUpStatus,
  ContractNationality,
  FollowUpRequirement,
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
      requirementsTab: { ar: 'متطلبات إنشاء العقد', en: 'Creation Requirements' },
      addRequirement: { ar: 'إضافة متطلب', en: 'Add Requirement' },
      editRequirement: { ar: 'تعديل المتطلب', en: 'Edit Requirement' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      job: { ar: 'المهنة', en: 'Job' },
      requirementsText: { ar: 'نص المتطلبات', en: 'Requirements Text' },
      selectJob: { ar: 'اختر المهنة', en: 'Select Job' },
      searchRequirement: { ar: 'بحث عن متطلب', en: 'Search Requirement' },
      noRequirement: { ar: 'لا يوجد متطلب لهذه الجنسية والمهنة', en: 'No requirement for this nationality + job' },
      requirementFound: { ar: 'المتطلب المحدد', en: 'Found Requirement' },
      selectBothToSearch: { ar: 'اختر الجنسية والمهنة للبحث أو الإضافة', en: 'Select nationality and job to search or add' },
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
          {
            key: 'requirements',
            label: t('requirementsTab'),
            children: <ContractCreationRequirementsTab language={language} t={t} isRTL={isRTL} />,
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

  const openEdit = async (record: FollowUpStatus) => {
    setEditing(record);
    // Pre-fill with cached row so the modal opens instantly
    form.resetFields();
    form.setFieldsValue({
      nameAr: record.nameAr,
      nameEn: record.nameEn,
      defaultSortOrder: record.defaultSortOrder ?? 1,
    });
    setModalOpen(true);
    // Then silently fetch fresh data from GetById and overwrite the form
    try {
      const fresh = await FollowUpStatusService.getById(record.id);
      form.setFieldsValue({
        nameAr: fresh.nameAr,
        nameEn: fresh.nameEn,
        defaultSortOrder: fresh.defaultSortOrder ?? 1,
      });
    } catch {
      // keep the pre-filled values on error
    }
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
        destroyOnHidden
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
  const { data: allNationalities = [] } = useNationalities({ type: 2 });
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
        destroyOnHidden
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

// ==================== Tab 3: Contract Creation Requirements ====================
function ContractCreationRequirementsTab({ t, isRTL }: TabProps) {
  const { data: contractNationalities = [] } = useContractNationalities();
  const { data: jobs = [] } = useJobs();
  const createMutation = useCreateFollowUpRequirement();
  const updateMutation = useUpdateFollowUpRequirement();
  const deleteMutation = useDeleteFollowUpRequirement();

  const [selectedNatId, setSelectedNatId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const { data: requirement, isLoading: isSearching } = useFollowUpRequirement(
    selectedNatId,
    selectedJobId
  );

  const nationalityOptions = useMemo(
    () =>
      contractNationalities
        .filter((cn) => cn.isActive !== false)
        .map((cn) => ({
          value: String(cn.id),
          label: isRTL
            ? cn.nameAr || cn.nameEn || String(cn.id)
            : cn.nameEn || cn.nameAr || String(cn.id),
        })),
    [contractNationalities, isRTL]
  );

  const jobOptions = useMemo(
    () =>
      jobs
        .filter((j) => j.isActive !== false)
        .map((j) => ({
          value: String(j.id),
          label: isRTL
            ? j.jobNameAr || j.jobNameEn || String(j.id)
            : j.jobNameEn || j.jobNameAr || String(j.id),
        })),
    [jobs, isRTL]
  );

  const openCreate = () => {
    setIsEditing(false);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (req: FollowUpRequirement) => {
    setIsEditing(true);
    form.setFieldsValue({ requirementsText: req.requirementsText });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing && requirement?.id) {
        await updateMutation.mutateAsync({
          id: requirement.id,
          requirementsText: values.requirementsText,
        });
      } else {
        await createMutation.mutateAsync({
          nationalityId: selectedNatId!,
          jobId: selectedJobId!,
          requirementsText: values.requirementsText,
        });
      }
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation errors
    }
  };

  const bothSelected = !!selectedNatId && !!selectedJobId;

  return (
    <>
      {/* Search selectors */}
      <div
        style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#003366' }}>
          {t('searchRequirement')}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>{t('nationality')}</div>
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder={isRTL ? 'اختر الجنسية' : 'Select nationality'}
              options={nationalityOptions}
              value={selectedNatId ?? undefined}
              onChange={(v) => setSelectedNatId(v ?? null)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>{t('job')}</div>
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder={t('selectJob')}
              options={jobOptions}
              value={selectedJobId ?? undefined}
              onChange={(v) => setSelectedJobId(v ?? null)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Result area */}
      {!bothSelected ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: '#8c8c8c',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px dashed #d9d9d9',
          }}
        >
          <GlobalOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
          {t('selectBothToSearch')}
        </div>
      ) : isSearching ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin />
        </div>
      ) : requirement ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
            border: '1px solid #d6e4ff',
            borderRadius: 8,
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: '#003366', fontSize: 15 }}>{t('requirementFound')}</div>
            <Space>
              <Tooltip title={t('edit')}>
                <Button
                  type="default"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(requirement)}
                />
              </Tooltip>
              <Popconfirm
                title={t('confirmDelete')}
                onConfirm={() => requirement.id && deleteMutation.mutate(requirement.id)}
                okText={t('delete')}
                cancelText={t('cancel')}
              >
                <Button
                  type="default"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                />
              </Popconfirm>
            </Space>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Tag color="blue">
              {isRTL
                ? requirement.nationalityNameAr || requirement.nationalityNameEn
                : requirement.nationalityNameEn || requirement.nationalityNameAr}
            </Tag>
            <Tag color="green">{requirement.jobName}</Tag>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 6,
              padding: '12px 16px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              fontSize: 14,
              color: '#2c3e50',
              borderInlineStart: '3px solid #003366',
            }}
          >
            {requirement.requirementsText}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px dashed #d9d9d9',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#8c8c8c' }}>{t('noRequirement')}</span>}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              style={{ background: '#00aa64', borderColor: '#00aa64' }}
            >
              {t('addRequirement')}
            </Button>
          </Empty>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={isEditing ? t('editRequirement') : t('addRequirement')}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSave}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="requirementsText"
            label={t('requirementsText')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Input.TextArea
              rows={6}
              placeholder={isRTL ? 'أدخل نص متطلبات هذه الجنسية والمهنة' : 'Enter requirements text for this nationality + job'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
