import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  PageDocument,
  Block,
  createBlockId,
  createPageId,
  SCHEMA_VERSION,
  getBlockDefinition,
  BLOCK_REGISTRY,
  isInnerBlocksBlock,
  type BlockType,
  type StoredPage,
} from '@berg/schema';
import { encodeHashPayload } from '@berg/core';
import { loadStore, saveStore, type StoreData, createDemoStore as buildDemoStore, getDefaultHeightForType, getLayoutItems, compactLayoutVertical } from '@/lib';
import { BlockInserter, BlockToolbarSidebar, BLOCK_DRAG_TYPE } from '@/components/blocks';
import { GridCanvas, ViewportSwitcher, VIEWPORT_WIDTHS, type Viewport } from '@/components/canvas';
import { PageMetaEditor, PageList, AddPageModal } from '@/features/pages';
import { SiteSettings } from '@/features/settings';
import { SidebarTabs, LayersTree } from '@/features/sidebar';
import { BuilderHeaderPreview, BuilderFooterPreview } from '@/features/layout';
import './App.css';
/* Storefront block styles for pixel-perfect preview (same as storefront) */
import '../../storefront/src/App.css';

const HISTORY_LIMIT = 50;

const defaultDocument = (): PageDocument => ({
  version: SCHEMA_VERSION,
  meta: { title: 'Untitled Page', description: '' },
  blocks: [],
});

const cloneStoreData = (value: StoreData): StoreData => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as StoreData;
};

function ensureStore(): StoreData {
  const s = loadStore();
  if (s.pages.length > 0) return s;
  const id = createPageId();
  const newPage: StoredPage = {
    id,
    slug: 'home',
    document: defaultDocument(),
  };
  const next: StoreData = { pages: [newPage], homeSlug: 'home' };
  saveStore(next);
  return next;
}

export default function App() {
  const [store, setStore] = useState<StoreData>(ensureStore);
  const [undoStack, setUndoStack] = useState<StoreData[]>([]);
  const [redoStack, setRedoStack] = useState<StoreData[]>([]);
  const pages = store.pages;
  const [currentPageId, setCurrentPageId] = useState<string | null>(() => {
    const s = ensureStore();
    return s.pages.length > 0 ? s.pages[0].id : null;
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [addPageModalOpen, setAddPageModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<null | { id: string; x: number; y: number }>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const transactionSnapshotRef = useRef<StoreData | null>(null);

  const currentPage = useMemo(
    () => pages.find((p) => p.id === currentPageId) ?? null,
    [pages, currentPageId]
  );
  const doc = currentPage?.document ?? defaultDocument();

  const pushCappedSnapshot = useCallback((snapshot: StoreData, appendTo: StoreData[]) => {
    const next = [...appendTo, cloneStoreData(snapshot)];
    return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
  }, []);

  const applyStoreChange = useCallback(
    (updater: (prev: StoreData) => StoreData) => {
      setStore((prevStore) => {
        const nextStore = cloneStoreData(updater(prevStore));
        setUndoStack((prevUndo) => pushCappedSnapshot(prevStore, prevUndo));
        setRedoStack([]);
        saveStore(nextStore);
        return nextStore;
      });
    },
    [pushCappedSnapshot]
  );

  const persistStore = useCallback(
    (updater: (prev: StoreData) => StoreData) => {
      applyStoreChange(updater);
    },
    [applyStoreChange]
  );

  const persistStoreWithoutHistory = useCallback((updater: (prev: StoreData) => StoreData) => {
    setStore((prevStore) => {
      const nextStore = cloneStoreData(updater(prevStore));
      saveStore(nextStore);
      return nextStore;
    });
  }, []);

  const persistPages = useCallback(
    (next: StoredPage[]) => {
      persistStore((prev) => ({ ...prev, pages: next }));
    },
    [persistStore]
  );

  const persistPagesWithoutHistory = useCallback(
    (next: StoredPage[]) => {
      persistStoreWithoutHistory((prev) => ({ ...prev, pages: next }));
    },
    [persistStoreWithoutHistory]
  );

  const setHomeSlug = useCallback(
    (slug: string) => {
      persistStore((prev) => ({ ...prev, homeSlug: slug }));
    },
    [persistStore]
  );

  const setSiteTitle = useCallback(
    (siteTitle: string) => {
      persistStore((prev) => ({ ...prev, siteTitle: siteTitle.trim() || undefined }));
    },
    [persistStore]
  );

  const setApiBaseUrl = useCallback(
    (apiBaseUrl: string) => {
      persistStore((prev) => ({ ...prev, apiBaseUrl: apiBaseUrl.trim() || undefined }));
    },
    [persistStore]
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      persistStore((prev) => ({ ...prev, theme }));
    },
    [persistStore]
  );

  const setAccentColor = useCallback(
    (accentColor: string) => {
      persistStore((prev) => ({ ...prev, accentColor: accentColor.trim() || undefined }));
    },
    [persistStore]
  );

  const setUseDemoData = useCallback(
    (useDemoData: boolean) => {
      persistStore((prev) => ({ ...prev, useDemoData: useDemoData || undefined }));
    },
    [persistStore]
  );

  const setHeaderStyle = useCallback(
    (headerStyle: StoreData['headerStyle']) => {
      persistStore((prev) => ({ ...prev, headerStyle: headerStyle && Object.keys(headerStyle).length ? headerStyle : undefined }));
    },
    [persistStore]
  );
  const setFooterStyle = useCallback(
    (footerStyle: StoreData['footerStyle']) => {
      persistStore((prev) => ({ ...prev, footerStyle: footerStyle && Object.keys(footerStyle).length ? footerStyle : undefined }));
    },
    [persistStore]
  );

  const setFooterLinks = useCallback(
    (footerLinks: StoreData['footerLinks']) => {
      persistStore((prev) => ({ ...prev, footerLinks: footerLinks ?? undefined }));
    },
    [persistStore]
  );
  const setButtonStyle = useCallback(
    (buttonStyle: StoreData['buttonStyle']) => {
      persistStore((prev) => ({ ...prev, buttonStyle: buttonStyle && Object.keys(buttonStyle).length ? buttonStyle : undefined }));
    },
    [persistStore]
  );

  const setHiddenFromHeader = useCallback(
    (pageId: string, show: boolean) => {
      persistStore((prev) => {
        const hidden = prev.hiddenFromHeader ?? [];
        const next = show ? hidden.filter((id) => id !== pageId) : [...hidden, pageId];
        return { ...prev, hiddenFromHeader: next.length ? next : undefined };
      });
    },
    [persistStore]
  );

  const createDemoStore = useCallback(() => {
    const next = buildDemoStore({ useDemoData: store.useDemoData ?? true });
    saveStore(next);
    setUndoStack((prevUndo) => pushCappedSnapshot(store, prevUndo));
    setRedoStack([]);
    setStore(next);
    const firstPageId = next.pages[0]?.id ?? null;
    setCurrentPageId(firstPageId);
    setSelectedBlockId(null);
  }, [store, store.useDemoData, pushCappedSnapshot]);

  const getSafeCurrentPageId = useCallback((candidateId: string | null, nextStore: StoreData) => {
    if (candidateId && nextStore.pages.some((p) => p.id === candidateId)) return candidateId;
    return nextStore.pages[0]?.id ?? null;
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const restored = prevUndo[prevUndo.length - 1]!;
      const nextUndo = prevUndo.slice(0, -1);
      setStore((currentStore) => {
        setRedoStack((prevRedo) => pushCappedSnapshot(currentStore, prevRedo));
        const restoredSnapshot = cloneStoreData(restored);
        saveStore(restoredSnapshot);
        setCurrentPageId((currentId) => getSafeCurrentPageId(currentId, restoredSnapshot));
        return restoredSnapshot;
      });
      return nextUndo;
    });
  }, [getSafeCurrentPageId, pushCappedSnapshot]);

  const handleRedo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const restored = prevRedo[prevRedo.length - 1]!;
      const nextRedo = prevRedo.slice(0, -1);
      setStore((currentStore) => {
        setUndoStack((prevUndo) => pushCappedSnapshot(currentStore, prevUndo));
        const restoredSnapshot = cloneStoreData(restored);
        saveStore(restoredSnapshot);
        setCurrentPageId((currentId) => getSafeCurrentPageId(currentId, restoredSnapshot));
        return restoredSnapshot;
      });
      return nextRedo;
    });
  }, [getSafeCurrentPageId, pushCappedSnapshot]);

  // Apply theme and accent to document (builder UI)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', store.theme || 'dark');
    if (store.accentColor) root.style.setProperty('--accent', store.accentColor);
    else root.style.removeProperty('--accent');
  }, [store.theme, store.accentColor]);

  const updateDoc = useCallback(
    (updater: (d: PageDocument) => PageDocument) => {
      if (!currentPage) return;
      const nextDoc = updater(currentPage.document);
      persistPages(
        pages.map((p) =>
          p.id === currentPageId ? { ...p, document: nextDoc } : p
        )
      );
    },
    [currentPage, currentPageId, pages, persistPages]
  );

  const updateDocWithoutHistory = useCallback(
    (updater: (d: PageDocument) => PageDocument) => {
      if (!currentPage) return;
      const nextDoc = updater(currentPage.document);
      persistPagesWithoutHistory(
        pages.map((p) =>
          p.id === currentPageId ? { ...p, document: nextDoc } : p
        )
      );
    },
    [currentPage, currentPageId, pages, persistPagesWithoutHistory]
  );

  const beginHistoryTransaction = useCallback(() => {
    if (transactionSnapshotRef.current) return;
    transactionSnapshotRef.current = cloneStoreData(store);
  }, [store]);

  const endHistoryTransaction = useCallback(() => {
    const snapshot = transactionSnapshotRef.current;
    if (!snapshot) return;
    transactionSnapshotRef.current = null;
    setUndoStack((prevUndo) => pushCappedSnapshot(snapshot, prevUndo));
    setRedoStack([]);
  }, [pushCappedSnapshot]);

  const updateMeta = useCallback(
    (meta: Partial<PageDocument['meta']>) => {
      updateDoc((d) => ({ ...d, meta: { ...d.meta, ...meta } }));
    },
    [updateDoc]
  );

  const updatePageSlug = useCallback(
    (newSlug: string) => {
      if (!currentPageId) return;
      persistPages(
        pages.map((p) => (p.id === currentPageId ? { ...p, slug: newSlug } : p))
      );
    },
    [currentPageId, pages, persistPages]
  );

  const updatePagePublished = useCallback(
    (published: boolean) => {
      if (!currentPageId) return;
      persistPages(
        pages.map((p) => (p.id === currentPageId ? { ...p, published } : p))
      );
    },
    [currentPageId, pages, persistPages]
  );

  const openAddPageModal = useCallback(() => setAddPageModalOpen(true), []);
  const closeAddPageModal = useCallback(() => setAddPageModalOpen(false), []);

  const openContextMenu = useCallback((id: string, clientX: number, clientY: number) => {
    // Simple clamping so the menu stays visible without measuring its exact size.
    const menuW = 220;
    const menuH = 260;
    const margin = 8;
    const x = Math.max(margin, Math.min(clientX, window.innerWidth - menuW - margin));
    const y = Math.max(margin, Math.min(clientY + 2, window.innerHeight - menuH - margin));
    setContextMenu({ id, x, y });
    setSelectedBlockId(id);
  }, []);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    const onMouseDown = (e: MouseEvent) => {
      const el = contextMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setContextMenu(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [contextMenu]);

  const addPageConfirm = useCallback(
    (title: string, slug: string) => {
      const id = createPageId();
      const doc = defaultDocument();
      const newPage: StoredPage = {
        id,
        slug,
        document: { ...doc, meta: { ...doc.meta, title } },
        published: true,
      };
      persistPages([...pages, newPage]);
      setCurrentPageId(id);
      setSelectedBlockId(null);
      setAddPageModalOpen(false);
    },
    [pages, persistPages]
  );

  const selectPage = useCallback((id: string) => {
    setCurrentPageId(id);
    setSelectedBlockId(null);
  }, []);

  const deletePage = useCallback(
    (id: string) => {
      const deleted = pages.find((p) => p.id === id);
      const next = pages.filter((p) => p.id !== id);
      persistStore((prev) => {
        const nextStore = { ...prev, pages: next };
        if (deleted && prev.homeSlug === deleted.slug && next.length > 0) {
          nextStore.homeSlug = next[0].slug;
        } else if (next.length === 0) {
          nextStore.homeSlug = undefined;
        }
        return nextStore;
      });
      if (currentPageId === id) {
        setCurrentPageId(next.length > 0 ? next[0].id : null);
      }
      setSelectedBlockId(null);
    },
    [pages, currentPageId, persistStore]
  );

  const insertBlock = useCallback(
    (type: BlockType, index?: number) => {
      const def = getBlockDefinition(type);
      const id = createBlockId();
      const defaultH = getDefaultHeightForType(type);
      const i = index ?? doc.blocks.length;
      const block: Block = {
        id,
        type,
        attributes: {
          ...def.defaultAttributes,
          layout: { x: 0, y: 0, w: 12, h: defaultH, minW: 1, minH: 1 },
          gridColumnSpan: 12,
          gridColumnStart: 1,
        },
      };
      if (type === 'core/columns') {
        (block as { innerBlocks?: Block[] }).innerBlocks = [
          { id: createBlockId(), type: 'core/column', attributes: {} },
          { id: createBlockId(), type: 'core/column', attributes: {} },
        ];
        (block.attributes as Record<string, unknown>).columnWidths = [50, 50];
      }
      if (type === 'core/form') {
        (block as { innerBlocks?: Block[] }).innerBlocks = [];
      }
      const newBlocks = [...doc.blocks.slice(0, i), block, ...doc.blocks.slice(i)];
      const layout = getLayoutItems(newBlocks);
      const compacted = compactLayoutVertical(layout.map((item, idx) => ({ ...item, y: idx * 100 })));
      const updates = new Map(compacted.map((item) => [item.i, { x: item.x, y: item.y, w: item.w, h: item.h }]));
      updateDoc((d) => ({
        ...d,
        blocks: newBlocks.map((b) => {
          const l = updates.get(b.id);
          if (!l) return b;
          return {
            ...b,
            attributes: {
              ...b.attributes,
              layout: l,
              gridColumnSpan: l.w,
              gridColumnStart: l.x + 1,
            },
          };
        }),
      }));
      setSelectedBlockId(id);
    },
    [doc.blocks, updateDoc]
  );

  const insertChildBlock = useCallback(
    (parentId: string, type: BlockType, xPct: number, yPct: number) => {
      const def = getBlockDefinition(type);
      const id = createBlockId();
      const clampPct = (n: number) => Math.max(0, Math.min(100, n));

      // Default child size in % of the parent’s rendered box.
      // (Position is already percent-based; this makes the initial layer visible even
      // before the user resizes.)
      const wPctDefault = 25;
      const hPctDefault = 10;

      const clampLayerX = (n: number) => clampPct(n);
      const clampLayerY = (n: number) => clampPct(n);

      const findAnyBlock = (blocks: Block[], searchId: string): Block | null => {
        for (const b of blocks) {
          if (b.id === searchId) return b;
          if (isInnerBlocksBlock(b) && b.innerBlocks) {
            const found = findAnyBlock(b.innerBlocks, searchId);
            if (found) return found;
          }
          const anyB = b as unknown as { children?: Block[] };
          if (Array.isArray(anyB.children)) {
            const found = findAnyBlock(anyB.children, searchId);
            if (found) return found;
          }
        }
        return null;
      };

      updateDoc((d) => {
        const parentBlock = findAnyBlock(d.blocks, parentId);
        const parentHRows = ((parentBlock?.attributes?.layout as { h?: number } | undefined)?.h ?? 2) as number;
        const childHRows = Math.max(1, Math.round((hPctDefault / 100) * parentHRows));

        const childX = clampLayerX(xPct);
        const childY = clampLayerY(yPct);
        const maxX = 100 - wPctDefault;
        const maxY = 100 - hPctDefault;

        const xPctClamped = Math.max(0, Math.min(maxX, childX));
        const yPctClamped = Math.max(0, Math.min(maxY, childY));

        const child: Block = {
          id,
          type,
          attributes: {
            ...def.defaultAttributes,
            layerLayout: { xPct: xPctClamped, yPct: yPctClamped, wPct: wPctDefault, hPct: hPctDefault },
            // Used by BlockEditor overlay preview for initial height.
            layout: { x: 0, y: 0, w: 12, h: childHRows, minW: 1, minH: 1 },
            gridColumnSpan: 12,
            gridColumnStart: 1,
          },
        };

        const insertIntoReal = (blocks: Block[]): Block[] =>
          blocks.map((b) => {
            if (b.id === parentId) {
              const anyB = b as unknown as { children?: Block[] };
              const existing = Array.isArray(anyB.children) ? anyB.children : [];
              return { ...b, children: [...existing, child] };
            }

            const anyB = b as unknown as { innerBlocks?: Block[]; children?: Block[] };
            const nextInner =
              isInnerBlocksBlock(b) && Array.isArray(anyB.innerBlocks) ? insertIntoReal(anyB.innerBlocks) : anyB.innerBlocks;
            const nextChildren = Array.isArray(anyB.children) ? insertIntoReal(anyB.children) : anyB.children;

            const innerChanged = nextInner !== anyB.innerBlocks;
            const childrenChanged = nextChildren !== anyB.children;

            if (!innerChanged && !childrenChanged) return b;

            return {
              ...b,
              ...(innerChanged && isInnerBlocksBlock(b) ? { innerBlocks: nextInner } : {}),
              ...(childrenChanged ? { children: nextChildren } : {}),
            };
          });

        return { ...d, blocks: insertIntoReal(d.blocks) };
      });
      setSelectedBlockId(id);
    },
    [updateDoc]
  );

  const updateBlock = useCallback(
    (id: string, attrs: Record<string, unknown> & { innerBlocks?: Block[]; children?: Block[] }) => {
      const { innerBlocks: innerBlocksUpdate, children: childrenUpdate, ...restAttrs } = attrs;
      const applyUpdate = (blocks: Block[]): Block[] =>
        blocks.map((b) => {
          if (b.id === id) {
            const next: Block = {
              ...b,
              attributes: { ...b.attributes, ...restAttrs },
            };
            if (innerBlocksUpdate !== undefined && isInnerBlocksBlock(next)) {
              (next as { innerBlocks?: Block[] }).innerBlocks = innerBlocksUpdate;
            }
            if (childrenUpdate !== undefined) {
              (next as { children?: Block[] }).children = childrenUpdate;
            }
            return next;
          }
          const anyB = b as unknown as { innerBlocks?: Block[]; children?: Block[] };
          const nextInner =
            isInnerBlocksBlock(b) && Array.isArray(anyB.innerBlocks) ? applyUpdate(anyB.innerBlocks) : anyB.innerBlocks;
          const nextChildren = Array.isArray(anyB.children) ? applyUpdate(anyB.children) : anyB.children;
          const innerChanged = nextInner !== anyB.innerBlocks;
          const childrenChanged = nextChildren !== anyB.children;
          if (!innerChanged && !childrenChanged) return b;
          return {
            ...b,
            ...(innerChanged && isInnerBlocksBlock(b) ? { innerBlocks: nextInner } : {}),
            ...(childrenChanged ? { children: nextChildren } : {}),
          };
        });
      updateDoc((d) => ({
        ...d,
        blocks: applyUpdate(d.blocks),
      }));
    },
    [updateDoc]
  );

  const updateBlockTransient = useCallback(
    (id: string, attrs: Record<string, unknown> & { innerBlocks?: Block[]; children?: Block[] }) => {
      const { innerBlocks: innerBlocksUpdate, children: childrenUpdate, ...restAttrs } = attrs;
      const applyUpdate = (blocks: Block[]): Block[] =>
        blocks.map((b) => {
          if (b.id === id) {
            const next: Block = {
              ...b,
              attributes: { ...b.attributes, ...restAttrs },
            };
            if (innerBlocksUpdate !== undefined && isInnerBlocksBlock(next)) {
              (next as { innerBlocks?: Block[] }).innerBlocks = innerBlocksUpdate;
            }
            if (childrenUpdate !== undefined) {
              (next as { children?: Block[] }).children = childrenUpdate;
            }
            return next;
          }
          const anyB = b as unknown as { innerBlocks?: Block[]; children?: Block[] };
          const nextInner =
            isInnerBlocksBlock(b) && Array.isArray(anyB.innerBlocks) ? applyUpdate(anyB.innerBlocks) : anyB.innerBlocks;
          const nextChildren = Array.isArray(anyB.children) ? applyUpdate(anyB.children) : anyB.children;
          const innerChanged = nextInner !== anyB.innerBlocks;
          const childrenChanged = nextChildren !== anyB.children;
          if (!innerChanged && !childrenChanged) return b;
          return {
            ...b,
            ...(innerChanged && isInnerBlocksBlock(b) ? { innerBlocks: nextInner } : {}),
            ...(childrenChanged ? { children: nextChildren } : {}),
          };
        });
      updateDocWithoutHistory((d) => ({
        ...d,
        blocks: applyUpdate(d.blocks),
      }));
    },
    [updateDocWithoutHistory]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      const remove = (blocks: Block[]): Block[] =>
        blocks
          .filter((b) => b.id !== id)
          .map((b) => {
            const anyB = b as unknown as { innerBlocks?: Block[]; children?: Block[] };
            const nextInner = isInnerBlocksBlock(b) && anyB.innerBlocks ? remove(anyB.innerBlocks) : anyB.innerBlocks;
            const nextChildren = Array.isArray(anyB.children) ? remove(anyB.children) : anyB.children;
            return {
              ...(b as Block),
              ...(nextInner !== anyB.innerBlocks && { innerBlocks: nextInner }),
              ...(nextChildren !== anyB.children && { children: nextChildren }),
            };
          });
      updateDoc((d) => ({ ...d, blocks: remove(d.blocks) }));
      if (selectedBlockId === id) setSelectedBlockId(null);
    },
    [updateDoc, selectedBlockId]
  );

  const deleteSelectedBlock = useCallback((id: string) => {
    const inDoc = doc.blocks.find((b) => b.id === id);
    if (inDoc) {
      deleteBlock(id);
      return;
    }
    const nested = findBlockInTree(doc.blocks, id);
    if (!nested) return;
    const { block, parent, container } = nested;
    if (container === 'innerBlocks') {
      const nextInner = ((parent as { innerBlocks?: Block[] }).innerBlocks ?? []).filter((f) => f.id !== block.id);
      updateBlock(parent.id, { innerBlocks: nextInner });
    } else {
      const nextChildren = ((parent as unknown as { children?: Block[] }).children ?? []).filter((f) => f.id !== block.id);
      updateBlock(parent.id, { children: nextChildren });
    }
    setSelectedBlockId(parent.id);
  }, [deleteBlock, doc.blocks, updateBlock]);

  const moveBlock = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const idx = doc.blocks.findIndex((b) => b.id === id);
      if (idx === -1) return;
      const next = direction === 'up' ? idx - 1 : idx + 1;
      if (next < 0 || next >= doc.blocks.length) return;
      const blocks = [...doc.blocks];
      [blocks[idx], blocks[next]] = [blocks[next]!, blocks[idx]!];
      const layout = getLayoutItems(blocks);
      const compacted = compactLayoutVertical(layout.map((item, i) => ({ ...item, y: i * 100 })));
      const updates = new Map(compacted.map((item) => [item.i, { x: item.x, y: item.y, w: item.w, h: item.h }]));
      updateDoc((d) => ({
        ...d,
        blocks: blocks.map((b) => {
          const l = updates.get(b.id);
          if (!l) return b;
          return {
            ...b,
            attributes: {
              ...b.attributes,
              layout: l,
              gridColumnSpan: l.w,
              gridColumnStart: l.x + 1,
            },
          };
        }),
      }));
    },
    [doc.blocks, updateDoc]
  );

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        !!target.closest('[contenteditable="true"]') ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace' && e.key !== 'Del') return;
      if (!selectedBlockId) return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      deleteSelectedBlock(selectedBlockId);
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [deleteSelectedBlock, selectedBlockId]);

  function findBlockInTree(blocks: Block[], id: string): null | {
    block: Block;
    parent: Block;
    index: number;
    container: 'innerBlocks' | 'children';
  } {
    for (const parent of blocks) {
      if (isInnerBlocksBlock(parent) && Array.isArray(parent.innerBlocks)) {
        const idx = parent.innerBlocks.findIndex((b) => b.id === id);
        if (idx >= 0) {
          return { block: parent.innerBlocks[idx]!, parent, index: idx, container: 'innerBlocks' };
        }
        const deeper = findBlockInTree(parent.innerBlocks, id);
        if (deeper) return deeper;
      }
      const anyParent = parent as unknown as { children?: Block[] };
      if (Array.isArray(anyParent.children)) {
        const idx = anyParent.children.findIndex((b) => b.id === id);
        if (idx >= 0) {
          return { block: anyParent.children[idx]!, parent, index: idx, container: 'children' };
        }
        const deeper = findBlockInTree(anyParent.children, id);
        if (deeper) return deeper;
      }
    }
    return null;
  }

  const handleDropBlock = useCallback(
    (type: BlockType, droppedLayout: { x: number; y: number; w: number; h: number }) => {
      const def = getBlockDefinition(type);
      const id = createBlockId();
      const block: Block = {
        id,
        type,
        attributes: {
          ...def.defaultAttributes,
          layout: { ...droppedLayout, minW: 1, minH: 1 },
          gridColumnSpan: droppedLayout.w,
          gridColumnStart: droppedLayout.x + 1,
        },
      };
      if (type === 'core/columns') {
        (block as { innerBlocks?: Block[] }).innerBlocks = [
          { id: createBlockId(), type: 'core/column', attributes: {} },
          { id: createBlockId(), type: 'core/column', attributes: {} },
        ];
        (block.attributes as Record<string, unknown>).columnWidths = [50, 50];
      }
      if (type === 'core/form') {
        (block as { innerBlocks?: Block[] }).innerBlocks = [];
      }
      const formFieldTypes = ['core/form-input', 'core/form-select', 'core/form-textarea'] as const;
      if (formFieldTypes.includes(type as typeof formFieldTypes[number])) {
        const layout = getLayoutItems(doc.blocks);
        const dropY = droppedLayout.y;
        const formItem = layout.find(
          (item) => {
            const b = doc.blocks.find((x) => x.id === item.i);
            return b?.type === 'core/form' && dropY >= item.y && dropY < item.y + item.h;
          }
        );
        const formBlockData = formItem ? doc.blocks.find((b) => b.id === formItem.i) : null;
        if (formBlockData && isInnerBlocksBlock(formBlockData)) {
          const def = getBlockDefinition(type);
          const fieldBlock: Block = {
            id: createBlockId(),
            type,
            attributes: { ...def.defaultAttributes },
          };
          const newInner = [...(formBlockData.innerBlocks ?? []), fieldBlock];
          updateDoc((d) => ({
            ...d,
            blocks: d.blocks.map((b) =>
              b.id === formBlockData.id
                ? { ...b, innerBlocks: newInner }
                : b
            ),
          }));
          setSelectedBlockId(fieldBlock.id);
          return;
        }
        /* No form at drop position: create new form with this field */
        const formId = createBlockId();
        const def = getBlockDefinition(type);
        const fieldBlock: Block = {
          id: createBlockId(),
          type,
          attributes: { ...def.defaultAttributes },
        };
        const formBlock: Block = {
          id: formId,
          type: 'core/form',
          attributes: {
            ...getBlockDefinition('core/form').defaultAttributes,
            layout: { ...droppedLayout, minW: 1, minH: 1 },
            gridColumnSpan: droppedLayout.w,
            gridColumnStart: droppedLayout.x + 1,
          },
        };
        (formBlock as { innerBlocks?: Block[] }).innerBlocks = [fieldBlock];
        const sortedIndices = doc.blocks
          .map((b, i) => {
            const ly = (b.attributes?.layout as { y?: number })?.y ?? 0;
            return { i, y: ly };
          })
          .sort((a, b) => a.y - b.y);
        const insertIdx = sortedIndices.findIndex(({ y }) => y >= droppedLayout.y);
        const i = insertIdx >= 0 ? sortedIndices[insertIdx]!.i : doc.blocks.length;
        const newBlocks = [...doc.blocks.slice(0, i), formBlock, ...doc.blocks.slice(i)];
        const layoutItems = getLayoutItems(newBlocks);
        const compacted = compactLayoutVertical(layoutItems.map((item, idx) => ({ ...item, y: idx * 100 })));
        const updates = new Map(compacted.map((item) => [item.i, { x: item.x, y: item.y, w: item.w, h: item.h }]));
        updateDoc((d) => ({
          ...d,
          blocks: newBlocks.map((b) => {
            const l = updates.get(b.id);
            if (!l) return b;
            return {
              ...b,
              attributes: {
                ...b.attributes,
                layout: l,
                gridColumnSpan: l.w,
                gridColumnStart: l.x + 1,
              },
            };
          }),
        }));
        setSelectedBlockId(formId);
        return;
      }
      const dropY = droppedLayout.y;
      const sortedIndices = doc.blocks
        .map((b, i) => {
          const ly = (b.attributes?.layout as { y?: number })?.y ?? 0;
          return { i, y: ly };
        })
        .sort((a, b) => a.y - b.y);
      const insertIdx = sortedIndices.findIndex(({ y }) => y >= dropY);
      const i = insertIdx >= 0 ? sortedIndices[insertIdx]!.i : doc.blocks.length;
      const newBlocks = [...doc.blocks.slice(0, i), block, ...doc.blocks.slice(i)];
      const layout = getLayoutItems(newBlocks);
      const compacted = compactLayoutVertical(layout.map((item, idx) => ({ ...item, y: idx * 100 })));
      const updates = new Map(compacted.map((item) => [item.i, { x: item.x, y: item.y, w: item.w, h: item.h }]));
      updateDoc((d) => ({
        ...d,
        blocks: newBlocks.map((b) => {
          const l = updates.get(b.id);
          if (!l) return b;
          return {
            ...b,
            attributes: {
              ...b.attributes,
              layout: l,
              gridColumnSpan: l.w,
              gridColumnStart: l.x + 1,
            },
          };
        }),
      }));
      setSelectedBlockId(id);
    },
    [doc.blocks, updateDoc]
  );

  const handleLayoutChange = useCallback(
    (layouts: { lg: Array<{ i: string; x: number; y: number; w: number; h: number }> }) => {
      void layouts;
    },
    []
  );

  const handleLayoutCommit = useCallback(
    (layouts: { lg: Array<{ i: string; x: number; y: number; w: number; h: number }> }) => {
      const lg = layouts.lg;
      if (!lg || !currentPage) return;
      const updates = new Map(lg.map((item) => [item.i, { layout: { x: item.x, y: item.y, w: item.w, h: item.h }, gridColumnSpan: item.w, gridColumnStart: item.x + 1 }]));
      const orderByY = new Map(lg.map((item) => [item.i, { y: item.y, x: item.x, sortKey: item.y * 1000 + item.x }]));
      updateDoc((d) => {
        const updated = d.blocks.map((b) => {
          const attrs = updates.get(b.id);
          if (!attrs) return b;
          return { ...b, attributes: { ...b.attributes, ...attrs } };
        });
        const sorted = [...updated].sort((a, b) => {
          const keyA = orderByY.get(a.id)?.sortKey ?? 0;
          const keyB = orderByY.get(b.id)?.sortKey ?? 0;
          return keyA - keyB;
        });
        return { ...d, blocks: sorted };
      });
    },
    [currentPage, updateDoc]
  );

  const openStorefront = useCallback(() => {
    const base =
      (import.meta as { env?: { DEV?: boolean } }).env?.DEV
        ? 'http://localhost:5174'
        : `${window.location.origin}/storefront`;
    const payload = {
      pages,
      siteTitle: store.siteTitle,
      homeSlug: store.homeSlug,
      apiBaseUrl: store.apiBaseUrl,
      theme: store.theme,
      accentColor: store.accentColor,
      useDemoData: store.useDemoData,
      headerStyle: store.headerStyle,
      footerStyle: store.footerStyle,
      footerLinks: store.footerLinks,
      buttonStyle: store.buttonStyle,
      hiddenFromHeader: store.hiddenFromHeader,
      openSlug: currentPage?.slug,
    };
    const hash = encodeHashPayload(payload);
    const targetPath = currentPage?.slug === store.homeSlug ? '/' : `/${currentPage?.slug || ''}`;
    window.open(`${base}${targetPath}#${hash}`, '_blank');
  }, [pages, store.siteTitle, store.homeSlug, store.theme, store.accentColor, store.useDemoData, currentPage?.slug]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">Berg</div>
        <div className="app-actions">
          <div className="history-actions" role="group" aria-label="History actions">
            <button
              type="button"
              className="btn btn-icon"
              onClick={handleUndo}
              aria-label="Undo"
              title="Undo"
              disabled={!canUndo}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10a6 6 0 0 1 0 12h-1" />
              </svg>
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={handleRedo}
              aria-label="Redo"
              title="Redo"
              disabled={!canRedo}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 14 5-5-5-5" />
                <path d="M20 9H10a6 6 0 0 0 0 12h1" />
              </svg>
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={openStorefront}>
            View storefront
          </button>
        </div>
      </header>

      <div className="app-body">
        <div className={`sidebar-collapsible sidebar-collapsible-left ${leftSidebarCollapsed ? 'sidebar-collapsible--collapsed' : ''}`}>
          <button
            type="button"
            className={`sidebar-collapsible-toggle sidebar-collapsible-arrow ${!leftSidebarCollapsed ? 'sidebar-arrow-collapse' : ''}`}
            onClick={() => setLeftSidebarCollapsed((v) => !v)}
            aria-label={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
            title={leftSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <aside className="sidebar sidebar-left">
            <SidebarTabs
            hasPages={true}
            insertContent={
              currentPage ? (
                <>
                  <BlockInserter
                    blocks={Object.values(BLOCK_REGISTRY)}
                    onInsert={insertBlock}
                  />
                </>
              ) : (
                <p className="sidebar-empty-hint">Select or add a page to insert blocks.</p>
              )
            }
            siteContent={
              <SiteSettings
                siteTitle={store.siteTitle ?? ''}
                apiBaseUrl={store.apiBaseUrl ?? ''}
                theme={store.theme ?? 'dark'}
                accentColor={store.accentColor ?? '#3b82f6'}
                useDemoData={store.useDemoData ?? false}
                buttonStyle={store.buttonStyle ?? {}}
                onSiteTitleChange={setSiteTitle}
                onApiBaseUrlChange={setApiBaseUrl}
                onThemeChange={setTheme}
                onAccentColorChange={setAccentColor}
                onUseDemoDataChange={setUseDemoData}
                onButtonStyleChange={setButtonStyle}
                onCreateDemoStore={createDemoStore}
              />
            }
            pagesContent={
              currentPage ? (
                <>
                  <PageList
                    pages={pages}
                    currentPageId={currentPageId}
                    homeSlug={store.homeSlug ?? null}
                    hiddenFromHeader={store.hiddenFromHeader}
                    onSelect={selectPage}
                    onAdd={openAddPageModal}
                    onDelete={deletePage}
                    onSetHome={setHomeSlug}
                    onToggleShowInHeader={setHiddenFromHeader}
                  />
                  <PageMetaEditor
                    meta={doc.meta}
                    slug={currentPage.slug}
                    published={currentPage.published !== false}
                    otherSlugs={new Set(pages.filter((p) => p.id !== currentPageId).map((p) => p.slug))}
                    onChange={updateMeta}
                    onSlugChange={updatePageSlug}
                    onPublishedChange={updatePagePublished}
                  />
                </>
              ) : (
                <p className="sidebar-empty-hint">Add a page first.</p>
              )
            }
            layersContent={
              currentPage ? (
                <LayersTree
                  blocks={doc.blocks}
                  selectedBlockId={selectedBlockId}
                  onSelect={setSelectedBlockId}
                  onDelete={deleteSelectedBlock}
                />
              ) : (
                <p className="sidebar-empty-hint">Add a page first.</p>
              )
            }
          />
          </aside>
        </div>

        <main className="canvas-wrap">
          <div
            className="canvas-viewport-wrap"
            style={{
              width: '100%',
              maxWidth:
                leftSidebarCollapsed && (!selectedBlockId || rightSidebarCollapsed)
                  ? 'none'
                  : VIEWPORT_WIDTHS[viewport],
            }}
          >
            <div className="canvas-toolbar">
              <ViewportSwitcher viewport={viewport} onViewportChange={setViewport} />
            </div>
            <BuilderHeaderPreview
              siteTitle={store.siteTitle ?? ''}
              pages={pages}
              homeSlug={store.homeSlug}
              hiddenFromHeader={store.hiddenFromHeader}
              headerStyle={store.headerStyle ?? {}}
              onHeaderStyleChange={setHeaderStyle}
              onToggleShowInHeader={setHiddenFromHeader}
              viewport={viewport}
            />
            <div className="canvas">
              {!currentPage ? (
                <div className="empty-state">
                  <p>No pages yet. Add a page from the sidebar to start.</p>
                </div>
              ) : doc.blocks.length === 0 ? (
                <div
                  className="empty-state canvas-drop-zone"
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes(BLOCK_DRAG_TYPE)) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      e.currentTarget.classList.add('canvas-drop-zone--active');
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      e.currentTarget.classList.remove('canvas-drop-zone--active');
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('canvas-drop-zone--active');
                    const type = e.dataTransfer.getData(BLOCK_DRAG_TYPE) as BlockType;
                    if (type) insertBlock(type, 0);
                  }}
                >
                  <p>Drag a block from the sidebar here, or add one below to start building.</p>
                  <button type="button" className="btn btn-secondary" onClick={() => insertBlock('core/paragraph', 0)} style={{ marginTop: '1rem' }}>
                    Add first block
                  </button>
                </div>
              ) : (
                <GridCanvas
                  blocks={doc.blocks}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onUpdateBlock={updateBlock}
                  onTransientUpdateBlock={updateBlockTransient}
                  onHistoryTransactionStart={beginHistoryTransaction}
                  onHistoryTransactionEnd={endHistoryTransaction}
                  onDeleteBlock={deleteBlock}
                  onMoveBlock={moveBlock}
                  onLayoutChange={handleLayoutChange}
                  onLayoutCommit={handleLayoutCommit}
                  onDropBlock={handleDropBlock}
                  onInsertBlock={(type, index) => insertBlock(type, index)}
                onInsertChildBlock={insertChildBlock}
                  toolbarInSidebar={!!selectedBlockId}
                  canvasWidth={
                    leftSidebarCollapsed && (!selectedBlockId || rightSidebarCollapsed)
                      ? Math.max(
                          VIEWPORT_WIDTHS[viewport],
                          typeof window !== 'undefined' ? window.innerWidth - (selectedBlockId ? 88 : 44) : 1200
                        )
                      : VIEWPORT_WIDTHS[viewport]
                  }
                  apiBaseUrl={store.apiBaseUrl}
                  useDemoData={store.useDemoData ?? false}
                  onRequestContextMenu={openContextMenu}
                />
              )}
              <BuilderFooterPreview
              siteTitle={store.siteTitle ?? ''}
              pages={pages}
              homeSlug={store.homeSlug}
              hiddenFromHeader={store.hiddenFromHeader}
              footerLinks={store.footerLinks}
              footerStyle={store.footerStyle ?? {}}
              onFooterStyleChange={setFooterStyle}
              onFooterLinksChange={setFooterLinks}
              viewport={viewport}
            />
            </div>
          </div>
        </main>

        {contextMenu &&
          (() => {
            const inDoc = doc.blocks.find((b) => b.id === contextMenu.id);
            const idx = doc.blocks.findIndex((b) => b.id === contextMenu.id);
            const nested = !inDoc ? findBlockInTree(doc.blocks, contextMenu.id) : null;
            const block = inDoc ? (idx >= 0 ? doc.blocks[idx] : null) : nested?.block ?? null;
            if (!block) return null;

            const isNestedField = !!nested;
            const parentForm = nested?.parent ?? null;
            const nestedContainer = nested?.container ?? null;
            const blockTypeLabel = block.type.replace('core/', '').replace('store/', '');

            const canInsertAbove = !isNestedField && idx >= 0;
            const canInsertBelow = !isNestedField && idx >= 0;

            const canMoveUp = isNestedField
              ? (() => {
                  if (!parentForm || !nestedContainer) return false;
                  const innerOrChildren =
                    nestedContainer === 'innerBlocks'
                      ? ((parentForm as unknown as { innerBlocks?: Block[] }).innerBlocks ?? [])
                      : ((parentForm as unknown as { children?: Block[] }).children ?? []);
                  const i = innerOrChildren.findIndex((f) => f.id === block.id);
                  return i > 0;
                })()
              : idx > 0;

            const canMoveDown = isNestedField
              ? (() => {
                  if (!parentForm || !nestedContainer) return false;
                  const innerOrChildren =
                    nestedContainer === 'innerBlocks'
                      ? ((parentForm as unknown as { innerBlocks?: Block[] }).innerBlocks ?? [])
                      : ((parentForm as unknown as { children?: Block[] }).children ?? []);
                  const i = innerOrChildren.findIndex((f) => f.id === block.id);
                  return i >= 0 && i < innerOrChildren.length - 1;
                })()
              : idx >= 0 && idx < doc.blocks.length - 1;

            const handleDelete = () => {
              if (isNestedField && parentForm && nestedContainer) {
                if (nestedContainer === 'innerBlocks') {
                  const nextInner =
                    ((parentForm as unknown as { innerBlocks?: Block[] }).innerBlocks ?? []).filter((f) => f.id !== block.id);
                  updateBlock(parentForm.id, { innerBlocks: nextInner });
                } else {
                  const nextChildren =
                    ((parentForm as unknown as { children?: Block[] }).children ?? []).filter((f) => f.id !== block.id);
                  updateBlock(parentForm.id, { children: nextChildren });
                }
                setSelectedBlockId(parentForm.id);
              } else {
                deleteBlock(block.id);
              }
              setContextMenu(null);
            };

            const handleInsertAbove = () => {
              if (isNestedField) return;
              if (idx < 0) return;
              insertBlock('core/paragraph', idx);
              setContextMenu(null);
            };

            const handleInsertBelow = () => {
              if (isNestedField) return;
              if (idx < 0) return;
              insertBlock('core/paragraph', idx + 1);
              setContextMenu(null);
            };

            const handleMoveUp = () => {
              if (isNestedField && parentForm && nestedContainer) {
                const innerOrChildren =
                  nestedContainer === 'innerBlocks'
                    ? ((parentForm as unknown as { innerBlocks?: Block[] }).innerBlocks ?? [])
                    : ((parentForm as unknown as { children?: Block[] }).children ?? []);
                const i = innerOrChildren.findIndex((f) => f.id === block.id);
                if (i <= 0) return;
                const next = [...innerOrChildren];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                if (nestedContainer === 'innerBlocks') updateBlock(parentForm.id, { innerBlocks: next });
                else updateBlock(parentForm.id, { children: next });
              } else {
                if (idx <= 0) return;
                moveBlock(block.id, 'up');
              }
              setContextMenu(null);
            };

            const handleMoveDown = () => {
              if (isNestedField && parentForm && nestedContainer) {
                const innerOrChildren =
                  nestedContainer === 'innerBlocks'
                    ? ((parentForm as unknown as { innerBlocks?: Block[] }).innerBlocks ?? [])
                    : ((parentForm as unknown as { children?: Block[] }).children ?? []);
                const i = innerOrChildren.findIndex((f) => f.id === block.id);
                if (i < 0 || i >= innerOrChildren.length - 1) return;
                const next = [...innerOrChildren];
                [next[i], next[i + 1]] = [next[i + 1], next[i]];
                if (nestedContainer === 'innerBlocks') updateBlock(parentForm.id, { innerBlocks: next });
                else updateBlock(parentForm.id, { children: next });
              } else {
                if (idx >= doc.blocks.length - 1) return;
                moveBlock(block.id, 'down');
              }
              setContextMenu(null);
            };

            return (
              <div
                ref={contextMenuRef}
                className="block-context-menu"
                role="menu"
                style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                <div className="block-context-menu-header">
                  <span className="block-context-menu-title">{blockTypeLabel}</span>
                  <span className="block-context-menu-hint">Actions</span>
                </div>
                <div className="block-context-menu-actions">
                  {canInsertAbove && (
                    <button type="button" className="toolbar-btn" onClick={handleInsertAbove} role="menuitem">
                      Insert above
                    </button>
                  )}
                  {canInsertBelow && (
                    <button type="button" className="toolbar-btn" onClick={handleInsertBelow} role="menuitem">
                      Insert below
                    </button>
                  )}
                  {canMoveUp && (
                    <button type="button" className="toolbar-btn" onClick={handleMoveUp} role="menuitem">
                      Move up
                    </button>
                  )}
                  {canMoveDown && (
                    <button type="button" className="toolbar-btn" onClick={handleMoveDown} role="menuitem">
                      Move down
                    </button>
                  )}
                  <button type="button" className="toolbar-btn danger" onClick={handleDelete} role="menuitem">
                    Delete
                  </button>
                </div>
              </div>
            );
          })()}

        {currentPage && selectedBlockId && (() => {
          const inDoc = doc.blocks.find((b) => b.id === selectedBlockId);
          const idx = doc.blocks.findIndex((b) => b.id === selectedBlockId);
          const nested = !inDoc ? findBlockInTree(doc.blocks, selectedBlockId) : null;
          const block = inDoc ? (idx >= 0 ? doc.blocks[idx] : null) : nested?.block ?? null;
          if (!block) return null;
          const isNestedField = !!nested;
          const parentForm = nested?.parent ?? null;
          const nestedContainer = nested?.container ?? null;
          const isLayerChildSelected = isNestedField && nestedContainer === 'children';
          const layerParentSpan = 12;

          const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

          const findAnyBlockById = (blocks: Block[], id: string): Block | null => {
            for (const b of blocks) {
              if (b.id === id) return b;
              if (isInnerBlocksBlock(b) && Array.isArray(b.innerBlocks)) {
                const deeper = findAnyBlockById(b.innerBlocks, id);
                if (deeper) return deeper;
              }
              const anyParent = b as unknown as { children?: Block[] };
              if (Array.isArray(anyParent.children)) {
                const deeper = findAnyBlockById(anyParent.children, id);
                if (deeper) return deeper;
              }
            }
            return null;
          };

          const computeHeightPxById = (blockId: string): number => {
            const found = findAnyBlockById(doc.blocks, blockId);
            if (!found) return 40;

            const parentInfo = findBlockInTree(doc.blocks, blockId);
            if (!parentInfo) {
              const layout = found.attributes?.layout as { h?: number } | undefined;
              return (layout?.h ?? 2) * 40;
            }

            if (parentInfo.container === 'children') {
              const layerLayout = found.attributes?.layerLayout as { hPct?: number } | undefined;
              const hPct = typeof layerLayout?.hPct === 'number' ? layerLayout.hPct : 10;
              const parentHeightPx = computeHeightPxById(parentInfo.parent.id);
              return (parentHeightPx * hPct) / 100;
            }

            const layout = found.attributes?.layout as { h?: number } | undefined;
            return (layout?.h ?? 2) * 40;
          };

          const layerParentHeightPx = isLayerChildSelected && parentForm ? computeHeightPxById(parentForm.id) : 0;

          const layout = block.attributes?.layout as { w?: number; x?: number } | undefined;
          const topGridColumnSpan = layout?.w ?? (block.attributes?.gridColumnSpan as number) ?? 12;
          const topGridColumnStart = layout?.x != null ? layout.x + 1 : ((block.attributes?.gridColumnStart as number) ?? 1);

          const selectedLayerLayout = isLayerChildSelected
            ? (block.attributes?.layerLayout as { xPct?: number; yPct?: number; wPct?: number; hPct?: number } | undefined)
            : undefined;

          const layerChildWPct = typeof selectedLayerLayout?.wPct === 'number' ? selectedLayerLayout.wPct : 25;
          const layerChildXPct = typeof selectedLayerLayout?.xPct === 'number' ? selectedLayerLayout.xPct : 0;

          const SPAN_OPTIONS = [12, 6, 4, 3, 2, 1] as const;
          const layerChildGridColumnSpan = SPAN_OPTIONS.reduce((best, span) => {
            const pctForSpan = (span / layerParentSpan) * 100;
            const bestPctForSpan = (best / layerParentSpan) * 100;
            return Math.abs(pctForSpan - layerChildWPct) < Math.abs(bestPctForSpan - layerChildWPct) ? span : best;
          }, 12 as (typeof SPAN_OPTIONS)[number]);

          const rawLayerChildStart = ((layerChildXPct / 100) * layerParentSpan) + 1;
          const layerChildGridColumnStart = clamp(Math.round(rawLayerChildStart), 1, 13 - layerChildGridColumnSpan);

          const gridColumnSpan = isLayerChildSelected ? layerChildGridColumnSpan : topGridColumnSpan;
          const gridColumnStart = isLayerChildSelected ? layerChildGridColumnStart : topGridColumnStart;
          const handleUpdate = (attrs: Record<string, unknown> & { innerBlocks?: Block[] }) => {
            if (isNestedField && parentForm && nestedContainer) {
              if (nestedContainer === 'innerBlocks') {
                const nextInner =
                  (parentForm as { innerBlocks?: Block[] }).innerBlocks?.map((f) =>
                    f.id === block.id ? { ...f, attributes: { ...f.attributes, ...attrs } } : f
                  ) ?? [];
                updateBlock(parentForm.id, { innerBlocks: nextInner });
              } else {
                const nextChildren =
                  (parentForm as unknown as { children?: Block[] }).children?.map((f) =>
                    f.id === block.id ? { ...f, attributes: { ...f.attributes, ...attrs } } : f
                  ) ?? [];
                updateBlock(parentForm.id, { children: nextChildren });
              }
            } else {
              updateBlock(block.id, attrs);
            }
          };
          const handleDelete = () => {
            if (isNestedField && parentForm && nestedContainer) {
              if (nestedContainer === 'innerBlocks') {
                const nextInner =
                  (parentForm as { innerBlocks?: Block[] }).innerBlocks?.filter((f) => f.id !== block.id) ?? [];
                updateBlock(parentForm.id, { innerBlocks: nextInner });
              } else {
                const nextChildren =
                  (parentForm as unknown as { children?: Block[] }).children?.filter((f) => f.id !== block.id) ?? [];
                updateBlock(parentForm.id, { children: nextChildren });
              }
              setSelectedBlockId(parentForm.id);
            } else {
              deleteBlock(block.id);
            }
          };
          return (
            <div className={`sidebar-collapsible sidebar-collapsible-right ${rightSidebarCollapsed ? 'sidebar-collapsible--collapsed' : ''}`}>
              <button
                type="button"
                className="sidebar-collapsible-toggle sidebar-collapsible-arrow"
                onClick={() => setRightSidebarCollapsed((v) => !v)}
                aria-label={rightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
                title={rightSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {rightSidebarCollapsed ? (
                    <polyline points="15 18 9 12 15 6" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </button>
              <aside className="sidebar sidebar-right">
                <BlockToolbarSidebar
                block={block}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onMoveUp={isNestedField && parentForm
                  ? (() => {
                      if (!nestedContainer) return undefined;
                      const arr =
                        nestedContainer === 'innerBlocks'
                          ? ((parentForm as { innerBlocks?: Block[] }).innerBlocks ?? [])
                          : (((parentForm as unknown as { children?: Block[] }).children ?? []) as Block[]);
                      const i = arr.findIndex((f) => f.id === block.id);
                      if (i <= 0) return undefined;
                      return () => {
                        const next = [...arr];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        if (nestedContainer === 'innerBlocks') updateBlock(parentForm.id, { innerBlocks: next });
                        else updateBlock(parentForm.id, { children: next });
                      };
                    })()
                  : idx > 0 ? () => moveBlock(block.id, 'up') : undefined}
                onMoveDown={isNestedField && parentForm
                  ? (() => {
                      if (!nestedContainer) return undefined;
                      const arr =
                        nestedContainer === 'innerBlocks'
                          ? ((parentForm as { innerBlocks?: Block[] }).innerBlocks ?? [])
                          : (((parentForm as unknown as { children?: Block[] }).children ?? []) as Block[]);
                      const i = arr.findIndex((f) => f.id === block.id);
                      if (i < 0 || i >= arr.length - 1) return undefined;
                      return () => {
                        const next = [...arr];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        if (nestedContainer === 'innerBlocks') updateBlock(parentForm.id, { innerBlocks: next });
                        else updateBlock(parentForm.id, { children: next });
                      };
                    })()
                  : idx < doc.blocks.length - 1 ? () => moveBlock(block.id, 'down') : undefined}
                onInsertAbove={!isNestedField ? () => insertBlock('core/paragraph', idx) : undefined}
                onInsertBelow={!isNestedField ? () => insertBlock('core/paragraph', idx + 1) : undefined}
                gridColumnSpan={gridColumnSpan}
                gridColumnStart={gridColumnStart}
                isLayerChildSelected={isLayerChildSelected}
                layerParentHeightPx={layerParentHeightPx}
                layerParentSpan={layerParentSpan}
                onGridChange={
                  isLayerChildSelected
                    ? (span, start) => {
                        const layerLayout = (block.attributes?.layerLayout as Record<string, unknown> | undefined) ?? {};
                        const wPct = (span / layerParentSpan) * 100;
                        const xPct = ((start - 1) / layerParentSpan) * 100;
                        const xPctClamped = Math.min(xPct, 100 - wPct);
                        handleUpdate({
                          layerLayout: {
                            ...layerLayout,
                            xPct: xPctClamped,
                            wPct,
                          },
                        });
                      }
                    : (span, start) =>
                        handleUpdate({
                          layout: {
                            ...(block.attributes?.layout as object || {}),
                            x: start - 1,
                            w: span,
                            h: (block.attributes?.layout as { h?: number })?.h ?? 2,
                          },
                          gridColumnSpan: span,
                          gridColumnStart: start,
                        })
                }
                />
              </aside>
            </div>
          );
        })()}
      </div>

      <AddPageModal
        isOpen={addPageModalOpen}
        existingSlugs={new Set(pages.map((p) => p.slug))}
        onClose={closeAddPageModal}
        onConfirm={addPageConfirm}
      />
    </div>
  );
}
