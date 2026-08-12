'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Button,
  Space,
  Tag,
  Avatar,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Typography,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  UserOutlined,
  CommentOutlined,
  IdcardOutlined,
  HomeOutlined,
  LogoutOutlined,
  SwapOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  UploadOutlined,
  CalendarOutlined,
  BankOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHousedWorkers } from '@/hooks/api/useWorkerHousing';
import { useHousingActiveList } from '@/hooks/api/useHousing';
import type {
  HousedWorker,
  HousingApplicantParams,
  DeportationDto,
  HandoverDto,
  IssueResidencyDto,
  AddUpdateDto,
  ExitAndReEntryDto,
} from '@/types/housing.types';
import styles from './HousingApplicants.module.css';
import { resolveImageUrl } from '@/utils/image';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = 'all' | 'transfer' | 'work' | 'deportation' | 'handover' | 'residency';

const TAB_PARAMS: Record<TabKey, HousingApplicantParams> = {
  all: {},
  transfer: { wantsTransfer: true },
  work: { wantsWork: true },
  deportation: { isReadyForDeportation: true },
  handover: { isReadyForHandover: true },
  residency: { hasResidency: false },
};

const TAB_LABELS: Record<TabKey, string> = {
  all: 'الكل بالسكن',
  transfer: 'نقل كفالة',
  work: 'تشغيل',
  deportation: 'ترحيل',
  handover: 'تسليم',
  residency: 'إصدار إقامة',
};

// ─── Days badge ───────────────────────────────────────────────────────────────

function DaysBadge({ days }: { days?: number | null }) {
  if (days == null) return null;
  const cls =
    days > 30 ? styles.daysBadgeDanger : days > 14 ? styles.daysBadgeWarn : styles.daysBadgeOk;
  return (
    <span className={`${styles.daysBadge} ${cls}`}>
      <CalendarOutlined style={{ fontSize: 11 }} />
      {' '}{days} {days === 1 ? 'يوم' : 'أيام'}
    </span>
  );
}

// ─── Info item ────────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{icon} {label}</span>
      <span className={styles.infoValue}>{value || '—'}</span>
    </div>
  );
}

// ─── Worker Card ──────────────────────────────────────────────────────────────

interface WorkerCardProps {
  worker: HousedWorker;
  activeTab: TabKey;
  onDeportation: () => void;
  onCancelDeportation: () => void;
  onHandover: () => void;
  onResidency: () => void;
  onUpdate: () => void;
  onExitReEntry: () => void;
  onExitHousing: () => void;
  onToggleWork: () => void;
  onToggleTransfer: () => void;
}

function WorkerCard({
  worker: w,
  activeTab,
  onDeportation,
  onCancelDeportation,
  onHandover,
  onResidency,
  onUpdate,
  onExitReEntry,
  onExitHousing,
  onToggleWork,
  onToggleTransfer,
}: WorkerCardProps) {
  const cardCls = [
    styles.workerCard,
    w.isReadyForDeportation ? styles.cardDeportation : '',
    w.isReadyForHandover ? styles.cardHandover : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardCls}>
      {/* ── Banner ── */}
      <div className={styles.cardBanner}>
        <DaysBadge days={w.housedDays} />
      </div>

      {/* ── Avatar + name ── */}
      <div className={styles.avatarSection}>
        <Avatar
          size={80}
          src={resolveImageUrl(w.uploadImage)}
          icon={<UserOutlined />}
          className={styles.avatar}
        />
        <Title level={5} className={styles.workerName}>
          {w.workerName || '—'}
        </Title>
        <Text className={styles.workerNationality}>
          <GlobalOutlined />
          {w.nationalityNameAr || w.nationalityNameEn || '—'}
        </Text>
      </div>

      {/* ── Separator ── */}
      <div className={styles.separator} />

      {/* ── Info grid ── */}
      <div className={styles.infoGrid}>
        <InfoItem icon={<IdcardOutlined />} label="الجواز" value={w.workerPassportNumber} />
        <InfoItem icon={<BankOutlined />} label="المهنة" value={w.jobName} />
        <InfoItem icon={<HomeOutlined />} label="السكن" value={w.housingName} />
        <InfoItem icon={<PhoneOutlined />} label="الجوال" value={w.mobile} />
      </div>

      {/* ── Status flags ── */}
      <div className={styles.flagsRow}>
        {w.isReadyForDeportation && (
          <Tag color="error" icon={<WarningOutlined />} className={styles.flag}>ترحيل</Tag>
        )}
        {w.isReadyForHandover && (
          <Tag color="processing" icon={<SwapOutlined />} className={styles.flag}>تسليم</Tag>
        )}
        {w.isResidencyIssued && (
          <Tag color="success" icon={<CheckCircleOutlined />} className={styles.flag}>إقامة مُصدَرة</Tag>
        )}
        {!w.isReadyForDeportation && !w.isReadyForHandover && !w.isResidencyIssued && (
          <span className={styles.noFlags}>لا توجد حالات مميزة</span>
        )}
      </div>

      {/* ── Preference toggles ── */}
      <div className={styles.togglesRow}>
        <div className={styles.toggleItem}>
          <Text className={styles.toggleLabel}>نقل كفالة</Text>
          <Switch
            size="small"
            checked={!!w.wantsTransfer}
            onChange={onToggleTransfer}
            checkedChildren="نعم"
            unCheckedChildren="لا"
          />
        </div>
        <div className={styles.toggleItem}>
          <Text className={styles.toggleLabel}>تشغيل</Text>
          <Switch
            size="small"
            checked={!!w.wantsWork}
            onChange={onToggleWork}
            checkedChildren="نعم"
            unCheckedChildren="لا"
          />
        </div>
      </div>

      {/* ── Notes ── */}
      {w.notes && (
        <div className={styles.notesRow}>
          <CommentOutlined style={{ marginInlineEnd: 6, color: '#d48806' }} />
          <Text className={styles.notesText} ellipsis={{ tooltip: w.notes }}>
            {w.notes}
          </Text>
        </div>
      )}

      {/* ── Contextual actions based on active tab ── */}
      <div className={styles.primaryActions}>
        {activeTab === 'residency' && (
          <>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnSuccess}`}
              onClick={onResidency}
              disabled={!!w.isResidencyIssued}
              style={w.isResidencyIssued ? { opacity: 0.4, cursor: 'default' } : {}}
            >
              <CheckCircleOutlined className={styles.primaryBtnIcon} />
              تم اصدار اقامة
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`}
              onClick={onUpdate}
            >
              <CommentOutlined className={styles.primaryBtnIcon} />
              اضافة تحديث
            </button>
          </>
        )}

        {activeTab === 'deportation' && (
          <>
            {w.isReadyForDeportation ? (
              <>
                <Popconfirm
                  title="خروج نهائي من السكن؟"
                  description="سيتم إخراج العامل من السكن نهائياً."
                  onConfirm={onExitHousing}
                  okText="نعم"
                  cancelText="إلغاء"
                  okButtonProps={{ danger: true }}
                >
                  <button className={`${styles.primaryBtn} ${styles.secondaryBtnDanger}`}>
                    <LogoutOutlined className={styles.primaryBtnIcon} />
                    خروج من السكن
                  </button>
                </Popconfirm>
                <Popconfirm
                  title="إلغاء الترحيل؟"
                  onConfirm={onCancelDeportation}
                  okText="نعم"
                  cancelText="لا"
                >
                  <button className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`}>
                    <CloseCircleOutlined className={styles.primaryBtnIcon} />
                    الغاء الترحيل
                  </button>
                </Popconfirm>
              </>
            ) : (
              <>
                <button
                  className={`${styles.primaryBtn} ${styles.primaryBtnDanger}`}
                  onClick={onDeportation}
                >
                  <LogoutOutlined className={styles.primaryBtnIcon} />
                  ترحيل
                </button>
                <button
                  className={`${styles.primaryBtn} ${styles.primaryBtnPrimary}`}
                  onClick={onHandover}
                >
                  <SwapOutlined className={styles.primaryBtnIcon} />
                  تسليم
                </button>
                <button
                  className={`${styles.primaryBtn} ${styles.primaryBtnSuccess}`}
                  onClick={onExitReEntry}
                >
                  <HomeOutlined className={styles.primaryBtnIcon} />
                  خروج وعودة
                </button>
              </>
            )}
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`}
              onClick={onUpdate}
            >
              <CommentOutlined className={styles.primaryBtnIcon} />
              اضافة تحديث
            </button>
          </>
        )}

        {activeTab === 'handover' && (
          <>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnPrimary}`}
              onClick={onHandover}
            >
              <SwapOutlined className={styles.primaryBtnIcon} />
              تسليم
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnDanger}`}
              onClick={onDeportation}
            >
              <LogoutOutlined className={styles.primaryBtnIcon} />
              ترحيل
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnSuccess}`}
              onClick={onExitReEntry}
            >
              <HomeOutlined className={styles.primaryBtnIcon} />
              خروج وعودة
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`}
              onClick={onUpdate}
            >
              <CommentOutlined className={styles.primaryBtnIcon} />
              اضافة تحديث
            </button>
          </>
        )}

        {(activeTab === 'work' || activeTab === 'transfer') && (
          <>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnDanger}`}
              onClick={onDeportation}
            >
              <LogoutOutlined className={styles.primaryBtnIcon} />
              ترحيل
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnPrimary}`}
              onClick={onHandover}
            >
              <SwapOutlined className={styles.primaryBtnIcon} />
              تسليم
            </button>
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`}
              onClick={onUpdate}
            >
              <CommentOutlined className={styles.primaryBtnIcon} />
              اضافة تحديث
            </button>
          </>
        )}

        {activeTab === 'all' && (
          <>
            {!w.isReadyForDeportation ? (
              <button
                className={`${styles.primaryBtn} ${styles.primaryBtnDanger}`}
                onClick={onDeportation}
              >
                <LogoutOutlined className={styles.primaryBtnIcon} />
                ترحيل
              </button>
            ) : (
              <Popconfirm
                title="إلغاء الترحيل؟"
                onConfirm={onCancelDeportation}
                okText="نعم"
                cancelText="لا"
              >
                <button className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`}>
                  <CloseCircleOutlined className={styles.primaryBtnIcon} />
                  إلغاء ترحيل
                </button>
              </Popconfirm>
            )}
            <button
              className={`${styles.primaryBtn} ${styles.primaryBtnPrimary}`}
              onClick={onHandover}
            >
              <SwapOutlined className={styles.primaryBtnIcon} />
              تسليم
            </button>
            {!w.isResidencyIssued ? (
              <button
                className={`${styles.primaryBtn} ${styles.primaryBtnSuccess}`}
                onClick={onResidency}
              >
                <GlobalOutlined className={styles.primaryBtnIcon} />
                إقامة
              </button>
            ) : (
              <button className={`${styles.primaryBtn} ${styles.primaryBtnNeutral}`} disabled style={{ opacity: 0.4, cursor: 'default' }}>
                <CheckCircleOutlined className={styles.primaryBtnIcon} />
                إقامة
              </button>
            )}
            <button
              className={`${styles.secondaryBtn} ${styles.primaryBtnNeutral}`}
              onClick={onUpdate}
            >
              <CommentOutlined className={styles.secondaryBtnIcon} />
              ملاحظة
            </button>
            <button
              className={`${styles.secondaryBtn} ${styles.primaryBtnSuccess}`}
              onClick={onExitReEntry}
            >
              <HomeOutlined className={styles.secondaryBtnIcon} />
              خروج وعودة
            </button>
            <Popconfirm
              title="خروج نهائي من السكن"
              description="سيتم إخراج العامل من السكن نهائياً. هل أنت متأكد؟"
              onConfirm={onExitHousing}
              okText="نعم، خروج نهائي"
              cancelText="إلغاء"
              okButtonProps={{ danger: true }}
              disabled={!w.isReadyForDeportation}
            >
              <button
                className={`${styles.secondaryBtn} ${styles.secondaryBtnDanger}`}
                disabled={!w.isReadyForDeportation}
                title={!w.isReadyForDeportation ? 'يجب تسجيل الترحيل أولاً' : undefined}
                style={!w.isReadyForDeportation ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              >
                <LogoutOutlined className={styles.secondaryBtnIcon} />
                خروج نهائي
              </button>
            </Popconfirm>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HousingApplicantsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');

  const params: HousingApplicantParams = useMemo(
    () => ({ ...TAB_PARAMS[activeTab], ...(search ? { searchKeyword: search } : {}) }),
    [activeTab, search]
  );

  const {
    workers: workersRaw,
    isLoading,
    toggleWantsWork,
    toggleWantsTransfer,
    registerDeportation,
    cancelDeportation,
    registerHandover,
    issueResidency,
    addUpdate,
    exitAndReEntry,
    exitHousing,
    isDeporting,
    isHandingOver,
    isIssuingResidency,
    isAddingUpdate,
    isExiting,
  } = useHousedWorkers(params);

  const workers = workersRaw ?? [];

  useHousingActiveList();

  // ─── Modal state ──────────────────────────────────────────────────────────

  const [deportationModal, setDeportationModal] = useState<HousedWorker | null>(null);
  const [handoverModal, setHandoverModal] = useState<HousedWorker | null>(null);
  const [residencyModal, setResidencyModal] = useState<HousedWorker | null>(null);
  const [updateModal, setUpdateModal] = useState<HousedWorker | null>(null);
  const [exitModal, setExitModal] = useState<HousedWorker | null>(null);

  const [deportationForm] = Form.useForm<DeportationDto & { ticketImageFile?: any }>();
  const [handoverForm] = Form.useForm<HandoverDto>();
  const [residencyForm] = Form.useForm<IssueResidencyDto>();
  const [updateForm] = Form.useForm<AddUpdateDto>();
  const [exitForm] = Form.useForm<ExitAndReEntryDto>();

  const closeAll = () => {
    setDeportationModal(null);
    setHandoverModal(null);
    setResidencyModal(null);
    setUpdateModal(null);
    setExitModal(null);
    deportationForm.resetFields();
    handoverForm.resetFields();
    residencyForm.resetFields();
    updateForm.resetFields();
    exitForm.resetFields();
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleDeportation = async () => {
    const vals = await deportationForm.validateFields();
    const ticketFile: File | undefined = vals.ticketImageFile?.[0]?.originFileObj;
    await registerDeportation({
      workerId: deportationModal!.workerId,
      data: {
        transportType: vals.transportType,
        carrierName: vals.carrierName ?? null,
        tripNumber: vals.tripNumber ?? null,
        deportationTime: vals.deportationTime
          ? dayjs(vals.deportationTime as any).toISOString()
          : undefined,
        destinationName: vals.destinationName ?? null,
        saudiMobile: vals.saudiMobile ?? null,
        whatsAppNumber: vals.whatsAppNumber ?? null,
        borderNumber: vals.borderNumber ?? null,
        ticketType: vals.ticketType ?? null,
        ticketImage: ticketFile ?? null,
      },
    });
    closeAll();
  };

  const handleHandover = async () => {
    const vals = await handoverForm.validateFields();
    await registerHandover({
      workerId: handoverModal!.workerId,
      data: {
        handoverTime: dayjs(vals.handoverTime as any).toISOString(),
        saudiMobile: vals.saudiMobile ?? null,
        whatsAppNumber: vals.whatsAppNumber ?? null,
        borderNumber: vals.borderNumber ?? null,
      },
    });
    closeAll();
  };

  const handleResidency = async () => {
    const vals = await residencyForm.validateFields();
    await issueResidency({ workerId: residencyModal!.workerId, data: vals });
    closeAll();
  };

  const handleAddUpdate = async () => {
    const vals = await updateForm.validateFields();
    await addUpdate({
      workerId: updateModal!.workerId,
      data: {
        updateDate: dayjs(vals.updateDate as any).toISOString(),
        notes: vals.notes,
      },
    });
    closeAll();
  };

  const handleExitReEntry = async () => {
    const vals = await exitForm.validateFields();
    await exitAndReEntry({
      workerId: exitModal!.workerId,
      data: {
        exitDate: dayjs(vals.exitDate as any).toISOString(),
        reason: vals.reason ?? null,
      },
    });
    closeAll();
  };

  const tabItems = (Object.keys(TAB_LABELS) as TabKey[]).map((key) => ({
    key,
    label: TAB_LABELS[key],
  }));

  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <HomeOutlined className={styles.pageTitleIcon} />
          <div>
            <Title level={4} className={styles.pageTitleText}>العمال في السكن</Title>
            <Text className={styles.pageSubtitle}>
              {isLoading ? '...' : `${workers.length} عامل`}
            </Text>
          </div>
        </div>
        <Input.Search
          placeholder="بحث بالاسم أو الجواز..."
          allowClear
          className={styles.searchInput}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch('')}
        />
      </div>

      {/* ── Tabs ── */}
      <Card className={styles.tabsCard} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
          items={tabItems}
          className={styles.tabs}
        />
      </Card>

      {/* ── Cards grid ── */}
      {isLoading ? (
        <div className={styles.spinWrap}>
          <Spin size="large" tip="جاري التحميل..." />
        </div>
      ) : workers.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty description="لا يوجد عمال في هذه القائمة" />
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {workers.map((w) => (
            <WorkerCard
              key={w.workerId}
              worker={w}
              activeTab={activeTab}
              onDeportation={() => { setDeportationModal(w); deportationForm.resetFields(); }}
              onCancelDeportation={() => { cancelDeportation(w.workerId).catch(() => {}); }}
              onHandover={() => { setHandoverModal(w); handoverForm.resetFields(); }}
              onResidency={() => { setResidencyModal(w); residencyForm.resetFields(); }}
              onUpdate={() => { setUpdateModal(w); updateForm.setFieldsValue({ updateDate: dayjs() as any }); }}
              onExitReEntry={() => { setExitModal(w); exitForm.resetFields(); }}
              onExitHousing={() => { exitHousing(w.workerId).catch(() => {}); }}
              onToggleWork={() => { toggleWantsWork(w.workerId).catch(() => {}); }}
              onToggleTransfer={() => { toggleWantsTransfer(w.workerId).catch(() => {}); }}
            />
          ))}
        </div>
      )}

      {/* ── Deportation Modal ── */}
      <Modal
        open={!!deportationModal}
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>تسجيل ترحيل — {deportationModal?.workerName}</span>
          </Space>
        }
        onCancel={closeAll}
        onOk={handleDeportation}
        confirmLoading={isDeporting}
        okText="تسجيل الترحيل"
        okButtonProps={{ danger: true }}
        cancelText="إلغاء"
        width={540}
        destroyOnHidden
      >
        <Form form={deportationForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="transportType" label="نوع المواصلة" rules={[{ required: true, message: 'مطلوب' }]}>
            <Select
              placeholder="اختر نوع المواصلة"
              options={[
                { value: 'Air', label: 'جوي' },
                { value: 'Land', label: 'بري' },
                { value: 'Sea', label: 'بحري' },
              ]}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="carrierName" label="اسم الناقل">
              <Input placeholder="مثال: السعودية للطيران" />
            </Form.Item>
            <Form.Item name="tripNumber" label="رقم الرحلة">
              <Input placeholder="SV123" />
            </Form.Item>
            <Form.Item name="destinationName" label="الوجهة">
              <Input placeholder="إيثيوبيا / الفلبين..." />
            </Form.Item>
            <Form.Item name="deportationTime" label="وقت الترحيل">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="saudiMobile" label="جوال سعودي">
              <Input placeholder="05XXXXXXXX" />
            </Form.Item>
            <Form.Item name="whatsAppNumber" label="واتساب">
              <Input placeholder="05XXXXXXXX" />
            </Form.Item>
            <Form.Item name="borderNumber" label="رقم الحدود">
              <Input placeholder="1234567890" />
            </Form.Item>
            <Form.Item name="ticketType" label="نوع التذكرة">
              <Input placeholder="ذهاب / ذهاب وعودة" />
            </Form.Item>
          </div>
          <Form.Item
            name="ticketImageFile"
            label="صورة التذكرة"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept="image/*,.pdf">
              <Button icon={<UploadOutlined />}>رفع صورة التذكرة</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Handover Modal ── */}
      <Modal
        open={!!handoverModal}
        title={
          <Space>
            <SwapOutlined style={{ color: '#1677ff' }} />
            <span>تسجيل تسليم — {handoverModal?.workerName}</span>
          </Space>
        }
        onCancel={closeAll}
        onOk={handleHandover}
        confirmLoading={isHandingOver}
        okText="تسجيل التسليم"
        cancelText="إلغاء"
        width={480}
        destroyOnHidden
      >
        <Form form={handoverForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="handoverTime" label="وقت التسليم" rules={[{ required: true, message: 'مطلوب' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="saudiMobile" label="جوال سعودي">
              <Input placeholder="05XXXXXXXX" />
            </Form.Item>
            <Form.Item name="whatsAppNumber" label="واتساب">
              <Input placeholder="05XXXXXXXX" />
            </Form.Item>
          </div>
          <Form.Item name="borderNumber" label="رقم الحدود">
            <Input placeholder="1234567890" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Residency Modal ── */}
      <Modal
        open={!!residencyModal}
        title={
          <Space>
            <GlobalOutlined style={{ color: '#52c41a' }} />
            <span>إصدار إقامة — {residencyModal?.workerName}</span>
          </Space>
        }
        onCancel={closeAll}
        onOk={handleResidency}
        confirmLoading={isIssuingResidency}
        okText="تأكيد إصدار الإقامة"
        cancelText="إلغاء"
        width={400}
        destroyOnHidden
      >
        <Form form={residencyForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="iqamaNumber"
            label="رقم الإقامة"
            rules={[
              { required: true, message: 'مطلوب' },
              { len: 10, message: 'يجب أن يكون رقم الإقامة 10 أرقام' },
            ]}
          >
            <Input
              placeholder="2123456789"
              maxLength={10}
              style={{ fontFamily: 'monospace', letterSpacing: 2 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add Update Modal ── */}
      <Modal
        open={!!updateModal}
        title={
          <Space>
            <CommentOutlined />
            <span>إضافة ملاحظة — {updateModal?.workerName}</span>
          </Space>
        }
        onCancel={closeAll}
        onOk={handleAddUpdate}
        confirmLoading={isAddingUpdate}
        okText="إضافة"
        cancelText="إلغاء"
        width={440}
        destroyOnHidden
      >
        <Form form={updateForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="updateDate" label="تاريخ التحديث" rules={[{ required: true, message: 'مطلوب' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="الملاحظة" rules={[{ required: true, message: 'مطلوب' }]}>
            <TextArea rows={4} placeholder="أدخل الملاحظة..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Exit & Re-Entry Modal ── */}
      <Modal
        open={!!exitModal}
        title={
          <Space>
            <HomeOutlined style={{ color: '#52c41a' }} />
            <span>تسجيل خروج وعودة — {exitModal?.workerName}</span>
          </Space>
        }
        onCancel={closeAll}
        onOk={handleExitReEntry}
        confirmLoading={isExiting}
        okText="تسجيل الخروج"
        cancelText="إلغاء"
        width={440}
        destroyOnHidden
      >
        <Form form={exitForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="exitDate" label="تاريخ الخروج" rules={[{ required: true, message: 'مطلوب' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="سبب الخروج">
            <TextArea rows={3} placeholder="مثال: الذهاب إلى المستشفى" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
