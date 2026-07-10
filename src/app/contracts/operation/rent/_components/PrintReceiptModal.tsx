/**
 * Print receipt preview modal.
 * Renders the data returned by GET /print-receipt-form on screen, then prints a
 * dedicated print window (not the whole app page) via the Print button.
 */
'use client';

import React from 'react';
import { Modal, Button, Empty, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ContractPrintReceiptData } from '@/types/api.types';
import { toReceiptSections, printReceipt } from './print-receipt';
import styles from '../RentContracts.module.css';

interface Props {
  open: boolean;
  isRtl: boolean;
  data: ContractPrintReceiptData | null;
  /** Loading the print data from the API */
  loading: boolean;
  /** Header label (contract number) */
  title: string;
  onClose: () => void;
}

export default function PrintReceiptModal({ open, isRtl, data, loading, title, onClose }: Props) {
  const sections = toReceiptSections(data, isRtl);

  const handlePrint = () => {
    const ok = printReceipt(data, isRtl, title);
    if (!ok) {
      message.warning(
        isRtl
          ? 'تم حظر نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.'
          : 'The print window was blocked. Please allow pop-ups.'
      );
    }
  };

  return (
    <Modal
      title={
        <span>
          <PrinterOutlined style={{ marginInlineEnd: 8 }} />
          {isRtl ? 'معاينة الإيصال' : 'Receipt Preview'} — {title}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {isRtl ? 'إغلاق' : 'Close'}
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          disabled={loading || sections.length === 0}
        >
          {isRtl ? 'طباعة' : 'Print'}
        </Button>,
      ]}
      width={640}
      destroyOnHidden
    >
      {loading ? (
        <p style={{ textAlign: 'center', padding: 24 }}>
          {isRtl ? 'جاري تحميل بيانات الطباعة...' : 'Loading print data...'}
        </p>
      ) : sections.length === 0 ? (
        <Empty description={isRtl ? 'لا توجد بيانات للطباعة' : 'No data to print'} />
      ) : (
        <div dir={isRtl ? 'rtl' : 'ltr'}>
          {sections.map((s) => (
            <div key={s.title} className={styles.modalSection} style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#003366' }}>{s.title}</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {s.rows.map((r, i) => (
                    <tr key={i}>
                      <th
                        style={{
                          textAlign: isRtl ? 'right' : 'left',
                          padding: '6px 10px',
                          color: '#555',
                          fontWeight: 600,
                          width: '40%',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        {r.label}
                      </th>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
