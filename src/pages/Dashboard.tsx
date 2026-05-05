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
        <div className="max-w-4xl w-full text-center space-y-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tighter text-foreground">
              Amazon <span className="text-primary">Insight Engine</span>
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Optimizing representation through the Amazon Dataset. Metrics are derived from 
              customer reviews to provide a conversion-proxy baseline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 rounded-3xl border border-border bg-card/40 backdrop-blur-md space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl">🏗️</span>
                </div>
                <h3 className="font-bold text-2xl">Custom Lab</h3>
                <p className="text-muted-foreground">
                  Upload localized Amazon exports. Our engine maps reviews to products to compute representation lift.
                </p>
              </div>
              <FileUploader />
            </div>

            <div className="p-8 rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-md space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <span className="text-3xl">🌍</span>
                </div>
                <h3 className="font-bold text-2xl">Amazon Dataset</h3>
                <p className="text-muted-foreground">
                  Connect to the full products and reviews dataset. Analyzes sentiment and rating patterns to predict performance.
                </p>
              </div>
              
              <button
                onClick={loadProductionData}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
              >
                {isLoading ? "Merging Datasets..." : "Load Amazon Dataset"}
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-50">
            Statistical Guardrails Active | n &ge; 500 Threshold | SE-Adjusted Deltas
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-4">
              ⚠️ {error}
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
