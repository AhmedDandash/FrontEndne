'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { AccountingDocumentFilterDto } from '@/types/api.types';

/**
 * Shared filter state for the four legacy accounting-document list pages
 * (Receipt/Payment Vouchers, Credit/Debit Notes) — their filter state,
 * normalization and debounce were previously copy-pasted four times.
 */
export function useAccountingDocFilters() {
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [contractId, setContractId] = useState<string | undefined>();
  const [documentType, setDocumentType] = useState<number | undefined>();
  const [documentNumber, setDocumentNumber] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState<string | undefined>();
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [range, setRange] = useState<[string | undefined, string | undefined]>([
    dayjs().subtract(1, 'month').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);

  // Debounce the free-text search into the server-side `search` param.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const params: AccountingDocumentFilterDto = {
    customerId,
    agentId,
    contractId,
    documentType,
    documentNumber: documentNumber || undefined,
    search: search || undefined,
    branchId,
    includeSubBranches: branchId ? includeSubBranches : undefined,
    dateFrom: range[0],
    dateTo: range[1],
  };

  // Quick filters (search, branch) are always visible and excluded from the
  // "advanced filters" badge — matches the convention in general-vouchers/page.tsx.
  const activeCount = [documentType, documentNumber, customerId, agentId, contractId, range[0]].filter(
    (v) => v !== undefined && v !== null && v !== ''
  ).length;

  const clear = () => {
    setDocumentType(undefined);
    setDocumentNumber(undefined);
    setCustomerId(undefined);
    setAgentId(undefined);
    setContractId(undefined);
    setRange([undefined, undefined]);
  };

  return {
    customerId,
    setCustomerId,
    agentId,
    setAgentId,
    contractId,
    setContractId,
    documentType,
    setDocumentType,
    documentNumber,
    setDocumentNumber,
    searchInput,
    setSearchInput,
    branchId,
    setBranchId,
    includeSubBranches,
    setIncludeSubBranches,
    range,
    setRange,
    params,
    activeCount,
    clear,
  };
}

export type AccountingDocFiltersHook = ReturnType<typeof useAccountingDocFilters>;
