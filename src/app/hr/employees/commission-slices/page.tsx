'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Row,
  Col,
  Tag,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import {
  useCommissionSlices,
  useCreateCommissionSlice,
  useDeleteCommissionSlice,
} from '@/hooks/api/useHR';
import { HR_COMMISSION_TYPE } from '@/constants/hr.enums';
import { toSelectOptions, getEnumLabel } from '@/constants/enums';
import type { CommissionSlice, CreateCommissionSliceDto } from '@/types/hr.types';

export default function CommissionSlicesPage() {
  const [form] = Form.useForm();
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';
  const [modalOpen, setModalOpen] = useState(false);

  const { data: slices = [], isLoading } = useCommissionSlices();
  const { mutate: createSlice, isPending } = useCreateCommissionSlice();
  const { mutate: deleteSlice } = useDeleteCommissionSlice();

  const handleCreate = (values: CreateCommissionSliceDto) => {
    createSlice(values, {
      onSuccess: () => {
        form.resetFields();
        setModalOpen(false);
      },
    });
  };

  const columns: ColumnsType<CommissionSlice> = [
    { title: '#', dataIndex: 'id', width: 60 },
    { title: isAr ? 'اسم الشريحة' : 'Slice Name', dataIndex: 'commissionName' },
    {
      title: isAr ? 'نوع العمولة' : 'Commission Type',
      dataIndex: 'commissionTypeId',
      render: (v) => <Tag>{getEnumLabel(HR_COMMISSION_TYPE, v, language)}</Tag>,
    },
    {
      title: isAr ? 'المبلغ' : 'Amount',
      dataIndex: 'amount',
      render: (v, r) => `${v?.toLocaleString()}${r.isPercent ? '%' : ''}`,
    },
    {
      title: isAr ? 'نسبة مئوية' : 'Percent',
      dataIndex: 'isPercent',
      render: (v) => (v ? <Tag color="blue">{isAr ? 'نعم' : 'Yes'}</Tag> : '—'),
    },
    {
      title: isAr ? 'يشمل الضريبة' : 'Incl. Tax',
      dataIndex: 'includeTax',
      render: (v) => (v ? <Tag color="orange">{isAr ? 'نعم' : 'Yes'}</Tag> : '—'),
    },
    {
      title: isAr ? 'بالتفاصيل' : 'With Details',
      dataIndex: 'withDetails',
      render: (v) => (v ? <Tag color="green">{isAr ? 'نعم' : 'Yes'}</Tag> : '—'),
    },
    {
      title: '',
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title={isAr ? 'تأكيد الحذف؟' : 'Confirm delete?'}
          onConfirm={() => deleteSlice(record.id)}
        >
          <Tooltip title={isAr ? 'حذف' : 'Delete'}>
            <Button danger type="text" icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader
        title={isAr ? 'شرائح العمولات' : 'Commission Slices'}
        icon={<AppstoreOutlined />}
        actions={[{
          key: 'add',
          label: isAr ? 'إضافة شريحة' : 'Add Slice',
          icon: <PlusOutlined />,
          onClick: () => setModalOpen(true),
        }]}
      />

      <Table
        columns={columns}
        dataSource={slices}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 15 }}
        scroll={{ x: 700 }}
      />

      <Modal
        title={isAr ? 'إضافة شريحة عمولة' : 'Add Commission Slice'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="commissionName"
            label={isAr ? 'اسم الشريحة' : 'Slice Name'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item
            name="commissionTypeId"
            label={isAr ? 'نوع العمولة' : 'Commission Type'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <Select options={toSelectOptions(HR_COMMISSION_TYPE, language)} />
          </Form.Item>

          <Form.Item
            name="commissionId"
            label={isAr ? 'معرف العمولة' : 'Commission ID'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          <Form.Item
            name="amount"
            label={isAr ? 'المبلغ' : 'Amount'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isPercent" label={isAr ? 'نسبة' : 'Percent'} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="includeTax" label={isAr ? 'يشمل ضريبة' : 'Incl. Tax'} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="withDetails" label={isAr ? 'بالتفاصيل' : 'With Details'} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setModalOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={isPending}>
                {isAr ? 'إضافة' : 'Add'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
