'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Input, Button, Tag, Space, Tooltip, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  SlidersOutlined,
  DeleteOutlined,
  SearchOutlined,
  ApartmentOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAccountSettings } from '@/hooks/api/useAccounts';
import { getAccountType, getReportSideLabel } from '@/types/accounting.types';
import type { AccountSettingListDto } from '@/types/accounting.types';
import { useAuthStore } from '@/store/authStore';
import { useAccountModals } from '../_components/AccountModals';
import styles from './AccountSettings.module.css';

export default function AccountSettingsPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ── Table query state ───────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deep-link support: prefill the search from ?searchTerm=<code>
  // (e.g. when arriving from "Open in Account Settings" on the Chart page).
  useEffect(() => {
    const term = new URLSearchParams(window.location.search).get('searchTerm');
    if (term) {
      setSearchInput(term);
      setSearchTerm(term.trim());
    }
  }, []);

  const { data, isLoading, isFetching, refetch } = useAccountSettings({
    searchTerm,
    pageNumber,
    pageSize,
  });

  // Shared create / rename / reporting modals + delete (also drives the Chart page).
  const {
    element: accountModals,
    openCreate,
    openEditName,
    openReporting,
    deleteAccount,
    isDeleting,
    isLeaf,
  } = useAccountModals();

  const onSearch = (value: string) => {
    setSearchInput(value);
    setSearchTerm(value.trim());
    setPageNumber(1);
  };

  // ── Columns ─────────────────────────────────────────────────
  const columns: ColumnsType<AccountSettingListDto> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_, __, idx) => (pageNumber - 1) * pageSize + idx + 1,
    },
    {
      title: t('رقم الحساب', 'Code'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => {
        const type = getAccountType(code);
        return (
          <span className={styles.code} style={type ? { color: type.color } : undefined}>
            {code}
          </span>
        );
      },
    },
    {
      title: t('اسم الحساب', 'Account Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className={styles.name}>{name}</span>,
    },
    {
      title: t('النوع', 'Type'),
      key: 'type',
      width: 130,
      render: (_, record) => {
        const type = getAccountType(record.code);
        return type ? (
          <Tag color={type.color} style={{ fontFamily: 'inherit' }}>
            {isAr ? type.ar : type.en}
          </Tag>
        ) : (
          '—'
        );
      },
    },
    {
      title: t('قائمة الدخل', 'Income Statement'),
      dataIndex: 'incomeStatementSide',
      key: 'incomeStatementSide',
      width: 140,
      render: (v) => getReportSideLabel(v, isAr),
    },
    {
      title: t('الأرباح والخسائر', 'Profit & Loss'),
      dataIndex: 'profitLossSide',
      key: 'profitLossSide',
      width: 140,
      render: (v) => getReportSideLabel(v, isAr),
    },
    {
      title: t('مجمع بميزان المراجعة', 'Grouped in Trial Balance'),
      dataIndex: 'isGroupedInTrialBalance',
      key: 'isGroupedInTrialBalance',
      width: 130,
      align: 'center',
      render: (v: boolean) =>
        v ? <Tag color="success">{t('نعم', 'Yes')}</Tag> : <Tag>{t('لا', 'No')}</Tag>,
    },
    {
      title: t('إجراءات', 'Actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const deletable = isLeaf(record.id);
        return (
          <Space size={4}>
            <Tooltip title={t('تعديل الاسم', 'Edit name')}>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditName(record)}
              />
            </Tooltip>
            <Tooltip title={t('إعدادات التقارير', 'Reporting settings')}>
              <Button
                size="small"
                type="text"
                icon={<SlidersOutlined />}
                onClick={() => openReporting(record)}
              />
            </Tooltip>
            <Tooltip
              title={
                deletable
                  ? t('حذف الحساب', 'Delete account')
                  : t('لا يمكن حذف حساب له فروع', 'Cannot delete an account with sub-accounts')
              }
            >
              <Popconfirm
                title={t('تأكيد الحذف', 'Confirm delete')}
                description={t(
                  'سيتم حذف هذا الحساب نهائيًا. لا يمكن التراجع.',
                  'This account will be permanently deleted. This cannot be undone.'
                )}
                okText={t('حذف', 'Delete')}
                cancelText={t('إلغاء', 'Cancel')}
                okButtonProps={{ danger: true, loading: isDeleting }}
                disabled={!deletable}
                onConfirm={() => deleteAccount(record.id)}
              >
                <Button size="small" type="text" danger disabled={!deletable} icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
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
            <SettingOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('إعدادات الحسابات', 'Account Settings')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'إضافة وتعديل الحسابات وإعدادات تقاريرها وحذف الحسابات الفرعية',
                  'Create, rename, configure reporting and delete leaf accounts'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ApartmentOutlined />}
              onClick={() => router.push('/accounting/chart-of-accounts')}
              className={styles.refreshBtn}
            >
              {t('شجرة الحسابات', 'Chart of Accounts')}
            </Button>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('تحديث', 'Refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()} className={styles.addBtn}>
              {t('إضافة حساب', 'Add Account')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <Card className={styles.tableCard}>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder={t('ابحث برقم الحساب أو الاسم...', 'Search by account code or name...')}
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
          className={styles.search}
        />

        <Table<AccountSettingListDto>
          rowKey="id"
          columns={columns}
          dataSource={data?.items ?? []}
          loading={isLoading || isFetching}
          size="middle"
          bordered
          scroll={{ x: 1000 }}
          pagination={{
            current: pageNumber,
            pageSize,
            total: data?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => t(`الإجمالي: ${total}`, `Total: ${total}`),
            onChange: (page, size) => {
              setPageNumber(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      {accountModals}
    </div>
  );
}
