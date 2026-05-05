import { ProductRecord } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type ComparisonPanelProps = {
  products: ProductRecord[];
  onRemove: (id: string) => void;
};

/**
 * Side-by-Side Product Comparison
 * Provides direct data comparison between 2-3 products to facilitate rapid selection decisions.
 */
export default function ComparisonPanel({ products, onRemove }: ComparisonPanelProps) {
  const { theme } = useTheme();
  if (products.length === 0) return null;

  const isDark = theme === "dark";

  return (
    <div className={`p-8 rounded-3xl border ${
      isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"
    }`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Compare Products</h3>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Benchmarking {products.length} selected items side-by-side.</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-xl">⚖️</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Metric</th>
              {products.map(p => (
                <th key={p.id} className="py-4 px-4 min-w-[200px]">
                  <div className="flex items-center justify-between group">
                    <span className={`text-sm font-bold truncate max-w-[150px] ${isDark ? "text-white" : "text-slate-900"}`}>{p.name}</span>
                    <button 
                      onClick={() => onRemove(p.id)}
                      className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-50"}`}>
            <Row label="Rating" products={products} accessor={(p) => p.rating.toFixed(1)} isDark={isDark} />
            <Row label="Reviews" products={products} accessor={(p) => p.reviewCount.toLocaleString()} isDark={isDark} />
            <Row label="Sentiment" products={products} accessor={(p) => `${(p.sentiment * 100).toFixed(1)}%`} isDark={isDark} />
            <Row label="Proxy CV" products={products} accessor={(p) => `${(p.behavior?.conversionProxy * 100).toFixed(2)}%`} isDark={isDark} highlight />
            <Row label="Price" products={products} accessor={(p) => `$${p.price.toFixed(2)}`} isDark={isDark} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, products, accessor, isDark, highlight }: { label: string, products: ProductRecord[], accessor: (p: ProductRecord) => string, isDark: boolean, highlight?: boolean }) {
  return (
    <tr className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
      <td className={`py-4 px-4 text-xs font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</td>
      {products.map(p => (
        <td key={p.id} className={`py-4 px-4 font-mono text-sm ${
          highlight ? "text-primary font-bold" : isDark ? "text-slate-300" : "text-slate-700"
        }`}>
          {accessor(p)}
        </td>
      ))}
    </tr>
  );
}
