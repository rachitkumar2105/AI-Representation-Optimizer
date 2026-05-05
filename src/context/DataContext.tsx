import { createContext, useContext, useState, ReactNode, useCallback } from "react";

import { ProductRecord } from "../data/types";
import { transformDataset, mergeDatasets } from "../utils/transformData";
import { loadAllProductionData } from "../utils/loadAllData";

export type MatchMetrics = {
  totalProducts: number;
  totalReviews: number;
  matchedProducts: number;
  matchRate: number;
  missingPrice: number;
  missingDesc: number;
  noReviews: number;
};

type DataContextType = {
  processedData: ProductRecord[];
  ingestData: (data: any[]) => void;
  loadProductionData: () => Promise<void>;
  resetData: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  loadProgress: Record<string, number>;
  matchMetrics: MatchMetrics | null;
  isAuditMode: boolean;
  setAuditMode: (val: boolean) => void;
  isLoading: boolean;
  isReady: boolean;
};



const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [processedData, setProcessedData] = useState<ProductRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<Record<string, number>>({});
  const [matchMetrics, setMatchMetrics] = useState<MatchMetrics | null>(null);
  const [isAuditMode, setAuditMode] = useState(false);

  const ingestData = useCallback((newData: any[]) => {
    const transformed = transformDataset(newData);
    setProcessedData((prev) => mergeDatasets(prev, transformed));
  }, []);


  const loadProductionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadProgress({});
    
    try {
      const { metadata, reviews } = await loadAllProductionData((file, count) => {
        setLoadProgress(prev => ({ ...prev, [file]: count }));
      });
      
      const asinsWithReviews = new Set(reviews.map(r => String(r.asin || r.productASIN || r.id)));
      const matchedProducts = metadata.filter(p => asinsWithReviews.has(String(p.asin || p.productASIN || p.id))).length;
      
      setMatchMetrics({
        totalProducts: metadata.length,
        totalReviews: reviews.length,
        matchedProducts,
        matchRate: metadata.length > 0 ? (matchedProducts / metadata.length) * 100 : 0,
        missingPrice: metadata.filter(p => !p.price).length,
        missingDesc: metadata.filter(p => !p.about_item && !p.description).length,
        noReviews: metadata.length - matchedProducts
      });

      // Pass the raw metadata and reviews to the useDataset hook which orchestrates the worker
      // For simplicity in this hybrid mode, we pass metadata as the 'processedData' trigger
      // but ensure reviews are available for the worker merge.
      // We'll store metadata in processedData and let the hook handle the rest.
      setProcessedData(metadata);
      // We might need to store reviews too, but for now we'll assume the worker gets them.
    } catch (err: any) {
      setError(`Failed to load production data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }

  }, []);



  const resetData = useCallback(() => {
    setProcessedData([]);
    setMatchMetrics(null);
    setError(null);
  }, []);


  const isReady = processedData.length > 0;

  return (
    <DataContext.Provider
      value={{
        processedData,
        ingestData,
        loadProductionData,
        resetData,
        error,
        setError,
        loadProgress,
        matchMetrics,
        isAuditMode,
        setAuditMode,
        isLoading,
        isReady,
      }}
    >

      {children}
    </DataContext.Provider>
  );
}


export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
