import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";

import { buildProductInsights } from "../data/compute";

import { ProductInsight, ProductRecord, SplitResult } from "../data/types";
import { useData } from "../context/DataContext";

type DatasetContextValue = {
  loading: boolean;
  products: ProductRecord[];
  splits: SplitResult[];
  getProductInsights: (productId: string) => ProductInsight[];
};

const DatasetContext = createContext<DatasetContextValue | undefined>(undefined);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const { processedData, isReady } = useData();
  const [results, setResults] = useState<{ products: ProductRecord[]; splits: SplitResult[] }>({ products: [], splits: [] });
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    setIsComputing(true);
    const worker = new Worker(new URL("../workers/dataWorker.ts", import.meta.url), { type: "module" });

    // Send the aggregated behavior and supplemental metadata to the worker
    worker.postMessage({ 
      type: "PROCESS_DATA", 
      payload: { 
        rawData: processedData, // This is the aggregated behavior
        metadata: [], // Currently handled in separate streams in production
        reviews: [] 
      } 
    });

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === "SUCCESS") {
        setResults(payload);
      } else {
        console.error("Worker Error:", payload);
      }
      setIsComputing(false);
      worker.terminate();
    };

    return () => worker.terminate();
  }, [processedData, isReady]);


  const getProductInsights = (productId: string) => {
    const product = results.products.find((item) => item.id === productId);
    if (!product) return [];
    return buildProductInsights(product, results.splits);
  };

  const value = useMemo(
    () => ({
      loading: !isReady || isComputing,
      products: results.products,
      splits: results.splits,
      getProductInsights,
    }),
    [isReady, isComputing, results]
  );


  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within DatasetProvider");
  }
  return context;
}
