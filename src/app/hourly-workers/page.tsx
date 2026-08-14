'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Drawer,
  Form,
  InputNumber,
  TimePicker,
  Row,
  Col,
  Empty,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import {
  TeamOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  useHourlyWorkers,
  useHourlyWorker,
  useHourlyWorkerMutations,
} from '@/hooks/api/useHourlyWorkers';
import { AdvancedFilterPanel, BranchFilterSelect, DateRangeFilter } from '@/components/filters';
import { useAuthStore } from '@/store/authStore';
import { useOpenIdParam } from '@/hooks/useOpenIdParam';
import { actionLinkProps } from '@/lib/navigation/linkProps';
import type {
  HourlyWorker,
  CreateHourlyWorkerDto,
} from '@/types/hourly-worker.types';
import styles from './hourly-workers.module.css';

const TIME_FMT = 'HH:mm:ss';
const PAGE_SIZE = 10;

function fmtTime(v?: string | null): string {
  if (!v) return '—';
  // "HH:mm:ss" → "HH:mm"
  return v.length >= 5 ? v.slice(0, 5) : v;
}

export default function HourlyWorkersPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ── Query state ─────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [isAvailableNow, setIsAvailableNow] = useState<boolean | undefined>();
  // Numeric amount bounds on hourlyRate (NOT dates, despite the From/To naming).
  const [hourlyRateFrom, setHourlyRateFrom] = useState<number | undefined>();
  const [hourlyRateTo, setHourlyRateTo] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'fullName' | 'hourlyRate' | 'createdDate'>('createdDate');
  const [sortDescending, setSortDescending] = useState(true);
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [createdRange, setCreatedRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [updatedRange, setUpdatedRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [pageNumber, setPageNumber] = useState(1);

  const { data, isLoading, isFetching, refetch } = useHourlyWorkers({
    search: search || undefined,
    isActive,
    isAvailableNow,
    hourlyRateFrom,
    hourlyRateTo,
    sortBy,
    sortDescending,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
    createdDateFrom: createdRange[0],
    createdDateTo: createdRange[1],
    updatedDateFrom: updatedRange[0],
    updatedDateTo: updatedRange[1],
    pageNumber,
    pageSize: PAGE_SIZE,
  });

  const workers = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;

  const { create, update, remove, activate, deactivate } = useHourlyWorkerMutations();

  // ── Drawers ─────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HourlyWorker | null>(null);
  const [detail, setDetail] = useState<HourlyWorker | null>(null);
  const [deepLinkDetailId, setDeepLinkDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const {
    data: deepLinkedWorker,
    isLoading: isDeepLinkLoading,
  } = useHourlyWorker(deepLinkDetailId ?? undefined);

  useOpenIdParam(setDeepLinkDetailId);

  useEffect(() => {
    if (deepLinkDetailId && deepLinkedWorker) setDetail(deepLinkedWorker);
  }, [deepLinkDetailId, deepLinkedWorker]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEdit = (w: HourlyWorker) => {
    setEditing(w);
    form.setFieldsValue({
      fullName: w.fullName,
      phoneNumber: w.phoneNumber,
      nationalId: w.nationalId,
      hourlyRate: w.hourlyRate,
      availableFromTime: w.availableFromTime ? dayjs(w.availableFromTime, TIME_FMT) : null,
      availableToTime: w.availableToTime ? dayjs(w.availableToTime, TIME_FMT) : null,
      notes: w.notes,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dto: CreateHourlyWorkerDto = {
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        nationalId: values.nationalId?.trim() || undefined,
        hourlyRate: values.hourlyRate,
        availableFromTime: (values.availableFromTime as Dayjs).format(TIME_FMT),
        availableToTime: (values.availableToTime as Dayjs).format(TIME_FMT),
        notes: values.notes?.trim() || undefined,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: dto });
      } else {
        await create.mutateAsync(dto);
      }
      closeForm();
    } catch {
      // Mutation hooks surface API errors. Keep the drawer open for correction.
    }
  };

  // ── Metrics (current page) ──────────────────────────────────
  const activeCount = useMemo(() => workers.filter((w) => w.isActive).length, [workers]);
  const availableCount = useMemo(() => workers.filter((w) => w.isAvailableNow).length, [workers]);

  const columns: ColumnsType<HourlyWorker> = [
    { title: '#', key: 'index', width: 52, render: (_, __, idx) => (pageNumber - 1) * PAGE_SIZE + idx + 1 },
    {
      title: t('الاسم', 'Name'),
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      sortOrder: sortBy === 'fullName' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v: string, record) => (
        <a
          {...actionLinkProps(
            `/hourly-workers?openId=${encodeURIComponent(record.id)}`,
            () => setDetail(record)
          )}
          className={styles.docNumber}
          style={{ fontFamily: 'inherit' }}
        >
          {v}
        </a>
      ),
    },
    {
      title: t('الهاتف', 'Phone'),
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 150,
      render: (v: string) => <span className={styles.assignmentPhone}>{v}</span>,
    },
    {
      title: t('الهوية', 'National ID'),
      dataIndex: 'nationalId',
      key: 'nationalId',
      width: 140,
      render: (v: string) => v || <span className={styles.muted}>—</span>,
    },
    {
      title: t('الأجر/ساعة', 'Rate/hr'),
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 110,
      align: 'right',
      sorter: true,
      sortOrder: sortBy === 'hourlyRate' ? (sortDescending ? 'descend' : 'ascend') : null,
      render: (v: number) => <span className={styles.amount}>{v?.toLocaleString()}</span>,
    },
    {
      title: t('التوفر', 'Availability'),
      key: 'window',
      width: 150,
      render: (_, r) => (
        <span className={styles.amount}>
          {fmtTime(r.availableFromTime)} – {fmtTime(r.availableToTime)}
        </span>
      ),
    },
    {
      title: t('الحالة', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <Tag color="green">{t('نشط', 'Active')}</Tag>
        ) : (
          <Tag color="default">{t('غير نشط', 'Inactive')}</Tag>
        ),
    },
    {
      title: t('متاح الآن', 'Available Now'),
      dataIndex: 'isAvailableNow',
      key: 'isAvailableNow',
      width: 110,
      render: (v: boolean) =>
        v ? <Tag color="cyan">{t('متاح', 'Yes')}</Tag> : <Tag color="default">{t('لا', 'No')}</Tag>,
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title={t('عرض', 'View')}>
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetail(record)} />
          </Tooltip>
          <Tooltip title={t('تعديل', 'Edit')}>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          {record.isActive ? (
            <Tooltip title={t('إلغاء التفعيل', 'Deactivate')}>
              <Button
                size="small"
                type="text"
                icon={<StopOutlined />}
                loading={deactivate.isPending}
                onClick={() => deactivate.mutate(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title={t('تفعيل', 'Activate')}>
              <Button
                size="small"
                type="text"
                icon={<CheckCircleOutlined />}
                loading={activate.isPending}
                onClick={() => activate.mutate(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title={t('حذف العامل؟', 'Delete worker?')}
            description={t(
              'لا يمكن الحذف إذا كان لدى العامل طلبات نشطة',
              'Cannot delete if the worker has active requests'
            )}
            okText={t('حذف', 'Delete')}
            cancelText={t('إلغاء', 'Cancel')}
            okButtonProps={{ danger: true, loading: remove.isPending }}
            onConfirm={() => remove.mutate(record.id)}
          >
            <Tooltip title={t('حذف', 'Delete')}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <TeamOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('العمالة بالساعة', 'Hourly Workers')}</h1>
              <p className={styles.pageSubtitle}>
                {t('إدارة قائمة العمال المتاحين للعمل بالساعة', 'Manage the pool of workers available for hourly jobs')}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} className={styles.refreshBtn}>
              {t('تحديث', 'Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className={styles.addBtn}>
              {t('إضافة عامل', 'New Worker')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Metrics ────────────────────────────────────────────── */}
      <div className={styles.metrics}>
        <div className={`${styles.metricCard} ${styles.total}`}>
          <div className={styles.metricLabel}>{t('إجمالي العمال', 'Total Workers')}</div>
          <div className={styles.metricValue}>{totalCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.active}`}>
          <div className={styles.metricLabel}>{t('نشط (بالصفحة)', 'Active (page)')}</div>
          <div className={styles.metricValue}>{activeCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.available}`}>
          <div className={styles.metricLabel}>{t('متاح الآن (بالصفحة)', 'Available Now (page)')}</div>
          <div className={styles.metricValue}>{availableCount}</div>
        </div>
        <div className={`${styles.metricCard} ${styles.pending}`}>
          <div className={styles.metricLabel}>{t('في الصفحة', 'On Page')}</div>
          <div className={styles.metricValue}>{workers.length}</div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <AdvancedFilterPanel
        activeCount={[
          isActive !== undefined,
          isAvailableNow !== undefined,
          search.trim(),
          branchId,
          Boolean(updatedRange[0]),
          Boolean(createdRange[0]),
          hourlyRateFrom !== undefined,
          hourlyRateTo !== undefined,
        ].filter(Boolean).length}
        onClear={() => {
          setIsActive(undefined);
          setIsAvailableNow(undefined);
          setSearch('');
          setBranchId(undefined);
          setIncludeSubBranches(true);
          setUpdatedRange([undefined, undefined]);
          setCreatedRange([undefined, undefined]);
          setHourlyRateFrom(undefined);
          setHourlyRateTo(undefined);
          setPageNumber(1);
        }}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('بحث بالاسم أو الهاتف أو الهوية', 'Search name, phone, or national ID')}
              className={styles.filterInput}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => { setBranchId(v); setPageNumber(1); }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={(v) => {
                setIncludeSubBranches(v);
                setPageNumber(1);
              }}
            />
            <div>
              <label className={styles.filterLabel}>{t('تاريخ الإنشاء', 'Created date')}</label>
              <DateRangeFilter
                value={createdRange}
                onChange={(range) => { setCreatedRange(range); setPageNumber(1); }}
                placeholder={[t('إنشاء من', 'Created from'), t('إنشاء إلى', 'Created to')]}
              />
            </div>
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('الحالة', 'Status')}</label>
            <Select
              allowClear
              size="large"
              style={{ width: '100%' }}
              placeholder={t('الحالة', 'Status')}
              value={isActive}
              onChange={(v) => {
                setIsActive(v);
                setPageNumber(1);
              }}
              options={[
                { value: true, label: t('نشط', 'Active') },
                { value: false, label: t('غير نشط', 'Inactive') },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('متاح الآن', 'Available Now')}</label>
            <Select
              allowClear
              size="large"
              style={{ width: '100%' }}
              placeholder={t('متاح الآن', 'Available Now')}
              value={isAvailableNow}
              onChange={(v) => {
                setIsAvailableNow(v);
                setPageNumber(1);
              }}
              options={[
                { value: true, label: t('متاح الآن', 'Available Now') },
                { value: false, label: t('غير متاح', 'Unavailable') },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('تاريخ آخر تحديث', 'Updated date')}</label>
            <DateRangeFilter
              value={updatedRange}
              onChange={(range) => { setUpdatedRange(range); setPageNumber(1); }}
              placeholder={[t('تحديث من', 'Updated from'), t('تحديث إلى', 'Updated to')]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('أقل أجر بالساعة', 'Min Hourly Rate')}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أقل أجر بالساعة', 'Min Hourly Rate')}
              value={hourlyRateFrom}
              onChange={(v) => {
                setHourlyRateFrom(v ?? undefined);
                setPageNumber(1);
              }}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('أعلى أجر بالساعة', 'Max Hourly Rate')}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أعلى أجر بالساعة', 'Max Hourly Rate')}
              value={hourlyRateTo}
              onChange={(v) => {
                setHourlyRateTo(v ?? undefined);
                setPageNumber(1);
              }}
            />
          </Col>
        </Row>
      </AdvancedFilterPanel>

      {/* ── Table Card ─────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <Table<HourlyWorker>
          rowKey="id"
          columns={columns}
          dataSource={workers}
          loading={isLoading}
          size="middle"
          bordered
          scroll={{ x: 1000 }}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.order) {
              setSortBy(s.columnKey as 'fullName' | 'hourlyRate' | 'createdDate');
              setSortDescending(s.order === 'descend');
            } else {
              setSortBy('createdDate');
              setSortDescending(true);
            }
            setPageNumber(1);
          }}
          pagination={{
            current: pageNumber,
            pageSize: PAGE_SIZE,
            total: totalCount,
            onChange: setPageNumber,
            showTotal: (n) => t(`الإجمالي: ${n}`, `Total: ${n}`),
          }}
        />
      </Card>

      {/* ── Detail Drawer ──────────────────────────────────────── */}
      <Drawer
        title={t('تفاصيل العامل', 'Worker Details')}
        open={!!detail || !!deepLinkDetailId}
        onClose={() => {
          setDetail(null);
          setDeepLinkDetailId(null);
        }}
        width={480}
      >
        {!detail && isDeepLinkLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : detail ? (
          <>
            <div className={styles.facts}>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('الاسم', 'Name')}</div>
                <div className={styles.factValue}>{detail.fullName}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('الهاتف', 'Phone')}</div>
                <div className={styles.factValue}>{detail.phoneNumber}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('الهوية', 'National ID')}</div>
                <div className={styles.factValue}>{detail.nationalId || '—'}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('الأجر/ساعة', 'Rate/hr')}</div>
                <div className={styles.factValue}>{detail.hourlyRate?.toLocaleString()}</div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('التوفر', 'Availability')}</div>
                <div className={styles.factValue}>
                  {fmtTime(detail.availableFromTime)} – {fmtTime(detail.availableToTime)}
                </div>
              </div>
              <div className={styles.factItem}>
                <div className={styles.factLabel}>{t('الحالة', 'Status')}</div>
                <div className={styles.factValue}>
                  {detail.isActive ? (
                    <Tag color="green">{t('نشط', 'Active')}</Tag>
                  ) : (
                    <Tag color="default">{t('غير نشط', 'Inactive')}</Tag>
                  )}
                  {detail.isAvailableNow && <Tag color="cyan">{t('متاح الآن', 'Available Now')}</Tag>}
                </div>
              </div>
            </div>
            {detail.notes && <div className={styles.notesBox}>{detail.notes}</div>}
            <Button block icon={<EditOutlined />} onClick={() => { setDetail(null); setDeepLinkDetailId(null); openEdit(detail); }}>
              {t('تعديل', 'Edit')}
            </Button>
          </>
        ) : deepLinkDetailId ? (
          <Empty description={t('تعذّر تحميل تفاصيل العامل', 'Could not load worker details')} />
        ) : null}
      </Drawer>

      {/* ── Create / Edit Drawer ───────────────────────────────── */}
      <Drawer
        title={editing ? t('تعديل العامل', 'Edit Worker') : t('إضافة عامل', 'New Worker')}
        open={formOpen}
        onClose={closeForm}
        width={460}
        footer={
          <Space style={{ float: isAr ? 'left' : 'right' }}>
            <Button onClick={closeForm}>{t('إلغاء', 'Cancel')}</Button>
            <Button type="primary" loading={create.isPending || update.isPending} onClick={handleSubmit}>
              {t('حفظ', 'Save')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="fullName"
            label={t('الاسم الكامل', 'Full Name')}
            rules={[
              { required: true, message: t('الاسم مطلوب', 'Full name is required') },
              { max: 200, message: t('الحد الأقصى 200 حرف', 'Max 200 characters') },
            ]}
          >
            <Input size="large" prefix={<TeamOutlined />} maxLength={200} />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label={t('رقم الهاتف', 'Phone Number')}
            rules={[
              { required: true, message: t('الهاتف مطلوب', 'Phone is required') },
              { max: 20, message: t('الحد الأقصى 20 حرف', 'Max 20 characters') },
            ]}
          >
            <Input size="large" prefix={<PhoneOutlined />} maxLength={20} />
          </Form.Item>
          <Form.Item
            name="nationalId"
            label={t('رقم الهوية (اختياري)', 'National ID (optional)')}
            rules={[{ max: 20, message: t('الحد الأقصى 20 حرف', 'Max 20 characters') }]}
          >
            <Input size="large" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="hourlyRate"
            label={t('الأجر بالساعة', 'Hourly Rate')}
            rules={[
              { required: true, message: t('الأجر مطلوب', 'Hourly rate is required') },
              {
                validator: (_, value: number) =>
                  value > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('يجب أن يكون أكبر من صفر', 'Must be greater than 0'))),
              },
            ]}
          >
            <InputNumber size="large" min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="availableFromTime"
            label={t('متاح من', 'Available From')}
            rules={[{ required: true, message: t('وقت البداية مطلوب', 'Start time is required') }]}
          >
            <TimePicker
              size="large"
              format={TIME_FMT}
              style={{ width: '100%' }}
              suffixIcon={<ClockCircleOutlined />}
            />
          </Form.Item>
          <Form.Item
            name="availableToTime"
            label={t('متاح حتى', 'Available To')}
            dependencies={['availableFromTime']}
            rules={[
              { required: true, message: t('وقت النهاية مطلوب', 'End time is required') },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs) {
                  const from = getFieldValue('availableFromTime') as Dayjs | undefined;
                  if (!value || !from || value.isAfter(from)) return Promise.resolve();
                  return Promise.reject(
                    new Error(t('يجب أن يكون بعد وقت البداية', 'Must be after the start time'))
                  );
                },
              }),
            ]}
          >
            <TimePicker
              size="large"
              format={TIME_FMT}
              style={{ width: '100%' }}
              suffixIcon={<ClockCircleOutlined />}
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label={t('ملاحظات (اختياري)', 'Notes (optional)')}
            rules={[{ max: 1000, message: t('الحد الأقصى 1000 حرف', 'Max 1000 characters') }]}
          >
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
