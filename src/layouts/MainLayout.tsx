import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useTheme } from "../hooks/useTheme";

export default function MainLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark ? "bg-[#020617] text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      {/* Background radial gradient for premium feel */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px] opacity-20 ${
          isDark ? "bg-brand-primary" : "bg-brand-primary/40"
        }`}></div>
        <div className={`absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full blur-[120px] opacity-20 ${
          isDark ? "bg-brand-secondary" : "bg-brand-secondary/40"
        }`}></div>
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-6 pt-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
