'use client';

/**
 * Presentational agent detail body — extracted from the former "View Agent
 * Details Modal" in page.tsx so it has exactly one implementation, shared by
 * the `[id]` route page (Phase 3, mirroring Phase 1/2's contracts/vouchers).
 * Takes already-fetched data — no fetching here.
 */
import React from 'react';
import { Avatar, Badge, Descriptions, Divider, Space, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { Agent } from '@/types/api.types';
import { AGENT_CONTRACT_TYPE, getEnumLabel } from '@/constants/enums';

export interface AgentDetailViewProps {
  agent: Agent;
  language: 'ar' | 'en';
}

export default function AgentDetailView({ agent, language }: AgentDetailViewProps) {
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const nationalityLabel =
    (isAr ? agent.nationalityNameAr : agent.nationalityNameEn) ||
    agent.nationalityNameAr ||
    agent.nationalityNameEn ||
    (agent.nationalityId != null ? String(agent.nationalityId) : '-');

  const contractTypeLabel =
    agent.contractType != null ? getEnumLabel([...AGENT_CONTRACT_TYPE], agent.contractType, language) : '-';

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Avatar size={120} icon={<UserOutlined />} style={{ backgroundColor: '#003366' }} />
        <h2 style={{ margin: '12px 0 4px', color: '#003366' }}>
          {isAr ? agent.agentNameAr : agent.agentNameEn || agent.agentNameAr}
        </h2>
        <Space>
          <Tag color={agent.contractType === 0 ? 'blue' : 'green'}>{contractTypeLabel}</Tag>
          <Badge
            status={agent.isActive ? 'success' : 'default'}
            text={agent.isActive ? t('نشط', 'Active') : t('غير نشط', 'Inactive')}
          />
        </Space>
      </div>

      <Divider />

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label={t('اسم المستخدم', 'Username')}>{agent.username || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('رقم الترخيص', 'License Number')}>
          {agent.agentLicense || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('الجنسية', 'Nationality')}>{nationalityLabel}</Descriptions.Item>
        <Descriptions.Item label={t('نوع العقد', 'Contract Type')}>{contractTypeLabel}</Descriptions.Item>
        <Descriptions.Item label={t('البريد الإلكتروني', 'Email')}>{agent.email || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('الهاتف', 'Phone')}>{agent.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('الجوال', 'Mobile')}>{agent.mobile || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('العنوان (عربي)', 'Address (Arabic)')}>
          {agent.addressAr || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('العنوان (إنجليزي)', 'Address (English)')}>
          {agent.addressEn || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('اسم الشركة (عربي)', 'Company Name (Arabic)')}>
          {agent.companyNameAr || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('اسم الشركة (إنجليزي)', 'Company Name (English)')}>
          {agent.companyNameEn || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('بريد المتابعة', 'Follow-up Emails')}>
          {agent.followUpEmails || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('بريد الضمان', 'Warranty Emails')}>
          {agent.warrantyEmails || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('بريد المحاسبة', 'Accounting Emails')}>
          {agent.accountingEmails || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('إرسال جميع الإيميلات', 'Send All Emails')}>
          {agent.sendAllEmails ? t('نشط', 'Active') : t('غير نشط', 'Inactive')}
        </Descriptions.Item>
        <Descriptions.Item label={t('عقود', 'Contracts')}>{agent.contractsCount || 0}</Descriptions.Item>
        <Descriptions.Item label={t('ملفات', 'Files')}>{agent.filesCount || 0}</Descriptions.Item>
      </Descriptions>
    </div>
  );
}
