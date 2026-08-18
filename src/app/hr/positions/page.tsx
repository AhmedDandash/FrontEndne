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
  Tooltip,
  Popconfirm,
  Typography,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminPositions } from '@/hooks/api/useAdmin';
import { useHrActionGates } from '@/hooks/useActionPermissionGates';
import type { EmployeePosition, EmployeePositionCreateDto } from '@/types/hr.types';

const { Title } = Typography;

export default function HRPositionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const hrGates = useHrActionGates();

  const {
    positions,
    isLoading,
    createPosition,
    deletePosition,
    isCreating,
    isDeleting,
  } = useAdminPositions();

  const openCreate = () => {
    if (!hrGates.canCreate) return;
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!hrGates.canCreate) return;
    try {
      const values = await form.validateFields();
      await createPosition(values as EmployeePositionCreateDto);
      setModalOpen(false);
      form.resetFields();
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble as an unhandled
      // promise rejection — antd's plain <Modal onOk> does not await/catch
      // this itself.
    }
  };

  const columns: ColumnsType<EmployeePosition> = [
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
      title: 'الاسم بالعربية',
      dataIndex: 'nameAr',
      render: (v) => <strong>{v || '—'}</strong>,
    },
    {
      title: 'الاسم بالإنجليزية',
      dataIndex: 'nameEn',
      render: (v) => v || '—',
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 90,
      render: (_, record) =>
        hrGates.canDelete ? (
          <Tooltip title="حذف">
            <Popconfirm
              title="حذف المسمى الوظيفي"
              description={
                <>
                  هل تريد حذف <strong>{record.nameAr || record.nameEn}</strong>؟
                  <br />
                  <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                    تحذير: لن يمكن التراجع عن هذا الإجراء.
                  </span>
                </>
              }
              onConfirm={() => deletePosition(record.id).catch(() => {})}
              okText="حذف"
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
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
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
          <SolutionOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            المسميات الوظيفية
          </Title>
        </Space>
        {hrGates.canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="large">
            إضافة مسمى وظيفي
          </Button>
        )}
      </div>

      <Card>
        <Table<EmployeePosition>
          dataSource={positions}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'لا توجد مسميات وظيفية — أضف مسمىً جديداً' }}
        />
      </Card>

      <Modal
        open={modalOpen && hrGates.canCreate}
        title="إضافة مسمى وظيفي جديد"
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={isCreating}
        okText="إضافة"
        cancelText="إلغاء"
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="nameAr"
            label="الاسم بالعربية"
            rules={[{ required: true, message: 'الاسم بالعربية مطلوب' }]}
          >
            <Input placeholder="مثال: مدير مالي" />
          </Form.Item>
          <Form.Item name="nameEn" label="الاسم بالإنجليزية">
            <Input placeholder="e.g. Financial Manager" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
