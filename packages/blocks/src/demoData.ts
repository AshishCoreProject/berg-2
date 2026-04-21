/**
 * Demo data for storefront when "Use demo data" is enabled (no API required).
 */

export interface DemoProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  /** Extra gallery URLs; first entry should match `image` when both are set. */
  images?: string[];
  handle: string;
  variant_id?: string;
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
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Classic White Tee',
    description: 'Soft cotton crew neck. Perfect for everyday wear.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be46?w=400',
    ],
    handle: 'classic-white-tee',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Denim Jacket',
    description: 'Vintage wash denim jacket with a relaxed fit.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      'https://images.unsplash.com/photo-1576997536859-889075bba308?w=400',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
    ],
    handle: 'denim-jacket',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones. 30hr battery.',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
    ],
    handle: 'wireless-headphones',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    title: 'Leather Watch',
    description: 'Minimal leather strap watch with stainless case.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    handle: 'leather-watch',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    title: 'Running Sneakers',
    description: 'Lightweight running shoes with cushioned sole.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    handle: 'running-sneakers',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    title: 'Canvas Backpack',
    description: 'Durable canvas backpack with laptop sleeve.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    handle: 'canvas-backpack',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    title: 'Wool Crew Sweater',
    description: 'Warm merino blend sweater for cool evenings.',
    price: 64.99,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&auto=format&fit=crop',
    handle: 'wool-crew-sweater',
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    title: 'Slim Fit Chinos',
    description: 'Stretch cotton chinos in a versatile neutral tone.',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
    handle: 'slim-fit-chinos',
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    title: 'Polarized Sunglasses',
    description: 'UV400 lenses with lightweight acetate frame.',
    price: 42.99,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    handle: 'polarized-sunglasses',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Stainless Water Bottle',
    description: 'Insulated 750ml bottle keeps drinks cold 24 hours.',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    handle: 'stainless-water-bottle',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Portable Bluetooth Speaker',
    description: '360° sound and IPX7 waterproof for outdoors.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop',
    handle: 'portable-bluetooth-speaker',
  },
  {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    title: 'USB-C Hub',
    description: '7-in-1 hub: HDMI, SD, USB-A, and pass-through charging.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&auto=format&fit=crop',
    handle: 'usb-c-hub',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    title: 'Linen Button Shirt',
    description: 'Breathable linen blend for warm-weather comfort.',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
    handle: 'linen-button-shirt',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    title: 'Merino Wool Socks (3-pack)',
    description: 'Moisture-wicking crew socks with cushioned sole.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400',
    handle: 'merino-wool-socks',
  },
  {
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    title: 'Ceramic Pour-Over Set',
    description: 'Dripper and carafe for café-style coffee at home.',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    handle: 'ceramic-pour-over-set',
  },
  {
    id: '12121212-1212-4121-8121-121212121212',
    title: 'Yoga Mat',
    description: 'Non-slip 5mm mat with alignment lines.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
    handle: 'yoga-mat',
  },
  {
    id: '13131313-1313-4131-8131-131313131313',
    title: 'Leather Card Wallet',
    description: 'Slim profile holds cards and folded bills.',
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    handle: 'leather-card-wallet',
  },
  {
    id: '14141414-1414-4141-8141-141414141414',
    title: 'Desk Lamp LED',
    description: 'Adjustable arm with warm-to-cool color temperature.',
    price: 55.99,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    handle: 'desk-lamp-led',
  },
  {
    id: '15151515-1515-4151-8151-151515151515',
    title: 'Cotton Hoodie',
    description: 'Mid-weight fleece hoodie with kangaroo pocket.',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    handle: 'cotton-hoodie',
  },
  {
    id: '16161616-1616-4161-8161-161616161616',
    title: 'Travel Duffel Bag',
    description: 'Weekender with shoe compartment and shoulder strap.',
    price: 94.99,
    image: 'https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=400',
    handle: 'travel-duffel-bag',
  },
];

for (const product of DEMO_PRODUCTS) {
  if (!product.variant_id) {
    product.variant_id = `demo-variant-${product.id}`;
  }
}

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
