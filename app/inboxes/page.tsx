"use client";

import { useState, useEffect, useCallback } from "react";
import type { InboxAccount } from "@/lib/types";
import ConfirmModal from "@/components/shared/ConfirmModal";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wifi, WifiOff, Loader2, UserCircle, RefreshCw, Gauge } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inboxSchema, type InboxFormValues } from "@/lib/schemas";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase, dbInboxToLocal, inboxToDb, type SupabaseInbox } from "@/lib/supabase";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, React.ReactNode> = {
  Connected:  <Wifi    className="w-4 h-4 text-emerald-400" />,
  Error:      <WifiOff className="w-4 h-4 text-rose-400" />,
  Connecting: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />,
};

const STATUS_LABEL: Record<string, string> = {
  Connected:  "text-emerald-400 bg-emerald-400/10",
  Error:      "text-rose-400 bg-rose-400/10",
  Connecting: "text-amber-400 bg-amber-400/10",
};

// ─── Form modal ───────────────────────────────────────────────────────────────

interface InboxFormModalProps {
  inbox?: InboxAccount;
  onClose: () => void;
  onSaved: () => void;
}

function InboxFormModal({ inbox, onClose, onSaved }: InboxFormModalProps) {
  const isEdit = !!inbox;
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<InboxFormValues>({
    resolver: zodResolver(inboxSchema),
    defaultValues: {
      email:    inbox?.email    ?? "",
      smtpHost: inbox?.smtpHost ?? "smtp.gmail.com",
      smtpPort: inbox?.smtpPort ?? 587,
      password: "",
      dailyCap: inbox?.dailyCap ?? 200,
    },
  });

  async function onSubmit(data: InboxFormValues) {
    setSaving(true);
    try {
      if (isEdit && inbox) {
        // UPDATE
        const payload = inboxToDb(data);
        const { error } = await supabase
          .from("inboxes")
          .update(payload)
          .eq("id", inbox.id);
        if (error) throw error;
        toast.success("Inbox updated");
      } else {
        // INSERT
        const payload = { ...inboxToDb(data), status: "Connecting" };
        const { data: inserted, error } = await supabase
          .from("inboxes")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        toast.success("Inbox added — connecting…");

        // Simulate async connection: update status to Connected after 2.5s
        if (inserted?.id) {
          setTimeout(async () => {
            await supabase
              .from("inboxes")
              .update({ status: "Connected", last_sync_at: new Date().toISOString() })
              .eq("id", inserted.id);
          }, 2500);
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("[InboxFormModal] save error:", err);
      toast.error("Failed to save inbox. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-100">{isEdit ? "Edit Inbox" : "Add Inbox"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Text fields */}
          {([
            { name: "email"    as const, label: "Email Address",           placeholder: "you@domain.com",  type: "email"    },
            { name: "smtpHost" as const, label: "SMTP Host",               placeholder: "smtp.gmail.com",  type: "text"     },
            { name: "password" as const, label: "Password / App Password", placeholder: "••••••••",        type: "password" },
          ] as const).map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors[name] && <p className="text-xs text-rose-400 mt-1">{errors[name]?.message}</p>}
            </div>
          ))}

          {/* Numeric fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">SMTP Port</label>
              <input
                {...register("smtpPort", { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.smtpPort && <p className="text-xs text-rose-400 mt-1">{errors.smtpPort.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Daily Cap</label>
              <input
                {...register("dailyCap", { valueAsNumber: true })}
                type="number"
                placeholder="200"
                className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {errors.dailyCap && <p className="text-xs text-rose-400 mt-1">{errors.dailyCap.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Inbox"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxesPage() {
  const [inboxes,   setInboxes]   = useState<InboxAccount[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editInbox, setEditInbox] = useState<InboxAccount | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchInboxes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("inboxes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInboxes((data as SupabaseInbox[]).map(dbInboxToLocal));
    } catch (err) {
      console.error("[InboxesPage] fetch error:", err);
      toast.error("Failed to load inboxes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInboxes(); }, [fetchInboxes]);

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("inboxes").delete().eq("id", deleteId);
      if (error) throw error;
      setInboxes(prev => prev.filter(i => i.id !== deleteId));
      toast.success("Inbox removed");
    } catch (err) {
      console.error("[InboxesPage] delete error:", err);
      toast.error("Failed to remove inbox.");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Inboxes</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? "Loading…" : `${inboxes.length} configured inbox${inboxes.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Inbox
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map(n => (
            <div key={n} className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && inboxes.length === 0 && (
        <EmptyState
          icon={<UserCircle className="w-8 h-8" />}
          title="No inboxes configured"
          description="Add your first SMTP inbox to start sending campaigns."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add Inbox
            </button>
          }
        />
      )}

      {/* Inbox list */}
      {!loading && inboxes.length > 0 && (
        <div className="space-y-3">
          {inboxes.map(inbox => {
            const lastSync = (() => {
              try { return formatDistanceToNow(new Date(inbox.lastSyncAt), { addSuffix: true }); }
              catch { return "Unknown"; }
            })();

            return (
              <div
                key={inbox.id}
                className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5 flex items-center gap-5 group hover:border-[#2a3d5a] transition-colors"
              >
                {/* Status icon */}
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                  {STATUS_ICON[inbox.status] ?? STATUS_ICON["Connecting"]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-200 truncate">{inbox.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[inbox.status] ?? STATUS_LABEL["Connecting"]}`}>
                      {inbox.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{inbox.smtpHost}:{inbox.smtpPort}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <RefreshCw className="w-3 h-3" />
                      <span>Last sync: <span className="text-slate-400">{lastSync}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Gauge className="w-3 h-3" />
                      <span>Daily cap: <span className="text-slate-400">{inbox.dailyCap} emails/day</span></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditInbox(inbox)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    aria-label="Edit inbox"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(inbox.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-colors"
                    aria-label="Delete inbox"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showForm  && <InboxFormModal onClose={() => setShowForm(false)}  onSaved={fetchInboxes} />}
      {editInbox && <InboxFormModal inbox={editInbox} onClose={() => setEditInbox(null)} onSaved={fetchInboxes} />}
      <ConfirmModal
        open={!!deleteId}
        title="Remove Inbox"
        description="Remove this inbox? Active campaigns using it may be affected."
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
