'use client';

/**
 * Presentational sponsorship-transfer contract detail body (tabs: info /
 * financial). Extracted from the former inline `ContractDetailsModal`
 * function in page.tsx so it has exactly one implementation, shared by the
 * `[id]` route page (Phase 1). Takes an already-fetched `TransferContract` —
 * no fetching here.
 */
import React from 'react';
import { Tabs, Divider, Descriptions, Badge, Alert } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { TRANSFER_CONTRACT_STATUS, PAYMENT_MEANS_CODE_TYPE, getEnumLabel } from '@/constants/enums';
import type { TransferContract } from '@/types/api.types';
import { formatCurrency, formatDate, getStatusConfig } from '../_lib/format';
import styles from '../SponsorshipTransfer.module.css';

export interface SponsorshipTransferDetailViewProps {
  contract: TransferContract;
  language: 'ar' | 'en';
}

export default function SponsorshipTransferDetailView({
  contract,
  language,
}: SponsorshipTransferDetailViewProps) {
  const status = contract.contractStatus ?? 1;
  const cfg = getStatusConfig(status);
  const paid = contract.paidAmount ?? 0;
  const remaining = (contract.totalAmount ?? 0) - paid;

  const t = {
    customerName: language === 'ar' ? 'العميل' : 'Customer',
    workerName: language === 'ar' ? 'العامل' : 'Worker',
    contractNumber: language === 'ar' ? 'رقم العقد' : 'Contract #',
    creationDate: language === 'ar' ? 'تاريخ الإنشاء' : 'Created On',
    createdBy: language === 'ar' ? 'بواسطة' : 'Created By',
    totalAmount: language === 'ar' ? 'الإجمالي' : 'Total',
    paidAmount: language === 'ar' ? 'المدفوع' : 'Paid',
    remainingAmount: language === 'ar' ? 'المتبقي' : 'Remaining',
    trialPeriod: language === 'ar' ? 'فترة التجربة' : 'Trial Period',
    trialDays: language === 'ar' ? 'يوم' : 'Days',
    transferDate: language === 'ar' ? 'تاريخ النقل' : 'Transfer Date',
    transferFees: language === 'ar' ? 'رسوم النقل' : 'Transfer Fees',
    governmentFees: language === 'ar' ? 'الرسوم الحكومية' : 'Government Fees',
    paymentType: language === 'ar' ? 'نوع السداد' : 'Payment Type',
    notes: language === 'ar' ? 'ملاحظات' : 'Notes',
    marketer: language === 'ar' ? 'المسوق' : 'Marketer',
  };

  return (
    <Tabs
      defaultActiveKey="info"
      items={[
        {
          key: 'info',
          label: language === 'ar' ? 'معلومات العقد' : 'Contract Info',
          children: (
            <div className={styles.detailsModal}>
              <Divider style={{ fontSize: 13, color: '#8c8c8c' }}>
                {language === 'ar' ? 'بيانات الأطراف' : 'Parties'}
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label={t.customerName}>
                  {contract.customerName ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t.workerName}>
                  {contract.workerName ?? '—'}
                </Descriptions.Item>
                {contract.workerIdNumber && (
                  <Descriptions.Item label={language === 'ar' ? 'رقم الهوية' : 'ID Number'}>
                    {contract.workerIdNumber}
                  </Descriptions.Item>
                )}
                {contract.marketerName && (
                  <Descriptions.Item label={t.marketer}>
                    {contract.marketerName}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
                {language === 'ar' ? 'بيانات العقد' : 'Contract Details'}
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label={t.contractNumber}>
                  {contract.contractNumber ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'الحالة' : 'Status'}>
                  <Badge
                    status={cfg.color}
                    text={getEnumLabel(TRANSFER_CONTRACT_STATUS, status, language)}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={t.creationDate}>
                  {formatDate(contract.createdDate, language)}
                </Descriptions.Item>
                {contract.createdByName && (
                  <Descriptions.Item label={t.createdBy}>
                    {contract.createdByName}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={t.trialPeriod}>
                  {contract.trialPeriodDays ? `${contract.trialPeriodDays} ${t.trialDays}` : '—'}
                </Descriptions.Item>
                {contract.approvalDate && (
                  <Descriptions.Item label={t.transferDate}>
                    {formatDate(contract.approvalDate, language)}
                  </Descriptions.Item>
                )}
                {contract.notes && (
                  <Descriptions.Item label={t.notes} span={2}>
                    {contract.notes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          ),
        },
        {
          key: 'financial',
          label: language === 'ar' ? 'المالية' : 'Financial',
          children: (
            <div className={styles.detailsModal}>
              <div className={styles.totalCostBanner}>
                <div className={styles.totalCostMeta}>
                  <DollarOutlined className={styles.totalCostIcon} />
                  <span className={styles.totalCostLabel}>{t.totalAmount}</span>
                </div>
                <div className={styles.totalCostAmount}>
                  {formatCurrency(contract.totalAmount, language)}
                </div>
              </div>
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label={t.paidAmount}>
                  <span style={{ color: '#00aa64', fontWeight: 700 }}>
                    {formatCurrency(paid, language)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t.remainingAmount}>
                  <span style={{ color: remaining > 0 ? '#ff4d4f' : '#00aa64', fontWeight: 700 }}>
                    {formatCurrency(remaining, language)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t.paymentType}>
                  {contract.paymentMeansName ||
                    getEnumLabel(PAYMENT_MEANS_CODE_TYPE, contract.paymentMeansCodeTypeId, language)}
                </Descriptions.Item>
                <Descriptions.Item label={t.transferFees}>
                  <span style={{ color: '#003366', fontWeight: 700 }}>
                    {formatCurrency(contract.transferFees, language)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label={t.governmentFees}>
                  <span style={{ color: '#faad14', fontWeight: 700 }}>
                    {formatCurrency(contract.governmentFees, language)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
              {remaining > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message={language === 'ar' ? 'يوجد مبلغ متبقٍّ غير مدفوع' : 'There is an outstanding unpaid balance'}
                  style={{ marginBlockStart: 16 }}
                />
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
