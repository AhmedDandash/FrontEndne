'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Select,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  SearchOutlined,
  UserOutlined,
  BankOutlined,
  IdcardOutlined,
  ApartmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useHREmployees } from '@/hooks/api/useHR';
import { useAdminPositions, useDepartments } from '@/hooks/api/useAdmin';
import NationalitySelect from '@/components/common/NationalitySelect';
import { useBranches } from '@/hooks/api/useBranches';
import type { EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto } from '@/types/hr.types';

const { Title } = Typography;

const PAGE_SIZE = 10;

export default function HREmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [form] = Form.useForm();

  const openDetail = (id: string) => router.push(`/hr/employees/${id}`);

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

  const { positions } = useAdminPositions();
  const { departments } = useDepartments();
  const { branches = [] } = useBranches();

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
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
      jobId: record.jobId,
      departmentId: record.departmentId,
      branchId: record.branchId ? String(record.branchId) : undefined,
      nationalityId: record.nationalityId,
      hiringDate: record.hiringDate ? dayjs(record.hiringDate) : undefined,
      isActive: record.isActive ?? true,
      bankName: record.bankName,
      bankAccountNumber: record.bankAccountNumber,
      iban: record.iban,
      userName: record.userName,
    });
    setModalOpen(true);
  };

  const n = (v: unknown) => (v === undefined ? null : v) as any;

  const handleSubmit = async () => {
    const values = await form.validateFields();

    if (editing) {
      const payload: UpdateEmployeeDto = {
        // Backend requires userName on update (400 if missing).
        userName: values.userName ?? editing.userName ?? '',
        employeeNumber: n(values.employeeNumber),
        nameAr: n(values.nameAr),
        nameEn: n(values.nameEn),
        idNumber: n(values.idNumber),
        mobileNumber: n(values.mobileNumber),
        jobId: n(values.jobId),
        departmentId: n(values.departmentId),
        // The list/detail responses omit branchId, so it can't be pre-filled on
        // edit. Only send it when the user actively picks one — otherwise leave
        // it out so the backend keeps the employee's existing branch.
        ...(values.branchId ? { branchId: values.branchId } : {}),
        nationalityId: n(values.nationalityId),
        hiringDate: values.hiringDate ? values.hiringDate.format('YYYY-MM-DD') : null,
        basicSalary: n(values.basicSalary),
        housingAllowance: n(values.housingAllowance),
        mobilityAllowance: n(values.mobilityAllowance),
        otherAllowances: n(values.otherAllowances),
        isActive: values.isActive ?? true,
        bankName: n(values.bankName),
        bankAccountNumber: n(values.bankAccountNumber),
        iban: n(values.iban),
      };
      await updateEmployee({ id: editing.id, data: payload });
    } else {
      const payload: CreateEmployeeDto = {
        email: values.email,
        employeeNumber: n(values.employeeNumber),
        nameAr: n(values.nameAr),
        nameEn: n(values.nameEn),
        idNumber: n(values.idNumber),
        mobileNumber: n(values.mobileNumber),
        jobId: n(values.jobId),
        departmentId: n(values.departmentId),
        branchId: n(values.branchId),
        nationalityId: n(values.nationalityId),
        hiringDate: values.hiringDate ? values.hiringDate.format('YYYY-MM-DD') : null,
        basicSalary: n(values.basicSalary),
        housingAllowance: n(values.housingAllowance),
        mobilityAllowance: n(values.mobilityAllowance),
        otherAllowances: n(values.otherAllowances),
        isActive: values.isActive ?? true,
        bankName: n(values.bankName),
        bankAccountNumber: n(values.bankAccountNumber),
        iban: n(values.iban),
        userName: n(values.userName),
      };
      await createEmployee(payload);
    }
    setModalOpen(false);
    form.resetFields();
  };

  const positionOptions = positions.map((p) => ({
    value: p.id,
    label: p.nameAr || p.nameEn || p.id,
  }));

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.nameAr || d.nameEn || d.id,
  }));

  const branchOptions = (branches as any[]).map((b) => ({
    value: String(b.id),
    label: b.nameAr || b.nameEn || String(b.id),
  }));

  const columns: ColumnsType<EmployeeDto> = [
    {
      title: 'رقم الموظف',
      dataIndex: 'employeeNumber',
      width: 110,
      render: (v) => v || '—',
    },
    {
      title: 'الاسم',
      key: 'name',
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          <a style={{ fontWeight: 500 }} onClick={() => openDetail(r.id)}>{r.nameAr || '—'}</a>
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
      key: 'jobName',
      render: (_, r) => r.jobNameAr || r.jobNameEn || '—',
    },
    {
      title: 'القسم',
      key: 'departmentName',
      render: (_, r) => r.departmentNameAr || r.departmentNameEn || '—',
    },
    {
      title: 'الجنسية',
      key: 'nationalityName',
      render: (_, r) => r.nationalityNameAr || r.nationalityNameEn || '—',
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
          <Tooltip title="عرض التفاصيل">
            <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(record.id)} />
          </Tooltip>
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
              <Button type="text" icon={<KeyOutlined />} loading={isResettingPassword} />
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
              <Button type="text" danger icon={<DeleteOutlined />} loading={isDeleting} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filterOption = (input: string, option?: { label: string; value: string }) =>
    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <UserOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            إدارة الموظفين
          </Title>
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
        title={
          <Space>
            <IdcardOutlined style={{ color: '#1677ff' }} />
            {editing ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          </Space>
        }
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        okText={editing ? 'حفظ التعديلات' : 'إضافة الموظف'}
        cancelText="إلغاء"
        width={800}
        destroyOnHidden
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingTop: 8 } }}
      >
        <Form form={form} layout="vertical">

          {/* ── Section 1: Personal Info ── */}
          <Divider titlePlacement="right">
            <Space size={6}>
              <UserOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>البيانات الشخصية</span>
            </Space>
          </Divider>
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
                <Input placeholder="employee@company.com" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="userName"
                label="اسم المستخدم (للدخول)"
                rules={[{ required: true, message: 'اسم المستخدم مطلوب' }]}
                extra="يُستخدم اسم المستخدم لتسجيل دخول الموظف"
              >
                <Input placeholder="username" />
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
              <Form.Item name="hiringDate" label="تاريخ التعيين">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="اختر التاريخ" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 2: Job & Organisation ── */}
          <Divider titlePlacement="right">
            <Space size={6}>
              <ApartmentOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>بيانات العمل والتنظيم</span>
            </Space>
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="branchId"
                label="الفرع"
                rules={editing ? undefined : [{ required: true, message: 'الفرع مطلوب' }]}
                extra={editing ? 'اتركه فارغاً للإبقاء على الفرع الحالي' : undefined}
              >
                <Select
                  allowClear
                  showSearch
                  placeholder="اختر الفرع"
                  options={branchOptions}
                  filterOption={filterOption}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="departmentId" label="القسم">
                <Select
                  allowClear
                  showSearch
                  placeholder="اختر القسم"
                  options={departmentOptions}
                  filterOption={filterOption}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="jobId" label="المسمى الوظيفي">
                <Select
                  allowClear
                  showSearch
                  placeholder="اختر المسمى الوظيفي"
                  options={positionOptions}
                  filterOption={filterOption}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nationalityId" label="الجنسية">
                <NationalitySelect placeholder="اختر الجنسية" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="isActive" label="حالة الموظف" valuePropName="checked">
                <Switch checkedChildren="نشط" unCheckedChildren="معطّل" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Section 3: Salary ── */}
          <Divider titlePlacement="right">
            <Space size={6}>
              <BankOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>الراتب والبدلات</span>
            </Space>
          </Divider>
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

          {/* ── Section 4: Banking ── */}
          <Divider titlePlacement="right">
            <Space size={6}>
              <BankOutlined style={{ color: '#52c41a' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>البيانات البنكية</span>
            </Space>
          </Divider>
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
          </Row>

        </Form>
      </Modal>
    </div>
  );
}
