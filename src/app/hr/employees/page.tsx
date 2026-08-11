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
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  AdvancedFilterPanel,
  BranchFilterSelect,
  DateRangeFilter,
  TextMatchFilter,
  type TextMatchValue,
} from '@/components/filters';
import { useHREmployees } from '@/hooks/api/useHR';
import { useAdminPositions, useDepartments } from '@/hooks/api/useAdmin';
import NationalitySelect from '@/components/common/NationalitySelect';
import { useBranches } from '@/hooks/api/useBranches';
import { linkProps } from '@/lib/navigation/linkProps';
import type { EmployeeDto, CreateEmployeeDto, UpdateEmployeeDto } from '@/types/hr.types';

const { Title } = Typography;

const PAGE_SIZE = 10;

type EmployeeTextFilterKey =
  | 'employeeNumber'
  | 'nameAr'
  | 'nameEn'
  | 'email'
  | 'idNumber'
  | 'mobileNumber'
  | 'userName'
  | 'userId'
  | 'bankName'
  | 'bankAccountNumber'
  | 'iban';

const emptyTextFilters: Record<EmployeeTextFilterKey, TextMatchValue> = {
  employeeNumber: {},
  nameAr: {},
  nameEn: {},
  email: {},
  idNumber: {},
  mobileNumber: {},
  userName: {},
  userId: {},
  bankName: {},
  bankAccountNumber: {},
  iban: {},
};

export default function HREmployeesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDto | null>(null);
  const [form] = Form.useForm();

  // Advanced filters (gap-audit addition).
  const [idFilter, setIdFilter] = useState('');
  const [generalSearchFilter, setGeneralSearchFilter] = useState('');
  const [textFilters, setTextFilters] = useState<Record<EmployeeTextFilterKey, TextMatchValue>>(emptyTextFilters);
  const [departmentIdFilter, setDepartmentIdFilter] = useState<string | undefined>(undefined);
  const [employeePositionIdFilter, setEmployeePositionIdFilter] = useState<string | undefined>(undefined);
  const [nationalityIdFilter, setNationalityIdFilter] = useState<string | undefined>(undefined);
  const [branchIdFilter, setBranchIdFilter] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [hiringDateRange, setHiringDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [createdDateRange, setCreatedDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [updatedDateRange, setUpdatedDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [basicSalaryMinFilter, setBasicSalaryMinFilter] = useState<number | undefined>(undefined);
  const [basicSalaryMaxFilter, setBasicSalaryMaxFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDescending, setSortDescending] = useState<boolean | undefined>(undefined);

  const openDetail = (id: string) => router.push(`/hr/employees/${id}`);
  const textValue = (key: EmployeeTextFilterKey) => textFilters[key].text?.trim() || undefined;
  const textMatch = (key: EmployeeTextFilterKey) =>
    textValue(key) ? textFilters[key].mode : undefined;

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
  } = useHREmployees({
    SearchName: search || undefined,
    Page: page,
    PageNumber: page,
    PageSize: PAGE_SIZE,
    Id: idFilter.trim() || undefined,
    EmployeeNumber: textValue('employeeNumber'),
    EmployeeNumberMatch: textMatch('employeeNumber'),
    NameAr: textValue('nameAr'),
    NameArMatch: textMatch('nameAr'),
    NameEn: textValue('nameEn'),
    NameEnMatch: textMatch('nameEn'),
    Email: textValue('email'),
    EmailMatch: textMatch('email'),
    IdNumber: textValue('idNumber'),
    IdNumberMatch: textMatch('idNumber'),
    MobileNumber: textValue('mobileNumber'),
    MobileNumberMatch: textMatch('mobileNumber'),
    UserName: textValue('userName'),
    UserNameMatch: textMatch('userName'),
    UserId: textValue('userId'),
    UserIdMatch: textMatch('userId'),
    DepartmentId: departmentIdFilter,
    EmployeePositionId: employeePositionIdFilter,
    NationalityId: nationalityIdFilter,
    HiringDateFrom: hiringDateRange[0],
    HiringDateTo: hiringDateRange[1],
    BasicSalaryMin: basicSalaryMinFilter,
    BasicSalaryMax: basicSalaryMaxFilter,
    IsActive: isActiveFilter,
    BankName: textValue('bankName'),
    BankNameMatch: textMatch('bankName'),
    BankAccountNumber: textValue('bankAccountNumber'),
    BankAccountNumberMatch: textMatch('bankAccountNumber'),
    IBAN: textValue('iban'),
    IBANMatch: textMatch('iban'),
    BranchId: branchIdFilter,
    IncludeSubBranches: branchIdFilter ? includeSubBranches : undefined,
    Search: generalSearchFilter.trim() || undefined,
    CreatedDateFrom: createdDateRange[0],
    CreatedDateTo: createdDateRange[1],
    UpdatedDateFrom: updatedDateRange[0],
    UpdatedDateTo: updatedDateRange[1],
    SortBy: sortBy,
    SortDescending: sortDescending,
  });

  const { positions } = useAdminPositions();
  const { departments } = useDepartments();
  const { branches = [] } = useBranches();

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const setTextFilter = (key: EmployeeTextFilterKey, value: TextMatchValue) => {
    setTextFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Count of active advanced filters (for the panel badge / clear button).
  const activeTextFilterCount = (Object.keys(textFilters) as EmployeeTextFilterKey[]).filter(
    (key) => !!textValue(key)
  ).length;
  const activeFilterCount =
    (search ? 1 : 0) +
    (idFilter ? 1 : 0) +
    (generalSearchFilter ? 1 : 0) +
    activeTextFilterCount +
    (departmentIdFilter ? 1 : 0) +
    (employeePositionIdFilter ? 1 : 0) +
    (nationalityIdFilter ? 1 : 0) +
    (branchIdFilter ? 1 : 0) +
    (isActiveFilter !== undefined ? 1 : 0) +
    (hiringDateRange[0] || hiringDateRange[1] ? 1 : 0) +
    (createdDateRange[0] || createdDateRange[1] ? 1 : 0) +
    (updatedDateRange[0] || updatedDateRange[1] ? 1 : 0) +
    (basicSalaryMinFilter !== undefined ? 1 : 0) +
    (basicSalaryMaxFilter !== undefined ? 1 : 0) +
    (sortBy ? 1 : 0);

  const handleClearFilters = () => {
    setSearch('');
    setIdFilter('');
    setGeneralSearchFilter('');
    setTextFilters(emptyTextFilters);
    setDepartmentIdFilter(undefined);
    setEmployeePositionIdFilter(undefined);
    setNationalityIdFilter(undefined);
    setBranchIdFilter(undefined);
    setIncludeSubBranches(true);
    setIsActiveFilter(undefined);
    setHiringDateRange([undefined, undefined]);
    setCreatedDateRange([undefined, undefined]);
    setUpdatedDateRange([undefined, undefined]);
    setBasicSalaryMinFilter(undefined);
    setBasicSalaryMaxFilter(undefined);
    setSortBy(undefined);
    setSortDescending(undefined);
    setPage(1);
  };

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

  const sortOrder = (key: string) =>
    sortBy === key ? (sortDescending ? 'descend' : 'ascend') : null;

  const columns: ColumnsType<EmployeeDto> = [
    {
      title: 'رقم الموظف',
      dataIndex: 'employeeNumber',
      key: 'EmployeeNumber',
      sorter: true,
      sortOrder: sortOrder('EmployeeNumber'),
      width: 110,
      render: (v) => v || '—',
    },
    {
      title: 'الاسم',
      key: 'NameAr',
      sorter: true,
      sortOrder: sortOrder('NameAr'),
      render: (_, r) => (
        <Space orientation="vertical" size={0}>
          <a style={{ fontWeight: 500 }} {...linkProps(`/hr/employees/${r.id}`, router)}>{r.nameAr || '—'}</a>
          {r.nameEn && <span style={{ color: '#888', fontSize: 12 }}>{r.nameEn}</span>}
        </Space>
      ),
    },
    {
      title: 'البريد الإلكتروني',
      dataIndex: 'email',
      key: 'Email',
      sorter: true,
      sortOrder: sortOrder('Email'),
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
      key: 'IsActive',
      sorter: true,
      sortOrder: sortOrder('IsActive'),
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

  const handleTableChange: TableProps<EmployeeDto>['onChange'] = (pagination, _filters, sorter) => {
    setPage(pagination.current ?? 1);
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    if (currentSorter?.order && currentSorter.columnKey) {
      setSortBy(String(currentSorter.columnKey));
      setSortDescending(currentSorter.order === 'descend');
      return;
    }

    setSortBy(undefined);
    setSortDescending(undefined);
  };

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

      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={handleClearFilters}
        contentLayout="block"
        quickFilters={
          <Input.Search
            placeholder="البحث بالاسم أو رقم الموظف..."
            allowClear
            style={{ width: 320 }}
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
          />
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                بحث عام
              </label>
              <Input
                allowClear
                size="large"
                placeholder="Search"
                value={generalSearchFilter}
                onChange={(e) => { setGeneralSearchFilter(e.target.value); setPage(1); }}
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                معرف الموظف
              </label>
              <Input
                allowClear
                size="large"
                placeholder="Employee ID"
                value={idFilter}
                onChange={(e) => { setIdFilter(e.target.value); setPage(1); }}
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                القسم
              </label>
              <Select
                allowClear
                showSearch
                size="large"
                placeholder="اختر القسم"
                style={{ width: '100%' }}
                value={departmentIdFilter}
                onChange={(v) => { setDepartmentIdFilter(v); setPage(1); }}
                options={departmentOptions}
                filterOption={filterOption}
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                المسمى الوظيفي
              </label>
              <Select
                allowClear
                showSearch
                size="large"
                placeholder="اختر المسمى الوظيفي"
                style={{ width: '100%' }}
                value={employeePositionIdFilter}
                onChange={(v) => { setEmployeePositionIdFilter(v); setPage(1); }}
                options={positionOptions}
                filterOption={filterOption}
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                الجنسية
              </label>
              <NationalitySelect
                value={nationalityIdFilter}
                onChange={(value) => { setNationalityIdFilter(value); setPage(1); }}
                allowAdd={false}
                size="large"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                الفرع
              </label>
              <BranchFilterSelect
                value={branchIdFilter}
                onChange={(value) => { setBranchIdFilter(value); setPage(1); }}
                includeSubBranches={includeSubBranches}
                onIncludeSubBranchesChange={(value) => { setIncludeSubBranches(value); setPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                الحالة
              </label>
              <Select
                allowClear
                size="large"
                placeholder="كل الحالات"
                style={{ width: '100%' }}
                value={isActiveFilter}
                onChange={(value) => { setIsActiveFilter(value); setPage(1); }}
                options={[
                  { value: true, label: 'نشط' },
                  { value: false, label: 'معطّل' },
                ]}
              />
            </Col>
          </Row>

          <Divider style={{ margin: 0 }} />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                رقم الموظف
              </label>
              <TextMatchFilter
                value={textFilters.employeeNumber}
                onChange={(value) => setTextFilter('employeeNumber', value)}
                placeholder="رقم الموظف"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                الاسم بالعربية
              </label>
              <TextMatchFilter
                value={textFilters.nameAr}
                onChange={(value) => setTextFilter('nameAr', value)}
                placeholder="الاسم بالعربية"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                الاسم بالإنجليزية
              </label>
              <TextMatchFilter
                value={textFilters.nameEn}
                onChange={(value) => setTextFilter('nameEn', value)}
                placeholder="Name in English"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                البريد الإلكتروني
              </label>
              <TextMatchFilter
                value={textFilters.email}
                onChange={(value) => setTextFilter('email', value)}
                placeholder="Email"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                رقم الهوية
              </label>
              <TextMatchFilter
                value={textFilters.idNumber}
                onChange={(value) => setTextFilter('idNumber', value)}
                placeholder="رقم الهوية"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                رقم الجوال
              </label>
              <TextMatchFilter
                value={textFilters.mobileNumber}
                onChange={(value) => setTextFilter('mobileNumber', value)}
                placeholder="رقم الجوال"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                اسم المستخدم
              </label>
              <TextMatchFilter
                value={textFilters.userName}
                onChange={(value) => setTextFilter('userName', value)}
                placeholder="UserName"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                معرف المستخدم
              </label>
              <TextMatchFilter
                value={textFilters.userId}
                onChange={(value) => setTextFilter('userId', value)}
                placeholder="UserId"
              />
            </Col>
          </Row>

          <Divider style={{ margin: 0 }} />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                اسم البنك
              </label>
              <TextMatchFilter
                value={textFilters.bankName}
                onChange={(value) => setTextFilter('bankName', value)}
                placeholder="اسم البنك"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                رقم الحساب البنكي
              </label>
              <TextMatchFilter
                value={textFilters.bankAccountNumber}
                onChange={(value) => setTextFilter('bankAccountNumber', value)}
                placeholder="رقم الحساب"
              />
            </Col>
            <Col xs={24} md={6}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                رقم الآيبان (IBAN)
              </label>
              <TextMatchFilter
                value={textFilters.iban}
                onChange={(value) => setTextFilter('iban', value)}
                placeholder="IBAN"
              />
            </Col>
            <Col xs={24} md={3}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                أقل راتب أساسي
              </label>
              <InputNumber
                size="large"
                min={0}
                placeholder="أقل راتب"
                value={basicSalaryMinFilter}
                onChange={(v) => { setBasicSalaryMinFilter(v ?? undefined); setPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                أعلى راتب أساسي
              </label>
              <InputNumber
                size="large"
                min={0}
                placeholder="أعلى راتب"
                value={basicSalaryMaxFilter}
                onChange={(v) => { setBasicSalaryMaxFilter(v ?? undefined); setPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                تاريخ التعيين
              </label>
              <DateRangeFilter
                value={hiringDateRange}
                onChange={(range) => { setHiringDateRange(range); setPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                تاريخ الإنشاء
              </label>
              <DateRangeFilter
                value={createdDateRange}
                onChange={(range) => { setCreatedDateRange(range); setPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={8}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155', fontSize: 14 }}>
                تاريخ التحديث
              </label>
              <DateRangeFilter
                value={updatedDateRange}
                onChange={(range) => { setUpdatedDateRange(range); setPage(1); }}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Space>
      </AdvancedFilterPanel>

      <Card>
        <Table<EmployeeDto>
          dataSource={employees}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          onChange={handleTableChange}
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
