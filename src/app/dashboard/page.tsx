'use client';

import { Button, Space, Typography, Tag, Spin, Row, Col, Avatar } from 'antd';
import {
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth.service';
import { useHRAttendance } from '@/hooks/api/useHR';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;

const ROLE_TAG_COLORS: Record<string, string> = {
  Admin: 'blue',
  Employee: 'green',
  HR: 'purple',
  Manager: 'orange',
};

const ROLE_HERO_GRADIENT: Record<string, string> = {
  Admin: 'linear-gradient(135deg, #003366 0%, #00478c 100%)',
  Employee: 'linear-gradient(135deg, #006644 0%, #00aa64 100%)',
  HR: 'linear-gradient(135deg, #3d0070 0%, #7b2fa8 100%)',
  Manager: 'linear-gradient(135deg, #7a3500 0%, #d97706 100%)',
};

const QUICK_LINKS = [
  { key: 'employees',  path: '/hr/employees',                    labelAr: 'الموظفون',   labelEn: 'Employees',   icon: <IdcardOutlined />,  color: '#00478c' },
  { key: 'workers',    path: '/applicants',                       labelAr: 'العمالة',    labelEn: 'Workers',     icon: <TeamOutlined />,    color: '#00aa64' },
  { key: 'contracts',  path: '/contracts/mediationcontract',      labelAr: 'العقود',     labelEn: 'Contracts',   icon: <FileTextOutlined /> , color: '#7b2fa8' },
  { key: 'housing',    path: '/housing/management',               labelAr: 'السكن',      labelEn: 'Housing',     icon: <HomeOutlined />,    color: '#d97706' },
  { key: 'customers',  path: '/customers',                        labelAr: 'العملاء',    labelEn: 'Customers',   icon: <ShopOutlined />,    color: '#0891b2' },
  { key: 'complaints', path: '/complaints',                       labelAr: 'الشكاوى',   labelEn: 'Complaints',  icon: <WarningOutlined />, color: '#dc2626' },
];

function useLiveClock() {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function DashboardPage() {
  const { data: me, isLoading: isMeLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => AuthService.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { checkIn, checkOut, isCheckingIn, isCheckingOut } = useHRAttendance({});
  const now = useLiveClock();
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language === 'ar';

  const primaryRole = me?.roles?.[0] ?? 'Admin';
  const heroGradient = ROLE_HERO_GRADIENT[primaryRole] ?? ROLE_HERO_GRADIENT.Admin;

  const greeting = () => {
    const h = now.hour();
    if (isAr) {
      if (h < 12) return 'صباح الخير';
      if (h < 17) return 'مساء الخير';
      return 'مساء النور';
    }
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>

      {/* ── Hero ── */}
      <div style={{
        background: heroGradient,
        borderRadius: 20,
        padding: '32px 36px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,71,140,0.25)',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -70, left: -30, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        {isMeLoading ? (
          <Spin style={{ color: '#fff' }} />
        ) : (
          <Row align="middle" gutter={[24, 16]}>
            <Col>
              <Avatar
                size={72}
                icon={<UserOutlined />}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '3px solid rgba(255,255,255,0.45)',
                  fontSize: 32,
                  flexShrink: 0,
                }}
              />
            </Col>

            <Col flex="1">
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, display: 'block', marginBottom: 2 }}>
                {greeting()},
              </Text>
              <Title level={3} style={{ color: '#fff', margin: '0 0 6px' }}>
                {me?.fullName ?? (isAr ? 'المستخدم' : 'User')}
              </Title>
              <div style={{ marginBottom: 4 }}>
                {(me?.roles ?? []).map((role) => (
                  <Tag key={role} color={ROLE_TAG_COLORS[role] ?? 'default'} style={{ borderRadius: 20, fontSize: 12 }}>
                    {role}
                  </Tag>
                ))}
              </div>
              {me?.email && (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                  {me.email}
                </Text>
              )}
            </Col>

            <Col>
              <div style={{ textAlign: 'center', color: '#fff', minWidth: 110 }}>
                <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: 3 }}>
                  {now.format('HH:mm')}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
                  {now.format('dddd')}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                  {now.format('DD / MM / YYYY')}
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>

      {/* ── Attendance card (employees only) ── */}
      {me?.roles?.includes('Employee') && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <Title level={5} style={{ margin: 0, color: '#003366' }}>
              {isAr ? 'تسجيل الحضور والانصراف' : 'Attendance'}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {isAr ? `اليوم — ${now.format('dddd، DD/MM/YYYY')}` : `Today — ${now.format('dddd, DD/MM/YYYY')}`}
            </Text>
          </div>
          <Space size={12}>
            <Button
              size="large"
              icon={<LoginOutlined />}
              loading={isCheckingIn}
              onClick={() => checkIn()}
              style={{
                minWidth: 148,
                borderRadius: 12,
                height: 48,
                fontWeight: 600,
                border: '2px solid #00aa64',
                color: '#00aa64',
                background: 'transparent',
              }}
            >
              {isAr ? 'تسجيل حضور' : 'Check In'}
            </Button>
            <Button
              size="large"
              icon={<LogoutOutlined />}
              loading={isCheckingOut}
              onClick={() => checkOut()}
              style={{
                minWidth: 148,
                borderRadius: 12,
                height: 48,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #003366 0%, #00478c 100%)',
                border: 'none',
                color: '#fff',
              }}
            >
              {isAr ? 'تسجيل انصراف' : 'Check Out'}
            </Button>
          </Space>
        </div>
      )}

      {/* ── Quick access ── */}
      <Title level={5} style={{ color: '#003366', marginBottom: 16 }}>
        {isAr ? 'الوصول السريع' : 'Quick Access'}
      </Title>
      <Row gutter={[16, 16]}>
        {QUICK_LINKS.map((link) => (
          <Col key={link.key} xs={12} sm={8} md={6} lg={4}>
            <QuickTile
              icon={link.icon}
              label={isAr ? link.labelAr : link.labelEn}
              color={link.color}
              onClick={() => router.push(link.path)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}

function QuickTile({
  icon, label, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '22px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? `0 10px 28px ${color}30` : '0 2px 12px rgba(0,0,0,0.06)',
        border: `1.5px solid ${hovered ? color : 'transparent'}`,
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: `${color}1a`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
        fontSize: 24,
        color,
        transition: 'background 0.22s ease',
      }}>
        {icon}
      </div>
      <Text strong style={{ fontSize: 13, color: '#1a1a2e' }}>
        {label}
      </Text>
    </div>
  );
}
