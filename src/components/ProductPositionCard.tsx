import { ProductRecord } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type ProductPositionCardProps = {
  product?: ProductRecord;
};

/**
 * Product-Level Traceability Card
 * Shows the raw attributes and performance metrics for the selected product.
 */
export default function ProductPositionCard({ product }: ProductPositionCardProps) {
  const { theme } = useTheme();
  
  if (!product) return null;

  const isDark = theme === "dark";

  return (
    <div className={`rounded-2xl border p-6 transition-all ${
      isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
    }`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
              Product Traceability
            </h3>
            <p className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              ASIN: {product.id}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🔍</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DetailBox label="Rating" value={`${product.rating.toFixed(1)} / 5`} subValue={`${product.reviewCount} Reviews`} isDark={isDark} />
          <DetailBox 
            label="Sentiment" 
            value={`${(product.sentiment * 100).toFixed(1)}%`} 
            subValue={product.sentiment > 0.5 ? "Positive" : "Neutral/Negative"} 
            isDark={isDark} 
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200/10">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Computed Performance
          </h4>
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50"
          }`}>
            <div>
              <span className={`block text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Proxy Conversion
              </span>
              <span className="text-[10px] text-slate-500 italic">
                (trust × interest)
              </span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {(product.behavior?.conversionProxy * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-[11px] leading-relaxed text-amber-500/80 italic">
            This product is being compared against its category baseline using review-derived signals.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, subValue, isDark }: { label: string, value: string, subValue: string, isDark: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${
      isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-white shadow-sm"
    }`}>
      <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </span>
      <span className={`block text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
        {value}
      </span>
      <span className="text-[10px] text-slate-500">
        {subValue}
      </span>
    </div>
  );
}
