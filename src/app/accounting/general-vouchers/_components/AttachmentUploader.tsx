'use client';

import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { t as tr } from '../_lib/generalVoucherDisplay';

/** Extensions the backend accepts — rejecting others here avoids a round trip. */
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
];

const MAX_SIZE_MB = 10;

export interface AttachmentUploaderProps {
  value?: UploadFile[];
  onChange?: (files: UploadFile[]) => void;
  isAr: boolean;
  disabled?: boolean;
}

/**
 * Drag & drop attachment picker for a voucher.
 *
 * Holds the file locally and never uploads on its own — the attachment
 * endpoint is `POST /{id}/attachment`, so there is no voucher id to upload
 * against until after the voucher is created. The create flow therefore
 * saves the voucher first, then posts the file. `beforeUpload` returning
 * false is what suppresses antd's built-in auto-upload.
 */
export default function AttachmentUploader({
  value = [],
  onChange,
  isAr,
  disabled,
}: AttachmentUploaderProps) {
  const t = (ar: string, en: string) => tr(isAr, ar, en);

  const beforeUpload = (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      message.error(
        t(
          `نوع الملف غير مدعوم. المسموح: ${ALLOWED_EXTENSIONS.join(', ')}`,
          `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
        )
      );
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      message.error(
        t(`يجب أن يكون حجم الملف أقل من ${MAX_SIZE_MB} ميجابايت`, `File must be smaller than ${MAX_SIZE_MB}MB`)
      );
      return Upload.LIST_IGNORE;
    }
    // Defer the actual upload to the create/update flow (see doc comment).
    return false;
  };

  return (
    <Upload.Dragger
      name="file"
      maxCount={1}
      disabled={disabled}
      fileList={value}
      beforeUpload={beforeUpload}
      onChange={(info) => onChange?.(info.fileList.slice(-1))}
      onRemove={() => onChange?.([])}
      accept={ALLOWED_EXTENSIONS.join(',')}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        {t('اسحب الملف هنا أو اضغط للاختيار', 'Drag a file here or click to select')}
      </p>
      <p className="ant-upload-hint" style={{ fontSize: 12 }}>
        {t(
          `الصيغ المدعومة: ${ALLOWED_EXTENSIONS.join(', ')} — بحد أقصى ${MAX_SIZE_MB} ميجابايت`,
          `Supported: ${ALLOWED_EXTENSIONS.join(', ')} — max ${MAX_SIZE_MB}MB`
        )}
      </p>
    </Upload.Dragger>
  );
}
