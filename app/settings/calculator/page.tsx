"use client";

import CapacityCalculator from "@/components/campaigns/CapacityCalculator";
import { Calculator } from "lucide-react";

export default function CalculatorPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Capacity Calculator</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Simulate your cold email lead flow, ramp-up phase, and daily equilibrium
          </p>
        </div>
      </div>
      <CapacityCalculator />
    </div>
  );
}
