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
  DatePicker,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
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
import { useAuthStore } from '@/store/authStore';
import { BranchFilterSelect } from '@/components/filters';
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

const { RangePicker } = DatePicker;

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
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().subtract(1, 'month'), dayjs()]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    from: range?.[0]?.startOf('day').toISOString(),
    to: range?.[1]?.endOf('day').toISOString(),
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

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus(undefined);
    setSource(undefined);
    setReferenceType(undefined);
    setContractNumber(undefined);
    setBranchId(undefined);
    setRange([dayjs().subtract(1, 'month'), dayjs()]);
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

      {/* ── Filters + table ──────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <div className={styles.filters}>
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder={t('ابحث بالوصف أو رقم القيد...', 'Search by description or entry no...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.search}
          />
          <Select
            size="large"
            allowClear
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPageNumber(1);
            }}
            placeholder={t('الحالة', 'Status')}
            className={styles.filterSelect}
            options={JOURNAL_STATUSES.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))}
          />
          <Select
            size="large"
            allowClear
            value={source}
            onChange={(v) => {
              setSource(v);
              setPageNumber(1);
            }}
            placeholder={t('المصدر', 'Source')}
            className={styles.filterSelect}
            options={JOURNAL_SOURCES.map((s) => ({ value: s.value, label: isAr ? s.ar : s.en }))}
          />
          <Button size="large" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? t('إخفاء الفلاتر', 'Hide filters') : t('فلاتر متقدمة', 'More filters')}
          </Button>
          <Button size="large" type="text" onClick={resetFilters}>
            {t('مسح', 'Clear')}
          </Button>
        </div>

        {showAdvanced && (
          <div className={styles.advancedRow}>
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setPageNumber(1);
              }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
            <RangePicker
              value={range as any}
              onChange={(v) => {
                setRange(v as any);
                setPageNumber(1);
              }}
              placeholder={[t('من', 'From'), t('إلى', 'To')]}
            />
            <InputNumber
              min={1}
              precision={0}
              controls={false}
              style={{ minWidth: 160 }}
              value={contractNumber ?? null}
              onChange={(v) => {
                setContractNumber(v ? Number(v) : undefined);
                setPageNumber(1);
              }}
              placeholder={t('رقم العقد', 'Contract No.')}
            />
            {/* Reference-type filter (drives source navigation). Replaces the old
                restriction-type filter, which the backend ignored (no such param). */}
            <Select
              allowClear
              style={{ minWidth: 200 }}
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
          </div>
        )}

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
