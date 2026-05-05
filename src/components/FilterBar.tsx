import { useTheme } from "../hooks/useTheme";

type FilterBarProps = {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
};

/**
 * Dynamic Filter System
 * Provides exploration capabilities across Amazon categories, pricing tiers, and rating baselines.
 */
export default function FilterBar({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange
}: FilterBarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`p-6 rounded-3xl border flex flex-wrap items-end gap-6 ${
      isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-white"
    }`}>
      <div className="space-y-2">
        <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Category</label>
        <select 
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`block w-48 py-2 px-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary outline-none transition-all ${
            isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Min Rating</label>
        <div className="flex items-center gap-4 py-2">
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="0.5" 
            value={minRating}
            onChange={(e) => onRatingChange(parseFloat(e.target.value))}
            className="w-32 accent-primary"
          />
          <span className={`text-sm font-bold min-w-[30px] ${isDark ? "text-white" : "text-slate-900"}`}>{minRating}★</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>Max Price</label>
        <div className="flex items-center gap-4 py-2">
          <input 
            type="range" 
            min="0" 
            max="1000" 
            step="10" 
            value={priceRange[1]}
            onChange={(e) => onPriceChange([0, parseFloat(e.target.value)])}
            className="w-32 accent-primary"
          />
          <span className={`text-sm font-bold min-w-[60px] ${isDark ? "text-white" : "text-slate-900"}`}>${priceRange[1]}</span>
        </div>
      </div>

      <button 
        onClick={() => {
          onCategoryChange("All");
          onRatingChange(0);
          onPriceChange([0, 1000]);
        }}
        className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
          isDark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
        }`}
      >
        Clear Filters
      </button>
    </div>
  );
}
