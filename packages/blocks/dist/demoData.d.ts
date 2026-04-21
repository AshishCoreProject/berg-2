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
export declare const DEMO_PRODUCTS: DemoProduct[];
export declare const DEMO_COLLECTIONS: DemoCollection[];
export declare function getDemoProductByHandle(handle: string): DemoProduct | undefined;
export declare function getDemoProductById(id: string): DemoProduct | undefined;
export declare function getDemoProductsByCollectionHandle(handle: string): DemoProduct[];
export declare function getDemoCollectionByHandle(handle: string): DemoCollection | undefined;
//# sourceMappingURL=demoData.d.ts.map