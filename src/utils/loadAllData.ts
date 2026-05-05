import Papa from "papaparse";
import { aggregateBehavior } from "./transformData";
import { ProductRecord } from "../data/types";

export type LoadProgress = {
  file: string;
  loaded: number;
  total?: number;
  status: 'loading' | 'complete' | 'error';
};

/**
 * Production-Grade Streaming Ingestion
 * Uses PapaParse chunk mode to process massive files without loading them into memory.
 */
export async function streamCSV(
  url: string, 
  onChunk: (chunk: any[]) => void,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let count = 0;
    
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true, // Use PapaParse internal worker for parsing
      chunkSize: 1024 * 1024 * 2, // 2MB network chunks
      chunk: function(results) {
        count += results.data.length;
        onChunk(results.data);
        if (onProgress) onProgress(count);
      },
      complete: () => {
        console.log(`Streamed ${count} rows from ${url}`);
        resolve();
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Vercel-Safe API Fetcher
 * Loads pre-processed and aggregated product data to avoid browser-side heavy lifting.
 */
export async function fetchProductionInsights(): Promise<ProductRecord[]> {
  try {
    const response = await fetch("/data/products_processed.json");
    if (!response.ok) throw new Error("API dataset not available");
    return await response.json();
  } catch (error) {
    console.warn("Pre-processed data fetch failed, falling back to stream ingestion", error);
    throw error;
  }
}

export async function loadAllProductionData(
  onProgress: (file: string, count: number) => void
) {
  // Check if we have a pre-processed version first (Real Data API Mode)
  try {
    const preProcessed = await fetchProductionInsights();
    return { behavior: preProcessed, metadata: [], reviews: [] };
  } catch (e) {
    // Fallback to raw stream ingestion if API data is missing
    const files = [
      { name: "2019-Oct-Sample.csv", url: "/data/2019-Oct-Sample.csv" },
      { name: "2019-Nov-Sample.csv", url: "/data/2019-Nov-Sample.csv" },
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
}

