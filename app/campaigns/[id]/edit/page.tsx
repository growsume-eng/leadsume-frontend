"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { useEffect, useState } from "react";
import type { Campaign, Sequence } from "@/lib/types";
import { generateId, parseSpintax } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, ChevronLeft, Check, Sparkles, Eye } from "lucide-react";

export default function CampaignEditPage() {
  const params = useParams();
  const router = useRouter();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const campaign = state.campaigns.find(c => c.id === params.id);

  const [name, setName] = useState(campaign?.name ?? "");
  const [sendingEmail, setSendingEmail] = useState(campaign?.sendingEmail ?? "");
  const [fromName, setFromName] = useState(campaign?.fromName ?? "");
  const [domain, setDomain] = useState(campaign?.domain ?? "");
  const [sequences, setSequences] = useState<Sequence[]>(campaign?.sequences ?? []);
  const [previewText, setPreviewText] = useState<string | null>(null);

  useEffect(() => {
    if (!campaign) { router.push("/campaigns"); }
  }, [campaign, router]);

  if (!campaign) return null;

  function addSequence() { setSequences([ ...sequences, { id: generateId(), subject: "", body: "", delayDays: 0, delayUnit: "days" } ]); }  function removeSeq(id: string) { setSequences(sequences.filter(s => s.id !== id)); }
  function updateSeq(id: string, field: keyof Sequence, value: string | number) {
    setSequences(sequences.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function handleSave() {
    if (!name.trim()) { toast.error("Campaign name is required"); return; }
    const updated: Campaign = { ...(campaign as Campaign), name, sendingEmail, fromName, domain, sequences };
    dispatch({ type: "UPDATE_CAMPAIGN", payload: updated });
    toast.success("Campaign updated");
    router.push("/campaigns");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/campaigns")} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Edit Campaign</h2>
          <p className="text-xs text-slate-500">{campaign.name}</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-200">Details</h3>
        {[
          { label: "Campaign Name", value: name, set: setName },
          { label: "From Name", value: fromName, set: setFromName },
          { label: "Domain", value: domain, set: setDomain },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
            <input value={value} onChange={e => set(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Sending Inbox</label>
          <select value={sendingEmail} onChange={e => setSendingEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            {state.inboxes.map(i => <option key={i.id} value={i.email}>{i.email}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Sequences</h3>
          <button onClick={addSequence} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
        </div>
        {sequences.map((seq, idx) => (
          <div key={seq.id} className="border border-[#1f2d45] rounded-xl p-4 space-y-3 bg-[#0d1424]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400">Step {idx + 1}</span>
              {sequences.length > 1 && <button onClick={() => removeSeq(seq.id)} className="text-slate-600 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
            </div>
            <input value={seq.subject} onChange={e => updateSeq(seq.id, "subject", e.target.value)} placeholder="Subject…"
              className="w-full px-3 py-2 bg-[#111827] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <textarea value={seq.body} onChange={e => updateSeq(seq.id, "body", e.target.value)} rows={5}
              className="w-full px-3 py-2 bg-[#111827] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono" />
            <button onClick={() => setPreviewText(parseSpintax(seq.body))} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Preview spintax
            </button>
          </div>
        ))}
        {previewText && (
          <div className="border border-indigo-500/30 bg-indigo-600/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Preview</span>
              <button onClick={() => setPreviewText(null)} className="text-xs text-slate-500 hover:text-slate-300">Close</button>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{previewText}</pre>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push("/campaigns")} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
          <Check className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </div>
  );
}
