'use client';

import { useState, useMemo, useEffect } from 'react';
import { Timeline, Select, DatePicker, Input, Button, Spin, Empty, Form, Tag, Tooltip } from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  useMediationContractFollowUps,
  useCreateMediationContractFollowUp,
} from '@/hooks/api/useMediationContractFollowUps';
import {
  useMediationFollowUpStatuses,
  useMediationSubStatuses,
} from '@/hooks/api/useMediationFollowUpStatuses';
import type { MediationContractFollowUp } from '@/types/api.types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

dayjs.extend(relativeTime);

interface FollowUpTimelineProps {
  contractId: number;
  language: string;
}

const COLORS = ['#003366', '#00478c', '#00aa64', '#1890ff', '#722ed1', '#eb2f96', '#fa8c16'];

export default function FollowUpTimeline({ contractId, language }: FollowUpTimelineProps) {
  const isRTL = language === 'ar';

  // ==================== Data ====================
  const [filterStatusId, setFilterStatusId] = useState<number | undefined>(undefined);
  const { data: followUps = [], isLoading } = useMediationContractFollowUps(
    contractId,
    filterStatusId
  );
  const { data: parentStatuses = [] } = useMediationFollowUpStatuses();
  const createMutation = useCreateMediationContractFollowUp();

  // ==================== Cascading State ====================
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const { data: subStatuses = [], isLoading: subLoading } = useMediationSubStatuses(
    selectedParentId!
  );

  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();

  // ==================== Translations ====================
  const t = useMemo(() => {
    const tr: Record<string, Record<string, string>> = {
      followUp: { ar: 'متابعة العقد', en: 'Contract Follow-Up' },
      addFollowUp: { ar: 'إضافة متابعة', en: 'Add Follow-Up' },
      parentStatus: { ar: 'حالة المتابعة', en: 'Follow-Up Status' },
      subStatus: { ar: 'الحالة الفرعية', en: 'Sub-Status' },
      examinationDate: { ar: 'تاريخ الفحص', en: 'Examination Date' },
      notes: { ar: 'ملاحظات', en: 'Notes' },
      submit: { ar: 'إرسال', en: 'Submit' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      noFollowUps: { ar: 'لا توجد متابعات', en: 'No follow-ups yet' },
      filterByStatus: { ar: 'تصفية حسب الحالة', en: 'Filter by status' },
      all: { ar: 'الكل', en: 'All' },
      required: { ar: 'هذا الحقل مطلوب', en: 'This field is required' },
      by: { ar: 'بواسطة', en: 'By' },
      selectParent: { ar: 'اختر حالة المتابعة أولاً', en: 'Select follow-up status first' },
    };
    return (key: string) => tr[key]?.[language] || tr[key]?.['en'] || key;
  }, [language]);

  // ==================== Options ====================
  const parentOptions = useMemo(
    () =>
      parentStatuses
        .filter((p) => p.isActive)
        .map((p) => ({
          value: p.id,
          label: isRTL ? p.nameAr || p.nameEn : p.nameEn || p.nameAr,
        })),
    [parentStatuses, isRTL]
  );

  const subOptions = useMemo(
    () =>
      subStatuses
        .filter((s) => s.isActive)
        .map((s) => ({
          value: s.id,
          label: isRTL ? s.nameStatusAr || s.nameStatusEn : s.nameStatusEn || s.nameStatusAr,
        })),
    [subStatuses, isRTL]
  );

  // Reset sub-status when parent changes
  useEffect(() => {
    form.setFieldValue('mediationStatusesId', undefined);
  }, [selectedParentId, form]);

  // ==================== Handlers ====================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createMutation.mutateAsync({
        contractId,
        examinationDate: values.examinationDate.format('YYYY-MM-DD'),
        mediationFollowUpStatusesId: values.mediationFollowUpStatusesId,
        mediationStatusesId: values.mediationStatusesId,
        notes: values.notes || null,
      });
      form.resetFields();
      setSelectedParentId(null);
      setShowForm(false);
    } catch {
      // Validation errors
    }
  };

  // ==================== Timeline Color ====================
  const getTimelineColor = (item: MediationContractFollowUp) => {
    if (!item.mediationFollowUpStatusesId) return '#003366';
    const idx = parentStatuses.findIndex((p) => p.id === item.mediationFollowUpStatusesId);
    return COLORS[idx % COLORS.length] || '#003366';
  };

  // ==================== Render ====================
  return (
    <div style={{ padding: '8px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h4 style={{ margin: 0, color: '#003366', fontWeight: 600 }}>{t('followUp')}</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            allowClear
            placeholder={t('filterByStatus')}
            style={{ width: 180 }}
            value={filterStatusId}
            onChange={(v) => setFilterStatusId(v || undefined)}
            options={[{ value: undefined, label: t('all') }, ...parentOptions]}
            size="small"
          />
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setShowForm(!showForm)}
            style={{ background: '#00aa64', borderColor: '#00aa64' }}
          >
            {t('addFollowUp')}
          </Button>
        </div>
      </div>

      {/* ====== Add Follow-Up Form ====== */}
      {showForm && (
        <div
          style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Form form={form} layout="vertical" size="small">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <Form.Item
                name="mediationFollowUpStatusesId"
                label={t('parentStatus')}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('parentStatus')}
                  options={parentOptions}
                  onChange={(v) => setSelectedParentId(v)}
                />
              </Form.Item>
              <Form.Item
                name="mediationStatusesId"
                label={t('subStatus')}
                rules={[{ required: true, message: t('required') }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={selectedParentId ? t('subStatus') : t('selectParent')}
                  options={subOptions}
                  disabled={!selectedParentId}
                  loading={subLoading}
                  notFoundContent={subLoading ? <Spin size="small" /> : undefined}
                />
              </Form.Item>
              <Form.Item
                name="examinationDate"
                label={t('examinationDate')}
                rules={[{ required: true, message: t('required') }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="notes" label={t('notes')}>
                <Input.TextArea rows={1} placeholder={t('notes')} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={() => {
                  setShowForm(false);
                  form.resetFields();
                  setSelectedParentId(null);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                loading={createMutation.isPending}
                onClick={handleSubmit}
              >
                {t('submit')}
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* ====== Timeline ====== */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : followUps.length === 0 ? (
        <Empty description={t('noFollowUps')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          mode={isRTL ? 'right' : 'left'}
          items={followUps.map((item) => ({
            color: getTimelineColor(item),
            dot:
              item.subStatusNameAr?.includes('مكتمل') ||
              item.subStatusNameEn?.toLowerCase().includes('complete') ? (
                <CheckCircleOutlined style={{ fontSize: 16, color: '#00aa64' }} />
              ) : (
                <ClockCircleOutlined style={{ fontSize: 16 }} />
              ),
            children: (
              <div style={{ padding: '4px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 4,
                  }}
                >
                  <Tag color={getTimelineColor(item)} style={{ margin: 0 }}>
                    {isRTL
                      ? item.followUpStatusNameAr || item.followUpStatusNameEn
                      : item.followUpStatusNameEn || item.followUpStatusNameAr}
                  </Tag>
                  <Tag style={{ margin: 0 }}>
                    {isRTL
                      ? item.subStatusNameAr || item.subStatusNameEn
                      : item.subStatusNameEn || item.subStatusNameAr}
                  </Tag>
                </div>
                {item.notes && (
                  <p style={{ margin: '4px 0', color: '#555', fontSize: 13 }}>{item.notes}</p>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: 12,
                    color: '#999',
                    flexWrap: 'wrap',
                  }}
                >
                  {item.examinationDate && (
                    <Tooltip title={dayjs(item.examinationDate).format('YYYY-MM-DD')}>
                      <span>
                        <ClockCircleOutlined style={{ marginInlineEnd: 4 }} />
                        {dayjs(item.examinationDate).locale(language).fromNow()}
                      </span>
                    </Tooltip>
                  )}
                  {item.createdByName && (
                    <span>
                      {t('by')} {item.createdByName}
                    </span>
                  )}
                </div>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
