import { useTheme } from "../hooks/useTheme";

type HealthScoreProps = {
  score: number;
};

/**
 * Product Health Score Visualization
 * A normalized 0-100 composite metric summarizing rating, volume, and sentiment performance.
 */
export default function HealthScore({ score }: HealthScoreProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getStatus = (s: number) => {
    if (s > 80) return { label: "Excellent", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (s > 60) return { label: "Good", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (s > 40) return { label: "Fair", color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "Critical", color: "text-rose-500", bg: "bg-rose-500/10" };
  };

  const status = getStatus(score);

  return (
    <div className={`p-6 rounded-3xl border ${
      isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Health Score
        </h3>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center py-4">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
              strokeWidth="10" 
            />
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="10" 
              strokeDasharray={283}
              strokeDashoffset={283 - (283 * score) / 100}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${status.color}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{score}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">/ 100</span>
          </div>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t border-slate-200/10 grid grid-cols-2 gap-4`}>
        <div className="text-center">
          <span className="block text-[10px] font-bold text-slate-500 uppercase">Rank</span>
          <span className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Top 15%</span>
        </div>
        <div className="text-center border-l border-slate-200/10">
          <span className="block text-[10px] font-bold text-slate-500 uppercase">Growth</span>
          <span className={`text-sm font-bold text-emerald-500`}>+4.2%</span>
        </div>
      </div>
    </div>
  );
}
