'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  InputNumber,
  Select,
  Button,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  BookOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { useJournalEntries, useJournalEntryMutations } from '@/hooks/api/useJournalEntries';
import { useRestrictionTypes } from '@/hooks/api/useRestrictionTypes';
import { useClosedYears } from '@/hooks/api/usePeriodClosing';
import { useCustomers } from '@/hooks/api/useCustomers';
import { useAgents } from '@/hooks/api/useAgents';
import { useWorkers } from '@/hooks/api/useWorkers';
import { useAuthStore } from '@/store/authStore';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import {
  JOURNAL_STATUSES,
  JOURNAL_SOURCES,
  JOURNAL_REFERENCE_TYPES,
  JE_STATUS,
  JE_SOURCE,
  getSourceLabel,
  type JournalEntryListItem,
  type JournalEntryStatus,
  type JournalEntrySource,
  type JournalReferenceType,
} from '@/types/journal-entry.types';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import {
  resolveJournalEntryNavigation,
  resolveContractRoute,
  buildSourceUrl,
  type JournalEntryNavInput,
} from '@/lib/journal-entry-navigation';
import { EntryFormDrawer } from './_components/EntryFormDrawer';
import { EntryDetailDrawer } from './_components/EntryDetailDrawer';
import styles from './JournalEntries.module.css';

export default function JournalEntriesPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ── Query state ─────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced, server-side
  const [status, setStatus] = useState<JournalEntryStatus | undefined>();
  const [source, setSource] = useState<JournalEntrySource | undefined>();
  const [referenceType, setReferenceType] = useState<JournalReferenceType | undefined>();
  const [contractNumber, setContractNumber] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    dayjs().subtract(1, 'month').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);
  const [updatedRange, setUpdatedRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [workerId, setWorkerId] = useState<string | undefined>();
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce the search box into the server-side `search` param (400ms).
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPageNumber(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { restrictionTypes } = useRestrictionTypes();
  // Posting/unposting is blocked by the backend inside a closed fiscal year;
  // gate those actions in the UI too (fails open if the list is unavailable).
  const { isYearClosed } = useClosedYears();
  const { customers = [] } = useCustomers();
  const { data: agents = [] } = useAgents();
  const { data: workers = [] } = useWorkers();

  const { items, totalCount, isLoading, isFetching, refetch } = useJournalEntries({
    pageNumber,
    pageSize,
    // Server-side free-text search (verified live: Search + EntryNumber work).
    search: search || undefined,
    status,
    source,
    referenceType,
    contractNumber,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
    from: range[0],
    to: range[1],
    updatedDateFrom: updatedRange[0],
    updatedDateTo: updatedRange[1],
    customerId,
    agentId,
    workerId,
    employeeId,
  });

  const { deleteEntry, postEntry, unpostEntry, isDeleting, isPosting, isUnposting } =
    useJournalEntryMutations();

  // ── Drawers ─────────────────────────────────────────────────
  const [detailId, setDetailId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(
    null
  );

  const openCreate = () => setFormState({ mode: 'create' });
  const openEdit = (id: string) => {
    setDetailId(null);
    setFormState({ mode: 'edit', id });
  };

  // ── Row → source-document navigation ────────────────────────
  // Clicking a row navigates to the entry's source (contract / voucher / …).
  // The entry-number link and the action buttons keep their own behaviour
  // (they're skipped via the interactive-target guard in `onRow`).
  const router = useRouter();
  const navInput = (record: JournalEntryListItem): JournalEntryNavInput => ({
    source: record.source,
    referenceType: record.referenceType,
    sourceId: record.sourceId,
    customerId: record.customerId,
    agentId: record.agentId,
    workerId: record.workerId,
    employeeId: record.employeeId,
  });
  /** True when this entry has a screen we can navigate to. */
  const isNavigable = (record: JournalEntryListItem): boolean => {
    const nav = resolveJournalEntryNavigation(navInput(record));
    return !!nav.route && !nav.disabled;
  };
  const goToSource = async (record: JournalEntryListItem) => {
    const nav = resolveJournalEntryNavigation(navInput(record));
    if (!nav.route || nav.disabled) return;
    try {
      let route = nav.route;
      if (nav.needsContractResolve && nav.id) {
        route = await resolveContractRoute(nav.id);
      }
      router.push(buildSourceUrl(route, nav.id, nav.pathParam));
    } catch {
      message.error(t('تعذّر فتح المصدر', 'Could not open the source'));
    }
  };

  const restrictionLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of restrictionTypes) map.set(r.id, r.nameAr || r.name || r.id);
    return map;
  }, [restrictionTypes]);

  // Search + Branch are quick filters and stay untouched by Clear, matching
  // the AdvancedFilterPanel convention used app-wide. Everything below is an
  // "advanced" field: Clear returns each to its mount-time default (the date
  // range back to the last-month window, not to empty — that's this page's
  // baseline "no explicit filter" state).
  const activeFilterCount = [
    status,
    source,
    contractNumber,
    referenceType,
    customerId,
    agentId,
    workerId,
    employeeId,
    range[0],
    updatedRange[0],
  ].filter((v) => v !== undefined && v !== null && v !== '').length;

  const clearFilters = () => {
    setStatus(undefined);
    setSource(undefined);
    setReferenceType(undefined);
    setContractNumber(undefined);
    setRange([
      dayjs().subtract(1, 'month').startOf('day').toISOString(),
      dayjs().endOf('day').toISOString(),
    ]);
    setUpdatedRange([undefined, undefined]);
    setCustomerId(undefined);
    setAgentId(undefined);
    setWorkerId(undefined);
    setEmployeeId(undefined);
    setPageNumber(1);
  };

  // ── Metrics (current page snapshot) ─────────────────────────
  const draftCount = items.filter((e) => e.status === JE_STATUS.Draft).length;
  const postedCount = items.filter((e) => e.status === JE_STATUS.Posted).length;
  const systemCount = items.filter((e) => e.source !== JE_SOURCE.Manual).length;

  // ── Columns ─────────────────────────────────────────────────
  const columns: ColumnsType<JournalEntryListItem> = [
    {
      title: '#',
      key: 'index',
      width: 52,
      render: (_, __, idx) => (pageNumber - 1) * pageSize + idx + 1,
    },
    {
      title: t('رقم القيد', 'Entry No.'),
      dataIndex: 'entryNumber',
      key: 'entryNumber',
      width: 120,
      render: (v: string, record) => {
        // Entry number goes to the source document (like the whole row). Manual
        // entries have no source, so there it opens the JE detail instead.
        // The eye icon (Actions) always opens the JE detail.
        const navigable = isNavigable(record);
        const activate = () => (navigable ? void goToSource(record) : setDetailId(record.id));
        return (
          <a
            role="button"
            tabIndex={0}
            className={styles.entryNumber}
            onClick={activate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
              }
            }}
          >
            {v || '—'}
          </a>
        );
      },
    },
    {
      title: t('التاريخ', 'Date'),
      dataIndex: 'date',
      key: 'date',
      width: 110,
      sorter: (a, b) => (a.date || '').localeCompare(b.date || ''),
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      title: t('الوصف', 'Description'),
      dataIndex: 'description',
      key: 'description',
      width: 240,
      ellipsis: { showTitle: false },
      render: (v: string) => (
        <Tooltip title={v || undefined} placement="topLeft">
          <span className={styles.description}>{v || '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: t('النوع', 'Type'),
      dataIndex: 'restrictionTypeId',
      key: 'restrictionTypeId',
      width: 140,
      render: (id: string | null) =>
        id ? (
          <Tag color="purple">{restrictionLabel.get(id) ?? '—'}</Tag>
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
    {
      title: t('مدين', 'Debit'),
      dataIndex: 'totalDebit',
      key: 'totalDebit',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.totalDebit - b.totalDebit,
      render: (v: number) => <span className={styles.amount}>{v.toLocaleString()}</span>,
    },
    {
      title: t('دائن', 'Credit'),
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      width: 120,
      align: 'right',
      render: (v: number, record) => (
        <span className={record.isBalanced ? styles.amount : styles.unbalancedAmount}>
          {v.toLocaleString()}
        </span>
      ),
    },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: JournalEntryStatus) =>
        v === JE_STATUS.Posted ? (
          <Tag icon={<CheckCircleFilled />} color="success">
            {t('معمد', 'Posted')}
          </Tag>
        ) : (
          <Tag icon={<CloseCircleFilled />} color="warning">
            {t('غير معمد', 'Draft')}
          </Tag>
        ),
    },
    {
      title: t('المصدر', 'Source'),
      dataIndex: 'source',
      key: 'source',
      width: 110,
      render: (v: JournalEntrySource) => (
        <span className={styles.muted}>{getSourceLabel(v, isAr)}</span>
      ),
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const isDraft = record.status === JE_STATUS.Draft;
        const yearClosed = isYearClosed(record.date);
        return (
          <Space size={2}>
            <Tooltip title={t('عرض', 'View')}>
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setDetailId(record.id)}
              />
            </Tooltip>
            {isDraft ? (
              <>
                <Tooltip title={t('تعديل', 'Edit')}>
                  <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record.id)}
                  />
                </Tooltip>
                <Tooltip
                  title={
                    yearClosed
                      ? t('السنة المالية مغلقة', 'Fiscal year is closed')
                      : t('اعتماد', 'Post')
                  }
                >
                  <Popconfirm
                    title={t('اعتماد القيد؟', 'Post this entry?')}
                    description={t(
                      'سيتم ترحيل الحركات إلى الأستاذ العام.',
                      'Ledger movements will be written for all lines.'
                    )}
                    okText={t('اعتماد', 'Post')}
                    cancelText={t('إلغاء', 'Cancel')}
                    okButtonProps={{ loading: isPosting, disabled: !record.isBalanced }}
                    onConfirm={() => postEntry(record.id)}
                    disabled={yearClosed}
                  >
                    <Button
                      size="small"
                      type="text"
                      style={yearClosed ? undefined : { color: '#52c41a' }}
                      icon={<CheckCircleOutlined />}
                      disabled={yearClosed}
                    />
                  </Popconfirm>
                </Tooltip>
                <Tooltip title={t('حذف', 'Delete')}>
                  <Popconfirm
                    title={t('حذف القيد؟', 'Delete this entry?')}
                    description={t(
                      'سيتم حذف القيد نهائيًا. لا يمكن التراجع.',
                      'This draft entry will be permanently deleted.'
                    )}
                    okText={t('حذف', 'Delete')}
                    cancelText={t('إلغاء', 'Cancel')}
                    okButtonProps={{ danger: true, loading: isDeleting }}
                    onConfirm={() => deleteEntry(record.id)}
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Tooltip>
              </>
            ) : (
              <Tooltip
                title={
                  yearClosed
                    ? t('السنة المالية مغلقة', 'Fiscal year is closed')
                    : t('إلغاء الاعتماد', 'Unpost')
                }
              >
                <Popconfirm
                  title={t('إلغاء اعتماد القيد؟', 'Unpost this entry?')}
                  description={t(
                    'سيتم عكس الحركات وإعادة القيد إلى مسودة.',
                    'Ledger movements will be reversed; entry returns to Draft.'
                  )}
                  okText={t('إلغاء الاعتماد', 'Unpost')}
                  cancelText={t('رجوع', 'Back')}
                  okButtonProps={{ loading: isUnposting }}
                  onConfirm={() => unpostEntry(record.id)}
                  disabled={yearClosed}
                >
                  <Button
                    size="small"
                    type="text"
                    style={yearClosed ? undefined : { color: '#fa8c16' }}
                    icon={<RollbackOutlined />}
                    disabled={yearClosed}
                  />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <BookOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('قيود اليومية', 'Journal Entries')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إنشاء واعتماد القيود المحاسبية ومراجعة حركاتها',
                  'Create, post and review manual accounting entries'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('تحديث', 'Refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className={styles.addBtn}
            >
              {t('قيد جديد', 'Add Entry')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Metric cards ─────────────────────────────────────── */}
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>{t('الإجمالي', 'Total')}</div>
          <div className={styles.metricValue}>{totalCount.toLocaleString()}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.draft}`}>
          <div className={styles.metricLabel}>{t('غير معمدة (الصفحة)', 'Draft (page)')}</div>
          <div className={styles.metricValue}>{draftCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.posted}`}>
          <div className={styles.metricLabel}>{t('معمدة (الصفحة)', 'Posted (page)')}</div>
          <div className={styles.metricValue}>{postedCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.system}`}>
          <div className={styles.metricLabel}>{t('آلية (الصفحة)', 'System (page)')}</div>
          <div className={styles.metricValue}>{systemCount}</div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('ابحث بالوصف أو رقم القيد...', 'Search by description or entry no...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: 280 }}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setPageNumber(1);
              }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('الحالة', 'Status')}</label>
            <Select
              size="large"
              allowClear
              style={{ width: '100%' }}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPageNumber(1);
              }}
              placeholder={t('الحالة', 'Status')}
              options={JOURNAL_STATUSES.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('المصدر', 'Source')}</label>
            <Select
              size="large"
              allowClear
              style={{ width: '100%' }}
              value={source}
              onChange={(v) => {
                setSource(v);
                setPageNumber(1);
              }}
              placeholder={t('المصدر', 'Source')}
              options={JOURNAL_SOURCES.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('التاريخ', 'Date')}</label>
            <DateRangeFilter
              value={range}
              onChange={(v) => {
                setRange(v);
                setPageNumber(1);
              }}
              placeholder={[t('من', 'From'), t('إلى', 'To')]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('رقم العقد', 'Contract No.')}</label>
            <InputNumber
              min={1}
              precision={0}
              controls={false}
              size="large"
              style={{ width: '100%' }}
              value={contractNumber ?? null}
              onChange={(v) => {
                setContractNumber(v ? Number(v) : undefined);
                setPageNumber(1);
              }}
              placeholder={t('رقم العقد', 'Contract No.')}
            />
          </Col>
          {/* Reference-type filter (drives source navigation). Replaces the old
              restriction-type filter, which the backend ignored (no such param). */}
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('نوع المرجع', 'Reference type')}</label>
            <Select
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={referenceType}
              onChange={(v) => {
                setReferenceType(v);
                setPageNumber(1);
              }}
              placeholder={t('نوع المرجع', 'Reference type')}
              options={JOURNAL_REFERENCE_TYPES.map((r) => ({
                value: r.value,
                label: isAr ? r.ar : r.en,
              }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('تاريخ التعديل', 'Updated date')}</label>
            <DateRangeFilter
              value={updatedRange}
              onChange={(v) => {
                setUpdatedRange(v);
                setPageNumber(1);
              }}
              placeholder={[t('تاريخ التعديل من', 'Updated from'), t('تاريخ التعديل إلى', 'Updated to')]}
              style={{ width: '100%' }}
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
              value={customerId}
              onChange={(v) => {
                setCustomerId(v);
                setPageNumber(1);
              }}
              placeholder={t('العميل', 'Customer')}
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
              value={agentId}
              onChange={(v) => {
                setAgentId(v);
                setPageNumber(1);
              }}
              placeholder={t('الوكيل', 'Agent')}
              options={(agents as any[]).map((a: any) => ({
                value: a.id,
                label: (isAr ? a.agentNameAr || a.agentNameEn : a.agentNameEn || a.agentNameAr) || String(a.id),
              }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('العاملة', 'Worker')}</label>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              style={{ width: '100%' }}
              value={workerId}
              onChange={(v) => {
                setWorkerId(v);
                setPageNumber(1);
              }}
              placeholder={t('العاملة', 'Worker')}
              options={(workers as any[]).map((w: any) => ({
                value: w.id,
                label: (isAr ? w.fullNameAr || w.fullNameEn : w.fullNameEn || w.fullNameAr) || String(w.id),
              }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <label className={styles.filterLabel}>{t('معرف الموظف', 'Employee ID')}</label>
            <Input
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value || undefined);
                setPageNumber(1);
              }}
              placeholder={t('معرف الموظف', 'Employee ID')}
            />
          </Col>
        </Row>
      </AdvancedFilterPanel>

      {/* ── Table ────────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <Table<JournalEntryListItem>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isLoading || isFetching}
          size="middle"
          bordered
          scroll={{ x: 1300 }}
          onRow={(record) => {
            const navigable = isNavigable(record);
            return {
              className: navigable ? styles.sourceRow : undefined,
              onClick: (e) => {
                // Let the entry-number link, action buttons, and any other
                // interactive control handle their own clicks.
                if ((e.target as HTMLElement).closest('a, button, .ant-btn, .ant-popover, input, .ant-select')) {
                  return;
                }
                if (navigable) void goToSource(record);
              },
            };
          }}
          pagination={{
            current: pageNumber,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [10, 15, 20, 25, 50, 100],
            showTotal: (total) => t(`الإجمالي: ${total}`, `Total: ${total}`),
            onChange: (page, size) => {
              setPageNumber(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {/* ── Drawers ──────────────────────────────────────────── */}
      <EntryDetailDrawer
        open={!!detailId}
        entryId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
      />
      {formState && (
        <EntryFormDrawer
          open
          mode={formState.mode}
          entryId={formState.id}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  );
}
