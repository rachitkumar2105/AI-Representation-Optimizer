import { transformDataset } from "../utils/transformData";
import { computeSplits } from "../data/compute";

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === "PROCESS_DATA") {
    try {
      // Step 1: Transform raw rows into structured ProductRecords
      const transformed = transformDataset(data);
      
      // Step 2: Compute statistical splits
      const result = computeSplits(transformed);
      
      self.postMessage({ type: "SUCCESS", payload: result });
    } catch (error: any) {
      self.postMessage({ type: "ERROR", payload: error.message });
    }
  }
};
