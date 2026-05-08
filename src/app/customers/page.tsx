'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Spin,
  Empty,
  Modal,
  Form,
  Avatar,
  Dropdown,
  Divider,
  Tag,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  MoreOutlined,
  EyeOutlined,
  FileTextOutlined,
  SwapOutlined,
  DollarOutlined,
} from '@ant-design/icons';

import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useJobs } from '@/hooks/api/useJobs';
import { useNationalities } from '@/hooks/api/useNationalities';
import RentOfferSelector from '@/components/contracts/RentOfferSelector';
import type {
  Customer,
  CustomerPhoneDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateEmploymentOperatingContractDto,
  EmploymentContractOffer,
} from '@/types/api.types';
import {
  HOUSING_TYPE,
  OPERATION_TYPE,
  PAYMENT_METHOD,
  PREVIOUS_EXPERIENCE,
  MARKETER_SOURCE,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';
import styles from './Customers.module.css';

export default function CustomersPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  // Contract creation modal
  const [isContractModalVisible, setIsContractModalVisible] = useState(false);
  const [selectedCustomerForContract, setSelectedCustomerForContract] = useState<Customer | null>(
    null
  );
  const [contractSelectedOffer, setContractSelectedOffer] =
    useState<EmploymentContractOffer | null>(null);
  const [contractForm] = Form.useForm();

  // Use real API
  const {
    customers,
    isLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomers();

  // Employment operating contracts API
  const { createContract, isCreating: isCreatingContract } = useEmploymentOperatingContracts();

  // Jobs API
  const { data: jobsData, isLoading: isLoadingJobs } = useJobs();

  // Nationalities API
  const { data: nationalitiesData = [] } = useNationalities();

  const nationalities = useMemo(() => {
    const raw = Array.isArray(nationalitiesData)
      ? nationalitiesData
      : (nationalitiesData as any)?.$values;
    return Array.isArray(raw) ? raw : [];
  }, [nationalitiesData]);

  const getNationalityLabel = (n: any) => {
    if (language === 'ar') {
      return n?.nationalityNameAr || n?.nationalityName || n?.name || '-';
    }
    return n?.nationalityNameEn || n?.nationalityName || n?.name || '-';
  };

  // Safely extract jobs array from API response and filter active jobs only
  const jobs = useMemo(() => {
    if (!jobsData) return [];
    let jobsArray: any[] = [];

    if (Array.isArray(jobsData)) {
      jobsArray = jobsData;
    } else if (
      typeof jobsData === 'object' &&
      'data' in jobsData &&
      Array.isArray((jobsData as any).data)
    ) {
      jobsArray = (jobsData as any).data;
    }

    // Filter to only include active jobs
    return jobsArray.filter((job: any) => job.isActive === true);
  }, [jobsData]);

  const t = (key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'إدارة العملاء', en: 'Customer Management' },
      totalCustomers: { ar: 'إجمالي العملاء', en: 'Total Customers' },
      addCustomer: { ar: 'إضافة عميل جديد', en: 'Add New Customer' },
      searchPlaceholder: { ar: 'البحث عن عميل...', en: 'Search customer...' },
      name: { ar: 'الاسم', en: 'Name' },
      arabicName: { ar: 'الاسم بالعربي', en: 'Arabic Name' },
      englishName: { ar: 'الاسم بالإنجليزي', en: 'English Name' },
      // identityNumber: { ar: 'رقم الهوية', en: 'Identity Number' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      mobile: { ar: 'الجوال', en: 'Mobile' },
      city: { ar: 'المدينة', en: 'City' },
      cityAr: { ar: 'المدينة بالعربي', en: 'City (Arabic)' },
      cityEn: { ar: 'المدينة بالإنجليزي', en: 'City (English)' },
      housingType: { ar: 'نوع السكن', en: 'Housing Type' },
      contactInfo: { ar: 'معلومات الاتصال', en: 'Contact Information' },
      personalInfo: { ar: 'المعلومات الشخصية', en: 'Personal Information' },
      actions: { ar: 'الإجراءات', en: 'Actions' },
      edit: { ar: 'تعديل', en: 'Edit' },
      delete: { ar: 'حذف', en: 'Delete' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      confirmDelete: {
        ar: 'هل أنت متأكد من حذف هذا العميل؟',
        en: 'Are you sure you want to delete this customer?',
      },
      deleteTitle: { ar: 'حذف العميل', en: 'Delete Customer' },
      noCustomers: { ar: 'لا يوجد عملاء', en: 'No Customers Found' },
      allCities: { ar: 'كل المدن', en: 'All Cities' },
      active: { ar: 'نشط', en: 'Active' },
      cities: { ar: 'المدن', en: 'Cities' },
    };
    return translations[key]?.[language] || key;
  };

  const getCustomerCityLabel = useCallback(
    (customer: Customer) => {
      return language === 'ar'
        ? (customer.cityAr || customer.cityEn || '').trim()
        : (customer.cityEn || customer.cityAr || '').trim();
    },
    [language]
  );

  useEffect(() => {
    // Reset city filter when switching language to avoid stale value mismatch.
    setCityFilter('all');
  }, [language]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer) => {
      // Collect all phone numbers from phones array for search
      const allPhones = (customer.phones || []).map((p) => p.phoneNumber || '').join(' ');
      const matchesSearch =
        searchText === '' ||
        (customer.arabicName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (customer.englishName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        // (customer.identityNumber || '').includes(searchText) ||
        allPhones.includes(searchText);

      const matchesCity = cityFilter === 'all' || getCustomerCityLabel(customer) === cityFilter;

      return matchesSearch && matchesCity;
    });
  }, [customers, searchText, cityFilter, getCustomerCityLabel]);

  // Get unique cities for filter in the active UI language
  const cities = useMemo(() => {
    if (!customers) return [];
    const citySet = new Set<string>();
    customers.forEach((c) => {
      const label = getCustomerCityLabel(c);
      if (label) citySet.add(label);
    });
    return Array.from(citySet);
  }, [customers, getCustomerCityLabel]);

  // Handler functions
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    // Extract primary phone (or first phone) from phones array
    const primaryPhone =
      customer.phones?.find((p) => p.isPrimary)?.phoneNumber ??
      customer.phones?.[0]?.phoneNumber ??
      '';
    form.setFieldsValue({
      arabicName: customer.arabicName,
      englishName: customer.englishName,
      // identityNumber: customer.identityNumber,
      nationality: customer.nationality,
      mobile: primaryPhone,
      cityAr: customer.cityAr,
      cityEn: customer.cityEn,
      housingType: customer.housingType,
    });
    setIsModalVisible(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Modal.confirm({
      title: t('deleteTitle'),
      content: t('confirmDelete'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        if (customer.id) {
          deleteCustomer(customer.id);
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Transform mobile text field → phones array expected by the API
      const { mobile, ...rest } = values;
      const payload = {
        ...rest,
        phones: mobile
          ? [{ phoneNumber: mobile, type: 1, isPrimary: true } as CustomerPhoneDto]
          : undefined,
      };

      if (editingCustomer && editingCustomer.id) {
        // Update existing customer
        await updateCustomer({
          id: editingCustomer.id,
          data: payload as UpdateCustomerDto,
        });
      } else {
        // Create new customer
        await createCustomer(payload as CreateCustomerDto);
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingCustomer(null);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCreateOperationContract = (customer: Customer) => {
    setSelectedCustomerForContract(customer);
    setContractSelectedOffer(null);
    contractForm.resetFields();
    // Pre-fill customer ID and default values
    contractForm.setFieldsValue({
      customerId: customer.id,
      workersCount: 1,
      previousExperience: 0,
      operationType: 1, // Default to "Duration"
      paymentMethod: 1, // Default to "Cash"
    });
    setIsContractModalVisible(true);
  };

  const handleContractOfferSelect = (offer: EmploymentContractOffer) => {
    setContractSelectedOffer(offer);
    contractForm.setFieldsValue({
      offerId: offer.id,
      nationalityId: offer.nationalityId ?? undefined,
      jobId: offer.jobId ?? undefined,
      duration: offer.duration ?? undefined,
      cost: offer.cost ?? undefined,
      insurance: offer.insurance ?? undefined,
      offerPrice: offer.workerSalary ?? undefined,
    });
  };

  const handleContractSubmit = async () => {
    try {
      const values = await contractForm.validateFields();

      // Clean and format data - convert empty strings to null
      const cleanData: any = {};

      // Number fields that should be null if empty or converted to number
      const numberFields = [
        'customerId',
        'marketerId',
        'contractCategory',
        'offerId',
        'operationType',
        'paymentMethod',
        'nationalityId',
        'jobId',
        'duration',
        'previousExperience',
        'offerPrice',
        'laborManagement',
        'workersCount',
        'cost',
        'insurance',
      ];

      // String fields
      const stringFields = ['workerNameEn', 'workerNameAr', 'workerPhone', 'customerAddress'];

      // Date fields
      const dateFields = ['contractStartDate', 'contractEndDate'];

      // Process number fields
      numberFields.forEach((field) => {
        if (field in values) {
          if (values[field] === '' || values[field] === undefined || values[field] === null) {
            cleanData[field] = null;
          } else {
            const num = Number(values[field]);
            cleanData[field] = isNaN(num) ? null : num;
          }
        }
      });

      // Process string fields
      stringFields.forEach((field) => {
        if (field in values) {
          cleanData[field] =
            values[field] === '' || values[field] === undefined ? null : String(values[field]);
        }
      });

      // Process date fields
      dateFields.forEach((field) => {
        if (values[field]) {
          try {
            const date = new Date(values[field]);
            cleanData[field] = date.toISOString();
          } catch (e) {
            cleanData[field] = null;
          }
        } else {
          cleanData[field] = null;
        }
      });

      const contractData: CreateEmploymentOperatingContractDto = {
        ...cleanData,
        customerId: selectedCustomerForContract?.id || null,
      };

      console.log('Submitting contract data:', JSON.stringify(contractData, null, 2));

      createContract(contractData);

      setIsContractModalVisible(false);
      contractForm.resetFields();
      setSelectedCustomerForContract(null);
    } catch (error) {
      console.error('Contract form validation failed:', error);
    }
  };

  const getActionMenu = (customer: Customer): MenuProps => ({
    items: [
      {
        key: 'view',
        label: language === 'ar' ? 'عرض التفاصيل' : 'View Details',
        icon: <EyeOutlined />,
        onClick: () => console.log('View customer:', customer.id),
      },
      {
        key: 'contracts',
        label: language === 'ar' ? 'عقود الوساطة' : 'Mediation Contracts',
        icon: <FileTextOutlined />,
        onClick: () => router.push(`/contracts/mediationcontract?customerId=${customer.id}`),
      },
      {
        key: 'addMediationContract',
        label: language === 'ar' ? 'إنشاء عقد وساطة' : 'Create Mediation Contract',
        icon: <FileTextOutlined />,
        onClick: () => router.push(`/contracts/mediationcontract/add?customerId=${customer.id}`),
      },
      {
        key: 'transfer',
        label: language === 'ar' ? 'عقود نقل الكفالة' : 'Transfer Contracts',
        icon: <SwapOutlined />,
        onClick: () => console.log('View transfer contracts:', customer.id),
      },
      {
        key: 'rent',
        label: language === 'ar' ? 'عقود التشغيل' : 'Operation Contracts',
        icon: <FileTextOutlined />,
        onClick: () => router.push(`/operation/rent?customerId=${customer.id}`),
      },
      {
        key: 'statement',
        label: language === 'ar' ? 'كشف الحساب' : 'Account Statement',
        icon: <DollarOutlined />,
        onClick: () => console.log('View account statement:', customer.id),
      },
      { type: 'divider' },
      {
        key: 'edit',
        label: t('edit'),
        icon: <EditOutlined />,
        onClick: () => handleEditCustomer(customer),
      },
      {
        key: 'delete',
        label: t('delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteCustomer(customer),
      },
    ],
  });

  // Housing type mapping — backed by HOUSING_TYPE enum
  const getHousingType = (type: string | number | null | undefined) =>
    getEnumLabel([...HOUSING_TYPE], Number(type), language);

  // Nationality display — lookup by id from API data
  const getNationality = (nationality: string | number | null | undefined) => {
    if (!nationality) return '-';
    const id = String(nationality);
    const match = nationalities.find((n: any) => String(n.id ?? n.nationalityId ?? n.value) === id);
    if (match) return getNationalityLabel(match);
    return id;
  };

  return (
    <div className={styles.customersPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <TeamOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p className={styles.pageSubtitle}>
                {t('totalCustomers')}: <strong>{customers?.length || 0}</strong>
              </p>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleAddCustomer}
            loading={isCreating}
          >
            {t('addCustomer')}
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Input
              size="large"
              placeholder={t('searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={styles.searchInput}
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              size="large"
              style={{ width: '100%' }}
              value={cityFilter}
              onChange={setCityFilter}
              placeholder={t('city')}
            >
              <Select.Option value="all">{t('allCities')}</Select.Option>
              {cities.map((city) => (
                <Select.Option key={city} value={city}>
                  {city}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={12}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#E3F2FD' }}>
                <TeamOutlined style={{ color: '#00478C', fontSize: '24px' }} />
              </div>
              <div
                className={styles.statInfo}
                style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
              >
                <p className={styles.statLabel}>{t('totalCustomers')}</p>
                <h3 className={styles.statValue}>{customers?.length || 0}</h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#FFF3E0' }}>
                <EnvironmentOutlined style={{ color: '#F59E0B', fontSize: '24px' }} />
              </div>
              <div
                className={styles.statInfo}
                style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
              >
                <p className={styles.statLabel}>{t('cities')}</p>
                <h3 className={styles.statValue}>{cities.length}</h3>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customers Grid */}
      {isLoading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : filteredCustomers.length > 0 ? (
        <Row gutter={[24, 24]} className={styles.customerGrid}>
          {filteredCustomers.map((customer) => (
            <Col xs={24} lg={12} key={customer.id}>
              <Card className={styles.customerCard} hoverable>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.customerHeaderLeft}>
                    <Avatar size={64} icon={<UserOutlined />} className={styles.customerAvatar} />
                    <div className={styles.customerNameSection}>
                      <h3 className={styles.customerName}>
                        {language === 'ar'
                          ? customer.arabicName
                          : customer.englishName || customer.arabicName}
                      </h3>
                      {customer.englishName && customer.arabicName && (
                        <p style={{ margin: 0, fontSize: 13, color: '#888', fontWeight: 400 }}>
                          {language === 'ar' ? customer.englishName : customer.arabicName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Dropdown menu={getActionMenu(customer)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} className={styles.actionButton} />
                  </Dropdown>
                </div>

                {/* Card Content */}
                <div className={styles.cardContent}>
                  {/* Identity Number */}
                  {/* {customer.identityNumber && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <IdcardOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('identityNumber')}</p>
                        <p className={styles.infoValue}>{customer.identityNumber}</p>
                      </div>
                    </div>
                  )} */}

                  {/* Contact Information — from phones array */}
                  {customer.phones && customer.phones.length > 0 && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <PhoneOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('mobile')}</p>
                        <p className={styles.infoValue}>
                          {(customer.phones.find((p) => p.isPrimary) ?? customer.phones[0])
                            .phoneNumber || '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* City */}
                  {(customer.cityAr || customer.cityEn) && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <EnvironmentOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('city')}</p>
                        <p className={styles.infoValue}>{getCustomerCityLabel(customer)}</p>
                      </div>
                    </div>
                  )}

                  {/* Housing Type */}
                  {customer.housingType && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <HomeOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('housingType')}</p>
                        <p className={styles.infoValue}>{getHousingType(customer.housingType)}</p>
                      </div>
                    </div>
                  )}

                  {/* Nationality */}
                  {customer.nationality && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <IdcardOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('nationality')}</p>
                        <p className={styles.infoValue}>{getNationality(customer.nationality)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() =>
                      router.push(`/contracts/mediationcontract/add?customerId=${customer.id}`)
                    }
                    style={{
                      marginRight: language === 'ar' ? 0 : 8,
                      marginLeft: language === 'ar' ? 8 : 0,
                    }}
                  >
                    {language === 'ar' ? 'إنشاء عقد وساطة' : 'Create Mediation Contract'}
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() => handleCreateOperationContract(customer)}
                    style={{
                      marginRight: language === 'ar' ? 0 : 8,
                      marginLeft: language === 'ar' ? 8 : 0,
                    }}
                  >
                    {language === 'ar' ? 'إنشاء عقد تشغيل' : 'Create Operation Contract'}
                  </Button>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditCustomer(customer)}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteCustomer(customer)}
                    loading={isDeleting}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description={t('noCustomers')} />
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingCustomer ? t('edit') : t('addCustomer')}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingCustomer(null);
        }}
        confirmLoading={isCreating || isUpdating}
        okText={t('save')}
        cancelText={t('cancel')}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('arabicName')}
                name="arabicName"
                rules={[{ required: true, message: 'Please enter Arabic name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder={t('arabicName')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('englishName')} name="englishName">
                <Input prefix={<UserOutlined />} placeholder={t('englishName')} />
              </Form.Item>
            </Col>
          </Row>

          {/* <Form.Item
            label={t('identityNumber')}
            name="identityNumber"
            rules={[{ required: true, message: 'Please enter identity number' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder={t('identityNumber')} />
          </Form.Item> */}

          <Form.Item
            label={t('nationality')}
            name="nationality"
            rules={[{ required: true, message: 'Please select nationality' }]}
          >
            <Select
              placeholder={t('nationality')}
              showSearch
              optionFilterProp="label"
              options={nationalities
                .filter((n: any) => n.isActive !== false)
                .map((n: any) => ({
                  value: String(n.id ?? n.nationalityId ?? n.value),
                  label: getNationalityLabel(n),
                }))}
            />
          </Form.Item>

          <Form.Item
            label={t('mobile')}
            name="mobile"
            rules={[{ required: true, message: 'Please enter mobile number' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder={t('mobile')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('cityAr')}
                name="cityAr"
                rules={[{ required: true, message: 'Please enter city in Arabic' }]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder={t('cityAr')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('cityEn')}
                name="cityEn"
                rules={[{ required: true, message: 'Please enter city in English' }]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder={t('cityEn')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('housingType')}
            name="housingType"
            rules={[{ required: true, message: 'Please select housing type' }]}
          >
            <Select
              placeholder={t('housingType')}
              options={toSelectOptions([...HOUSING_TYPE], language)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Operation Contract Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextOutlined />
            <span>
              {language === 'ar' ? 'إنشاء عقد تشغيل جديد' : 'Create New Operation Contract'}
            </span>
          </div>
        }
        open={isContractModalVisible}
        onOk={handleContractSubmit}
        onCancel={() => {
          setIsContractModalVisible(false);
          contractForm.resetFields();
          setSelectedCustomerForContract(null);
          setContractSelectedOffer(null);
          setContractSelectedOffer(null);
        }}
        confirmLoading={isCreatingContract}
        okText={language === 'ar' ? 'إنشاء العقد' : 'Create Contract'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        width={900}
      >
        {/* {selectedCustomerForContract && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={40} icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 600 }}>{selectedCustomerForContract.arabicName}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {language === 'ar' ? 'الهوية:' : 'ID:'}{' '}
                  {selectedCustomerForContract.identityNumber}
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Offer Selector */}
        <div style={{ marginBottom: 16 }}>
          <RentOfferSelector
            selectedOfferId={contractSelectedOffer?.id}
            onSelect={handleContractOfferSelect}
            language={language as 'ar' | 'en'}
            compact
          />
        </div>

        <Form form={contractForm} layout="vertical">
          <Form.Item name="offerId" hidden>
            <input />
          </Form.Item>

          {/* Customer Information Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'كيف وصلت لنا' : 'How did you reach us'}
                name="marketerId"
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر' : 'Select'}
                  options={toSelectOptions([...MARKETER_SOURCE], language)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'عنوان العميل' : 'Customer Address'}
                name="customerAddress"
              >
                <Input placeholder={language === 'ar' ? 'عنوان العميل' : 'Customer address'} />
              </Form.Item>
            </Col>
          </Row>

          {/* Contract Details Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'تفاصيل العقد' : 'Contract Details'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'نوع العملية' : 'Operation Type'}
                name="operationType"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء اختيار نوع العملية'
                        : 'Please select operation type',
                  },
                ]}
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر نوع العملية' : 'Select operation type'}
                  options={toSelectOptions([...OPERATION_TYPE], language)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'طريقة السداد' : 'Payment Method'}
                name="paymentMethod"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء اختيار طريقة السداد'
                        : 'Please select payment method',
                  },
                ]}
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر طريقة السداد' : 'Select payment method'}
                  options={toSelectOptions([...PAYMENT_METHOD], language)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'الجنسية' : 'Nationality'}
                    {contractSelectedOffer && (
                      <Tag color="green" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="nationalityId"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar' ? 'الرجاء اختيار الجنسية' : 'Please select nationality',
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={language === 'ar' ? 'اختر الجنسية' : 'Select Nationality'}
                  options={nationalities.map((n: any) => ({
                    value: n.id ?? n.nationalityId ?? n.value,
                    label: getNationalityLabel(n),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'المهنة' : 'Job'}
                    {contractSelectedOffer && (
                      <Tag color="blue" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="jobId"
                rules={[
                  {
                    required: true,
                    message: language === 'ar' ? 'الرجاء اختيار المهنة' : 'Please select job',
                  },
                ]}
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر المهنة' : 'Select Job'}
                  loading={isLoadingJobs}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const label = String(option?.label ?? '');
                    return label.toLowerCase().includes(input.toLowerCase());
                  }}
                  options={jobs.map((job: any) => ({
                    value: job.id,
                    label:
                      language === 'ar'
                        ? job.jobNameAr || job.jobNameEn || `Job ${job.id}`
                        : job.jobNameEn || job.jobNameAr || `Job ${job.id}`,
                  }))}
                  notFoundContent={
                    isLoadingJobs ? (
                      <Spin size="small" />
                    ) : (
                      <Empty
                        description={language === 'ar' ? 'لا توجد مهن' : 'No jobs available'}
                      />
                    )
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'مدة العقد' : 'Contract Duration'}
                    {contractSelectedOffer && (
                      <Tag color="orange" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="duration"
              >
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'المدة بالأشهر' : 'Duration in months'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'الخبرة السابقة' : 'Previous Experience'}
                name="previousExperience"
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر' : 'Select'}
                  options={toSelectOptions([...PREVIOUS_EXPERIENCE], language)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'تاريخ بداية العقد' : 'Contract Start Date'}
                name="contractStartDate"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء اختيار تاريخ البداية'
                        : 'Please select start date',
                  },
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'تاريخ نهاية العقد' : 'Contract End Date'}
                name="contractEndDate"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar' ? 'الرجاء اختيار تاريخ النهاية' : 'Please select end date',
                  },
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          {/* Pricing Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'التسعير' : 'Pricing'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'التكلفة' : 'Cost'}
                    {contractSelectedOffer && (
                      <Tag color="green" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="cost"
                rules={[
                  {
                    required: true,
                    message: language === 'ar' ? 'الرجاء إدخال التكلفة' : 'Please enter cost',
                  },
                ]}
              >
                <Input
                  type="number"
                  prefix="SAR"
                  placeholder={language === 'ar' ? 'التكلفة' : 'Cost'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'التأمين' : 'Insurance'}
                    {contractSelectedOffer && (
                      <Tag color="purple" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="insurance"
              >
                <Input
                  type="number"
                  prefix="SAR"
                  placeholder={language === 'ar' ? 'قيمة التأمين' : 'Insurance value'}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Worker Information Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'معلومات العامل' : 'Worker Information'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'اسم العامل (عربي)' : 'Worker Name (Arabic)'}
                name="workerNameAr"
              >
                <Input
                  placeholder={language === 'ar' ? 'اسم العامل بالعربي' : 'Worker name in Arabic'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'اسم العامل (إنجليزي)' : 'Worker Name (English)'}
                name="workerNameEn"
              >
                <Input
                  placeholder={
                    language === 'ar' ? 'اسم العامل بالإنجليزي' : 'Worker name in English'
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'هاتف العامل' : 'Worker Phone'}
                name="workerPhone"
              >
                <Input
                  placeholder={language === 'ar' ? 'رقم هاتف العامل' : 'Worker phone number'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'عدد العمال' : 'Workers Count'}
                name="workersCount"
              >
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'عدد العمال' : 'Number of workers'}
                  defaultValue={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
