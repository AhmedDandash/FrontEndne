'use client';

import { useState, useMemo } from 'react';
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
  Input,
} from 'antd';
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  TeamOutlined,
  SearchOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAdminUsers, useAdminRoles } from '@/hooks/api/useAdmin';
import type { AdminUser, AssignRoleDto, AddUserDto } from '@/types/hr.types';

const { Title, Text } = Typography;

type RoleAction = { type: 'assign' | 'remove'; user: AdminUser };

export default function AdminUsersPage() {
  const [roleAction, setRoleAction] = useState<RoleAction | null>(null);
  const [roleForm] = Form.useForm();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserForm] = Form.useForm();

  const {
    users,
    isLoading,
    addUser,
    assignRole,
    removeRole,
    isAddingUser,
    isAssigningRole,
    isRemovingRole,
  } = useAdminUsers();

  const { data: roles = [] } = useAdminRoles();
  const roleOptions = roles.map((r) => ({ value: r, label: r }));

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (
        q &&
        !(u.email ?? '').toLowerCase().includes(q) &&
        !(u.fullName ?? '').toLowerCase().includes(q)
      )
        return false;
      if (roleFilter && !(u.roles ?? []).includes(roleFilter)) return false;
      return true;
    });
  }, [users, searchText, roleFilter]);

  const openRoleAction = (type: 'assign' | 'remove', user: AdminUser) => {
    roleForm.resetFields();
    setRoleAction({ type, user });
  };

  const handleAddUser = async () => {
    const values = await addUserForm.validateFields();
    const dto: AddUserDto = {
      fullName: values.fullName,
      email: values.email || null,
      userName: values.userName || null,
      password: values.password || null,
      role: values.role,
    };
    await addUser(dto);
    setAddUserOpen(false);
    addUserForm.resetFields();
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
      title: 'الاسم',
      dataIndex: 'fullName',
      render: (v) => <Text strong>{v || '—'}</Text>,
    },
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
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <TeamOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            إدارة المستخدمين والأدوار
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          onClick={() => {
            addUserForm.resetFields();
            setAddUserOpen(true);
          }}
        >
          إضافة مستخدم
        </Button>
      </div>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="تصفية بالدور"
            allowClear
            style={{ width: 200 }}
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            options={roleOptions}
          />
        </Space>

        <Table<AdminUser>
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (total) => `إجمالي: ${total} مستخدم`,
          }}
          locale={{
            emptyText:
              searchText || roleFilter ? 'لا توجد نتائج مطابقة' : 'لا يوجد مستخدمون',
          }}
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
        destroyOnHidden
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

      {/* ── Add User Modal ── */}
      <Modal
        open={addUserOpen}
        title={
          <Space>
            <UserAddOutlined style={{ color: '#1677ff' }} />
            إضافة مستخدم جديد
          </Space>
        }
        onCancel={() => {
          setAddUserOpen(false);
          addUserForm.resetFields();
        }}
        onOk={handleAddUser}
        confirmLoading={isAddingUser}
        okText="إضافة"
        cancelText="إلغاء"
        width={460}
        destroyOnHidden
      >
        <Form form={addUserForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="fullName"
            label="الاسم الكامل"
            rules={[{ required: true, message: 'الاسم الكامل مطلوب' }]}
          >
            <Input placeholder="الاسم الكامل للمستخدم" />
          </Form.Item>
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[
              { required: true, message: 'البريد الإلكتروني مطلوب' },
              { type: 'email', message: 'بريد إلكتروني غير صحيح' },
            ]}
          >
            <Input placeholder="user@company.com" />
          </Form.Item>
          <Form.Item name="userName" label="اسم المستخدم (اختياري)">
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[{ required: true, message: 'كلمة المرور مطلوبة' }]}
          >
            <Input.Password placeholder="كلمة المرور المبدئية" />
          </Form.Item>
          <Form.Item
            name="role"
            label="الدور"
            rules={[{ required: true, message: 'يرجى اختيار الدور' }]}
          >
            <Select placeholder="اختر الدور" options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
