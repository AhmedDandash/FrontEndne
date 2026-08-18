/**
 * A single contract card: summary body + status-conditional action buttons.
 * Action availability by status:
 *   Draft (1)     → Sign, Edit, Delete
 *   Signed (2)    → Start Execution, Print, Edit
 *   Executing (3) → Renew, Terminate, Receipt Voucher, Print
 *   Finished (4)  → Customer Refund, Print
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Col, Button, Tag, Avatar, Badge, Dropdown, Space, Popconfirm } from 'antd';
import type { MenuProps } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
  TeamOutlined,
  ReloadOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  StopOutlined,
  FileDoneOutlined,
  DollarOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { RentContract } from './types';
import { linkProps } from '@/lib/navigation/linkProps';
import { getStatusMeta } from './mapping';
import { formatDate, formatCurrency } from './format';
import styles from '../RentContracts.module.css';

export interface ContractCardActions {
  onEdit?: (c: RentContract) => void;
  onDelete?: (c: RentContract) => void;
  onSign?: (c: RentContract) => void;
  onStartExecution?: (c: RentContract) => void;
  onRenew?: (c: RentContract) => void;
  onTerminate?: (c: RentContract) => void;
  onRefund?: (c: RentContract) => void;
  onReceipts: (c: RentContract) => void;
  onPrint: (c: RentContract) => void;
  onDeliveryForm?: (c: RentContract) => void;
  onHandoverReceipt?: (c: RentContract) => void;
}

interface Props {
  contract: RentContract;
  isRtl: boolean;
  loading: {
    isSigning: boolean;
    isStartingExecution: boolean;
    isRenewing: boolean;
    isTerminating: boolean;
    isDeleting: boolean;
    isRefunding: boolean;
  };
  actions: ContractCardActions;
}

export default function ContractCard({ contract, isRtl, loading, actions }: Props) {
  const router = useRouter();
  const viewHref = `/contracts/operation/rent/${contract.id}`;
  const t = {
    viewDetails: isRtl ? 'عرض التفاصيل' : 'View Details',
    edit: isRtl ? 'تعديل' : 'Edit',
    delete: isRtl ? 'حذف' : 'Delete',
    printReceipt: isRtl ? 'طباعة الإيصال' : 'Print Receipt',
    deliveryForm: isRtl ? 'نموذج تسليم العامل' : 'Worker Delivery Form',
    handoverReceipt: isRtl ? 'إيصال استلام موقّع' : 'Signed Handover Receipt',
    signContract: isRtl ? 'توقيع العقد' : 'Sign Contract',
    startExecution: isRtl ? 'بدء التنفيذ' : 'Start Execution',
    renewContract: isRtl ? 'تجديد العقد' : 'Renew Contract',
    terminateContract: isRtl ? 'إنهاء العقد' : 'Terminate Contract',
    receipts: isRtl ? 'سندات القبض' : 'Receipts',
    customerRefund: isRtl ? 'استرداد العميل' : 'Customer Refund',
    confirmDelete: isRtl ? 'هل أنت متأكد من حذف هذا العقد؟' : 'Are you sure you want to delete this contract?',
    yes: isRtl ? 'نعم' : 'Yes',
    no: isRtl ? 'لا' : 'No',
    worker: isRtl ? 'العامل' : 'Worker',
    nationality: isRtl ? 'الجنسية' : 'Nationality',
    profession: isRtl ? 'المهنة' : 'Profession',
    monthlyRent: isRtl ? 'التكلفة' : 'Cost',
    daysLeft: isRtl ? 'الأيام المتبقية' : 'Days Left',
  };

  const statusMeta = getStatusMeta(contract.status, isRtl);

  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: <a {...linkProps(viewHref, router)}>{t.viewDetails}</a>,
      icon: <EyeOutlined />,
    },
  ];
  if ((contract.contractStatus === 1 || contract.contractStatus === 2) && actions.onEdit) {
    menuItems.push({ key: 'edit', label: t.edit, icon: <EditOutlined />, onClick: () => actions.onEdit?.(contract) });
  }
  if (contract.contractStatus !== 1) {
    menuItems.push({
      key: 'receipts',
      label: t.receipts,
      icon: <FileDoneOutlined />,
      onClick: () => actions.onReceipts(contract),
    });
  }
  menuItems.push({
    key: 'print',
    label: t.printReceipt,
    icon: <PrinterOutlined />,
    onClick: () => actions.onPrint(contract),
  });
  // Delivery form — relevant once a worker is handed over (not for a bare Draft).
  if (contract.contractStatus !== 1 && actions.onDeliveryForm) {
    menuItems.push({
      key: 'delivery-form',
      label: t.deliveryForm,
      icon: <SolutionOutlined />,
      onClick: () => actions.onDeliveryForm?.(contract),
    });
  }
  // Signed handover receipt — needs an assigned worker and a Signed/Executing contract.
  if (contract.workerId && (contract.contractStatus === 2 || contract.contractStatus === 3) && actions.onHandoverReceipt) {
    menuItems.push({
      key: 'handover-receipt',
      label: t.handoverReceipt,
      icon: <SafetyCertificateOutlined />,
      onClick: () => actions.onHandoverReceipt?.(contract),
    });
  }
  if (contract.contractStatus === 1 && actions.onDelete) {
    menuItems.push({ type: 'divider' });
    menuItems.push({
      key: 'delete',
      label: (
        <Popconfirm
          title={t.confirmDelete}
          okText={t.yes}
          cancelText={t.no}
          onConfirm={() => actions.onDelete?.(contract)}
        >
          <span style={{ color: '#ff4d4f' }}>
            <DeleteOutlined style={{ marginInlineEnd: 8 }} />
            {t.delete}
          </span>
        </Popconfirm>
      ),
    });
  }

  const renderActions = () => {
    switch (contract.contractStatus) {
      case 1:
        return (
          <Space wrap>
            {actions.onSign && (
              <Popconfirm
                title={isRtl ? 'هل تريد توقيع هذا العقد؟' : 'Sign this contract?'}
                okText={t.yes}
                cancelText={t.no}
                onConfirm={() => actions.onSign?.(contract)}
              >
                <Button type="primary" icon={<CheckCircleOutlined />} loading={loading.isSigning} size="small">
                  {t.signContract}
                </Button>
              </Popconfirm>
            )}
            {actions.onEdit && (
              <Button icon={<EditOutlined />} size="small" onClick={() => actions.onEdit?.(contract)}>
                {t.edit}
              </Button>
            )}
            {actions.onDelete && (
              <Popconfirm
                title={t.confirmDelete}
                okText={t.yes}
                cancelText={t.no}
                onConfirm={() => actions.onDelete?.(contract)}
              >
                <Button danger icon={<DeleteOutlined />} size="small" loading={loading.isDeleting}>
                  {t.delete}
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      case 2:
        return (
          <Space wrap>
            {actions.onStartExecution && (
              <Popconfirm
                title={isRtl ? 'هل تريد بدء تنفيذ العقد؟' : 'Start contract execution?'}
                okText={t.yes}
                cancelText={t.no}
                onConfirm={() => actions.onStartExecution?.(contract)}
              >
                <Button type="primary" icon={<PlayCircleOutlined />} loading={loading.isStartingExecution} size="small">
                  {t.startExecution}
                </Button>
              </Popconfirm>
            )}
            <Button icon={<PrinterOutlined />} size="small" onClick={() => actions.onPrint(contract)}>
              {t.printReceipt}
            </Button>
            {actions.onEdit && (
              <Button icon={<EditOutlined />} size="small" onClick={() => actions.onEdit?.(contract)}>
                {t.edit}
              </Button>
            )}
          </Space>
        );
      case 3:
        return (
          <Space wrap>
            {actions.onRenew && (
              <Button type="primary" icon={<ReloadOutlined />} size="small" onClick={() => actions.onRenew?.(contract)} loading={loading.isRenewing}>
                {t.renewContract}
              </Button>
            )}
            <Button icon={<FileDoneOutlined />} size="small" onClick={() => actions.onReceipts(contract)}>
              {t.receipts}
            </Button>
            {actions.onTerminate && (
              <Button danger icon={<StopOutlined />} size="small" onClick={() => actions.onTerminate?.(contract)} loading={loading.isTerminating}>
                {t.terminateContract}
              </Button>
            )}
            <Button icon={<PrinterOutlined />} size="small" onClick={() => actions.onPrint(contract)}>
              {t.printReceipt}
            </Button>
          </Space>
        );
      case 4:
        return (
          <Space wrap>
            {actions.onRefund && (
              <Button type="primary" icon={<DollarOutlined />} size="small" onClick={() => actions.onRefund?.(contract)} loading={loading.isRefunding}>
                {t.customerRefund}
              </Button>
            )}
            <Button icon={<PrinterOutlined />} size="small" onClick={() => actions.onPrint(contract)}>
              {t.printReceipt}
            </Button>
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <Col xs={24} key={contract.id}>
      <Card className={styles.contractCard} hoverable>
        <div className={styles.cardContent}>
          <div className={styles.cardLeft}>
            <div className={styles.cardHeader}>
              <div className={styles.contractNumber}>
                <FileTextOutlined className={styles.contractIcon} />
                <span>#{contract.contractNumber}</span>
              </div>
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button type="text" icon={<MoreOutlined />} className={styles.moreBtn} />
              </Dropdown>
            </div>

            <div className={styles.tagsSection}>
              <Badge status={statusMeta.color as any} text={statusMeta.label} />
              {contract.contractStatus === 3 && !!contract.endDate && contract.daysRemaining < 30 && (
                <Tag color="warning" icon={<ClockCircleOutlined />}>
                  {contract.daysRemaining} {t.daysLeft}
                </Tag>
              )}
              {!!(isRtl ? contract.branchAr : contract.branch) && (
                <Tag icon={<BankOutlined />} color="blue">
                  {isRtl ? contract.branchAr : contract.branch}
                </Tag>
              )}
            </div>

            <div className={styles.customerSection}>
              <Avatar size={44} icon={<UserOutlined />} className={styles.customerAvatar} />
              <div className={styles.customerDetails}>
                <span className={styles.customerName}>
                  {isRtl ? contract.customerNameAr : contract.customerName}
                </span>
                <div className={styles.customerMeta}>
                  <PhoneOutlined />
                  <span dir="ltr">{contract.customerPhone}</span>
                </div>
              </div>
            </div>

            <div className={styles.workerSection}>
              <div className={styles.workerItem}>
                <HomeOutlined className={styles.workerIcon} />
                <div className={styles.workerText}>
                  <span className={styles.workerLabel}>{t.worker}</span>
                  <span className={styles.workerValue}>{isRtl ? contract.workerNameAr : contract.workerName}</span>
                </div>
              </div>
              <div className={styles.workerItem}>
                <EnvironmentOutlined className={styles.workerIcon} />
                <div className={styles.workerText}>
                  <span className={styles.workerLabel}>{t.nationality}</span>
                  <span className={styles.workerValue}>{isRtl ? contract.nationalityAr : contract.nationality}</span>
                </div>
              </div>
              <div className={styles.workerItem}>
                <TeamOutlined className={styles.workerIcon} />
                <div className={styles.workerText}>
                  <span className={styles.workerLabel}>{t.profession}</span>
                  <span className={styles.workerValue}>{isRtl ? contract.professionAr : contract.profession}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cardRight}>
            <div className={styles.rentSection}>
              <div className={styles.rentHeader}>
                <span className={styles.rentLabel}>{t.monthlyRent}</span>
                <span className={styles.rentAmount}>{formatCurrency(contract.monthlyRent, isRtl)}</span>
              </div>
            </div>

            <div className={styles.datesSection}>
              <div className={styles.dateItem}>
                <CalendarOutlined />
                <span>{formatDate(contract.startDate, isRtl)}</span>
              </div>
              <span className={styles.dateSeparator}>→</span>
              <div className={styles.dateItem}>
                <CalendarOutlined />
                <span>{formatDate(contract.endDate, isRtl)}</span>
              </div>
            </div>

            <Button type="primary" block icon={<EyeOutlined />} className={styles.viewBtn} {...linkProps(viewHref, router)}>
              {t.viewDetails}
            </Button>
          </div>
        </div>

        <div className={styles.cardBottom}>
          <div className={styles.actionsList}>{renderActions()}</div>
        </div>
      </Card>
    </Col>
  );
}
