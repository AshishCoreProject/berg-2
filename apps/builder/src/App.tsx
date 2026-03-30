import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { SidebarTabs } from '@/features/sidebar';
import { BuilderHeaderPreview, BuilderFooterPreview } from '@/features/layout';
import './App.css';
/* Storefront block styles for pixel-perfect preview (same as storefront) */
import '../../storefront/src/App.css';

const defaultDocument = (): PageDocument => ({
  version: SCHEMA_VERSION,
  meta: { title: 'Untitled Page', description: '' },
  blocks: [],
});

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

  const currentPage = useMemo(
    () => pages.find((p) => p.id === currentPageId) ?? null,
    [pages, currentPageId]
  );
  const doc = currentPage?.document ?? defaultDocument();

  const persistStore = useCallback((updater: (prev: StoreData) => StoreData) => {
    setStore((prev) => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const persistPages = useCallback(
    (next: StoredPage[]) => {
      persistStore((prev) => ({ ...prev, pages: next }));
    },
    [persistStore]
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
    setStore(next);
    const firstPageId = next.pages[0]?.id ?? null;
    setCurrentPageId(firstPageId);
    setSelectedBlockId(null);
  }, [store.useDemoData]);

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

  const updateBlock = useCallback(
    (id: string, attrs: Record<string, unknown> & { innerBlocks?: Block[] }) => {
      const { innerBlocks: innerBlocksUpdate, ...restAttrs } = attrs;
      updateDoc((d) => ({
        ...d,
        blocks: d.blocks.map((b) => {
          if (b.id !== id) return b;
          const next: Block = {
            ...b,
            attributes: { ...b.attributes, ...restAttrs },
          };
          if (innerBlocksUpdate !== undefined && isInnerBlocksBlock(next)) {
            (next as { innerBlocks?: Block[] }).innerBlocks = innerBlocksUpdate;
          }
          return next;
        }),
      }));
    },
    [updateDoc]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      const remove = (blocks: Block[]): Block[] =>
        blocks
          .filter((b) => b.id !== id)
          .map((b) =>
            isInnerBlocksBlock(b) && b.innerBlocks
              ? { ...b, innerBlocks: remove(b.innerBlocks) }
              : b
          );
      updateDoc((d) => ({ ...d, blocks: remove(d.blocks) }));
      if (selectedBlockId === id) setSelectedBlockId(null);
    },
    [updateDoc, selectedBlockId]
  );

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">Berg</div>
        <div className="app-actions">
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
                  onDeleteBlock={deleteBlock}
                  onMoveBlock={moveBlock}
                  onLayoutChange={handleLayoutChange}
                  onDropBlock={handleDropBlock}
                  onInsertBlock={(type, index) => insertBlock(type, index)}
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

        {currentPage && selectedBlockId && (() => {
          function findBlock(blocks: Block[], id: string): { block: Block; parent: Block | null; index: number } | null {
            for (let i = 0; i < blocks.length; i++) {
              if (blocks[i].id === id) return { block: blocks[i], parent: null, index: i };
              const b = blocks[i];
              if (isInnerBlocksBlock(b) && b.innerBlocks) {
                const found = findBlock(b.innerBlocks, id);
                if (found) return { ...found, parent: found.parent ?? b };
              }
            }
            return null;
          }
          const inDoc = doc.blocks.find((b) => b.id === selectedBlockId);
          const idx = doc.blocks.findIndex((b) => b.id === selectedBlockId);
          const nested = !inDoc ? (() => {
            for (const b of doc.blocks) {
              if (isInnerBlocksBlock(b) && b.innerBlocks) {
                const found = findBlock(b.innerBlocks, selectedBlockId);
                if (found) return { block: found.block, parent: b };
              }
            }
            return null;
          })() : null;
          const block = inDoc ? (idx >= 0 ? doc.blocks[idx] : null) : nested?.block ?? null;
          if (!block) return null;
          const isNestedField = !!nested;
          const parentForm = nested?.parent ?? null;
          const layout = block.attributes?.layout as { w?: number; x?: number } | undefined;
          const gridColumnSpan = (layout?.w ?? (block.attributes?.gridColumnSpan as number) ?? 12);
          const gridColumnStart = (layout?.x != null ? (layout.x + 1) : ((block.attributes?.gridColumnStart as number) ?? 1));
          const handleUpdate = (attrs: Record<string, unknown> & { innerBlocks?: Block[] }) => {
            if (isNestedField && parentForm) {
              const nextInner = (parentForm as { innerBlocks?: Block[] }).innerBlocks?.map((f) =>
                f.id === block.id ? { ...f, attributes: { ...f.attributes, ...attrs } } : f
              ) ?? [];
              updateBlock(parentForm.id, { innerBlocks: nextInner });
            } else {
              updateBlock(block.id, attrs);
            }
          };
          const handleDelete = () => {
            if (isNestedField && parentForm) {
              const nextInner = (parentForm as { innerBlocks?: Block[] }).innerBlocks?.filter((f) => f.id !== block.id) ?? [];
              updateBlock(parentForm.id, { innerBlocks: nextInner });
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
                      const inner = (parentForm as { innerBlocks?: Block[] }).innerBlocks ?? [];
                      const i = inner.findIndex((f) => f.id === block.id);
                      if (i <= 0) return undefined;
                      return () => {
                        const next = [...inner];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        updateBlock(parentForm.id, { innerBlocks: next });
                      };
                    })()
                  : idx > 0 ? () => moveBlock(block.id, 'up') : undefined}
                onMoveDown={isNestedField && parentForm
                  ? (() => {
                      const inner = (parentForm as { innerBlocks?: Block[] }).innerBlocks ?? [];
                      const i = inner.findIndex((f) => f.id === block.id);
                      if (i < 0 || i >= inner.length - 1) return undefined;
                      return () => {
                        const next = [...inner];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        updateBlock(parentForm.id, { innerBlocks: next });
                      };
                    })()
                  : idx < doc.blocks.length - 1 ? () => moveBlock(block.id, 'down') : undefined}
                onInsertAbove={!isNestedField ? () => insertBlock('core/paragraph', idx) : undefined}
                onInsertBelow={!isNestedField ? () => insertBlock('core/paragraph', idx + 1) : undefined}
                gridColumnSpan={gridColumnSpan}
                gridColumnStart={gridColumnStart}
                onGridChange={(span, start) => updateBlock(block.id, {
                  layout: { ...(block.attributes?.layout as object || {}), x: start - 1, w: span, h: (block.attributes?.layout as { h?: number })?.h ?? 2 },
                  gridColumnSpan: span,
                  gridColumnStart: start,
                })}
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
