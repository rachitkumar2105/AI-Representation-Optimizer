export type ProductRecord = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
  rating: number | null;
  description: string | null;
  views: number;
  cart: number;
  purchase: number;
  [key: string]: string | number | null;
};

export type GroupStats = {
  label: string;
  count: number;
  conversion: number;
  cartConversion: number;
  totalViews: number;
  totalCart: number;
  totalPurchase: number;
  share: number;
};

export type SplitResult = {
  id: string;
  featureKey: string;
  featureLabel: string;
  type: "numeric" | "boolean" | "categorical";
  splitType: "median" | "q1" | "q3" | "presence" | "category";
  threshold?: number;
  categoryValue?: string;
  groupA: GroupStats;
  groupB: GroupStats;
  difference: number;
  absDifference: number;
  confidence: "Low" | "Medium" | "High";
};

export type ProductInsight = {
  splitId: string;
  featureLabel: string;
  groupLabel: string;
  groupA: GroupStats;
  groupB: GroupStats;
  difference: number;
  betterGroup: string;
  action: string;
  confidence: "Low" | "Medium" | "High";
};
