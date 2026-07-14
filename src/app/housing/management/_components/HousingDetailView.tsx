'use client';

/**
 * Presentational housing detail body — new for Phase 3 (housing has no
 * pre-existing detail modal to extract from; the list page only ever showed
 * a create/edit form). Read-only view of the fields the `Housing` list item
 * already carries. Takes already-fetched data — no fetching here.
 */
import React from 'react';
import { Descriptions, Progress, Tag } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import type { Housing } from '@/types/housing.types';

export interface HousingDetailViewProps {
  housing: Housing;
  isAr: boolean;
}

export default function HousingDetailView({ housing, isAr }: HousingDetailViewProps) {
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const pct = housing.capacity > 0 ? Math.round((housing.currentOccupancy / housing.capacity) * 100) : 0;
  const color = pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : '#52c41a';

  return (
    <div>
      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('اسم السكن', 'Housing Name')}>{housing.name || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('الحالة', 'Status')}>
          {housing.isActive ? <Tag color="success">{t('مفعّل', 'Active')}</Tag> : <Tag color="default">{t('معطّل', 'Inactive')}</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label={t('العنوان', 'Address')} span={2}>
          {housing.address || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('الطاقة الاستيعابية', 'Capacity')}>{housing.capacity}</Descriptions.Item>
        <Descriptions.Item label={t('الإشغال الحالي', 'Current Occupancy')}>
          {housing.currentOccupancy} / {housing.capacity} ({housing.availableSlots} {t('متاح', 'available')})
        </Descriptions.Item>
        <Descriptions.Item label={t('تكلفة إيواء العامل', 'Worker Housing Cost')}>
          {housing.workerHousingCost != null ? housing.workerHousingCost.toLocaleString() : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('سعر تشغيل السكن', 'Operation Price')}>
          {housing.housingOperationPrice != null ? housing.housingOperationPrice.toLocaleString() : '-'}
        </Descriptions.Item>
        {housing.notes && (
          <Descriptions.Item label={t('ملاحظات', 'Notes')} span={2}>
            {housing.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <TeamOutlined />
          <span style={{ fontWeight: 600 }}>{t('نسبة الإشغال', 'Occupancy Rate')}</span>
        </div>
        <Progress percent={pct} strokeColor={color} />
      </div>
    </div>
  );
}
