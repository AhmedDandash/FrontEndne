'use client';

import { useState, useRef } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  Row,
  Col,
  Descriptions,
  Typography,
  Table,
  InputNumber,
  Switch,
  Popconfirm,
  Modal,
  Space,
  Tooltip,
  Divider,
  message,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHREmployees, useHRCustodyRequest, useHRCustodyTypes } from '@/hooks/api/useHR';
import type { CreateCustodyRequestDto, CustodyItemDto, CreateCustodyTypeDto } from '@/types/hr.types';
import type { EmployeeDto } from '@/types/hr.types';

const { Title } = Typography;
const { TextArea } = Input;

interface ItemRow extends CustodyItemDto {
  _key: number;
}

export default function CustodyRequestPage() {
  const [form] = Form.useForm();
  const [typeForm] = Form.useForm();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDto | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [addTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const rowCounter = useRef(0);

  const { employees, isLoading: isLoadingEmployees } = useHREmployees({ pageSize: 200 });
  const { custodyTypes, isLoading: isLoadingTypes, createCustodyType, isCreatingType } = useHRCustodyTypes();
  const { createCustodyRequest, isCreating } = useHRCustodyRequest();

  const handleEmployeeChange = (id: string) => {
    const emp = employees.find((e) => e.id === id) ?? null;
    setSelectedEmployee(emp);
  };

  const addItem = () => {
    rowCounter.current += 1;
    setItems((prev) => [
      ...prev,
      {
        _key: rowCounter.current,
        custodyTypeId: '',
        quantity: 1,
        deliveryDate: dayjs().toISOString(),
        temporal: false,
        shortNote: '',
      },
    ]);
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((r) => r._key !== key));
  };

  const updateItem = (key: number, field: keyof CustodyItemDto, value: any) => {
    setItems((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r))
    );
  };

  const handleAddType = async () => {
    try {
      const values = await typeForm.validateFields();
      await createCustodyType(values as CreateCustodyTypeDto);
      setAddTypeModalOpen(false);
      typeForm.resetFields();
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble — antd's plain
      // <Modal onOk> does not await/catch this itself.
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (items.length === 0) {
        message.error('يرجى إضافة صنف عهدة واحد على الأقل');
        return;
      }

      const invalidItem = items.find((i) => !i.custodyTypeId || i.quantity < 1);
      if (invalidItem) {
        message.error('يرجى تكملة بيانات جميع أصناف العهد');
        return;
      }

      const dto: CreateCustodyRequestDto = {
        createdTo: values.createdTo,
        details: values.details,
        reasons: values.reasons,
        custodyItems: items.map(({ _key, ...item }) => item),
      };

      await createCustodyRequest(dto);
      form.resetFields();
      setSelectedEmployee(null);
      setItems([]);
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble.
    }
  };

  const typeOptions = custodyTypes.map((t) => ({
    value: t.id,
    label: t.nameAr || t.nameEn || t.id,
  }));

  const columns = [
    {
      title: '#',
      width: 40,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: 'اسم الصنف',
      key: 'custodyTypeId',
      render: (_: any, row: ItemRow) => (
        <Select
          style={{ width: 160 }}
          placeholder="نوع العهدة"
          loading={isLoadingTypes}
          value={row.custodyTypeId || undefined}
          onChange={(v) => updateItem(row._key, 'custodyTypeId', v)}
          options={typeOptions}
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '4px 0' }} />
              <Button
                type="link"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => setAddTypeModalOpen(true)}
                style={{ width: '100%' }}
              >
                إضافة نوع جديد
              </Button>
            </>
          )}
        />
      ),
    },
    {
      title: 'الكمية أو القيمة',
      key: 'quantity',
      render: (_: any, row: ItemRow) => (
        <InputNumber
          min={1}
          value={row.quantity}
          onChange={(v) => updateItem(row._key, 'quantity', v ?? 1)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'تاريخ تسليم العهدة',
      key: 'deliveryDate',
      render: (_: any, row: ItemRow) => (
        <DatePicker
          style={{ width: 140 }}
          value={row.deliveryDate ? dayjs(row.deliveryDate) : null}
          format="YYYY-MM-DD"
          onChange={(d) => updateItem(row._key, 'deliveryDate', d ? d.toISOString() : '')}
        />
      ),
    },
    {
      title: 'نوع العهدة',
      key: 'temporal',
      render: (_: any, row: ItemRow) => (
        <Switch
          checked={row.temporal}
          checkedChildren="مؤقتة"
          unCheckedChildren="دائمة"
          onChange={(v) => updateItem(row._key, 'temporal', v)}
        />
      ),
    },
    {
      title: 'ملاحظات',
      key: 'shortNote',
      render: (_: any, row: ItemRow) => (
        <Input
          placeholder="ملاحظة قصيرة..."
          value={row.shortNote ?? ''}
          onChange={(e) => updateItem(row._key, 'shortNote', e.target.value)}
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: '',
      key: 'del',
      width: 40,
      render: (_: any, row: ItemRow) => (
        <Popconfirm title="حذف هذا الصنف؟" onConfirm={() => removeItem(row._key)} okText="حذف" cancelText="إلغاء">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <InboxOutlined style={{ fontSize: 22, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>طلب استلام عهدة</Title>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          {/* Right: Employee info */}
          <Col xs={24} md={8}>
            <Card
              title={<span style={{ color: '#fff' }}>بيانات الموظف</span>}
              styles={{ header: { background: '#4da6e8', border: 'none' } }}
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: 8, fontWeight: 500 }}>من أجل</div>
              <Form.Item
                name="createdTo"
                rules={[{ required: true, message: 'يرجى اختيار الموظف' }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  showSearch
                  placeholder="اختر الموظف"
                  loading={isLoadingEmployees}
                  onChange={handleEmployeeChange}
                  optionFilterProp="label"
                  options={employees.map((e) => ({
                    value: e.id,
                    label: e.nameAr || e.nameEn || e.id,
                  }))}
                />
              </Form.Item>

              {selectedEmployee && (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="المسمى الوظيفي">
                    {selectedEmployee.jobNameAr || selectedEmployee.jobNameEn || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الرقم الوظيفي">
                    {selectedEmployee.employeeNumber || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="الإدارة">
                    {selectedEmployee.departmentNameAr || selectedEmployee.departmentNameEn || '—'}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Card>
          </Col>

          {/* Left: Custody items */}
          <Col xs={24} md={16}>
            <Card
              title={<span style={{ color: '#fff' }}>أصناف العهد</span>}
              styles={{ header: { background: '#4da6e8', border: 'none' } }}
              extra={
                <Tooltip title="إضافة صنف">
                  <Button
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={addItem}
                    style={{ borderColor: '#fff', color: '#fff' }}
                  >
                    إضافة
                  </Button>
                </Tooltip>
              }
            >
              <Table
                dataSource={items}
                columns={columns}
                rowKey="_key"
                pagination={false}
                size="small"
                locale={{ emptyText: 'لا توجد أصناف. اضغط "إضافة" لإدراج صنف.' }}
                scroll={{ x: 800 }}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 16 }} title="تفاصيل إضافية">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="details"
                label="تفاصيل الطلب"
                rules={[{ required: true, message: 'يرجى كتابة تفاصيل الطلب' }]}
              >
                <TextArea rows={3} maxLength={1000} showCount placeholder="تفاصيل عامة للطلب..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="reasons"
                label="أسباب طلب العهد"
                rules={[{ required: true, message: 'يرجى كتابة أسباب طلب العهد' }]}
              >
                <TextArea rows={3} maxLength={1000} showCount placeholder="أسباب طلب هذه العهد..." />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={isCreating}
            onClick={handleSubmit}
            size="large"
          >
            إرسال
          </Button>
        </div>
      </Form>

      {/* Add Custody Type Modal */}
      <Modal
        open={addTypeModalOpen}
        title={
          <Space>
            <SettingOutlined />
            إضافة نوع عهدة جديد
          </Space>
        }
        onCancel={() => {
          setAddTypeModalOpen(false);
          typeForm.resetFields();
        }}
        onOk={handleAddType}
        confirmLoading={isCreatingType}
        okText="إضافة"
        cancelText="إلغاء"
        width={420}
        destroyOnHidden
      >
        <Form form={typeForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="nameAr"
            label="الاسم بالعربي"
            rules={[{ required: true, message: 'يرجى إدخال الاسم بالعربي' }]}
          >
            <Input placeholder="مثال: سيارة" />
          </Form.Item>
          <Form.Item
            name="nameEn"
            label="الاسم بالإنجليزي"
            rules={[{ required: true, message: 'يرجى إدخال الاسم بالإنجليزي' }]}
          >
            <Input placeholder="e.g. Car" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
