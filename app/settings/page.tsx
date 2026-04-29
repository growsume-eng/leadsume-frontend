"use client";

import { useState } from "react";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, emailSettingsSchema, type ProfileFormValues, type EmailSettingsFormValues } from "@/lib/schemas";
import { toast } from "sonner";
import { User, Key, Mail, Copy, RefreshCw } from "lucide-react";
import { cn, generateId } from "@/lib/utils";

const TABS = ["Profile", "API Keys", "Email Settings"] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>("Profile");
  const [masked, setMasked] = useState(true);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: state.profile.name, email: state.profile.email },
  });

  const emailForm = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: { defaultSignature: state.settings.defaultSignature, defaultDomain: state.settings.defaultDomain, defaultInboxId: state.settings.defaultInboxId },
  });

  function saveProfile(data: ProfileFormValues) {
    dispatch({ type: "UPDATE_PROFILE", payload: data });
    toast.success("Profile saved");
  }

  function saveEmailSettings(data: EmailSettingsFormValues) {
    dispatch({ type: "UPDATE_SETTINGS", payload: data });
    toast.success("Email settings saved");
  }

  function regenerateKey() {
    dispatch({ type: "REGENERATE_API_KEY" });
    toast.success("API key regenerated");
    setMasked(false);
  }

  function copyKey() {
    navigator.clipboard.writeText(state.settings.apiKey).then(() => toast.success("API key copied"));
  }

  const displayKey = masked ? state.settings.apiKey.slice(0, 8) + "•".repeat(16) : state.settings.apiKey;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#111827] border border-[#1f2d45] rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}>
            {t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "Profile" && (
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center text-xl font-bold text-white">
              {state.profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{state.profile.name}</p>
              <p className="text-xs text-slate-500">{state.profile.email}</p>
              <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors flex items-center gap-1">
                <User className="w-3 h-3" /> Change avatar
              </button>
            </div>
          </div>
          {[
            { name: "name" as const, label: "Full Name" },
            { name: "email" as const, label: "Email Address" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
              <input {...profileForm.register(name)}
                className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              {profileForm.formState.errors[name] && <p className="text-xs text-rose-400 mt-1">{profileForm.formState.errors[name]?.message}</p>}
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">Save Profile</button>
          </div>
        </form>
      )}

      {/* API Keys Tab */}
      {tab === "API Keys" && (
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">API Key</h3>
          </div>
          <p className="text-xs text-slate-400">Use this key to authenticate API requests. Keep it secret.</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg font-mono text-sm text-slate-300 truncate">
              {displayKey}
            </div>
            <button onClick={() => setMasked(!masked)} className="px-3 py-3 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-lg border border-[#1f2d45] transition-colors">
              {masked ? "Show" : "Hide"}
            </button>
            <button onClick={copyKey} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg border border-[#1f2d45] transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button onClick={regenerateKey} className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-sm font-medium rounded-lg transition-colors border border-amber-600/20">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate Key
          </button>
          <p className="text-xs text-slate-600">Regenerating will invalidate your current key immediately.</p>
        </div>
      )}

      {/* Email Settings Tab */}
      {tab === "Email Settings" && (
        <form onSubmit={emailForm.handleSubmit(saveEmailSettings)} className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Email Defaults</h3>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Sending Domain</label>
            <input {...emailForm.register("defaultDomain")}
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Inbox</label>
            <select {...emailForm.register("defaultInboxId")}
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {state.inboxes.map(i => <option key={i.id} value={i.id}>{i.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Email Signature</label>
            <textarea {...emailForm.register("defaultSignature")} rows={5}
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">Save Settings</button>
          </div>
        </form>
      )}
    </div>
  );
}
