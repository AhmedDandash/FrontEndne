'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Button,
  Card,
  Table,
  Input,
  Select,
  Space,
  Switch,
  Checkbox,
  Tag,
  Tooltip,
  Spin,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyCertificateOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAdminRoles } from '@/hooks/api/useAdmin';
import { usePagePermissions } from '@/hooks/api/usePagePermissions';
import { useAuthStore } from '@/store/authStore';
import {
  PAGE_REGISTRY,
  isAdminRole,
  type PageDef,
  type PermissionMatrix,
} from '@/config/pagePermissions.config';
import styles from './Permissions.module.css';

/** Stable serialization so we can detect unsaved changes regardless of order. */
function normalize(matrix: PermissionMatrix): string {
  const keys = Object.keys(matrix).sort();
  return JSON.stringify(keys.map((k) => [k, [...matrix[k]].sort()]));
}

export default function PermissionsPage() {
  const language = useAuthStore((state) => state.language);
  const isAr = language === 'ar';

  const { data: roles = [], isLoading: rolesLoading } = useAdminRoles();
  const { matrix, isLoading, refetch, savePermissions, isSaving } = usePagePermissions();

  // Editable working copy of the persisted matrix.
  const [draft, setDraft] = useState<PermissionMatrix>(matrix);
  useEffect(() => {
    setDraft(matrix);
  }, [matrix]);

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | undefined>(undefined);

  const hasChanges = normalize(draft) !== normalize(matrix);

  const groupOptions = useMemo(() => {
    const seen = new Map<string, string>();
    PAGE_REGISTRY.forEach((p) => seen.set(p.group, isAr ? p.groupAr : p.groupEn));
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [isAr]);

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PAGE_REGISTRY.filter((p) => {
      if (groupFilter && p.group !== groupFilter) return false;
      if (
        q &&
        !p.labelAr.toLowerCase().includes(q) &&
        !p.labelEn.toLowerCase().includes(q) &&
        !p.key.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, groupFilter]);

  // ── Draft mutations ──
  const isRestricted = (key: string) => draft[key] !== undefined;

  const toggleRestricted = (key: string, restricted: boolean) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (restricted) next[key] = prev[key] ?? [];
      else delete next[key];
      return next;
    });
  };

  const toggleRole = (key: string, role: string, checked: boolean) => {
    setDraft((prev) => {
      const current = prev[key] ?? [];
      const updated = checked
        ? Array.from(new Set([...current, role]))
        : current.filter((r) => r !== role);
      return { ...prev, [key]: updated };
    });
  };

  const handleSave = async () => {
    await savePermissions(draft);
  };

  const handleReset = () => {
    setDraft(matrix);
    refetch();
  };

  // ── Columns: Page, Module, Restricted, then one per role ──
  const roleColumns: ColumnsType<PageDef> = roles.map((role) => {
    const adminRole = isAdminRole([role]);
    return {
      title: (
        <Space orientation="vertical" size={0} align="center">
          <Tag color={adminRole ? 'gold' : 'blue'} style={{ margin: 0 }}>
            {role}
          </Tag>
          {adminRole && (
            <span className={styles.adminHint}>{isAr ? 'وصول دائم' : 'always'}</span>
          )}
        </Space>
      ),
      key: `role-${role}`,
      align: 'center',
      width: 120,
      render: (_: unknown, page: PageDef) => {
        if (adminRole) {
          return (
            <Tooltip
              title={isAr ? 'المسؤول لديه وصول دائم' : 'Admins always have access'}
            >
              <Checkbox checked disabled />
            </Tooltip>
          );
        }
        const restricted = isRestricted(page.key);
        return (
          <Checkbox
            checked={restricted && (draft[page.key] ?? []).includes(role)}
            disabled={!restricted}
            onChange={(e) => toggleRole(page.key, role, e.target.checked)}
          />
        );
      },
    };
  });

  const columns: ColumnsType<PageDef> = [
    {
      title: isAr ? 'الصفحة' : 'Page',
      key: 'page',
      fixed: 'left',
      width: 240,
      render: (_: unknown, page: PageDef) => (
        <div className={styles.pageCell}>
          <span className={styles.pageNameAr}>{isAr ? page.labelAr : page.labelEn}</span>
          <span className={styles.pageNameEn}>{page.key}</span>
        </div>
      ),
    },
    {
      title: isAr ? 'الوحدة' : 'Module',
      key: 'group',
      width: 140,
      render: (_: unknown, page: PageDef) => (
        <Tag>{isAr ? page.groupAr : page.groupEn}</Tag>
      ),
    },
    {
      title: isAr ? 'مقيّدة' : 'Restricted',
      key: 'restricted',
      align: 'center',
      width: 120,
      render: (_: unknown, page: PageDef) => (
        <Tooltip
          title={
            isAr
              ? 'عند الإيقاف: الصفحة متاحة للجميع. عند التفعيل: للأدوار المحددة فقط'
              : 'Off: open to everyone. On: only the selected roles'
          }
        >
          <Switch
            size="small"
            checked={isRestricted(page.key)}
            onChange={(checked) => toggleRestricted(page.key, checked)}
          />
        </Tooltip>
      ),
    },
    ...roleColumns,
  ];

  const loading = isLoading || rolesLoading;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <SafetyCertificateOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>
                {isAr ? 'صلاحيات الصفحات' : 'Page Permissions'}
              </h1>
              <p className={styles.pageSubtitle}>
                {isAr
                  ? 'تحكم في الأدوار المسموح لها بالوصول إلى كل صفحة في النظام'
                  : 'Control which roles may access each page in the system'}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={isSaving}
              className={styles.refreshBtn}
            >
              {isAr ? 'إعادة تعيين' : 'Reset'}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
              className={styles.saveBtn}
            >
              {isAr ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <Card className={styles.tableCard}>
        {hasChanges && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              isAr
                ? 'لديك تغييرات غير محفوظة'
                : 'You have unsaved changes'
            }
          />
        )}

        <div className={styles.toolbar}>
          <Input
            placeholder={isAr ? 'بحث عن صفحة...' : 'Search pages...'}
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className={styles.filterLabel}>
            {isAr ? 'تصفية بالوحدة' : 'Filter by module'}
          </label>
          <Select
            placeholder={isAr ? 'تصفية بالوحدة' : 'Filter by module'}
            allowClear
            style={{ width: 220 }}
            value={groupFilter}
            onChange={(v) => setGroupFilter(v)}
            options={groupOptions}
          />
        </div>

        {loading ? (
          <div className={styles.spinWrapper}>
            <Spin size="large" />
          </div>
        ) : roles.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message={
              isAr
                ? 'لا توجد أدوار متاحة. أضف أدواراً أولاً من إدارة المستخدمين والأدوار.'
                : 'No roles available. Create roles first from User Roles management.'
            }
          />
        ) : (
          <Table<PageDef>
            dataSource={filteredPages}
            columns={columns}
            rowKey="key"
            size="middle"
            bordered
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) =>
                isAr ? `إجمالي: ${total} صفحة` : `Total: ${total} pages`,
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: isAr ? 'لا توجد صفحات مطابقة' : 'No matching pages',
            }}
          />
        )}
      </Card>
    </div>
  );
}
