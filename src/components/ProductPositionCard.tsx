import { ProductInsight } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type ProductPositionCardProps = {
  insight: ProductInsight;
};

export default function ProductPositionCard({ insight }: ProductPositionCardProps) {
  const { theme } = useTheme();
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  const isGroupA = insight.groupLabel === insight.groupA.label;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        theme === "dark" ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`text-sm font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            {insight.featureLabel}
          </h4>
          <p className={`text-[10px] uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
            Mapping Visualization
          </p>
        </div>
        <div className="text-right">
          <div className={`font-mono text-xs font-bold ${
            insight.difference >= 0 ? "text-brand-success" : "text-brand-danger"
          }`}>
            Δ {formatPercent(insight.difference)}
          </div>
          <div className={`text-[9px] font-bold uppercase ${
            insight.confidence === "High" ? "text-emerald-500" :
            insight.confidence === "Medium" ? "text-amber-500" :
            "text-rose-500"
          }`}>
            {insight.confidence} Conf.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className={`relative flex items-center justify-between rounded-lg p-3 border transition-all ${
          isGroupA 
            ? (theme === "dark" ? "border-brand-primary/50 bg-brand-primary/10 ring-1 ring-brand-primary/20" : "border-brand-primary/30 bg-brand-primary/5 ring-1 ring-brand-primary/10")
            : (theme === "dark" ? "border-transparent bg-slate-950/40" : "border-transparent bg-slate-50")
        }`}>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isGroupA ? "bg-brand-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-slate-500/30"}`}></div>
            <span className={`text-xs font-semibold ${isGroupA ? (theme === "dark" ? "text-white" : "text-brand-primary") : (theme === "dark" ? "text-slate-400" : "text-slate-500")}`}>
              Group A: {insight.groupA.label}
            </span>
          </div>
          <div className={`text-[10px] font-mono ${isGroupA ? (theme === "dark" ? "text-slate-200" : "text-slate-700") : "text-slate-500"}`}>
            {formatPercent(insight.groupA.conversion)} CV · n={insight.groupA.count}
          </div>
          {isGroupA && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-brand-primary px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-tighter">Your Product</span>}
        </div>

        <div className={`relative flex items-center justify-between rounded-lg p-3 border transition-all ${
          !isGroupA 
            ? (theme === "dark" ? "border-brand-primary/50 bg-brand-primary/10 ring-1 ring-brand-primary/20" : "border-brand-primary/30 bg-brand-primary/5 ring-1 ring-brand-primary/10")
            : (theme === "dark" ? "border-transparent bg-slate-950/40" : "border-transparent bg-slate-50")
        }`}>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${!isGroupA ? "bg-brand-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-slate-500/30"}`}></div>
            <span className={`text-xs font-semibold ${!isGroupA ? (theme === "dark" ? "text-white" : "text-brand-primary") : (theme === "dark" ? "text-slate-400" : "text-slate-500")}`}>
              Group B: {insight.groupB.label}
            </span>
          </div>
          <div className={`text-[10px] font-mono ${!isGroupA ? (theme === "dark" ? "text-slate-200" : "text-slate-700") : "text-slate-500"}`}>
            {formatPercent(insight.groupB.conversion)} CV · n={insight.groupB.count}
          </div>
          {!isGroupA && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-brand-primary px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-tighter">Your Product</span>}
        </div>
      </div>
    </div>
  );
}
