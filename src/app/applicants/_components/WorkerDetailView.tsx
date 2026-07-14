'use client';

/**
 * Presentational worker detail body — extracted from the former "View Worker
 * Details Modal" in page.tsx so it has exactly one implementation, shared by
 * the `[id]` route page (Phase 3, mirroring Phase 1/2's contracts/vouchers).
 * Takes already-fetched data — no fetching here.
 */
import React from 'react';
import { Avatar, Descriptions, Divider, Image, Space, Tag } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { resolveImageUrl } from '@/utils/image';
import type { Worker } from '@/types/api.types';
import { GENDER, MARITAL_STATUS, RELIGION, WORKER_CONTRACT_TYPE, getEnumLabel } from '@/constants/enums';

export interface WorkerDetailViewProps {
  worker: Worker;
  language: 'ar' | 'en';
}

const STATUS_CONFIG: Record<number, { color: string; icon: React.ReactNode; labelAr: string; labelEn: string }> = {
  1: { color: 'success', icon: <CheckCircleOutlined />, labelAr: 'عمالة للاختيار', labelEn: 'Available' },
  2: { color: 'processing', icon: <ClockCircleOutlined />, labelAr: 'عمالة في التجربة', labelEn: 'Trial Worker' },
  3: { color: 'warning', icon: <FileTextOutlined />, labelAr: 'تحت الاجراء', labelEn: 'Under Procedure' },
  4: { color: 'error', icon: <ExclamationCircleOutlined />, labelAr: 'Back out', labelEn: 'Backout' },
  5: { color: 'cyan', icon: <EnvironmentOutlined />, labelAr: 'داخل المملكة', labelEn: 'Inside Kingdom' },
  6: { color: 'default', icon: <StopOutlined />, labelAr: 'تم الترحيل', labelEn: 'Deported' },
};

export default function WorkerDetailView({ worker, language }: WorkerDetailViewProps) {
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const statusConfig = worker.workerStatus != null ? STATUS_CONFIG[worker.workerStatus] : undefined;
  const getGenderLabel = (g?: number | null) => getEnumLabel(GENDER, g, language);
  const getMaritalLabel = (m?: number | null) => getEnumLabel(MARITAL_STATUS, m, language);

  const allDocs = [
    ...(worker.uploadImage ? [worker.uploadImage as string] : []),
    ...(worker.attachments ?? []),
  ];

  return (
    <div>
      {/* Worker Image */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {worker.uploadImage ? (
          <Image
            src={resolveImageUrl(worker.uploadImage)}
            alt={worker.fullNameAr || 'Worker'}
            width={150}
            height={150}
            style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid #003366' }}
            preview={{ mask: <EyeOutlined style={{ fontSize: 20 }} /> }}
          />
        ) : (
          <Avatar
            size={150}
            icon={<UserOutlined />}
            style={{ backgroundColor: worker.gender === GENDER[1].value ? '#f472b6' : '#003366' }}
          />
        )}
        <h2 style={{ margin: '12px 0 4px', color: '#003366' }}>
          {isAr ? worker.fullNameAr : worker.fullNameEn || worker.fullNameAr}
        </h2>
        <p style={{ color: '#6b7280', margin: 0 }}>{isAr ? worker.fullNameEn : worker.fullNameAr}</p>
        {statusConfig && (
          <div style={{ marginTop: 8 }}>
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {isAr ? statusConfig.labelAr : statusConfig.labelEn}
            </Tag>
          </div>
        )}
      </div>

      <Divider />

      {/* Personal Details */}
      <Descriptions title={t('البيانات الشخصية', 'Personal Details')} bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('رقم المرجع', 'Ref')}>{worker.referenceNo || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('جنس العامل/ه', 'Gender')}>{getGenderLabel(worker.gender)}</Descriptions.Item>
        <Descriptions.Item label={t('العمر', 'Age')}>
          {worker.age ? `${worker.age} ${t('سنة', 'years')}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('تاريخ الميلاد', 'Birth Date')}>
          {worker.birthDate ? dayjs(worker.birthDate).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('الحالة الاجتماعية', 'Marital Status')}>
          {getMaritalLabel(worker.maritalStatus)}
        </Descriptions.Item>
        <Descriptions.Item label={t('الأطفال', 'Children')}>{worker.childrenCount ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={t('الديانة', 'Religion')}>
          {worker.religion ? getEnumLabel(RELIGION, worker.religion, language) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('الجنسية', 'Nationality')}>{worker.nationalityName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('رقم الهوية', 'National ID')}>{worker.nationalId || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('التعليم (عربي)', 'Education (Arabic)')}>
          {worker.educationLevelAr || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('التعليم (إنجليزي)', 'Education (English)')}>
          {worker.educationLevelEn || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('الوزن (كجم)', 'Weight (kg)')}>{worker.weight || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('الطول (سم)', 'Height (cm)')}>{worker.height || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('سبق له العمل', 'Experience')}>
          {worker.hasExperience ? t('سبق له العمل', 'Has Experience') : t('لم يسبق له العمل', 'No Experience')}
        </Descriptions.Item>
      </Descriptions>

      {/* Passport Details */}
      <Descriptions title={t('بيانات الجواز', 'Passport Details')} bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('رقم الجواز', 'Passport No.')}>{worker.passportNo || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('تاريخ الإصدار', 'Issue Date')}>
          {worker.passportIssueDate ? dayjs(worker.passportIssueDate).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('تاريخ الانتهاء', 'Expiry Date')}>
          {worker.passportExpiryDate ? dayjs(worker.passportExpiryDate).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('مكان الإصدار (عربي)', 'Issue Place (Arabic)')}>
          {worker.passportIssuePlaceAr || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('مكان الإصدار (إنجليزي)', 'Issue Place (English)')}>
          {worker.passportIssuePlaceEn || '-'}
        </Descriptions.Item>
      </Descriptions>

      {/* Work Details */}
      <Descriptions title={t('بيانات العمل', 'Work Details')} bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('الوظيفة', 'Job Name')}>{worker.jobName || worker.jobname || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('الراتب الأساسي', 'Basic Salary')}>{worker.basicSalary || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('اسم الوكيل', 'Agent Name')}>{worker.agentName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('تم الانشاء بواسطة', 'Created By')}>{worker.userName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('نوع العامل', 'Worker Type')}>
          {worker.workerType ? getEnumLabel(WORKER_CONTRACT_TYPE, worker.workerType, language) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('رقم الصندوق', 'Box Number')}>{worker.boxNumber || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('رقم الحدود', 'Border Number')}>{worker.borderNumber || '-'}</Descriptions.Item>
      </Descriptions>

      {/* Contact Details */}
      <Descriptions title={t('بيانات التواصل', 'Contact Details')} bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('الجوال', 'Mobile')}>{worker.mobile || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('تليفون ارضي', 'Phone')}>{worker.phone || '-'}</Descriptions.Item>
      </Descriptions>

      {/* Address Details */}
      <Descriptions title={t('بيانات العنوان', 'Address Details')} bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('العنوان (عربي)', 'Address (Arabic)')}>{worker.addressAr || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('العنوان (إنجليزي)', 'Address (English)')}>{worker.addressEn || '-'}</Descriptions.Item>
      </Descriptions>

      {/* Skills */}
      {worker.skills && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ color: '#003366', marginBottom: 8 }}>{t('المهارات', 'Skills')}</h4>
          <Space wrap>
            {String(worker.skills)
              .split(',')
              .filter(Boolean)
              .map((skill, i) => (
                <Tag key={i} color="blue">
                  {skill.trim()}
                </Tag>
              ))}
          </Space>
        </div>
      )}

      {/* Worker Video */}
      {worker.uploadVideo && (
        <>
          <Divider />
          <div style={{ marginTop: 8 }}>
            <h4 style={{ color: '#003366', marginBottom: 12 }}>
              <PlayCircleOutlined style={{ marginInlineEnd: 6 }} />
              {t('فيديو العامل', 'Worker Video')}
            </h4>
            <video
              src={worker.uploadVideo}
              controls
              style={{ width: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #e2e8f0', background: '#000' }}
            />
          </div>
        </>
      )}

      {/* Documents / Attachments */}
      <Divider />
      <div style={{ marginTop: 8 }}>
        <h4 style={{ color: '#003366', marginBottom: 12 }}>{t('المستندات', 'Documents')}</h4>
        {allDocs.length > 0 ? (
          <Image.PreviewGroup>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {allDocs.map((src, idx) => {
                const isPdf = src.startsWith('data:application/pdf') || src.endsWith('.pdf');
                return isPdf ? (
                  <div
                    key={idx}
                    style={{
                      width: 120, height: 120, borderRadius: 8, border: '1px solid #e2e8f0',
                      background: '#fff0f0', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                    onClick={() => window.open(src, '_blank')}
                  >
                    <FilePdfOutlined style={{ fontSize: 36, color: '#e53e3e' }} />
                    <span style={{ fontSize: 11, color: '#718096', marginTop: 6 }}>PDF</span>
                  </div>
                ) : (
                  <Image
                    key={idx}
                    src={src}
                    alt={`${t('المستندات', 'Documents')} ${idx + 1}`}
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    preview={{ mask: <EyeOutlined /> }}
                  />
                );
              })}
            </div>
          </Image.PreviewGroup>
        ) : (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>{t('لا توجد مستندات محملة', 'No documents uploaded')}</p>
        )}
      </div>
    </div>
  );
}
