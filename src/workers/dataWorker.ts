import { computeSplits } from "../data/compute";
import { transformDataset, mergeDatasets } from "../utils/transformData";

/**
 * Production-Grade Data Worker
 * Offloads heavy analytical transformations and statistical computations from the main thread.
 */
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "PROCESS_DATA") {
    try {
      const { rawData, metadata, reviews } = payload;
      
      // Transform and Merge
      const metaTransformed = transformDataset(metadata);
      const reviewsTransformed = transformDataset(reviews);
      
      let merged = rawData; // rawData is already aggregated behavior from streaming
      if (metaTransformed.length > 0) merged = mergeDatasets(merged, metaTransformed);
      if (reviewsTransformed.length > 0) merged = mergeDatasets(merged, reviewsTransformed);
      
      // Compute Splits
      const results = computeSplits(merged);
      
      self.postMessage({ type: "SUCCESS", payload: results });
    } catch (error: any) {
      self.postMessage({ type: "ERROR", payload: error.message });
    }
  }
};
