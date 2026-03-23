/**
 * Demo data for storefront when "Use demo data" is enabled (no API required).
 */

export interface DemoProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  handle: string;
}

export interface DemoCollection {
  id: string;
  title: string;
  description?: string;
  handle: string;
  image?: string;
  productCount: number;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'demo-1',
    title: 'Classic White Tee',
    description: 'Soft cotton crew neck. Perfect for everyday wear.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    handle: 'classic-white-tee',
  },
  {
    id: 'demo-2',
    title: 'Denim Jacket',
    description: 'Vintage wash denim jacket with a relaxed fit.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    handle: 'denim-jacket',
  },
  {
    id: 'demo-3',
    title: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones. 30hr battery.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    handle: 'wireless-headphones',
  },
  {
    id: 'demo-4',
    title: 'Leather Watch',
    description: 'Minimal leather strap watch with stainless case.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    handle: 'leather-watch',
  },
  {
    id: 'demo-5',
    title: 'Running Sneakers',
    description: 'Lightweight running shoes with cushioned sole.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    handle: 'running-sneakers',
  },
  {
    id: 'demo-6',
    title: 'Canvas Backpack',
    description: 'Durable canvas backpack with laptop sleeve.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    handle: 'canvas-backpack',
  },
];

export const DEMO_COLLECTIONS: DemoCollection[] = [
  { id: 'col-1', title: 'Apparel', description: 'T-shirts, jackets, and more.', handle: 'apparel', productCount: 2 },
  { id: 'col-2', title: 'Electronics', description: 'Audio and accessories.', handle: 'electronics', productCount: 1 },
  { id: 'col-3', title: 'Accessories', description: 'Watches, bags, and shoes.', handle: 'accessories', productCount: 3 },
];

export function getDemoProductByHandle(handle: string): DemoProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.handle === handle);
}

export function getDemoProductById(id: string): DemoProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === id);
}

/** Map collection handle to products for demo. */
const COLLECTION_TO_PRODUCTS: Record<string, string[]> = {
  apparel: ['classic-white-tee', 'denim-jacket'],
  electronics: ['wireless-headphones'],
  accessories: ['leather-watch', 'running-sneakers', 'canvas-backpack'],
};

export function getDemoProductsByCollectionHandle(handle: string): DemoProduct[] {
  const handles = COLLECTION_TO_PRODUCTS[handle];
  if (!handles) return [];
  return handles
    .map((h) => DEMO_PRODUCTS.find((p) => p.handle === h))
    .filter((p): p is DemoProduct => !!p);
}

export function getDemoCollectionByHandle(handle: string): DemoCollection | undefined {
  return DEMO_COLLECTIONS.find((c) => c.handle === handle);
}
