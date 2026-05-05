import { SplitResult } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type DataBreakdownProps = {
  splits: SplitResult[];
};

export default function DataBreakdown({ splits }: DataBreakdownProps) {
  const { theme } = useTheme();
  const card = theme === "dark" ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white";
  const title = theme === "dark" ? "text-white" : "text-slate-900";
  const muted = theme === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`rounded-3xl border p-6 ${card}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${title}`}>Data details</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Raw sample sizes, distributions, and variance for split validation.
          </p>
        </div>
        <span className={`text-xs uppercase tracking-[0.2em] ${muted}`}>Collapsible</span>
      </div>
      <details
        className={`mt-4 rounded-2xl border p-4 ${
          theme === "dark" ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50"
        }`}
      >
        <summary className={`cursor-pointer text-sm font-semibold ${title}`}>
          Expand raw data
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {splits.map((split) => (
            <div
              key={split.id}
              className={`rounded-2xl border p-4 ${
                theme === "dark" ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
              }`}
            >
              <p className={`text-sm font-semibold ${title}`}>{split.featureLabel}</p>
              <p className={`mt-1 text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                Group A ({split.groupA.label}): {(split.groupA.conversion * 100).toFixed(2)}% proxy
              </p>
              <p className={`text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                Group B ({split.groupB.label}): {(split.groupB.conversion * 100).toFixed(2)}% proxy
              </p>
              <p className={`mt-2 text-xs ${theme === "dark" ? "text-emerald-200" : "text-emerald-600"}`}>
                Difference (conversion): {(split.difference * 100).toFixed(2)}%
              </p>
              <p className={`mt-2 text-xs ${muted}`}>
                Sample sizes: {split.groupA.count} vs {split.groupB.count}
              </p>
              <p className={`text-xs ${muted}`}>
                Distribution: {(split.groupA.share * 100).toFixed(1)}% vs {(split.groupB.share * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
