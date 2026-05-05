import { ProductInsight, ProductRecord, SplitResult, GroupStats } from "./types";
import { safeNumber, safeString } from "../utils/safe";

const isMissing = (value: unknown) => value === null || value === undefined || value === "";

const formatKey = (key: string) =>
  safeString(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Statistical Standard Error for Proxy Metrics
const computeSE = (p: number, n: number) => {
  const pSafe = safeNumber(p);
  const nSafe = Math.max(safeNumber(n), 1);
  return Math.sqrt((pSafe * (1 - pSafe)) / nSafe);
};

const getConfidence = (n: number): "Low" | "Medium" | "High" => {
  // Amazon-Only Rules (n = group size)
  if (n < 50) return "Low";
  if (n < 500) return "Medium";
  return "High";
};

const computeGroupStats = (products: ProductRecord[], label: string): GroupStats => {
  const totalInterest = products.reduce((sum, item) => sum + item.behavior.interestScore, 0);
  const totalPerformance = products.reduce((sum, item) => sum + (item.behavior.conversionProxy * item.behavior.interestScore), 0);
  
  const avgConversionProxy = totalInterest > 0 ? totalPerformance / totalInterest : 0;

  return {
    label,
    count: products.length,
    conversion: avgConversionProxy,
    totalViews: totalInterest,
    totalPurchase: totalPerformance,
    share: products.length > 0 ? 1 : 0, // Placeholder
    se: computeSE(avgConversionProxy, products.length),
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

const buildNumericSplits = (products: ProductRecord[], featureKey: string): SplitResult[] => {
  const values = products
    .map((product) => product[featureKey])
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));

  if (values.length < 2) return [];

  const median = computeQuantile(values, 0.5);
  const q1 = computeQuantile(values, 0.25);
  const q3 = computeQuantile(values, 0.75);

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

    const groupA = computeGroupStats(groupAProducts, groupALabel);
    const groupB = computeGroupStats(groupBProducts, groupBLabel);
    const difference = groupA.conversion - groupB.conversion;
    const confidence = getConfidence(Math.min(groupA.count, groupB.count));

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

const buildBooleanSplit = (products: ProductRecord[], featureKey: string): SplitResult | null => {
  const groupAProducts = products.filter((product) => !isMissing(product[featureKey]));
  const groupBProducts = products.filter((product) => isMissing(product[featureKey]));

  if (groupAProducts.length === 0 || groupBProducts.length === 0) return null;

  const groupA = computeGroupStats(groupAProducts, "Present");
  const groupB = computeGroupStats(groupBProducts, "Missing");
  const difference = groupA.conversion - groupB.conversion;
  const confidence = getConfidence(Math.min(groupA.count, groupB.count));

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

const buildCategoricalSplits = (products: ProductRecord[], featureKey: string): SplitResult[] => {
  const values = products
    .map((product) => product[featureKey])
    .filter((value): value is string => typeof value === "string" && value !== "");

  if (values.length === 0) return [];

  const counts = new Map<string, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  const topValues = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([v]) => v);

  return topValues.map((value) => {
    const groupAProducts = products.filter((product) => product[featureKey] === value);
    const groupBProducts = products.filter((product) => product[featureKey] !== value);
    const groupA = computeGroupStats(groupAProducts, value);
    const groupB = computeGroupStats(groupBProducts, "Rest");
    const difference = groupA.conversion - groupB.conversion;
    const confidence = getConfidence(Math.min(groupA.count, groupB.count));

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

  products.forEach((product) => {
    Object.entries(product).forEach(([key, value]) => {
      // Exclude id and behavior object (Zero-Heuristic Rule)
      if (["id", "behavior", "name", "id_original", "description"].includes(key)) return;

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
    numericKeys: Array.from(numericKeys).filter(k => new Set(products.map(p => p[k])).size > 1),
    stringKeys: Array.from(stringKeys).filter(k => new Set(products.map(p => p[k])).size > 1),
    presenceKeys: Array.from(presenceKeys),
  };
};

export const computeSplits = (products: ProductRecord[]) => {
  const { numericKeys, stringKeys, presenceKeys } = getFeatureKeys(products);

  const numericSplits = numericKeys.flatMap((key) => buildNumericSplits(products, key));
  const booleanSplits = presenceKeys
    .map((key) => buildBooleanSplit(products, key))
    .filter((split): split is SplitResult => Boolean(split));
  const categoricalSplits = stringKeys.flatMap((key) => buildCategoricalSplits(products, key));

  const splits = [...numericSplits, ...booleanSplits, ...categoricalSplits]
    .sort((a, b) => b.absDifference - a.absDifference);

  return { products, splits };
};

export const buildProductInsights = (
  product: ProductRecord,
  splits: SplitResult[]
): ProductInsight[] => {
  return splits.map((split) => {
    const value = product[split.featureKey];
    let groupLabel = split.groupB.label;
    
    if (split.type === "numeric" && typeof value === "number") {
      groupLabel = split.splitType === "q3" ? (value >= split.threshold! ? split.groupA.label : split.groupB.label) : (value <= split.threshold! ? split.groupA.label : split.groupB.label);
    } else if (split.type === "boolean") {
      groupLabel = isMissing(value) ? split.groupB.label : split.groupA.label;
    } else if (split.type === "categorical") {
      groupLabel = value === split.categoryValue ? split.groupA.label : split.groupB.label;
    }

    const isGroupAABetter = split.groupA.conversion >= split.groupB.conversion;
    const betterGroup = isGroupAABetter ? split.groupA.label : split.groupB.label;
    const isOptimal = groupLabel === betterGroup;
    const absDelta = Math.abs(split.difference);
    const deltaStr = `${(absDelta * 100).toFixed(2)}%`;
    const feature = split.featureLabel;

    let action = "";
    const intensity = absDelta > 0.05 ? "CRITICAL" : absDelta > 0.02 ? "HIGH-IMPACT" : "OPTIMIZATION";

    if (isOptimal) {
      action = `[${intensity}] Performance Leader: Products with ${feature} in '${betterGroup}' show +${deltaStr} higher conversionProxy (n=${split.groupA.count}). This product is already optimized.`;
    } else {
      action = `[${intensity}] Improvement Opportunity: Products with ${feature} in '${betterGroup}' show +${deltaStr} higher conversionProxy (n=${isGroupAABetter ? split.groupA.count : split.groupB.count}). This product has '${groupLabel}'. Consider aligning to '${betterGroup}'.`;
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
