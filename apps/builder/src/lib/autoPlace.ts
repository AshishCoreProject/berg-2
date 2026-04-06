/**
 * Grid layout helpers (like storefront-page-builder).
 */
export interface GridLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type LayoutItem = { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number };

export type Viewport = 'desktop' | 'tablet' | 'mobile';
type LayoutByViewport = Partial<Record<Viewport, GridLayout>>;

/**
 * Puzzle-style compaction: stack blocks with no gaps and no overlaps.
 * When you increase a block's height, blocks below move down. When you decrease it, they move up.
 * Each block is placed immediately under the previous one (by y order).
 */
export function compactLayoutVertical(
  layout: Array<{ i: string; x: number; y: number; w: number; h: number }>
): Array<{ i: string; x: number; y: number; w: number; h: number }> {
  if (layout.length === 0) return layout;
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  let bottom = 0;
  return sorted.map((item) => {
    const newY = bottom;
    bottom = newY + item.h;
    return { ...item, y: newY };
  });
}

/** Default grid height (in rows) per block type so the drag area fits the content. */
export function getDefaultHeightForType(blockType: string): number {
  if (blockType === 'core/hero') return 14;
  if (blockType === 'store/product-grid' || blockType === 'store/collection-list') return 16;
  if (blockType === 'store/testimonials' || blockType === 'store/newsletter') return 10;
  if (blockType === 'store/trust-badges') return 4;
  if (blockType === 'store/promo-banner') return 2;
  if (blockType === 'core/custom') return 13;
  if (blockType === 'core/box') return 4;
  if (blockType === 'core/paragraph') return 4;
  if (blockType === 'core/heading') return 3;
  if (blockType === 'core/form') return 12;
  return 2;
}

/** Minimum height (floor) only for blocks that must not shrink below content (hero, product-grid, collection-list). Set to 0 to allow user to resize smaller; content will clip to cell. */
function getMinHeightForType(_blockType: string): number {
  return 0;
}

/** Build layout items for react-grid-layout from blocks. */
export function getLayoutItems(
  blocks: { id: string; type?: string; attributes?: Record<string, unknown> }[],
  viewport: Viewport = 'desktop'
): LayoutItem[] {
  return blocks.map((b, i) => {
    const byViewport = (b.attributes?.layoutByViewport as LayoutByViewport | undefined) ?? undefined;
    const layout = byViewport?.[viewport] as GridLayout | undefined;
    const hasLayout = layout && typeof layout.x === 'number' && typeof layout.y === 'number';
    const w = hasLayout ? (layout.w ?? 12) : ((b.attributes?.gridColumnSpan as number) ?? 12);
    const x = hasLayout ? layout.x : ((b.attributes?.gridColumnStart as number) ?? 1) - 1;
    const y = hasLayout ? layout.y : i * 2;
    const defaultH = getDefaultHeightForType(b.type ?? '');
    const rawH = (layout != null && typeof layout.h === 'number') ? layout.h : (hasLayout ? (layout?.h ?? defaultH) : defaultH);
    const minHForType = getMinHeightForType(b.type ?? '');
    const h = minHForType > 0 ? Math.max(rawH || 2, minHForType) : (rawH || 2);
    return { i: b.id, x, y, w, h, minW: 1, minH: 1 };
  });
}

/** Place new block below existing ones. Uses same type-based height as getLayoutItems for consistency. */
export function autoPlace(
  blocks: { id: string; type?: string; attributes?: Record<string, unknown> }[],
  w = 12,
  h = 2,
  viewport: Viewport = 'desktop'
): GridLayout {
  if (!blocks.length) return { x: 0, y: 0, w, h, minW: 1, minH: 1 };
  let maxY = 0;
  blocks.forEach((b, i) => {
    const byViewport = (b.attributes?.layoutByViewport as LayoutByViewport | undefined) ?? undefined;
    const layout = byViewport?.[viewport] as GridLayout | undefined;
    const hasLayout = layout && typeof layout.x === 'number' && typeof layout.y === 'number';
    const y = hasLayout ? layout.y : i * 2;
    const defaultH = getDefaultHeightForType(b.type ?? '');
    const rawH = (layout != null && typeof layout.h === 'number') ? layout.h : defaultH;
    const minHForType = getMinHeightForType(b.type ?? '');
    const effectiveH = minHForType > 0 ? Math.max(rawH || 2, minHForType) : (rawH || 2);
    maxY = Math.max(maxY, y + effectiveH);
  });
  return { x: 0, y: maxY, w, h, minW: 1, minH: 1 };
}
