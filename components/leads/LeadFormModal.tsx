"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/lib/schemas";
import type { Lead } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";

// ── Inline brand SVGs (lucide-react v1.x has no social brand icons) ─────────
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

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
const optBadge = <span className="text-slate-600 font-normal">(optional)</span>;

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
      linkedin:  lead?.linkedin  ?? "",
      instagram: lead?.instagram ?? "",
      facebook:  lead?.facebook  ?? "",
      status:    (lead?.status as LeadFormValues["status"]) ?? "New",
    },
  });

  async function onSubmit(data: LeadFormValues) {
    const payload = {
      first_name: data.firstName,
      last_name:  data.lastName,
      email:      data.email,
      company:    data.company   || null,
      website:    data.website   || null,
      linkedin:   data.linkedin  || null,
      instagram:  data.instagram || null,
      facebook:   data.facebook  || null,
      status:     data.status,
    };

    if (isEdit && lead) {
      // ── UPDATE ────────────────────────────────────────────────────────────
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
      // ── INSERT ────────────────────────────────────────────────────────────
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
      {/* Scrollable inner so it never clips on small screens */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl w-full max-w-lg mx-4 my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-base font-semibold text-slate-100">
            {isEdit ? "Edit Lead" : "New Lead"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto px-6 pb-6 space-y-4"
        >
          {/* ── First Name + Last Name ─────────────────────────────────────── */}
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

          {/* ── Email ─────────────────────────────────────────────────────── */}
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

          {/* ── Company + Website ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Company {optBadge}</label>
              <input {...register("company")} placeholder="Acme Corp" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website {optBadge}</label>
              <input {...register("website")} placeholder="https://acme.com" className={inputCls} />
            </div>
          </div>

          {/* ── Social Profiles ────────────────────────────────────────────── */}
          <div className="pt-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Social Profiles <span className="normal-case font-normal text-slate-600">(optional)</span>
            </p>
            <div className="space-y-3">
              {/* LinkedIn */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0077b5]/15 flex items-center justify-center shrink-0">
                  <LinkedInIcon />
                </div>
                <div className="flex-1">
                  <input
                    {...register("linkedin")}
                    placeholder="https://linkedin.com/in/username"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e1306c]/15 flex items-center justify-center shrink-0">
                  <InstagramIcon />
                </div>
                <div className="flex-1">
                  <input
                    {...register("instagram")}
                    placeholder="https://instagram.com/username"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1877f2]/15 flex items-center justify-center shrink-0">
                  <FacebookIcon />
                </div>
                <div className="flex-1">
                  <input
                    {...register("facebook")}
                    placeholder="https://facebook.com/pagename"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Status ────────────────────────────────────────────────────── */}
          <div>
            <label className={labelCls}>Status</label>
            <select
              {...register("status")}
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
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
