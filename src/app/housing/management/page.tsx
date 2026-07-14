'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Tooltip,
  Popconfirm,
  Badge,
  Progress,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useHousings } from '@/hooks/api/useHousing';
import { useOpenIdParam } from '@/hooks/useOpenIdParam';
import fullPage from '@/styles/fullPageModal.module.css';
import type { Housing, HousingDto } from '@/types/housing.types';
import styles from './HousingManagement.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

type Lang = 'ar' | 'en';

const t = (ar: string, en: string, lang: Lang) => (lang === 'ar' ? ar : en);

export default function HousingManagementPage() {
  const lang: Lang = 'ar';

  const { housings, isLoading, createHousing, updateHousing, toggleActive, deleteHousing,
    isCreating, isUpdating } = useHousings();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Housing | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm<HousingDto>();

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
          <Text strong>{record.name}</Text>
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

      {/* Main Card */}
      <Card
        title={
          <Space>
            <HomeOutlined />
            <span>{t('إدارة السكنات', 'Housing Management', lang)}</span>
          </Space>
        }
        extra={
          <Space>
            <Input.Search
              placeholder={t('بحث...', 'Search...', lang)}
              allowClear
              style={{ width: 220 }}
              onSearch={setSearch}
              onChange={(e) => !e.target.value && setSearch('')}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t('إضافة سكن', 'Add Housing', lang)}
            </Button>
          </Space>
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
