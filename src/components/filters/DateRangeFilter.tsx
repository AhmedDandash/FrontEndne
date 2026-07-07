'use client';

import { DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export interface DateRangeFilterProps {
  /** ISO date strings [from, to]. */
  value?: [string | undefined, string | undefined];
  onChange: (range: [string | undefined, string | undefined]) => void;
  placeholder?: [string, string];
  style?: React.CSSProperties;
}

/**
 * Date-range filter emitting ISO date strings. `to` is normalised to end-of-day
 * so an inclusive range (created on the `to` date) is matched. Guards against
 * from > to by letting AntD's RangePicker enforce ordering.
 */
export default function DateRangeFilter({
  value,
  onChange,
  placeholder,
  style,
}: DateRangeFilterProps) {
  const parsed: [Dayjs | null, Dayjs | null] = [
    value?.[0] ? dayjs(value[0]) : null,
    value?.[1] ? dayjs(value[1]) : null,
  ];

  return (
    <RangePicker
      value={parsed}
      style={style}
      placeholder={placeholder ?? ['من تاريخ', 'إلى تاريخ']}
      onChange={(range) => {
        if (!range || (!range[0] && !range[1])) {
          onChange([undefined, undefined]);
          return;
        }
        const from = range[0] ? range[0].startOf('day').toISOString() : undefined;
        const to = range[1] ? range[1].endOf('day').toISOString() : undefined;
        onChange([from, to]);
      }}
    />
  );
}
