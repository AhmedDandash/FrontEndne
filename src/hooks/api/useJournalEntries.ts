import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { JournalEntryService } from '@/services/journal-entry.service';
import type {
  JournalEntriesQuery,
  JournalEntryInput,
} from '@/types/journal-entry.types';

const JOURNAL_ENTRIES_KEY = 'journal-entries';

/**
 * Pull a human-readable message out of an axios error (bilingual fallback).
 * The API error envelope is `{ success:false, errors:[...], message?, statusCode }`,
 * so validation details (e.g. "debit total != credit total") arrive in `errors[]`.
 */
function errorMessage(err: any, fallback: string): string {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const fromArray = Array.isArray(data?.errors) ? data.errors.filter(Boolean).join(' • ') : '';
  const detail = fromArray || data?.message || data?.title;
  if (detail) return detail;
  // A 500 with an empty body is a server-side failure (no validation detail).
  if (status >= 500) {
    return `${fallback} — خطأ في الخادم (${status}) / server error (${status})`;
  }
  return fallback;
}

/**
 * Journal Entries list hook (server-paginated + filtered).
 *
 * Search is now server-side (`Search` param, verified live) so results span the
 * whole dataset, not just the loaded page. `placeholderData` keeps the previous
 * page visible while the next loads.
 */
export function useJournalEntries(query: JournalEntriesQuery) {
  const result = useQuery({
    queryKey: [
      JOURNAL_ENTRIES_KEY,
      'list',
      query.pageNumber ?? 1,
      query.pageSize ?? 10,
      query.from ?? '',
      query.to ?? '',
      query.status ?? '',
      query.source ?? '',
      query.referenceType ?? '',
      query.search ?? '',
      query.customerId ?? '',
      query.agentId ?? '',
      query.workerId ?? '',
      query.employeeId ?? '',
      query.contractNumber ?? '',
      query.branchId ?? '',
      query.includeSubBranches ?? '',
      query.updatedDateFrom ?? '',
      query.updatedDateTo ?? '',
      query.totalDebitFrom ?? '',
      query.totalDebitTo ?? '',
      query.totalCreditFrom ?? '',
      query.totalCreditTo ?? '',
    ],
    queryFn: () => JournalEntryService.getAll(query),
    placeholderData: (previous) => previous,
  });

  return {
    items: result.data?.items ?? [],
    totalCount: result.data?.totalCount ?? 0,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error,
    refetch: result.refetch,
  };
}

/** Single journal entry detail (lazy — only fetched when `id` is set). */
export function useJournalEntryDetail(id: string | null) {
  return useQuery({
    queryKey: [JOURNAL_ENTRIES_KEY, 'detail', id],
    queryFn: () => JournalEntryService.getById(id as string),
    enabled: !!id,
  });
}

/** Mutations: create, update, delete, post, unpost — all invalidate the list. */
export function useJournalEntryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [JOURNAL_ENTRIES_KEY] });

  const createMutation = useMutation({
    mutationFn: (data: JournalEntryInput) => JournalEntryService.create(data),
    onSuccess: () => {
      invalidate();
      message.success('تم إنشاء القيد كمسودة / Entry saved as draft');
    },
    onError: (err: any) =>
      message.error(errorMessage(err, 'فشل إنشاء القيد / Failed to create entry')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JournalEntryInput }) =>
      JournalEntryService.update(id, data),
    onSuccess: () => {
      invalidate();
      message.success('تم تحديث القيد / Entry updated');
    },
    onError: (err: any) =>
      message.error(errorMessage(err, 'فشل تحديث القيد / Failed to update entry')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => JournalEntryService.delete(id),
    onSuccess: () => {
      invalidate();
      message.success('تم حذف القيد / Entry deleted');
    },
    onError: (err: any) =>
      message.error(
        errorMessage(err, 'فشل حذف القيد — لا يمكن حذف قيد معمد / Failed to delete (posted entries cannot be deleted)')
      ),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => JournalEntryService.post(id),
    onSuccess: () => {
      invalidate();
      message.success('تم اعتماد القيد / Entry posted to ledger');
    },
    onError: (err: any) =>
      message.error(
        errorMessage(err, 'فشل الاعتماد — تأكد أن القيد متوازن / Failed to post (check the entry is balanced)')
      ),
  });

  const unpostMutation = useMutation({
    mutationFn: (id: string) => JournalEntryService.unpost(id),
    onSuccess: () => {
      invalidate();
      message.success('تم إلغاء اعتماد القيد / Entry unposted');
    },
    onError: (err: any) =>
      message.error(errorMessage(err, 'فشل إلغاء الاعتماد / Failed to unpost entry')),
  });

  return {
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    postEntry: postMutation.mutateAsync,
    unpostEntry: unpostMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPosting: postMutation.isPending,
    isUnposting: unpostMutation.isPending,
  };
}
