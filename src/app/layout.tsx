import type { Metadata } from 'next';
import { AntdProvider } from '@/components/AntdProvider';
import { ReactQueryProvider } from '@/lib/providers/ReactQueryProvider';
import { TokenDebugger } from '@/components/TokenDebugger';
import { PageTitle } from '@/components/PageTitle';
import MainLayout from '@/components/layout/MainLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'شركة سيجما للاستقدام | Sigma Recruitment Company',
  description: 'شركة سيجما للاستقدام - نظام إدارة متقدم مع واجهة مستخدم حديثة وسهلة الاستخدام',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ReactQueryProvider>
          <AntdProvider>
            <TokenDebugger />
            <PageTitle />
            <MainLayout>{children}</MainLayout>
          </AntdProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
