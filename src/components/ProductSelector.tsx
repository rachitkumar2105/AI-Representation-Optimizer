import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductRecord } from "../data/types";
import { useTheme } from "../hooks/useTheme";

type ProductSelectorProps = {
  products: ProductRecord[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  enableNavigate?: boolean;
};

export default function ProductSelector({
  products,
  selectedId,
  onSelect,
  enableNavigate = true,
}: ProductSelectorProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { theme } = useTheme();

  const filtered = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);

  const isDark = theme === "dark";
  const card = isDark ? "border-slate-800 bg-slate-900/60 glass-dark" : "border-slate-200 bg-white/80 backdrop-blur-md";
  const title = isDark ? "text-white" : "text-slate-900";
  const muted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`rounded-3xl border p-6 shadow-xl ${card}`}>
      <div className="mb-6">
        <h2 className={`text-xl font-bold tracking-tight ${title}`}>Product Registry</h2>
        <p className={`mt-1 text-xs ${muted}`}>Select a product to view AI-ranked deltas.</p>
      </div>

      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className={`h-4 w-4 ${muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search inventory..."
          className={`w-full rounded-2xl border pl-10 pr-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary/20 ${
            isDark
              ? "border-slate-700 bg-slate-950/60 text-white focus:border-brand-primary/50"
              : "border-slate-200 bg-slate-50 text-slate-900 focus:border-brand-primary/30"
          }`}
        />
      </div>

      <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {filtered.map((product) => {
          const isSelected = selectedId === product.id;
          return (
            <button
              key={product.id}
              onClick={() => {
                onSelect?.(product.id);
                if (enableNavigate) {
                  navigate(`/product/${product.id}`);
                }
              }}
              className={`group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-95 ${
                isSelected
                  ? (isDark ? "border-brand-primary bg-brand-primary/10" : "border-brand-primary bg-brand-primary/5 shadow-sm")
                  : (isDark ? "border-slate-800 bg-slate-950/40 hover:border-slate-700" : "border-slate-100 bg-slate-50 hover:border-slate-200")
              }`}
            >
              <div>
                <span className={`block text-sm font-bold ${
                  isSelected ? (isDark ? "text-white" : "text-brand-primary") : (isDark ? "text-slate-200" : "text-slate-700")
                }`}>
                  {product.name}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${muted}`}>
                  {product.category || "General"}
                </span>
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className={`py-8 text-center text-sm ${muted}`}>No products found.</p>
        )}
      </div>
    </div>
  );
}
