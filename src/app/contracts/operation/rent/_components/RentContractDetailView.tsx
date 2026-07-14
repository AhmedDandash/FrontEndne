/**
 * Presentational operating (rent) contract detail body.
 *
 * Extracted from the former `ContractDetailsModal`'s inner markup so it has
 * exactly one implementation, shared by the `[id]` route page (Phase 1).
 * Takes an already-mapped `RentContract` view model — no fetching here.
 */
'use client';

import React from 'react';
import { Row, Col, Badge, Image } from 'antd';
import type { RentContract } from './types';
import { getStatusMeta } from './mapping';
import { formatDate, formatCurrency } from './format';
import { resolveImageUrl } from '@/utils/image';
import styles from '../RentContracts.module.css';

export interface RentContractDetailViewProps {
  contract: RentContract;
  isRtl: boolean;
}

export default function RentContractDetailView({ contract, isRtl }: RentContractDetailViewProps) {
  const t = {
    customer: isRtl ? 'العميل' : 'Customer',
    worker: isRtl ? 'العامل' : 'Worker',
    status: isRtl ? 'الحالة' : 'Status',
    nationality: isRtl ? 'الجنسية' : 'Nationality',
    startDate: isRtl ? 'تاريخ البداية' : 'Start Date',
    endDate: isRtl ? 'تاريخ النهاية' : 'End Date',
    monthlyRent: isRtl ? 'التكلفة' : 'Cost',
    profession: isRtl ? 'المهنة' : 'Profession',
    phone: isRtl ? 'الهاتف' : 'Phone',
    branch: isRtl ? 'الفرع' : 'Branch',
    duration: isRtl ? 'المدة' : 'Duration',
  };

  const durationLabel =
    (isRtl ? contract.durationNameAr : contract.durationNameEn) ||
    (contract.duration != null ? String(contract.duration) : '-');

  return (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {contract.workerPhotoUrl && (
                <Image
                  src={resolveImageUrl(contract.workerPhotoUrl)}
                  alt={contract.workerName}
                  width={56}
                  height={56}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <p className={styles.modalValue} style={{ margin: 0 }}>
                {isRtl ? contract.workerNameAr : contract.workerName}
              </p>
            </div>
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
            <h4>{t.branch}</h4>
            <p className={styles.modalValue}>{isRtl ? contract.branchAr : contract.branch}</p>
          </div>
        </Col>
        <Col span={12}>
          <div className={styles.modalSection}>
            <h4>{t.duration}</h4>
            <p className={styles.modalValue}>{durationLabel}</p>
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
  );
}
