import { ProductInsight } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type ActionCardProps = {
  insight: ProductInsight;
};

export default function ActionCard({ insight }: ActionCardProps) {
  const { theme } = useTheme();
  const isOptimal = insight.groupLabel === insight.betterGroup;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg ${
      theme === "dark" 
        ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800/40" 
        : "border-slate-200 bg-white hover:border-brand-primary/30"
    }`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${
        isOptimal ? "bg-brand-success" : "bg-brand-warning"
      }`}></div>
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>
              {insight.featureLabel}
            </span>
            {isOptimal && (
              <span className="rounded-full bg-brand-success/10 px-2 py-0.5 text-[10px] font-bold text-brand-success">
                Optimal
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              insight.confidence === "High" ? "bg-emerald-500/10 text-emerald-500" :
              insight.confidence === "Medium" ? "bg-amber-500/10 text-amber-500" :
              "bg-rose-500/10 text-rose-500"
            }`}>
              {insight.confidence} Confidence (n={insight.groupB.count + insight.groupA.count})
            </span>
          </div>
          <h4 className={`mt-2 font-bold leading-tight ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            {insight.action}
          </h4>
          <p className={`mt-1 text-[11px] leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Products with <span className="font-bold">{insight.featureLabel}</span> matching the better group show a 
            <span className={`font-bold mx-1 ${insight.difference >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {(Math.abs(insight.difference) * 100).toFixed(1)}%
            </span> 
            lift in conversionProxy based on {insight.groupA.count + insight.groupB.count} data points.
          </p>

        </div>
        
        <div className="text-right whitespace-nowrap">
          <p className={`text-[10px] font-semibold uppercase tracking-tighter ${
            theme === "dark" ? "text-slate-500" : "text-slate-400"
          }`}>
            Observed Delta
          </p>
          <p className={`font-mono text-lg font-bold ${
            insight.difference >= 0 ? "text-brand-success" : "text-brand-danger"
          }`}>
            {(insight.difference * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className={`mt-4 grid grid-cols-2 gap-4 rounded-xl border p-3 text-[11px] ${
        theme === "dark" ? "border-slate-800/50 bg-slate-950/50" : "border-slate-100 bg-slate-50"
      }`}>
        <div>
          <span className={theme === "dark" ? "text-slate-500" : "text-slate-400"}>Current State</span>
          <p className={`font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
            {insight.groupLabel}
          </p>
        </div>
        <div className="text-right">
          <span className={theme === "dark" ? "text-slate-500" : "text-slate-400"}>Better Group</span>
          <p className={`font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
            {insight.betterGroup}
          </p>
        </div>
      </div>
    </div>
  );
}
