import Papa from "papaparse";
import { aggregateBehavior } from "./transformData";
import { ProductRecord } from "../data/types";

export type LoadProgress = {
  file: string;
  loaded: number;
  total?: number;
  status: 'loading' | 'complete' | 'error';
};

export async function streamCSV(
  url: string, 
  onChunk: (chunk: any[]) => void,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let count = 0;
    let chunk: any[] = [];
    const CHUNK_SIZE = 5000;

    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      chunkSize: 1024 * 1024 * 2, // 2MB chunks for network efficiency
      step: function(row) {
        count++;
        chunk.push(row.data);
        if (chunk.length >= CHUNK_SIZE) {
          onChunk(chunk);
          chunk = [];
          if (onProgress) onProgress(count);
        }
      },
      complete: () => {
        if (chunk.length > 0) onChunk(chunk);
        console.log(`Streamed ${count} rows from ${url}`);
        resolve();
      },
      error: (err) => reject(err),
    });
  });
}

export async function loadAllProductionData(
  onProgress: (file: string, count: number) => void
) {
  const files = [
    { name: "2019-Oct.csv", url: "/data/2019-Oct.csv" },
    { name: "2019-Nov.csv", url: "/data/2019-Nov.csv" },
    { name: "products.csv", url: "/data/products.csv" },
    { name: "reviews.csv", url: "/data/reviews.csv" },
  ];

  let behaviorMap = new Map<string, ProductRecord>();
  const metadata: any[] = [];
  const reviews: any[] = [];

  for (const file of files) {
    await streamCSV(file.url, (chunk) => {
      if (file.name.includes("2019")) {
        behaviorMap = aggregateBehavior(chunk, behaviorMap);
      } else if (file.name === "products.csv") {
        metadata.push(...chunk);
      } else if (file.name === "reviews.csv") {
        reviews.push(...chunk);
      }
    }, (count) => onProgress(file.name, count));
  }

  return {
    behavior: Array.from(behaviorMap.values()),
    metadata,
    reviews
  };
}
