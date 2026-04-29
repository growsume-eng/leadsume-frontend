import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  icon?: React.ReactNode;
  accent?: string;
}

export default function StatCard({ label, value, change, icon, accent = "indigo" }: StatCardProps) {
  const accentMap: Record<string, string> = {
    indigo: "from-indigo-600/20 to-indigo-600/5 border-indigo-600/20 text-indigo-400",
    violet: "from-violet-600/20 to-violet-600/5 border-violet-600/20 text-violet-400",
    cyan: "from-cyan-600/20 to-cyan-600/5 border-cyan-600/20 text-cyan-400",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-600/20 text-emerald-400",
    amber: "from-amber-600/20 to-amber-600/5 border-amber-600/20 text-amber-400",
    rose: "from-rose-600/20 to-rose-600/5 border-rose-600/20 text-rose-400",
  };

  const accentClass = accentMap[accent] ?? accentMap.indigo;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5",
        accentClass
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-100 tracking-tight">
            {value}
          </p>
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                change > 0
                  ? "text-emerald-400"
                  : change < 0
                  ? "text-rose-400"
                  : "text-slate-500"
              )}
            >
              {change > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : change < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>
                {change > 0 ? "+" : ""}
                {change}% vs last month
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-white/5">{icon}</div>
        )}
      </div>
    </div>
  );
}
