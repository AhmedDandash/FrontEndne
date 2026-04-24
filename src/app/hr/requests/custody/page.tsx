'use client';

import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Spin,
  Switch,
  Table,
} from 'antd';
import { SendOutlined, PlusOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCurrentHREmployee, useHRCustodyTypes, useCreateCustodyRequest } from '@/hooks/api/useHR';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import EmployeeInfoCard from '@/features/hr/components/EmployeeInfoCard';
import type { CreateCustodyRequestDto, CustodyItem } from '@/types/hr.types';

const { TextArea } = Input;

let itemKey = 1;

export default function CustodyRequestPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);

  const isAr = language === 'ar';

  const { data: currentEmployee, isLoading: empLoading } = useCurrentHREmployee();
  const { data: custodyTypes = [] } = useHRCustodyTypes();
  const { mutate: createRequest, isPending } = useCreateCustodyRequest();

  const [items, setItems] = useState<(CustodyItem & { key: number })[]>([]);
  const [newItem, setNewItem] = useState<Partial<CustodyItem>>({ temporal: true });

  useEffect(() => {
    if (currentEmployee) form.setFieldValue('createdTo', currentEmployee.id);
  }, [currentEmployee, form]);

  const addItem = () => {
    if (!newItem.custodyId || !newItem.quantity || !newItem.deliveryDate) return;
    const type = custodyTypes.find((t) => t.id === newItem.custodyId);
    setItems((prev) => [
      ...prev,
      { key: itemKey++, ...newItem, custodyName: type?.nameAr } as any,
    ]);
    setNewItem({ temporal: true });
  };

  const removeItem = (key: number) => setItems((prev) => prev.filter((i) => i.key !== key));

  const handleFinish = (values: any) => {
    if (!items.length) return;
    const dto: CreateCustodyRequestDto = {
      createdTo: currentEmployee!.id,
      details: values.details,
      custodyItems: items.map(({ key, custodyName, ...rest }) => rest),
    };
    createRequest(dto, {
      onSuccess: () => {
        form.resetFields();
        setItems([]);
      },
    });
  };

  const typeOptions = custodyTypes.map((t) => ({
    value: t.id,
    label: isAr ? t.nameAr : t.nameEn,
  }));

  const columns = [
    { title: isAr ? 'نوع العهدة' : 'Custody Type', dataIndex: 'custodyName' },
    { title: isAr ? 'الكمية' : 'Quantity', dataIndex: 'quantity' },
    { title: isAr ? 'تاريخ التسليم' : 'Delivery Date', dataIndex: 'deliveryDate' },
    {
      title: isAr ? 'مؤقتة' : 'Temporal',
      dataIndex: 'temporal',
      render: (v: boolean) => (v ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')),
    },
    {
      title: isAr ? 'ملاحظة' : 'Note',
      dataIndex: 'shortNote',
      render: (v?: string) => v || '—',
    },
    {
      title: '',
      render: (_: any, record: any) => (
        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => removeItem(record.key)} />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader title={isAr ? 'طلب استلام عهدة' : 'Request Receipt Custody'} icon={<GiftOutlined />} />

      <EmployeeInfoCard employee={currentEmployee} loading={empLoading} />

      <Card>
        <Spin spinning={empLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            disabled={empLoading || !currentEmployee}
          >
            <Form.Item name="createdTo" hidden><Input /></Form.Item>

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item name="details" label={isAr ? 'تفاصيل' : 'Details'}>
                  <TextArea rows={2} maxLength={500} />
                </Form.Item>
              </Col>
            </Row>

            <Divider>{isAr ? 'إضافة بند عهدة' : 'Add Custody Item'}</Divider>

            <Row gutter={12} align="bottom">
              <Col xs={24} sm={6}>
                <div style={{ marginBottom: 8 }}>
                  <label>{isAr ? 'نوع العهدة' : 'Type'}</label>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    options={typeOptions}
                    value={newItem.custodyId}
                    onChange={(v) => setNewItem((p) => ({ ...p, custodyId: v }))}
                    placeholder={isAr ? 'اختر' : 'Select'}
                  />
                </div>
              </Col>
              <Col xs={12} sm={4}>
                <div style={{ marginBottom: 8 }}>
                  <label>{isAr ? 'الكمية' : 'Qty'}</label>
                  <InputNumber
                    style={{ width: '100%', marginTop: 4 }}
                    min={1}
                    value={newItem.quantity}
                    onChange={(v) => setNewItem((p) => ({ ...p, quantity: v ?? 1 }))}
                  />
                </div>
              </Col>
              <Col xs={12} sm={5}>
                <div style={{ marginBottom: 8 }}>
                  <label>{isAr ? 'تاريخ التسليم' : 'Delivery Date'}</label>
                  <DatePicker
                    style={{ width: '100%', marginTop: 4 }}
                    onChange={(d) => setNewItem((p) => ({ ...p, deliveryDate: d?.format('YYYY-MM-DD') }))}
                  />
                </div>
              </Col>
              <Col xs={12} sm={3}>
                <div style={{ marginBottom: 8 }}>
                  <label>{isAr ? 'مؤقتة' : 'Temporal'}</label>
                  <br />
                  <Switch
                    style={{ marginTop: 4 }}
                    checked={newItem.temporal ?? true}
                    onChange={(v) => setNewItem((p) => ({ ...p, temporal: v }))}
                  />
                </div>
              </Col>
              <Col xs={24} sm={4}>
                <div style={{ marginBottom: 8 }}>
                  <label>{isAr ? 'ملاحظة' : 'Note'}</label>
                  <Input
                    style={{ marginTop: 4 }}
                    maxLength={200}
                    value={newItem.shortNote}
                    onChange={(e) => setNewItem((p) => ({ ...p, shortNote: e.target.value }))}
                  />
                </div>
              </Col>
              <Col xs={24} sm={2}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={addItem}
                  style={{ marginBottom: 8 }}
                  disabled={!newItem.custodyId || !newItem.quantity || !newItem.deliveryDate}
                >
                  {isAr ? 'إضافة' : 'Add'}
                </Button>
              </Col>
            </Row>

            {items.length > 0 && (
              <Table
                dataSource={items}
                columns={columns}
                pagination={false}
                size="small"
                style={{ marginTop: 8 }}
              />
            )}

            <Divider />

            <Row justify="end">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={isPending}
                  disabled={!currentEmployee || !items.length}
                >
                  {isAr ? 'إرسال الطلب' : 'Submit Request'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
