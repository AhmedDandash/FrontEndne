'use client';

import { Drawer, Spin, Tag, Table, Button, Space, Tooltip, Popconfirm, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import {
  useJournalEntryDetail,
  useJournalEntryMutations,
} from '@/hooks/api/useJournalEntries';
import { useClosedYears } from '@/hooks/api/usePeriodClosing';
import { useAuthStore } from '@/store/authStore';
import {
  getStatusLabel,
  getSourceLabel,
  getReferenceTypeLabel,
  JE_STATUS,
  type JournalEntryLineDetail,
} from '@/types/journal-entry.types';
import { GoToSourceButton } from './GoToSourceButton';
import styles from '../JournalEntries.module.css';

interface EntryDetailDrawerProps {
  open: boolean;
  entryId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}

export function EntryDetailDrawer({ open, entryId, onClose, onEdit }: EntryDetailDrawerProps) {
  const t = (ar: string, en: string) => ar + ' / ' + en;
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';

  const { data: entry, isLoading } = useJournalEntryDetail(open ? entryId : null);
  const { deleteEntry, postEntry, unpostEntry, isDeleting, isPosting, isUnposting } =
    useJournalEntryMutations();
  const { isYearClosed } = useClosedYears();

  const isDraft = entry?.status === JE_STATUS.Draft;
  // Posting/unposting is rejected by the backend inside a closed fiscal year.
  const yearClosed = isYearClosed(entry?.date);

  const lineColumns: ColumnsType<JournalEntryLineDetail> = [
    {
      title: t('الحساب', 'Account'),
      key: 'account',
      render: (_, l) => (
        <div>
          <span className={styles.lineAccountCode}>{l.accountCode}</span>
          <span className={styles.lineAccountName}>{l.accountName}</span>
          {l.description && <span className={styles.lineDescription}>{l.description}</span>}
        </div>
      ),
    },
    {
      title: t('مدين', 'Debit'),
      dataIndex: 'debit',
      key: 'debit',
      width: 120,
      align: 'right',
      render: (v: number) =>
        v ? <span className={styles.amount}>{v.toLocaleString()}</span> : <span className={styles.muted}>—</span>,
    },
    {
      title: t('دائن', 'Credit'),
      dataIndex: 'credit',
      key: 'credit',
      width: 120,
      align: 'right',
      render: (v: number) =>
        v ? <span className={styles.amount}>{v.toLocaleString()}</span> : <span className={styles.muted}>—</span>,
    },
  ];

  const fact = (label: string, value: React.ReactNode) => (
    <div className={styles.factItem}>
      <div className={styles.factLabel}>{label}</div>
      <div className={styles.factValue}>{value ?? '—'}</div>
    </div>
  );

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteEntry(entry.id);
      onClose();
    } catch {
      // The mutation's own onError already surfaced a toast; keep the drawer
      // open (e.g. delete-blocked-because-posted) and swallow the rejection
      // so it doesn't bubble as an unhandled promise rejection.
    }
  };

  const handlePost = async () => {
    if (!entry) return;
    try {
      await postEntry(entry.id);
    } catch {
      // onError toast already shown; swallow so it doesn't bubble.
    }
  };

  const handleUnpost = async () => {
    if (!entry) return;
    try {
      await unpostEntry(entry.id);
    } catch {
      // onError toast already shown; swallow so it doesn't bubble.
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={620}
      destroyOnHidden
      title={
        <Space>
          {t('تفاصيل القيد', 'Journal Entry')}
          {entry && <span className={styles.entryNumber}>{entry.entryNumber}</span>}
        </Space>
      }
      footer={
        entry ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <Space wrap>
              <GoToSourceButton
                entry={{
                  source: entry.source,
                  referenceType: entry.referenceType,
                  sourceId: entry.sourceId,
                  customerId: entry.customerId,
                  agentId: entry.agentId,
                  workerId: entry.workerId,
                  employeeId: entry.employeeId,
                }}
                isAr={isAr}
              />
              {isDraft ? (
                <Tooltip
                  title={
                    yearClosed
                      ? t('السنة المالية مغلقة', 'Fiscal year is closed')
                      : t('اعتماد القيد', 'Post to ledger')
                  }
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={isPosting}
                    onClick={handlePost}
                    disabled={yearClosed}
                  >
                    {t('اعتماد', 'Post')}
                  </Button>
                </Tooltip>
              ) : (
                <Popconfirm
                  title={t('إلغاء اعتماد القيد؟', 'Unpost this entry?')}
                  description={t(
                    'سيتم عكس الحركات وإعادة القيد إلى مسودة.',
                    'Ledger movements will be reversed and the entry returns to Draft.'
                  )}
                  okText={t('إلغاء الاعتماد', 'Unpost')}
                  cancelText={t('رجوع', 'Back')}
                  okButtonProps={{ loading: isUnposting }}
                  onConfirm={handleUnpost}
                  disabled={yearClosed}
                >
                  <Tooltip
                    title={yearClosed ? t('السنة المالية مغلقة', 'Fiscal year is closed') : ''}
                  >
                    <Button icon={<RollbackOutlined />} loading={isUnposting} disabled={yearClosed}>
                      {t('إلغاء الاعتماد', 'Unpost')}
                    </Button>
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>
            <Space>
              {isDraft && (
                <>
                  <Button icon={<EditOutlined />} onClick={() => onEdit(entry.id)}>
                    {t('تعديل', 'Edit')}
                  </Button>
                  <Popconfirm
                    title={t('حذف القيد؟', 'Delete this entry?')}
                    description={t(
                      'سيتم حذف القيد نهائيًا. لا يمكن التراجع.',
                      'This draft entry will be permanently deleted.'
                    )}
                    okText={t('حذف', 'Delete')}
                    cancelText={t('إلغاء', 'Cancel')}
                    okButtonProps={{ danger: true, loading: isDeleting }}
                    onConfirm={handleDelete}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      {t('حذف', 'Delete')}
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>
        ) : null
      }
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : !entry ? (
        <Empty description={t('لا توجد بيانات', 'No data')} />
      ) : (
        <>
          <div className={styles.detailFacts}>
            {fact(
              t('الحالة', 'Status'),
              entry.status === JE_STATUS.Posted ? (
                <Tag color="success">{getStatusLabel(JE_STATUS.Posted, isAr)}</Tag>
              ) : (
                <Tag color="warning">{getStatusLabel(entry.status, isAr)}</Tag>
              )
            )}
            {fact(t('المصدر', 'Source'), getSourceLabel(entry.source, isAr))}
            {fact(t('نوع المرجع', 'Reference'), getReferenceTypeLabel(entry.referenceType, isAr))}
            {entry.sourceContractNumber &&
              fact(t('رقم العقد', 'Contract No.'), `#${entry.sourceContractNumber}`)}
            {fact(t('التاريخ', 'Date'), entry.date ? new Date(entry.date).toLocaleDateString() : '—')}
            {fact(
              t('التوازن', 'Balanced'),
              entry.isBalanced ? (
                <span style={{ color: '#389e0d' }}>
                  <CheckCircleFilled /> {t('متوازن', 'Yes')}
                </span>
              ) : (
                <span style={{ color: '#cf1322' }}>
                  <CloseCircleFilled /> {t('غير متوازن', 'No')}
                </span>
              )
            )}
            {entry.createdBy && fact(t('أنشئ بواسطة', 'Created by'), entry.createdBy)}
            {entry.createdDate &&
              fact(t('تاريخ الإنشاء', 'Created on'), new Date(entry.createdDate).toLocaleString())}
          </div>

          <div className={styles.factItem} style={{ marginBlockEnd: 16 }}>
            <div className={styles.factLabel}>{t('الوصف', 'Description')}</div>
            <div className={styles.factValue}>{entry.description || '—'}</div>
          </div>

          <Table<JournalEntryLineDetail>
            rowKey={(_, idx) => String(idx)}
            columns={lineColumns}
            dataSource={entry.lines}
            pagination={false}
            size="small"
            bordered
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} align="center">
                    <strong>{t('الإجمالي', 'Total')}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong className={styles.amount}>{entry.totalDebit.toLocaleString()}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong className={styles.amount}>{entry.totalCredit.toLocaleString()}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </>
      )}
    </Drawer>
  );
}
