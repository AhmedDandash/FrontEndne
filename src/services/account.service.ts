import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  AccountTreeNode,
  CreateAccountDto,
  UpdateAccountNameDto,
  UpdateAccountReportSideDto,
  AccountSettingListDto,
  AccountSettingsQuery,
  PagedResult,
} from '@/types/accounting.types';

/**
 * Account (Chart of Accounts) service.
 *
 * The backend wraps every payload in an ApiResponse envelope
 * `{ statusCode, isSuccess, message, data }` and serialises object graphs with
 * System.Text.Json reference handling, so nested arrays may arrive as
 * `{ $values: [...] }`. Both shapes are normalised here.
 */
export class AccountService {
  /** Pull the meaningful payload out of the ApiResponse envelope. */
  private static unwrap<T>(payload: any): T {
    const inner = payload?.data?.value ?? payload?.value ?? payload?.data ?? payload;
    return inner as T;
  }

  /** Coerce a value that may be an array or a `{ $values: [] }` wrapper. */
  private static asArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.$values)) return value.$values;
    return [];
  }

  /** Recursively normalise raw tree nodes into clean AccountTreeNode[]. */
  private static normalizeTree(raw: any): AccountTreeNode[] {
    return this.asArray(raw).map((node: any) => {
      const children = this.normalizeTree(node?.children);
      return {
        id: node?.id,
        code: node?.code ?? '',
        name: node?.name ?? '',
        level: typeof node?.level === 'number' ? node.level : 1,
        isLeaf: node?.isLeaf ?? children.length === 0,
        children,
      };
    });
  }

  // ==================== Reads ====================

  /**
   * GET /account/full-tree-structure — returns the root accounts (each with a
   * correct `isLeaf` flag). The backend serves the hierarchy one level at a
   * time, so we fill in every non-leaf node's children via `subtree/{id}` and
   * return a fully nested tree to the UI.
   */
  static async getFullTree(): Promise<AccountTreeNode[]> {
    const response = await api.get<any>(API_ENDPOINTS.ACCOUNT.FULL_TREE);
    const payload = response.data;
    const root = payload?.data ?? payload?.value ?? payload;
    const roots = this.normalizeTree(root);
    await this.loadChildrenDeep(roots);
    return roots;
  }

  /**
   * Recursively load children for every non-leaf node via `subtree/{id}`.
   * Nodes that already carry children (should the backend later return a fully
   * nested tree in one call) are used as-is instead of being re-fetched.
   */
  private static async loadChildrenDeep(nodes: AccountTreeNode[], depth = 0): Promise<void> {
    if (depth > 12) return; // safety guard against unexpected cycles
    await Promise.all(
      nodes.map(async (node) => {
        if (node.isLeaf) return;
        let children = node.children ?? [];
        if (children.length === 0) {
          children = await this.getSubtree(node.id);
          node.children = children;
        }
        await this.loadChildrenDeep(children, depth + 1);
      })
    );
  }

  /** GET /account/subtree/{parentId} — sub-tree rooted at the given parent. */
  static async getSubtree(parentId: string): Promise<AccountTreeNode[]> {
    const response = await api.get<any>(API_ENDPOINTS.ACCOUNT.SUBTREE(parentId));
    const payload = response.data;
    const root = payload?.data ?? payload?.value ?? payload;
    return this.normalizeTree(root);
  }

  /** GET /account/settings — paginated list with report-side settings. */
  static async getSettings(
    query: AccountSettingsQuery = {}
  ): Promise<PagedResult<AccountSettingListDto>> {
    const response = await api.get<any>(API_ENDPOINTS.ACCOUNT.SETTINGS, {
      params: {
        searchTerm: query.searchTerm || undefined,
        pageNumber: query.pageNumber ?? 1,
        pageSize: query.pageSize ?? 10,
      },
    });
    const payload = response.data;
    const data = payload?.data ?? payload;
    const items = this.asArray(data?.items ?? data?.$values ?? data);
    return {
      items: items as AccountSettingListDto[],
      totalCount: data?.totalCount ?? data?.total ?? items.length,
      pageNumber: data?.pageNumber ?? data?.page ?? query.pageNumber ?? 1,
      pageSize: data?.pageSize ?? query.pageSize ?? 10,
    };
  }

  // ==================== Writes ====================

  /** POST /account/create-account */
  static async create(data: CreateAccountDto): Promise<AccountTreeNode> {
    const response = await api.post<any>(API_ENDPOINTS.ACCOUNT.CREATE, {
      code: data.code,
      name: data.name,
      parentId: data.parentId ?? null,
    });
    return this.unwrap<AccountTreeNode>(response.data);
  }

  /** PUT /account/update-account/{accountId} — rename an account. */
  static async updateName(accountId: string, data: UpdateAccountNameDto): Promise<AccountTreeNode> {
    const response = await api.put<any>(API_ENDPOINTS.ACCOUNT.UPDATE(accountId), {
      name: data.name,
    });
    return this.unwrap<AccountTreeNode>(response.data);
  }

  /** PUT /account/reporting/{accountId} — update report-side settings. */
  static async updateReporting(
    accountId: string,
    data: UpdateAccountReportSideDto
  ): Promise<void> {
    await api.put(API_ENDPOINTS.ACCOUNT.REPORTING(accountId), {
      incomeStatementSide: data.incomeStatementSide,
      profitLossSide: data.profitLossSide,
      isGroupedInTrialBalance: data.isGroupedInTrialBalance,
    });
  }

  /** DELETE /account/delete-account/{accountId} — leaf accounts only. */
  static async delete(accountId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.ACCOUNT.DELETE(accountId));
  }
}
