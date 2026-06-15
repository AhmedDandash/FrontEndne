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
  Descriptions,
  Tooltip,
  Space,
  Modal,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  BankOutlined,
  ReloadOutlined,
  SettingOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  ApartmentOutlined,
  FileOutlined,
  FolderOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  SlidersOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { useAccountTree } from '@/hooks/api/useAccounts';
import { getAccountType, ACCOUNT_TYPES } from '@/types/accounting.types';
import type { AccountTreeNode } from '@/types/accounting.types';
import { useAuthStore } from '@/store/authStore';
import { useAccountModals } from '../_components/AccountModals';
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

  const { tree, isLoading, isFetching, refetch } = useAccountTree();

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

  // Reveal the full breakdown on first load by expanding all branch nodes.
  const didAutoExpand = useRef(false);
  useEffect(() => {
    if (!isLoading && maps.branchKeys.length && !didAutoExpand.current) {
      didAutoExpand.current = true;
      setExpandedKeys(maps.branchKeys);
      setAutoExpandParent(false);
    }
  }, [isLoading, maps.branchKeys]);

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
      onOk: () => deleteAccount(node.id),
    });
  };

  /** Recursively convert the API tree into antd Tree data with rich titles + inline actions. */
  const treeData = useMemo<DataNode[]>(() => {
    const term = searchValue.trim().toLowerCase();

    const render = (nodes: AccountTreeNode[]): DataNode[] =>
      nodes.map((node) => {
        const children = node.children ?? [];
        const hasChildren = children.length > 0;
        const type = getAccountType(node.code);
        const leaf = !hasChildren;

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
          icon: hasChildren ? <FolderOutlined /> : <FileOutlined />,
          children: hasChildren ? render(children) : undefined,
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

  const expandAll = () => {
    setExpandedKeys(maps.branchKeys);
    setAutoExpandParent(false);
  };

  const collapseAll = () => {
    setExpandedKeys([]);
    setAutoExpandParent(false);
  };

  const onSelect = (keys: React.Key[]) => {
    const id = keys[0] as string | undefined;
    setSelectedId(id ?? null);
  };

  const goToSettings = (code?: string) => {
    const query = code ? `?searchTerm=${encodeURIComponent(code)}` : '';
    router.push(`/accounting/account-settings${query}`);
  };

  const selected = selectedId ? maps.nodeMap.get(selectedId) ?? null : null;
  const selectedType = selected ? getAccountType(selected.code) : null;
  const selectedChildrenCount = selected?.children?.length ?? 0;
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
              onClick={() => goToSettings()}
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
            extra={
              <Space size={4}>
                <Tooltip title={t('توسيع الكل', 'Expand all')}>
                  <Button size="small" icon={<ArrowsAltOutlined />} onClick={expandAll}>
                    {t('توسيع', 'Expand')}
                  </Button>
                </Tooltip>
                <Tooltip title={t('طي الكل', 'Collapse all')}>
                  <Button size="small" icon={<ShrinkOutlined />} onClick={collapseAll}>
                    {t('طي', 'Collapse')}
                  </Button>
                </Tooltip>
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
                <Descriptions
                  column={1}
                  bordered
                  size="middle"
                  className={styles.details}
                  labelStyle={{ width: 140, fontWeight: 600 }}
                >
                  <Descriptions.Item label={t('رقم الحساب', 'Account Code')}>
                    <span
                      className={styles.detailCode}
                      style={selectedType ? { color: selectedType.color } : undefined}
                    >
                      {selected.code}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('اسم الحساب', 'Account Name')}>
                    {selected.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('النوع', 'Type')}>
                    {selectedType ? (
                      <Tag color={selectedType.color} style={{ fontFamily: 'inherit' }}>
                        {isAr ? selectedType.ar : selectedType.en}
                      </Tag>
                    ) : (
                      '—'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('المستوى', 'Level')}>
                    {selected.level}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('التصنيف', 'Kind')}>
                    {selected.isLeaf ? (
                      <Tag icon={<FileOutlined />}>{t('حساب فرعي', 'Leaf account')}</Tag>
                    ) : (
                      <Tag icon={<FolderOutlined />} color="processing">
                        {t('حساب رئيسي', 'Parent account')}
                      </Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('عدد الفروع', 'Direct children')}>
                    {selectedChildrenCount}
                  </Descriptions.Item>
                </Descriptions>

                {/* Inline management actions for the selected account */}
                <Space direction="vertical" size={8} className={styles.detailsActions}>
                  <Space wrap>
                    <Button
                      type="primary"
                      ghost
                      icon={<PlusOutlined />}
                      onClick={() => openCreate(selected.id)}
                    >
                      {t('حساب فرعي', 'Add sub-account')}
                    </Button>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() =>
                        openEditName({ id: selected.id, code: selected.code, name: selected.name })
                      }
                    >
                      {t('تعديل الاسم', 'Edit name')}
                    </Button>
                    <Button
                      icon={<SlidersOutlined />}
                      onClick={() =>
                        openReporting({ id: selected.id, code: selected.code, name: selected.name })
                      }
                    >
                      {t('التقارير', 'Reporting')}
                    </Button>
                    <Tooltip
                      title={
                        selectedIsLeaf
                          ? ''
                          : t('لا يمكن حذف حساب له فروع', 'Cannot delete an account with sub-accounts')
                      }
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!selectedIsLeaf}
                        onClick={() => confirmDelete(selected)}
                      >
                        {t('حذف', 'Delete')}
                      </Button>
                    </Tooltip>
                  </Space>

                  <Button
                    block
                    type="link"
                    icon={<SettingOutlined />}
                    onClick={() => goToSettings(selected.code)}
                  >
                    {t('عرض في إعدادات الحسابات', 'Open in Account Settings')}
                  </Button>
                </Space>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {accountModals}
    </div>
  );
}
