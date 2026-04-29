"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-600/10 border border-rose-600/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 mb-5">{error.message}</p>
        <button onClick={reset} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}
