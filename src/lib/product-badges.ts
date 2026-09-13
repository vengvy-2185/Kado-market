const NEW_WINDOW_DAYS = 14;
// A fixed floor rather than "top N of this page" -- top-N would relabel
// products as "popular" just because a filtered/sorted view happens to
// have few results, which is misleading. A sale-count floor stays true
// regardless of which page or filter a product is shown on.
const POPULAR_SALES_THRESHOLD = 10;

export function isNewProduct(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= 0 && ageMs <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function isPopularProduct(salesCount: number | null | undefined): boolean {
  return (salesCount ?? 0) >= POPULAR_SALES_THRESHOLD;
}
