'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Space,
  Dropdown,
  Empty,
  Tooltip,
  Pagination,
  Statistic,
  Modal,
  Form,
  Switch,
  Spin,
  Divider,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  UserOutlined,
  GlobalOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useAgentsPaged,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from '@/hooks/api/useAgents';
import { useNationalities } from '@/hooks/api/useNationalities';
import NationalitySelect from '@/components/common/NationalitySelect';
import {
  AdvancedFilterPanel,
  BranchFilterSelect,
  DynamicFilterFields,
  countDynamicFilters,
  serializeDynamicFilters,
  type DynamicFilterDefinition,
  type DynamicFilterValues,
} from '@/components/filters';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '@/types/api.types';
import type { AgentQuery } from '@/types/filters.types';
import { AGENT_CONTRACT_TYPE, toSelectOptions } from '@/constants/enums';
import styles from './Agents.module.css';

export default function AgentsPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [branchIdFilter, setBranchIdFilter] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [filterValues, setFilterValues] = useState<DynamicFilterValues>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form] = Form.useForm();

  const { data: nationalitiesData = [] } = useNationalities();
  const { mutate: createAgent, isPending: isCreating } = useCreateAgent();
  const { mutate: updateAgent, isPending: isUpdating } = useUpdateAgent();
  const { mutate: deleteAgent } = useDeleteAgent();

  const openDetail = (id: number | string) => router.push(`/agents/${id}`);

  const nationalities = useMemo(() => {
    const raw = Array.isArray(nationalitiesData)
      ? nationalitiesData
      : (nationalitiesData as any)?.$values;
    return Array.isArray(raw) ? raw : [];
  }, [nationalitiesData]);

  const getNationalityOptionValue = (nationality: any) =>
    nationality?.nationalityId ?? nationality?.id ?? nationality?.value;

  const getNationalityName = useCallback((n: any) => {
    if (language === 'ar') {
      return n?.nationalityNameAr || n?.nationalityName || n?.name || '-';
    }
    return n?.nationalityNameEn || n?.nationalityName || n?.name || '-';
  }, [language]);

  const t = useCallback((key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'إدارة الوكلاء', en: 'Agents Management' },
      addAgent: { ar: 'إضافة وكيل جديد', en: 'Add New Agent' },
      searchPlaceholder: { ar: 'البحث عن وكيل...', en: 'Search agents...' },
      filters: { ar: 'الفلاتر', en: 'Filters' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      agentType: { ar: 'نوع الوكيل', en: 'Agent Type' },
      contractType: { ar: 'نوع العقد', en: 'Contract Type' },
      all: { ar: 'الكل', en: 'All' },
      mediation: { ar: 'توسط', en: 'Mediation' },
      operation: { ar: 'تشغيل', en: 'Operation' },
      totalAgents: { ar: 'إجمالي الوكلاء', en: 'Total Agents' },
      activeAgents: { ar: 'وكلاء نشطون', en: 'Active Agents' },
      totalContracts: { ar: 'إجمالي العقود', en: 'Total Contracts' },
      email: { ar: 'البريد الإلكتروني', en: 'Email' },
      licenseNumber: { ar: 'رقم الترخيص', en: 'License Number' },
      phone: { ar: 'الهاتف', en: 'Phone' },
      mobile: { ar: 'الجوال', en: 'Mobile' },
      contracts: { ar: 'عقود', en: 'Contracts' },
      files: { ar: 'ملفات', en: 'Files' },
      view: { ar: 'عرض', en: 'View' },
      edit: { ar: 'تعديل', en: 'Edit' },
      delete: { ar: 'حذف', en: 'Delete' },
      actions: { ar: 'الإجراءات', en: 'Actions' },
      active: { ar: 'نشط', en: 'Active' },
      inactive: { ar: 'غير نشط', en: 'Inactive' },
      noAgents: { ar: 'لا توجد وكلاء', en: 'No Agents Found' },
      print: { ar: 'طباعة', en: 'Print' },
      export: { ar: 'تصدير', en: 'Export' },
      showingResults: { ar: 'عرض النتائج', en: 'Showing Results' },
      createAgent: { ar: 'إنشاء وكيل', en: 'Create Agent' },
      updateAgent: { ar: 'تحديث وكيل', en: 'Update Agent' },
      viewAgent: { ar: 'عرض تفاصيل الوكيل', en: 'View Agent Details' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      submit: { ar: 'حفظ', en: 'Submit' },
      deleteTitle: { ar: 'حذف الوكيل', en: 'Delete Agent' },
      deleteConfirm: {
        ar: 'هل أنت متأكد من حذف هذا الوكيل؟',
        en: 'Are you sure you want to delete this agent?',
      },
      agentNameAr: { ar: 'اسم الوكيل (عربي)', en: 'Agent Name (Arabic)' },
      agentNameEn: { ar: 'اسم الوكيل (إنجليزي)', en: 'Agent Name (English)' },
      username: { ar: 'اسم المستخدم', en: 'Username' },
      addressAr: { ar: 'العنوان (عربي)', en: 'Address (Arabic)' },
      addressEn: { ar: 'العنوان (إنجليزي)', en: 'Address (English)' },
      companyNameAr: { ar: 'اسم الشركة (عربي)', en: 'Company Name (Arabic)' },
      companyNameEn: { ar: 'اسم الشركة (إنجليزي)', en: 'Company Name (English)' },
      followUpEmails: { ar: 'بريد المتابعة', en: 'Follow-up Emails' },
      warrantyEmails: { ar: 'بريد الضمان', en: 'Warranty Emails' },
      accountingEmails: { ar: 'بريد المحاسبة', en: 'Accounting Emails' },
      sendAllEmails: { ar: 'إرسال جميع الإيميلات', en: 'Send All Emails' },
      isActive: { ar: 'نشط', en: 'Is Active' },
      personalInfo: { ar: 'المعلومات الشخصية', en: 'Personal Information' },
      contactInfo: { ar: 'معلومات الاتصال', en: 'Contact Information' },
      companyInfo: { ar: 'معلومات الشركة', en: 'Company Information' },
      emailSettings: { ar: 'إعدادات البريد', en: 'Email Settings' },
      close: { ar: 'إغلاق', en: 'Close' },
    };
    return translations[key]?.[language] || key;
  }, [language]);

  const nationalityOptions = useMemo(
    () =>
      nationalities
        .filter((n: any) => n.isActive !== false)
        .map((n: any) => ({
          value: Number(getNationalityOptionValue(n)),
          label: getNationalityName(n),
        }))
        .filter((option: { value: number; label: string }) => Number.isFinite(option.value)),
    [nationalities, getNationalityName]
  );

  const agentFilterDefinitions = useMemo<DynamicFilterDefinition[]>(
    () => [
      {
        key: 'AgentNameAr',
        apiParameter: 'AgentNameAr',
        matchApiParameter: 'AgentNameArMatch',
        label: t('agentNameAr'),
        type: 'text-match',
      },
      {
        key: 'AgentNameEn',
        apiParameter: 'AgentNameEn',
        matchApiParameter: 'AgentNameEnMatch',
        label: t('agentNameEn'),
        type: 'text-match',
      },
      {
        key: 'Username',
        apiParameter: 'Username',
        matchApiParameter: 'UsernameMatch',
        label: t('username'),
        type: 'text-match',
      },
      {
        key: 'AgentLicense',
        apiParameter: 'AgentLicense',
        matchApiParameter: 'AgentLicenseMatch',
        label: t('licenseNumber'),
        type: 'text-match',
      },
      {
        key: 'Phone',
        apiParameter: 'Phone',
        matchApiParameter: 'PhoneMatch',
        label: t('phone'),
        type: 'text-match',
      },
      {
        key: 'Mobile',
        apiParameter: 'Mobile',
        matchApiParameter: 'MobileMatch',
        label: t('mobile'),
        type: 'text-match',
      },
      {
        key: 'Email',
        apiParameter: 'Email',
        matchApiParameter: 'EmailMatch',
        label: t('email'),
        type: 'text-match',
      },
      {
        key: 'CompanyNameAr',
        apiParameter: 'CompanyNameAr',
        matchApiParameter: 'CompanyNameArMatch',
        label: t('companyNameAr'),
        type: 'text-match',
      },
      {
        key: 'CompanyNameEn',
        apiParameter: 'CompanyNameEn',
        matchApiParameter: 'CompanyNameEnMatch',
        label: t('companyNameEn'),
        type: 'text-match',
      },
      {
        key: 'NationalityId',
        apiParameter: 'NationalityId',
        label: t('nationality'),
        type: 'select',
        options: nationalityOptions,
      },
      {
        key: 'ContractType',
        apiParameter: 'ContractType',
        label: t('contractType'),
        type: 'select',
        options: toSelectOptions([...AGENT_CONTRACT_TYPE], language),
      },
      {
        key: 'SendAllEmails',
        apiParameter: 'SendAllEmails',
        label: t('sendAllEmails'),
        type: 'boolean',
      },
      {
        key: 'IsActive',
        apiParameter: 'IsActive',
        label: t('isActive'),
        type: 'boolean',
      },
      {
        key: 'CreatedDate',
        fromApiParameter: 'CreatedDateFrom',
        toApiParameter: 'CreatedDateTo',
        label: language === 'ar' ? 'Created date' : 'Created date',
        type: 'date-range',
      },
      {
        key: 'UpdatedDate',
        fromApiParameter: 'UpdatedDateFrom',
        toApiParameter: 'UpdatedDateTo',
        label: language === 'ar' ? 'Updated date' : 'Updated date',
        type: 'date-range',
      },
    ],
    [language, nationalityOptions, t]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const agentQuery = useMemo<AgentQuery>(
    () => ({
      ...(serializeDynamicFilters(agentFilterDefinitions, filterValues) as AgentQuery),
      BranchId: branchIdFilter,
      IncludeSubBranches: branchIdFilter ? includeSubBranches : undefined,
      Search: debouncedSearch || undefined,
      PageNumber: currentPage,
      PageSize: pageSize,
    }),
    [
      agentFilterDefinitions,
      filterValues,
      branchIdFilter,
      includeSubBranches,
      debouncedSearch,
      currentPage,
      pageSize,
    ]
  );

  const { data: agentsPage, isLoading } = useAgentsPaged(agentQuery);
  const agents = agentsPage?.items ?? [];
  const totalAgentsCount = agentsPage?.totalCount ?? agents.length;

  const handleFilterValueChange = (key: string, value: unknown) => {
    setFilterValues((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setBranchIdFilter(undefined);
    setIncludeSubBranches(true);
    setFilterValues({});
    setCurrentPage(1);
  };

  const activeFilterCount =
    countDynamicFilters(agentFilterDefinitions, filterValues) +
    (debouncedSearch ? 1 : 0) +
    (branchIdFilter ? 1 : 0);

  const totalContracts = agents.reduce((sum, agent) => sum + (agent.contractsCount || 0), 0);
  const activeAgentsCount = agents.filter((a) => a.isActive).length;

  // Modal handlers
  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      form.setFieldsValue({
        ...agent,
        nationalityId:
          agent.nationalityId !== undefined && agent.nationalityId !== null
            ? agent.nationalityId
            : undefined,
        contractType: agent.contractType !== undefined ? agent.contractType : undefined,
      });
    } else {
      setEditingAgent(null);
      form.resetFields();
      // Set defaults
      form.setFieldsValue({
        sendAllEmails: true,
        isActive: true,
        contractType: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    const nationalityRaw = values.nationalityId;
    const normalizedNationalityId =
      nationalityRaw === undefined || nationalityRaw === null || nationalityRaw === ''
        ? undefined
        : typeof nationalityRaw === 'number'
          ? nationalityRaw
          : /^\d+$/.test(String(nationalityRaw).trim())
            ? Number(nationalityRaw)
            : String(nationalityRaw).trim();

    const agentData: CreateAgentDto = {
      ...values,
      nationalityId: normalizedNationalityId as any,
      contractType: values.contractType !== undefined ? Number(values.contractType) : 0,
      sendAllEmails: Boolean(values.sendAllEmails),
      isActive: Boolean(values.isActive),
    };

    if (editingAgent) {
      updateAgent(
        { id: editingAgent.id, data: agentData as UpdateAgentDto },
        {
          onSuccess: () => {
            handleCloseModal();
          },
        }
      );
    } else {
      createAgent(agentData, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: t('deleteTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('deleteConfirm'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => deleteAgent(id),
    });
  };

  const getNationalityLabel = (nationalityId?: number | string | null) => {
    if (!nationalityId) return 'N/A';
    const id = String(nationalityId);
    const match = nationalities.find((n: any) => String(getNationalityOptionValue(n)) === id);
    if (match) return getNationalityName(match);
    return id;
  };

  const getActionMenu = (agent: Agent): MenuProps => ({
    items: [
      {
        key: 'view',
        label: t('view'),
        icon: <EyeOutlined />,
        onClick: () => openDetail(agent.id),
      },
      {
        key: 'edit',
        label: t('edit'),
        icon: <EditOutlined />,
        onClick: () => handleOpenModal(agent),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: t('delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(agent.id),
      },
    ],
  });

  if (isLoading) {
    return (
      <div className={styles.agentsPage}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Spin size="large" tip={language === 'ar' ? 'جاري التحميل...' : 'Loading...'} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.agentsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <UserOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p style={{ display: 'none' }} className={styles.pageSubtitle}>
                {t('showingResults')}: <strong>{totalAgentsCount}</strong>
              </p>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className={styles.addButton}
              onClick={() => handleOpenModal()}
              loading={isCreating}
            >
              {t('addAgent')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('totalAgents')}
              value={totalAgentsCount}
              prefix={<UserOutlined style={{ color: '#00478C' }} />}
              valueStyle={{ color: '#003366', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('activeAgents')}
              value={activeAgentsCount}
              prefix={<UserOutlined style={{ color: '#00AA64' }} />}
              valueStyle={{ color: '#00AA64', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('totalContracts')}
              value={totalContracts}
              prefix={<FileTextOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ color: '#F59E0B', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        defaultOpen={activeFilterCount > 0}
        quickFilters={
          <>
            <Input
              size="large"
              placeholder={t('searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
              style={{ width: 300 }}
              allowClear
            />
            <BranchFilterSelect
              value={branchIdFilter}
              includeSubBranches={includeSubBranches}
              onChange={(value) => {
                setBranchIdFilter(value);
                setCurrentPage(1);
              }}
              onIncludeSubBranchesChange={(value) => {
                setIncludeSubBranches(value);
                setCurrentPage(1);
              }}
            />
          </>
        }
      >
        <DynamicFilterFields
          definitions={agentFilterDefinitions}
          values={filterValues}
          onChange={handleFilterValueChange}
          lang={language}
        />
      </AdvancedFilterPanel>

      {/* Agents Grid */}
      {agents.length > 0 ? (
        <>
          <Row gutter={[24, 24]} className={styles.agentsGrid}>
            {agents.map((agent) => (
              <Col xs={24} lg={12} key={agent.id}>
                <Card className={styles.agentCard} hoverable>
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.agentHeaderLeft}>
                      <Avatar size={56} icon={<UserOutlined />} className={styles.agentAvatar} />
                      <div className={styles.agentNameSection}>
                        <h3
                          className={styles.agentName}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openDetail(agent.id)}
                        >
                          {language === 'ar'
                            ? agent.agentNameAr
                            : agent.agentNameEn || agent.agentNameAr}
                        </h3>
                        <Tag color={agent.isActive ? 'green' : 'red'} className={styles.statusTag}>
                          {agent.isActive ? t('active') : t('inactive')}
                        </Tag>
                      </div>
                    </div>
                    <Dropdown menu={getActionMenu(agent)} trigger={['click']}>
                      <Button type="text" icon={<MoreOutlined />} className={styles.actionButton} />
                    </Dropdown>
                  </div>

                  {/* Company Info */}
                  {(agent.companyNameAr || agent.companyNameEn) && (
                    <div className={styles.branchInfo}>
                      <GlobalOutlined className={styles.branchIcon} />
                      <span className={styles.branchText}>
                        {language === 'ar'
                          ? agent.companyNameAr
                          : agent.companyNameEn || agent.companyNameAr}
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className={styles.cardContent}>
                    {/* Email */}
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <MailOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('email')}</p>
                        <p className={styles.infoValue}>{agent.email || 'N/A'}</p>
                      </div>
                    </div>

                    {/* License */}
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <SafetyCertificateOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('licenseNumber')}</p>
                        <p className={styles.infoValue}>{agent.agentLicense || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <PhoneOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('phone')}</p>
                        <Space size={4} orientation="vertical">
                          {agent.phone && <p className={styles.infoValue}>{agent.phone}</p>}
                          {agent.mobile && <p className={styles.infoValue}>{agent.mobile}</p>}
                          {!agent.phone && !agent.mobile && <p className={styles.infoValue}>N/A</p>}
                        </Space>
                      </div>
                    </div>

                    {/* Nationality */}
                    {agent.nationalityId && (
                      <div className={styles.infoRow}>
                        <div className={styles.infoIcon}>
                          <GlobalOutlined />
                        </div>
                        <div className={styles.infoContent}>
                          <p className={styles.infoLabel}>{t('nationality')}</p>
                          <p className={styles.infoValue}>
                            {getNationalityLabel(agent.nationalityId)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className={styles.agentStats}>
                      <Tooltip title={t('contracts')}>
                        <div className={styles.statItem}>
                          <FileTextOutlined className={styles.statIcon} />
                          <span className={styles.statValue}>{agent.contractsCount || 0}</span>
                          <span className={styles.statLabel}>{t('contracts')}</span>
                        </div>
                      </Tooltip>
                      <Tooltip title={t('files')}>
                        <div className={styles.statItem}>
                          <PaperClipOutlined className={styles.statIcon} />
                          <span className={styles.statValue}>{agent.filesCount || 0}</span>
                          <span className={styles.statLabel}>{t('files')}</span>
                        </div>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className={styles.cardFooter}>
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => openDetail(agent.id)}
                    >
                      {t('view')}
                    </Button>
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenModal(agent)}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(agent.id)}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div className={styles.paginationWrapper}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalAgentsCount}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              showTotal={(total) => `${t('totalAgents')}: ${total}`}
              pageSizeOptions={[10, 15, 20, 25, 50, 100]}
            />
          </div>
        </>
      ) : (
        <Card>
          <Empty description={t('noAgents')} />
        </Card>
      )}

      {/* Create/Edit Agent Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>{editingAgent ? t('updateAgent') : t('createAgent')}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Divider titlePlacement="left">{t('personalInfo')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('agentNameAr')}
                name="agentNameAr"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input size="large" placeholder={t('agentNameAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('agentNameEn')} name="agentNameEn">
                <Input size="large" placeholder={t('agentNameEn')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('username')} name="username">
                <Input size="large" placeholder={t('username')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('nationality')} name="nationalityId">
                <NationalitySelect
                  size="large"
                  placeholder={t('nationality')}
                  isActiveOnly
                  getOptionValue={getNationalityOptionValue}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('licenseNumber')} name="agentLicense">
                <Input size="large" placeholder={t('licenseNumber')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('contractType')}
                name="contractType"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select
                  size="large"
                  placeholder={t('contractType')}
                  options={toSelectOptions([...AGENT_CONTRACT_TYPE], language)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">{t('contactInfo')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label={t('phone')} name="phone">
                <Input size="large" placeholder={t('phone')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('mobile')} name="mobile">
                <Input size="large" placeholder={t('mobile')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label={t('email')}
                name="email"
                rules={[{ type: 'email', message: 'Invalid email' }]}
              >
                <Input size="large" placeholder={t('email')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('addressAr')} name="addressAr">
                <Input size="large" placeholder={t('addressAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('addressEn')} name="addressEn">
                <Input size="large" placeholder={t('addressEn')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">{t('companyInfo')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label={t('companyNameAr')} name="companyNameAr">
                <Input size="large" placeholder={t('companyNameAr')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('companyNameEn')} name="companyNameEn">
                <Input size="large" placeholder={t('companyNameEn')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">{t('emailSettings')}</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label={t('followUpEmails')} name="followUpEmails">
                <Input size="large" placeholder={t('followUpEmails')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('warrantyEmails')} name="warrantyEmails">
                <Input size="large" placeholder={t('warrantyEmails')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label={t('accountingEmails')} name="accountingEmails">
                <Input size="large" placeholder={t('accountingEmails')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('sendAllEmails')} name="sendAllEmails" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('isActive')} name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={handleCloseModal}>{t('cancel')}</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isUpdating}
              icon={editingAgent ? <EditOutlined /> : <PlusOutlined />}
            >
              {editingAgent ? t('updateAgent') : t('createAgent')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
