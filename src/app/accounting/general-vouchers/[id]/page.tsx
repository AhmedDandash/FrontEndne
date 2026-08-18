'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Form, Popconfirm, Space, Tooltip, message } from 'antd';
import {
  AuditOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useAuthStore } from '@/store/authStore';
import {
  useDeleteGeneralVoucher,
  useGeneralVoucher,
  useGeneralVoucherTrace,
  useUpdateGeneralVoucher,
} from '@/hooks/api/useGeneralVouchers';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import AccessDenied from '@/components/common/AccessDenied';
import { useAccountingActionGates } from '@/hooks/useActionPermissionGates';
import { DocumentTraceDrawer } from '../../_lib/DocumentTraceDrawer';
import GeneralVoucherDetailView from '../_components/GeneralVoucherDetailView';
import VoucherForm, { buildVoucherDto } from '../_components/VoucherForm';
import { voucherTypeLabel } from '../_lib/generalVoucherDisplay';
import type { JournalLineRow } from '../_components/VoucherJournalLines';

const LIST_ROUTE = '/accounting/general-vouchers';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function GeneralVoucherDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const accountingGates = useAccountingActionGates();

  const [form] = Form.useForm();
  const [attachment, setAttachment] = useState<UploadFile[]>([]);
  // The list's edit action links straight into edit mode via ?edit=1.
  const wantsEditMode = searchParams.get('edit') === '1';
  const [isEditing, setIsEditing] = useState(wantsEditMode);

  const { data: voucher, isLoading, isError, error, refetch } = useGeneralVoucher(id);
  const { mutateAsync: updateVoucher, isPending: isSaving } = useUpdateGeneralVoucher();
  const { mutateAsync: deleteVoucher } = useDeleteGeneralVoucher();

  const [traceOpen, setTraceOpen] = useState(false);
  const { data: traceData, isLoading: isTraceLoading } = useGeneralVoucherTrace(
    traceOpen ? id : undefined
  );

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  // Posted vouchers are immutable backend-side; reflect that in the UI rather
  // than letting the user fill in a form that will be rejected on save.
  const isLocked = voucher?.status === 1;

  useEffect(() => {
    if (isLocked && isEditing) {
      setIsEditing(false);
      message.info(
        t('لا يمكن تعديل سند معمد', 'A posted voucher cannot be edited')
      );
    }
  }, [isLocked, isEditing, t]);

  const displayNumber =
    voucher?.voucherNumber ||
    (voucher?.voucherSerialNumber != null ? `#${voucher.voucherSerialNumber}` : `#${id}`);

  const handleSave = async () => {
    if (!voucher || !accountingGates.canUpdate) return;
    try {
      const values = await form.validateFields();
      const lines: JournalLineRow[] = form.getFieldValue('lines') ?? [];
      await updateVoucher({
        id,
        data: buildVoucherDto(values, voucher.voucherType, lines),
      });
      setIsEditing(false);
      refetch();
    } catch {
      // Form-validation rejection or mutation failure (toast already shown
      // for the latter); swallow so it doesn't bubble as an unhandled
      // promise rejection — this handler is a bare onClick.
    }
  };

  const handleDelete = async () => {
    if (!accountingGates.canDelete) return;
    try {
      await deleteVoucher(id);
      router.push(LIST_ROUTE);
    } catch {
      // onError toast already shown; swallow so it doesn't bubble.
    }
  };

  if (wantsEditMode && accountingGates.isReady && !accountingGates.canUpdate) {
    return <AccessDenied />;
  }

  const actions = voucher && (
    <Space wrap>
      {isEditing && accountingGates.canUpdate ? (
        <>
          <Button onClick={() => setIsEditing(false)}>{t('إلغاء', 'Cancel')}</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={handleSave}>
            {t('حفظ', 'Save')}
          </Button>
        </>
      ) : (
        <>
          {accountingGates.canUpdate && (
            <Tooltip
              title={isLocked ? t('لا يمكن تعديل سند معمد', 'Cannot edit a posted voucher') : undefined}
            >
              <Button icon={<EditOutlined />} disabled={isLocked} onClick={() => setIsEditing(true)}>
                {t('تعديل', 'Edit')}
              </Button>
            </Tooltip>
          )}
          <Button
            icon={<PrinterOutlined />}
            href={`${LIST_ROUTE}/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('طباعة', 'Print')}
          </Button>
          <Button icon={<AuditOutlined />} onClick={() => setTraceOpen(true)}>
            {t('عرض سلسلة التتبع', 'View Audit Trail')}
          </Button>
          {accountingGates.canDelete && (
            <Popconfirm
              title={t('حذف السند؟', 'Delete voucher?')}
              description={t('لا يمكن التراجع عن هذا الإجراء.', 'This action cannot be undone.')}
              okButtonProps={{ danger: true }}
              okText={t('حذف', 'Delete')}
              cancelText={t('إلغاء', 'Cancel')}
              disabled={isLocked}
              onConfirm={handleDelete}
            >
              <Tooltip
                title={
                  isLocked ? t('لا يمكن حذف سند معمد', 'Cannot delete a posted voucher') : undefined
                }
              >
                <Button danger icon={<DeleteOutlined />} disabled={isLocked}>
                  {t('حذف', 'Delete')}
                </Button>
              </Tooltip>
            </Popconfirm>
          )}
        </>
      )}
    </Space>
  );

  return (
    <>
      <RecordDetailShell
        loading={isLoading}
        error={genericError ? error : undefined}
        notFound={notFound}
        onRetry={() => refetch()}
        breadcrumbs={[
          { label: t('السندات العامة', 'General Vouchers'), href: LIST_ROUTE },
          { label: displayNumber },
        ]}
        backHref={LIST_ROUTE}
        title={displayNumber}
        subtitle={
          voucher ? voucherTypeLabel(voucher.voucherType, isAr) : undefined
        }
        actions={actions}
      >
        {voucher &&
          (isEditing && accountingGates.canUpdate ? (
            <VoucherForm
              form={form}
              voucherType={voucher.voucherType}
              isAr={isAr}
              initialValue={voucher}
              attachment={attachment}
              onAttachmentChange={setAttachment}
            />
          ) : (
            <GeneralVoucherDetailView voucher={voucher} isAr={isAr} />
          ))}
      </RecordDetailShell>

      <DocumentTraceDrawer
        open={traceOpen}
        onClose={() => setTraceOpen(false)}
        trace={traceData}
        loading={isTraceLoading}
      />
    </>
  );
}
