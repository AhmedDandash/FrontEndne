'use client';

import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Statistic,
  Pagination,
  Dropdown,
  DatePicker,
  Modal,
  Form,
  message,
  Progress,
  Spin,
  Empty,
  Upload,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CalendarOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileProtectOutlined,
  FolderOpenOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useDocuments } from '@/hooks/api/useDocuments';
import type { Document as ApiDocument } from '@/types/api.types';
import styles from './Documents.module.css';

interface Document {
  id: number;
  name: string;
  nameAr: string;
  type: string;
  typeAr: string;
  documentTypeId?: number | null;
  dateType?: number | null;
  issueDate?: string | null;
  expiryDate: string;
  reminderPeriodMonths?: number | null;
  uploadDate: string;
  status: 'valid' | 'expiring-soon' | 'expired';
  fileSize: string;
  fileType: 'pdf' | 'doc' | 'image' | 'excel';
  fileNameAr?: string | null;
  fileNameEn?: string | null;
  filePath?: string | null;
  description?: string;
  descriptionAr?: string;
}

export default function DocumentsPage() {
  const language = useAuthStore((state) => state.language);
  const {
    documents: apiDocuments,
    isLoading,
    isError,
    createDocument,
    updateDocument,
    deleteDocument,
    isCreating,
    isUpdating,
  } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isRenewModalVisible, setIsRenewModalVisible] = useState(false);
  const [isDocumentModalVisible, setIsDocumentModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [form] = Form.useForm();
  const [documentForm] = Form.useForm();

  // Transform API documents to component format
  const transformedDocuments: Document[] = useMemo(() => {
    return apiDocuments.map((doc: ApiDocument) => {
      const today = new Date();
      const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;

      let status: 'valid' | 'expiring-soon' | 'expired' = 'valid';
      if (expiryDate) {
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry < 0) status = 'expired';
        else if (daysUntilExpiry < 30) status = 'expiring-soon';
      }

      // Determine file type from file path
      const filePath = doc.filePath || '';
      let fileType: 'pdf' | 'doc' | 'image' | 'excel' = 'pdf';
      if (filePath.endsWith('.pdf')) fileType = 'pdf';
      else if (filePath.endsWith('.doc') || filePath.endsWith('.docx')) fileType = 'doc';
      else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png'))
        fileType = 'image';
      else if (filePath.endsWith('.xls') || filePath.endsWith('.xlsx')) fileType = 'excel';

      return {
        id: doc.id,
        name: doc.documentNameEn || doc.documentNameAr || `Document ${doc.id}`,
        nameAr: doc.documentNameAr || doc.documentNameEn || `وثيقة ${doc.id}`,
        type: doc.documentNameEn || 'Unknown',
        typeAr: doc.documentNameAr || 'غير معروف',
        documentTypeId: doc.documentTypeId,
        dateType: doc.dateType,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate || '',
        reminderPeriodMonths: doc.reminderPeriodMonths,
        uploadDate: doc.issueDate || new Date().toISOString().split('T')[0],
        status,
        fileSize: '0 MB', // Size not provided by API
        fileType,
        fileNameAr: doc.fileNameAr,
        fileNameEn: doc.fileNameEn,
        filePath: doc.filePath,
      };
    });
  }, [apiDocuments]);

  // Document types for filtering
  const documentTypes = [
    { value: '1', label: 'Contract', labelAr: 'عقد' },
    { value: '2', label: 'License', labelAr: 'رخصة' },
    { value: '3', label: 'Certificate', labelAr: 'شهادة' },
    { value: '4', label: 'ID Document', labelAr: 'وثيقة هوية' },
    { value: '5', label: 'Insurance', labelAr: 'تأمين' },
    { value: '6', label: 'Tax Document', labelAr: 'وثيقة ضريبية' },
    { value: '7', label: 'Labor Contract', labelAr: 'عقد عمل' },
    { value: '8', label: 'Visa Document', labelAr: 'وثيقة تأشيرة' },
  ];

  const filteredDocuments = useMemo(() => {
    return transformedDocuments.filter((doc) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (language === 'ar' ? doc.nameAr : doc.name).toLowerCase().includes(searchLower) ||
        (language === 'ar' ? doc.typeAr : doc.type).toLowerCase().includes(searchLower);

      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(doc.documentTypeId?.toString() || '');

      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, selectedTypes, selectedStatus, language, transformedDocuments]);

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statistics = {
    total: transformedDocuments.length,
    valid: transformedDocuments.filter((d) => d.status === 'valid').length,
    expiringSoon: transformedDocuments.filter((d) => d.status === 'expiring-soon').length,
    expired: transformedDocuments.filter((d) => d.status === 'expired').length,
  };

  const getStatusColor = (status: string) => {
    const colors = {
      valid: 'success',
      'expiring-soon': 'warning',
      expired: 'error',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const translations = {
      valid: { ar: 'صالح', en: 'Valid' },
      'expiring-soon': { ar: 'ينتهي قريباً', en: 'Expiring Soon' },
      expired: { ar: 'منتهي', en: 'Expired' },
    };
    return translations[status as keyof typeof translations]?.[language] || status;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'doc':
        return '📝';
      case 'image':
        return '🖼️';
      case 'excel':
        return '📊';
      default:
        return '📁';
    }
  };

  const handleRenewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsRenewModalVisible(true);
  };

  const handleRenewSubmit = () => {
    form.validateFields().then(() => {
      message.success(
        language === 'ar'
          ? 'تم تجديد تاريخ انتهاء الوثيقة بنجاح'
          : 'Document expiry date renewed successfully'
      );
      setIsRenewModalVisible(false);
      form.resetFields();
    });
  };

  const handleCreateDocument = () => {
    setModalMode('create');
    setSelectedDocument(null);
    documentForm.resetFields();
    setIsDocumentModalVisible(true);
  };

  const handleEditDocument = (doc: Document) => {
    setModalMode('edit');
    setSelectedDocument(doc);

    // Prepare file list for existing file
    const fileList = doc.filePath
      ? [
          {
            uid: '-1',
            name: doc.fileNameEn || doc.fileNameAr || 'document',
            status: 'done' as const,
            url: doc.filePath,
          },
        ]
      : [];

    documentForm.setFieldsValue({
      documentNameAr: doc.nameAr,
      documentNameEn: doc.name,
      documentTypeId: doc.documentTypeId,
      issueDate: doc.issueDate ? dayjs(doc.issueDate) : undefined,
      expiryDate: doc.expiryDate ? dayjs(doc.expiryDate) : undefined,
      reminderPeriodMonths: doc.reminderPeriodMonths,
      file: fileList,
    });
    setIsDocumentModalVisible(true);
  };

  const handleDeleteDocument = (id: number) => {
    Modal.confirm({
      title: language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      icon: <ExclamationCircleOutlined />,
      content:
        language === 'ar'
          ? 'هل أنت متأكد من حذف هذه الوثيقة؟'
          : 'Are you sure you want to delete this document?',
      okText: language === 'ar' ? 'حذف' : 'Delete',
      okType: 'danger',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      onOk: () => {
        deleteDocument(id);
      },
    });
  };

  const handleDocumentSubmit = () => {
    documentForm.validateFields().then((values) => {
      // Get file information from upload
      const uploadedFile = values.file?.[0];
      const fileName = uploadedFile?.name || '';
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

      const documentData = {
        documentNameAr: values.documentNameAr,
        documentNameEn: values.documentNameEn,
        documentTypeId: values.documentTypeId,
        issueDate: values.issueDate?.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
        reminderPeriodMonths: values.reminderPeriodMonths,
        fileNameAr: fileNameWithoutExt,
        fileNameEn: fileNameWithoutExt,
        filePath: `/uploads/documents/${fileName}`,
      };

      if (modalMode === 'create') {
        createDocument(documentData);
      } else if (selectedDocument) {
        updateDocument({ id: selectedDocument.id, data: documentData });
      }

      setIsDocumentModalVisible(false);
      documentForm.resetFields();
    });
  };

  const getActionMenu = (doc: Document): MenuProps => ({
    items: [
      {
        key: 'renew',
        label: language === 'ar' ? 'تجديد تاريخ الانتهاء' : 'Renew Expiry Date',
        icon: <CalendarOutlined />,
        onClick: () => handleRenewDocument(doc),
      },
      {
        key: 'edit',
        label: language === 'ar' ? 'تعديل' : 'Edit',
        icon: <EditOutlined />,
        onClick: () => handleEditDocument(doc),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: language === 'ar' ? 'حذف' : 'Delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteDocument(doc.id),
      },
    ],
  });

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
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

  // Error state
  if (isError) {
    return (
      <div className={styles.pageContainer}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Empty
            description={
              language === 'ar' ? 'حدث خطأ أثناء تحميل المستندات' : 'Error loading documents'
            }
          >
            <Button type="primary" onClick={() => window.location.reload()}>
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <FileProtectOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>
                {language === 'ar' ? 'إدارة المستندات' : 'Document Management'}
              </h1>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleCreateDocument}
            loading={isCreating}
          >
            {language === 'ar' ? 'إضافة مستند' : 'Add Document'}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
              value={statistics.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={language === 'ar' ? 'صالحة' : 'Valid'}
              value={statistics.valid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#00AA64' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={language === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon'}
              value={statistics.expiringSoon}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={language === 'ar' ? 'منتهية' : 'Expired'}
              value={statistics.expired}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className={styles.filterCard}>
        <Space vertical style={{ width: '100%' }} size={16}>
          <div className={styles.filterHeader}>
            <Space wrap>
              <Input
                size="large"
                placeholder={language === 'ar' ? 'البحث...' : 'Search...'}
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? 'primary' : 'default'}
                size="large"
              >
                {language === 'ar' ? 'الفلاتر' : 'Filters'}
              </Button>
            </Space>
      
          </div>

          {showFilters && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <label className={styles.filterLabel}>
                  {language === 'ar' ? 'نوع المستند' : 'Document Type'}
                </label>
                <Select
                  mode="multiple"
                  size="large"
                  placeholder={language === 'ar' ? 'اختر النوع' : 'Select Type'}
                  value={selectedTypes}
                  onChange={setSelectedTypes}
                  style={{ width: '100%' }}
                  options={documentTypes.map((t) => ({
                    value: t.value,
                    label: language === 'ar' ? t.labelAr : t.label,
                  }))}
                  allowClear
                />
              </Col>

              <Col xs={24} md={12}>
                <label className={styles.filterLabel}>
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </label>
                <Select
                  size="large"
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                    { value: 'valid', label: language === 'ar' ? 'صالح' : 'Valid' },
                    {
                      value: 'expiring-soon',
                      label: language === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon',
                    },
                    { value: 'expired', label: language === 'ar' ? 'منتهي' : 'Expired' },
                  ]}
                />
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      {/* Documents Grid */}
      <Row gutter={[16, 16]}>
        {paginatedDocuments.map((doc) => {
          const daysUntilExpiry = getDaysUntilExpiry(doc.expiryDate);
          const expiryProgress =
            daysUntilExpiry < 0 ? 0 : Math.min(100, (daysUntilExpiry / 365) * 100);

          return (
            <Col xs={24} sm={12} lg={8} key={doc.id}>
              <Card className={styles.documentCard} hoverable>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.documentIcon}>
                    <span className={styles.fileIcon}>{getFileIcon(doc.fileType)}</span>
                  </div>
                  <Dropdown menu={getActionMenu(doc)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>

                {/* Document Info */}
                <div className={styles.documentInfo}>
                  <h3 className={styles.documentName}>
                    {language === 'ar' ? doc.nameAr : doc.name}
                  </h3>
                  <Space size={8} wrap>
                    <Tag color="blue">
                      <FolderOpenOutlined style={{ marginRight: 4 }} />
                      {language === 'ar' ? doc.typeAr : doc.type}
                    </Tag>
                    <Tag color={getStatusColor(doc.status)}>{getStatusText(doc.status)}</Tag>
                  </Space>
                </div>

                {/* File Info */}
                <div className={styles.branchInfo}>
                  <FileTextOutlined />
                  <span>
                    {language === 'ar'
                      ? doc.fileNameAr || doc.fileNameEn || 'ملف المستند'
                      : doc.fileNameEn || doc.fileNameAr || 'Document File'}
                  </span>
                </div>

                {/* Expiry Info */}
                <div className={styles.expirySection}>
                  <div className={styles.expiryHeader}>
                    <span className={styles.expiryLabel}>
                      <CalendarOutlined />
                      {language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                    </span>
                    <span
                      className={styles.expiryDate}
                      style={{
                        color:
                          doc.status === 'expired'
                            ? '#ff4d4f'
                            : doc.status === 'expiring-soon'
                              ? '#faad14'
                              : '#00AA64',
                      }}
                    >
                      {doc.expiryDate}
                    </span>
                  </div>
                  {daysUntilExpiry >= 0 && (
                    <div className={styles.daysRemaining}>
                      <span>
                        {language === 'ar'
                          ? `${daysUntilExpiry} يوم متبقي`
                          : `${daysUntilExpiry} days remaining`}
                      </span>
                      <Progress
                        percent={expiryProgress}
                        showInfo={false}
                        strokeColor={
                          daysUntilExpiry < 30
                            ? '#ff4d4f'
                            : daysUntilExpiry < 90
                              ? '#faad14'
                              : '#00AA64'
                        }
                        size="small"
                      />
                    </div>
                  )}
                  {daysUntilExpiry < 0 && (
                    <div className={styles.expiredBadge}>
                      <WarningOutlined />
                      <span>
                        {language === 'ar'
                          ? `منتهي منذ ${Math.abs(daysUntilExpiry)} يوم`
                          : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                      </span>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className={styles.fileDetails}>
                  <div className={styles.fileDetail}>
                    <span className={styles.detailLabel}>
                      {language === 'ar' ? 'الحجم' : 'Size'}
                    </span>
                    <span className={styles.detailValue}>{doc.fileSize}</span>
                  </div>
                  <div className={styles.fileDetail}>
                    <span className={styles.detailLabel}>
                      {language === 'ar' ? 'تاريخ الرفع' : 'Upload Date'}
                    </span>
                    <span className={styles.detailValue}>{doc.uploadDate}</span>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Pagination */}
      <div className={styles.paginationWrapper}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredDocuments.length}
          onChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          showSizeChanger
          showTotal={(total) =>
            language === 'ar' ? `إجمالي ${total} مستند` : `Total ${total} documents`
          }
          pageSizeOptions={[12, 24, 36, 48]}
        />
      </div>

      {/* Renew Modal */}
      <Modal
        title={language === 'ar' ? 'تجديد تاريخ انتهاء الوثيقة' : 'Renew Document Expiry Date'}
        open={isRenewModalVisible}
        onOk={handleRenewSubmit}
        onCancel={() => {
          setIsRenewModalVisible(false);
          form.resetFields();
        }}
        okText={language === 'ar' ? 'تجديد' : 'Renew'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={language === 'ar' ? 'اسم الوثيقة' : 'Document Name'}
            style={{ marginBottom: 16 }}
          >
            <Input
              value={
                selectedDocument
                  ? language === 'ar'
                    ? selectedDocument.nameAr
                    : selectedDocument.name
                  : ''
              }
              disabled
            />
          </Form.Item>
          <Form.Item
            label={language === 'ar' ? 'تاريخ الانتهاء الحالي' : 'Current Expiry Date'}
            style={{ marginBottom: 16 }}
          >
            <Input value={selectedDocument?.expiryDate} disabled />
          </Form.Item>
          <Form.Item
            name="newExpiryDate"
            label={language === 'ar' ? 'تاريخ الانتهاء الجديد' : 'New Expiry Date'}
            rules={[
              {
                required: true,
                message:
                  language === 'ar'
                    ? 'الرجاء اختيار تاريخ الانتهاء الجديد'
                    : 'Please select new expiry date',
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder={language === 'ar' ? 'اختر التاريخ' : 'Select Date'}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create/Edit Document Modal */}
      <Modal
        title={
          modalMode === 'create'
            ? language === 'ar'
              ? 'إضافة مستند جديد'
              : 'Add New Document'
            : language === 'ar'
              ? 'تعديل المستند'
              : 'Edit Document'
        }
        open={isDocumentModalVisible}
        onOk={handleDocumentSubmit}
        onCancel={() => {
          setIsDocumentModalVisible(false);
          documentForm.resetFields();
        }}
        okText={
          modalMode === 'create'
            ? language === 'ar'
              ? 'إضافة'
              : 'Create'
            : language === 'ar'
              ? 'تحديث'
              : 'Update'
        }
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        confirmLoading={isCreating || isUpdating}
        width={700}
      >
        <Form form={documentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="documentNameAr"
                label={language === 'ar' ? 'اسم المستند (عربي)' : 'Document Name (Arabic)'}
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء إدخال اسم المستند بالعربي'
                        : 'Please enter document name in Arabic',
                  },
                ]}
              >
                <Input placeholder={language === 'ar' ? 'اسم المستند' : 'Document Name'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="documentNameEn"
                label={language === 'ar' ? 'اسم المستند (إنجليزي)' : 'Document Name (English)'}
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء إدخال اسم المستند بالإنجليزي'
                        : 'Please enter document name in English',
                  },
                ]}
              >
                <Input placeholder="Document Name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="documentTypeId"
            label={language === 'ar' ? 'نوع المستند' : 'Document Type'}
            rules={[
              {
                required: true,
                message:
                  language === 'ar' ? 'الرجاء اختيار نوع المستند' : 'Please select document type',
              },
            ]}
          >
            <Select
              placeholder={language === 'ar' ? 'اختر النوع' : 'Select Type'}
              options={documentTypes.map((t) => ({
                value: parseInt(t.value),
                label: language === 'ar' ? t.labelAr : t.label,
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issueDate"
                label={language === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder={language === 'ar' ? 'اختر التاريخ' : 'Select Date'}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label={language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder={language === 'ar' ? 'اختر التاريخ' : 'Select Date'}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reminderPeriodMonths"
            label={language === 'ar' ? 'فترة التذكير (شهور)' : 'Reminder Period (Months)'}
          >
            <Input
              type="number"
              placeholder={language === 'ar' ? 'عدد الشهور' : 'Number of Months'}
            />
          </Form.Item>

          <Form.Item
            name="file"
            label={language === 'ar' ? 'رفع الملف' : 'Upload File'}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload.Dragger
              name="file"
              maxCount={1}
              beforeUpload={() => false}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {language === 'ar'
                  ? 'انقر أو اسحب الملف إلى هذه المنطقة'
                  : 'Click or drag file to this area to upload'}
              </p>
              <p className="ant-upload-hint">
                {language === 'ar'
                  ? 'يدعم PDF, Word, Excel, والصور'
                  : 'Supports PDF, Word, Excel, and Images'}
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
