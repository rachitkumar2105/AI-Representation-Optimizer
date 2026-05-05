import { useData } from "../context/DataContext";
import { useTheme } from "../hooks/useTheme";

/**
 * Production-Grade Transparency Panel
 * Provides visible proof of data match quality, pipeline flow, and proxy metric derivation.
 */
export default function TransparencyPanel() {
  const { matchMetrics, isAuditMode, setAuditMode } = useData();
  const { theme } = useTheme();

  if (!matchMetrics) return null;

  const isDark = theme === "dark";

  return (
    <div className={`rounded-3xl border p-8 transition-all ${
      isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* 1. Data Source & Coverage */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                Data Source & Coverage
              </h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Real-time audit of the Amazon products + reviews join quality.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricBox label="Total Products" value={matchMetrics.totalProducts.toLocaleString()} isDark={isDark} />
            <MetricBox label="Total Reviews" value={matchMetrics.totalReviews.toLocaleString()} isDark={isDark} />
            <MetricBox 
              label="Match Quality" 
              value={`${matchMetrics.matchRate.toFixed(1)}%`} 
              isDark={isDark} 
              status={matchMetrics.matchRate > 90 ? "success" : "warning"}
            />
            <MetricBox label="Missing Price" value={matchMetrics.missingPrice.toLocaleString()} isDark={isDark} status="warning" />
          </div>
        </div>

        {/* 2. Pipeline Flow */}
        <div className={`flex-1 p-6 rounded-2xl border ${
          isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
        }`}>
          <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            System Pipeline Flow
          </h4>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            <FlowStep label="CSV" isDark={isDark} />
            <FlowArrow />
            <FlowStep label="Group" isDark={isDark} />
            <FlowArrow />
            <FlowStep label="Merge" isDark={isDark} />
            <FlowArrow />
            <FlowStep label="Proxy" isDark={isDark} />
            <FlowArrow />
            <FlowStep label="Insights" active isDark={isDark} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/10 flex items-center justify-between">
            <div className="text-[10px] font-medium text-slate-500 italic">
              * conversionProxy = trustScore × interestScore
            </div>
            <button
              onClick={() => setAuditMode(!isAuditMode)}
              className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
                isAuditMode 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-slate-700 text-slate-500 hover:border-slate-500"
              }`}
            >
              {isAuditMode ? "Audit Mode: ON" : "Enable Audit Mode"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, isDark, status }: { label: string, value: string, isDark: boolean, status?: "success" | "warning" }) {
  return (
    <div className={`p-4 rounded-2xl border ${
      isDark ? "border-slate-800/50 bg-slate-900/40" : "border-slate-100 bg-white"
    }`}>
      <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </span>
      <span className={`text-lg font-bold ${
        status === "success" ? "text-emerald-500" :
        status === "warning" ? "text-amber-500" :
        isDark ? "text-white" : "text-slate-900"
      }`}>
        {value}
      </span>
    </div>
  );
}

function FlowStep({ label, active, isDark }: { label: string, active?: boolean, isDark: boolean }) {
  return (
    <div className={`px-3 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap ${
      active 
        ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
        : isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"
    }`}>
      {label}
    </div>
  );
}

function FlowArrow() {
  return <span className="text-slate-700 text-[10px]">→</span>;
}
