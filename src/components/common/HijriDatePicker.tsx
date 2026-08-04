/**
 * DOB-style date picker that displays the Hijri (Umm al-Qura) date — both in
 * the field text and as the primary number in the calendar grid — while the
 * underlying value stays Gregorian ISO `YYYY-MM-DD`, exactly like the plain
 * `<Input type="date">` it replaces. String-in/string-out so it drops into a
 * `Form.Item` with no payload changes at the call site.
 */
'use client';

import { DatePicker } from 'antd';
import type { SelectProps } from 'antd/es/select';
import dayjs, { type Dayjs } from 'dayjs';
import { useAuthStore } from '@/store/authStore';
import { formatHijri, toHijriParts } from '@/utils/hijri';

export interface HijriDatePickerProps {
  /** Forwarded so a Form.Item's <label htmlFor> resolves to the actual control. */
  id?: string;
  /** ISO date string, e.g. "1990-05-12". Gregorian — only the display is Hijri. */
  value?: string | null;
  onChange?: (value?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
  className?: string;
  size?: SelectProps['size'];
}

export default function HijriDatePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  allowClear = true,
  style,
  className,
  size,
}: HijriDatePickerProps) {
  const language = useAuthStore((state) => state.language);
  const lang: 'ar' | 'en' = language === 'ar' ? 'ar' : 'en';
  const parsed: Dayjs | null = value ? dayjs(value.slice(0, 10)) : null;

  return (
    <DatePicker
      id={id}
      value={parsed}
      onChange={(v) => onChange?.(v ? v.format('YYYY-MM-DD') : undefined)}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      style={style ?? { width: '100%' }}
      className={className}
      size={size}
      format={(v) => `${formatHijri(v.toDate(), lang)} (${v.format('YYYY-MM-DD')})`}
      cellRender={(current, info) => {
        if (info.type !== 'date' || !dayjs.isDayjs(current)) return info.originNode;
        const parts = toHijriParts(current.toDate());
        if (!parts) return info.originNode;
        return (
          <div
            className="ant-picker-cell-inner"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15 }}
          >
            <span>{parts.day}</span>
            <span style={{ fontSize: 10, opacity: 0.55 }}>{current.date()}</span>
          </div>
        );
      }}
    />
  );
}
