import { ProductInsight, ProductRecord, SplitResult, GroupStats, CategoryStats } from "./types";


import { safeNumber, safeString } from "../utils/safe";

const isMissing = (value: unknown) => value === null || value === undefined || value === "";

const formatKey = (key: string) =>
  safeString(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Statistical Standard Error for Conversion Rate
const computeSE = (p: number, n: number) => {
  const pSafe = safeNumber(p);
  const nSafe = Math.max(safeNumber(n), 1);
  return Math.sqrt((pSafe * (1 - pSafe)) / nSafe);
};


export const computeHealthScore = (product: ProductRecord): number => {
  const rScore = (product.rating / 5) * 40; 
  const sScore = product.sentiment * 30; 
  const iScore = Math.min((product.reviewCount / 1000) * 30, 30); 
  return Math.round(rScore + sScore + iScore);
};

export const getCategoryStats = (category: string, allProducts: ProductRecord[]): CategoryStats => {
  const filtered = allProducts.filter(p => p.category === category);
  if (filtered.length === 0) return { category, avgRating: 0, avgProxy: 0, count: 0, rank: 0, percentile: 0 };
  


  const avgRating = filtered.reduce((s, p) => s + p.rating, 0) / filtered.length;
  const avgProxy = filtered.reduce((s, p) => s + (p.behavior?.conversionProxy || 0), 0) / filtered.length;
  
  return { category, avgRating, avgProxy, count: filtered.length, rank: 0, percentile: 0 };
};

const getConfidence = (n: number, totalN: number): "Low" | "Medium" | "High" => {
  const proportion = n / Math.max(totalN, 1);
  if (n < 100 || proportion < 0.01) return "Low"; 
  if (n < 1000 || proportion < 0.05) return "Medium";
  return "High";
};


const computeGroupStats = (products: ProductRecord[], totalCount: number, label: string): GroupStats => {
  const totalProxy = products.reduce((sum, item) => sum + (item.behavior?.conversionProxy ?? 0), 0);
  const avgConversion = products.length > 0 ? totalProxy / products.length : 0;

  return {
    label,
    count: products.length,
    conversion: avgConversion,
    cartConversion: 0,
    totalViews: products.reduce((sum, item) => sum + (item.reviewCount ?? 0), 0),
    totalCart: 0,
    totalPurchase: products.length,
    share: totalCount > 0 ? products.length / totalCount : 0,
    se: computeSE(avgConversion, products.length),
  };
};


const computeQuantile = (values: number[], q: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

const buildNumericSplits = (products: ProductRecord[], featureKey: string, totalDatasetSize: number): SplitResult[] => {
  const values = products
    .map((product) => product[featureKey])
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));

  if (values.length < 2) return [];

  const median = computeQuantile(values, 0.5);
  const q1 = computeQuantile(values, 0.25);
  const q3 = computeQuantile(values, 0.75);

  const totalCount = products.length;

  const buildSplit = (
    splitType: "median" | "q1" | "q3",
    comparator: "lte" | "gte",
    threshold: number,
    groupALabel: string,
    groupBLabel: string
  ): SplitResult => {
    const groupAProducts = products.filter((product) => {
      const value = product[featureKey];
      if (typeof value !== "number") return false;
      return comparator === "lte" ? value <= threshold : value >= threshold;
    });
    const groupBProducts = products.filter((product) => {
      const value = product[featureKey];
      if (typeof value !== "number") return false;
      return comparator === "lte" ? value > threshold : value < threshold;
    });

    const groupA = computeGroupStats(groupAProducts, totalCount, groupALabel);
    const groupB = computeGroupStats(groupBProducts, totalCount, groupBLabel);
    const difference = groupA.conversion - groupB.conversion;
    
    // Confidence is bounded by the smallest group and proportion
    const confidence = getConfidence(Math.min(groupA.count, groupB.count), totalDatasetSize);


    return {
      id: `${featureKey}-${splitType}`,
      featureKey,
      featureLabel: formatKey(featureKey),
      type: "numeric",
      splitType,
      threshold,
      groupA,
      groupB,
      difference,
      absDifference: Math.abs(difference),
      confidence,
    };
  };

  return [
    buildSplit("median", "lte", median, `\u2264 ${median.toFixed(2)}`, `> ${median.toFixed(2)}`),
    buildSplit("q1", "lte", q1, `\u2264 ${q1.toFixed(2)}`, `> ${q1.toFixed(2)}`),
    buildSplit("q3", "gte", q3, `\u2265 ${q3.toFixed(2)}`, `< ${q3.toFixed(2)}`),
  ].filter(s => s.groupA.count > 0 && s.groupB.count > 0);
};

const buildBooleanSplit = (products: ProductRecord[], featureKey: string, totalDatasetSize: number): SplitResult | null => {
  const totalCount = products.length;
  const groupAProducts = products.filter((product) => !isMissing(product[featureKey]));
  const groupBProducts = products.filter((product) => isMissing(product[featureKey]));

  if (groupAProducts.length === 0 || groupBProducts.length === 0) return null;

  const groupA = computeGroupStats(groupAProducts, totalCount, "Present");
  const groupB = computeGroupStats(groupBProducts, totalCount, "Missing");
  const difference = groupA.conversion - groupB.conversion;
  const confidence = getConfidence(Math.min(groupA.count, groupB.count), totalDatasetSize);


  return {
    id: `${featureKey}-presence`,
    featureKey,
    featureLabel: `${formatKey(featureKey)} Presence`,
    type: "boolean",
    splitType: "presence",
    groupA,
    groupB,
    difference,
    absDifference: Math.abs(difference),
    confidence,
  };
};

const buildCategoricalSplits = (products: ProductRecord[], featureKey: string, totalDatasetSize: number): SplitResult[] => {
  const values = products
    .map((product) => product[featureKey])
    .filter((value): value is string => typeof value === "string" && value !== "");

  if (values.length === 0) return [];

  // High-cardinality handling: Top 10 + Others
  const counts = new Map<string, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  const topValues = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([v]) => v);

  const totalCount = products.length;

  return topValues.map((value) => {
    const groupAProducts = products.filter((product) => product[featureKey] === value);
    const groupBProducts = products.filter((product) => product[featureKey] !== value);
    const groupA = computeGroupStats(groupAProducts, totalCount, value);
    const groupB = computeGroupStats(groupBProducts, totalCount, "Rest");
    const difference = groupA.conversion - groupB.conversion;
    const confidence = getConfidence(Math.min(groupA.count, groupB.count), totalDatasetSize);


    return {
      id: `${featureKey}-category-${value}`,
      featureKey,
      featureLabel: formatKey(featureKey),
      type: "categorical",
      splitType: "category",
      categoryValue: value,
      groupA,
      groupB,
      difference,
      absDifference: Math.abs(difference),
      confidence,
    };
  });
};

const getFeatureKeys = (products: ProductRecord[]) => {
  const numericKeys = new Set<string>();
  const stringKeys = new Set<string>();
  const presenceKeys = new Set<string>();

  // Zero-heuristic discovery: No hardcoded EXCLUDED_KEYS
  products.forEach((product) => {
    Object.entries(product).forEach(([key, value]) => {
      // Exclude core outcome metrics and internal fields
      if (["behavior", "rawData", "id", "name", "id_original", "reviewCount", "sentiment"].includes(key)) return;

      if (typeof value === "number" && !Number.isNaN(value)) {
        numericKeys.add(key);
      } else if (typeof value === "string") {
        stringKeys.add(key);
      }


      if (isMissing(value)) {
        presenceKeys.add(key);
      }
    });
  });

  return {
    numericKeys: Array.from(numericKeys).filter(k => {
        const vals = products.map(p => p[k] as number).filter(v => typeof v === 'number');
        return new Set(vals).size > 1; // Drop zero-variance
    }),
    stringKeys: Array.from(stringKeys).filter(k => {
        const vals = products.map(p => p[k] as string).filter(v => typeof v === 'string');
        return new Set(vals).size > 1;
    }),
    presenceKeys: Array.from(presenceKeys),
  };
};

export const computeSplits = (products: ProductRecord[]) => {
  const totalDatasetSize = products.length;
  const { numericKeys, stringKeys, presenceKeys } = getFeatureKeys(products);

  const numericSplits = numericKeys.flatMap((key) => buildNumericSplits(products, key, totalDatasetSize));
  const booleanSplits = presenceKeys
    .map((key) => buildBooleanSplit(products, key, totalDatasetSize))
    .filter((split): split is SplitResult => Boolean(split));
  const categoricalSplits = stringKeys.flatMap((key) => buildCategoricalSplits(products, key, totalDatasetSize));

  const splits = [...numericSplits, ...booleanSplits, ...categoricalSplits]
    .filter(s => s.groupA.count > 0 && s.groupB.count > 0)
    .sort((a, b) => b.absDifference - a.absDifference);

  return { products, splits };
};

const determineGroupLabel = (split: SplitResult, product: ProductRecord) => {
  const value = product[split.featureKey];
  if (split.type === "numeric") {
    if (typeof value !== "number" || split.threshold === undefined) return split.groupB.label;
    if (split.splitType === "q3") {
      return value >= split.threshold ? split.groupA.label : split.groupB.label;
    }
    return value <= split.threshold ? split.groupA.label : split.groupB.label;
  }
  if (split.type === "boolean") {
    return isMissing(value) ? split.groupB.label : split.groupA.label;
  }
  if (split.type === "categorical") {
    return value === split.categoryValue ? split.groupA.label : split.groupB.label;
  }
  return split.groupB.label;
};

export const buildProductInsights = (
  product: ProductRecord,
  splits: SplitResult[]
): ProductInsight[] => {
  return splits.map((split) => {
    const groupLabel = determineGroupLabel(split, product);
    const isGroupAABetter = split.groupA.conversion >= split.groupB.conversion;
    const betterGroup = isGroupAABetter ? split.groupA.label : split.groupB.label;
    const isOptimal = groupLabel === betterGroup;

    const absDelta = Math.abs(split.difference);
    const deltaStr = `${(absDelta * 100).toFixed(2)}%`;
    const feature = split.featureLabel;

    // Statistical markers for actions
    const n = isGroupAABetter ? split.groupA.count : split.groupB.count;
    const conf = split.confidence;

    // Action Intensity Variation
    const intensity = absDelta > 0.05 ? "CRITICAL" : absDelta > 0.02 ? "HIGH-IMPACT" : "OPTIMIZATION";

    let action = "";
    if (isOptimal) {
      action = `[${intensity}] Performance Leader: Current ${feature} state is optimal. This segment yields a +${deltaStr} conversion advantage (n=${n}, ${conf} Confidence). Maintain alignment with '${betterGroup}'.`;
    } else {
      const productVal = String(product[split.featureKey] ?? "Missing");
      const betterVal = betterGroup;
      
      action = `[${intensity}] Strategic Pivot: Products with ${feature} in '${betterVal}' outperform this item by +${deltaStr} (n=${n}, ${conf} Confidence). Current state is '${productVal}'. Consider aligning to '${betterVal}'.`;
    }

    return {
      splitId: split.id,
      featureLabel: split.featureLabel,
      groupLabel,
      groupA: split.groupA,
      groupB: split.groupB,
      difference: split.difference,
      betterGroup,
      action,
      confidence: split.confidence,
    };
  });
};
