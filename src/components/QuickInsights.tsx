import { SplitResult } from "../data/types";
import { useTheme } from "../hooks/useTheme";


type QuickInsightsProps = {
  splits: SplitResult[];
};

/**
 * Top 3 System Insights
 * Provides immediate 5-second clarity on the highest impact optimization drivers.
 */
export default function QuickInsights({ splits }: QuickInsightsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const top3 = splits.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {top3.map((split, i) => (
        <div key={split.id} className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] ${
          isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary`}>
              {i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              split.difference >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}>
              {split.difference >= 0 ? "+" : ""}{(split.difference * 100).toFixed(1)}% Lift
            </span>
          </div>
          <h4 className={`font-bold text-sm mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            {split.featureLabel} Analysis
          </h4>
          <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Products with <span className="font-bold">{split.featureLabel}</span> matching <span className="text-primary font-bold">{split.groupB.label}</span> show significantly higher engagement.
          </p>
        </div>
      ))}
    </div>
  );
}
