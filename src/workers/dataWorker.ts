import { computeSplits } from "../data/compute";
import { processAmazonDataset } from "../utils/transformData";

/**
 * Production-Grade Data Worker (Amazon Only)
 * Handles the review-to-product mapping and statistical compute.
 */
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === "PROCESS_DATA") {
    try {
      const { metadata, reviews } = payload;
      
      // 1. Process Amazon Pipeline (Merge products + reviews)
      const merged = processAmazonDataset(metadata, reviews);
      
      // 2. Compute Splits using conversionProxy
      const results = computeSplits(merged);
      
      self.postMessage({ type: "SUCCESS", payload: results });
    } catch (error: any) {
      self.postMessage({ type: "ERROR", payload: error.message });
    }
  }
};
