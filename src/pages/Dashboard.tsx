import { useMemo, useState, useEffect } from "react";
import DecisionStrip from "../components/DecisionStrip";
import DifferenceTable from "../components/DifferenceTable";
import ProductSelector from "../components/ProductSelector";
import ProductPositionCard from "../components/ProductPositionCard";
import ActionCard from "../components/ActionCard";
import FileUploader from "../components/FileUploader";
import DataBreakdown from "../components/DataBreakdown";
import TransparencyPanel from "../components/TransparencyPanel";
import QuickInsights from "../components/QuickInsights";
import FilterBar from "../components/FilterBar";
import ComparisonPanel from "../components/ComparisonPanel";
import CategoryBenchmark from "../components/CategoryBenchmark";
import HealthScore from "../components/HealthScore";
import { useDataset } from "../hooks/useDataset";
import { useTheme } from "../hooks/useTheme";
import { useData } from "../context/DataContext";
import { computeHealthScore, getCategoryStats } from "../data/compute";



export default function Dashboard() {
  const { isReady, loadProductionData, isLoading, error, isAuditMode } = useData();
  const { splits, products: allProducts, loading, getProductInsights } = useDataset();
  const { theme } = useTheme();

  // 1. Filter State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  // 2. Selection State
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  // 3. Derived Data (Filtered)
  const products = useMemo(() => {
    return allProducts.filter(p => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchRating = p.rating >= minRating;
      const matchPrice = p.price <= priceRange[1];
      return matchCat && matchRating && matchPrice;
    });
  }, [allProducts, selectedCategory, minRating, priceRange]);

  const categories = useMemo(() => Array.from(new Set(allProducts.map(p => p.category))), [allProducts]);

  useEffect(() => {
    if (isReady && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [isReady, products, selectedProductId]);

  const selectedProduct = useMemo(
    () => allProducts.find((product) => product.id === selectedProductId),
    [allProducts, selectedProductId]
  );

  const comparedProducts = useMemo(
    () => allProducts.filter(p => comparisonIds.includes(p.id)),
    [allProducts, comparisonIds]
  );

  const insights = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductInsights(selectedProduct.id);
  }, [selectedProduct, getProductInsights]);

  const topSplit = splits[0];
  const topInsight = insights.find((insight) => insight.splitId === topSplit?.id);

  const selectedHealth = useMemo(() => selectedProduct ? computeHealthScore(selectedProduct) : 0, [selectedProduct]);
  const selectedCatStats = useMemo(() => selectedProduct ? getCategoryStats(selectedProduct.category, allProducts) : undefined, [selectedProduct, allProducts]);

  const handleExport = () => {
    const data = JSON.stringify({ products, insights: splits }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amazon-insights-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

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

  if (isLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg font-medium animate-pulse">Analyzing Amazon Dataset...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-20 px-4 sm:px-8">
      {/* 1. Header with Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-8">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Insight Engine</h1>
          <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Analyzing {products.length} products with performance proxies derived from customer sentiment.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExport}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              theme === "dark" ? "border-slate-700 bg-slate-800 text-slate-300 hover:text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            📥 Export Insights
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              theme === "dark" ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      <QuickInsights splits={splits} />

      <FilterBar 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        minRating={minRating}
        onRatingChange={setMinRating}
      />

      <TransparencyPanel />

      <ComparisonPanel 
        products={comparedProducts} 
        onRemove={(id) => setComparisonIds(prev => prev.filter(cid => cid !== id))} 
      />

      {/* 2. Decision Strip */}
      <section id="decision-strip">
        {topSplit && topInsight && selectedProduct && (
          <div className="space-y-4">
            <DecisionStrip
              title={`Critical Insight: ${selectedProduct.name}`}
              description={topInsight.action}
              badge={`Delta: ${(Math.abs(topSplit.difference) * 100).toFixed(2)}% (${topSplit.confidence} Confidence)`}
            />
            <p className="text-[10px] text-center text-muted-foreground italic">
              * This insight is derived from review-based performance signals, not actual conversion data.
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-8">
          <div className="flex flex-col gap-4">
            <ProductSelector
              products={products}
              selectedId={selectedProduct?.id || ""}
              onSelect={setSelectedProductId}
            />
            <button 
              onClick={() => {
                if (selectedProduct && !comparisonIds.includes(selectedProduct.id)) {
                  setComparisonIds(prev => [...prev.slice(-2), selectedProduct.id]);
                }
              }}
              disabled={!selectedProduct || comparisonIds.includes(selectedProduct?.id || "")}
              className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                theme === "dark" ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              ⚖️ Add to Comparison
            </button>
          </div>
          
          <HealthScore score={selectedHealth} />
          <CategoryBenchmark product={selectedProduct} stats={selectedCatStats} />
          
          {isAuditMode && <DataBreakdown splits={splits} />}
        </aside>

        <main className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <ProductPositionCard product={selectedProduct} />
            <div className="space-y-4">
              <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                Evidence-Backed Actions
              </h3>
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <ActionCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          </div>
          
          <DifferenceTable splits={splits} />
        </main>
      </div>
    </div>
  );
}
