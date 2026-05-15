'use client';

import { Card, Button, Space, Typography, Tag, Spin, Row, Col } from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AuthService } from '@/services/auth.service';
import { useHRAttendance } from '@/hooks/api/useHR';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  Admin: 'blue',
  Employee: 'green',
  HR: 'purple',
  Manager: 'orange',
};

export default function DashboardPage() {
  const { data: me, isLoading: isMeLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => AuthService.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { checkIn, checkOut, isCheckingIn, isCheckingOut } = useHRAttendance({});

  const now = dayjs();

  return (
    <div style={{ padding: 24 }}>
      {/* Greeting */}
      <Card style={{ marginBottom: 24 }}>
        {isMeLoading ? (
          <Spin />
        ) : (
          <Row align="middle" gutter={16}>
            <Col>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#1677ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
            </Col>
            <Col flex="1">
              <Title level={4} style={{ margin: 0 }}>
                مرحباً، {me?.fullName || 'المستخدم'}
              </Title>
              <Text type="secondary">{me?.email}</Text>
              <div style={{ marginTop: 6 }}>
                {(me?.roles ?? []).map((role) => (
                  <Tag key={role} color={ROLE_COLORS[role] ?? 'default'}>
                    {role}
                  </Tag>
                ))}
              </div>
            </Col>
            <Col>
              <Space direction="vertical" align="end" size={2}>
                <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {now.format('dddd')}
                </Text>
                <Text strong>{now.format('YYYY/MM/DD')}</Text>
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      {/* Check-in / Check-out */}
      <Card title="تسجيل الحضور والانصراف">
        <Space size="large">
          <Button
            type="default"
            size="large"
            icon={<LoginOutlined />}
            loading={isCheckingIn}
            onClick={() => checkIn()}
            style={{ minWidth: 160 }}
          >
            تسجيل حضور
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<LogoutOutlined />}
            loading={isCheckingOut}
            onClick={() => checkOut()}
            style={{ minWidth: 160 }}
          >
            تسجيل انصراف
          </Button>
        </Space>
      </Card>
    </div>
  );
}
