import { ProductInsight, ProductRecord, SplitResult, GroupStats } from "./types";

const isMissing = (value: unknown) => value === null || value === undefined || value === "";

const formatKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

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

const getConfidence = (n: number, total: number): "Low" | "Medium" | "High" => {
  if (n < 1000 || n < (total * 0.05)) {
    if (n < 50) return "Low";
    if (n < 500) return "Medium";
    // Even if n > 500, if it doesn't meet the 1000/5% rule, we don't grant "High"
    return "Medium";
  }
  return "High";
};

const computeGroupStats = (products: ProductRecord[], totalCount: number, label: string): GroupStats => {
  const totalViews = products.reduce((sum, item) => sum + (item.views ?? 0), 0);
  const totalCart = products.reduce((sum, item) => sum + (item.cart ?? 0), 0);
  const totalPurchase = products.reduce((sum, item) => sum + (item.purchase ?? 0), 0);
  const conversion = totalViews > 0 ? totalPurchase / totalViews : 0;
  const cartConversion = totalCart > 0 ? totalPurchase / totalCart : 0;

  return {
    label,
    count: products.length,
    conversion,
    cartConversion,
    totalViews,
    totalCart,
    totalPurchase,
    share: totalCount > 0 ? products.length / totalCount : 0,
  };
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
    buildSplit("median", "lte", median, `≤ ${median.toFixed(2)}`, `> ${median.toFixed(2)}`),
    buildSplit("q1", "lte", q1, `≤ ${q1.toFixed(2)}`, `> ${q1.toFixed(2)}`),
    buildSplit("q3", "gte", q3, `≥ ${q3.toFixed(2)}`, `< ${q3.toFixed(2)}`),
  ];
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

  // Frequency count for Top 10 + Others logic
  const freqMap: Record<string, number> = {};
  values.forEach(v => freqMap[v] = (freqMap[v] || 0) + 1);
  
  const sortedValues = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  const topValues = sortedValues.slice(0, 10);
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

  // Zero-heuristic discovery: check all keys that are not core metrics objects
  products.forEach((product) => {
    Object.entries(product).forEach(([key, value]) => {
      // Exclude metrics themselves as they are the outcome, not representation features
      if (["views", "cart", "purchase", "behavior", "rawData"].includes(key)) return;
      
      // Filter out non-informative variance (all same value)
      // This is handled later during split building, but we identify types here
      if (typeof value === "number") {
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
    numericKeys: Array.from(numericKeys),
    stringKeys: Array.from(stringKeys),
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
    .filter(s => s.groupA.count > 0 && s.groupB.count > 0) // Ensure valid splits
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
    
    let action = "";
    // Action Intensity Variation
    const intensity = absDelta > 0.05 ? "CRITICAL" : absDelta > 0.02 ? "HIGH-IMPACT" : "OPTIMIZATION";
    
    if (isOptimal) {
      action = `[${intensity}] Maintain current ${feature} state. It aligns with the top-performing '${betterGroup}' segment, which yields a +${deltaStr} conversion advantage.`;
    } else {
      if (split.type === "numeric") {
        const direction = isGroupAABetter ? "decreasing" : "increasing";
        action = `[${intensity}] Performance Gap: Shift ${feature} towards the '${betterGroup}' group by ${direction} its value. Data shows a +${deltaStr} conversion lift in that range.`;
      } else if (split.type === "boolean") {
        action = isGroupAABetter 
          ? `[${intensity}] Representation Deficit: Populate ${feature}. Products with this field present outperform by +${deltaStr}.`
          : `[${intensity}] Content Clutter: Remove ${feature}. Evidence suggests products without this feature convert +${deltaStr} better.`;
      } else {
        action = `[${intensity}] Strategic Alignment: Re-categorize ${feature} from '${groupLabel}' to '${betterGroup}'. This pivot addresses a -${deltaStr} conversion gap.`;
      }
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


