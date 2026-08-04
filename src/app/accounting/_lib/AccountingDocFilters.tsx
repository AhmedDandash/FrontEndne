'use client';

import { Col, Input, Row, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAgents } from '@/hooks/api/useAgents';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { DOCUMENT_TYPE_OPTIONS } from './accountingDocDisplay';
import ContractFilterSelect from './ContractFilterSelect';
import type { AccountingDocFiltersHook } from './useAccountingDocFilters';
import styles from '../accounting-doc.module.css';

export interface AccountingDocFiltersProps {
  filters: AccountingDocFiltersHook;
  /** Arabic-only — English is always "Document Number" on all four pages. */
  documentNumberAr: string;
  contractSource: 'employment' | 'any';
}

export default function AccountingDocFilters({
  filters,
  documentNumberAr,
  contractSource,
}: AccountingDocFiltersProps) {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { customers = [] } = useCustomers();
  const { data: agents = [] } = useAgents();

  return (
    <AdvancedFilterPanel
      activeCount={filters.activeCount}
      onClear={filters.clear}
      contentLayout="block"
      quickFilters={
        <>
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder={t('بحث حر...', 'Free-text search...')}
            value={filters.searchInput}
            onChange={(e) => filters.setSearchInput(e.target.value)}
            style={{ width: 240 }}
          />
          <BranchFilterSelect
            value={filters.branchId}
            onChange={filters.setBranchId}
            includeSubBranches={filters.includeSubBranches}
            onIncludeSubBranchesChange={filters.setIncludeSubBranches}
          />
        </>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <label className={styles.filterLabel}>{t(documentNumberAr, 'Document Number')}</label>
          <Input
            allowClear
            size="large"
            placeholder={t(documentNumberAr, 'Document Number')}
            value={filters.documentNumber}
            onChange={(e) => filters.setDocumentNumber(e.target.value || undefined)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={6}>
          <label className={styles.filterLabel}>{t('نوع المستند', 'Document Type')}</label>
          <Select
            allowClear
            size="large"
            style={{ width: '100%' }}
            placeholder={t('نوع المستند', 'Document Type')}
            value={filters.documentType}
            onChange={filters.setDocumentType}
            options={DOCUMENT_TYPE_OPTIONS(isAr)}
          />
        </Col>
        <Col xs={24} md={6}>
          <label className={styles.filterLabel}>{t('العميل', 'Customer')}</label>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            size="large"
            style={{ width: '100%' }}
            placeholder={t('فلتر بالعميل', 'Filter by customer')}
            value={filters.customerId}
            onChange={filters.setCustomerId}
            options={(customers as any[]).map((c: any) => ({
              value: c.id,
              label: (isAr ? c.arabicName || c.englishName : c.englishName || c.arabicName) || String(c.id),
            }))}
          />
        </Col>
        <Col xs={24} md={6}>
          <label className={styles.filterLabel}>{t('الوكيل', 'Agent')}</label>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            size="large"
            style={{ width: '100%' }}
            placeholder={t('فلتر بالوكيل', 'Filter by agent')}
            value={filters.agentId}
            onChange={filters.setAgentId}
            options={(agents as any[]).map((a: any) => ({
              value: a.id,
              label: (isAr ? a.agentNameAr || a.agentNameEn : a.agentNameEn || a.agentNameAr) || String(a.id),
            }))}
          />
        </Col>
        <Col xs={24} md={6}>
          <label className={styles.filterLabel}>{t('العقد', 'Contract')}</label>
          <ContractFilterSelect
            source={contractSource}
            value={filters.contractId}
            onChange={filters.setContractId}
          />
        </Col>
        <Col xs={24} md={6}>
          <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
          <DateRangeFilter value={filters.range} onChange={filters.setRange} style={{ width: '100%' }} />
        </Col>
      </Row>
    </AdvancedFilterPanel>
  );
}
