'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Table,
  Select,
  Row,
  Col,
  Button,
  Modal,
  Form,
  InputNumber,
  Spin,
  Tag,
  Statistic,
  Space,
  Popconfirm,
  Empty,
  Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ShopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DollarOutlined,
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  useMediationOffers,
  useMediationOfferSummary,
  useCreateMediationOffer,
  useUpdateMediationOffer,
  useDeleteMediationOffer,
} from '@/hooks/api/useMediationOffers';
// import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import { useBranches } from '@/hooks/api/useBranches';
import { useAgents } from '@/hooks/api/useAgents';
import {
  WORKER_TYPE,
  RELIGION,
  PREVIOUS_EXPERIENCE,
  NATIONALITIES,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';
import type {
  MediationContractOffer,
  CreateMediationContractOfferDto,
  UpdateMediationContractOfferDto,
} from '@/types/api.types';
import styles from './MediationOffers.module.css';

export default function MediationOffersPage() {
  const { language } = useAuthStore();
  const isArabic = language === 'ar';

  // API hooks
  const { data: offers = [], isLoading } = useMediationOffers();
  const { data: _summary = [] } = useMediationOfferSummary();
  const createMutation = useCreateMediationOffer();
  const updateMutation = useUpdateMediationOffer();
  const deleteMutation = useDeleteMediationOffer();

  // Lookup data
  // const { data: nationalities = [] } = useNationalities();
  const { data: jobs = [] } = useJobs();
  const { branches: branchList } = useBranches();
  const branches = useMemo(() => branchList || [], [branchList]);
  const { data: agents = [] } = useAgents();

  // State
  const [nationalityFilter, setNationalityFilter] = useState<number | null>(null);
  const [jobFilter, setJobFilter] = useState<number | null>(null);
  const [workerTypeFilter, setWorkerTypeFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<MediationContractOffer | null>(null);
  const [form] = Form.useForm();

  // Translations
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        mediationOffers: 'عروض وأسعار التوسط',
        totalOffers: 'إجمالي العروض',
        nationalities: 'الجنسيات',
        jobs: 'الوظائف',
        branches: 'الفروع',
        search: 'بحث...',
        nationality: 'الجنسية',
        job: 'الوظيفة',
        branch: 'الفرع',
        agent: 'الوكيل',
        workerType: 'نوع العامل',
        age: 'العمر',
        religion: 'الديانة',
        previousExperience: 'سبق له العمل',
        salary: 'الراتب',
        localCost: 'التكلفة',
        taxLocalCost: 'ضريبة التكلفة',
        agentCostSAR: 'تكلفة الوكيل (ريال)',
        all: 'الكل',
        addOffer: 'إضافة عرض',
        editOffer: 'تعديل العرض',
        save: 'حفظ',
        cancel: 'إلغاء',
        edit: 'تعديل',
        delete: 'حذف',
        confirmDelete: 'هل أنت متأكد من حذف هذا العرض؟',
        loading: 'جاري التحميل...',
        noOffers: 'لا توجد عروض',
        actions: 'الإجراءات',
        branchName: 'اسم الفرع',
        offersCount: 'عدد العروض',
        sar: 'ريال',
      },
      en: {
        mediationOffers: 'Mediation Offers & Prices',
        totalOffers: 'Total Offers',
        nationalities: 'Nationalities',
        jobs: 'Jobs',
        branches: 'Branches',
        search: 'Search...',
        nationality: 'Nationality',
        job: 'Job',
        branch: 'Branch',
        agent: 'Agent',
        workerType: 'Worker Type',
        age: 'Age',
        religion: 'Religion',
        previousExperience: 'Previous Experience',
        salary: 'Salary',
        localCost: 'Local Cost',
        taxLocalCost: 'Tax on Local Cost',
        agentCostSAR: 'Agent Cost (SAR)',
        all: 'All',
        addOffer: 'Add Offer',
        editOffer: 'Edit Offer',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this offer?',
        loading: 'Loading...',
        noOffers: 'No offers found',
        actions: 'Actions',
        branchName: 'Branch Name',
        offersCount: 'Offers Count',
        sar: 'SAR',
      },
    };
    return translations[language]?.[key] || key;
  };

  // Helper: resolve branch name from branches list (API joined branchName is null)
  const getBranchDisplayName = useCallback(
    (offer: { branchId?: number | null; branchName?: string | null }): string => {
      if (offer.branchName) return offer.branchName;
      if (offer.branchId) {
        const branch = branches.find((b: any) => Number(b.id) === Number(offer.branchId));
        if (branch)
          return isArabic
            ? branch.nameAr || branch.nameEn || ''
            : branch.nameEn || branch.nameAr || '';
      }
      return '';
    },
    [branches, isArabic]
  );

  // Filtered data
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesNationality =
        nationalityFilter === null || offer.nationalityId === nationalityFilter;
      const matchesJob = jobFilter === null || offer.jobId === jobFilter;
      const matchesWorkerType = workerTypeFilter === null || offer.workerType === workerTypeFilter;
      const matchesSearch =
        !searchTerm ||
        (offer.nationalityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.jobName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getBranchDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.agentName || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesNationality && matchesJob && matchesWorkerType && matchesSearch;
    });
  }, [offers, nationalityFilter, jobFilter, workerTypeFilter, searchTerm, getBranchDisplayName]);

  // Summary statistics
  const stats = useMemo(() => {
    const uniqueNationalities = new Set(offers.map((o) => o.nationalityId).filter(Boolean));
    const uniqueJobs = new Set(offers.map((o) => o.jobId).filter(Boolean));
    const uniqueBranches = new Set(offers.map((o) => o.branchId).filter(Boolean));
    return {
      total: offers.length,
      nationalities: uniqueNationalities.size,
      jobs: uniqueJobs.size,
      branches: uniqueBranches.size,
    };
  }, [offers]);

  // Nationality select options — value is nationalityId (enum value, e.g. 359)
  // Names come from NATIONALITIES enum since API joined fields are null
  // const nationalityOptions = useMemo(() => {
  //   return nationalities
  //     .filter((n) => n.nationalityId != null)
  //     .map((n) => {
  //       const enumEntry = (
  //         NATIONALITIES as ReadonlyArray<{ value: number; labelAr: string; labelEn: string }>
  //       ).find((e) => e.value === n.nationalityId);
  //       return {
  //         value: n.nationalityId as number,
  //         label: isArabic
  //           ? n.nationalityNameAr || enumEntry?.labelAr || `#${n.nationalityId}`
  //           : n.nationalityNameEn ||
  //             enumEntry?.labelEn ||
  //             enumEntry?.labelAr ||
  //             `#${n.nationalityId}`,
  //       };
  //     });
  // }, [nationalities, isArabic]);

  // Job select options from API
  const jobOptions = useMemo(() => {
    return (jobs as any[])
      .filter((j: any) => j.isActive) // Ensure only active jobs are included
      .map((j: any) => ({
        value: j.id,
        label: isArabic ? j.jobNameAr : j.jobNameEn || j.jobNameAr || `#${j.id}`,
      }));
  }, [jobs, isArabic]);

  // Branch select options from API
  const branchOptions = useMemo(() => {
    return branches.map((b: any) => ({
      value: b.id,
      label: isArabic ? b.nameAr : b.nameEn || b.nameAr || `#${b.id}`,
    }));
  }, [branches, isArabic]);

  // Agent select options from API
  const agentOptions = useMemo(() => {
    return agents.map((a: any) => ({
      value: a.id,
      label: isArabic ? a.agentNameAr : a.agentNameEn || a.agentNameAr || `#${a.id}`,
    }));
  }, [agents, isArabic]);

  // Modal handlers
  const handleAdd = () => {
    setEditingOffer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (offer: MediationContractOffer) => {
    setEditingOffer(offer);
    const localCost = offer.localCost ?? 0;
    form.setFieldsValue({
      nationalityId: offer.nationalityId,
      jobId: offer.jobId,
      branchId: offer.branchId,
      workerType: offer.workerType,
      age: offer.age,
      religion: offer.religion,
      previousExperience: offer.previousExperience,
      agentId: offer.agentId,
      salary: offer.salary,
      localCost,
      taxLocalCost: Math.round(localCost * 0.15 * 100) / 100,
      agentCostSAR: offer.agentCostSAR,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('📤 Offer form values:', values);
      if (editingOffer) {
        const dto: UpdateMediationContractOfferDto = values;
        updateMutation.mutate(
          { id: editingOffer.id, data: dto },
          {
            onSuccess: () => {
              setIsModalVisible(false);
              form.resetFields();
              setEditingOffer(null);
            },
          }
        );
      } else {
        const dto: CreateMediationContractOfferDto = values;
        createMutation.mutate(dto, {
          onSuccess: () => {
            setIsModalVisible(false);
            form.resetFields();
          },
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingOffer(null);
  };

  // Table columns
  const columns: ColumnsType<MediationContractOffer> = [
    {
      title: t('branchName'),
      dataIndex: 'branchName',
      key: 'branchName',
      render: (text: string, record: MediationContractOffer) => {
        if (text) return text;
        if (record.branchId) {
          const branch = branches.find((b: any) => Number(b.id) === Number(record.branchId));
          if (branch)
            return isArabic ? branch.nameAr || branch.nameEn : branch.nameEn || branch.nameAr;
        }
        return isArabic ? 'غير محدد' : 'N/A';
      },
      sorter: (a, b) => (a.branchName || '').localeCompare(b.branchName || ''),
    },
    {
      title: t('nationality'),
      dataIndex: 'nationalityName',
      key: 'nationalityName',
      render: (text: string, record: MediationContractOffer) => {
        if (text) return text;
        if (record.nationalityId) {
          const enumEntry = NATIONALITIES.find((e) => e.value === record.nationalityId);
          if (enumEntry) return isArabic ? enumEntry.labelAr : enumEntry.labelEn;
        }
        return isArabic ? 'غير محدد' : 'N/A';
      },
      sorter: (a, b) => (a.nationalityName || '').localeCompare(b.nationalityName || ''),
    },
    {
      title: t('job'),
      dataIndex: 'jobName',
      key: 'jobName',
      render: (text: string) => text || (isArabic ? 'غير محدد' : 'N/A'),
      sorter: (a, b) => (a.jobName || '').localeCompare(b.jobName || ''),
    },
    {
      title: t('workerType'),
      dataIndex: 'workerType',
      key: 'workerType',
      render: (val: number | null | undefined) => (
        <Tag color={val === 1 ? 'blue' : 'default'}>
          {getEnumLabel([...WORKER_TYPE], val, language)}
        </Tag>
      ),
      filters: WORKER_TYPE.map((wt) => ({
        text: isArabic ? wt.labelAr : wt.labelEn,
        value: wt.value,
      })),
      onFilter: (value, record) => record.workerType === value,
    },
    {
      title: t('previousExperience'),
      dataIndex: 'previousExperience',
      key: 'previousExperience',
      render: (val: number | null | undefined) => (
        <Tag color={val === 1 ? 'green' : val === 2 ? 'orange' : 'default'}>
          {getEnumLabel([...PREVIOUS_EXPERIENCE], val, language)}
        </Tag>
      ),
    },
    {
      title: t('age'),
      dataIndex: 'age',
      key: 'age',
      render: (val: number | null | undefined) =>
        val !== null && val !== undefined ? val : isArabic ? 'غير محدد' : 'N/A',
      sorter: (a, b) => (a.age || 0) - (b.age || 0),
    },
    {
      title: t('religion'),
      dataIndex: 'religion',
      key: 'religion',
      render: (val: number | null | undefined) => getEnumLabel([...RELIGION], val, language),
    },
    {
      title: t('salary'),
      dataIndex: 'salary',
      key: 'salary',
      render: (val: number | null | undefined) => (
        <span className={styles.salaryValue}>
          {val !== null && val !== undefined ? val.toLocaleString() : '0'}
        </span>
      ),
      sorter: (a, b) => (a.salary || 0) - (b.salary || 0),
    },
    {
      title: t('localCost'),
      dataIndex: 'localCost',
      key: 'localCost',
      render: (val: number | null | undefined) => (
        <span className={styles.costValue}>
          {val !== null && val !== undefined ? val.toLocaleString() : '0'}
        </span>
      ),
      sorter: (a, b) => (a.localCost || 0) - (b.localCost || 0),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: MediationContractOffer) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className={styles.actionBtn}
          />
          <Popconfirm
            title={t('confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('delete')}
            cancelText={t('cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              className={styles.actionBtn}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div
        className={styles.container}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <ShopOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('mediationOffers')}</h1>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleAdd}
            loading={createMutation.isPending}
          >
            {t('addOffer')}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className={styles.summaryRow}>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('totalOffers')}
              value={stats.total}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#003366' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('nationalities')}
              value={stats.nationalities}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#00478c' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('jobs')}
              value={stats.jobs}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#00aa64' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('branches')}
              value={stats.branches}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('search')}</label>
            <Input
              placeholder={t('search')}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('nationality')}</label>
            <Select
              style={{ width: '100%' }}
              value={nationalityFilter}
              onChange={(v) => setNationalityFilter(v)}
              placeholder={t('all')}
              allowClear
              showSearch
              filterOption={(input, option) =>
                ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
              }
              // options={nationalityOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('job')}</label>
            <Select
              style={{ width: '100%' }}
              value={jobFilter}
              onChange={(v) => setJobFilter(v)}
              placeholder={t('all')}
              allowClear
              showSearch
              filterOption={(input, option) =>
                ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
              }
              options={jobOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('workerType')}</label>
            <Select
              style={{ width: '100%' }}
              value={workerTypeFilter}
              onChange={(v) => setWorkerTypeFilter(v)}
              placeholder={t('all')}
              allowClear
              options={toSelectOptions([...WORKER_TYPE], language)}
            />
          </Col>
        </Row>
      </div>

      {/* Offers Table */}
      <div className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={filteredOffers}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '20', '50', '100'],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${isArabic ? 'من' : 'of'} ${total} ${isArabic ? 'عنصر' : 'items'}`,
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: <Empty description={t('noOffers')} />,
          }}
          loading={isLoading}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingOffer ? t('editOffer') : t('addOffer')}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="nationalityId"
                label={t('nationality')}
                rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
              >
                <Select
                  placeholder={t('nationality')}
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
                  }
                  // options={nationalityOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="jobId"
                label={t('job')}
                rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
              >
                <Select
                  placeholder={t('job')}
                  showSearch
                  filterOption={(input, option) =>
                    ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={jobOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="branchId" label={t('branch')}>
                <Select
                  placeholder={t('branch')}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={branchOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="agentId" label={t('agent')}>
                <Select
                  placeholder={t('agent')}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    ((option?.label as string) || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={agentOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="workerType" label={t('workerType')}>
                <Select
                  placeholder={t('workerType')}
                  allowClear
                  options={toSelectOptions([...WORKER_TYPE], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="age" label={t('age')}>
                <InputNumber style={{ width: '100%' }} min={0} max={99} placeholder={t('age')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="religion" label={t('religion')}>
                <Select
                  placeholder={t('religion')}
                  allowClear
                  options={toSelectOptions([...RELIGION], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="previousExperience" label={t('previousExperience')}>
                <Select
                  placeholder={t('previousExperience')}
                  allowClear
                  options={toSelectOptions([...PREVIOUS_EXPERIENCE], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="salary" label={t('salary')}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('salary')}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="localCost" label={t('localCost')}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('localCost')}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                  onChange={(val) => {
                    const localCost = Number(val) || 0;
                    form.setFieldsValue({ taxLocalCost: Math.round(localCost * 0.15 * 100) / 100 });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="taxLocalCost" label={t('taxLocalCost')}>
                <InputNumber
                  style={{ width: '100%', background: '#f5f5f5' }}
                  min={0}
                  placeholder={t('taxLocalCost')}
                  readOnly
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="agentCostSAR" label={t('agentCostSAR')}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('agentCostSAR')}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
