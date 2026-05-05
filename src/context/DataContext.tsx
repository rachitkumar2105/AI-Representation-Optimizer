import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { ProductRecord } from "../data/types";
import { transformDataset, mergeDatasets } from "../utils/transformData";
import { loadAllProductionData } from "../utils/loadAllData";

type DataContextType = {
  processedData: ProductRecord[];
  metadata: any[];
  reviews: any[];
  ingestData: (data: any[]) => void;
  loadProductionData: () => Promise<void>;
  resetData: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  loadProgress: Record<string, number>;
  isLoading: boolean;
  isReady: boolean;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [metadata, setMetadata] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<ProductRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<Record<string, number>>({});

  const ingestData = useCallback((newData: any[]) => {
    const transformed = transformDataset(newData);
    setProcessedData((prev) => mergeDatasets(prev, transformed));
  }, []);

  const loadProductionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadProgress({});
    
    try {
      const result = await loadAllProductionData((file, count) => {
        setLoadProgress(prev => ({ ...prev, [file]: count }));
      });
      
      setMetadata(result.metadata);
      setReviews(result.reviews);
      setProcessedData([{ id: "trigger-load" } as any]); // Trigger worker
    } catch (err: any) {
      setError(`Failed to load production data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetData = useCallback(() => {
    setMetadata([]);
    setReviews([]);
    setProcessedData([]);
    setError(null);
  }, []);

  const isReady = processedData.length > 0;

  return (
    <DataContext.Provider
      value={{
        processedData,
        metadata,
        reviews,
        ingestData,
        loadProductionData,
        resetData,
        error,
        setError,
        loadProgress,
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
