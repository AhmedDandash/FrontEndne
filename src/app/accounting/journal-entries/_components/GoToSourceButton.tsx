'use client';

import { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import {
  resolveJournalEntryNavigation,
  resolveContractRoute,
  buildSourceUrl,
  type JournalEntryNavInput,
} from '@/lib/journal-entry-navigation';

interface GoToSourceButtonProps {
  entry: JournalEntryNavInput;
  isAr: boolean;
  /** 'button' = full labelled button (drawer); 'icon' = compact icon (table row). */
  variant?: 'button' | 'icon';
  size?: 'small' | 'middle';
}

/**
 * "Go to source" affordance for a journal entry (JOURNAL_ENTRY_SOURCE_NAVIGATION.md §7).
 * Resolves the target screen from the entry's source/referenceType fields and
 * navigates to it with `?openId=<id>`. For ambiguous contracts it probes the
 * contract type first. Renders nothing for manual entries; renders disabled for
 * source types with no screen yet.
 */
export function GoToSourceButton({ entry, isAr, variant = 'button', size = 'middle' }: GoToSourceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nav = resolveJournalEntryNavigation(entry);
  const t = (ar: string, en: string) => (isAr ? ar : en);

  // Manual / unknown with no navigation and not explicitly disabled → hide.
  if (!nav.disabled && !nav.route) return null;

  const label = isAr ? nav.labelAr : nav.labelEn;

  if (nav.disabled) {
    const reason = isAr ? nav.disabledReasonAr : nav.disabledReasonEn;
    const btn =
      variant === 'icon' ? (
        <Button size="small" type="text" icon={<LinkOutlined />} disabled />
      ) : (
        <Button size={size} icon={<LinkOutlined />} disabled>
          {t('الذهاب للمصدر', 'Go to source')} — {label}
        </Button>
      );
    return <Tooltip title={`${label} — ${reason}`}>{btn}</Tooltip>;
  }

  const go = async () => {
    try {
      setLoading(true);
      let route = nav.route as string;
      if (nav.needsContractResolve && nav.id) {
        route = await resolveContractRoute(nav.id);
      }
      router.push(buildSourceUrl(route, nav.id));
    } catch {
      message.error(t('تعذّر فتح المصدر', 'Could not open the source'));
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Tooltip title={`${t('الذهاب للمصدر', 'Go to source')}: ${label}`}>
        <Button size="small" type="text" icon={<LinkOutlined />} loading={loading} onClick={go} />
      </Tooltip>
    );
  }

  return (
    <Button size={size} type="dashed" icon={<LinkOutlined />} loading={loading} onClick={go}>
      {t('الذهاب للمصدر', 'Go to source')} — {label}
    </Button>
  );
}
