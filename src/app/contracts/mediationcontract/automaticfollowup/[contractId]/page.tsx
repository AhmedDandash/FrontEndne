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
} from '@ant-design/icons';
import RichTextEditor from '@/components/RichTextEditor';
import { useAuthStore } from '@/store/authStore';
import {
  useMediationFollowUpItems,
  useMediationFollowUpItem,
  useUpdateFollowUpDescription,
  useCompleteFollowUpItem,
  useCanComplete,
} from '@/hooks/api/useMediationFollowUp';
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
      updateDescription: { ar: 'تحديث الوصف', en: 'Update Description' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      save: { ar: 'حفظ', en: 'Save' },
      close: { ar: 'إغلاق', en: 'Close' },
      description: { ar: 'الوصف / الملاحظات', en: 'Description / Notes' },
      descriptionPlaceholder: {
        ar: 'أدخل تفاصيل هذه المرحلة (يمكن إدخال HTML)',
        en: 'Enter stage details (HTML supported)',
      },
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
      noItems: { ar: 'لا توجد مراحل متابعة لهذا العقد', en: 'No follow-up stages for this contract' },
      completeModalTitle: { ar: 'إتمام المرحلة', en: 'Complete Stage' },
      result: { ar: 'النتيجة', en: 'Result' },
      resultCompleted: { ar: 'مكتمل', en: 'Completed' },
      resultFailed: { ar: 'فشل', en: 'Failed' },
      resultSkipped: { ar: 'متجاوز', en: 'Skipped' },
      completedAtLabel: { ar: 'تاريخ الإتمام', en: 'Completed At' },
      detailsModalTitle: { ar: 'تفاصيل المرحلة', en: 'Stage Details' },
      inputDescription: { ar: 'الوصف المدخل', en: 'Input Description' },
      loading: { ar: 'جاري التحميل...', en: 'Loading...' },
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
  const [updateItemId, setUpdateItemId] = useState<string | null>(null);
  const [completeItemId, setCompleteItemId] = useState<string | null>(null);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [completeForm] = Form.useForm();

  const { data: items = [], isLoading, refetch } = useMediationFollowUpItems(contractId);
  const { data: detailItem, isLoading: detailLoading } = useMediationFollowUpItem(detailItemId);

  const updateDescMutation = useUpdateFollowUpDescription(contractId);
  const completeItemMutation = useCompleteFollowUpItem(contractId);
  const canCompleteMutation = useCanComplete();

  // Sort items by sortOrder ascending
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openDetail = (item: MediationFollowUpItem) => {
    if (item.id) setDetailItemId(item.id);
  };

  const openUpdate = (item: MediationFollowUpItem) => {
    setDescriptionValue(item.inputDescription ?? '');
    if (item.id) setUpdateItemId(item.id);
  };

  const openComplete = (item: MediationFollowUpItem) => {
    completeForm.resetFields();
    completeForm.setFieldsValue({
      completedAt: new Date().toISOString().slice(0, 16),
      result: 2,
    });
    if (item.id) setCompleteItemId(item.id);
  };

  const handleUpdateDescription = async () => {
    if (!updateItemId) return;
    // Use the variable directly — JSON.stringify is handled by axios/the http client
    await updateDescMutation.mutateAsync({
      itemId: updateItemId,
      inputDescription: descriptionValue || null,
    });
    setUpdateItemId(null);
    setDescriptionValue('');
  };

  const handleCompleteItem = async () => {
    if (!completeItemId) return;
    try {
      const values = await completeForm.validateFields();

      // Final gate: re-verify eligibility via CanComplete before submitting
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
      // form validation errors — canCompleteMutation errors are shown via message
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
            onUpdate={openUpdate}
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

      {/* ── Update Description Modal ── */}
      <Modal
        open={!!updateItemId}
        title={t('updateDescription')}
        onCancel={() => { setUpdateItemId(null); setDescriptionValue(''); }}
        onOk={handleUpdateDescription}
        okText={t('save')}
        cancelText={t('cancel')}
        confirmLoading={updateDescMutation.isPending}
        width={720}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <RichTextEditor
            value={descriptionValue}
            onChange={setDescriptionValue}
            placeholder={t('descriptionPlaceholder')}
            height={280}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </Modal>

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
  onUpdate,
  onComplete,
}: {
  item: MediationFollowUpItem;
  idx: number;
  isRTL: boolean;
  t: (k: string) => string;
  onViewDetail: (item: MediationFollowUpItem) => void;
  onUpdate: (item: MediationFollowUpItem) => void;
  onComplete: (item: MediationFollowUpItem) => void;
}) {
  const name = isRTL
    ? item.statusNameAr || item.statusNameEn
    : item.statusNameEn || item.statusNameAr;
  const canComplete = item.canComplete === true; // strict: blocked unless explicitly confirmed

  return (
    <Card
      className={`${styles.itemCard} ${item.result === 2 ? styles.itemCardCompleted : ''}`}
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
      {!canComplete && item.result !== 2 && (
        <Alert
          type="warning"
          showIcon
          message={t('cannotCompleteMsg')}
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

      {/* ── Description (rendered inline) ── */}
      {item.inputDescription && (
        <div className={styles.descriptionPreview}>
          <div
            className={styles.descriptionSnippet}
            dangerouslySetInnerHTML={{ __html: item.inputDescription }}
          />
        </div>
      )}

      {/* ── Actions ── */}
      <div className={styles.itemActions}>
        <Tooltip title={t('viewDetails')}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(item)} />
        </Tooltip>
        <Tooltip title={t('updateDescription')}>
          <Button size="small" icon={<EditOutlined />} onClick={() => onUpdate(item)} />
        </Tooltip>
        <Tooltip title={canComplete ? t('complete') : t('cannotCompleteMsg')}>
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={!canComplete || item.result === 2}
            onClick={() => onComplete(item)}
            style={
              canComplete && item.result !== 2
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

function ItemDetailContent({
  item,
  isRTL,
  t,
}: {
  item: MediationFollowUpItem;
  isRTL: boolean;
  t: (k: string) => string;
}) {
  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label={isRTL ? 'الاسم (عربي)' : 'Name (AR)'}>
        {item.statusNameAr || '—'}
      </Descriptions.Item>
      <Descriptions.Item label={isRTL ? 'الاسم (إنجليزي)' : 'Name (EN)'}>
        {item.statusNameEn || '—'}
      </Descriptions.Item>
      <Descriptions.Item label={t('sortOrder')}>
        {item.sortOrder ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label={t('dependsOn')}>
        {item.dependsOnStatusName || '—'}
      </Descriptions.Item>
      <Descriptions.Item label={t('maxDays')}>
        {item.maxDays ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label={isRTL ? 'الحالة' : 'Status'}>
        {resultTag(item.result, t)}
      </Descriptions.Item>
      <Descriptions.Item label={t('completedAt')}>
        {item.completedAt ? new Date(item.completedAt).toLocaleString() : '—'}
      </Descriptions.Item>
      <Descriptions.Item label={t('notes')}>
        {item.notes || '—'}
      </Descriptions.Item>
      <Descriptions.Item label={t('inputDescription')}>
        {item.inputDescription ? (
          // Render HTML content safely using dangerouslySetInnerHTML
          // (content was entered by the logged-in admin, not external input)
          <div
            className={styles.htmlContent}
            dangerouslySetInnerHTML={{ __html: item.inputDescription }}
          />
        ) : (
          '—'
        )}
      </Descriptions.Item>
    </Descriptions>
  );
}
