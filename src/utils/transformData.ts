import { ProductRecord } from "../data/types";

/**
 * Senior Data Engineer Grade Transformation
 * Merges eCommerce Behavior and Amazon Product Metadata with high resilience.
 */

import { safeNumber } from "./safe";


const getVal = (obj: any, keys: string[]) => {
  const foundKey = Object.keys(obj || {}).find((k) =>
    keys.some((target) => k.toLowerCase() === target.toLowerCase())
  );
  return foundKey ? obj[foundKey] : undefined;
};

const toNum = (val: any) => safeNumber(val);


/**
 * Incremental Aggregator for Behavioral Events.
 * This prevents memory exhaustion by aggregating 42M+ events into a smaller ProductRecord map.
 */
export function aggregateBehavior(chunk: any[], existingMap: Map<string, ProductRecord>): Map<string, ProductRecord> {
  chunk.forEach((item) => {
    const pid = String(getVal(item, ["product_id", "id", "asin", "productASIN"]) || "unknown");
    if (pid === "unknown") return;

    let record = existingMap.get(pid);
    if (!record) {
      record = {
        id: pid,
        name: `Product ${pid}`,
        price: toNum(getVal(item, ["price"])),
        brand: String(getVal(item, ["brand"]) || "Unknown"),
        category: String(getVal(item, ["category_code", "category"]) || "Unknown"),
        rating: 0,
        description: "",
        views: 0,
        cart: 0,
        purchase: 0,
      };
      existingMap.set(pid, record);
    }

    const event = String(getVal(item, ["event_type", "event_name"]) || "").toLowerCase();
    if (event === "view") record.views++;
    else if (event === "cart" || event === "add_to_cart") record.cart++;
    else if (event === "purchase" || event === "order") record.purchase++;

    // Update dynamic attributes if present in behavioral row
    const rawBrand = getVal(item, ["brand"]);
    if (rawBrand && record.brand === "Unknown") record.brand = String(rawBrand);
    
    const rawCat = getVal(item, ["category_code", "category"]);
    if (rawCat && record.category === "Unknown") record.category = String(rawCat);
  });
  
  return existingMap;
}



export function transformDataset(data: any[]): ProductRecord[] {
  if (!data || data.length === 0) return [];

  // Identify dataset type
  const isBehavior = data.some((item) => getVal(item, ["event_type", "event_name"]));
  const isMetadata = data.some((item) => getVal(item, ["asin", "productASIN", "about_item", "rating", "rating_stars"]));
  const isReview = data.some((item) => getVal(item, ["reviewText", "sentiment_score"]));

  // Process Behavior Data (Aggregation)
  if (isBehavior) {
    const map = aggregateBehavior(data, new Map());
    return Array.from(map.values());
  }


  // Process Metadata / Amazon Data (Normalization)
  if (isMetadata) {
    return data.map((item, idx) => {
      const id = String(getVal(item, ["asin", "productASIN", "id", "product_id"]) || `meta-${idx}`);
      const rawRating = getVal(item, ["rating_stars", "rating", "reviewScore"]);
      const numericRating = typeof rawRating === 'string' ? toNum(rawRating.split(' ')[0]) : toNum(rawRating);

      return {
        id,
        name: String(getVal(item, ["title", "name", "product_name"]) || `Product ${id}`),
        price: toNum(getVal(item, ["price_value", "price"])),
        rating: numericRating,
        category: String(getVal(item, ["breadcrumbs", "category", "main_category", "category_code"]) || "Unknown"),
        brand: String(getVal(item, ["brand_name", "brand"]) || "Unknown"),
        description: String(getVal(item, ["about_item", "product_description", "description"]) || ""),
        views: toNum(getVal(item, ["views"])),
        cart: toNum(getVal(item, ["cart"])),
        purchase: toNum(getVal(item, ["purchase"])),
        ...item,
      };
    });
  }

  // Process Reviews
  if (isReview) {
    const reviewAgg = data.reduce((acc: Record<string, any>, item: any) => {
      const pid = String(getVal(item, ["productASIN", "asin", "id"]) || "unknown");
      if (pid === "unknown") return acc;

      if (!acc[pid]) {
        acc[pid] = { id: pid, ratingSum: 0, sentimentSum: 0, count: 0 };
      }

      acc[pid].ratingSum += toNum(getVal(item, ["rating"]));
      acc[pid].sentimentSum += toNum(getVal(item, ["sentiment_score"]));
      acc[pid].count++;

      return acc;
    }, {});

    return Object.values(reviewAgg).map((r: any) => ({
      id: r.id,
      rating: r.ratingSum / r.count,
      sentiment: r.sentimentSum / r.count,
      reviewCount: r.count,
    })) as unknown as ProductRecord[];
  }

  // Fallback
  return data.map((item, idx) => {
    const id = String(getVal(item, ["id", "product_id", "asin"]) || `row-${idx}`);
    return {
      id,
      name: String(getVal(item, ["name", "title"]) || `Item ${id}`),
      price: toNum(getVal(item, ["price"])),
      category: String(getVal(item, ["category"]) || "Unknown"),
      views: toNum(getVal(item, ["views"])),
      cart: toNum(getVal(item, ["cart"])),
      purchase: toNum(getVal(item, ["purchase"])),
      ...item,
    };
  });
}


/**
 * Intelligent Merger: Joins behavior, metadata, and reviews.
 */
export function mergeDatasets(base: ProductRecord[], addition: ProductRecord[]): ProductRecord[] {
  if (base.length === 0) return addition;
  if (addition.length === 0) return base;

  const baseMap = new Map(base.map((item) => [item.id, item]));

  addition.forEach((item) => {
    const existing = baseMap.get(item.id);
    if (existing) {
      baseMap.set(item.id, {
        ...existing,
        ...item,
        // Smart merge for specific fields
        price: item.price || existing.price,
        brand: (item.brand && item.brand !== "Unknown") ? item.brand : existing.brand,
        category: (item.category && item.category !== "Unknown") ? item.category : existing.category,
        description: item.description || existing.description,
        rating: item.rating || existing.rating,
        views: (existing.views || 0) + (item.views || 0),
        cart: (existing.cart || 0) + (item.cart || 0),
        purchase: (existing.purchase || 0) + (item.purchase || 0),
      });
    } else {
      baseMap.set(item.id, item);
    }
  });

  return Array.from(baseMap.values());
}

