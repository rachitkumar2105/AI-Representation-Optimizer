import { SplitResult } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type DifferenceTableProps = {
  splits: SplitResult[];
};

export default function DifferenceTable({ splits }: DifferenceTableProps) {
  const { theme } = useTheme();
  const card = theme === "dark" ? "border-slate-800 bg-slate-900/60 glass-dark" : "border-slate-200 bg-white/80 backdrop-blur-md";
  const title = theme === "dark" ? "text-white" : "text-slate-900";
  const muted = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const row = theme === "dark" ? "hover:bg-slate-800/40" : "hover:bg-slate-50/80";

  const maxAbsDiff = Math.max(...splits.map((s) => s.absDifference), 0.01);

  return (
    <div className={`rounded-3xl border p-8 shadow-xl ${card}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${title}`}>Auto-ranked differences</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            Highest impact features identified dynamically from data.
          </p>
        </div>
        <span
          className={`rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
            theme === "dark"
              ? "border-brand-success/40 bg-brand-success/10 text-brand-success"
              : "border-brand-success/20 bg-brand-success/5 text-brand-success"
          }`}
        >
          Fully Computed
        </span>
      </div>
      
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/10 dark:border-slate-800/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={theme === "dark" ? "bg-slate-900/80 text-slate-400" : "bg-slate-50/80 text-slate-500"}>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Feature Identity</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Comparative Splits</th>
              <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-[10px]">Delta Impact</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme === "dark" ? "divide-slate-800/50" : "divide-slate-200"}`}>
            {splits.map((split) => {
              const impactPercent = (split.absDifference / maxAbsDiff) * 100;
              return (
                <tr key={split.id} className={`group transition-colors ${row}`}>
                  <td className="px-6 py-5">
                    <span className={`block font-bold ${title}`}>{split.featureLabel}</span>
                    <span className={`text-[10px] uppercase tracking-wide ${muted}`}>
                      {split.type} split
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-20 text-xs font-medium ${muted}`}>{split.groupA.label}</span>
                        <span className={`font-mono text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                          {(split.groupA.conversion * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500">n={split.groupA.count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-20 text-xs font-medium ${muted}`}>{split.groupB.label}</span>
                        <span className={`font-mono text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                          {(split.groupB.conversion * 100).toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500">n={split.groupB.count}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex flex-col items-end gap-2">
                      <span className={`font-mono text-base font-bold ${
                        split.difference >= 0 ? "text-brand-success" : "text-brand-danger"
                      }`}>
                        {(split.difference * 100).toFixed(2)}%
                      </span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200/20">
                        <div 
                          className="h-full bg-premium-gradient transition-all duration-1000 group-hover:scale-x-110"
                          style={{ width: `${impactPercent}%`, transformOrigin: 'right' }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
