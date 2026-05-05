'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Spin,
  Empty,
  Modal,
  Form,
  Tag,
  Tooltip,
  Alert,
  Descriptions,
  Steps,
  Card,
  Select,
  Input,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useMediationFollowUpItems,
  useMediationFollowUpItem,
  useUpdateFollowUpDescription,
  useCompleteFollowUpItem,
  useCanComplete,
} from '@/hooks/api/useMediationFollowUp';
import { InputDescriptionModal } from '@/components/followup/InputDescriptionModal';
import { hasFilledInputDescription } from '@/types/follow-up-forms.types';
import type { MediationFollowUpItem } from '@/types/api.types';
import styles from './ContractFollowUpDetail.module.css';

// ── Translations ──────────────────────────────────────────────────────────────

function useT(language: string) {
  return useMemo(() => {
    const map: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'مراحل متابعة العقد', en: 'Contract Follow-Up Stages' },
      backToDashboard: { ar: 'العودة للوحة المتابعة', en: 'Back to Dashboard' },
      refresh: { ar: 'تحديث', en: 'Refresh' },
      complete: { ar: 'إتمام المرحلة', en: 'Complete Stage' },
      viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
      fillForm: { ar: 'تعبئة البيانات', en: 'Fill Data' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      save: { ar: 'حفظ', en: 'Save' },
      close: { ar: 'إغلاق', en: 'Close' },
      description: { ar: 'الوصف / الملاحظات', en: 'Description / Notes' },
      statusPending: { ar: 'قيد الانتظار', en: 'Pending' },
      statusCompleted: { ar: 'مكتمل', en: 'Completed' },
      statusFailed: { ar: 'فشل', en: 'Failed' },
      statusSkipped: { ar: 'متجاوز', en: 'Skipped' },
      dependsOn: { ar: 'تعتمد على', en: 'Depends on' },
      maxDays: { ar: 'الحد الأقصى (يوم)', en: 'Max Days' },
      sortOrder: { ar: 'الترتيب', en: 'Order' },
      completedAt: { ar: 'تاريخ الإتمام', en: 'Completed At' },
      notes: { ar: 'ملاحظات', en: 'Notes' },
      cannotCompleteMsg: {
        ar: 'لا يمكن إتمام هذه المرحلة حتى تكتمل المرحلة السابقة',
        en: 'Cannot complete this stage until the previous stage is finished',
      },
      fillFormFirstMsg: {
        ar: 'يجب تعبئة بيانات المرحلة أولاً قبل إتمامها',
        en: 'You must fill in the stage data before completing it',
      },
      noItems: { ar: 'لا توجد مراحل متابعة لهذا العقد', en: 'No follow-up stages for this contract' },
      completeModalTitle: { ar: 'إتمام المرحلة', en: 'Complete Stage' },
      result: { ar: 'النتيجة', en: 'Result' },
      resultCompleted: { ar: 'مكتمل', en: 'Completed' },
      resultFailed: { ar: 'فشل', en: 'Failed' },
      resultSkipped: { ar: 'متجاوز', en: 'Skipped' },
      completedAtLabel: { ar: 'تاريخ الإتمام', en: 'Completed At' },
      detailsModalTitle: { ar: 'تفاصيل المرحلة', en: 'Stage Details' },
      inputDescription: { ar: 'البيانات المدخلة', en: 'Input Data' },
      loading: { ar: 'جاري التحميل...', en: 'Loading...' },
      dataSaved: { ar: 'تم حفظ بيانات المرحلة بنجاح', en: 'Stage data saved successfully' },
    };
    return (key: string) => map[key]?.[language] ?? map[key]?.['en'] ?? key;
  }, [language]);
}

// ── Result helpers ────────────────────────────────────────────────────────────

function resultTag(result: number | null | undefined, t: (k: string) => string) {
  switch (result) {
    case 2:
      return <Tag icon={<CheckCircleOutlined />} color="success">{t('statusCompleted')}</Tag>;
    case 3:
      return <Tag icon={<CloseCircleOutlined />} color="error">{t('statusFailed')}</Tag>;
    case 4:
      return <Tag icon={<MinusCircleOutlined />} color="default">{t('statusSkipped')}</Tag>;
    default:
      return <Tag icon={<ClockCircleOutlined />} color="processing">{t('statusPending')}</Tag>;
  }
}

function stepStatus(result: number | null | undefined): 'finish' | 'process' | 'error' | 'wait' {
  switch (result) {
    case 2: return 'finish';
    case 3: return 'error';
    case 4: return 'wait';
    default: return 'process';
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContractFollowUpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.contractId as string;
  const language = useAuthStore((state) => state.language);
  const isRTL = language === 'ar';
  const t = useT(language);

  // Modals
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [inputFormItem, setInputFormItem] = useState<MediationFollowUpItem | null>(null);
  const [completeItemId, setCompleteItemId] = useState<string | null>(null);
  const [completeForm] = Form.useForm();

  const { data: items = [], isLoading, refetch } = useMediationFollowUpItems(contractId);
  const { data: detailItem, isLoading: detailLoading } = useMediationFollowUpItem(detailItemId);

  const updateDescMutation = useUpdateFollowUpDescription(contractId);
  const completeItemMutation = useCompleteFollowUpItem(contractId);
  const canCompleteMutation = useCanComplete();

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openDetail = (item: MediationFollowUpItem) => {
    if (item.id) setDetailItemId(item.id);
  };

  const openInputForm = (item: MediationFollowUpItem) => {
    setInputFormItem(item);
  };

  const handleInputFormSave = async (jsonData: string) => {
    if (!inputFormItem?.id) return;
    await updateDescMutation.mutateAsync({
      itemId: inputFormItem.id,
      inputDescription: jsonData,
    });
    setInputFormItem(null);
    message.success(t('dataSaved'));
    refetch();
  };

  const openComplete = (item: MediationFollowUpItem) => {
    // Gate: form must be filled before completing
    if (!hasFilledInputDescription(item.inputDescription)) {
      message.warning(t('fillFormFirstMsg'));
      // Auto-open the input form so the user can fill it right away
      setInputFormItem(item);
      return;
    }
    completeForm.resetFields();
    completeForm.setFieldsValue({
      completedAt: new Date().toISOString().slice(0, 16),
      result: 2,
    });
    if (item.id) setCompleteItemId(item.id);
  };

  const handleCompleteItem = async () => {
    if (!completeItemId) return;
    try {
      const values = await completeForm.validateFields();

      const check = await canCompleteMutation.mutateAsync(completeItemId);
      if (!check.canComplete) {
        message.error(t('cannotCompleteMsg'));
        setCompleteItemId(null);
        completeForm.resetFields();
        refetch();
        return;
      }

      await completeItemMutation.mutateAsync({
        contractFollowUpItemId: completeItemId,
        completedAt: values.completedAt,
        notes: values.notes ?? null,
        result: values.result,
      });
      setCompleteItemId(null);
      completeForm.resetFields();
    } catch {
      // form validation errors shown by Ant Design
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  if (!isLoading && sortedItems.length === 0) {
    return (
      <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
        <PageHeader t={t} router={router} refetch={refetch} isLoading={isLoading} />
        <div className={styles.centered}>
          <Empty description={t('noItems')} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <PageHeader t={t} router={router} refetch={refetch} isLoading={isLoading} />

      {/* ── Steps Overview ── */}
      <Card className={styles.stepsCard} size="small">
        <Steps
          direction="horizontal"
          size="small"
          items={sortedItems.map((item) => ({
            title: isRTL
              ? item.statusNameAr || item.statusNameEn || '—'
              : item.statusNameEn || item.statusNameAr || '—',
            status: stepStatus(item.result),
            icon:
              item.result === 2 ? (
                <CheckCircleOutlined />
              ) : item.result === 3 ? (
                <CloseCircleOutlined />
              ) : undefined,
          }))}
          style={{ overflowX: 'auto' }}
        />
      </Card>

      {/* ── Items Cards ── */}
      <div className={styles.itemsGrid}>
        {sortedItems.map((item, idx) => (
          <ItemCard
            key={item.id ?? idx}
            item={item}
            idx={idx}
            isRTL={isRTL}
            t={t}
            onViewDetail={openDetail}
            onFillForm={openInputForm}
            onComplete={openComplete}
          />
        ))}
      </div>

      {/* ── Detail Modal ── */}
      <Modal
        open={!!detailItemId}
        title={t('detailsModalTitle')}
        onCancel={() => setDetailItemId(null)}
        footer={[
          <Button key="close" onClick={() => setDetailItemId(null)}>
            {t('close')}
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        {detailLoading ? (
          <div className={styles.centered}>
            <Spin />
          </div>
        ) : detailItem ? (
          <ItemDetailContent item={detailItem} isRTL={isRTL} t={t} />
        ) : null}
      </Modal>

      {/* ── Input Description (structured) Modal ── */}
      <InputDescriptionModal
        item={inputFormItem}
        open={!!inputFormItem}
        onCancel={() => setInputFormItem(null)}
        onSave={handleInputFormSave}
        loading={updateDescMutation.isPending}
      />

      {/* ── Complete Item Modal ── */}
      <Modal
        open={!!completeItemId}
        title={t('completeModalTitle')}
        onCancel={() => { setCompleteItemId(null); completeForm.resetFields(); }}
        onOk={handleCompleteItem}
        okText={t('complete')}
        cancelText={t('cancel')}
        confirmLoading={canCompleteMutation.isPending || completeItemMutation.isPending}
        destroyOnClose
      >
        <Form form={completeForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="result"
            label={t('result')}
            rules={[{ required: true }]}
            initialValue={2}
          >
            <Select
              options={[
                { value: 2, label: t('resultCompleted') },
                { value: 3, label: t('resultFailed') },
                { value: 4, label: t('resultSkipped') },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="completedAt"
            label={t('completedAtLabel')}
            rules={[{ required: true }]}
            initialValue={new Date().toISOString().slice(0, 16)}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="notes" label={t('notes')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader({
  t,
  router,
  refetch,
  isLoading,
}: {
  t: (k: string) => string;
  router: ReturnType<typeof useRouter>;
  refetch: () => void;
  isLoading: boolean;
}) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerLeft}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/contracts/mediationcontract/automaticfollowup')}
          type="text"
        >
          {t('backToDashboard')}
        </Button>
        <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
      </div>
      <Button icon={<ReloadOutlined />} onClick={refetch} loading={isLoading}>
        {t('refresh')}
      </Button>
    </div>
  );
}

function ItemCard({
  item,
  idx,
  isRTL,
  t,
  onViewDetail,
  onFillForm,
  onComplete,
}: {
  item: MediationFollowUpItem;
  idx: number;
  isRTL: boolean;
  t: (k: string) => string;
  onViewDetail: (item: MediationFollowUpItem) => void;
  onFillForm: (item: MediationFollowUpItem) => void;
  onComplete: (item: MediationFollowUpItem) => void;
}) {
  const name = isRTL
    ? item.statusNameAr || item.statusNameEn
    : item.statusNameEn || item.statusNameAr;

  const dependencyOk = item.canComplete === true;
  const alreadyDone = item.result === 2;
  const formFilled = hasFilledInputDescription(item.inputDescription);

  // Complete button is fully enabled only when:
  //   • predecessor is complete (canComplete)
  //   • item is not already done
  //   • inputDescription has been saved
  const completeEnabled = dependencyOk && !alreadyDone && formFilled;

  // Derive the tooltip message for the Complete button
  let completeTooltip: string;
  if (alreadyDone) {
    completeTooltip = t('statusCompleted');
  } else if (!dependencyOk) {
    completeTooltip = t('cannotCompleteMsg');
  } else if (!formFilled) {
    completeTooltip = t('fillFormFirstMsg');
  } else {
    completeTooltip = t('complete');
  }

  return (
    <Card
      className={`${styles.itemCard} ${alreadyDone ? styles.itemCardCompleted : ''}`}
      size="small"
    >
      <div className={styles.itemCardHeader}>
        <div className={styles.itemCardLeft}>
          <span className={styles.itemIndex}>{idx + 1}</span>
          <span className={styles.itemName}>{name || '—'}</span>
        </div>
        {resultTag(item.result, t)}
      </div>

      {/* ── Dependency warning ── */}
      {!dependencyOk && !alreadyDone && (
        <Alert
          type="warning"
          showIcon
          message={t('cannotCompleteMsg')}
          className={styles.dependsAlert}
          banner
        />
      )}

      {/* ── Fill-form required warning ── */}
      {dependencyOk && !alreadyDone && !formFilled && (
        <Alert
          type="info"
          showIcon
          message={t('fillFormFirstMsg')}
          className={styles.dependsAlert}
          banner
        />
      )}

      {/* ── Meta row ── */}
      <div className={styles.itemMeta}>
        {item.dependsOnStatusName && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('dependsOn')}:</span>{' '}
            {item.dependsOnStatusName}
          </span>
        )}
        {item.maxDays != null && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('maxDays')}:</span> {item.maxDays}
          </span>
        )}
        {item.completedAt && (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>{t('completedAt')}:</span>{' '}
            {new Date(item.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className={styles.itemActions}>
        <Tooltip title={t('viewDetails')}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(item)} />
        </Tooltip>

        <Tooltip title={t('fillForm')}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onFillForm(item)}
            type={formFilled ? 'default' : 'dashed'}
          >
            {t('fillForm')}
          </Button>
        </Tooltip>

        <Tooltip title={completeTooltip}>
          <Button
            size="small"
            type="primary"
            icon={completeEnabled ? <CheckCircleOutlined /> : <LockOutlined />}
            disabled={!completeEnabled}
            onClick={() => onComplete(item)}
            style={
              completeEnabled
                ? { background: '#00aa64', borderColor: '#00aa64' }
                : undefined
            }
          >
            {t('complete')}
          </Button>
        </Tooltip>
      </div>
    </Card>
  );
}

// ── Human-readable label map for every JSON key ──────────────────────────────
const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  ActionDate:            { ar: 'تاريخ الإجراء',        en: 'Action Date' },
  arrivalDate:           { ar: 'تاريخ الوصول',          en: 'Arrival Date' },
  medicalStatus:         { ar: 'الحالة الطبية',          en: 'Medical Status' },
  status:                { ar: 'الحالة',                 en: 'Status' },
  contractAgentStatusId: { ar: 'الحالة',                 en: 'Status' },
  Notes:                 { ar: 'الملاحظات',              en: 'Notes' },
  AirlineCompanyId:      { ar: 'شركة الطيران',           en: 'Airline Company' },
  CarrierLines:          { ar: 'اسم الناقل',             en: 'Carrier Lines' },
  FlightNumber:          { ar: 'رقم الرحلة',             en: 'Flight Number' },
  FlightPlaceId:         { ar: 'مكان الرحلة',            en: 'Flight Place' },
  time:                  { ar: 'وقت الإقلاع',            en: 'Departure Time' },
  DayReceipt:            { ar: 'يوم استلام التذكرة',     en: 'Receipt Day' },
  TimeReceipt:           { ar: 'وقت استلام التذكرة',     en: 'Receipt Time' },
};

// All status options merged — used to resolve a numeric code to its label
import { ITEM_STATUS_OPTIONS } from '@/types/follow-up-forms.types';

const ALL_STATUS_OPTIONS = Object.values(ITEM_STATUS_OPTIONS).flat();

function resolveStatusValue(key: string, value: unknown): string {
  const isStatusField =
    key === 'contractAgentStatusId' || key === 'medicalStatus' || key === 'status';
  if (isStatusField && typeof value === 'number') {
    const found = ALL_STATUS_OPTIONS.find((o) => o.value === value);
    if (found) return found.labelAr;
  }
  return String(value);
}

function ItemDetailContent({
  item,
  isRTL,
}: {
  item: MediationFollowUpItem;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  if (!item.inputDescription) {
    return (
      <p style={{ color: '#aaa', textAlign: 'center', margin: '24px 0' }}>
        لا توجد بيانات مدخلة بعد
      </p>
    );
  }

  let parsed: Record<string, unknown> | null = null;
  try {
    const p = JSON.parse(item.inputDescription);
    if (p && typeof p === 'object') parsed = p as Record<string, unknown>;
  } catch {
    // legacy HTML
  }

  if (parsed) {
    return (
      <Descriptions column={1} bordered size="small" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {Object.entries(parsed).map(([key, value]) => {
          if (value == null || value === '') return null;
          const labels = FIELD_LABELS[key];
          const label = labels
            ? isRTL
              ? labels.ar
              : `${labels.en} / ${labels.ar}`
            : key;
          return (
            <Descriptions.Item key={key} label={label}>
              {resolveStatusValue(key, value)}
            </Descriptions.Item>
          );
        })}
      </Descriptions>
    );
  }

  // Legacy HTML content
  return (
    <div
      style={{ padding: '8px 0' }}
      dangerouslySetInnerHTML={{ __html: item.inputDescription }}
    />
  );
}
