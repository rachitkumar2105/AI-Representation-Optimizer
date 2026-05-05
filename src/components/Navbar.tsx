import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { theme } = useTheme();
  const location = useLocation();

  const isDark = theme === "dark";

  return (
    <nav className={`sticky top-0 z-50 border-b transition-all duration-300 ${
      isDark 
        ? "border-slate-800/50 bg-slate-950/80 backdrop-blur-md" 
        : "border-slate-200/50 bg-white/80 backdrop-blur-md"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-gradient shadow-lg group-hover:scale-110 transition-transform">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              AI Representation <span className="text-brand-primary">Optimizer</span>
            </span>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Official Judging Build v1.0
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-1 md:flex">
            {[
              { label: "Dashboard", path: "/" },
              { label: "Dataset", path: "/data" },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? (isDark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900")
                    : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className={`h-6 w-[1px] ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
