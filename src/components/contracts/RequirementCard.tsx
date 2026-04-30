'use client';

import { useEffect, useMemo } from 'react';
import { Tag, Tooltip, Spin, Empty } from 'antd';
import {
  InfoCircleOutlined,
  GlobalOutlined,
  ToolOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useFilterRequirements } from '@/hooks/api/useContractCreationRequirements';

interface RequirementCardProps {
  nationalityId: string | null;
  jobId: string | null;
  nationalityName?: string;
  jobName?: string;
}

/**
 * Read-only card displaying contract creation requirements
 * for a given nationality + job combination.
 * Used inside the Mediation Contract creation page.
 */
export default function RequirementCard({
  nationalityId,
  jobId,
  nationalityName,
  jobName,
}: RequirementCardProps) {
  const { language } = useAuthStore();
  const isRTL = language === 'ar';

  const filterMutation = useFilterRequirements();

  // Auto-fetch when both nationalityId AND jobId are provided
  useEffect(() => {
    if (nationalityId && jobId) {
      filterMutation.mutate({ nationalityId, jobId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationalityId, jobId]);

  const requirement = useMemo(() => {
    if (filterMutation.data && filterMutation.data.length > 0) {
      return filterMutation.data[0];
    }
    return null;
  }, [filterMutation.data]);

  const t = useMemo(() => {
    const translations: Record<string, Record<string, string>> = {
      title: { ar: 'متطلبات إنشاء العقد', en: 'Contract Creation Requirements' },
      noReq: { ar: 'لا توجد متطلبات محددة', en: 'No specific requirements found' },
      editTip: {
        ar: 'لتعديل المتطلبات، انتقل إلى إعدادات المتطلبات',
        en: 'To edit requirements, go to Requirements Settings',
      },
      selectBoth: {
        ar: 'اختر الجنسية والمهنة لعرض المتطلبات',
        en: 'Select nationality and job to view requirements',
      },
    };
    return (key: string) => translations[key]?.[language] || translations[key]?.['en'] || key;
  }, [language]);

  // Don't show card if neither nationality nor job selected
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
    <Tooltip title={t('editTip')} placement={isRTL ? 'left' : 'right'}>
      <div
        style={{
          background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 16,
          border: '1px solid #d6e4ff',
          cursor: 'default',
          transition: 'all 0.2s ease',
          position: 'relative',
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
          {nationalityName && (
            <Tag color="blue" icon={<GlobalOutlined />}>
              {nationalityName}
            </Tag>
          )}
          {jobName && (
            <Tag color="green" icon={<ToolOutlined />}>
              {jobName}
            </Tag>
          )}
        </div>

        {/* Content */}
        {filterMutation.isPending ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Spin size="small" />
          </div>
        ) : requirement ? (
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
              borderRight: isRTL ? 'none' : '3px solid #003366',
              borderLeft: isRTL ? '3px solid #003366' : 'none',
            }}
          >
            {requirement.contractRequirements}
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
    </Tooltip>
  );
}
