'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Table,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Spin,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useHRCustodyTypes } from '@/hooks/api/useHR';
import type { CustodyTypeDto, CreateCustodyTypeDto } from '@/types/hr.types';
import styles from './CustodyTypes.module.css';

export default function CustodyTypesSettingsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { custodyTypes, isLoading, refetch, createCustodyType, isCreatingType } =
    useHRCustodyTypes();

  const openAdd = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await createCustodyType(values as CreateCustodyTypeDto);
    setModalOpen(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<CustodyTypeDto> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_: unknown, __: CustodyTypeDto, idx: number) => idx + 1,
    },
    {
      title: 'الاسم بالعربية',
      dataIndex: 'nameAr',
      key: 'nameAr',
      render: (v: string) => (
        <Tag color="blue" style={{ fontFamily: 'inherit', fontSize: 13 }}>
          {v || '—'}
        </Tag>
      ),
    },
    {
      title: 'الاسم بالإنجليزية',
      dataIndex: 'nameEn',
      key: 'nameEn',
      render: (v: string) => (
        <Tag color="geekblue" style={{ fontFamily: 'inherit', fontSize: 13 }}>
          {v || '—'}
        </Tag>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <InboxOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>إدارة أنواع العهد</h1>
              <p className={styles.pageSubtitle}>إضافة وعرض أنواع العهد المتاحة في النظام</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              تحديث
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAdd}
              className={styles.addBtn}
            >
              إضافة نوع عهدة
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.spinWrapper}>
            <Spin size="large" />
          </div>
        ) : !custodyTypes.length ? (
          <Empty description="لا توجد أنواع عهد مضافة بعد" />
        ) : (
          <Table
            dataSource={custodyTypes}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `الإجمالي: ${total}` }}
            size="middle"
            bordered
          />
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        open={modalOpen}
        title={
          <Space>
            <PlusOutlined />
            إضافة نوع عهدة جديد
          </Space>
        }
        onOk={handleOk}
        onCancel={handleCancel}
        okText="حفظ"
        cancelText="إلغاء"
        confirmLoading={isCreatingType}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nameAr"
            label="الاسم بالعربية"
            rules={[{ required: true, message: 'الاسم بالعربية مطلوب' }]}
          >
            <Input size="large" placeholder="مثال: سيارة" dir="rtl" />
          </Form.Item>
          <Form.Item
            name="nameEn"
            label="الاسم بالإنجليزية"
            rules={[{ required: true, message: 'الاسم بالإنجليزية مطلوب' }]}
          >
            <Input size="large" placeholder="e.g. Car" dir="ltr" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
