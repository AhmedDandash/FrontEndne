'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Tooltip,
  Popconfirm,
  Badge,
  Progress,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined,
  TeamOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useHousings } from '@/hooks/api/useHousing';
import { useOpenIdParam } from '@/hooks/useOpenIdParam';
import { AdvancedFilterPanel, TextMatchFilter, type TextMatchValue } from '@/components/filters';
import fullPage from '@/styles/fullPageModal.module.css';
import type { Housing, HousingDto } from '@/types/housing.types';
import styles from './HousingManagement.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

type Lang = 'ar' | 'en';

const t = (ar: string, en: string, lang: Lang) => (lang === 'ar' ? ar : en);

export default function HousingManagementPage() {
  const lang: Lang = 'ar';
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Housing | null>(null);
  const [search, setSearch] = useState('');
  // Server-side filters (backend /api/Housing/GetAll supports IsActive and
  // HasAvailableSlots as query params — `name` stays client-side below since
  // the existing search box also matches on address, which the server-side
  // `Name` filter cannot do).
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [hasAvailableSlotsFilter, setHasAvailableSlotsFilter] = useState<boolean | undefined>(undefined);
  // Numeric range filters (backend /api/Housing/GetAll supports these — see
  // FILTER_AUDIT gap list). Min/max pairs, all optional.
  const [capacityMin, setCapacityMin] = useState<number | undefined>(undefined);
  const [capacityMax, setCapacityMax] = useState<number | undefined>(undefined);
  const [workerHousingCostMin, setWorkerHousingCostMin] = useState<number | undefined>(undefined);
  const [workerHousingCostMax, setWorkerHousingCostMax] = useState<number | undefined>(undefined);
  const [housingOperationPriceMin, setHousingOperationPriceMin] = useState<number | undefined>(undefined);
  const [housingOperationPriceMax, setHousingOperationPriceMax] = useState<number | undefined>(undefined);
  // Text + match-mode filters (backend /api/Housing/GetAll supports Name/NameMatch,
  // Address/AddressMatch, Notes/NotesMatch — none had any filter UI before).
  const [nameFilter, setNameFilter] = useState<TextMatchValue>({});
  const [addressFilter, setAddressFilter] = useState<TextMatchValue>({});
  const [notesFilter, setNotesFilter] = useState<TextMatchValue>({});
  const [form] = Form.useForm<HousingDto>();

  const { housings, isLoading, createHousing, updateHousing, toggleActive, deleteHousing,
    isCreating, isUpdating } = useHousings({
    name: nameFilter.text,
    nameMatch: nameFilter.mode,
    address: addressFilter.text,
    addressMatch: addressFilter.mode,
    notes: notesFilter.text,
    notesMatch: notesFilter.mode,
    isActive: isActiveFilter,
    hasAvailableSlots: hasAvailableSlotsFilter,
    capacityMin,
    capacityMax,
    workerHousingCostMin,
    workerHousingCostMax,
    housingOperationPriceMin,
    housingOperationPriceMax,
  });

  const openDetail = (id: string) => router.push(`/housing/management/${id}`);

  const filtered = useMemo(() => {
    if (!housings) return [];
    const q = search.trim().toLowerCase();
    if (!q) return housings;
    return housings.filter(
      (h) =>
        h.name?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q)
    );
  }, [housings, search]);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (item: Housing) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      address: item.address ?? undefined,
      capacity: item.capacity,
      notes: item.notes ?? undefined,
      workerHousingCost: item.workerHousingCost ?? undefined,
      housingOperationPrice: item.housingOperationPrice ?? undefined,
    });
    setModalOpen(true);
  };

  // Journal Entry "Go to source" deep-link: ?openId=<housingId> opens that
  // housing record (edit modal) once the list has loaded.
  useOpenIdParam((id) => {
    const match = (housings ?? []).find((h) => String(h.id) === id);
    if (match) openEdit(match);
  }, !!housings && housings.length > 0);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingItem) {
      await updateHousing({ id: editingItem.id, data: values });
    } else {
      await createHousing(values);
    }
    setModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<Housing> = [
    {
      title: t('السكن', 'Housing', lang),
      key: 'name',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <a onClick={() => openDetail(record.id)}>
            <Text strong>{record.name}</Text>
          </a>
          {record.address && <Text type="secondary" className={styles.addressText}>{record.address}</Text>}
        </Space>
      ),
    },
    {
      title: t('الإشغال', 'Occupancy', lang),
      key: 'occupancy',
      width: 200,
      render: (_, record) => {
        const pct = record.capacity > 0 ? Math.round((record.currentOccupancy / record.capacity) * 100) : 0;
        const color = pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : '#52c41a';
        return (
          <Space orientation="vertical" size={2} style={{ width: '100%' }}>
            <Space>
              <TeamOutlined />
              <Text>
                {record.currentOccupancy} / {record.capacity}
              </Text>
              <Text type="secondary">({record.availableSlots} {t('متاح', 'available', lang)})</Text>
            </Space>
            <Progress percent={pct} strokeColor={color} showInfo={false} size="small" />
          </Space>
        );
      },
    },
    {
      title: t('الحالة', 'Status', lang),
      dataIndex: 'isActive',
      width: 120,
      render: (val, record) => (
        <Switch
          checked={val}
          checkedChildren={t('مفعّل', 'Active', lang)}
          unCheckedChildren={t('معطّل', 'Inactive', lang)}
          onChange={() => toggleActive(record.id)}
        />
      ),
    },
    {
      title: t('الإجراءات', 'Actions', lang),
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('عرض', 'View', lang)}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('تعديل', 'Edit', lang)}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t('حذف السكن', 'Delete housing', lang)}
            description={t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?', lang)}
            onConfirm={() => deleteHousing(record.id)}
            okText={t('حذف', 'Delete', lang)}
            cancelText={t('إلغاء', 'Cancel', lang)}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t('حذف', 'Delete', lang)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalCapacity = (housings ?? []).reduce((s, h) => s + (h.capacity || 0), 0);
  const totalOccupied = (housings ?? []).reduce((s, h) => s + (h.currentOccupancy || 0), 0);
  const activeCount = (housings ?? []).filter((h) => h.isActive).length;

  return (
    <div className={styles.page}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <Card className={styles.statCard} size="small">
          <Space>
            <HomeOutlined className={styles.statIcon} />
            <Space orientation="vertical" size={0}>
              <Text type="secondary">{t('إجمالي السكنات', 'Total Units', lang)}</Text>
              <Title level={4} style={{ margin: 0 }}>{(housings ?? []).length}</Title>
            </Space>
          </Space>
        </Card>
        <Card className={styles.statCard} size="small">
          <Space>
            <Badge color="green" />
            <Space orientation="vertical" size={0}>
              <Text type="secondary">{t('مفعّلة', 'Active', lang)}</Text>
              <Title level={4} style={{ margin: 0 }}>{activeCount}</Title>
            </Space>
          </Space>
        </Card>
        <Card className={styles.statCard} size="small">
          <Space>
            <TeamOutlined className={styles.statIcon} />
            <Space orientation="vertical" size={0}>
              <Text type="secondary">{t('إجمالي الطاقة', 'Total Capacity', lang)}</Text>
              <Title level={4} style={{ margin: 0 }}>
                {totalOccupied} / {totalCapacity}
              </Title>
            </Space>
          </Space>
        </Card>
      </div>

      <AdvancedFilterPanel
        activeCount={[
          isActiveFilter !== undefined,
          hasAvailableSlotsFilter !== undefined,
          capacityMin !== undefined,
          capacityMax !== undefined,
          workerHousingCostMin !== undefined,
          workerHousingCostMax !== undefined,
          housingOperationPriceMin !== undefined,
          housingOperationPriceMax !== undefined,
          Boolean(nameFilter.text),
          Boolean(addressFilter.text),
          Boolean(notesFilter.text),
        ].filter(Boolean).length}
        onClear={() => {
          setIsActiveFilter(undefined);
          setHasAvailableSlotsFilter(undefined);
          setCapacityMin(undefined);
          setCapacityMax(undefined);
          setWorkerHousingCostMin(undefined);
          setWorkerHousingCostMax(undefined);
          setHousingOperationPriceMin(undefined);
          setHousingOperationPriceMax(undefined);
          setNameFilter({});
          setAddressFilter({});
          setNotesFilter({});
        }}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('بحث...', 'Search...', lang)}
              style={{ width: 220 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div>
              <label className={styles.filterLabel}>{t('الحالة', 'Status', lang)}</label>
              <Select
                allowClear
                size="large"
                placeholder={t('الحالة', 'Status', lang)}
                style={{ width: 150 }}
                value={isActiveFilter === undefined ? undefined : String(isActiveFilter)}
                onChange={(v) => setIsActiveFilter(v === undefined ? undefined : v === 'true')}
                options={[
                  { value: 'true', label: t('مفعّل', 'Active', lang) },
                  { value: 'false', label: t('معطّل', 'Inactive', lang) },
                ]}
              />
            </div>
            <div>
              <label className={styles.filterLabel}>{t('الإتاحة', 'Availability', lang)}</label>
              <Select
                allowClear
                size="large"
                placeholder={t('الإتاحة', 'Availability', lang)}
                style={{ width: 170 }}
                value={hasAvailableSlotsFilter === undefined ? undefined : String(hasAvailableSlotsFilter)}
                onChange={(v) => setHasAvailableSlotsFilter(v === undefined ? undefined : v === 'true')}
                options={[
                  { value: 'true', label: t('يوجد مقاعد شاغرة', 'Has available slots', lang) },
                ]}
              />
            </div>
          </>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('Ø§Ù„Ø§Ø³Ù…', 'Name', lang)}</label>
            <TextMatchFilter
              lang={lang}
              value={nameFilter}
              onChange={setNameFilter}
              placeholder={t('Ø§Ù„Ø§Ø³Ù…', 'Name', lang)}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('Ø§Ù„Ø¹Ù†ÙˆØ§Ù†', 'Address', lang)}</label>
            <TextMatchFilter
              lang={lang}
              value={addressFilter}
              onChange={setAddressFilter}
              placeholder={t('Ø§Ù„Ø¹Ù†ÙˆØ§Ù†', 'Address', lang)}
            />
          </Col>
          <Col xs={24} md={8}>
            <label className={styles.filterLabel}>{t('Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª', 'Notes', lang)}</label>
            <TextMatchFilter
              lang={lang}
              value={notesFilter}
              onChange={setNotesFilter}
              placeholder={t('Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª', 'Notes', lang)}
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={styles.filterLabel}>{t('أقل طاقة استيعابية', 'Min Capacity', lang)}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أقل طاقة استيعابية', 'Min Capacity', lang)}
              value={capacityMin}
              onChange={(v) => setCapacityMin(v ?? undefined)}
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={styles.filterLabel}>{t('أعلى طاقة استيعابية', 'Max Capacity', lang)}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أعلى طاقة استيعابية', 'Max Capacity', lang)}
              value={capacityMax}
              onChange={(v) => setCapacityMax(v ?? undefined)}
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={styles.filterLabel}>{t('أقل تكلفة إيواء العامل', 'Min Worker Housing Cost', lang)}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أقل تكلفة إيواء العامل', 'Min Worker Housing Cost', lang)}
              value={workerHousingCostMin}
              onChange={(v) => setWorkerHousingCostMin(v ?? undefined)}
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={styles.filterLabel}>{t('أعلى تكلفة إيواء العامل', 'Max Worker Housing Cost', lang)}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أعلى تكلفة إيواء العامل', 'Max Worker Housing Cost', lang)}
              value={workerHousingCostMax}
              onChange={(v) => setWorkerHousingCostMax(v ?? undefined)}
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={styles.filterLabel}>{t('أقل سعر تشغيل السكن', 'Min Operation Price', lang)}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أقل سعر تشغيل السكن', 'Min Operation Price', lang)}
              value={housingOperationPriceMin}
              onChange={(v) => setHousingOperationPriceMin(v ?? undefined)}
            />
          </Col>
          <Col xs={24} md={4}>
            <label className={styles.filterLabel}>{t('أعلى سعر تشغيل السكن', 'Max Operation Price', lang)}</label>
            <InputNumber
              size="large"
              min={0}
              style={{ width: '100%' }}
              placeholder={t('أعلى سعر تشغيل السكن', 'Max Operation Price', lang)}
              value={housingOperationPriceMax}
              onChange={(v) => setHousingOperationPriceMax(v ?? undefined)}
            />
          </Col>
        </Row>
      </AdvancedFilterPanel>

      {/* Main Card */}
      <Card
        title={
          <Space>
            <HomeOutlined />
            <span>{t('إدارة السكنات', 'Housing Management', lang)}</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('إضافة سكن', 'Add Housing', lang)}
          </Button>
        }
      >
        <Table<Housing>
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          locale={{
            emptyText: t('لا توجد سكنات', 'No housing units found', lang),
          }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={
          editingItem
            ? t('تعديل السكن', 'Edit Housing Unit', lang)
            : t('إضافة سكن جديد', 'Add New Housing Unit', lang)
        }
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        okText={editingItem ? t('حفظ', 'Save', lang) : t('إضافة', 'Add', lang)}
        cancelText={t('إلغاء', 'Cancel', lang)}
        // Opening an existing housing unit (e.g. from a journal entry) fills the
        // page; the "add new" form stays a compact dialog.
        width={editingItem ? '100%' : 560}
        style={editingItem ? { top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 } : undefined}
        wrapClassName={editingItem ? fullPage.modalWrap : undefined}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={t('اسم السكن', 'Housing Name', lang)}
            rules={[{ required: true, message: t('مطلوب', 'Required', lang) }]}
          >
            <Input placeholder={t('مثال: السكن الرئيسي', 'e.g. Main Housing', lang)} />
          </Form.Item>

          <Form.Item name="address" label={t('العنوان', 'Address', lang)}>
            <Input placeholder={t('العنوان التفصيلي', 'Detailed address', lang)} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item
              name="capacity"
              label={t('الطاقة الاستيعابية', 'Capacity', lang)}
              rules={[{ required: true, message: t('مطلوب', 'Required', lang) }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="workerHousingCost" label={t('تكلفة إيواء العامل', 'Worker Housing Cost', lang)}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="housingOperationPrice" label={t('سعر تشغيل السكن', 'Operation Price', lang)}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="notes" label={t('ملاحظات', 'Notes', lang)}>
            <TextArea rows={3} placeholder={t('ملاحظات إضافية', 'Additional notes', lang)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
