import { ProductRecord } from "../data/types";
import { safeNumber, safeString } from "./safe";

const getVal = (obj: any, keys: string[]) => {
  const foundKey = Object.keys(obj || {}).find((k) =>
    keys.some((target) => k.toLowerCase() === target.toLowerCase())
  );
  return foundKey ? obj[foundKey] : undefined;
};

/**
 * Amazon-Only Data Pipeline
 * Merges products.csv and reviews.csv into a unified ProductRecord with proxy behavior.
 */
export function processAmazonDataset(productsRaw: any[], reviewsRaw: any[]): ProductRecord[] {
  // 1. Group Reviews by Product ASIN
  const reviewAgg = new Map<string, { ratingSum: number; sentimentSum: number; count: number }>();
  
  reviewsRaw.forEach((item) => {
    const asin = safeString(getVal(item, ["productASIN", "asin", "id"]));
    if (!asin) return;

    const stats = reviewAgg.get(asin) || { ratingSum: 0, sentimentSum: 0, count: 0 };
    stats.ratingSum += safeNumber(getVal(item, ["rating", "Rating", "stars"]));
    stats.sentimentSum += safeNumber(getVal(item, ["sentiment_score", "sentiment"]), 0);
    stats.count++;
    reviewAgg.set(asin, stats);
  });

  // 2. Map and Merge with Products
  return productsRaw.map((item, idx) => {
    const id = safeString(getVal(item, ["asin", "productASIN", "id"]) || `product-${idx}`);
    const stats = reviewAgg.get(id);
    
    // Base Fields
    const reviewCount = stats ? stats.count : 0;
    const rating = stats ? stats.ratingSum / stats.count : safeNumber(getVal(item, ["rating", "Rating"]));
    const sentiment = stats ? stats.sentimentSum / stats.count : 0;
    
    // Proxy Metric Derivation (Mandatory)
    const interestScore = Math.log1p(reviewCount);
    const trustScore = (rating / 5) * (sentiment > 0 ? sentiment : 1);
    const conversionProxy = trustScore * interestScore;

    return {
      id,
      name: safeString(getVal(item, ["title", "name", "product_name"]) || `Product ${id}`),
      price: safeNumber(getVal(item, ["price_value", "price"])),
      rating,
      reviewCount,
      sentiment,
      category: safeString(getVal(item, ["breadcrumbs", "category", "main_category"]) || "Unknown"),
      brand: safeString(getVal(item, ["brand_name", "brand"]) || "Unknown"),
      description: safeString(getVal(item, ["about_item", "product_description", "description"]) || ""),
      behavior: {
        interestScore,
        trustScore,
        conversionProxy
      },
      ...item // Keep raw fields for zero-heuristic discovery
    };
  });
}

/**
 * Legacy support for DatasetProvider
 */
export function transformDataset(data: any[]): ProductRecord[] {
    return processAmazonDataset(data, []);
}

export function mergeDatasets(base: ProductRecord[], addition: ProductRecord[]): ProductRecord[] {
  const baseMap = new Map(base.map(p => [p.id, p]));
  addition.forEach(p => baseMap.set(p.id, { ...baseMap.get(p.id), ...p }));
  return Array.from(baseMap.values());
}
