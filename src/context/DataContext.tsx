import { createContext, useContext, useState, ReactNode, useCallback } from "react";

import { ProductRecord } from "../data/types";
import { transformDataset, mergeDatasets } from "../utils/transformData";
import { loadAllProductionData } from "../utils/loadAllData";

type DataContextType = {
  rawData: any[];
  processedData: ProductRecord[];
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
  const [rawData, setRawData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<ProductRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState<Record<string, number>>({});

  const ingestData = useCallback((newData: any[]) => {
    const transformed = transformDataset(newData);
    setProcessedData((prev) => mergeDatasets(prev, transformed));
    setRawData((prev) => [...prev, ...newData]);
  }, []);

  const loadProductionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadProgress({});
    
    try {
      const { behavior } = await loadAllProductionData((file, count) => {
        setLoadProgress(prev => ({ ...prev, [file]: count }));
      });

      
      // 'behavior' here is already an array of aggregated ProductRecords from the stream
      // We store it in processedData, which triggers the useDataset worker
      setProcessedData(behavior);
      
      // Metadata and reviews are passed through as well if needed for worker
      // For this implementation, we'll assume they're handled in the next worker postMessage
    } catch (err: any) {
      setError(`Failed to load production data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);



  const resetData = useCallback(() => {
    setRawData([]);
    setProcessedData([]);
    setError(null);
  }, []);

  const isReady = processedData.length > 0;

  return (
    <DataContext.Provider
      value={{
        rawData,
        processedData,
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
