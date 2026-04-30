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
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  useMediationOffers,
  useMediationOfferSummary,
  useCreateMediationOffer,
  useUpdateMediationOffer,
  useDeleteMediationOffer,
  useToggleMediationOffer,
} from '@/hooks/api/useMediationOffers';
// import { useNationalities } from '@/hooks/api/useNationalities';
import { useJobs } from '@/hooks/api/useJobs';
// import { useBranches } from '@/hooks/api/useBranches';
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
  const toggleMutation = useToggleMediationOffer();

  // Lookup data
  // const { data: nationalities = [] } = useNationalities();
  const { data: jobs = [] } = useJobs();
  // const { branches: branchList } = useBranches();

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
        offersCount: 'عدد العروض',
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
        branches: 'Branches',
        search: 'Search...',
        nationality: 'Nationality',
        job: 'Job',
        branch: 'Branch',
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
        offersCount: 'Offers Count',
        sar: 'SAR',
        active: 'Active',
        inactive: 'Inactive',
        toggleActive: 'Toggle Active',
      },
    };
    return translations[language]?.[key] || key;
  };

  const sameId = (a: unknown, b: unknown) =>
    a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

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
    (offer: any): string => {
      const apiName = getLocalizedName(
        offer,
        ['nationalityNameEn', 'nationalityName', 'nameEn', 'name'],
        ['nationalityNameAr', 'nationalityName', 'nameAr', 'arabicName']
      );
      if (apiName) return apiName;

      const enumEntry = NATIONALITIES.find((e) => sameId(e.value, offer.nationalityId));
      if (enumEntry) return isArabic ? enumEntry.labelAr : enumEntry.labelEn;

      return offer.nationalityId ? `#${offer.nationalityId}` : '';
    },
    [getLocalizedName, isArabic]
  );

  const getJobDisplayName = useCallback(
    (offer: any): string => {
      const apiName = getLocalizedName(
        offer,
        ['jobNameEn', 'jobName', 'nameEn', 'name'],
        ['jobNameAr', 'jobName', 'nameAr', 'arabicName']
      );
      if (apiName) return apiName;

      const job = (jobs as any[]).find((j) => sameId(j.id, offer.jobId));
      if (job) {
        return (
          getLocalizedName(job, ['jobNameEn', 'nameEn', 'name'], ['jobNameAr', 'nameAr']) ||
          `#${offer.jobId}`
        );
      }

      return offer.jobId ? `#${offer.jobId}` : '';
    },
    [getLocalizedName, jobs]
  );

  // const getBranchDisplayName = useCallback(
  //   (offer: any): string => {
  //     const apiName = getLocalizedName(
  //       offer,
  //       ['branchNameEn', 'branchName', 'nameEn', 'name'],
  //       ['branchNameAr', 'branchName', 'nameAr', 'arabicName']
  //     );
  //     if (apiName) return apiName;

  //     const branch = branches.find((b: any) => sameId(b.id, offer.branchId));
  //     if (branch) return getLocalizedName(branch, ['nameEn', 'name'], ['nameAr', 'arabicName']);

  //     return offer.branchId ? `#${offer.branchId}` : '';
  //   },
  //   [branches, getLocalizedName]
  // );

  // const getAgentDisplayName = useCallback(
  //   (offer: any): string => {
  //     const apiName = getLocalizedName(
  //       offer,
  //       ['agentNameEn', 'agentName', 'nameEn', 'name'],
  //       ['agentNameAr', 'agentName', 'nameAr', 'arabicName']
  //     );
  //     if (apiName) return apiName;

  //     const agent = (agents as any[]).find((a) => sameId(a.id, offer.agentId));
  //     if (agent) {
  //       return (
  //         getLocalizedName(agent, ['agentNameEn', 'nameEn', 'name'], ['agentNameAr', 'nameAr']) ||
  //         `#${offer.agentId}`
  //       );
  //     }

  //     return offer.agentId ? `#${offer.agentId}` : '';
  //   },
  //   [agents, getLocalizedName]
  // );

  // Filtered data
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesNationality =
        nationalityFilter === null || sameId(offer.nationalityId, nationalityFilter);
      const matchesJob = jobFilter === null || sameId(offer.jobId, jobFilter);
      const matchesWorkerType =
        workerTypeFilter === null || sameId(offer.workerType, workerTypeFilter);
      const matchesSearch =
        !searchTerm ||
        getNationalityDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getJobDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase()) ;
        // getBranchDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        // getAgentDisplayName(offer).toLowerCase().includes(searchTerm.toLowerCase());

      return matchesNationality && matchesJob && matchesWorkerType && matchesSearch;
    });
  }, [
    offers,
    nationalityFilter,
    jobFilter,
    workerTypeFilter,
    searchTerm,
    // getAgentDisplayName,
    getJobDisplayName,
    getNationalityDisplayName,
  ]);

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

  const nationalityOptions = useMemo(() => {
    const optionMap = new Map<string, { value: any; label: string }>();
    NATIONALITIES.forEach((n) => {
      optionMap.set(String(n.value), {
        value: n.value,
        label: isArabic ? n.labelAr : n.labelEn,
      });
    });
    offers.forEach((offer: any) => {
      if (offer.nationalityId === null || offer.nationalityId === undefined) return;
      optionMap.set(String(offer.nationalityId), {
        value: offer.nationalityId,
        label: getNationalityDisplayName(offer) || `#${offer.nationalityId}`,
      });
    });
    return Array.from(optionMap.values());
  }, [getNationalityDisplayName, isArabic, offers]);

  // Job select options from API
  const jobOptions = useMemo(() => {
    const optionMap = new Map<string, { value: any; label: string }>();
    (jobs as any[]).forEach((j: any) => {
      optionMap.set(String(j.id), {
        value: j.id,
        label:
          getLocalizedName(j, ['jobNameEn', 'nameEn', 'name'], ['jobNameAr', 'nameAr']) ||
          `#${j.id}`,
      });
    });
    offers.forEach((offer: any) => {
      if (offer.jobId === null || offer.jobId === undefined) return;
      const key = String(offer.jobId);
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          value: offer.jobId,
          label: getJobDisplayName(offer) || `#${offer.jobId}`,
        });
      }
    });
    return Array.from(optionMap.values());
  }, [getJobDisplayName, getLocalizedName, jobs, offers]);

  // Modal handlers
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
    form.setFieldsValue({
      offerNumber: offer.offerNumber,
      nationalityId: offer.nationalityId,
      jobId: offer.jobId,
      workerType: offer.workerType,
      previousExperience: offer.previousExperience,
      salary: offer.salary,
      localCost,
      taxLocalCost,
      agentCostSAR,
      totalOfferCost: offer.totalOfferCost ?? (localCost + taxLocalCost + agentCostSAR),
      showForExternalCustomers: offer.showForExternalCustomers ?? false,
      showForReception: offer.showForReception ?? false,
      isActive: offer.isActive ?? true,
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
        const dto: UpdateMediationContractOfferDto = { ...values, id: editingOffer.id };
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
      title: t('nationality'),
      dataIndex: 'nationalityName',
      key: 'nationalityName',
      render: (text: string, record: MediationContractOffer) => {
        const name = text || getNationalityDisplayName(record);
        if (name) return name;
        return isArabic ? 'غير محدد' : 'N/A';
      },
      sorter: (a, b) => getNationalityDisplayName(a).localeCompare(getNationalityDisplayName(b)),
    },
    {
      title: t('job'),
      dataIndex: 'jobName',
      key: 'jobName',
      render: (text: string, record: MediationContractOffer) =>
        text || getJobDisplayName(record) || (isArabic ? 'غير محدد' : 'N/A'),
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
      title: t('toggleActive'),
      key: 'isActive',
      width: 100,
      render: (_: any, record: MediationContractOffer) => (
        <Switch
          size="small"
          checked={record.isActive !== false}
          loading={toggleMutation.isPending && (toggleMutation.variables as number) === record.id}
          onChange={() => toggleMutation.mutate(record.id)}
          checkedChildren={t('active')}
          unCheckedChildren={t('inactive')}
        />
      ),
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
            onConfirm={() => handleDelete(Number(record.id))}
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
        {/* <Col xs={24} sm={12} md={6}>
          <div className={styles.summaryCard}>
            <Statistic
              title={t('branches')}
              value={stats.branches}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </div>
        </Col> */}
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
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={[16, 0]}>
            {/* Row 1: Offer Number + Nationality + Job */}
            <Col xs={24} md={8}>
              <Form.Item name="offerNumber" label={t('offerNumber')}>
                <InputNumber style={{ width: '100%' }} min={1} placeholder={t('offerNumber')} />
              </Form.Item>
            </Col>
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
                  options={nationalityOptions}
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

            {/* Row 2: Worker Type + Previous Experience */}
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
              <Form.Item name="previousExperience" label={t('previousExperience')}>
                <Select
                  placeholder={t('previousExperience')}
                  allowClear
                  options={toSelectOptions([...PREVIOUS_EXPERIENCE], language)}
                />
              </Form.Item>
            </Col>

            {/* Row 3: Financial fields */}
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
              <Form.Item name="agentCostSAR" label={t('agentCostSAR')}>
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

            {/* Row 4: Visibility & Status switches */}
            <Col xs={24} md={8}>
              <Form.Item name="showForExternalCustomers" label={t('showForExternalCustomers')} valuePropName="checked">
                <Switch
                  checkedChildren={isArabic ? 'نعم' : 'Yes'}
                  unCheckedChildren={isArabic ? 'لا' : 'No'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="showForReception" label={t('showForReception')} valuePropName="checked">
                <Switch
                  checkedChildren={isArabic ? 'نعم' : 'Yes'}
                  unCheckedChildren={isArabic ? 'لا' : 'No'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="isActive" label={t('isActive')} valuePropName="checked">
                <Switch
                  checkedChildren={t('active')}
                  unCheckedChildren={t('inactive')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
