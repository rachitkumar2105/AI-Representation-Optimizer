import { computeSplits } from "../data/compute";
import { aggregateReviews, processAmazonDataset } from "../utils/transformData";

/**
 * Production-Grade Amazon Data Worker
 */
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "PROCESS_DATA") {
    try {
      const { metadata, reviews } = payload;
      
      // Step 2: Group Reviews
      const reviewMap = aggregateReviews(reviews);
      
      // Step 3, 4, 5: Map Products & Compute Proxies
      const processed = processAmazonDataset(metadata, reviewMap);
      
      // Step 6, 7, 8: Compute Splits using conversionProxy
      const results = computeSplits(processed);
      
      self.postMessage({ type: "SUCCESS", payload: results });
    } catch (error: any) {
      self.postMessage({ type: "ERROR", payload: error.message });
    }
  }
};

