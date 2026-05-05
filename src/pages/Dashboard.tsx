import { useMemo, useState, useEffect } from "react";
import DecisionStrip from "../components/DecisionStrip";
import DifferenceTable from "../components/DifferenceTable";
import ProductSelector from "../components/ProductSelector";
import ProductPositionCard from "../components/ProductPositionCard";
import ActionCard from "../components/ActionCard";
import FileUploader from "../components/FileUploader";
import { useDataset } from "../hooks/useDataset";
import { useTheme } from "../hooks/useTheme";
import { useData } from "../context/DataContext";

export default function Dashboard() {
  const { splits, products, loading, getProductInsights } = useDataset();
  const { theme } = useTheme();
  const { isReady, loadProductionData, isLoading, loadProgress, error } = useData();

  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Automatically select the first product once data is ready
  useEffect(() => {
    if (isReady && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [isReady, products, selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const insights = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductInsights(selectedProduct.id);
  }, [selectedProduct, getProductInsights]);

  const topSplit = splits[0];
  const topInsight = insights.find((insight) => insight.splitId === topSplit?.id);

  if (isLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl animate-pulse">⚡</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {isLoading ? "Ingesting Streams" : "Computing Insights"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLoading 
                ? "Processing multi-million row event logs via streaming..."
                : "Executing zero-heuristic statistical analysis in background worker..."
              }
            </p>
          </div>

          {isLoading && (
            <div className="space-y-3 bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                <span>Live Ingestion Progress</span>
                <span>Streaming Active</span>
              </div>
              <div className="space-y-2">
                {Object.entries(loadProgress).map(([file, count]) => (
                  <div key={file} className="flex justify-between text-xs items-center">
                    <span className="truncate text-muted-foreground">{file}</span>
                    <span className="font-mono font-bold text-secondary">
                      {(count / 1000000).toFixed(2)}M rows
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1 w-full bg-secondary/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary animate-pulse w-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Production Data Integration Engine
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload your eCommerce behavior logs and product metadata to generate
              statistically significant optimization insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="font-semibold text-xl">Custom Upload</h3>
              <p className="text-sm text-muted-foreground">
                Upload your own .csv or .xlsx files with unknown schemas.
              </p>
              <FileUploader />
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="font-semibold text-xl">Production Sample</h3>
                <p className="text-sm text-muted-foreground">
                  Load pre-configured Kaggle & Amazon datasets (10GB+ scale) using sampled streaming.
                </p>
              </div>
              
              <button
                onClick={loadProductionData}
                className="w-full py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Load Production Datasets
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-20">
      {/* 1. Header with Uploader */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Dataset Analysis</h1>
          <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Analyzing {products.length} products and {splits.length} computed representation splits.
          </p>
        </div>
        <div className="w-full lg:w-72">
          <button 
            onClick={() => window.location.reload()} 
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              theme === "dark" ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Dataset
          </button>
        </div>
      </div>

      {/* 2. Decision Strip */}
      <section id="decision-strip">
        {topSplit && topInsight && selectedProduct && (
          <DecisionStrip
            title={`Critical Insight: ${selectedProduct.name}`}
            description={topInsight.action}
            badge={`Delta: ${(Math.abs(topSplit.difference) * 100).toFixed(2)}% (${topSplit.confidence} Confidence)`}
          />
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <ProductSelector
            products={products}
            selectedId={selectedProductId}
            onSelect={setSelectedProductId}
            enableNavigate={false}
          />
        </aside>

        <main className="space-y-12">
          <section id="differences">
            <DifferenceTable splits={splits} />
          </section>

          {selectedProduct && (
            <>
              <section id="mapping" className="space-y-6">
                <div className="px-2">
                  <h2 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Product Mapping</h2>
                  <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Visualizing how '{selectedProduct.name}' aligns with top-performing data segments.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {insights.slice(0, 4).map((insight) => (
                    <ProductPositionCard key={insight.splitId} insight={insight} />
                  ))}
                </div>
              </section>

              <section id="actions" className="space-y-6">
                <div className="px-2">
                  <h2 className={`text-2xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Prescriptive Actions</h2>
                  <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Data-backed optimization steps based on observed conversion lift.
                  </p>
                </div>
                <div className="space-y-4">
                  {insights.slice(0, 4).map((insight) => (
                    <ActionCard key={insight.splitId} insight={insight} />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
