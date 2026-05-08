'use client';

import { Form, Input, Button, Card } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  UserAddOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { register, isRegistering } = useAuth();
  const { language } = useAuthStore();
  const isAr = language === 'ar';

  const handleSubmit = (values: any) => {
    register({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    });
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: 540, margin: '0 auto' }}>
      {/* Header card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #003366 0%, #00478c 60%, #00aa64 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '32px 40px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <UserAddOutlined style={{ fontSize: 24, color: '#fff' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 700 }}>
            {isAr ? 'إضافة مسؤول جديد' : 'Add New Admin'}
          </h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
            {isAr
              ? 'أدخل بيانات المسؤول لإنشاء حساب جديد'
              : 'Fill in the details to create a new admin account'}
          </p>
        </div>
      </div>

      {/* Form card */}
      <Card
        bordered={false}
        style={{
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 8px 32px rgba(0,51,102,0.10)',
        }}
        styles={{ body: { padding: '32px 40px 28px' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="fullName"
            label={
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </span>
            }
            rules={[
              {
                required: true,
                message: isAr ? 'يرجى إدخال الاسم الكامل' : 'Please enter full name',
              },
            ]}
            validateTrigger="onBlur"
          >
            <Input
              placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Smith'}
              prefix={<IdcardOutlined style={{ color: '#9ca3af' }} />}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </span>
            }
            rules={[
              {
                required: true,
                message: isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter email',
              },
              {
                type: 'email',
                message: isAr ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address',
              },
            ]}
            validateTrigger="onBlur"
          >
            <Input
              placeholder={isAr ? 'مثال: admin@sigma.com' : 'e.g. admin@sigma.com'}
              prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {isAr ? 'كلمة المرور' : 'Password'}
              </span>
            }
            rules={[
              {
                required: true,
                message: isAr ? 'يرجى إدخال كلمة المرور' : 'Please enter password',
              },
              {
                min: 6,
                message: isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'At least 6 characters',
              },
            ]}
            validateTrigger="onBlur"
          >
            <Input.Password
              placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter password'}
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </span>
            }
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: isAr ? 'يرجى تأكيد كلمة المرور' : 'Please confirm password',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(
                    new Error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'),
                  );
                },
              }),
            ]}
            validateTrigger="onBlur"
          >
            <Input.Password
              placeholder={isAr ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button
              icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
              onClick={() => router.back()}
              size="large"
              style={{ borderRadius: 8, flex: '0 0 auto' }}
            >
              {isAr ? 'رجوع' : 'Back'}
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isRegistering}
              disabled={isRegistering}
              block
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #003366, #00478c)',
                border: 'none',
                fontWeight: 600,
                height: 44,
              }}
            >
              {isRegistering ? (
                <><LoadingOutlined /> {isAr ? 'جاري الإضافة...' : 'Adding...'}</>
              ) : (
                isAr ? 'إضافة المسؤول' : 'Add Admin'
              )}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
