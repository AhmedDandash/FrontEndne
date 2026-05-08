'use client';

import { useMemo } from 'react';
import { Form, Input, Button, Card } from 'antd';
import { LockOutlined, LoadingOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import type { ChangePasswordRequestDTO } from '@/types/api.types';

function useT(language: string) {
  return useMemo(() => {
    const map: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'تغيير كلمة المرور', en: 'Change Password' },
      currentPassword: { ar: 'كلمة المرور الحالية', en: 'Current Password' },
      newPassword: { ar: 'كلمة المرور الجديدة', en: 'New Password' },
      confirmPassword: { ar: 'تأكيد كلمة المرور الجديدة', en: 'Confirm New Password' },
      save: { ar: 'حفظ التغييرات', en: 'Save Changes' },
      loading: { ar: 'جاري الحفظ...', en: 'Saving...' },
      required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
      minLength: { ar: 'كلمة المرور 6 أحرف على الأقل', en: 'Password must be at least 6 characters' },
      mismatch: { ar: 'كلمتا المرور غير متطابقتين', en: 'Passwords do not match' },
      enterCurrent: { ar: 'أدخل كلمة المرور الحالية', en: 'Enter current password' },
      enterNew: { ar: 'أدخل كلمة المرور الجديدة', en: 'Enter new password' },
      enterConfirm: { ar: 'أعد إدخال كلمة المرور الجديدة', en: 'Re-enter new password' },
    };
    return (key: string) => map[key]?.[language] ?? map[key]?.['en'] ?? key;
  }, [language]);
}

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const { language } = useAuthStore();
  const { changePassword, isChangingPassword } = useAuth();
  const t = useT(language);
  const isRTL = language === 'ar';

  const handleSubmit = (values: any) => {
    const dto: ChangePasswordRequestDTO = {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmNewPassword: values.confirmPassword,
    };
    changePassword(dto, {
      onSuccess: () => form.resetFields(),
    });
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}
    >
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#003366' }}>
            <KeyOutlined />
            {t('pageTitle')}
          </span>
        }
        bordered={false}
        style={{ boxShadow: '0 4px 24px rgba(0,51,102,0.08)', borderRadius: 12 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          autoComplete="off"
        >
          <Form.Item
            name="currentPassword"
            label={t('currentPassword')}
            rules={[{ required: true, message: t('required') }]}
            validateTrigger="onBlur"
          >
            <Input.Password
              placeholder={t('enterCurrent')}
              prefix={<LockOutlined style={{ color: '#003366' }} />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={t('newPassword')}
            rules={[
              { required: true, message: t('required') },
              { min: 6, message: t('minLength') },
            ]}
            validateTrigger="onBlur"
          >
            <Input.Password
              placeholder={t('enterNew')}
              prefix={<LockOutlined style={{ color: '#003366' }} />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error(t('mismatch')));
                },
              }),
            ]}
            validateTrigger="onBlur"
          >
            <Input.Password
              placeholder={t('enterConfirm')}
              prefix={<LockOutlined style={{ color: '#003366' }} />}
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isChangingPassword}
              disabled={isChangingPassword}
              block
              style={{ background: '#003366', borderColor: '#003366' }}
            >
              {isChangingPassword ? (
                <>
                  <LoadingOutlined /> {t('loading')}
                </>
              ) : (
                t('save')
              )}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
