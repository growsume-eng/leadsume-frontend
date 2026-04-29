"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      ref.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 outline-none animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {description && (
          <p className="text-sm text-slate-400 mb-6">{description}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              destructive
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
