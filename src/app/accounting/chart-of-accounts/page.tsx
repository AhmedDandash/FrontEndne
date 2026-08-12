'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Tree,
  Input,
  Button,
  Tag,
  Spin,
  Empty,
  Row,
  Col,
  Tooltip,
  Space,
  Divider,
  Modal,
} from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import type { AntTreeNodeProps } from 'antd/es/tree';
import {
  BankOutlined,
  ReloadOutlined,
  SettingOutlined,
  ApartmentOutlined,
  FileOutlined,
  FolderOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  SlidersOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  NodeIndexOutlined,
  PlusSquareOutlined,
  MinusSquareOutlined,
} from '@ant-design/icons';
import { useAccountTree } from '@/hooks/api/useAccounts';
import { getAccountType, ACCOUNT_TYPES } from '@/types/accounting.types';
import type { AccountTreeNode } from '@/types/accounting.types';
import { useAuthStore } from '@/store/authStore';
import { useAccountModals } from '../_components/AccountModals';
import { linkProps } from '@/lib/navigation/linkProps';
import styles from './ChartOfAccounts.module.css';

/** Flatten helpers — keep a lookup of every node and its parent chain. */
interface FlatMaps {
  nodeMap: Map<string, AccountTreeNode>;
  parentMap: Map<string, string | null>;
  allKeys: string[];
  branchKeys: string[];
  total: number;
}

function buildMaps(tree: AccountTreeNode[]): FlatMaps {
  const nodeMap = new Map<string, AccountTreeNode>();
  const parentMap = new Map<string, string | null>();
  const allKeys: string[] = [];
  const branchKeys: string[] = [];

  const walk = (nodes: AccountTreeNode[], parentId: string | null) => {
    for (const node of nodes) {
      if (!node.id) continue;
      nodeMap.set(node.id, node);
      parentMap.set(node.id, parentId);
      allKeys.push(node.id);
      const children = node.children ?? [];
      if (children.length > 0) {
        branchKeys.push(node.id);
        walk(children, node.id);
      }
    }
  };
  walk(tree, null);

  return { nodeMap, parentMap, allKeys, branchKeys, total: nodeMap.size };
}

/** Ancestor chain of a node (excluding itself), nearest-last. */
function ancestorsOf(id: string, parentMap: Map<string, string | null>): string[] {
  const chain: string[] = [];
  let current = parentMap.get(id) ?? null;
  while (current) {
    chain.push(current);
    current = parentMap.get(current) ?? null;
  }
  return chain;
}

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const isAr = language !== 'en';

  const { tree, isLoading, isFetching, refetch, loadChildren } = useAccountTree();

  // Shared create / rename / reporting modals + delete mutation (also used by Settings).
  const {
    element: accountModals,
    openCreate,
    openEditName,
    openReporting,
    deleteAccount,
    isLeaf,
  } = useAccountModals();

  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const maps = useMemo(() => buildMaps(tree), [tree]);

  const t = (ar: string, en: string) => (isAr ? ar : en);

  /**
   * Lazy-load flow: the tree starts at the roots returned by
   * `full-tree-structure`. Every node with `isLeaf === false` renders a `+`
   * switcher; clicking it calls `loadChildren(id)` to fetch that node's direct
   * children (GET /account/subtree/{id}). Each child carries its own `isLeaf`
   * flag, so the process repeats down the branch until leaf nodes are reached.
   * Already-loaded nodes are not re-fetched.
   */
  const onLoadData = async (node: EventDataNode<DataNode>): Promise<void> => {
    const id = String(node.key);
    const existing = maps.nodeMap.get(id);
    if (existing && (existing.children?.length ?? 0) > 0) return;
    await loadChildren(id);
  };

  // A full refetch (mutation invalidation or the Refresh button) re-fetches the
  // roots only, dropping every lazily-loaded subtree. Collapse to a clean root
  // view rather than leaving stale "expanded but empty" branches behind.
  // (Subtree loads use setQueryData and never toggle isFetching, so normal
  // browsing is unaffected.)
  const wasFetching = useRef(false);
  useEffect(() => {
    if (wasFetching.current && !isFetching) {
      setExpandedKeys([]);
      setAutoExpandParent(false);
    }
    wasFetching.current = isFetching;
  }, [isFetching]);

  /** Confirm + delete a leaf account. */
  const confirmDelete = (node: AccountTreeNode) => {
    Modal.confirm({
      title: t('تأكيد الحذف', 'Confirm delete'),
      icon: <ExclamationCircleFilled />,
      content: (
        <span>
          {t('سيتم حذف الحساب ', 'The account ')}
          <strong>
            {node.code} — {node.name}
          </strong>
          {t(' نهائيًا. لا يمكن التراجع.', ' will be permanently deleted. This cannot be undone.')}
        </span>
      ),
      okText: t('حذف', 'Delete'),
      okButtonProps: { danger: true },
      cancelText: t('إلغاء', 'Cancel'),
      onOk: async () => {
        try {
          await deleteAccount(node.id);
        } catch {
          // The mutation's own onError already surfaced a toast; swallow the
          // rejection here so it doesn't bubble as an unhandled promise
          // rejection (Modal.confirm's static API doesn't catch it either).
        }
      },
    });
  };

  /** Recursively convert the API tree into antd Tree data with rich titles + inline actions. */
  const treeData = useMemo<DataNode[]>(() => {
    const term = searchValue.trim().toLowerCase();

    const render = (nodes: AccountTreeNode[]): DataNode[] =>
      nodes.map((node) => {
        const children = node.children ?? [];
        const loaded = children.length > 0;
        const type = getAccountType(node.code);
        const leaf = node.isLeaf;

        const nameLower = node.name.toLowerCase();
        const codeLower = node.code.toLowerCase();
        const matchIndex = term ? nameLower.indexOf(term) : -1;
        const codeMatch = term ? codeLower.includes(term) : false;

        let nameNode: React.ReactNode = node.name;
        if (term && matchIndex > -1) {
          nameNode = (
            <>
              {node.name.slice(0, matchIndex)}
              <span className={styles.highlight}>
                {node.name.slice(matchIndex, matchIndex + term.length)}
              </span>
              {node.name.slice(matchIndex + term.length)}
            </>
          );
        }

        // Stop tree-node selection when interacting with the row actions.
        const stop = (e: React.MouseEvent) => e.stopPropagation();

        const title = (
          <span className={styles.nodeTitle}>
            <span className={styles.nodeMain}>
              <span
                className={`${styles.nodeCode} ${codeMatch ? styles.codeMatch : ''}`}
                style={type ? { color: type.color } : undefined}
              >
                {node.code}
              </span>
              <span className={styles.nodeName}>{nameNode}</span>
            </span>

            <span className={styles.nodeActions} onClick={stop}>
              <Tooltip title={t('إضافة حساب فرعي', 'Add sub-account')}>
                <Button
                  size="small"
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => openCreate(node.id)}
                />
              </Tooltip>
              <Tooltip title={t('تعديل الاسم', 'Edit name')}>
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => openEditName({ id: node.id, code: node.code, name: node.name })}
                />
              </Tooltip>
              <Tooltip title={t('إعدادات التقارير', 'Reporting settings')}>
                <Button
                  size="small"
                  type="text"
                  icon={<SlidersOutlined />}
                  onClick={() => openReporting({ id: node.id, code: node.code, name: node.name })}
                />
              </Tooltip>
              <Tooltip
                title={
                  leaf
                    ? t('حذف الحساب', 'Delete account')
                    : t('لا يمكن حذف حساب له فروع', 'Cannot delete an account with sub-accounts')
                }
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  disabled={!leaf}
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDelete(node)}
                />
              </Tooltip>
            </span>
          </span>
        );

        return {
          key: node.id,
          title,
          isLeaf: leaf,
          icon: leaf ? <FileOutlined /> : <FolderOutlined />,
          children: loaded ? render(children) : undefined,
        };
      });

    return render(tree);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, searchValue, isAr]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    const term = value.trim().toLowerCase();
    if (!term) {
      setExpandedKeys([]);
      setAutoExpandParent(false);
      return;
    }

    // Expand the ancestors of every matching node.
    const keysToExpand = new Set<React.Key>();
    for (const node of maps.nodeMap.values()) {
      const hit =
        node.name.toLowerCase().includes(term) || node.code.toLowerCase().includes(term);
      if (hit) {
        for (const ancestor of ancestorsOf(node.id, maps.parentMap)) {
          keysToExpand.add(ancestor);
        }
      }
    }
    setExpandedKeys(Array.from(keysToExpand));
    setAutoExpandParent(true);
  };

  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys);
    setAutoExpandParent(false);
  };

  const onSelect = (keys: React.Key[]) => {
    const id = keys[0] as string | undefined;
    setSelectedId(id ?? null);
  };

  const settingsHref = (code?: string) => {
    const query = code ? `?searchTerm=${encodeURIComponent(code)}` : '';
    return `/accounting/account-settings${query}`;
  };

  const selected = selectedId ? maps.nodeMap.get(selectedId) ?? null : null;
  const selectedType = selected ? getAccountType(selected.code) : null;
  const selectedChildrenCount = selected?.children?.length ?? 0;
  const selectedChildrenLoaded = selectedChildrenCount > 0;
  const selectedIsLeaf = selected ? isLeaf(selected.id) : false;

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <BankOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('شجرة الحسابات', 'Chart of Accounts')}</h1>
              <p className={styles.pageSubtitle}>
                {t(
                  'عرض وإدارة الهيكل الشجري للحسابات: إضافة وتعديل وحذف مباشرة من الشجرة',
                  'Browse and manage the account hierarchy — add, edit and delete right on the tree'
                )}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              className={styles.refreshBtn}
            >
              {t('تحديث', 'Refresh')}
            </Button>
            <Button
              icon={<SettingOutlined />}
              {...linkProps(settingsHref(), router)}
              className={styles.refreshBtn}
            >
              {t('إعدادات الحسابات', 'Account Settings')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreate()}
              className={styles.addBtn}
            >
              {t('إضافة حساب رئيسي', 'Add Root Account')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Account-type legend ──────────────────────────────── */}
      <div className={styles.legend}>
        {Object.values(ACCOUNT_TYPES).map((tp) => (
          <span key={tp.digit} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: tp.color }} />
            <span className={styles.legendCode}>{tp.digit}</span>
            {isAr ? tp.ar : tp.en}
          </span>
        ))}
      </div>

      {/* ── Body: tree + details ─────────────────────────────── */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15}>
          <Card
            className={styles.treeCard}
            title={
              <Space>
                <ApartmentOutlined />
                {t('الحسابات', 'Accounts')}
                {!isLoading && (
                  <Tag color="blue" className={styles.countTag}>
                    {maps.total}
                  </Tag>
                )}
              </Space>
            }
          >
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('ابحث برقم الحساب أو الاسم...', 'Search by account code or name...')}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.search}
            />

            {isLoading ? (
              <div className={styles.spinWrapper}>
                <Spin size="large" />
              </div>
            ) : !tree.length ? (
              <Empty description={t('لا توجد حسابات', 'No accounts found')} />
            ) : (
              <div className={styles.treeWrapper}>
                <Tree
                  showLine={{ showLeafIcon: false }}
                  showIcon
                  blockNode
                  treeData={treeData}
                  loadData={onLoadData}
                  switcherIcon={({ isLeaf: nodeIsLeaf, expanded, loading }: AntTreeNodeProps) => {
                    if (loading) return undefined;
                    if (nodeIsLeaf) return null;
                    return expanded ? (
                      <MinusSquareOutlined className={styles.switcher} />
                    ) : (
                      <PlusSquareOutlined className={styles.switcher} />
                    );
                  }}
                  expandedKeys={expandedKeys}
                  autoExpandParent={autoExpandParent}
                  selectedKeys={selectedId ? [selectedId] : []}
                  onExpand={handleExpand}
                  onSelect={onSelect}
                  className={styles.tree}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* ── Details panel ──────────────────────────────────── */}
        <Col xs={24} lg={9}>
          <Card
            className={styles.detailsCard}
            title={
              <Space>
                <FileOutlined />
                {t('تفاصيل الحساب', 'Account Details')}
              </Space>
            }
          >
            {!selected ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('اختر حسابًا لعرض تفاصيله', 'Select an account to view its details')}
              />
            ) : (
              <>
                {/* ── Hero: code pill + name + classification ── */}
                <div className={styles.detailHero}>
                  <span
                    className={styles.detailHeroCode}
                    style={selectedType ? { background: selectedType.color } : undefined}
                  >
                    {selected.code}
                  </span>
                  <div className={styles.detailHeroBody}>
                    <div className={styles.detailHeroName} title={selected.name}>
                      {selected.name}
                    </div>
                    <div className={styles.detailHeroTags}>
                      {selectedType && (
                        <Tag color={selectedType.color} style={{ margin: 0 }}>
                          {isAr ? selectedType.ar : selectedType.en}
                        </Tag>
                      )}
                      {selected.isLeaf ? (
                        <Tag icon={<FileOutlined />} style={{ margin: 0 }}>
                          {t('قابل للترحيل', 'Postable')}
                        </Tag>
                      ) : (
                        <Tag icon={<FolderOutlined />} color="processing" style={{ margin: 0 }}>
                          {t('حساب رئيسي', 'Header')}
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Stats grid ── */}
                <div className={styles.detailStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>{t('المستوى', 'Level')}</span>
                    <span className={styles.statValue}>{selected.level}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>{t('الفروع المباشرة', 'Sub-accounts')}</span>
                    <span className={styles.statValue}>
                      {selected.isLeaf ? (
                        0
                      ) : selectedChildrenLoaded ? (
                        selectedChildrenCount
                      ) : (
                        <Tooltip
                          title={t(
                            'وسّع الحساب من الشجرة لتحميل فروعه',
                            'Expand the account in the tree to load its sub-accounts'
                          )}
                        >
                          <span style={{ cursor: 'help' }}>—</span>
                        </Tooltip>
                      )}
                    </span>
                  </div>
                </div>

                {/* ── Sub-account list (parent nodes only) ── */}
                {!selected.isLeaf && selectedChildrenCount > 0 && (
                  <div className={styles.childList}>
                    <div className={styles.childListHeader}>
                      <NodeIndexOutlined style={{ fontSize: 12 }} />
                      {t('الفروع', 'Sub-accounts')}
                    </div>
                    {(selected.children ?? []).map((ch) => {
                      const chType = getAccountType(ch.code);
                      return (
                        <div
                          key={ch.id}
                          className={styles.childItem}
                          onClick={() => setSelectedId(ch.id)}
                        >
                          <span
                            className={styles.childCode}
                            style={chType ? { color: chType.color } : undefined}
                          >
                            {ch.code}
                          </span>
                          <span className={styles.childName}>{ch.name}</span>
                          {ch.isLeaf ? (
                            <FileOutlined style={{ fontSize: 11, color: '#9ca3af', marginInlineStart: 'auto' }} />
                          ) : (
                            <FolderOutlined style={{ fontSize: 11, color: '#9ca3af', marginInlineStart: 'auto' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Divider style={{ margin: '16px 0 12px' }} />

                {/* ── Action buttons ── */}
                <div className={styles.detailActions}>
                  <Button
                    block
                    type="primary"
                    ghost
                    icon={<PlusOutlined />}
                    onClick={() => openCreate(selected.id)}
                    className={styles.detailActionBtn}
                  >
                    {t('إضافة حساب فرعي', 'Add sub-account')}
                  </Button>
                  <Button
                    block
                    icon={<EditOutlined />}
                    onClick={() =>
                      openEditName({ id: selected.id, code: selected.code, name: selected.name })
                    }
                    className={styles.detailActionBtn}
                  >
                    {t('تعديل الاسم', 'Edit name')}
                  </Button>
                  <Button
                    block
                    icon={<SlidersOutlined />}
                    onClick={() =>
                      openReporting({ id: selected.id, code: selected.code, name: selected.name })
                    }
                    className={styles.detailActionBtn}
                  >
                    {t('إعدادات التقارير', 'Reporting settings')}
                  </Button>
                  <Tooltip
                    title={
                      !selectedIsLeaf
                        ? t('لا يمكن حذف حساب له فروع', 'Cannot delete an account with sub-accounts')
                        : ''
                    }
                  >
                    <Button
                      block
                      danger
                      icon={<DeleteOutlined />}
                      disabled={!selectedIsLeaf}
                      onClick={() => confirmDelete(selected)}
                      className={styles.detailActionBtn}
                    >
                      {t('حذف الحساب', 'Delete account')}
                    </Button>
                  </Tooltip>
                  <Button
                    block
                    type="link"
                    icon={<SettingOutlined />}
                    {...linkProps(settingsHref(selected.code), router)}
                    style={{ marginTop: 4 }}
                  >
                    {t('عرض في إعدادات الحسابات', 'Open in Account Settings')}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {accountModals}
    </div>
  );
}
