import { ProductRecord, CategoryStats } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type CategoryBenchmarkProps = {
  product?: ProductRecord;
  stats?: CategoryStats;
};

/**
 * Category Benchmarking Panel
 * Visualizes a product's standing within its specific Amazon category baseline.
 */
export default function CategoryBenchmark({ product, stats }: CategoryBenchmarkProps) {
  const { theme } = useTheme();
  if (!product || !stats) return null;

  const isDark = theme === "dark";
  const isAboveAverage = product.rating > stats.avgRating;
  const isAboveProxy = (product.behavior?.conversionProxy || 0) > stats.avgProxy;

  return (
    <div className={`p-6 rounded-3xl border ${
      isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
    }`}>
      <h3 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        Category Benchmark: {product.category}
      </h3>

      <div className="space-y-6">
        <BenchmarkRow 
          label="Rating vs Category Avg" 
          value={product.rating.toFixed(1)} 
          avg={stats.avgRating.toFixed(1)} 
          percent={isAboveAverage ? 100 : (product.rating / stats.avgRating) * 50}
          isDark={isDark}
          status={isAboveAverage ? "success" : "warning"}
        />
        
        <BenchmarkRow 
          label="Proxy vs Category Avg" 
          value={`${(product.behavior?.conversionProxy * 100).toFixed(1)}%`} 
          avg={`${(stats.avgProxy * 100).toFixed(1)}%`} 
          percent={isAboveProxy ? 100 : ((product.behavior?.conversionProxy || 0) / (stats.avgProxy || 1)) * 50}
          isDark={isDark}
          status={isAboveProxy ? "success" : "warning"}
        />
      </div>

      <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${
        isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
      }`}>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
          isAboveProxy ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
        }`}>
          {isAboveProxy ? "↑" : "↓"}
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          This product is performing <span className="font-bold">{isAboveProxy ? "above" : "below"}</span> the category baseline for conversionProxy.
        </p>
      </div>
    </div>
  );
}

function BenchmarkRow({ label, value, avg, percent, isDark, status }: { label: string, value: string, avg: string, percent: number, isDark: boolean, status: "success" | "warning" }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold">
        <span className={isDark ? "text-slate-400" : "text-slate-500"}>{label}</span>
        <span className={isDark ? "text-white" : "text-slate-900"}>{value} <span className="text-slate-500 font-normal">/ avg {avg}</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200/10 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            status === "success" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
