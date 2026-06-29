'use client';

import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Shown by the route guard when the signed-in user's roles do not grant access
 * to the current page (per the page-permissions matrix).
 */
export default function AccessDenied() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language === 'ar';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle={
          isAr
            ? 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.'
            : 'Sorry, you are not authorized to access this page.'
        }
        extra={
          <Button type="primary" onClick={() => router.replace('/dashboard')}>
            {isAr ? 'العودة إلى الرئيسية' : 'Back to Dashboard'}
          </Button>
        }
      />
    </div>
  );
}
