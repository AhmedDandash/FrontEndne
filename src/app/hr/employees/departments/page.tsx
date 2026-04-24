'use client';

import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Card,
} from 'antd';
import { ApartmentOutlined, PlusOutlined } from '@ant-design/icons';
import HRPageHeader from '@/features/hr/components/HRPageHeader';
import { useAuthStore } from '@/store/authStore';
import { useHRDepartments, useCreateDepartment } from '@/hooks/api/useHR';
import type { HRLookupItem } from '@/types/hr.types';
import type { ColumnsType } from 'antd/es/table';

export default function DepartmentsPage() {
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: departments = [], isLoading } = useHRDepartments();
  const { mutate: createDept, isPending } = useCreateDepartment();

  const handleOk = () => {
    form.validateFields().then((values) => {
      createDept(
        { nameAr: values.nameAr, nameEn: values.nameEn },
        {
          onSuccess: () => {
            form.resetFields();
            setModalOpen(false);
          },
        }
      );
    });
  };

  const columns: ColumnsType<HRLookupItem> = [
    {
      title: '#',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: isAr ? 'الاسم بالعربي' : 'Name (Arabic)',
      dataIndex: 'nameAr',
    },
    {
      title: isAr ? 'الاسم بالإنجليزي' : 'Name (English)',
      dataIndex: 'nameEn',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <HRPageHeader
        title={isAr ? 'إدارة الأقسام' : 'Departments'}
        icon={<ApartmentOutlined />}
        actions={[
          {
            key: 'add',
            label: isAr ? 'إضافة قسم' : 'Add Department',
            icon: <PlusOutlined />,
            onClick: () => setModalOpen(true),
          },
        ]}
      />

      <Card size="small">
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={isAr ? 'إضافة قسم جديد' : 'Add New Department'}
        okText={isAr ? 'إضافة' : 'Add'}
        cancelText={isAr ? 'إلغاء' : 'Cancel'}
        confirmLoading={isPending}
        onOk={handleOk}
        onCancel={() => { form.resetFields(); setModalOpen(false); }}
        width={420}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nameAr"
            label={isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <Input placeholder={isAr ? 'مثال: تقنية المعلومات' : 'e.g. Information Technology'} />
          </Form.Item>
          <Form.Item
            name="nameEn"
            label={isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}
            rules={[{ required: true, message: isAr ? 'مطلوب' : 'Required' }]}
          >
            <Input placeholder="e.g. Information Technology" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
