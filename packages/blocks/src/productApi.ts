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
  variant_id?: string;
  variants?: NormalizedProductVariant[];
  options?: NormalizedProductOption[];
}

export interface NormalizedProductVariant {
  id: string;
  title?: string;
  price?: number;
  image?: string;
  stock?: number;
  option_values?: Record<string, string>;
}

export interface NormalizedProductOption {
  position: number;
  name: string;
  values: string[];
}

type ProductApiItem = {
  id?: string;
  title?: string;
  description_html?: string;
  primary_image?: string;
  images?: unknown[];
  default_price_cents?: number;
  seo?: { handle?: string };
  variant_id?: string;
  variantId?: string;
  variants?: unknown[];
  options?: unknown[];
};

type ProductApiResponse = {
  data?: unknown;
  pagination?: Partial<ProductApiPagination>;
};

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

function joinApiUrl(baseUrl: string, endpoint: string): URL {
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

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function toHandle(item: ProductApiItem): string {
  if (item.seo?.handle) return item.seo.handle;
  if (item.id) return item.id;
  const raw = item.title ?? "product";
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function pickVariantId(item: ProductApiItem): string | undefined {
  const direct = asNonEmptyString(item.variant_id) ?? asNonEmptyString(item.variantId);
  if (direct) return direct;
  if (!Array.isArray(item.variants)) return undefined;
  for (const row of item.variants) {
    if (!row || typeof row !== "object") continue;
    const entry = row as Record<string, unknown>;
    const id = asNonEmptyString(entry.variant_id) ?? asNonEmptyString(entry.variantId) ?? asNonEmptyString(entry.id);
    if (id) return id;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function toOptionsMap(value: unknown): Record<string, string> | undefined {
  const objectValue = asRecord(value);
  if (objectValue) {
    const entries = Object.entries(objectValue)
      .map(([name, raw]) => [name.trim(), asNonEmptyString(raw)] as const)
      .filter(([name, v]) => Boolean(name) && Boolean(v))
      .map(([name, v]) => [name, v as string] as const);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  if (!Array.isArray(value)) return undefined;
  const entries: Array<[string, string]> = [];
  for (const raw of value) {
    const row = asRecord(raw);
    if (!row) continue;
    const name =
      asNonEmptyString(row.name) ??
      asNonEmptyString(row.option_name) ??
      asNonEmptyString(row.option);
    const selected =
      asNonEmptyString(row.value) ??
      asNonEmptyString(row.option_value) ??
      asNonEmptyString(row.selected);
    if (!name || !selected) continue;
    entries.push([name, selected]);
  }
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function toProductOptions(value: unknown): NormalizedProductOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: NormalizedProductOption[] = [];
  value.forEach((raw, idx) => {
    const row = asRecord(raw);
    if (!row) return;
    const name = asNonEmptyString(row.name);
    if (!name) return;
    const position =
      typeof row.position === "number" ? row.position : idx + 1;
    const values = Array.isArray(row.values)
      ? row.values.map((v) => asNonEmptyString(v)).filter((v): v is string => Boolean(v))
      : [];
    rows.push({ position, name, values });
  });
  return rows.length ? rows.sort((a, b) => a.position - b.position) : undefined;
}

function toVariant(row: unknown, options?: NormalizedProductOption[]): NormalizedProductVariant | undefined {
  const entry = asRecord(row);
  if (!entry) return undefined;
  const id =
    asNonEmptyString(entry.variant_id) ??
    asNonEmptyString(entry.variantId) ??
    asNonEmptyString(entry.id);
  if (!id) return undefined;
  const priceCents =
    typeof entry.price_cents === "number"
      ? entry.price_cents
      : typeof entry.default_price_cents === "number"
        ? entry.default_price_cents
        : undefined;
  const arrayOptionValues = Array.isArray(entry.option_values)
    ? entry.option_values.map((v) => asNonEmptyString(v))
    : undefined;
  const option_values_from_array =
    arrayOptionValues && options?.length
      ? Object.fromEntries(
          options
            .map((option, idx) => [option.name, arrayOptionValues[idx]] as const)
            .filter(([name, v]) => Boolean(name) && Boolean(v))
            .map(([name, v]) => [name, v as string] as const),
        )
      : undefined;
  const option_values =
    option_values_from_array ??
    toOptionsMap(entry.option_values) ??
    toOptionsMap(entry.options) ??
    toOptionsMap(entry.optionValues);
  return {
    id,
    title: asNonEmptyString(entry.title),
    price: typeof priceCents === "number" ? priceCents / 100 : undefined,
    image:
      asNonEmptyString(entry.primary_image) ??
      asNonEmptyString(entry.image) ??
      asNonEmptyString(entry.image_url),
    stock: typeof entry.stock === "number" ? entry.stock : undefined,
    option_values,
  };
}

function toProduct(item: ProductApiItem): NormalizedProduct {
  const images = Array.isArray(item.images)
    ? item.images.filter((v): v is string => typeof v === "string")
    : [];
  const primary = item.primary_image || images[0];
  const options = toProductOptions(item.options);
  const variants = Array.isArray(item.variants)
    ? item.variants.map((row) => toVariant(row, options)).filter((row): row is NormalizedProductVariant => Boolean(row))
    : undefined;
  return {
    id: item.id ?? toHandle(item),
    title: item.title?.trim() || "Untitled product",
    description: item.description_html ? stripHtml(item.description_html) : undefined,
    price: typeof item.default_price_cents === "number" ? item.default_price_cents / 100 : 0,
    image: primary,
    images: images.length ? images : primary ? [primary] : undefined,
    handle: toHandle(item),
    variant_id: pickVariantId(item),
    variants: variants?.length ? variants : undefined,
    options,
  };
}

function emptyPagination(page: number, limit: number): ProductApiPagination {
  return {
    page,
    limit,
    total: 0,
    total_pages: 0,
    next_page: null,
    prev_page: null,
  };
}

export async function listProducts({
  apiBaseUrl,
  endpoint = "/v1/products",
  limit = 12,
  page = 1,
  tenantId,
  storeId,
  extraQuery,
  signal,
}: ListProductsOptions): Promise<ListProductsResult> {
  const url = joinApiUrl(apiBaseUrl, endpoint);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));
  if (extraQuery) {
    Object.entries(extraQuery).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  const headers: HeadersInit = { accept: "application/json" };
  if (tenantId?.trim()) headers["X-Tenant-Id"] = tenantId.trim();
  if (storeId?.trim()) headers["X-Store-Id"] = storeId.trim();

  const res = await fetch(url.toString(), { headers, signal });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = (await res.json()) as ProductApiResponse | ProductApiItem[];
  const payload = Array.isArray(json) ? { data: json } : json;
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const data = rows.map((row) => toProduct((row ?? {}) as ProductApiItem));
  const pagination: ProductApiPagination = {
    ...emptyPagination(page, limit),
    ...(payload.pagination ?? {}),
    page: Number(payload.pagination?.page ?? page),
    limit: Number(payload.pagination?.limit ?? limit),
    total: Number(payload.pagination?.total ?? data.length),
    total_pages: Number(payload.pagination?.total_pages ?? (data.length ? 1 : 0)),
    next_page:
      payload.pagination?.next_page === null || payload.pagination?.next_page === undefined
        ? null
        : Number(payload.pagination.next_page),
    prev_page:
      payload.pagination?.prev_page === null || payload.pagination?.prev_page === undefined
        ? null
        : Number(payload.pagination.prev_page),
  };

  return { data, pagination };
}

export async function getProductById({
  apiBaseUrl,
  productId,
  endpointPrefix = "/v1/products",
  tenantId,
  storeId,
  signal,
}: GetProductByIdOptions): Promise<NormalizedProduct> {
  const safeId = encodeURIComponent(productId.trim());
  const endpoint = `${endpointPrefix.replace(/\/+$/, "")}/${safeId}`;
  const url = joinApiUrl(apiBaseUrl, endpoint);
  const headers: HeadersInit = { accept: "application/json" };
  if (tenantId?.trim()) headers["X-Tenant-Id"] = tenantId.trim();
  if (storeId?.trim()) headers["X-Store-Id"] = storeId.trim();
  const res = await fetch(url.toString(), { headers, signal });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = (await res.json()) as ProductApiItem;
  return toProduct(json ?? {});
}
