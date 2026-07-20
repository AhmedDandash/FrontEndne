'use client';

import { useState, useMemo, useCallback } from 'react';
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
  Switch,
  Tag,
  Statistic,
  Space,
  Empty,
  Input,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ShopOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  useMediationOffers,
  useCreateMediationOffer,
  useUpdateMediationOffer,
  useDeleteMediationOffer,
  useToggleMediationOffer,
} from '@/hooks/api/useMediationOffers';
import { useContractNationalities } from '@/hooks/api/useContractNationalities';
import { useJobs } from '@/hooks/api/useJobs';
import {
  WORKER_TYPE,
  PREVIOUS_EXPERIENCE,
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

  // Filter state — nationalityId is UUID string
  const [nationalityFilter, setNationalityFilter] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<string | null>(null);
  const [workerTypeFilter, setWorkerTypeFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // API hooks — nationality/job/workerType are cheap enough to also apply
  // server-side even though this is a fetch-all picker list; the client-side
  // filter below still runs on top (harmless no-op once the server already
  // filtered) and keeps `searchTerm` (which has no direct server field) working.
  const { data: offers = [], isLoading } = useMediationOffers({
    NationalityId: nationalityFilter ?? undefined,
    JobId: jobFilter ?? undefined,
    WorkerType: workerTypeFilter ?? undefined,
  });
  const { data: contractNationalities = [] } = useContractNationalities();
  const { data: jobs = [] } = useJobs();
  const createMutation = useCreateMediationOffer();
  const updateMutation = useUpdateMediationOffer();
  const deleteMutation = useDeleteMediationOffer();
  const toggleMutation = useToggleMediationOffer();

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState<MediationContractOffer | null>(null);
  const [form] = Form.useForm();

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        mediationOffers: 'عروض وأسعار التوسط',
        totalOffers: 'إجمالي العروض',
        nationalities: 'الجنسيات',
        jobs: 'الوظائف',
        search: 'بحث...',
        nationality: 'الجنسية',
        job: 'الوظيفة',
        workerType: 'نوع العامل',
        previousExperience: 'سبق له العمل',
        offerNumber: 'رقم العرض',
        salary: 'الراتب',
        localCost: 'التكلفة المحلية',
        taxLocalCost: 'ضريبة التكلفة',
        agentCostSAR: 'تكلفة الوكيل (ريال)',
        totalOfferCost: 'إجمالي تكلفة العرض',
        showForExternalCustomers: 'يظهر للعملاء الخارجيين',
        showForReception: 'يظهر للاستقبال',
        isActive: 'مفعّل',
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
        sar: 'ريال',
        active: 'مفعّل',
        inactive: 'معطّل',
        toggleActive: 'تفعيل/تعطيل',
      },
      en: {
        mediationOffers: 'Mediation Offers & Prices',
        totalOffers: 'Total Offers',
        nationalities: 'Nationalities',
        jobs: 'Jobs',
        search: 'Search...',
        nationality: 'Nationality',
        job: 'Job',
        workerType: 'Worker Type',
        previousExperience: 'Previous Experience',
        offerNumber: 'Offer Number',
        salary: 'Salary',
        localCost: 'Local Cost',
        taxLocalCost: 'Tax on Local Cost',
        agentCostSAR: 'Agent Cost (SAR)',
        totalOfferCost: 'Total Offer Cost',
        showForExternalCustomers: 'Show for External Customers',
        showForReception: 'Show for Reception',
        isActive: 'Active',
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
        sar: 'SAR',
        active: 'Active',
        inactive: 'Inactive',
        toggleActive: 'Toggle Active',
      },
    };
    return translations[language]?.[key] || key;
  };

  const getLocalizedName = useCallback(
    (item: any, englishKeys: string[], arabicKeys: string[]): string => {
      const primaryKeys = isArabic ? arabicKeys : englishKeys;
      const fallbackKeys = isArabic ? englishKeys : arabicKeys;
      for (const key of [...primaryKeys, ...fallbackKeys]) {
        if (item?.[key]) return String(item[key]);
      }
      return '';
    },
    [isArabic]
  );

  const getNationalityDisplayName = useCallback(
    (offer: MediationContractOffer): string => {
      const apiName = getLocalizedName(
        offer,
        ['nationalityNameEn', 'nationalityName'],
        ['nationalityNameAr', 'nationalityName']
      );
      if (apiName) return apiName;
      return offer.nationalityId ? `#${offer.nationalityId}` : '';
    },
    [getLocalizedName]
  );

  const getJobDisplayName = useCallback(
    (offer: MediationContractOffer): string => {
      const apiName = getLocalizedName(
        offer,
        ['jobNameEn', 'jobName'],
        ['jobNameAr', 'jobName']
      );
      if (apiName) return apiName;
      const job = (jobs as any[]).find((j) => String(j.id) === String(offer.jobId));
      if (job) {
        return (
          getLocalizedName(job, ['jobNameEn', 'nameEn'], ['jobNameAr', 'nameAr']) ||
          `#${offer.jobId}`
        );
      }
      return offer.jobId ? `#${offer.jobId}` : '';
    },
    [getLocalizedName, jobs]
  );

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesNationality =
        nationalityFilter === null || String(offer.nationalityId) === nationalityFilter;
      const matchesJob =
        jobFilter === null || String(offer.jobId) === jobFilter;
      const matchesWorkerType =
        workerTypeFilter === null || offer.workerType === workerTypeFilter;
      const matchesSearch =
        !searchTerm ||
        getNationalityDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getJobDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase());

      return matchesNationality && matchesJob && matchesWorkerType && matchesSearch;
    });
  }, [
    offers,
    nationalityFilter,
    jobFilter,
    workerTypeFilter,
    searchTerm,
    getJobDisplayName,
    getNationalityDisplayName,
  ]);

  const stats = useMemo(() => {
    const uniqueNationalities = new Set(offers.map((o) => o.nationalityId).filter(Boolean));
    const uniqueJobs = new Set(offers.map((o) => o.jobId).filter(Boolean));
    return {
      total: offers.length,
      nationalities: uniqueNationalities.size,
      jobs: uniqueJobs.size,
    };
  }, [offers]);

  // Nationality options — use ContractNationality.id (integer PK) as value, NOT the nationalityId UUID
  const nationalityOptions = useMemo(() => {
    return contractNationalities
      .filter((cn) => cn.isActive !== false)
      .map((cn) => ({
        value: String(cn.id),
        label: isArabic
          ? cn.nameAr || cn.nameEn || String(cn.id)
          : cn.nameEn || cn.nameAr || String(cn.id),
      }));
  }, [contractNationalities, isArabic]);

  // Job options from API
  const jobOptions = useMemo(() => {
    return (jobs as any[]).map((j) => ({
      value: String(j.id),
      label:
        getLocalizedName(j, ['jobNameEn', 'nameEn'], ['jobNameAr', 'nameAr']) ||
        `#${j.id}`,
    }));
  }, [jobs, getLocalizedName]);

  const handleAdd = () => {
    setEditingOffer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (offer: MediationContractOffer) => {
    setEditingOffer(offer);
    const localCost = offer.localCost ?? 0;
    const taxLocalCost = offer.taxLocalCost ?? Math.round(localCost * 0.15 * 100) / 100;
    const agentCostSAR = offer.agentCostSAR ?? 0;
    // Pre-select using the ContractNationality integer id stored in the offer.
    // Only populate if the id exists in the loaded ContractNationality list.
    const validNationalityId = offer.nationalityId
      ? contractNationalities.find((cn) => String(cn.id) === String(offer.nationalityId))
          ? String(offer.nationalityId)
          : undefined
      : undefined;
    form.setFieldsValue({
      nationalityId: validNationalityId,
      jobId: offer.jobId ? String(offer.jobId) : undefined,
      workerType: offer.workerType ?? undefined,
      previousExperience: offer.previousExperience ?? undefined,
      salary: offer.salary,
      localCost,
      taxLocalCost,
      agentCostSAR,
      totalOfferCost: offer.totalOfferCost ?? (localCost + taxLocalCost + agentCostSAR),
      showForExternalCustomers: offer.showForExternalCustomers ?? false,
      showForReception: offer.showForReception ?? false,
    });
    setIsModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingOffer) {
        const dto: UpdateMediationContractOfferDto = {
          id: editingOffer.id,
          nationalityId: values.nationalityId ?? null,
          jobId: values.jobId ?? null,
          workerType: values.workerType ?? null,
          previousExperience: values.previousExperience ?? null,
          salary: values.salary ?? null,
          localCost: values.localCost ?? null,
          taxLocalCost: values.taxLocalCost ?? null,
          agentCostSAR: values.agentCostSAR ?? null,
          showForExternalCustomers: values.showForExternalCustomers ?? false,
          showForReception: values.showForReception ?? false,
        };
        updateMutation.mutate(dto, {
          onSuccess: () => {
            setIsModalVisible(false);
            form.resetFields();
            setEditingOffer(null);
          },
        });
      } else {
        const dto: CreateMediationContractOfferDto = {
          nationalityId: values.nationalityId ?? null,
          jobId: values.jobId ?? null,
          workerType: values.workerType ?? null,
          previousExperience: values.previousExperience ?? null,
          salary: values.salary ?? null,
          localCost: values.localCost ?? null,
          taxLocalCost: values.taxLocalCost ?? null,
          agentCostSAR: values.agentCostSAR ?? null,
          showForExternalCustomers: values.showForExternalCustomers ?? false,
          showForReception: values.showForReception ?? false,
        };
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

  const columns: ColumnsType<MediationContractOffer> = [
    {
      title: t('nationality'),
      dataIndex: 'nationalityName',
      key: 'nationalityName',
      render: (_: string, record: MediationContractOffer) => {
        const name = getNationalityDisplayName(record);
        return name || (isArabic ? 'غير محدد' : 'N/A');
      },
      sorter: (a, b) =>
        getNationalityDisplayName(a).localeCompare(getNationalityDisplayName(b)),
    },
    {
      title: t('job'),
      dataIndex: 'jobName',
      key: 'jobName',
      render: (_: string, record: MediationContractOffer) =>
        getJobDisplayName(record) || (isArabic ? 'غير محدد' : 'N/A'),
      sorter: (a, b) => getJobDisplayName(a).localeCompare(getJobDisplayName(b)),
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
        <Tag color={val === 3 ? 'green' : val === 2 ? 'orange' : 'default'}>
          {getEnumLabel([...PREVIOUS_EXPERIENCE], val, language)}
        </Tag>
      ),
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
      title: t('agentCostSAR'),
      dataIndex: 'agentCostSAR',
      key: 'agentCostSAR',
      render: (val: number | null | undefined) => (
        <span>{val !== null && val !== undefined ? val.toLocaleString() : '0'}</span>
      ),
      sorter: (a, b) => (a.agentCostSAR || 0) - (b.agentCostSAR || 0),
    },
    {
      title: t('showForExternalCustomers'),
      dataIndex: 'showForExternalCustomers',
      key: 'showForExternalCustomers',
      width: 80,
      render: (val: boolean | null | undefined) => (
        <Tag color={val ? 'green' : 'default'}>{val ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}</Tag>
      ),
    },
    {
      title: t('showForReception'),
      dataIndex: 'showForReception',
      key: 'showForReception',
      width: 80,
      render: (val: boolean | null | undefined) => (
        <Tag color={val ? 'green' : 'default'}>{val ? (isArabic ? 'نعم' : 'Yes') : (isArabic ? 'لا' : 'No')}</Tag>
      ),
    },
    {
      title: t('toggleActive'),
      key: 'isActive',
      width: 100,
      render: (_: any, record: MediationContractOffer) => (
        <Switch
          size="small"
          checked={record.isActive !== false}
          loading={toggleMutation.isPending && toggleMutation.variables === record.id}
          onChange={() => toggleMutation.mutate(record.id)}
          checkedChildren={t('active')}
          unCheckedChildren={t('inactive')}
        />
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 80,
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
            onConfirm={() => deleteMutation.mutate(record.id)}
            okButtonProps={{ danger: true }}
            okText={isArabic ? 'حذف' : 'Delete'}
            cancelText={t('cancel')}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
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
        <Col xs={24} sm={12} md={8}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('totalOffers')}
              value={stats.total}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#003366' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('nationalities')}
              value={stats.nationalities}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#00478c' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('jobs')}
              value={stats.jobs}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#00aa64' }}
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
              options={nationalityOptions}
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
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={[16, 0]}>
            {/* Nationality + Job */}
            <Col xs={24} md={12}>
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
                  options={nationalityOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
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

            {/* Worker Type + Previous Experience */}
            <Col xs={24} md={12}>
              <Form.Item name="workerType" label={t('workerType')}>
                <Select
                  placeholder={t('workerType')}
                  allowClear
                  options={toSelectOptions([...WORKER_TYPE], language)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="previousExperience" label={t('previousExperience')}>
                <Select
                  placeholder={t('previousExperience')}
                  allowClear
                  options={toSelectOptions([...PREVIOUS_EXPERIENCE], language)}
                />
              </Form.Item>
            </Col>

            {/* Financial fields */}
            <Col xs={24} md={8}>
              <Form.Item
                name="salary"
                label={t('salary')}
                rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
              >
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
              <Form.Item
                name="localCost"
                label={t('localCost')}
                rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('localCost')}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                  onChange={(val) => {
                    const localCost = Number(val) || 0;
                    const tax = Math.round(localCost * 0.15 * 100) / 100;
                    const agentCost = Number(form.getFieldValue('agentCostSAR')) || 0;
                    form.setFieldsValue({
                      taxLocalCost: tax,
                      totalOfferCost: localCost + tax + agentCost,
                    });
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
              <Form.Item
                name="agentCostSAR"
                label={t('agentCostSAR')}
                rules={[{ required: true, message: isArabic ? 'مطلوب' : 'Required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t('agentCostSAR')}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                  onChange={(val) => {
                    const agentCost = Number(val) || 0;
                    const localCost = Number(form.getFieldValue('localCost')) || 0;
                    const tax = Number(form.getFieldValue('taxLocalCost')) || 0;
                    form.setFieldsValue({ totalOfferCost: localCost + tax + agentCost });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="totalOfferCost" label={t('totalOfferCost')}>
                <InputNumber
                  style={{ width: '100%', background: '#f0f7ff', fontWeight: 600 }}
                  min={0}
                  placeholder={t('totalOfferCost')}
                  readOnly
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                />
              </Form.Item>
            </Col>

            {/* Visibility switches */}
            <Col xs={24} md={8}>
              <Form.Item
                name="showForExternalCustomers"
                label={t('showForExternalCustomers')}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={isArabic ? 'نعم' : 'Yes'}
                  unCheckedChildren={isArabic ? 'لا' : 'No'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="showForReception"
                label={t('showForReception')}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={isArabic ? 'نعم' : 'Yes'}
                  unCheckedChildren={isArabic ? 'لا' : 'No'}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
