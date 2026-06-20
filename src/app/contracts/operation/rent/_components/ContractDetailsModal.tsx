/**
 * Read-only contract details modal.
 */
'use client';

import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'antd';
import type { RentContract } from './types';
import { getStatusMeta } from './mapping';
import { formatDate, formatCurrency } from './format';
import styles from '../RentContracts.module.css';

interface Props {
  contract: RentContract | null;
  open: boolean;
  isRtl: boolean;
  onClose: () => void;
}

export default function ContractDetailsModal({ contract, open, isRtl, onClose }: Props) {
  const t = {
    contractNumber: isRtl ? 'رقم العقد' : 'Contract Number',
    customer: isRtl ? 'العميل' : 'Customer',
    worker: isRtl ? 'العامل' : 'Worker',
    status: isRtl ? 'الحالة' : 'Status',
    nationality: isRtl ? 'الجنسية' : 'Nationality',
    startDate: isRtl ? 'تاريخ البداية' : 'Start Date',
    endDate: isRtl ? 'تاريخ النهاية' : 'End Date',
    monthlyRent: isRtl ? 'التكلفة' : 'Cost',
    profession: isRtl ? 'المهنة' : 'Profession',
    phone: isRtl ? 'الهاتف' : 'Phone',
  };

  return (
    <Modal
      title={`${t.contractNumber}: #${contract?.contractNumber}`}
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          {isRtl ? 'إغلاق' : 'Close'}
        </Button>
      }
      width={650}
    >
      {contract && (
        <div className={styles.detailsModal}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div className={styles.modalSection}>
                <h4>{t.customer}</h4>
                <p className={styles.modalValue}>{isRtl ? contract.customerNameAr : contract.customerName}</p>
              </div>
            </Col>
            <Col span={24}>
              <div className={styles.modalSection}>
                <h4>{t.worker}</h4>
                <p className={styles.modalValue}>{isRtl ? contract.workerNameAr : contract.workerName}</p>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.modalSection}>
                <h4>{t.status}</h4>
                <Badge
                  status={getStatusMeta(contract.status, isRtl).color as any}
                  text={getStatusMeta(contract.status, isRtl).label}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.modalSection}>
                <h4>{t.nationality}</h4>
                <p className={styles.modalValue}>{isRtl ? contract.nationalityAr : contract.nationality}</p>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.modalSection}>
                <h4>{t.startDate}</h4>
                <p className={styles.modalValue}>{formatDate(contract.startDate, isRtl)}</p>
              </div>
            </Col>
            <Col span={12}>
              <div className={styles.modalSection}>
                <h4>{t.endDate}</h4>
                <p className={styles.modalValue}>{formatDate(contract.endDate, isRtl)}</p>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.modalSection}>
                <h4>{t.profession}</h4>
                <p className={styles.modalValue}>{isRtl ? contract.professionAr : contract.profession}</p>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.modalSection}>
                <h4>{t.phone}</h4>
                <p className={styles.modalValue} dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {contract.customerPhone}
                </p>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.modalSection}>
                <h4>{t.monthlyRent}</h4>
                <p className={styles.modalValue} style={{ color: '#003366' }}>
                  {formatCurrency(contract.monthlyRent, isRtl)}
                </p>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
}
