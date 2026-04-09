export interface ProductApiPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    next_page: number | null;
    prev_page: number | null;
}
export interface NormalizedProduct {
    id: string;
    title: string;
    description?: string;
    price: number;
    image?: string;
    images?: string[];
    handle: string;
}
export interface ListProductsOptions {
    apiBaseUrl: string;
    endpoint?: string;
    limit?: number;
    page?: number;
    tenantId?: string;
    storeId?: string;
    extraQuery?: Record<string, string | number | undefined>;
    signal?: AbortSignal;
}
export interface ListProductsResult {
    data: NormalizedProduct[];
    pagination: ProductApiPagination;
}
export interface GetProductByIdOptions {
    apiBaseUrl: string;
    productId: string;
    endpointPrefix?: string;
    tenantId?: string;
    storeId?: string;
    signal?: AbortSignal;
}
export declare function listProducts({ apiBaseUrl, endpoint, limit, page, tenantId, storeId, extraQuery, signal, }: ListProductsOptions): Promise<ListProductsResult>;
export declare function getProductById({ apiBaseUrl, productId, endpointPrefix, tenantId, storeId, signal, }: GetProductByIdOptions): Promise<NormalizedProduct>;
//# sourceMappingURL=productApi.d.ts.map