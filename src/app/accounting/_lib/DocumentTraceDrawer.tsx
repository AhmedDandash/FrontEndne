'use client';

import { Drawer, Descriptions, Typography, Table, Empty, Divider, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/store/authStore';
import type {
  AccountingDocumentTrace,
  AccountingDocumentTraceJournalLine,
} from '@/types/api.types';
import {
  t as tr,
  renderJournalStatus,
  documentTypeLabel,
} from './accountingDocDisplay';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  trace?: AccountingDocumentTrace;
  loading?: boolean;
}

/**
 * Unified audit-trail drawer for every accounting document.
 *
 * Renders the real trace shape returned by `GET .../{id}/trace`:
 *   { documentType, document{ journalStatus, ... }, journalEntry{ status, lines[] }, ledgerEntries[] }
 *
 * The journal entry lines are ALWAYS present once a journal is linked, so we
 * surface them directly. Ledger movements only appear after the journal is
 * posted, so that section degrades gracefully to an empty state.
 */
export function DocumentTraceDrawer({ open, onClose, trace, loading }: Props) {
  const language = useAuthStore((s) => s.language);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  const journal = trace?.journalEntry ?? null;
  const document = trace?.document ?? null;
  const ledger = Array.isArray(trace?.ledgerEntries) ? (trace!.ledgerEntries as any[]) : [];

  const lineColumns: ColumnsType<AccountingDocumentTraceJournalLine> = [
    {
      title: t('الحساب', 'Account'),
      key: 'account',
      render: (_, l) => (
        <span>
          <Text code>{l.accountCode || '—'}</Text>{' '}
          <span style={{ color: '#6b7280', fontSize: 12 }}>{l.accountName || ''}</span>
        </span>
      ),
    },
    {
      title: t('مدين', 'Debit'),
      dataIndex: 'debit',
      key: 'debit',
      align: 'right',
      width: 100,
      render: (v: number) => (v ? v.toLocaleString() : <span style={{ color: '#d1d5db' }}>—</span>),
    },
    {
      title: t('دائن', 'Credit'),
      dataIndex: 'credit',
      key: 'credit',
      align: 'right',
      width: 100,
      render: (v: number) => (v ? v.toLocaleString() : <span style={{ color: '#d1d5db' }}>—</span>),
    },
  ];

  return (
    <Drawer
      title={t('سلسلة تتبع المستند', 'Document Audit Trail')}
      open={open}
      onClose={onClose}
      width={600}
      loading={loading}
    >
      {trace ? (
        <>
          {/* ── Document summary ─────────────────────────────────── */}
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label={t('نوع المستند', 'Document Type')}>
              {documentTypeLabel(trace.documentType, isAr)}
            </Descriptions.Item>
            <Descriptions.Item label={t('رقم المستند', 'Document No.')}>
              {document?.documentNumber || '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('المبلغ', 'Amount')}>
              {document?.amount != null ? document.amount.toLocaleString() : '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('حالة القيد', 'Journal Status')}>
              {document?.journalEntryId
                ? renderJournalStatus(document?.journalStatus, isAr)
                : <Tag>{t('لم يُنشأ قيد', 'No journal')}</Tag>}
            </Descriptions.Item>
          </Descriptions>

          {/* ── Journal entry ────────────────────────────────────── */}
          <Divider titlePlacement="start" style={{ marginBlock: 20 }}>
            {t('القيد المحاسبي', 'Journal Entry')}
          </Divider>
          {journal ? (
            <>
              <Descriptions size="small" column={2} bordered style={{ marginBottom: 12 }}>
                <Descriptions.Item label={t('رقم القيد', 'Entry No.')}>
                  <Text code>{journal.entryNumber || '—'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('الحالة', 'Status')}>
                  {renderJournalStatus(journal.status, isAr)}
                </Descriptions.Item>
                {journal.description && (
                  <Descriptions.Item label={t('الوصف', 'Description')} span={2}>
                    {journal.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
              <Table<AccountingDocumentTraceJournalLine>
                rowKey={(line, index) => line.id ?? `line-${index}`}
                size="small"
                bordered
                pagination={false}
                columns={lineColumns}
                dataSource={journal.lines ?? []}
                summary={(rows) => {
                  const totalDebit = rows.reduce((s, r) => s + (r.debit || 0), 0);
                  const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>{t('الإجمالي', 'Total')}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong>{totalDebit.toLocaleString()}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong>{totalCredit.toLocaleString()}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('لم يتم إنشاء قيد محاسبي لهذا المستند', 'No journal entry linked to this document')}
            />
          )}

          {/* ── Ledger movements ─────────────────────────────────── */}
          <Divider titlePlacement="start" style={{ marginBlock: 20 }}>
            {t('حركات الأستاذ', 'Ledger Movements')}
          </Divider>
          {ledger.length > 0 ? (
            <Table
              rowKey={(r: any) => r.id || Math.random()}
              size="small"
              bordered
              pagination={false}
              dataSource={ledger}
              columns={[
                { title: t('الحساب', 'Account'), dataIndex: 'accountCode', key: 'accountCode', width: 90 },
                { title: t('مدين', 'Debit'), dataIndex: 'debit', key: 'debit', align: 'right', render: (v: number) => v?.toLocaleString() || '—' },
                { title: t('دائن', 'Credit'), dataIndex: 'credit', key: 'credit', align: 'right', render: (v: number) => v?.toLocaleString() || '—' },
              ]}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t(
                'تظهر حركات الأستاذ بعد اعتماد القيد المحاسبي',
                'Ledger movements appear after the journal entry is posted'
              )}
            />
          )}
        </>
      ) : (
        !loading && <Empty description={t('لا توجد بيانات', 'No data')} />
      )}
    </Drawer>
  );
}
