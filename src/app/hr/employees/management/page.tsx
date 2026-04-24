'use client';

import React, { useState } from 'react';
import {
  Table,
  Input,
  Button,
  Row,
  Col,
  Card,
  Tag,
  Space,
  Tooltip,
  Modal,
  Form,
  Select,
  DatePicker,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import {
  useEmployees,
  useHRDepartments,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '@/hooks/api/useHR';
import type { Employee, EmployeesFilterDto, CreateEmployeeDto } from '@/types/hr.types';
import dayjs from 'dayjs';

// ── Employee form used for both create and edit ──────────────────────────────
interface EmployeeFormModalProps {
  open: boolean;
  initial?: Employee | null;
  onClose: () => void;
  isAr: boolean;
}

function EmployeeFormModal({ open, initial, onClose, isAr }: EmployeeFormModalProps) {
  const [form] = Form.useForm();
  const { data: departments = [] } = useHRDepartments();
  const { mutate: createEmp, isPending: creating } = useCreateEmployee();
  const { mutate: updateEmp, isPending: updating } = useUpdateEmployee();

  const isEdit = !!initial;

  // Pre-fill form when editing
  React.useEffect(() => {
    if (open && initial) {
      form.setFieldsValue({
        nameAr: initial.nameAr,
        nameEn: initial.nameEn,
        email: initial.email,
        loginName: initial.loginName,
        idNumber: initial.idNumber,
        mobileNumber: initial.mobileNumber,
        departmentId: initial.departmentId,
        hiringDate: initial.hiringDate ? dayjs(initial.hiringDate) : undefined,
      });
    } else if (open && !initial) {
      form.resetFields();
    }
  }, [open, initial, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const dto: CreateEmployeeDto = {
        nameAr: values.nameAr,
        nameEn: values.nameEn,
        email: values.email ?? null,
        loginName: values.loginName ?? null,
        jobId: values.jobId ?? 1,
        departmentId: values.departmentId,
        nationalityId: values.nationalityId ?? 1,
        idNumber: values.idNumber,
        mobileNumber: values.mobileNumber ?? null,
        hiringDate: values.hiringDate?.format('YYYY-MM-DD') ?? null,
        gender: values.gender ?? 1,
      };

      if (isEdit) {
        updateEmp(
          { id: initial!.id, data: dto },
          { onSuccess: onClose }
        );
      } else {
        createEmp(dto, { onSuccess: onClose });
      }
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={creating || updating}
      title={
        isEdit
          ? isAr ? 'تعديل بيانات الموظف' : 'Edit Employee'
          : isAr ? 'إضافة موظف جديد' : 'Add New Employee'
      }
      width={680}
      okText={isEdit ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة' : 'Add')}
      cancelText={isAr ? 'إلغاء' : 'Cancel'}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="nameAr"
              label={isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}
              rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="nameEn"
              label={isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}
              rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="idNumber"
              label={isAr ? 'رقم الهوية' : 'ID Number'}
              rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="gender"
              label={isAr ? 'الجنس' : 'Gender'}
              rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
            >
              <Select
                options={[
                  { value: 1, label: isAr ? 'ذكر' : 'Male' },
                  { value: 2, label: isAr ? 'أنثى' : 'Female' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="departmentId"
              label={isAr ? 'القسم' : 'Department'}
              rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={departments.map((d) => ({
                  value: d.id,
                  label: isAr ? d.nameAr : d.nameEn,
                }))}
                placeholder={isAr ? 'اختر القسم' : 'Select department'}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="hiringDate" label={isAr ? 'تاريخ التعيين' : 'Hiring Date'}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="mobileNumber" label={isAr ? 'رقم الجوال' : 'Mobile'}>
              <Input maxLength={20} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="loginName" label={isAr ? 'اسم المستخدم' : 'Login Name'}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label={isAr ? 'البريد الإلكتروني' : 'Email'}
              rules={[{ type: 'email', message: isAr ? 'بريد غير صالح' : 'Invalid email' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function EmployeesManagementPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  const [filter, setFilter] = useState<EmployeesFilterDto>({});
  const [search, setSearch] = useState({ nameAr: '', loginName: '', email: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useEmployees(filter);
  const { mutate: deleteEmp, isPending: deleting } = useDeleteEmployee();

  const handleSearch = () => setFilter({ ...search });
  const handleReset = () => {
    setSearch({ nameAr: '', loginName: '', email: '' });
    setFilter({});
  };

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (record: Employee) => {
    setEditTarget(record);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEmp(id);
  };

  const columns: ColumnsType<Employee> = [
    {
      title: isAr ? 'رقم الموظف' : 'Emp. No.',
      dataIndex: 'employeeNumber',
      width: 110,
    },
    {
      title: isAr ? 'الاسم' : 'Name',
      render: (_, r) => (isAr ? r.nameAr : r.nameEn),
    },
    {
      title: isAr ? 'البريد الإلكتروني' : 'Email',
      dataIndex: 'email',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'اسم المستخدم' : 'Login',
      dataIndex: 'loginName',
      render: (v) => v || '—',
    },
    {
      title: isAr ? 'الوظيفة' : 'Job',
      dataIndex: 'jobName',
    },
    {
      title: isAr ? 'القسم' : 'Department',
      dataIndex: 'departmentName',
    },
    {
      title: isAr ? 'رقم الهوية' : 'ID No.',
      dataIndex: 'idNumber',
    },
    {
      title: isAr ? 'الحالة' : 'Status',
      dataIndex: 'isActive',
      render: (v) =>
        v ? (
          <Tag color="success">{isAr ? 'نشط' : 'Active'}</Tag>
        ) : (
          <Tag color="default">{isAr ? 'غير نشط' : 'Inactive'}</Tag>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Space>
          <Tooltip title={isAr ? 'تعديل' : 'Edit'}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
            description={
              isAr
                ? `هل أنت متأكد من حذف ${record.nameAr}؟`
                : `Delete ${record.nameEn}?`
            }
            onConfirm={() => handleDelete(record.id)}
            okText={isAr ? 'حذف' : 'Delete'}
            cancelText={isAr ? 'إلغاء' : 'Cancel'}
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Tooltip title={isAr ? 'حذف' : 'Delete'}>
              <Button type="text" icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader
        title={isAr ? 'إدارة الموظفين' : 'Employees Management'}
        icon={<TeamOutlined />}
        actions={[
          {
            key: 'add',
            label: isAr ? 'إضافة موظف' : 'Add Employee',
            icon: <UserAddOutlined />,
            onClick: openCreate,
          },
        ]}
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12} align="bottom">
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
              </label>
              <Input
                value={search.nameAr}
                onChange={(e) => setSearch((p) => ({ ...p, nameAr: e.target.value }))}
                allowClear
                onPressEnter={handleSearch}
              />
            </div>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'اسم المستخدم' : 'Login Name'}
              </label>
              <Input
                value={search.loginName}
                onChange={(e) => setSearch((p) => ({ ...p, loginName: e.target.value }))}
                allowClear
                onPressEnter={handleSearch}
              />
            </div>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <Input
                value={search.email}
                onChange={(e) => setSearch((p) => ({ ...p, email: e.target.value }))}
                allowClear
                onPressEnter={handleSearch}
              />
            </div>
          </Col>
          <Col>
            <Space>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                {isAr ? 'إعادة تعيين' : 'Reset'}
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {isAr ? 'بحث' : 'Search'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20, showTotal: (t) => `${t} ${isAr ? 'موظف' : 'employees'}` }}
        scroll={{ x: 900 }}
      />

      <EmployeeFormModal
        open={modalOpen}
        initial={editTarget}
        onClose={() => setModalOpen(false)}
        isAr={isAr}
      />
    </div>
  );
}
