'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Switch,
  Tooltip,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  InputNumber,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useHREmployees } from '@/hooks/api/useHR';
import type { EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto } from '@/types/hr.types';

const { Title } = Typography;

const PAGE_SIZE = 10;

export default function HREmployeesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [form] = Form.useForm();

  const {
    employees,
    totalCount,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    resetPassword,
    isCreating,
    isUpdating,
    isDeleting,
    isResettingPassword,
  } = useHREmployees({ searchName: search || undefined, page, pageSize: PAGE_SIZE });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: EmployeeDto) => {
    setEditing(record);
    form.setFieldsValue({
      employeeNumber: record.employeeNumber,
      nameAr: record.nameAr,
      nameEn: record.nameEn,
      email: record.email,
      idNumber: record.idNumber,
      mobileNumber: record.mobileNumber,
      hiringDate: record.hiringDate ? dayjs(record.hiringDate) : undefined,
      isActive: record.isActive ?? true,
      bankName: record.bankName,
      bankAccountNumber: record.bankAccountNumber,
      iban: record.iban,
      userName: record.userName,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      hiringDate: values.hiringDate ? values.hiringDate.format('YYYY-MM-DD') : undefined,
    };

    if (editing) {
      const { email, ...updatePayload } = payload;
      await updateEmployee({ id: editing.id, data: updatePayload as UpdateEmployeeDto });
    } else {
      await createEmployee(payload as CreateEmployeeDto);
    }
    setModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<EmployeeDto> = [
    {
      title: 'رقم الموظف',
      dataIndex: 'employeeNumber',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'الاسم',
      key: 'name',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{r.nameAr || '—'}</span>
          {r.nameEn && <span style={{ color: '#888', fontSize: 12 }}>{r.nameEn}</span>}
        </Space>
      ),
    },
    {
      title: 'البريد الإلكتروني',
      dataIndex: 'email',
      render: (v) => v || '—',
    },
    {
      title: 'المسمى الوظيفي',
      dataIndex: 'jobName',
      render: (v) => v || '—',
    },
    {
      title: 'القسم',
      dataIndex: 'departmentName',
      render: (v) => v || '—',
    },
    {
      title: 'الجوال',
      dataIndex: 'mobileNumber',
      render: (v) => v || '—',
    },
    {
      title: 'الحالة',
      dataIndex: 'isActive',
      width: 90,
      render: (v) =>
        v ? <Tag color="success">نشط</Tag> : <Tag color="default">معطّل</Tag>,
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="تعديل">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="إعادة تعيين كلمة المرور">
            <Popconfirm
              title="إعادة تعيين كلمة المرور"
              description="هل تريد إعادة تعيين كلمة مرور هذا الموظف؟"
              onConfirm={() => resetPassword(record.id)}
              okText="نعم"
              cancelText="لا"
            >
              <Button
                type="text"
                icon={<KeyOutlined />}
                loading={isResettingPassword}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="تعطيل الموظف">
            <Popconfirm
              title="تعطيل الموظف"
              description="هل تريد تعطيل هذا الموظف؟ لن يتم حذف السجل."
              onConfirm={() => deleteEmployee(record.id)}
              okText="تعطيل"
              cancelText="إلغاء"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <UserOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>إدارة الموظفين</Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
          إضافة موظف
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="البحث بالاسم أو رقم الموظف..."
            allowClear
            style={{ width: 320 }}
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
          />
        </div>

        <Table<EmployeeDto>
          dataSource={employees}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: totalCount,
            onChange: setPage,
            showTotal: (total) => `إجمالي: ${total} موظف`,
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'لا يوجد موظفون' }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        okText={editing ? 'حفظ التعديلات' : 'إضافة'}
        cancelText="إلغاء"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="nameAr" label="الاسم بالعربية">
                <Input placeholder="الاسم الكامل بالعربية" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nameEn" label="الاسم بالإنجليزية">
                <Input placeholder="Full name in English" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="البريد الإلكتروني"
                rules={[
                  { required: !editing, message: 'البريد الإلكتروني مطلوب' },
                  { type: 'email', message: 'بريد إلكتروني غير صحيح' },
                ]}
              >
                <Input
                  placeholder="employee@company.com"
                  disabled={!!editing}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="employeeNumber" label="رقم الموظف">
                <Input placeholder="EMP-001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="idNumber" label="رقم الهوية">
                <Input placeholder="رقم الهوية الوطنية" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="mobileNumber" label="رقم الجوال">
                <Input placeholder="05xxxxxxxx" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="userName" label="اسم المستخدم">
                <Input placeholder="username" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="hiringDate" label="تاريخ التعيين">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 8 }}>الراتب والبدلات</Title>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="basicSalary" label="الراتب الأساسي">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="housingAllowance" label="بدل السكن">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="mobilityAllowance" label="بدل المواصلات">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="otherAllowances" label="بدلات أخرى">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 8 }}>البيانات البنكية</Title>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="bankName" label="اسم البنك">
                <Input placeholder="اسم البنك" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="bankAccountNumber" label="رقم الحساب البنكي">
                <Input placeholder="رقم الحساب" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="iban" label="رقم الآيبان (IBAN)">
                <Input placeholder="SAxx xxxx xxxx xxxx xxxx xxxx" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="isActive" label="حالة الموظف" valuePropName="checked">
                <Switch checkedChildren="نشط" unCheckedChildren="معطّل" defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
