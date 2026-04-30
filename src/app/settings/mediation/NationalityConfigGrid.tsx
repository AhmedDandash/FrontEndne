'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  InputNumber,
  Select,
  Switch,
  Spin,
  Empty,
  Tooltip,
  Table,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import {
  useNationalityFollowUpConfig,
  useToggleNationalityFollowUpConfig,
  useBulkUpdateNationalityFollowUpConfig,
} from '@/hooks/api/useNationalityFollowUpConfig';
import type { NationalityFollowUpConfig, UpdateNationalityFollowUpConfigDto } from '@/types/api.types';
import styles from './MediationSettings.module.css';

interface Props {
  contractNationalityId: number;
  isRTL: boolean;
}

export function NationalityConfigGrid({ contractNationalityId, isRTL }: Props) {
  const { data: configs = [], isLoading } = useNationalityFollowUpConfig(contractNationalityId);
  const toggleMutation = useToggleNationalityFollowUpConfig();
  const bulkUpdateMutation = useBulkUpdateNationalityFollowUpConfig();

  // Local draft state — mirrors the configs for inline editing before Save All
  const [drafts, setDrafts] = useState<Record<number, Partial<UpdateNationalityFollowUpConfigDto>>>({});

  // Reset drafts when configs reload
  useEffect(() => {
    setDrafts({});
  }, [configs]);

  const patchDraft = (id: number, patch: Partial<UpdateNationalityFollowUpConfigDto>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const getField = <K extends keyof NationalityFollowUpConfig>(
    config: NationalityFollowUpConfig,
    field: K
  ): NationalityFollowUpConfig[K] => {
    const draft = drafts[config.id];
    if (draft && field in draft) return (draft as any)[field];
    return config[field];
  };

  const dependsOnOptions = (currentId: number) =>
    configs
      .filter((c) => c.isActive && c.id !== currentId)
      .map((c) => ({
        value: c.id,
        label: isRTL
          ? c.statusNameAr || c.statusNameEn || String(c.id)
          : c.statusNameEn || c.statusNameAr || String(c.id),
      }));

  const handleSaveAll = async () => {
    const configsPayload: UpdateNationalityFollowUpConfigDto[] = configs.map((c) => ({
      id: c.id,
      sortOrder: (drafts[c.id]?.sortOrder ?? c.sortOrder) as number | null,
      dependsOnStatusId: (drafts[c.id]?.dependsOnStatusId ?? c.dependsOnStatusId) as number | null,
      fileNameAr: (drafts[c.id]?.fileNameAr ?? c.fileNameAr) as string | null,
      maxDays: (drafts[c.id]?.maxDays ?? c.maxDays) as number | null,
      isActive: c.isActive ?? false,
    }));

    await bulkUpdateMutation.mutateAsync({
      nationalityId: contractNationalityId,
      configs: configsPayload,
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className={styles.subStatusContainer}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={isRTL ? 'لا توجد إعدادات لهذه الجنسية' : 'No configs for this nationality'}
        />
      </div>
    );
  }

  const hasDrafts = Object.keys(drafts).length > 0;

  const columns = [
    {
      title: isRTL ? 'الحالة' : 'Status',
      key: 'status',
      width: 180,
      render: (_: any, record: NationalityFollowUpConfig) => (
        <span style={{ fontWeight: 600, color: '#003366' }}>
          {isRTL
            ? record.statusNameAr || record.statusNameEn
            : record.statusNameEn || record.statusNameAr}
        </span>
      ),
    },
    {
      title: isRTL ? 'الترتيب' : 'Sort Order',
      key: 'sortOrder',
      width: 100,
      render: (_: any, record: NationalityFollowUpConfig) => (
        <InputNumber
          size="small"
          min={1}
          value={(getField(record, 'sortOrder') as number) ?? 1}
          onChange={(val) => val != null && patchDraft(record.id, { sortOrder: val })}
          style={{ width: 70 }}
        />
      ),
    },
    {
      title: isRTL ? 'تعتمد على' : 'Depends On',
      key: 'dependsOn',
      width: 200,
      render: (_: any, record: NationalityFollowUpConfig) => (
        <Select
          size="small"
          allowClear
          placeholder={isRTL ? 'لا تعتمد على شيء' : 'None'}
          value={(getField(record, 'dependsOnStatusId') as number | null) ?? undefined}
          onChange={(val) => patchDraft(record.id, { dependsOnStatusId: val ?? null })}
          options={dependsOnOptions(record.id)}
          style={{ width: '100%' }}
          optionFilterProp="label"
          showSearch
        />
      ),
    },
    {
      title: isRTL ? 'اسم الملف (عربي)' : 'File Name (AR)',
      key: 'fileNameAr',
      width: 160,
      render: (_: any, record: NationalityFollowUpConfig) => (
        <input
          className={styles.inlineInput}
          value={(getField(record, 'fileNameAr') as string) ?? ''}
          onChange={(e) => patchDraft(record.id, { fileNameAr: e.target.value })}
          placeholder={isRTL ? 'اسم الملف' : 'File name'}
        />
      ),
    },
    {
      title: isRTL ? 'أقصى أيام' : 'Max Days',
      key: 'maxDays',
      width: 100,
      render: (_: any, record: NationalityFollowUpConfig) => (
        <InputNumber
          size="small"
          min={0}
          value={(getField(record, 'maxDays') as number) ?? undefined}
          onChange={(val) => patchDraft(record.id, { maxDays: val ?? null })}
          style={{ width: 70 }}
        />
      ),
    },
    {
      title: isRTL ? 'مفعل' : 'Active',
      key: 'isActive',
      width: 80,
      render: (_: any, record: NationalityFollowUpConfig) => (
        <Switch
          size="small"
          checked={!!record.isActive}
          loading={
            toggleMutation.isPending &&
            (toggleMutation.variables as any)?.id === record.id
          }
          onChange={(checked) =>
            toggleMutation.mutate({
              id: record.id,
              contractNationalityId,
              nextValue: checked,
            })
          }
        />
      ),
    },
  ];

  return (
    <div className={styles.subStatusContainer}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Tooltip
          title={
            isRTL
              ? 'يحفظ كل التغييرات في الترتيب والتبعيات وأسماء الملفات والأيام دفعة واحدة'
              : 'Saves all sort order, dependency, file name and day changes at once'
          }
        >
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={bulkUpdateMutation.isPending}
            onClick={handleSaveAll}
            disabled={!hasDrafts}
            style={{ background: '#003366', borderColor: '#003366' }}
          >
            {isRTL ? 'حفظ الكل' : 'Save All'}
          </Button>
        </Tooltip>
      </div>

      <Table
        dataSource={configs}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) =>
          !record.isActive ? styles.inactiveRow : ''
        }
      />
    </div>
  );
}
