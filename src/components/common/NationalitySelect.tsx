/**
 * Shared nationality picker used across every worker/agent/employee/customer/
 * contract form. Appends an "Others" affordance to the bottom of the option
 * list (via `popupRender`, antd v6's current name for the old
 * `dropdownRender` prop — see `src/app/hr/custody-request/page.tsx` for the
 * codebase's one prior "add new" precedent, which this generalizes). Picking
 * "Others" expands an inline Arabic/English name form INSIDE the dropdown
 * popup — never a nested Modal — so the parent Form/Modal/wizard is never
 * touched and the user's in-progress work is never lost.
 */
'use client';

import { useMemo, useRef, useState } from 'react';
import { Select, Spin, Divider, Space, Input, Button } from 'antd';
import type { SelectProps, RefSelectProps } from 'antd/es/select';
import { PlusOutlined } from '@ant-design/icons';
import { useNationalityOptions } from '@/hooks/api/useNationalityOptions';
import { useCreateNationality } from '@/hooks/api/useNationalities';
import { getApiErrorMessage } from '@/utils/api-error';
import type { Nationality } from '@/types/api.types';

const defaultGetOptionValue = (n: Nationality) => String(n.id);

const TEXT = {
  ar: {
    placeholder: 'اختر الجنسية',
    others: 'أخرى — إضافة جنسية جديدة',
    nameAr: 'الاسم بالعربي',
    nameEn: 'الاسم بالإنجليزي',
    save: 'حفظ',
    cancel: 'إلغاء',
    required: 'الرجاء تعبئة الاسم بالعربي والإنجليزي',
    duplicate: 'هذه الجنسية موجودة بالفعل',
    failed: 'فشل إضافة الجنسية',
    common: 'الأكثر استخداماً',
    allNationalities: 'كل الجنسيات',
  },
  en: {
    placeholder: 'Select nationality',
    others: 'Others — add new nationality',
    nameAr: 'Name (Arabic)',
    nameEn: 'Name (English)',
    save: 'Save',
    cancel: 'Cancel',
    required: 'Please fill in both the Arabic and English name',
    duplicate: 'This nationality already exists',
    failed: 'Failed to add nationality',
    common: 'Common',
    allNationalities: 'All Nationalities',
  },
} as const;

export interface NationalitySelectProps {
  /** Forwarded so a Form.Item's <label htmlFor> resolves to the actual control. */
  id?: string;
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  size?: SelectProps['size'];
  style?: React.CSSProperties;
  className?: string;
  /** Server-side filter — omit to match legacy per-page behavior of loading all nationalities. */
  isActiveOnly?: boolean;
  /** Set to false to render a plain picker with no "Others" affordance (e.g. future filter reuse). */
  allowAdd?: boolean;
  /** Override how an option's value is derived — agents/page.tsx needs the legacy numeric id first. */
  getOptionValue?: (n: Nationality) => string;
  /**
   * Names (Arabic or English, matched case/whitespace-insensitively) floated into a
   * pinned "Common" group at the top of the list, with everything else grouped below.
   * Opt-in only — omit for today's flat list. Never removes anything from the list,
   * so nothing becomes impossible to select; it only reorders for findability.
   */
  priorityNames?: string[];
}

export default function NationalitySelect({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  allowClear = true,
  size,
  style,
  className,
  isActiveOnly,
  allowAdd = true,
  getOptionValue = defaultGetOptionValue,
  priorityNames,
}: NationalitySelectProps) {
  const { nationalities, isLoading, getLabel, language, refetch } = useNationalityOptions({
    isActiveOnly,
  });
  // Duplicate-checking must see EVERY nationality, active or not — callers that
  // pass isActiveOnly (e.g. customers/page.tsx, agents/page.tsx) would otherwise
  // only compare against the filtered subset, letting a user "add" a nationality
  // that already exists but is currently inactive (live-verified: the backend
  // itself does not reject duplicate names, so this client-side check is the
  // only guard there is).
  const { nationalities: allNationalitiesForDupCheck } = useNationalityOptions();
  const createMutation = useCreateNationality();
  const selectRef = useRef<RefSelectProps>(null);
  const t = TEXT[language === 'ar' ? 'ar' : 'en'];

  const [adding, setAdding] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingOption, setPendingOption] = useState<{ value: string; label: string } | null>(
    null
  );

  const baseOptions = useMemo(
    () => nationalities.map((n) => ({ value: getOptionValue(n), label: getLabel(n) })),
    [nationalities, getOptionValue, getLabel]
  );

  /** Partitions `nationalities` into a pinned "common" group (ordered per `priorityNames`)
   *  and the rest — only computed when `priorityNames` is supplied. */
  const priorityGroups = useMemo(() => {
    if (!priorityNames || priorityNames.length === 0) return null;
    const norm = (s: string) => s.trim().toLocaleLowerCase();
    const order = new Map(priorityNames.map((name, i) => [norm(name), i]));
    const rank = (n: Nationality) => {
      const ai = n.nationalityNameAr ? order.get(norm(n.nationalityNameAr)) : undefined;
      const ei = n.nationalityNameEn ? order.get(norm(n.nationalityNameEn)) : undefined;
      const best = [ai, ei].filter((v): v is number => v !== undefined);
      return best.length ? Math.min(...best) : -1;
    };

    const pinned: Nationality[] = [];
    const rest: Nationality[] = [];
    for (const n of nationalities) {
      (rank(n) >= 0 ? pinned : rest).push(n);
    }
    pinned.sort((a, b) => rank(a) - rank(b));

    return {
      pinned: pinned.map((n) => ({ value: getOptionValue(n), label: getLabel(n) })),
      rest: rest.map((n) => ({ value: getOptionValue(n), label: getLabel(n) })),
    };
  }, [nationalities, priorityNames, getOptionValue, getLabel]);

  const options = useMemo<NonNullable<SelectProps['options']>>(() => {
    const isNewPending =
      pendingOption && !baseOptions.some((o) => o.value === pendingOption.value);

    if (priorityGroups) {
      const pinned = isNewPending ? [pendingOption!, ...priorityGroups.pinned] : priorityGroups.pinned;
      return [
        { label: t.common, options: pinned },
        { label: t.allNationalities, options: priorityGroups.rest },
      ];
    }
    if (isNewPending) {
      return [pendingOption!, ...baseOptions];
    }
    return baseOptions;
  }, [baseOptions, pendingOption, priorityGroups, t.common, t.allNationalities]);

  const resetAddForm = () => {
    setAdding(false);
    setNameAr('');
    setNameEn('');
    setErrorMsg(null);
  };

  const handleSave = async () => {
    const ar = nameAr.trim();
    const en = nameEn.trim();
    if (!ar || !en) {
      setErrorMsg(t.required);
      return;
    }

    const norm = (s: string) => s.trim().toLocaleLowerCase();
    const isDuplicate = allNationalitiesForDupCheck.some(
      (n) =>
        (n.nationalityNameAr && norm(n.nationalityNameAr) === norm(ar)) ||
        (n.nationalityNameEn && norm(n.nationalityNameEn) === norm(en))
    );
    if (isDuplicate) {
      setErrorMsg(t.duplicate);
      return;
    }

    setErrorMsg(null);
    try {
      const created = await createMutation.mutateAsync({
        nationalityNameAr: ar,
        nationalityNameEn: en,
        isActive: true,
      });

      let newValue = created?.id ? getOptionValue(created) : undefined;
      let newLabel = created?.id ? getLabel(created) : language === 'ar' ? ar : en;

      if (!newValue) {
        // Defensive fallback if the create response didn't carry an id — resolve
        // the new nationality by name from a fresh fetch instead.
        const refetched = await refetch();
        const list: Nationality[] = Array.isArray(refetched.data)
          ? refetched.data
          : (refetched.data as any)?.$values ?? [];
        const match = list.find(
          (n) =>
            n.nationalityNameAr &&
            n.nationalityNameEn &&
            norm(n.nationalityNameAr) === norm(ar) &&
            norm(n.nationalityNameEn) === norm(en)
        );
        if (match) {
          newValue = getOptionValue(match);
          newLabel = getLabel(match);
        }
      }

      if (newValue) {
        setPendingOption({ value: newValue, label: newLabel });
        onChange?.(newValue);
      }

      resetAddForm();
      selectRef.current?.blur();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, t.failed));
    }
  };

  return (
    <Select
      id={id}
      ref={selectRef}
      value={value}
      onChange={(v) => onChange?.(v)}
      placeholder={placeholder ?? t.placeholder}
      disabled={disabled}
      allowClear={allowClear}
      size={size}
      style={style ?? { width: '100%' }}
      className={className}
      showSearch
      optionFilterProp="label"
      loading={isLoading}
      notFoundContent={isLoading ? <Spin size="small" /> : null}
      options={options}
      onOpenChange={(open) => {
        if (!open) resetAddForm();
      }}
      popupRender={
        allowAdd
          ? (menu) => (
              <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                {!adding ? (
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    block
                    onClick={() => setAdding(true)}
                    style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                  >
                    {t.others}
                  </Button>
                ) : (
                  <div style={{ padding: 8 }}>
                    <Space direction="vertical" style={{ width: '100%' }} size={6}>
                      <Input
                        placeholder={t.nameAr}
                        dir="rtl"
                        value={nameAr}
                        maxLength={100}
                        onChange={(e) => setNameAr(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onPressEnter={handleSave}
                      />
                      <Input
                        placeholder={t.nameEn}
                        dir="ltr"
                        value={nameEn}
                        maxLength={100}
                        onChange={(e) => setNameEn(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onPressEnter={handleSave}
                      />
                      {errorMsg && (
                        <span style={{ color: '#ff4d4f', fontSize: 12 }}>{errorMsg}</span>
                      )}
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          loading={createMutation.isPending}
                          onClick={handleSave}
                        >
                          {t.save}
                        </Button>
                        <Button
                          size="small"
                          disabled={createMutation.isPending}
                          onClick={resetAddForm}
                        >
                          {t.cancel}
                        </Button>
                      </Space>
                    </Space>
                  </div>
                )}
              </>
            )
          : undefined
      }
    />
  );
}
