"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/lib/schemas";
import type { Lead } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Props {
  lead?: Lead;
  onClose: () => void;
  /** Called after a successful insert or update so the parent can re-fetch */
  onSaved?: () => void;
}

const STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;

const inputCls =
  "w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

export default function LeadFormModal({ lead, onClose, onSaved }: Props) {
  const isEdit = !!lead;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: lead?.firstName ?? "",
      lastName:  lead?.lastName  ?? "",
      email:     lead?.email     ?? "",
      company:   lead?.company   ?? "",
      website:   lead?.website   ?? "",
      status:    lead?.status    ?? "New",
    },
  });

  async function onSubmit(data: LeadFormValues) {
    const payload = {
      first_name: data.firstName,
      last_name:  data.lastName,
      email:      data.email,
      company:    data.company  || null,
      website:    data.website  || null,
      status:     data.status,
    };

    if (isEdit && lead) {
      // ── UPDATE ──────────────────────────────────────────────────────────────
      const { error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", lead.id);

      if (error) {
        console.error("[LeadFormModal] update error:", error.message);
        toast.error("Failed to update lead: " + error.message);
        return;
      }
      toast.success("Lead updated");
    } else {
      // ── INSERT ──────────────────────────────────────────────────────────────
      const { error } = await supabase.from("leads").insert(payload);

      if (error) {
        console.error("[LeadFormModal] insert error:", error.message);
        toast.error("Failed to create lead: " + error.message);
        return;
      }
      toast.success("Lead created");
    }

    onSaved?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-100">
            {isEdit ? "Edit Lead" : "New Lead"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First name + Last name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name</label>
              <input {...register("firstName")} placeholder="Jordan" className={inputCls} />
              {errors.firstName && (
                <p className="text-xs text-rose-400 mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input {...register("lastName")} placeholder="Williams" className={inputCls} />
              {errors.lastName && (
                <p className="text-xs text-rose-400 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="jordan@example.com"
              className={inputCls}
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Company + Website */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Company <span className="text-slate-600">(optional)</span></label>
              <input {...register("company")} placeholder="Acme Corp" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website <span className="text-slate-600">(optional)</span></label>
              <input {...register("website")} placeholder="https://acme.com" className={inputCls} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <select
              {...register("status")}
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
