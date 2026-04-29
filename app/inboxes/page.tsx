"use client";

import { useState } from "react";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { InboxAccount } from "@/lib/types";
import ConfirmModal from "@/components/shared/ConfirmModal";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wifi, WifiOff, Loader2, UserCircle, RefreshCw, Gauge } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inboxSchema, type InboxFormValues } from "@/lib/schemas";
import { X } from "lucide-react";
import { generateId } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_ICON: Record<string, React.ReactNode> = {
  Connected: <Wifi className="w-4 h-4 text-emerald-400" />,
  Error: <WifiOff className="w-4 h-4 text-rose-400" />,
  Connecting: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />,
};

const STATUS_LABEL: Record<string, string> = {
  Connected: "text-emerald-400 bg-emerald-400/10",
  Error: "text-rose-400 bg-rose-400/10",
  Connecting: "text-amber-400 bg-amber-400/10",
};

interface InboxFormModalProps {
  inbox?: InboxAccount;
  onClose: () => void;
}

function InboxFormModal({ inbox, onClose }: InboxFormModalProps) {
  const dispatch = useAppDispatch();
  const isEdit = !!inbox;

  const { register, handleSubmit, formState: { errors } } = useForm<InboxFormValues>({
    resolver: zodResolver(inboxSchema),
    defaultValues: {
      email: inbox?.email ?? "",
      smtpHost: inbox?.smtpHost ?? "smtp.gmail.com",
      smtpPort: inbox?.smtpPort ?? 587,
      password: "",
      dailyCap: inbox?.dailyCap ?? 200,
    },
  });

  function onSubmit(data: InboxFormValues) {
    if (isEdit && inbox) {
      dispatch({ type: "UPDATE_INBOX", payload: { ...inbox, ...data } });
      toast.success("Inbox updated");
    } else {
      const newId = generateId();
      dispatch({ type: "ADD_INBOX", payload: data });
      // Simulate async connection
      setTimeout(() => {
        dispatch({
          type: "UPDATE_INBOX_STATUS",
          payload: { id: newId, status: "Connected" },
        });
      }, 2500);
      toast.success("Inbox added — connecting…");
    }
    onClose();
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
            { name: "email" as const,    label: "Email Address",          placeholder: "you@domain.com",   type: "email"    },
            { name: "smtpHost" as const, label: "SMTP Host",              placeholder: "smtp.gmail.com",   type: "text"     },
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
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              {isEdit ? "Save Changes" : "Add Inbox"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InboxesPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);
  const [editInbox, setEditInbox] = useState<InboxAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    dispatch({ type: "DELETE_INBOX", payload: deleteId });
    toast.success("Inbox removed");
    setDeleteId(null);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Inboxes</h2>
          <p className="text-sm text-slate-400 mt-0.5">{state.inboxes.length} configured inboxes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Inbox
        </button>
      </div>

      {/* Empty state */}
      {state.inboxes.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {state.inboxes.map(inbox => {
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
                  {STATUS_ICON[inbox.status]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-200 truncate">{inbox.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[inbox.status]}`}>
                      {inbox.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{inbox.smtpHost}:{inbox.smtpPort}</p>

                  {/* Stats row */}
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

      {showForm && <InboxFormModal onClose={() => setShowForm(false)} />}
      {editInbox && <InboxFormModal inbox={editInbox} onClose={() => setEditInbox(null)} />}
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
