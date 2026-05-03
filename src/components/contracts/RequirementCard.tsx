'use client';

import { useMemo } from 'react';
import { Spin, Empty } from 'antd';
import {
  InfoCircleOutlined,
  GlobalOutlined,
  ToolOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useFollowUpRequirement } from '@/hooks/api/useFollowUpRequirements';

interface RequirementCardProps {
  /** ContractNationality.id — integer PK from /api/FollowUp/ContractNationality/GetAll */
  nationalityId: string | null;
  /** Job UUID (same as MediationContractOffer.jobId) */
  jobId: string | null;
  nationalityName?: string;
  jobName?: string;
}

/**
 * Read-only card displaying contract creation requirements.
 * Shown in the Mediation Contract creation flow (Step 2).
 * Fetches via GET /api/FollowUp/ContractCreationRequirement/GetByNationalityAndJob.
 */
export default function RequirementCard({
  nationalityId,
  jobId,
  nationalityName,
  jobName,
}: RequirementCardProps) {
  const { language } = useAuthStore();
  const isRTL = language === 'ar';

  // Enabled automatically when both IDs are present
  const { data: requirement, isLoading } = useFollowUpRequirement(nationalityId, jobId);

  const t = useMemo(() => {
    const translations: Record<string, Record<string, string>> = {
      title: { ar: 'متطلبات إنشاء العقد', en: 'Contract Creation Requirements' },
      noReq: { ar: 'لا توجد متطلبات محددة لهذه الجنسية والمهنة', en: 'No specific requirements for this nationality + job' },
      selectBoth: {
        ar: 'اختر الجنسية والمهنة لعرض المتطلبات',
        en: 'Select nationality and job to view requirements',
      },
    };
    return (key: string) => translations[key]?.[language] || translations[key]?.['en'] || key;
  }, [language]);

  if (!nationalityId || !jobId) {
    return (
      <div
        style={{
          background: '#f0f5ff',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 16,
          border: '1px solid #d6e4ff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1890ff' }}>
          <InfoCircleOutlined />
          <span style={{ fontSize: 13, color: '#6c757d' }}>{t('selectBoth')}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 16,
        border: '1px solid #d6e4ff',
      }}
      role="region"
      aria-label={t('title')}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileProtectOutlined style={{ color: '#003366', fontSize: 18 }} />
          <span style={{ fontWeight: 600, color: '#003366', fontSize: 15 }}>{t('title')}</span>
        </div>
        <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {(nationalityName || requirement?.nationalityNameAr || requirement?.nationalityNameEn) && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#e6f7ff',
              color: '#0958d9',
              fontSize: 12,
              border: '1px solid #91caff',
            }}
          >
            <GlobalOutlined />
            {nationalityName ??
              (isRTL
                ? requirement?.nationalityNameAr
                : requirement?.nationalityNameEn || requirement?.nationalityNameAr)}
          </span>
        )}
        {(jobName || requirement?.jobName) && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 4,
              background: '#f6ffed',
              color: '#389e0d',
              fontSize: 12,
              border: '1px solid #b7eb8f',
            }}
          >
            <ToolOutlined />
            {jobName ?? requirement?.jobName}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Spin size="small" />
        </div>
      ) : requirement?.requirementsText ? (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 6,
            padding: '12px 16px',
            maxHeight: 200,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            fontSize: 14,
            color: '#2c3e50',
            borderInlineStart: '3px solid #003366',
          }}
        >
          {requirement.requirementsText}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{t('noReq')}</span>}
          />
        </div>
      )}
    </div>
  );
}
