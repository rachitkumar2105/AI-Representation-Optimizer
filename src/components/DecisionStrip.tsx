import { useTheme } from "../hooks/useTheme";

type DecisionStripProps = {
  title: string;
  description: string;
  badge: string;
};

export default function DecisionStrip({ title, description, badge }: DecisionStripProps) {
  const { theme } = useTheme();
  
  return (
    <section className="relative overflow-hidden rounded-3xl p-1 shadow-2xl">
      <div className="absolute inset-0 bg-premium-gradient opacity-10 blur-3xl"></div>
      <div className={`relative h-full w-full rounded-[1.4rem] border p-8 ${
        theme === "dark" 
          ? "border-slate-800 bg-slate-900/40 glass-dark" 
          : "border-white bg-white/60 backdrop-blur-xl"
      }`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse"></span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.4em] ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}>
                Critical Decision Strip
              </p>
            </div>
            <h1 className={`text-3xl font-bold tracking-tight lg:text-4xl ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              {title}
            </h1>
            <p className={`mt-4 text-lg leading-relaxed ${
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}>
              {description}
            </p>
          </div>
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl border px-6 py-4 text-sm font-semibold shadow-inner ${
              theme === "dark"
                ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                : "border-brand-primary/20 bg-brand-primary/5 text-brand-primary"
            }`}
          >
            {badge}
          </div>
        </div>
      </div>
    </section>
  );
}
