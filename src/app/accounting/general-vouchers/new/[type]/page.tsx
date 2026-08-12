'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Result, Space, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useAuthStore } from '@/store/authStore';
import {
  useCreateGeneralVoucher,
  useUploadVoucherAttachment,
  useValidateVoucherBalance,
} from '@/hooks/api/useGeneralVouchers';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import VoucherForm, { buildVoucherDto } from '../../_components/VoucherForm';
import { voucherTypeLabel } from '../../_lib/generalVoucherDisplay';
import { GENERAL_VOUCHER_TYPE, VOUCHER_TYPE_SLUGS } from '@/types/general-voucher.types';
import type { JournalLineRow } from '../../_components/VoucherJournalLines';

const LIST_ROUTE = '/accounting/general-vouchers';

export default function NewGeneralVoucherPage({ params }: { params: { type: string } }) {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const [form] = Form.useForm();
  const [attachment, setAttachment] = useState<UploadFile[]>([]);

  const voucherType = VOUCHER_TYPE_SLUGS[params.type];

  const { mutateAsync: createVoucher, isPending: isCreating } = useCreateGeneralVoucher();
  const { mutateAsync: uploadAttachment } = useUploadVoucherAttachment();
  const { mutateAsync: validateBalance } = useValidateVoucherBalance();

  // An unrecognised slug is a bad URL, not a failed fetch — handled before
  // the shell so it doesn't render an empty form.
  if (!voucherType) {
    return (
      <Result
        status="404"
        title={t('نوع سند غير معروف', 'Unknown voucher type')}
        subTitle={t(
          'الرابط الذي فتحته لا يطابق أي نوع سند.',
          'The URL you opened does not match any voucher type.'
        )}
        extra={
          <Button type="primary" onClick={() => router.push(LIST_ROUTE)}>
            {t('العودة إلى السندات', 'Back to Vouchers')}
          </Button>
        }
      />
    );
  }

  const handleSave = async () => {
    try {
      await handleSaveInner();
    } catch {
      // Form-validation rejection (antd already shows the inline field error)
      // or a mutation failure (the mutation's own onError already shows a
      // toast). Swallow here so it doesn't bubble as an unhandled promise
      // rejection — this handler is a bare onClick, so nothing else catches it.
    }
  };

  const handleSaveInner = async () => {
    const values = await form.validateFields();
    const lines: JournalLineRow[] = form.getFieldValue('lines') ?? [];

    // Multi-line vouchers must balance. Checked server-side first (that is the
    // authority), but a failed round-trip falls back to the local sum rather
    // than blocking the save path entirely.
    if (voucherType === GENERAL_VOUCHER_TYPE.MultiplePayment) {
      const payloadLines = lines.filter(
        (line) => line.accountId && (line.debit > 0 || line.credit > 0)
      );

      if (payloadLines.length < 2) {
        message.error(
          t('يجب إدخال سطرين على الأقل', 'At least two journal lines are required')
        );
        return;
      }
      if (payloadLines.some((line) => !line.accountId)) {
        message.error(t('يجب اختيار حساب لكل سطر', 'Every line needs an account'));
        return;
      }

      const totals = payloadLines.reduce(
        (acc, line) => ({
          debit: acc.debit + (Number(line.debit) || 0),
          credit: acc.credit + (Number(line.credit) || 0),
        }),
        { debit: 0, credit: 0 }
      );

      const balanced = await validateBalance(
        payloadLines.map((line) => ({
          accountId: line.accountId,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        }))
      ).catch(() => ({ isBalanced: Math.abs(totals.debit - totals.credit) < 0.005 }) as const);

      if (!balanced.isBalanced) {
        message.error(
          t(
            'القيد غير متوازن — يجب أن يتساوى إجمالي المدين مع الدائن',
            'Entry is not balanced — total debit must equal total credit'
          )
        );
        return;
      }
    }

    const dto = buildVoucherDto(values, voucherType, lines);
    const created = await createVoucher(dto);

    // The attachment endpoint is POST /{id}/attachment, so it can only run
    // once the voucher exists. A failed upload must not discard the saved
    // voucher — surface it and continue to the detail page.
    const file = attachment[0]?.originFileObj;
    if (file && created?.id) {
      try {
        await uploadAttachment({ id: created.id, file: file as File });
      } catch {
        message.warning(
          t(
            'تم حفظ السند لكن فشل رفع المرفق. يمكنك رفعه لاحقًا.',
            'Voucher saved, but the attachment failed to upload. You can retry from the voucher page.'
          )
        );
      }
    }

    router.push(created?.id ? `${LIST_ROUTE}/${created.id}` : LIST_ROUTE);
  };

  const title = t(
    `إضافة ${voucherTypeLabel(voucherType, true)}`,
    `New ${voucherTypeLabel(voucherType, false)}`
  );

  return (
    <RecordDetailShell
      breadcrumbs={[
        { label: t('السندات العامة', 'General Vouchers'), href: LIST_ROUTE },
        { label: title },
      ]}
      backHref={LIST_ROUTE}
      title={title}
      actions={
        <Space>
          <Button onClick={() => router.push(LIST_ROUTE)}>{t('إلغاء', 'Cancel')}</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={isCreating} onClick={handleSave}>
            {t('حفظ', 'Save')}
          </Button>
        </Space>
      }
    >
      <VoucherForm
        form={form}
        voucherType={voucherType}
        isAr={isAr}
        attachment={attachment}
        onAttachmentChange={setAttachment}
      />
    </RecordDetailShell>
  );
}
