'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Spin,
  Empty,
  Modal,
  Tag,
  Tooltip,
  Alert,
  Descriptions,
  Steps,
  Card,
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
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import {
  useMediationFollowUpItems,
  useMediationFollowUpItem,
  useUpdateFollowUpDescription,
} from '@/hooks/api/useMediationFollowUp';
import { InputDescriptionModal } from '@/components/followup/InputDescriptionModal';
import {
  hasFilledInputDescription,
  detectItemFormType,
  getStatusFieldName,
  ITEM_STATUS_OPTIONS,
} from '@/types/follow-up-forms.types';
import type { MediationFollowUpItem } from '@/types/api.types';
import styles from './ContractFollowUpDetail.module.css';

// ── Translations ──────────────────────────────────────────────────────────────

function useT(language: string) {
  return useMemo(() => {
    const map: Record<string, Record<string, string>> = {
      pageTitle: { ar: 'مراحل متابعة العقد', en: 'Contract Follow-Up Stages' },
      backToDashboard: { ar: 'العودة للوحة المتابعة', en: 'Back to Dashboard' },
      refresh: { ar: 'تحديث', en: 'Refresh' },
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
        ar: 'لا يمكن تغيير الحالة حتى تكتمل المرحلة السابقة',
        en: 'Cannot change status until the previous stage is finished',
      },
      fillFormFirstMsg: {
        ar: 'يجب تعبئة بيانات المرحلة أولاً قبل تغيير حالتها',
        en: 'You must fill in the stage data before changing its status',
      },
      noItems: { ar: 'لا توجد مراحل متابعة لهذا العقد', en: 'No follow-up stages for this contract' },
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

  const { data: items = [], isLoading, refetch } = useMediationFollowUpItems(contractId);
  const { data: detailItem, isLoading: detailLoading } = useMediationFollowUpItem(detailItemId);

  const updateDescMutation = useUpdateFollowUpDescription(contractId);

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

// ── Extract status label from inputDescription JSON ───────────────────────────

function getInputDescriptionStatusLabel(item: MediationFollowUpItem): string | null {
  if (!item.inputDescription) return null;
  let parsed: Record<string, unknown> | null = null;
  try {
    const p = JSON.parse(item.inputDescription);
    if (p && typeof p === 'object') parsed = p as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!parsed) return null;

  const formType = detectItemFormType(item);
  if (!formType) return null;

  const fieldName = getStatusFieldName(formType);
  const value = parsed[fieldName];
  if (value == null) return null;

  const options = ITEM_STATUS_OPTIONS[formType] ?? [];
  const found = options.find((o) => o.value === value);
  return found?.labelAr ?? String(value);
}

function ItemCard({
  item,
  idx,
  isRTL,
  t,
  onViewDetail,
  onFillForm,
}: {
  item: MediationFollowUpItem;
  idx: number;
  isRTL: boolean;
  t: (k: string) => string;
  onViewDetail: (item: MediationFollowUpItem) => void;
  onFillForm: (item: MediationFollowUpItem) => void;
}) {
  const name = isRTL
    ? item.statusNameAr || item.statusNameEn
    : item.statusNameEn || item.statusNameAr;

  const dependencyOk = item.canComplete === true;
  const formFilled = hasFilledInputDescription(item.inputDescription);
  const isSettled = item.result != null && item.result !== 1;

  const inputStatusLabel = getInputDescriptionStatusLabel(item);

  return (
    <Card
      className={`${styles.itemCard} ${isSettled ? styles.itemCardCompleted : ''}`}
      size="small"
    >
      <div className={styles.itemCardHeader}>
        <div className={styles.itemCardLeft}>
          <span className={styles.itemIndex}>{idx + 1}</span>
          <span className={styles.itemName}>{name || '—'}</span>
        </div>
        {/* Show inputDescription status if available, otherwise fall back to result tag */}
        {inputStatusLabel
          ? <Tag color="blue">{inputStatusLabel}</Tag>
          : resultTag(item.result, t)
        }
      </div>

      {/* ── Dependency warning ── */}
      {!dependencyOk && !isSettled && (
        <Alert
          type="warning"
          showIcon
          message={t('cannotCompleteMsg')}
          className={styles.dependsAlert}
          banner
        />
      )}

      {/* ── Fill-form required warning ── */}
      {dependencyOk && !isSettled && !formFilled && (
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
