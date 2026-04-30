'use client';

import { useState, useMemo } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Spin,
  Tag,
  Tooltip,
  Popconfirm,
  Pagination,
  Statistic,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined,
  GlobalOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useContractCreationRequirements,
  useCreateContractCreationRequirement,
  useUpdateContractCreationRequirement,
  useDeleteContractCreationRequirement,
  useFilterRequirements,
} from '@/hooks/api/useContractCreationRequirements';
import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import type { ContractCreationRequirement } from '@/types/api.types';
import { NATIONALITIES, getEnumLabel } from '@/constants/enums';
import styles from './ContractRequirements.module.css';

const { TextArea } = Input;

export default function ContractCreationRequirementsPage() {
  const { language } = useAuthStore();
  const isRTL = language === 'ar';

  // ==================== Data Hooks ====================
  const { data: requirements = [], isLoading } = useContractCreationRequirements();
  const { data: nationalities = [] } = useNationalities();
  const { data: jobs = [] } = useJobs();

  const createMutation = useCreateContractCreationRequirement();
  const updateMutation = useUpdateContractCreationRequirement();
  const deleteMutation = useDeleteContractCreationRequirement();
  const filterMutation = useFilterRequirements();

  // ==================== State ====================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContractCreationRequirement | null>(null);
  const [nationalityFilter, setNationalityFilter] = useState<number | null>(null);
  const [jobFilter, setJobFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const pageSize = 10;

  // ==================== Translations ====================
  const t = useMemo(() => {
    const translations: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'متطلبات إنشاء العقد', en: 'Contract Creation Requirements' },
      addBtn: { ar: 'إضافة متطلبات', en: 'Add Requirement' },
      editBtn: { ar: 'تعديل', en: 'Edit' },
      deleteBtn: { ar: 'حذف', en: 'Delete' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      job: { ar: 'المهنة', en: 'Job' },
      requirements: { ar: 'المتطلبات', en: 'Requirements' },
      filterByNationality: { ar: 'تصفية حسب الجنسية', en: 'Filter by Nationality' },
      filterByJob: { ar: 'تصفية حسب المهنة', en: 'Filter by Job' },
      search: { ar: 'بحث...', en: 'Search...' },
      all: { ar: 'الكل', en: 'All' },
      confirmDelete: {
        ar: 'هل أنت متأكد من حذف هذا المتطلب؟',
        en: 'Are you sure you want to delete this requirement?',
      },
      noRequirements: { ar: 'لا توجد متطلبات', en: 'No requirements found' },
      addTitle: { ar: 'إضافة متطلبات جديدة', en: 'Add New Requirement' },
      editTitle: { ar: 'تعديل المتطلبات', en: 'Edit Requirement' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      selectNationality: { ar: 'اختر الجنسية', en: 'Select Nationality' },
      selectJob: { ar: 'اختر المهنة', en: 'Select Job' },
      enterRequirements: { ar: 'أدخل المتطلبات', en: 'Enter Requirements' },
      total: { ar: 'إجمالي المتطلبات', en: 'Total Requirements' },
      nationalities: { ar: 'الجنسيات', en: 'Nationalities' },
      jobs: { ar: 'المهن', en: 'Jobs' },
      required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
    };
    return (key: string) => translations[key]?.[language] || translations[key]?.['en'] || key;
  }, [language]);

  // ==================== Filtered Data ====================
  const filteredRequirements = useMemo(() => {
    let data =
      filterMutation.data && (nationalityFilter || jobFilter) ? filterMutation.data : requirements;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (r) =>
          r.contractRequirements?.toLowerCase().includes(lower) ||
          r.jobNameAr?.toLowerCase().includes(lower) ||
          r.nationalityNameAr?.toLowerCase().includes(lower) ||
          r.nationalityNameEn?.toLowerCase().includes(lower)
      );
    }

    return data;
  }, [requirements, filterMutation.data, nationalityFilter, jobFilter, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequirements.slice(start, start + pageSize);
  }, [filteredRequirements, currentPage]);

  // Unique nationality/job counts
  const uniqueNationalities = useMemo(
    () => new Set(requirements.map((r) => r.nationalityId)).size,
    [requirements]
  );
  const uniqueJobs = useMemo(() => new Set(requirements.map((r) => r.jobId)).size, [requirements]);

  // ==================== Handlers ====================
  const handleFilterChange = (natId: number | null, jId: number | null) => {
    setNationalityFilter(natId);
    setJobFilter(jId);
    setCurrentPage(1);

    if (natId || jId) {
      filterMutation.mutate({
        nationalityId: natId,
        jobId: jId,
      });
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContractCreationRequirement) => {
    setEditingItem(item);
    form.setFieldsValue({
      nationalityId: item.nationalityId,
      jobId: item.jobId,
      contractRequirements: item.contractRequirements,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch {
      // Validation errors handled by form
    }
  };

  // ==================== Nationality/Job lookup ====================
  const getNationalityName = (natId: number | null | undefined) => {
    if (!natId) return isRTL ? 'غير محدد' : 'N/A';
    return getEnumLabel(NATIONALITIES, natId, isRTL ? 'ar' : 'en');
  };

  const getJobName = (jobId: number | null | undefined) => {
    if (!jobId) return isRTL ? 'غير محدد' : 'N/A';
    const job = jobs.find((j: any) => j.id === jobId);
    return job ? (isRTL ? job.jobNameAr : job.jobNameEn) || `#${jobId}` : `#${jobId}`;
  };

  const nationalityOptions = useMemo(
    () =>
      nationalities
        .filter((n: any) => n.nationalityId != null)
        .map((n: any) => ({
          value: n.nationalityId as number,
          label:
            getEnumLabel(NATIONALITIES, n.nationalityId, isRTL ? 'ar' : 'en') ||
            n.nationalityName ||
            String(n.nationalityId),
        })),
    [nationalities, isRTL]
  );

  const jobOptions = useMemo(
    () =>
      jobs.map((j: any) => ({
        value: j.id,
        label: isRTL ? j.jobNameAr : j.jobNameEn || j.jobNameAr,
      })),
    [jobs, isRTL]
  );

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
            <FileTextOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleOpenCreate}
            aria-label={t('addBtn')}
          >
            {t('addBtn')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <div className={styles.statCard}>
            <Statistic
              title={t('total')}
              value={requirements.length}
              prefix={<FileTextOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className={styles.statCard}>
            <Statistic
              title={t('nationalities')}
              value={uniqueNationalities}
              prefix={<GlobalOutlined style={{ color: '#00478c' }} />}
              valueStyle={{ color: '#00478c' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className={styles.statCard}>
            <Statistic
              title={t('jobs')}
              value={uniqueJobs}
              prefix={<ToolOutlined style={{ color: '#00aa64' }} />}
              valueStyle={{ color: '#00aa64' }}
            />
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <label className={styles.filterLabel}>{t('filterByNationality')}</label>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('selectNationality')}
              style={{ width: '100%' }}
              value={nationalityFilter}
              onChange={(val) => handleFilterChange(val ?? null, jobFilter)}
              options={nationalityOptions}
              aria-label={t('filterByNationality')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <label className={styles.filterLabel}>{t('filterByJob')}</label>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('selectJob')}
              style={{ width: '100%' }}
              value={jobFilter}
              onChange={(val) => handleFilterChange(nationalityFilter, val ?? null)}
              options={jobOptions}
              aria-label={t('filterByJob')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <label className={styles.filterLabel}>{t('search')}</label>
            <Input
              prefix={<SearchOutlined />}
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
              aria-label={t('search')}
            />
          </Col>
        </Row>
      </div>

      {/* Requirements List */}
      {paginatedData.length === 0 ? (
        <div className={styles.emptyState}>
          <Empty description={<span className={styles.emptyText}>{t('noRequirements')}</span>} />
        </div>
      ) : (
        <>
          <div className={styles.requirementsList}>
            {paginatedData.map((item) => (
              <div
                key={item.id}
                className={`${styles.requirementCard} ${deletingId === item.id ? styles.fadeOut : ''}`}
              >
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardBadges}>
                    <Tag color="blue" icon={<GlobalOutlined />}>
                      {getNationalityName(item.nationalityId)}
                    </Tag>
                    <Tag color="green" icon={<ToolOutlined />}>
                      {item.jobNameAr || getJobName(item.jobId)}
                    </Tag>
                    <Tag color="default">#{item.id}</Tag>
                  </div>
                  <div className={styles.cardActions}>
                    <Tooltip title={t('editBtn')}>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(item)}
                        aria-label={t('editBtn')}
                      />
                    </Tooltip>
                    <Popconfirm
                      title={t('confirmDelete')}
                      onConfirm={() => handleDelete(item.id)}
                      okText={isRTL ? 'نعم' : 'Yes'}
                      cancelText={isRTL ? 'لا' : 'No'}
                    >
                      <Tooltip title={t('deleteBtn')}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          loading={deleteMutation.isPending && deletingId === item.id}
                          aria-label={t('deleteBtn')}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <div className={styles.cardField}>
                      <span className={styles.fieldLabel}>{t('nationality')}</span>
                      <span className={styles.fieldValue}>
                        {getNationalityName(item.nationalityId)}
                      </span>
                    </div>
                    <div className={styles.cardField}>
                      <span className={styles.fieldLabel}>{t('job')}</span>
                      <span className={styles.fieldValue}>
                        {item.jobNameAr || getJobName(item.jobId)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={styles.fieldLabel}>{t('requirements')}</span>
                    <div className={styles.requirementsText}>
                      {item.contractRequirements ||
                        (isRTL ? 'لا توجد متطلبات محددة' : 'No requirements specified')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredRequirements.length > pageSize && (
            <div className={styles.paginationWrapper}>
              <Pagination
                current={currentPage}
                total={filteredRequirements.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showTotal={(total) =>
                  isRTL ? `إجمالي ${total} متطلب` : `Total ${total} requirements`
                }
              />
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={isModalOpen}
        title={editingItem ? t('editTitle') : t('addTitle')}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
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
            name="jobId"
            label={t('job')}
            rules={[{ required: true, message: t('required') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('selectJob')}
              options={jobOptions}
              aria-label={t('job')}
            />
          </Form.Item>

          <Form.Item
            name="contractRequirements"
            label={t('requirements')}
            rules={[{ required: true, message: t('required') }]}
          >
            <TextArea
              rows={6}
              placeholder={t('enterRequirements')}
              aria-label={t('requirements')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
