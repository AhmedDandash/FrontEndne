'use client';

import { useRef, useState } from 'react';
import { Button, Card, Space, message } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useGeneralVoucherPrint } from '@/hooks/api/useGeneralVouchers';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import VoucherPrintLayout from '../../_components/VoucherPrintLayout';
import { voucherTypeLabel } from '../../_lib/generalVoucherDisplay';

const LIST_ROUTE = '/accounting/general-vouchers';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function GeneralVoucherPrintPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGeneralVoucherPrint(id);

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  /**
   * Rasterise the on-screen layout into an A4 PDF — same html2canvas + jsPDF
   * recipe as `utils/pdf.ts`, but capturing the already-rendered node directly
   * instead of building a hidden iframe, since the layout is visible here.
   */
  const handleDownloadPdf = async () => {
    const node = printRef.current;
    if (!node) return;

    setIsGenerating(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgH = (canvas.height * pageW) / canvas.width;

      // Slice a tall capture across as many A4 pages as it needs.
      let remaining = imgH;
      let offset = 0;
      while (remaining > 0) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -offset, pageW, imgH);
        offset += pageH;
        remaining -= pageH;
      }

      const voucherNo =
        data?.voucher.voucherNumber ??
        (data?.voucher.voucherSerialNumber != null ? data.voucher.voucherSerialNumber : id);
      pdf.save(`voucher-${voucherNo}.pdf`);
    } catch {
      message.error(t('فشل إنشاء ملف PDF', 'Failed to generate PDF'));
    } finally {
      setIsGenerating(false);
    }
  };

  const displayNumber =
    data?.voucher.voucherNumber ||
    (data?.voucher.voucherSerialNumber != null
      ? `#${data.voucher.voucherSerialNumber}`
      : `#${id}`);

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t('السندات العامة', 'General Vouchers'), href: LIST_ROUTE },
        { label: displayNumber, href: `${LIST_ROUTE}/${id}` },
        { label: t('طباعة', 'Print') },
      ]}
      backHref={`${LIST_ROUTE}/${id}`}
      title={t('معاينة الطباعة', 'Print Preview')}
      subtitle={data ? voucherTypeLabel(data.voucher.voucherType, isAr) : undefined}
      actions={
        data && (
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              {t('طباعة', 'Print')}
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={isGenerating}
              onClick={handleDownloadPdf}
            >
              {t('تحميل PDF', 'Download PDF')}
            </Button>
          </Space>
        )
      }
    >
      {data && (
        <Card
          styles={{ body: { display: 'flex', justifyContent: 'center', background: '#f5f5f5' } }}
        >
          <VoucherPrintLayout ref={printRef} data={data} isAr={isAr} />
        </Card>
      )}
    </RecordDetailShell>
  );
}
