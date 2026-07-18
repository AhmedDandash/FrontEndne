import { useQuery } from '@tanstack/react-query';
import { AccountService } from '@/services/account.service';
import type { AccountTreeNode } from '@/types/accounting.types';

export interface FlatLeafAccount {
  id: string;
  code: string;
  name: string;
  /** Ancestor names, root-first — rendered as the option's context line. */
  path: string[];
}

/**
 * Flat, searchable list of LEAF accounts for voucher account pickers.
 *
 * The chart-of-accounts API is deliberately lazy: `full-tree-structure` returns
 * only the roots (each with a correct `isLeaf`), and children arrive one level
 * at a time from `subtree/{id}`. That's right for a browsable tree, but an
 * account picker needs the whole leaf set up front to be searchable.
 *
 * So this walks the tree breadth-first, fetching each non-leaf level in
 * parallel until no unexpanded parents remain. The real chart is shallow
 * (3 levels as of 2026-07), so this settles in ~2-3 round trips. Journal
 * postings are only ever made to leaf accounts, hence the leaf-only filter.
 *
 * Cached with a long staleTime — the chart of accounts changes rarely, and
 * every voucher form mounts at least two of these pickers.
 */
export function useLeafAccounts() {
  return useQuery({
    queryKey: ['accounts', 'leaves'],
    queryFn: async (): Promise<FlatLeafAccount[]> => {
      const roots = await AccountService.getFullTree();
      const leaves: FlatLeafAccount[] = [];

      // Each frontier entry carries the ancestor names that led to it.
      let frontier: Array<{ node: AccountTreeNode; path: string[] }> = roots.map((node) => ({
        node,
        path: [],
      }));

      // Guard against a malformed/cyclic tree turning this into a hang.
      const MAX_DEPTH = 10;
      for (let depth = 0; depth < MAX_DEPTH && frontier.length; depth++) {
        const parents: typeof frontier = [];

        for (const entry of frontier) {
          if (entry.node.isLeaf) {
            leaves.push({
              id: entry.node.id,
              code: entry.node.code,
              name: entry.node.name,
              path: entry.path,
            });
          } else {
            parents.push(entry);
          }
        }

        if (!parents.length) break;

        const childLevels = await Promise.all(
          parents.map(async (entry) => {
            // A failed branch shouldn't blank the whole picker.
            const children = await AccountService.getSubtree(entry.node.id).catch(
              () => [] as AccountTreeNode[]
            );
            return children.map((child) => ({
              node: child,
              path: [...entry.path, entry.node.name],
            }));
          })
        );

        frontier = childLevels.flat();
      }

      return leaves.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
