function joinApiUrl(baseUrl, endpoint) {
    const base = baseUrl.trim().replace(/\/+$/, "");
    const ep = endpoint.trim();
    let normalizedEndpoint = ep.startsWith("/") ? ep : `/${ep}`;
    // Backward compatibility for previously-saved block configs using "/products".
    if (/^\/products(\/|$|\?)/i.test(normalizedEndpoint)) {
        normalizedEndpoint = normalizedEndpoint.replace(/^\/products/i, "/v1/products");
    }
    const baseHasV1 = /\/v1$/i.test(base);
    const endpointHasV1 = /^\/v1(\/|$)/i.test(normalizedEndpoint);
    const finalEndpoint = baseHasV1 && endpointHasV1 ? normalizedEndpoint.replace(/^\/v1/i, "") || "/" : normalizedEndpoint;
    return new URL(`${base}${finalEndpoint}`);
}
function stripHtml(value) {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function toHandle(item) {
    if (item.seo?.handle)
        return item.seo.handle;
    if (item.id)
        return item.id;
    const raw = item.title ?? "product";
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function toProduct(item) {
    const images = Array.isArray(item.images)
        ? item.images.filter((v) => typeof v === "string")
        : [];
    const primary = item.primary_image || images[0];
    return {
        id: item.id ?? toHandle(item),
        title: item.title?.trim() || "Untitled product",
        description: item.description_html ? stripHtml(item.description_html) : undefined,
        price: typeof item.default_price_cents === "number" ? item.default_price_cents / 100 : 0,
        image: primary,
        images: images.length ? images : primary ? [primary] : undefined,
        handle: toHandle(item),
    };
}
function emptyPagination(page, limit) {
    return {
        page,
        limit,
        total: 0,
        total_pages: 0,
        next_page: null,
        prev_page: null,
    };
}
export async function listProducts({ apiBaseUrl, endpoint = "/v1/products", limit = 12, page = 1, tenantId, storeId, extraQuery, signal, }) {
    const url = joinApiUrl(apiBaseUrl, endpoint);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));
    if (extraQuery) {
        Object.entries(extraQuery).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "")
                return;
            url.searchParams.set(key, String(value));
        });
    }
    const headers = { accept: "application/json" };
    if (tenantId?.trim())
        headers["X-Tenant-Id"] = tenantId.trim();
    if (storeId?.trim())
        headers["X-Store-Id"] = storeId.trim();
    const res = await fetch(url.toString(), { headers, signal });
    if (!res.ok)
        throw new Error(`API error: ${res.status}`);
    const json = (await res.json());
    const payload = Array.isArray(json) ? { data: json } : json;
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const data = rows.map((row) => toProduct((row ?? {})));
    const pagination = {
        ...emptyPagination(page, limit),
        ...(payload.pagination ?? {}),
        page: Number(payload.pagination?.page ?? page),
        limit: Number(payload.pagination?.limit ?? limit),
        total: Number(payload.pagination?.total ?? data.length),
        total_pages: Number(payload.pagination?.total_pages ?? (data.length ? 1 : 0)),
        next_page: payload.pagination?.next_page === null || payload.pagination?.next_page === undefined
            ? null
            : Number(payload.pagination.next_page),
        prev_page: payload.pagination?.prev_page === null || payload.pagination?.prev_page === undefined
            ? null
            : Number(payload.pagination.prev_page),
    };
    return { data, pagination };
}
export async function getProductById({ apiBaseUrl, productId, endpointPrefix = "/v1/products", tenantId, storeId, signal, }) {
    const safeId = encodeURIComponent(productId.trim());
    const endpoint = `${endpointPrefix.replace(/\/+$/, "")}/${safeId}`;
    const url = joinApiUrl(apiBaseUrl, endpoint);
    const headers = { accept: "application/json" };
    if (tenantId?.trim())
        headers["X-Tenant-Id"] = tenantId.trim();
    if (storeId?.trim())
        headers["X-Store-Id"] = storeId.trim();
    const res = await fetch(url.toString(), { headers, signal });
    if (!res.ok)
        throw new Error(`API error: ${res.status}`);
    const json = (await res.json());
    return toProduct(json ?? {});
}
