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
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  FileProtectOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useBranches } from '@/hooks/api/useBranches';
import type { Branch, BranchDto } from '@/types/api.types';
import styles from './Branch.module.css';

export default function BranchPage() {
  const language = useAuthStore((state) => state.language);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form] = Form.useForm();

  // Use the real API hooks
  const {
    branches,
    isLoading,
    createBranch,
    updateBranch,
    deleteBranch,
    isCreating,
    isUpdating,
    isDeleting,
  } = useBranches();

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
      subBranch: { ar: 'فرع', en: 'Branch' },
      branchType: { ar: 'نوع الفرع', en: 'Branch Type' },
      noBranches: { ar: 'لا توجد فروع', en: 'No Branches Found' },
      totalBranches: { ar: 'إجمالي الفروع', en: 'Total Branches' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      confirmDelete: {
        ar: 'هل أنت متأكد من حذف هذا الفرع؟',
        en: 'Are you sure you want to delete this branch?',
      },
      deleteTitle: { ar: 'حذف الفرع', en: 'Delete Branch' },
    };
    return translations[key]?.[language] || key;
  };

  const filteredBranches = (branches || []).filter((branch) => {
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
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditBranch = (branch: Branch) => {
    console.log('📝 Editing branch:', branch);
    console.log('🆔 Branch ID:', branch.id);

    setEditingBranch(branch);
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
      mainBranch: branch.mainBranch === null ? 1 : 0,
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
      const branchData: BranchDto = values;

      console.log('💾 Submitting branch data:', {
        isEditing: !!editingBranch,
        branchId: editingBranch?.id,
        data: branchData,
      });

      if (editingBranch) {
        if (!editingBranch.id) {
          console.error('❌ Branch ID is missing!', editingBranch);
          message.error('Branch ID is missing. Cannot update.');
          return;
        }
        updateBranch({ id: editingBranch.id, data: branchData });
      } else {
        createBranch(branchData);
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingBranch(null);
  };

  const getActionMenu = (branch: Branch): MenuProps => ({
    items: [
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
                <h3 className={styles.statValue}>{branches?.length || 0}</h3>
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
                  {branches?.filter((b) => b.nameAr || b.nameEn).length || 0}
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
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
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

          <Form.Item
            name="mainBranch"
            label={t('branchType')}
            rules={[{ required: true, message: language === 'ar' ? 'مطلوب' : 'Required' }]}
            initialValue={0}
          >
            <Select placeholder={t('branchType')}>
              <Select.Option value={1}>{t('mainBranch')}</Select.Option>
              <Select.Option value={0}>{t('subBranch')}</Select.Option>
            </Select>
          </Form.Item>

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
        </Form>
      </Modal>
    </div>
  );
}
