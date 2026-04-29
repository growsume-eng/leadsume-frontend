"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/lib/schemas";
import { useAppDispatch } from "@/context/AppContext";
import type { Lead } from "@/lib/types";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Props {
  lead?: Lead;
  onClose: () => void;
}

const STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;

export default function LeadFormModal({ lead, onClose }: Props) {
  const dispatch = useAppDispatch();
  const isEdit = !!lead;

  const { register, handleSubmit, formState: { errors } } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      company: lead?.company ?? "",
      title: lead?.title ?? "",
      status: lead?.status ?? "New",
      tags: lead?.tags.join(", ") ?? "",
      owner: lead?.owner ?? "",
    },
  });

  function onSubmit(data: LeadFormValues) {
    const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (isEdit && lead) {
      dispatch({ type: "UPDATE_LEAD", payload: { ...lead, ...data, tags: tagsArray } });
      toast.success("Lead updated");
    } else {
      dispatch({ type: "ADD_LEAD", payload: { ...data, tags: tagsArray } });
      toast.success("Lead created");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-100">{isEdit ? "Edit Lead" : "New Lead"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "name" as const, label: "Full Name", placeholder: "Jordan Williams" },
              { name: "email" as const, label: "Email", placeholder: "jordan@example.com" },
              { name: "company" as const, label: "Company", placeholder: "Acme Corp" },
              { name: "title" as const, label: "Job Title", placeholder: "CEO" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                <input {...register(name)} placeholder={placeholder}
                  className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                {errors[name] && <p className="text-xs text-rose-400 mt-1">{errors[name]?.message}</p>}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
            <select {...register("status")} className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma separated)</label>
            <input {...register("tags")} placeholder="saas, b2b, startup"
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              {isEdit ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
