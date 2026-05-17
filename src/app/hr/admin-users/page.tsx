'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Tag,
  Typography,
  Divider,
} from 'antd';
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminUsers, useAdminRoles } from '@/hooks/api/useAdmin';
import type { AdminUser, AssignRoleDto } from '@/types/hr.types';

const { Title, Text } = Typography;

type RoleAction = { type: 'assign' | 'remove'; user: AdminUser };

export default function AdminUsersPage() {
  const [roleAction, setRoleAction] = useState<RoleAction | null>(null);
  const [roleForm] = Form.useForm();

  const { users, isLoading, assignRole, removeRole, isAssigningRole, isRemovingRole } =
    useAdminUsers();

  const { data: roles = [] } = useAdminRoles();
  const roleOptions = roles.map((r) => ({ value: r, label: r }));

  const openRoleAction = (type: 'assign' | 'remove', user: AdminUser) => {
    roleForm.resetFields();
    setRoleAction({ type, user });
  };

  const handleRoleAction = async () => {
    if (!roleAction) return;
    const { roleName } = await roleForm.validateFields();
    const dto: AssignRoleDto = { userId: roleAction.user.id, role: roleName };
    if (roleAction.type === 'assign') {
      await assignRole(dto);
    } else {
      await removeRole(dto);
    }
    setRoleAction(null);
    roleForm.resetFields();
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'البريد الإلكتروني',
      dataIndex: 'email',
      render: (v) => <Text>{v || '—'}</Text>,
    },
    {
      title: 'الأدوار',
      dataIndex: 'roles',
      render: (userRoles: string[] | null | undefined) =>
        userRoles && userRoles.length > 0 ? (
          <Space size={4} wrap>
            {userRoles.map((r) => (
              <Tag key={r} color="blue">
                {r}
              </Tag>
            ))}
          </Space>
        ) : (
          <Tag color="default">بدون دور</Tag>
        ),
    },
    {
      title: 'إدارة الأدوار',
      key: 'roleActions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<PlusCircleOutlined style={{ color: '#52c41a' }} />}
            onClick={() => openRoleAction('assign', record)}
          >
            إسناد
          </Button>
          <Button
            type="text"
            icon={<MinusCircleOutlined style={{ color: '#ff4d4f' }} />}
            onClick={() => openRoleAction('remove', record)}
            disabled={!record.roles?.length}
          >
            إزالة
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <TeamOutlined style={{ fontSize: 22, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>
          إدارة أدوار المستخدمين
        </Title>
      </Space>

      <Card>
        <Table<AdminUser>
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: 'لا يوجد مستخدمون' }}
          scroll={{ x: 500 }}
        />
      </Card>

      {/* ── Assign / Remove Role Modal ── */}
      <Modal
        open={!!roleAction}
        title={
          roleAction?.type === 'assign' ? (
            <Space>
              <PlusCircleOutlined style={{ color: '#52c41a' }} />
              إسناد دور للمستخدم
            </Space>
          ) : (
            <Space>
              <MinusCircleOutlined style={{ color: '#ff4d4f' }} />
              إزالة دور من المستخدم
            </Space>
          )
        }
        onCancel={() => {
          setRoleAction(null);
          roleForm.resetFields();
        }}
        onOk={handleRoleAction}
        confirmLoading={isAssigningRole || isRemovingRole}
        okText={roleAction?.type === 'assign' ? 'إسناد' : 'إزالة'}
        okButtonProps={roleAction?.type === 'remove' ? { danger: true } : undefined}
        cancelText="إلغاء"
        width={400}
        destroyOnClose
      >
        {roleAction && (
          <>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">البريد الإلكتروني: </Text>
              <Text strong>{roleAction.user.email || roleAction.user.id}</Text>
              {roleAction.user.roles?.length ? (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text type="secondary">الأدوار الحالية: </Text>
                  <Space size={4} wrap style={{ marginTop: 4 }}>
                    {roleAction.user.roles.map((r) => (
                      <Tag key={r} color="blue">
                        {r}
                      </Tag>
                    ))}
                  </Space>
                </>
              ) : null}
            </div>
            <Form form={roleForm} layout="vertical">
              <Form.Item
                name="roleName"
                label={roleAction.type === 'assign' ? 'الدور المراد إسناده' : 'الدور المراد إزالته'}
                rules={[{ required: true, message: 'يرجى اختيار الدور' }]}
              >
                <Select
                  placeholder="اختر الدور"
                  options={
                    roleAction.type === 'remove' && roleAction.user.roles?.length
                      ? roleAction.user.roles.map((r) => ({ value: r, label: r }))
                      : roleOptions
                  }
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
