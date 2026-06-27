'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined, ApartmentOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDepartments } from '@/hooks/api/useAdmin';
import type { Department, CreateDepartmentDto } from '@/types/hr.types';

const { Title } = Typography;

export default function HRDepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { departments, isLoading, createDepartment, isCreating } = useDepartments();

  const openCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await createDepartment(values as CreateDepartmentDto);
    setModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<Department> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, idx) => (
        <Tag color="blue" style={{ minWidth: 32, textAlign: 'center' }}>
          {idx + 1}
        </Tag>
      ),
    },
    {
      title: 'اسم القسم بالعربية',
      dataIndex: 'nameAr',
      render: (v) => <strong>{v || '—'}</strong>,
    },
    {
      title: 'اسم القسم بالإنجليزية',
      dataIndex: 'nameEn',
      render: (v) => v || '—',
    },
  ];

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
          <ApartmentOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            الأقسام
          </Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
          إضافة قسم
        </Button>
      </div>

      <Card>
        <Table<Department>
          dataSource={departments}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد أقسام — أضف قسماً جديداً' }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title="إضافة قسم جديد"
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={isCreating}
        okText="إضافة"
        cancelText="إلغاء"
        width={460}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="nameAr"
            label="اسم القسم بالعربية"
            rules={[{ required: true, message: 'اسم القسم بالعربية مطلوب' }]}
          >
            <Input placeholder="مثال: الموارد البشرية" />
          </Form.Item>
          <Form.Item name="nameEn" label="اسم القسم بالإنجليزية">
            <Input placeholder="e.g. Human Resources" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
