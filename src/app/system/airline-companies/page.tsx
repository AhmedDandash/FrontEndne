'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  Statistic,
  Space,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FlagOutlined,
  SettingOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import styles from './AirlineCompanies.module.css';

interface AirlineCompany {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  country: string;
  countryAr: string;
  isActive: boolean;
  createdAt: string;
}

const mockCompanies: AirlineCompany[] = [
  {
    id: '1',
    nameAr: 'الخطوط السعودية',
    nameEn: 'Saudia',
    code: 'SV',
    country: 'Saudi Arabia',
    countryAr: 'السعودية',
    isActive: true,
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    nameAr: 'طيران الإمارات',
    nameEn: 'Emirates',
    code: 'EK',
    country: 'UAE',
    countryAr: 'الإمارات',
    isActive: true,
    createdAt: '2024-01-08',
  },
  {
    id: '3',
    nameAr: 'الخطوط القطرية',
    nameEn: 'Qatar Airways',
    code: 'QR',
    country: 'Qatar',
    countryAr: 'قطر',
    isActive: true,
    createdAt: '2024-01-06',
  },
  {
    id: '4',
    nameAr: 'مصر للطيران',
    nameEn: 'EgyptAir',
    code: 'MS',
    country: 'Egypt',
    countryAr: 'مصر',
    isActive: false,
    createdAt: '2024-01-05',
  },
  {
    id: '5',
    nameAr: 'الخطوط التركية',
    nameEn: 'Turkish Airlines',
    code: 'TK',
    country: 'Turkey',
    countryAr: 'تركيا',
    isActive: true,
    createdAt: '2024-01-03',
  },
  {
    id: '6',
    nameAr: 'طيران ناس',
    nameEn: 'Flynas',
    code: 'XY',
    country: 'Saudi Arabia',
    countryAr: 'السعودية',
    isActive: true,
    createdAt: '2024-01-02',
  },
  {
    id: '7',
    nameAr: 'طيران الخليج',
    nameEn: 'Gulf Air',
    code: 'GF',
    country: 'Bahrain',
    countryAr: 'البحرين',
    isActive: false,
    createdAt: '2023-12-30',
  },
];

export default function AirlineCompaniesPage() {
  const language = useAuthStore((state) => state.language);
  const isRTL = language === 'ar';

  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AirlineCompany | null>(null);
  const [form] = Form.useForm();

  // Translations
  const t = {
    pageTitle: isRTL ? 'شركات الطيران' : 'Airline Companies',
    pageSubtitle: isRTL
      ? 'إدارة جميع شركات الطيران المعتمدة'
      : 'Manage all registered airline companies',
    search: isRTL ? 'بحث...' : 'Search...',
    add: isRTL ? 'إضافة' : 'Add',
    edit: isRTL ? 'تعديل' : 'Edit',
    delete: isRTL ? 'حذف' : 'Delete',
    save: isRTL ? 'حفظ' : 'Save',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    nameAr: isRTL ? 'الاسم بالعربية' : 'Arabic Name',
    nameEn: isRTL ? 'الاسم بالإنجليزية' : 'English Name',
    code: isRTL ? 'رمز الشركة' : 'Company Code',
    country: isRTL ? 'الدولة' : 'Country',
    status: isRTL ? 'الحالة' : 'Status',
    active: isRTL ? 'نشطة' : 'Active',
    inactive: isRTL ? 'غير نشطة' : 'Inactive',
    actions: isRTL ? 'الإجراءات' : 'Actions',
    exportExcel: isRTL ? 'تصدير Excel' : 'Export Excel',
    deleteConfirm: isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?',
    total: isRTL ? 'إجمالي الشركات' : 'Total Companies',
    activeCount: isRTL ? 'الشركات النشطة' : 'Active Companies',
    inactiveCount: isRTL ? 'الشركات غير النشطة' : 'Inactive Companies',
  };

  // Stats
  const stats = useMemo(() => {
    const total = mockCompanies.length;
    const active = mockCompanies.filter((c) => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, []);

  // Filtered data
  const filteredCompanies = useMemo(() => {
    if (!searchText) return mockCompanies;
    const search = searchText.toLowerCase();
    return mockCompanies.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(search) ||
        c.nameEn.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search) ||
        c.countryAr.toLowerCase().includes(search)
    );
  }, [searchText]);

  // Table columns
  const columns: ColumnsType<AirlineCompany> = [
    {
      title: t.nameAr,
      dataIndex: 'nameAr',
      key: 'nameAr',
      sorter: (a, b) => a.nameAr.localeCompare(b.nameAr),
    },
    {
      title: t.nameEn,
      dataIndex: 'nameEn',
      key: 'nameEn',
      sorter: (a, b) => a.nameEn.localeCompare(b.nameEn),
    },
    {
      title: t.code,
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: t.country,
      dataIndex: isRTL ? 'countryAr' : 'country',
      key: 'country',
      width: 140,
      render: (text: string) => (
        <span>
          <FlagOutlined /> {text}
        </span>
      ),
    },
    {
      title: t.status,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? t.active : t.inactive}</Tag>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      width: 120,
      render: (_: unknown, record: AirlineCompany) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className={styles.actionBtn}
          />
          <Popconfirm
            title={t.deleteConfirm}
            onConfirm={() => handleDelete(record.id)}
            okText={t.delete}
            cancelText={t.cancel}
          >
            <Button type="text" danger icon={<DeleteOutlined />} className={styles.actionBtn} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Add/Edit
  const handleAdd = () => {
    setEditingCompany(null);
    form.resetFields();
    setIsModalOpen(true);
  };
  const handleEdit = (record: AirlineCompany) => {
    setEditingCompany(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };
  const handleDelete = (_id: string) => {
    message.success(isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully');
  };
  const handleSave = () => {
    form.validateFields().then((_values) => {
      message.success(
        editingCompany
          ? isRTL
            ? 'تم التعديل بنجاح'
            : 'Updated successfully'
          : isRTL
            ? 'تمت الإضافة بنجاح'
            : 'Added successfully'
      );
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <CloudOutlined />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle}>{t.pageTitle}</h1>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={12} sm={8} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.total}
              value={stats.total}
              prefix={<SettingOutlined style={{ color: '#003366' }} />}
              valueStyle={{ color: '#003366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.activeCount}
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t.inactiveCount}
              value={stats.inactive}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Card */}
      <Card className={styles.mainCard}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <Input
            placeholder={t.search}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className={styles.searchInput}
          />
          <Space>
            <Button icon={<FileExcelOutlined />} className={styles.exportBtn}>
              {t.exportExcel}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className={styles.addBtn}
            >
              {t.add}
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredCompanies}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className={styles.dataTable}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          editingCompany
            ? `${t.edit} - ${isRTL ? editingCompany.nameAr : editingCompany.nameEn}`
            : t.add
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText={t.save}
        cancelText={t.cancel}
        className={styles.entityModal}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className={styles.entityForm}>
          <Form.Item
            name="nameAr"
            label={t.nameAr}
            rules={[{ required: true, message: isRTL ? 'مطلوب' : 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="nameEn"
            label={t.nameEn}
            rules={[{ required: true, message: isRTL ? 'مطلوب' : 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label={t.code}
            rules={[{ required: true, message: isRTL ? 'مطلوب' : 'Required' }]}
          >
            <Input maxLength={3} />
          </Form.Item>
          <Form.Item
            name={isRTL ? 'countryAr' : 'country'}
            label={t.country}
            rules={[{ required: true, message: isRTL ? 'مطلوب' : 'Required' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label={t.status} valuePropName="checked">
            <Select>
              <Select.Option value={true}>{t.active}</Select.Option>
              <Select.Option value={false}>{t.inactive}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
