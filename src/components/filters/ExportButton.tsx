'use client';

import { useState } from 'react';
import { Button, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import { exportBlob } from '@/lib/api/download';
import { buildListParams } from '@/lib/api/buildListParams';
import { getApiErrorMessage } from '@/utils/api-error';

export interface ExportButtonProps {
  /** The `/export` endpoint path. */
  endpoint: string;
  /** The SAME filter object used by the list, so the export mirrors the view. */
  filters?: object;
  /** Fallback download filename if the server sends no Content-Disposition. */
  fileName: string;
  /** Pagination param name — matched to the module ('pageNumber' | 'page'). */
  pageParam?: 'pageNumber' | 'page';
  label?: string;
  disabled?: boolean;
}

/**
 * Downloads an .xlsx from a `/export` endpoint using the current list filters.
 * Pagination params are dropped for export (server returns all filtered rows,
 * capped at 50k). Shows a loading state and surfaces backend errors.
 */
export default function ExportButton({
  endpoint,
  filters,
  fileName,
  pageParam = 'pageNumber',
  label = 'تصدير Excel',
  disabled,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Strip pagination (any casing) — export returns every filtered row (max 50k).
      const rest = Object.fromEntries(
        Object.entries((filters ?? {}) as Record<string, unknown>).filter(
          ([k]) => !/^(page|pagenumber|pagesize)$/i.test(k)
        )
      );
      const params = buildListParams(rest, { pageParam });
      await exportBlob(endpoint, params, fileName);
      message.success('تم تصدير الملف بنجاح');
    } catch (err) {
      message.error(getApiErrorMessage(err, 'فشل تصدير الملف / Export failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      icon={<FileExcelOutlined />}
      loading={loading}
      disabled={disabled}
      onClick={handleExport}
      style={{ color: '#52c41a', borderColor: '#52c41a' }}
    >
      {label}
    </Button>
  );
}
