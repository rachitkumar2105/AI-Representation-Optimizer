import { ProductRecord } from "../data/types";
import { safeNumber, safeString } from "./safe";

const getVal = (obj: any, keys: string[]) => {
  const foundKey = Object.keys(obj || {}).find((k) =>
    keys.some((target) => k.toLowerCase() === target.toLowerCase())
  );
  return foundKey ? obj[foundKey] : undefined;
};

/**
 * Step 2: Group Reviews by Product
 */
export function aggregateReviews(reviews: any[]): Map<string, { rating: number, sentiment: number, count: number }> {
  const agg = new Map<string, { ratingSum: number, sentimentSum: number, count: number }>();
  
  reviews.forEach(item => {
    const pid = String(getVal(item, ["productASIN", "asin", "id"]) || "unknown");
    if (pid === "unknown") return;

    if (!agg.has(pid)) {
      agg.set(pid, { ratingSum: 0, sentimentSum: 0, count: 0 });
    }
    const record = agg.get(pid)!;
    record.ratingSum += safeNumber(getVal(item, ["rating"]));
    record.sentimentSum += safeNumber(getVal(item, ["sentiment_score"]), 0);
    record.count++;
  });

  const final = new Map<string, { rating: number, sentiment: number, count: number }>();
  agg.forEach((val, key) => {
    final.set(key, {
      rating: val.ratingSum / val.count,
      sentiment: val.sentimentSum / val.count,
      count: val.count
    });
  });
  return final;
}

/**
 * Step 3 & 4: Map Products & Merge with Proxy Metrics
 */
export function processAmazonDataset(products: any[], reviewMap: Map<string, any>): ProductRecord[] {
  return products.map((item, idx) => {
    const id = String(getVal(item, ["asin", "productASIN", "id"]) || `p-${idx}`);
    const reviews = reviewMap.get(id) || { rating: 0, sentiment: 0, count: 0 };
    
    const price = safeNumber(getVal(item, ["price", "price_value"]));
    const rating = reviews.rating || safeNumber(getVal(item, ["rating_stars", "rating"]));
    const reviewCount = reviews.count || safeNumber(getVal(item, ["review_count", "reviews"]));
    const sentiment = reviews.sentiment || 0;

    // Step 5: Proxy Metrics
    const interestScore = Math.log(reviewCount + 1);
    const trustScore = (rating / 5) * (sentiment || 1);
    const conversionProxy = trustScore * interestScore;

    return {
      id,
      name: safeString(getVal(item, ["title", "name", "product_name"]) || `Product ${id}`),
      price,
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
      ...item
    };
  });
}

// Keeping fallback for generic ingestion
export function transformDataset(data: any[]): any[] {
  return data;
}

export function mergeDatasets(base: ProductRecord[], addition: ProductRecord[]): ProductRecord[] {
  const map = new Map(base.map(p => [p.id, p]));
  addition.forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
  return Array.from(map.values());
}
