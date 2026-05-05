import Papa from "papaparse";



/**
 * Production-Grade Streaming Ingestion (Amazon Only)
 * Optimized for Products and Reviews datasets.
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
      worker: true,
      chunkSize: 1024 * 1024 * 2,
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

export async function loadAllProductionData(
  onProgress: (file: string, count: number) => void
) {
  const files = [
    { name: "products.csv", url: "/data/products.csv" },
    { name: "reviews.csv", url: "/data/reviews.csv" },
  ];

  const productsRaw: any[] = [];
  const reviewsRaw: any[] = [];

  for (const file of files) {
    await streamCSV(file.url, (chunk) => {
      if (file.name === "products.csv") {
        productsRaw.push(...chunk);
      } else if (file.name === "reviews.csv") {
        reviewsRaw.push(...chunk);
      }
    }, (count) => onProgress(file.name, count));
  }

  return {
    behavior: [], // No behavior logs in Amazon-only mode
    metadata: productsRaw,
    reviews: reviewsRaw
  };
}
