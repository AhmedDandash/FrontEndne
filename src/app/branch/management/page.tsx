'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Tag,
  Avatar,
  Space,
  Dropdown,
  Badge,
  Empty,
  Tooltip,
  Modal,
  Form,
  Spin,
  message,
  Select,
  Descriptions,
  Divider,
  InputNumber,
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
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  FileProtectOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApartmentOutlined,
  MailOutlined,
  GlobalOutlined,
  IdcardOutlined,
  CalendarOutlined,
  AimOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useBranches } from '@/hooks/api/useBranches';
import type { Branch, BranchDto } from '@/types/api.types';
import { getCurrentPosition, GeolocationError, geolocationErrorMessage } from '@/utils/geolocation';
import LocationPicker from '@/components/branch/LocationPicker';
import styles from './Branch.module.css';

export default function BranchPage() {
  const language = useAuthStore((state) => state.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [selectedMainBranch, setSelectedMainBranch] = useState<number>(1);
  const [viewingBranchId, setViewingBranchId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [form] = Form.useForm();

  // Use the real API hooks
  const {
    branches,
    isLoading,
    useBranch,
    createBranch,
    updateBranch,
    deleteBranch,
    isCreating,
    isUpdating,
    isDeleting,
  } = useBranches();

  const { data: viewBranchData, isLoading: isViewLoading } = useBranch(viewingBranchId ?? '');

  const t = (key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'إدارة الفروع', en: 'Branch Management' },
      addBranch: { ar: 'إضافة فرع جديد', en: 'Add New Branch' },
      searchPlaceholder: { ar: 'البحث عن فرع...', en: 'Search branch...' },
      branchName: { ar: 'اسم الفرع', en: 'Branch Name' },
      branchNameAr: { ar: 'اسم الفرع بالعربي', en: 'Branch Name (Arabic)' },
      branchNameEn: { ar: 'اسم الفرع بالإنجليزي', en: 'Branch Name (English)' },
      address: { ar: 'العنوان', en: 'Address' },
      addressAr: { ar: 'العنوان بالعربي', en: 'Address (Arabic)' },
      addressEn: { ar: 'العنوان بالإنجليزي', en: 'Address (English)' },
      contactInfo: { ar: 'معلومات الاتصال', en: 'Contact Information' },
      phone: { ar: 'الهاتف', en: 'Phone' },
      mobile: { ar: 'الجوال', en: 'Mobile' },
      email: { ar: 'البريد الإلكتروني', en: 'Email' },
      licenseId: { ar: 'رقم الترخيص', en: 'License ID' },
      tradingId: { ar: 'السجل التجاري', en: 'Trading ID' },
      taxNumber: { ar: 'الرقم الضريبي', en: 'Tax Number' },
      edit: { ar: 'تعديل', en: 'Edit' },
      delete: { ar: 'حذف', en: 'Delete' },
      actions: { ar: 'الإجراءات', en: 'Actions' },
      active: { ar: 'نشط', en: 'Active' },
      mainBranch: { ar: 'الفرع الرئيسي', en: 'Main Branch' },
      subBranch: { ar: 'فرع فرعي', en: 'Sub Branch' },
      branchType: { ar: 'نوع الفرع', en: 'Branch Type' },
      parentBranch: { ar: 'الفرع الأصلي', en: 'Parent Branch' },
      subBranches: { ar: 'الفروع الفرعية', en: 'Sub Branches' },
      noBranches: { ar: 'لا توجد فروع', en: 'No Branches Found' },
      totalBranches: { ar: 'إجمالي الفروع', en: 'Total Branches' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      confirmDelete: {
        ar: 'هل أنت متأكد من حذف هذا الفرع؟',
        en: 'Are you sure you want to delete this branch?',
      },
      deleteTitle: { ar: 'حذف الفرع', en: 'Delete Branch' },
      selectParentBranch: { ar: 'اختر الفرع الأصلي', en: 'Select Parent Branch' },
      view: { ar: 'عرض', en: 'View' },
      branchDetails: { ar: 'تفاصيل الفرع', en: 'Branch Details' },
      generalInfo: { ar: 'المعلومات العامة', en: 'General Information' },
      contactDetails: { ar: 'بيانات الاتصال', en: 'Contact Details' },
      officialDocs: { ar: 'الوثائق الرسمية', en: 'Official Documents' },
      zakaInfo: { ar: 'بيانات الزكاة', en: 'Zakat Information' },
      laborLicense: { ar: 'رقم رخصة العمل', en: 'Labor License Number' },
      laborLicenseDate: { ar: 'تاريخ رخصة العمل', en: 'Labor License Date' },
      commercialRegDate: { ar: 'تاريخ السجل التجاري', en: 'Commercial Registration Date' },
      commercialRegIssuedBy: { ar: 'جهة إصدار السجل التجاري', en: 'Commercial Reg. Issued By' },
      poBox: { ar: 'صندوق البريد', en: 'PO Box' },
      postalCode: { ar: 'الرمز البريدي', en: 'Postal Code' },
      managerName: { ar: 'اسم المدير', en: 'Manager Name' },
      embassyBranch: { ar: 'فرع السفارة الفلبينية', en: 'Philippine Embassy Branch' },
      whatsappTemplate: { ar: 'قالب واتساب', en: 'WhatsApp Template' },
      openingConversation: { ar: 'رسالة الترحيب', en: 'Opening Conversation' },
      domain: { ar: 'النطاق', en: 'Domain' },
      appUrl: { ar: 'رابط التطبيق', en: 'App URL' },
      createdDate: { ar: 'تاريخ الإنشاء', en: 'Created Date' },
      createdBy: { ar: 'أنشئ بواسطة', en: 'Created By' },
      parentBranchLabel: { ar: 'الفرع الأصلي', en: 'Parent Branch' },
      geofenceSection: { ar: 'النطاق الجغرافي للحضور', en: 'Attendance Geofence' },
      geofenceHint: {
        ar: 'يُستخدم للتحقق من موقع الموظف عند تسجيل الحضور والانصراف. الفروع بدون إحداثيات تمنع تسجيل حضور موظفيها.',
        en: 'Used to validate employee location on check-in/out. Branches without coordinates block their employees from attendance.',
      },
      latitude: { ar: 'خط العرض', en: 'Latitude' },
      longitude: { ar: 'خط الطول', en: 'Longitude' },
      allowedRadius: { ar: 'نطاق الحضور المسموح (متر)', en: 'Allowed Attendance Radius (m)' },
      useMyLocation: { ar: 'استخدام موقعي الحالي', en: 'Use My Current Location' },
      locationFilled: { ar: 'تم تعبئة الإحداثيات من موقعك الحالي', en: 'Coordinates filled from your current location' },
      geofenceNotConfigured: {
        ar: 'لم يتم ضبط النطاق الجغرافي — حضور موظفي هذا الفرع متوقف',
        en: 'Geofence not configured — attendance is blocked for this branch',
      },
    };
    return translations[key]?.[language] || key;
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      form.setFieldsValue({
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
      });
      message.success(t('locationFilled'));
    } catch (e) {
      message.error(
        e instanceof GeolocationError
          ? geolocationErrorMessage(e)
          : language === 'ar'
            ? 'تعذّر تحديد الموقع'
            : 'Could not determine location'
      );
    } finally {
      setLocating(false);
    }
  };

  const handleMapLocationSelected = (latitude: number, longitude: number) => {
    form.setFieldsValue({
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
    });
    message.success(language === 'ar' ? 'تم تحديد الموقع من الخريطة' : 'Location selected from map');
  };

  // API returns only top-level branches (parentBranchId === null) with subBranches nested
  const topLevelBranches = (branches || []).filter((b) => !b.parentBranchId);

  const filteredBranches = topLevelBranches.filter((branch) => {
    const searchLower = searchTerm.toLowerCase();
    const name = language === 'ar' ? branch.nameAr : branch.nameEn;
    const address = language === 'ar' ? branch.addressAr : branch.addressEn;
    return (
      (name || '').toLowerCase().includes(searchLower) ||
      (address || '').toLowerCase().includes(searchLower) ||
      (branch.branchLicense || '').includes(searchLower) ||
      (branch.taxNumber || '').includes(searchLower)
    );
  });

  const handleAddBranch = () => {
    setEditingBranch(null);
    setSelectedMainBranch(1);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleViewBranch = (branch: Branch) => {
    setViewingBranchId(String(branch.id));
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    const mainBranchVal = branch.mainBranch ?? 1;
    setSelectedMainBranch(mainBranchVal);
    form.setFieldsValue({
      nameAr: branch.nameAr,
      nameEn: branch.nameEn,
      addressAr: branch.addressAr,
      addressEn: branch.addressEn,
      phone: branch.phone,
      mobile: branch.mobile,
      email: branch.email,
      branchLicense: branch.branchLicense,
      commercialRegistrationNumber: branch.commercialRegistrationNumber,
      taxNumber: branch.taxNumber,
      mainBranch: mainBranchVal,
      parentBranchId: branch.parentBranchId ?? undefined,
      latitude: branch.latitude ?? undefined,
      longitude: branch.longitude ?? undefined,
      allowedRadiusMeters: branch.allowedRadiusMeters ?? undefined,
    });
    setIsModalVisible(true);
  };

  const handleDeleteBranch = (branch: Branch) => {
    Modal.confirm({
      title: t('deleteTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('confirmDelete'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => deleteBranch(branch.id),
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const branchData: BranchDto = {
        ...values,
        parentBranchId: values.mainBranch === 0 ? values.parentBranchId : null,
      };

      if (editingBranch) {
        if (!editingBranch.id) {
          message.error('Branch ID is missing. Cannot update.');
          return;
        }
        updateBranch({ id: editingBranch.id, data: branchData });
      } else {
        createBranch(branchData);
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch {
      // validation errors shown inline
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingBranch(null);
    setSelectedMainBranch(1);
  };

  const getActionMenu = (branch: Branch): MenuProps => ({
    items: [
      {
        key: 'view',
        label: t('view'),
        icon: <EyeOutlined />,
        onClick: () => handleViewBranch(branch),
      },
      {
        key: 'edit',
        label: t('edit'),
        icon: <EditOutlined />,
        onClick: () => handleEditBranch(branch),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: t('delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteBranch(branch),
      },
    ],
  });

  return (
    <div className={styles.branchPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <ShopOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleAddBranch}
            loading={isCreating}
          >
            {t('addBranch')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <Input
          size="large"
          placeholder={t('searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          allowClear
        />
      </div>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={8}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#E3F2FD' }}>
                <ShopOutlined style={{ color: '#00478C', fontSize: '24px' }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('totalBranches')}</p>
                <h3 className={styles.statValue}>
                  {(branches || []).reduce(
                    (acc, b) => acc + 1 + (b.subBranches?.length || 0),
                    0
                  )}
                </h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#E8F5E9' }}>
                <CheckCircleOutlined style={{ color: '#00AA64', fontSize: '24px' }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('active')}</p>
                <h3 className={styles.statValue}>
                  {(branches || []).reduce(
                    (acc, b) => acc + 1 + (b.subBranches?.length || 0),
                    0
                  )}
                </h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#FFF3E0' }}>
                <BankOutlined style={{ color: '#F59E0B', fontSize: '24px' }} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{t('mainBranch')}</p>
                <h3 className={styles.statValue}>
                  {branches?.filter((b) => b.mainBranch === 1).length || 0}
                </h3>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Branch Cards Grid */}
      {isLoading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : filteredBranches.length > 0 ? (
        <Row gutter={[24, 24]} className={styles.branchGrid}>
          {filteredBranches.map((branch) => (
            <Col xs={24} lg={12} key={branch.id}>
              <Card className={styles.branchCard} hoverable>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.branchHeaderLeft}>
                    <Avatar size={64} icon={<ShopOutlined />} className={styles.branchAvatar} />
                    <div className={styles.branchNameSection}>
                      <h3 className={styles.branchName}>
                        {language === 'ar' ? branch.nameAr : branch.nameEn}
                      </h3>
                      <Space size={8}>
                        <Badge status="success" text={t('active')} />
                        <Tag
                          color={branch.mainBranch === 1 ? 'blue' : 'default'}
                          className={styles.branchTag}
                        >
                          {branch.mainBranch === 1 ? t('mainBranch') : t('subBranch')}
                        </Tag>
                        {(branch.subBranches?.length ?? 0) > 0 && (
                          <Tag color="purple" icon={<ApartmentOutlined />}>
                            {branch.subBranches!.length} {t('subBranches')}
                          </Tag>
                        )}
                      </Space>
                    </div>
                  </div>
                  <Dropdown menu={getActionMenu(branch)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} className={styles.actionButton} />
                  </Dropdown>
                </div>

                {/* Card Content */}
                <div className={styles.cardContent}>
                  {/* Address */}
                  {(branch.addressAr || branch.addressEn) && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <EnvironmentOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('address')}</p>
                        <p className={styles.infoValue}>
                          {language === 'ar' ? branch.addressAr : branch.addressEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(branch.phone || branch.mobile || branch.email) && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <PhoneOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('contactInfo')}</p>
                        <Space vertical size={4}>
                          {branch.phone && (
                            <p className={styles.infoValue}>
                              {t('phone')}: {branch.phone}
                            </p>
                          )}
                          {branch.mobile && (
                            <p className={styles.infoValue}>
                              {t('mobile')}: {branch.mobile}
                            </p>
                          )}
                          {branch.email && (
                            <p className={styles.infoValue}>
                              {t('email')}: {branch.email}
                            </p>
                          )}
                        </Space>
                      </div>
                    </div>
                  )}

                  {/* Official Documents */}
                  <div className={styles.documentsSection}>
                    <Row gutter={[12, 12]}>
                      {branch.branchLicense && (
                        <Col span={24}>
                          <Tooltip title={t('licenseId')}>
                            <div className={styles.documentItem}>
                              <SafetyCertificateOutlined className={styles.docIcon} />
                              <div>
                                <p className={styles.docLabel}>{t('licenseId')}</p>
                                <p className={styles.docValue}>{branch.branchLicense}</p>
                              </div>
                            </div>
                          </Tooltip>
                        </Col>
                      )}
                      {branch.commercialRegistrationNumber && (
                        <Col span={24}>
                          <Tooltip title={t('tradingId')}>
                            <div className={styles.documentItem}>
                              <BankOutlined className={styles.docIcon} />
                              <div>
                                <p className={styles.docLabel}>{t('tradingId')}</p>
                                <p className={styles.docValue}>
                                  {branch.commercialRegistrationNumber}
                                </p>
                              </div>
                            </div>
                          </Tooltip>
                        </Col>
                      )}
                      {branch.taxNumber && (
                        <Col span={24}>
                          <Tooltip title={t('taxNumber')}>
                            <div className={styles.documentItem}>
                              <FileProtectOutlined className={styles.docIcon} />
                              <div>
                                <p className={styles.docLabel}>{t('taxNumber')}</p>
                                <p className={styles.docValue}>{branch.taxNumber}</p>
                              </div>
                            </div>
                          </Tooltip>
                        </Col>
                      )}
                    </Row>
                  </div>

                  {/* Sub Branches */}
                  {(branch.subBranches?.length ?? 0) > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p className={styles.infoLabel} style={{ marginBottom: 8 }}>
                        <ApartmentOutlined style={{ marginInlineEnd: 6 }} />
                        {t('subBranches')}
                      </p>
                      {branch.subBranches!.map((sub) => (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            marginBottom: 6,
                            background: '#f5f7fa',
                            borderRadius: 6,
                            border: '1px solid #e8ecf0',
                          }}
                        >
                          <Space size={8}>
                            <ApartmentOutlined style={{ color: '#7c3aed' }} />
                            <span style={{ fontSize: 13 }}>
                              {language === 'ar' ? sub.nameAr : sub.nameEn}
                            </span>
                            {sub.phone && (
                              <span style={{ fontSize: 12, color: '#888' }}>{sub.phone}</span>
                            )}
                          </Space>
                          <Space size={4}>
                            <Button
                              type="text"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewBranch(sub)}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditBranch(sub)}
                            />
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteBranch(sub)}
                            />
                          </Space>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewBranch(branch)}
                  >
                    {t('view')}
                  </Button>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditBranch(branch)}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteBranch(branch)}
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
        <Card>
          <Empty description={t('noBranches')} />
        </Card>
      )}

      {/* Add/Edit Branch Modal */}
      <Modal
        title={editingBranch ? t('edit') : t('addBranch')}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        confirmLoading={isCreating || isUpdating}
        okText={t('save')}
        cancelText={t('cancel')}
        width={700}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nameAr"
                label={t('branchNameAr')}
                rules={[{ required: true, message: 'مطلوب' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nameEn"
                label={t('branchNameEn')}
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={selectedMainBranch === 0 ? 12 : 24}>
              <Form.Item
                name="mainBranch"
                label={t('branchType')}
                rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
                initialValue={1}
              >
                <Select
                  placeholder={t('branchType')}
                  onChange={(val) => {
                    setSelectedMainBranch(val);
                    form.setFieldValue('parentBranchId', undefined);
                  }}
                >
                  <Select.Option value={1}>{t('mainBranch')}</Select.Option>
                  <Select.Option value={0}>{t('subBranch')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            {selectedMainBranch === 0 && (
              <Col span={12}>
                <Form.Item
                  name="parentBranchId"
                  label={t('parentBranch')}
                  rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
                >
                  <Select placeholder={t('selectParentBranch')} allowClear>
                    {topLevelBranches.map((b) => (
                      <Select.Option key={String(b.id)} value={String(b.id)}>
                        {language === 'ar' ? b.nameAr : b.nameEn}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="addressAr" label={t('addressAr')}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="addressEn" label={t('addressEn')}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label={t('phone')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="mobile" label={t('mobile')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label={t('email')}>
                <Input type="email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="branchLicense" label={t('licenseId')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="commercialRegistrationNumber" label={t('tradingId')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="taxNumber" label={t('taxNumber')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Attendance Geofence ── */}
          <Divider titlePlacement="start" style={{ marginTop: 8 }}>
            <Space>
              <AimOutlined />
              {t('geofenceSection')}
            </Space>
          </Divider>
          <p style={{ color: '#888', fontSize: 12, marginTop: -4, marginBottom: 12 }}>
            {t('geofenceHint')}
          </p>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="latitude"
                label={t('latitude')}
                rules={[
                  { required: true, message: language === 'ar' ? 'مطلوب' : 'Required' },
                  {
                    type: 'number',
                    min: -90,
                    max: 90,
                    message: language === 'ar' ? 'بين -90 و 90' : 'Between -90 and 90',
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  step={0.000001}
                  placeholder="24.7136"
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="longitude"
                label={t('longitude')}
                rules={[
                  { required: true, message: language === 'ar' ? 'مطلوب' : 'Required' },
                  {
                    type: 'number',
                    min: -180,
                    max: 180,
                    message: language === 'ar' ? 'بين -180 و 180' : 'Between -180 and 180',
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  step={0.000001}
                  placeholder="46.6753"
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="allowedRadiusMeters"
                label={t('allowedRadius')}
                rules={[
                  { required: true, message: language === 'ar' ? 'مطلوب' : 'Required' },
                  {
                    type: 'number',
                    min: 1,
                    message: language === 'ar' ? 'أكبر من صفر' : 'Must be greater than 0',
                  },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} precision={0} placeholder="150" />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button icon={<AimOutlined />} onClick={handleUseMyLocation} loading={locating}>
              {t('useMyLocation')}
            </Button>
            <Button icon={<PushpinOutlined />} onClick={() => setShowMapPicker(true)}>
              {language === 'ar' ? 'اختر من الخريطة' : 'Select from Map'}
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleMapLocationSelected}
        initialLat={form.getFieldValue('latitude') || 24.7136}
        initialLng={form.getFieldValue('longitude') || 46.6753}
        language={language as 'ar' | 'en'}
      />

      {/* Branch Detail Modal */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            {t('branchDetails')}
            {viewBranchData && (
              <Tag color={viewBranchData.mainBranch === 1 ? 'blue' : 'purple'}>
                {viewBranchData.mainBranch === 1 ? t('mainBranch') : t('subBranch')}
              </Tag>
            )}
          </Space>
        }
        open={!!viewingBranchId}
        onCancel={() => setViewingBranchId(null)}
        width={720}
        footer={
          viewBranchData
            ? [
                <Button key="close" onClick={() => setViewingBranchId(null)}>
                  {t('cancel')}
                </Button>,
                <Button
                  key="edit"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setViewingBranchId(null);
                    handleEditBranch(viewBranchData);
                  }}
                >
                  {t('edit')}
                </Button>,
              ]
            : null
        }
      >
        {isViewLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : viewBranchData ? (
          <>
            {/* General Info */}
            <Descriptions
              title={
                <Space>
                  <IdcardOutlined />
                  {t('generalInfo')}
                </Space>
              }
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label={t('branchNameAr')} span={1}>
                {viewBranchData.nameAr || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('branchNameEn')} span={1}>
                {viewBranchData.nameEn || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('branchType')} span={2}>
                <Tag color={viewBranchData.mainBranch === 1 ? 'blue' : 'purple'}>
                  {viewBranchData.mainBranch === 1 ? t('mainBranch') : t('subBranch')}
                </Tag>
              </Descriptions.Item>
              {viewBranchData.parentBranchId && (
                <Descriptions.Item label={t('parentBranchLabel')} span={2}>
                  {language === 'ar'
                    ? viewBranchData.parentBranchNameAr
                    : viewBranchData.parentBranchNameEn}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('managerName')} span={2}>
                {viewBranchData.managerNameAr || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('addressAr')} span={1}>
                {viewBranchData.addressAr || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('addressEn')} span={1}>
                {viewBranchData.addressEn || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('poBox')} span={1}>
                {viewBranchData.poBox || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('postalCode')} span={1}>
                {viewBranchData.postalCode || '—'}
              </Descriptions.Item>
              {viewBranchData.domain && (
                <Descriptions.Item label={t('domain')} span={1}>
                  <GlobalOutlined style={{ marginInlineEnd: 4 }} />
                  {viewBranchData.domain}
                </Descriptions.Item>
              )}
              {viewBranchData.appUrl && (
                <Descriptions.Item label={t('appUrl')} span={1}>
                  {viewBranchData.appUrl}
                </Descriptions.Item>
              )}
              {viewBranchData.createdDate && (
                <Descriptions.Item label={t('createdDate')} span={1}>
                  <CalendarOutlined style={{ marginInlineEnd: 4 }} />
                  {new Date(viewBranchData.createdDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {viewBranchData.createdBy !== undefined && (
                <Descriptions.Item label={t('createdBy')} span={1}>
                  {viewBranchData.createdBy || '—'}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Contact Details */}
            <Descriptions
              title={
                <Space>
                  <PhoneOutlined />
                  {t('contactDetails')}
                </Space>
              }
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label={t('phone')} span={1}>
                {viewBranchData.phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('mobile')} span={1}>
                {viewBranchData.mobile || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('email')} span={2}>
                {viewBranchData.email ? (
                  <Space>
                    <MailOutlined />
                    {viewBranchData.email}
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              {viewBranchData.whatsAppWelcomeTemplate && (
                <Descriptions.Item label={t('whatsappTemplate')} span={2}>
                  {viewBranchData.whatsAppWelcomeTemplate}
                </Descriptions.Item>
              )}
              {viewBranchData.openingConversation && (
                <Descriptions.Item label={t('openingConversation')} span={2}>
                  {viewBranchData.openingConversation}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Official Documents */}
            <Descriptions
              title={
                <Space>
                  <SafetyCertificateOutlined />
                  {t('officialDocs')}
                </Space>
              }
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label={t('licenseId')} span={2}>
                {viewBranchData.branchLicense || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('tradingId')} span={1}>
                {viewBranchData.commercialRegistrationNumber || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('commercialRegDate')} span={1}>
                {viewBranchData.commercialRegistrationDate
                  ? new Date(viewBranchData.commercialRegistrationDate).toLocaleDateString()
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('commercialRegIssuedBy')} span={2}>
                {viewBranchData.commercialRegistrationIssuedByAr || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('laborLicense')} span={1}>
                {viewBranchData.laborLicenseNumber || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('laborLicenseDate')} span={1}>
                {viewBranchData.laborLicenseDate
                  ? new Date(viewBranchData.laborLicenseDate).toLocaleDateString()
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('taxNumber')} span={1}>
                {viewBranchData.taxNumber || '—'}
              </Descriptions.Item>
              {viewBranchData.philippineEmbassyBranch && (
                <Descriptions.Item label={t('embassyBranch')} span={1}>
                  {viewBranchData.philippineEmbassyBranch}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Attendance Geofence */}
            <Descriptions
              title={
                <Space>
                  <AimOutlined />
                  {t('geofenceSection')}
                </Space>
              }
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label={t('latitude')} span={1}>
                {viewBranchData.latitude ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('longitude')} span={1}>
                {viewBranchData.longitude ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('allowedRadius')} span={2}>
                {viewBranchData.allowedRadiusMeters != null
                  ? `${viewBranchData.allowedRadiusMeters} ${language === 'ar' ? 'متر' : 'm'}`
                  : '—'}
              </Descriptions.Item>
              {viewBranchData.latitude != null && viewBranchData.longitude != null ? (
                <Descriptions.Item label=" " span={2}>
                  <a
                    href={`https://www.google.com/maps?q=${viewBranchData.latitude},${viewBranchData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <EnvironmentOutlined style={{ marginInlineEnd: 4 }} />
                    {language === 'ar' ? 'عرض على الخريطة' : 'View on map'}
                  </a>
                </Descriptions.Item>
              ) : (
                <Descriptions.Item span={2}>
                  <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                    {t('geofenceNotConfigured')}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Zakat Info */}
            {(viewBranchData.zaka_RegistrationNameAr ||
              viewBranchData.zaka_TaxNumber ||
              viewBranchData.zaka_City_Name) && (
              <>
                <Divider />
                <Descriptions
                  title={
                    <Space>
                      <BankOutlined />
                      {t('zakaInfo')}
                    </Space>
                  }
                  bordered
                  size="small"
                  column={2}
                >
                  <Descriptions.Item label="اسم التسجيل" span={2}>
                    {viewBranchData.zaka_RegistrationNameAr || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="رقم السجل التجاري" span={1}>
                    {viewBranchData.zaka_Commercial_Registration_Number || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الرقم الضريبي" span={1}>
                    {viewBranchData.zaka_TaxNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="المدينة" span={1}>
                    {viewBranchData.zaka_City_Name || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الرمز البريدي" span={1}>
                    {viewBranchData.zaka_Postal_Zone || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الحي" span={1}>
                    {viewBranchData.zaka_DistrictAr || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="رقم المبنى" span={1}>
                    {viewBranchData.zaka_BuildingNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الشارع" span={2}>
                    {viewBranchData.zaka_StreetAr || '—'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </>
        ) : null}
      </Modal>
    </div>
  );
}
