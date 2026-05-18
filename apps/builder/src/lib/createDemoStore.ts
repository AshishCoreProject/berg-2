import type { Block } from "@berg/schema";
import {
  createBlockId,
  createPageId,
  getBlockDefinition,
  type StoredPage,
  type PageDocument,
} from "@berg/schema";
import type { StoreData } from "./storage";
import { ensureAuthPages } from "./ensureAuthPages";
import { autoPlace, getDefaultHeightForType } from "./autoPlace";

const SCHEMA_VERSION = 1;

function makeBlock(
  type: Block["type"],
  attrs: Record<string, unknown>,
  existingBlocks: Block[] = [],
): Block {
  const id = createBlockId();
  const def = getBlockDefinition(type);
  const defaultH = getDefaultHeightForType(type);
  const layout = autoPlace(existingBlocks, 12, defaultH);
  return {
    id,
    type,
    attributes: {
      ...def.defaultAttributes,
      ...attrs,
      layoutByViewport: {
        desktop: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: 1,
          minH: 1,
        },
        tablet: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: 1,
          minH: 1,
        },
        mobile: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: 1,
          minH: 1,
        },
      },
      gridColumnSpan: 12,
      gridColumnStart: 1,
    },
  };
}

/**
 * Creates an impressive full demo e-commerce store: Home, Products, About, and Product details.
 * Designed to wow clients with a polished, professional storefront.
 */
export function createDemoStore(
  options: { useDemoData?: boolean } = {},
): StoreData {
  const { useDemoData = true } = options;

  const homeId = createPageId();
  const productsId = createPageId();
  const aboutId = createPageId();
  const detailsId = createPageId();

  const homeBlocks: Block[] = [];
  homeBlocks.push(
    makeBlock(
      "store/promo-banner",
      {
        text: "✨ Free shipping on orders over $50 • 30-day easy returns",
        backgroundColor: "#1e3a5f",
        textColor: "#ffffff",
      },
      homeBlocks,
    ),
  );
  homeBlocks.push(
    makeBlock(
      "core/hero",
      {
        title: "Premium Quality, Everyday Style",
        subtitle:
          "Discover curated essentials for modern living. From wardrobe staples to tech accessories.",
        ctaText: "Shop the collection",
        ctaUrl: "/products",
        heroBackgroundColor: "#0f172a",
      },
      homeBlocks,
    ),
  );
  homeBlocks.push(makeBlock("store/trust-badges", {}, homeBlocks));
  homeBlocks.push(
    makeBlock(
      "core/heading",
      { content: "Featured products", level: 2 },
      homeBlocks,
    ),
  );
  homeBlocks.push(
    makeBlock(
      "store/product-grid",
      { title: "", limit: 10, apiEndpoint: "/v1/products" },
      homeBlocks,
    ),
  );
  homeBlocks.push(
    makeBlock(
      "store/collection-list",
      { title: "Shop by category" },
      homeBlocks,
    ),
  );
  homeBlocks.push(
    makeBlock(
      "store/testimonials",
      {
        title: "Loved by thousands",
        items: [
          {
            quote: "The quality exceeded my expectations. Fast shipping too!",
            author: "Sarah M.",
            rating: 5,
          },
          {
            quote:
              "Best online shopping experience I've had. Will definitely order again.",
            author: "James K.",
            rating: 5,
          },
          {
            quote: "Beautiful products, great prices. Highly recommend!",
            author: "Emma L.",
            rating: 5,
          },
        ],
      },
      homeBlocks,
    ),
  );
  homeBlocks.push(
    makeBlock(
      "store/newsletter",
      {
        title: "Join our newsletter",
        subtitle:
          "Get 10% off your first order. Exclusive deals, new arrivals, and style tips.",
        buttonText: "Subscribe",
      },
      homeBlocks,
    ),
  );

  const productsBlocks: Block[] = [];
  productsBlocks.push(
    makeBlock("core/heading", { content: "All products", level: 1 }),
  );
  productsBlocks.push(
    makeBlock(
      "core/paragraph",
      { content: "Browse our full collection of premium essentials." },
      productsBlocks,
    ),
  );
  productsBlocks.push(
    makeBlock(
      "store/product-grid",
      { title: "", limit: 12, apiEndpoint: "/v1/products" },
      productsBlocks,
    ),
  );

  const aboutBlocks: Block[] = [];
  aboutBlocks.push(
    makeBlock(
      "core/hero",
      {
        title: "About us",
        subtitle:
          "We believe in quality over quantity. Every product is handpicked for design, durability, and value.",
        ctaText: "Shop now",
        ctaUrl: "/products",
        heroBackgroundColor: "#1e293b",
      },
      aboutBlocks,
    ),
  );
  aboutBlocks.push(
    makeBlock(
      "core/paragraph",
      {
        content:
          "Founded with a simple mission: to make premium everyday products accessible to everyone. We partner with trusted makers worldwide to bring you essentials that last.",
      },
      aboutBlocks,
    ),
  );
  aboutBlocks.push(makeBlock("store/trust-badges", {}, aboutBlocks));

  const detailsBlocks: Block[] = [];
  detailsBlocks.push(
    makeBlock("core/paragraph", {
      content:
        'Click any product on the Products page to view its full details. This demo uses sample product data when "Use demo data" is enabled in Site settings.',
    }),
  );

  const homeDoc: PageDocument = {
    version: SCHEMA_VERSION,
    meta: {
      title: "Home",
      description: "Premium quality essentials for everyday life",
    },
    blocks: homeBlocks,
  };
  const productsDoc: PageDocument = {
    version: SCHEMA_VERSION,
    meta: { title: "Products", description: "Browse our full collection" },
    blocks: productsBlocks,
  };
  const aboutDoc: PageDocument = {
    version: SCHEMA_VERSION,
    meta: { title: "About", description: "Our story and values" },
    blocks: aboutBlocks,
  };
  const detailsDoc: PageDocument = {
    version: SCHEMA_VERSION,
    meta: { title: "Product details", description: "Product detail page" },
    blocks: detailsBlocks,
  };

  const pages: StoredPage[] = [
    { id: homeId, slug: "home", document: homeDoc, published: true },
    {
      id: productsId,
      slug: "products",
      document: productsDoc,
      published: true,
    },
    { id: aboutId, slug: "about", document: aboutDoc, published: true },
    {
      id: detailsId,
      slug: "product-details",
      document: detailsDoc,
      published: true,
    },
  ];

  return ensureAuthPages({
    pages,
    siteTitle: "Berg Store",
    homeSlug: "home",
    apiBaseUrl: undefined,
    storeId: undefined,
    theme: "dark",
    accentColor: "#3b82f6",
    useDemoData,
  });
}
