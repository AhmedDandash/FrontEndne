'use client';

/**
 * Presentational mediation-contract detail body (tabs: info / financial /
 * follow-up / history / assignments / delivery / attachments / warranty).
 *
 * Extracted from the former inline "CONTRACT DETAILS MODAL" in page.tsx so it
 * has exactly one implementation, shared by the `[id]` route page (Phase 1).
 * Takes already-fetched data — no fetching here.
 */
import React from 'react';
import { Tabs, Divider, Descriptions, Alert, Image, Table, Timeline, Tag, Empty, Badge, Button, Progress } from 'antd';
import {
  DollarOutlined,
  EyeOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import { resolveImageUrl } from '@/utils/image';
import { ARRIVAL_DESTINATIONS, CANCEL_BY, getEnumLabel } from '@/constants/enums';
import type { MediationContractDetail } from '@/types/api.types';
import { formatCurrency, formatDate, getStatusConfigFromName, type Language } from '../_lib/format';
import styles from '../MediationContracts.module.css';

export interface MediationContractDetailViewProps {
  contract: MediationContractDetail;
  language: Language;
}

export default function MediationContractDetailView({
  contract,
  language,
}: MediationContractDetailViewProps) {
  const fmtCurrency = (v: number | null | undefined) => formatCurrency(v, language);
  const fmtDate = (v: string | null | undefined) => formatDate(v, language);
  const statusConfig = (name: string | null | undefined) => getStatusConfigFromName(name, language);
  const workerPhoto =
    contract.workerImageUrl ||
    contract.workerPhotoUrl ||
    (contract as any).worker?.workerImageUrl ||
    (contract as any).worker?.workerPhotoUrl ||
    (contract as any).worker?.uploadImage ||
    (contract as any).workerUploadImage ||
    (contract as any).uploadImage;

  const t = {
    customer: language === 'ar' ? 'العميل' : 'Customer',
    status: language === 'ar' ? 'الحالة' : 'Status',
    totalCost: language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost',
    localCost: language === 'ar' ? 'التكلفة المحلية' : 'Local Cost',
    agentCost: language === 'ar' ? 'تكلفة الوكيل' : 'Agent Cost',
    salary: language === 'ar' ? 'الراتب' : 'Salary',
    musanedNumber: language === 'ar' ? 'رقم مساند' : 'Musaned #',
    visaNumber: language === 'ar' ? 'رقم التأشيرة' : 'Visa Number',
    arrivalCity: language === 'ar' ? 'مدينة الوصول' : 'Arrival City',
    cancelContract: language === 'ar' ? 'إلغاء العقد' : 'Cancel Contract',
    otherCosts: language === 'ar' ? 'تكاليف أخرى' : 'Other Costs',
    taxValue: language === 'ar' ? 'قيمة الضريبة' : 'Tax Value',
    managerDiscount: language === 'ar' ? 'خصم المدير' : 'Manager Discount',
    costDiscount: language === 'ar' ? 'خصم التكلفة' : 'Cost Discount',
    insuranceCost: language === 'ar' ? 'تكلفة التأمين' : 'Insurance Cost',
    offerAmount: language === 'ar' ? 'قيمة العرض' : 'Offer Amount',
    deliveryDate: language === 'ar' ? 'تاريخ التسليم' : 'Delivery Date',
    deliveryNotes: language === 'ar' ? 'ملاحظات التسليم' : 'Delivery Notes',
    customerSignedAt: language === 'ar' ? 'تاريخ توقيع العميل' : 'Customer Signed At',
    returnDate: language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date',
    returnReason: language === 'ar' ? 'سبب الإرجاع' : 'Return Reason',
    daysWithCustomer: language === 'ar' ? 'أيام العامل عند العميل' : 'Days with Customer',
    refundAmount: language === 'ar' ? 'المبلغ المسترد (تقديري)' : 'Estimated Refund Amount',
    newWorkerLocation: language === 'ar' ? 'موقع العامل الجديد' : 'New Worker Location',
    changedBy: language === 'ar' ? 'بواسطة' : 'Changed By',
    note: language === 'ar' ? 'ملاحظة' : 'Note',
    totalPaid: language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid',
    remainingAmount: language === 'ar' ? 'المبلغ المتبقي' : 'Remaining',
    paymentStatus: language === 'ar' ? 'حالة السداد' : 'Payment Status',
    paymentProgress: language === 'ar' ? 'نسبة السداد' : 'Payment Progress',
    paymentHistory: language === 'ar' ? 'سجل الدفعات' : 'Payment History',
    paymentDate: language === 'ar' ? 'تاريخ الدفعة' : 'Date',
    amount: language === 'ar' ? 'المبلغ' : 'Amount',
    method: language === 'ar' ? 'طريقة الدفع' : 'Method',
    referenceNumber: language === 'ar' ? 'رقم المرجع' : 'Reference #',
    createdBy: language === 'ar' ? 'أُنشئ بواسطة' : 'Created By',
    noPayments: language === 'ar' ? 'لا توجد دفعات مسجلة' : 'No payments recorded',
  };

  // Payment-status tag colour: green = fully paid, orange = partial, red/default otherwise.
  const paymentStatusColor =
    contract.paymentStatusCode === 2 ? 'green' : contract.paymentStatusCode === 1 ? 'orange' : 'red';

  return (
    <Tabs
      defaultActiveKey="info"
      items={[
        {
          key: 'info',
          label: language === 'ar' ? 'معلومات العقد' : 'Contract Info',
          children: (
            <div className={styles.detailsModal}>
              <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c' }}>
                {language === 'ar' ? 'بيانات العميل' : 'Customer'}
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label={t.customer}>
                  {contract.customerName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'الرقم الوطني' : 'National ID'}>
                  {contract.customerNationalId || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'الجوال' : 'Phone'}>
                  {contract.customerPhone || '-'}
                </Descriptions.Item>
              </Descriptions>

              <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
                {language === 'ar' ? 'بيانات العامل' : 'Worker'}
              </Divider>
              {workerPhoto && (
                <div style={{ marginBlockEnd: 12 }}>
                  <Image
                    src={resolveImageUrl(workerPhoto)}
                    alt={contract.workerName || 'worker'}
                    width={96}
                    height={96}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIvPg=="
                  />
                </div>
              )}
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label={language === 'ar' ? 'اسم العامل' : 'Worker Name'}>
                  {contract.workerName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'رقم الجواز' : 'Passport'}>
                  {contract.workerPassportNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'الجنسية' : 'Nationality'}>
                  {contract.workerNationalityAr || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'نوع العامل' : 'Worker Type'}>
                  {contract.workerTypeName || '-'}
                </Descriptions.Item>
              </Descriptions>

              <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 20 }}>
                {language === 'ar' ? 'بيانات العقد' : 'Contract'}
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label={language === 'ar' ? 'رقم العقد' : 'Contract #'}>
                  {contract.contractNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t.status}>
                  <Badge
                    status={statusConfig(contract.statusName).color}
                    text={contract.statusName || '-'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'نوع العقد' : 'Contract Type'}>
                  {contract.contractTypeName || contract.contractType || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'فئة العقد' : 'Contract Category'}>
                  {contract.contractCategoryName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'الوكيل' : 'Agent'}>
                  {contract.agentName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'الفرع' : 'Branch'}>
                  {(language === 'ar' ? contract.branchNameAr : contract.branchNameEn) ||
                    contract.branchName ||
                    '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'أيام منذ الإنشاء' : 'Days Since Creation'}>
                  {contract.daysSinceCreation != null ? contract.daysSinceCreation : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t.musanedNumber}>
                  {contract.musanedContractNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'رقم توثيق مساند' : 'Musaned Doc #'}>
                  {contract.musanedDocumentationNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t.visaNumber}>
                  {contract.visaNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'حالة التأشيرة' : 'Visa Status'}>
                  {contract.visaStatusName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'نوع التأشيرة' : 'Visa Type'}>
                  {contract.visaType != null ? contract.visaType : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'تاريخ التأشيرة' : 'Visa Date'}>
                  {fmtDate(contract.visaDate)}
                  {contract.visaDateHijri ? ` (${contract.visaDateHijri})` : ''}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'تأشيرة تأهيل شامل' : 'Comprehensive Visa'}>
                  {contract.isComprehensiveQualificationVisa
                    ? (language === 'ar' ? 'نعم' : 'Yes')
                    : (language === 'ar' ? 'لا' : 'No')}
                </Descriptions.Item>
                <Descriptions.Item label={t.arrivalCity}>
                  {contract.arrivalDestinationName ||
                    (contract.arrivalDestinationId
                      ? getEnumLabel([...ARRIVAL_DESTINATIONS], contract.arrivalDestinationId, language)
                      : '-')}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}>
                  {fmtDate(contract.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label={language === 'ar' ? 'أُنشئ بواسطة' : 'Created By'}>
                  {contract.createdByName || '-'}
                </Descriptions.Item>
                {contract.contractEndNote && (
                  <Descriptions.Item label={language === 'ar' ? 'ملاحظة إنهاء العقد' : 'Contract End Note'} span={2}>
                    {contract.contractEndNote}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {contract.isCancel && (
                <Alert
                  type="warning"
                  showIcon
                  message={language === 'ar' ? 'هذا العقد ملغى' : 'This contract is cancelled'}
                  style={{ marginBlockStart: 16 }}
                />
              )}

              {contract.cancelNote && (
                <>
                  <Divider titlePlacement="left" style={{ fontSize: 13, color: '#ff4d4f', marginBlockStart: 20 }}>
                    {t.cancelContract}
                  </Divider>
                  <Alert
                    type="error"
                    showIcon
                    message={getEnumLabel([...CANCEL_BY], contract.cancelBy, language)}
                    description={contract.cancelNote}
                  />
                </>
              )}
            </div>
          ),
        },
        {
          key: 'financial',
          label: language === 'ar' ? 'التكاليف' : 'Financial',
          children: (
            <div className={styles.detailsModal}>
              {/* Total cost hero */}
              <div className={styles.totalCostBanner} style={{ marginBlockEnd: 20 }}>
                <div className={styles.totalCostMeta}>
                  <DollarOutlined className={styles.totalCostIcon} />
                  <span className={styles.totalCostLabel}>{t.totalCost}</span>
                </div>
                <div className={styles.totalCostAmount}>{fmtCurrency(contract.totalCost)}</div>
              </div>

              {/* Payment progress */}
              <div
                style={{
                  marginBlockEnd: 20,
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBlockEnd: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: '#8c8c8c' }}>{t.paymentProgress}</span>
                  <Tag color={paymentStatusColor}>
                    {contract.paymentStatus || t.paymentStatus}
                  </Tag>
                </div>
                <Progress
                  percent={Math.round(Math.min(100, contract.paymentPercentage ?? 0))}
                  status={contract.paymentStatusCode === 2 ? 'success' : 'active'}
                />
                <div style={{ display: 'flex', gap: 24, marginBlockStart: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{t.totalPaid}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                      {fmtCurrency(contract.totalPaid)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{t.remainingAmount}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                      {fmtCurrency(contract.remainingAmount)}
                    </div>
                  </div>
                </div>
              </div>

              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label={t.offerAmount}>
                  <span style={{ color: '#003366', fontWeight: 700 }}>{fmtCurrency(contract.offerAmount)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.localCost}>
                  <span style={{ color: '#52c41a', fontWeight: 700 }}>{fmtCurrency(contract.localCost)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.agentCost}>
                  <span style={{ color: '#faad14', fontWeight: 700 }}>{fmtCurrency(contract.agentCostSAR)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.salary}>
                  <span style={{ color: '#1890ff', fontWeight: 700 }}>{fmtCurrency(contract.salary)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.otherCosts}>
                  <span style={{ color: '#722ed1', fontWeight: 700 }}>{fmtCurrency(contract.otherCosts)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.taxValue}>
                  <span style={{ color: '#fa8c16', fontWeight: 700 }}>{fmtCurrency(contract.totalTaxValue)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.managerDiscount}>
                  <span style={{ color: '#ff4d4f', fontWeight: 700 }}>-{fmtCurrency(contract.managerDiscount)}</span>
                </Descriptions.Item>
                <Descriptions.Item label={t.costDiscount}>
                  <span style={{ color: '#ff4d4f', fontWeight: 700 }}>-{fmtCurrency(contract.costDiscount)}</span>
                </Descriptions.Item>
                {contract.hasContractInsurance && (
                  <Descriptions.Item label={t.insuranceCost}>
                    <span style={{ color: '#13c2c2', fontWeight: 700 }}>{fmtCurrency(contract.domesticWorkerInsurance)}</span>
                  </Descriptions.Item>
                )}
              </Descriptions>

              {contract.costDescription && (
                <Alert
                  type="info"
                  showIcon
                  message={language === 'ar' ? 'ملاحظة التكلفة' : 'Cost Note'}
                  description={contract.costDescription}
                  style={{ marginBlockStart: 16 }}
                />
              )}

              {/* Payment history */}
              <Divider titlePlacement="left" style={{ fontSize: 13, color: '#8c8c8c', marginBlockStart: 24 }}>
                {t.paymentHistory}
              </Divider>
              {contract.payments && contract.payments.length > 0 ? (
                <Table
                  dataSource={contract.payments}
                  rowKey={(row, index) => row.id ?? String(index)}
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: t.paymentDate,
                      dataIndex: 'paymentDate',
                      render: (v: string) => fmtDate(v),
                    },
                    {
                      title: t.amount,
                      dataIndex: 'amount',
                      render: (v: number) => (
                        <span style={{ color: '#52c41a', fontWeight: 700 }}>{fmtCurrency(v)}</span>
                      ),
                    },
                    {
                      title: t.method,
                      dataIndex: 'paymentMethodName',
                      render: (v: string) => v || '-',
                    },
                    {
                      title: t.referenceNumber,
                      dataIndex: 'referenceNumber',
                      render: (v: string) => v || '-',
                    },
                    {
                      title: t.note,
                      dataIndex: 'notes',
                      render: (v: string) => v || '-',
                    },
                    {
                      title: t.createdBy,
                      dataIndex: 'createdBy',
                      render: (v: string) => v || '-',
                    },
                  ]}
                />
              ) : (
                <Empty description={t.noPayments} />
              )}
            </div>
          ),
        },
        {
          key: 'followup',
          label: language === 'ar' ? 'المتابعة' : 'Follow-up',
          children: (
            <div className={styles.detailsModal}>
              {contract.followUpItems && contract.followUpItems.length > 0 ? (
                <Table
                  dataSource={contract.followUpItems}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: language === 'ar' ? 'الحالة' : 'Status',
                      render: (_: any, row: any) => language === 'ar' ? row.statusNameAr : row.statusNameEn,
                    },
                    {
                      title: language === 'ar' ? 'النتيجة' : 'Result',
                      dataIndex: 'resultName',
                      render: (v: string) => {
                        // Result enum: Pending / Completed / Failed / Skipped
                        const color =
                          v === 'Completed' ? 'green'
                          : v === 'Failed' ? 'red'
                          : v === 'Pending' ? 'orange'
                          : 'default';
                        return <Tag color={color}>{v || '-'}</Tag>;
                      },
                    },
                    {
                      title: language === 'ar' ? 'أقصى أيام' : 'Max Days',
                      dataIndex: 'maxDays',
                      align: 'center',
                    },
                    {
                      title: language === 'ar' ? 'مكتمل في' : 'Completed At',
                      dataIndex: 'completedAt',
                      render: (v: string) => fmtDate(v),
                    },
                    {
                      title: language === 'ar' ? 'ملاحظات' : 'Notes',
                      dataIndex: 'notes',
                      render: (v: string) => v || '-',
                    },
                  ]}
                />
              ) : (
                <Empty description={language === 'ar' ? 'لا توجد عناصر متابعة' : 'No follow-up items'} />
              )}
            </div>
          ),
        },
        {
          key: 'history',
          label: language === 'ar' ? 'سجل الحالات' : 'Status History',
          children: (
            <div className={styles.detailsModal}>
              {contract.statusHistories && contract.statusHistories.length > 0 ? (
                <Timeline
                  mode="left"
                  items={contract.statusHistories.map((h) => ({
                    color: h.newStatusName === 'Cancelled' ? 'red' : h.newStatusName === 'Signed' || h.newStatusName === 'Delivered' ? 'green' : 'blue',
                    label: fmtDate(h.createdAt),
                    children: (
                      <div>
                        <div style={{ marginBlockEnd: 4 }}>
                          <Tag color="default">{h.oldStatusName || '—'}</Tag>
                          {' → '}
                          <Tag color="blue">{h.newStatusName || '—'}</Tag>
                        </div>
                        {h.notes && <div style={{ fontSize: 13, color: '#595959' }}>{h.notes}</div>}
                        {h.createdByName && (
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginBlockStart: 2 }}>
                            {t.changedBy}: {h.createdByName}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty description={language === 'ar' ? 'لا يوجد سجل حالات' : 'No status history'} />
              )}
            </div>
          ),
        },
        {
          key: 'assignments',
          label: language === 'ar' ? 'سجل الإسنادات' : 'Worker Assignments',
          children: (
            <div className={styles.detailsModal}>
              {contract.workerAssignments && contract.workerAssignments.length > 0 ? (
                <Timeline
                  mode="left"
                  items={contract.workerAssignments.map((a, idx) => ({
                    key: a.id ?? idx,
                    color: a.isActive ? 'green' : 'gray',
                    label: fmtDate(a.assignedAt),
                    children: (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {(a.workerImageUrl || a.workerPhotoUrl) && (
                          <Image
                            src={resolveImageUrl(a.workerImageUrl || a.workerPhotoUrl)}
                            alt={a.workerNameAr || 'worker'}
                            width={48}
                            height={48}
                            style={{ objectFit: 'cover', borderRadius: 6 }}
                            preview={false}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {(language === 'ar' ? a.workerNameAr : a.workerNameEn) ||
                              a.workerNameAr ||
                              a.workerNameEn ||
                              '-'}
                            {a.isActive && (
                              <Tag color="green" style={{ marginInlineStart: 8 }}>
                                {language === 'ar' ? 'نشط' : 'Active'}
                              </Tag>
                            )}
                          </div>
                          {a.workerPassportNumber && (
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              {language === 'ar' ? 'رقم الجواز' : 'Passport'}: {a.workerPassportNumber}
                            </div>
                          )}
                          {a.endedAt && (
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              {language === 'ar' ? 'انتهى في' : 'Ended at'}: {fmtDate(a.endedAt)}
                            </div>
                          )}
                          {a.endReason && (
                            <div style={{ fontSize: 13, color: '#595959' }}>
                              {language === 'ar' ? 'السبب' : 'Reason'}: {a.endReason}
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty
                  description={
                    language === 'ar' ? 'لا يوجد سجل إسنادات' : 'No worker assignment history'
                  }
                />
              )}
            </div>
          ),
        },
        {
          key: 'delivery',
          label: language === 'ar' ? 'نموذج التسليم' : 'Delivery Form',
          children: (
            <div className={styles.detailsModal}>
              {contract.deliveryForm ? (
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label={t.deliveryDate}>
                    {fmtDate(contract.deliveryForm.deliveryDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t.customerSignedAt}>
                    {fmtDate(contract.deliveryForm.customerSignedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}>
                    {fmtDate(contract.deliveryForm.createdAt)}
                  </Descriptions.Item>
                  {contract.deliveryForm.notes && (
                    <Descriptions.Item label={t.deliveryNotes} span={2}>
                      {contract.deliveryForm.notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              ) : (
                <Empty description={language === 'ar' ? 'لم يُنشأ نموذج التسليم بعد' : 'Delivery form not yet generated'} />
              )}
            </div>
          ),
        },
        {
          key: 'attachments',
          label: (
            <span>
              {language === 'ar' ? 'المرفقات' : 'Attachments'}
              {contract.attachments && contract.attachments.length > 0 && (
                <Badge count={contract.attachments.length} size="small" style={{ marginInlineStart: 6 }} />
              )}
            </span>
          ),
          children: (
            <div className={styles.detailsModal}>
              {contract.attachments && contract.attachments.length > 0 ? (
                <Image.PreviewGroup>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {contract.attachments.map((attachment, idx) => {
                      const isFullUrl = attachment.startsWith('http');
                      const url = isFullUrl ? attachment : `/${attachment}`;
                      const isPdf = attachment.toLowerCase().endsWith('.pdf');
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(attachment);
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            border: '1px solid #e8e8e8',
                            borderRadius: 8,
                            background: '#fafafa',
                          }}
                        >
                          {isPdf ? (
                            <FilePdfOutlined style={{ fontSize: 28, color: '#e53e3e', flexShrink: 0 }} />
                          ) : isImage ? (
                            <Image
                              src={url}
                              alt={`${language === 'ar' ? 'مرفق' : 'Attachment'} ${idx + 1}`}
                              width={56}
                              height={56}
                              style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8', flexShrink: 0 }}
                              preview={{ mask: <EyeOutlined /> }}
                            />
                          ) : (
                            <PaperClipOutlined style={{ fontSize: 28, color: '#1890ff', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: '#1d1d1d' }}>
                              {language === 'ar' ? `مرفق ${idx + 1}` : `Attachment ${idx + 1}`}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#8c8c8c',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {attachment}
                            </div>
                          </div>
                          <Button
                            type="link"
                            icon={isPdf ? <DownloadOutlined /> : <EyeOutlined />}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ flexShrink: 0 }}
                          >
                            {language === 'ar' ? (isPdf ? 'تحميل' : 'عرض') : (isPdf ? 'Download' : 'View')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Image.PreviewGroup>
              ) : (
                <Empty description={language === 'ar' ? 'لا توجد مرفقات' : 'No attachments'} />
              )}
            </div>
          ),
        },
        {
          key: 'warranty',
          label: language === 'ar' ? 'الضمان والإرجاع' : 'Warranty Return',
          children: (
            <div className={styles.detailsModal}>
              {contract.warrantyReturn ? (
                <>
                  <Alert
                    type="warning"
                    showIcon
                    message={language === 'ar' ? 'تم إرجاع العامل ضمن فترة الضمان' : 'Worker returned within warranty period'}
                    style={{ marginBlockEnd: 16 }}
                  />
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label={t.returnDate}>
                      {fmtDate(contract.warrantyReturn.returnDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t.returnReason}>
                      {contract.warrantyReturn.returnReasonName || contract.warrantyReturn.returnReason || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t.daysWithCustomer}>
                      {contract.warrantyReturn.daysWithCustomer ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t.refundAmount}>
                      <span style={{ color: '#fa8c16', fontWeight: 700 }}>
                        {fmtCurrency(contract.warrantyReturn.refundAmount)}
                      </span>
                    </Descriptions.Item>
                    {contract.warrantyReturn.newWorkerLocation && (
                      <Descriptions.Item label={t.newWorkerLocation} span={2}>
                        {contract.warrantyReturn.newWorkerLocation}
                      </Descriptions.Item>
                    )}
                    {contract.warrantyReturn.notes && (
                      <Descriptions.Item label={t.note} span={2}>
                        {contract.warrantyReturn.notes}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label={language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}>
                      {fmtDate(contract.warrantyReturn.createdAt)}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              ) : (
                <Empty description={language === 'ar' ? 'لا يوجد إرجاع ضمان' : 'No warranty return recorded'} />
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
