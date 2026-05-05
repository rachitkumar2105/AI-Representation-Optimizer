export type ProductRecord = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  sentiment: number;
  description: string;
  behavior: {
    interestScore: number;
    trustScore: number;
    conversionProxy: number;
  };
  [key: string]: any;
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
  se: number;
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
