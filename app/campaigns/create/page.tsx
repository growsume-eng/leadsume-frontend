"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignDetailsSchema, campaignScheduleSchema, type CampaignDetailsValues, type CampaignScheduleValues } from "@/lib/schemas";
import type { Sequence, Campaign, InboxAccount, Lead } from "@/lib/types";
import { generateId, parseSpintax } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Eye, Sparkles, Inbox, Zap, AlertCircle, Loader2 } from "lucide-react";
import SequenceEditor from "@/components/campaigns/SequenceEditor";
import ScheduleTab, { type ScheduleConfig } from "@/components/campaigns/ScheduleTab";
import RecipientsTab from "@/components/campaigns/RecipientsTab";
import { supabase, campaignToDb } from "@/lib/supabase";

const STEPS = ["Details", "Sequences", "Recipients", "Schedule", "Review"];

export default function CampaignCreatePage() {
  const router   = useRouter();
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: details
  const [details, setDetails] = useState<CampaignDetailsValues | null>(null);
  const detailsForm = useForm<CampaignDetailsValues>({ resolver: zodResolver(campaignDetailsSchema), defaultValues: { name: "", sendingEmail: "", domain: "" } });

  // Step 2: sequences
  const [sequences, setSequences] = useState<Sequence[]>([{
    id: generateId(), subject: "", body: "", delayValue: 0, delayDays: 0, delayUnit: "days",
  }]);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Step 0 extras: multi-inbox + per-inbox cap
  const [selectedInboxIds, setSelectedInboxIds] = useState<string[]>([]);
  const [emailsPerDayPerInbox, setEmailsPerDayPerInbox] = useState(30);

  // Step 3: recipients — local copy of leads so imports merge in
  const [localLeads,     setLocalLeads]     = useState<Lead[]>(state.leads);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Keep localLeads in sync if AppContext leads change
  useMemo(() => { setLocalLeads(state.leads); }, [state.leads]);

  // Step 4: schedule — managed as local state, not a form
  const [schedule, setSchedule] = useState<CampaignScheduleValues | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    emailsPerDayPerInbox: emailsPerDayPerInbox,
    batchDelayMinutes: 0,
    startDate: "",
  });

  // Inboxes grouped by domain
  const inboxesByDomain = useMemo(() => {
    const map = new Map<string, InboxAccount[]>();
    state.inboxes.forEach(inbox => {
      const domain = inbox.email.split("@")[1] ?? "other";
      if (!map.has(domain)) map.set(domain, []);
      map.get(domain)!.push(inbox);
    });
    return map;
  }, [state.inboxes]);

  const totalDailyCapacity = selectedInboxIds.length * emailsPerDayPerInbox;

  function addSequence() {
    setSequences(prev => [...prev, {
      id: generateId(), subject: "", body: "",
      delayValue: prev.length * 2, delayDays: prev.length * 2, delayUnit: "days",
    }]);
  }
  function removeSequence(id: string) { setSequences(sequences.filter(s => s.id !== id)); }
  function updateSeq(id: string, field: keyof Sequence, value: string | number) {
    setSequences(sequences.map(s => s.id === id ? { ...s, [field]: value } : s));
  }
  function previewSpintax(body: string) { setPreviewText(parseSpintax(body)); }

  function toggleInbox(id: string) {
    setSelectedInboxIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleNext() {
    if (step === 0) {
      const ok = await detailsForm.trigger();
      if (!ok) return;
      if (selectedInboxIds.length === 0) {
        toast.error("Select at least 1 inbox before continuing");
        return;
      }
      // derive sendingEmail from first selected inbox
      const primaryInbox = state.inboxes.find(i => i.id === selectedInboxIds[0]);
      setDetails({ ...detailsForm.getValues(), sendingEmail: primaryInbox?.email ?? "" });
      setStep(1);
    } else if (step === 1) {
      const invalid = sequences.some(s => {
        if (s.variants) {
          return !s.variants.A.subject || !s.variants.A.body || !s.variants.B.subject || !s.variants.B.body;
        }
        return !s.subject || !s.body;
      });
      if (invalid) { toast.error("Fill all sequence fields (including A/B variants)"); return; }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // persist schedule values into both compat + new state
      setSchedule({ emailsPerDay: scheduleConfig.emailsPerDayPerInbox * selectedInboxIds.length || 50, startDate: scheduleConfig.startDate });
      setStep(4);
    }
  }

  const EMPTY_ANALYTICS = {
    openRate: 0, replyRate: 0, bounceRate: 0,
    interestedRate: 0, notInterestedRate: 0,
    bookedRate: 0, notRepliedRate: 0,
    sequenceStats: [], timeSeries: [],
  };

  async function handleLaunch() {
    if (!details || !schedule || saving) return;
    setSaving(true);
    try {
      const campaign: Omit<Campaign, "id" | "createdAt"> = {
        name: details.name,
        sendingEmail: details.sendingEmail,
        inboxIds: selectedInboxIds,
        domain: details.domain,
        status: "Running",
        sequences,
        leadIds: selectedLeadIds,
        emailsPerDay: scheduleConfig.emailsPerDayPerInbox * selectedInboxIds.length || 50,
        emailsPerDayPerInbox: scheduleConfig.emailsPerDayPerInbox,
        batchDelayMinutes: scheduleConfig.batchDelayMinutes,
        startDate: scheduleConfig.startDate,
        analytics: EMPTY_ANALYTICS,
        rampSettings: { enabled: false, start: 5, step: 5, max: 50 },
      };
      const { error } = await supabase.from("campaigns").insert(campaignToDb(campaign));
      if (error) throw error;
      toast.success("Campaign launched! 🚀");
      router.push("/campaigns");
    } catch (err) {
      console.error("[CampaignCreate] launch error:", err);
      toast.error("Failed to launch campaign. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    if (!details || saving) return;
    setSaving(true);
    try {
      const campaign: Omit<Campaign, "id" | "createdAt"> = {
        name: details.name,
        sendingEmail: details.sendingEmail || "",
        inboxIds: selectedInboxIds,
        domain: details.domain || "",
        status: "Draft",
        sequences,
        leadIds: selectedLeadIds,
        emailsPerDay: scheduleConfig.emailsPerDayPerInbox * selectedInboxIds.length || 50,
        emailsPerDayPerInbox: scheduleConfig.emailsPerDayPerInbox,
        batchDelayMinutes: scheduleConfig.batchDelayMinutes,
        startDate: scheduleConfig.startDate,
        analytics: EMPTY_ANALYTICS,
        rampSettings: { enabled: false, start: 5, step: 5, max: 50 },
      };
      const { error } = await supabase.from("campaigns").insert(campaignToDb(campaign));
      if (error) throw error;
      toast.success("Saved as draft");
      router.push("/campaigns");
    } catch (err) {
      console.error("[CampaignCreate] save draft error:", err);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Create Campaign</h2>
        <p className="text-sm text-slate-400">Set up your cold email sequence in a few steps.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? "bg-indigo-600 text-white" : i === step ? "bg-indigo-600 text-white ring-4 ring-indigo-600/30" : "bg-slate-800 text-slate-500"}`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? "text-indigo-400" : i < step ? "text-slate-300" : "text-slate-600"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-indigo-600" : "bg-slate-700"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 min-h-[400px]">
        {/* Step 0: Details */}
        {step === 0 && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-200">Campaign Details</h3>
            {[
              { name: "name" as const, label: "Campaign Name", placeholder: "e.g. SaaS Founders Q2" },
              { name: "domain" as const, label: "Sending Domain", placeholder: "e.g. growsume.io" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
                <input {...detailsForm.register(name)} placeholder={placeholder}
                  className="w-full px-3 py-2.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                {detailsForm.formState.errors[name] && <p className="text-xs text-rose-400 mt-1">{detailsForm.formState.errors[name]?.message}</p>}
              </div>
            ))}
            {/* ── Multi-inbox selector ───────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-400">Sending Inboxes</label>
                <div className="flex items-center gap-3">
                  {selectedInboxIds.length > 0 && (
                    <span className="text-xs text-indigo-400 font-medium">
                      {selectedInboxIds.length} inbox{selectedInboxIds.length !== 1 ? "es" : ""} selected
                    </span>
                  )}
                  {totalDailyCapacity > 0 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <Zap className="w-3 h-3" />
                      {totalDailyCapacity} emails/day
                    </span>
                  )}
                </div>
              </div>

              {state.inboxes.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  No inboxes found. <a href="/inboxes" className="underline ml-1">Add an inbox first →</a>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {Array.from(inboxesByDomain.entries()).map(([domain, inboxes]) => (
                    <div key={domain} className="bg-[#0d1424] border border-[#1f2d45] rounded-xl overflow-hidden">
                      {/* Domain header */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1f2d45] bg-[#0b0f1a]">
                        <Inbox className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-400">{domain}</span>
                        <span className="ml-auto text-[10px] text-slate-600">{inboxes.length} inbox{inboxes.length !== 1 ? "es" : ""}</span>
                      </div>
                      {/* Inbox rows */}
                      {inboxes.map(inbox => {
                        const checked = selectedInboxIds.includes(inbox.id);
                        const statusColor = inbox.status === "Connected" ? "bg-emerald-400" : inbox.status === "Error" ? "bg-rose-400" : "bg-amber-400";
                        return (
                          <label
                            key={inbox.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/3 ${
                              checked ? "bg-indigo-600/8" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleInbox(inbox.id)}
                              className="w-4 h-4 rounded accent-indigo-500 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                checked ? "text-slate-200" : "text-slate-400"
                              }`}>{inbox.email}</p>
                              <p className="text-[10px] text-slate-600">
                                Cap: {inbox.dailyCap}/day
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                              <span className="text-[10px] text-slate-600">{inbox.status}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {selectedInboxIds.length === 0 && state.inboxes.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Select at least 1 inbox
                </p>
              )}
            </div>

            {/* ── Per-inbox daily cap slider ──────────────────────────── */}
            {selectedInboxIds.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">Emails per Inbox per Day</label>
                  <span className="text-xs font-semibold text-indigo-400">{emailsPerDayPerInbox}</span>
                </div>
                <input
                  type="range" min={10} max={100} step={5}
                  value={emailsPerDayPerInbox}
                  onChange={e => setEmailsPerDayPerInbox(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-[#1f2d45] accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
                  <span>10</span><span>100</span>
                </div>
                <div className="mt-2 flex items-center justify-between bg-indigo-600/10 border border-indigo-600/20 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-400">Total daily capacity</span>
                  <span className="text-sm font-bold text-indigo-400">{totalDailyCapacity} emails/day</span>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Step 1: Sequences */}
        {step === 1 && (
          <SequenceEditor
            sequences={sequences}
            onChange={setSequences}
            leads={state.leads}
          />
        )}

        {/* Step 2: Recipients */}
        {step === 2 && (
          <RecipientsTab
            leads={localLeads}
            selectedLeadIds={selectedLeadIds}
            onSelectionChange={setSelectedLeadIds}
            onLeadsImported={newLeads => {
              setLocalLeads(prev => {
                const existing = new Set(prev.map(l => l.id));
                const merged = [...prev, ...newLeads.filter(l => !existing.has(l.id))];
                return merged;
              });
            }}
          />
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <ScheduleTab
            inboxCount={selectedInboxIds.length}
            value={scheduleConfig}
            onChange={setScheduleConfig}
          />
        )}

        {/* Step 4: Review */}
        {step === 4 && details && schedule && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-200">Review & Launch</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Campaign Name",   value: details.name },
                { label: "Domain",           value: details.domain },
                { label: "Inboxes",          value: `${selectedInboxIds.length} selected` },
                { label: "Daily Capacity",   value: `~${scheduleConfig.emailsPerDayPerInbox * selectedInboxIds.length} emails/day` },
                { label: "Per-Inbox Cap",    value: `${scheduleConfig.emailsPerDayPerInbox}/day` },
                { label: "Batch Delay",      value: scheduleConfig.batchDelayMinutes === 0 ? "None" : `${scheduleConfig.batchDelayMinutes} min` },
                { label: "Recipients",       value: `${selectedLeadIds.length} leads` },
                { label: "Sequences",        value: `${sequences.length} steps` },
                { label: "Start Date",       value: scheduleConfig.startDate || "Immediately" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0d1424] border border-[#1f2d45] rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-slate-200">{String(value)}</p>
                </div>
              ))}
            </div>
            {sequences[0] && (
              <div className="border border-indigo-500/20 bg-indigo-600/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-400 mb-2">First Email Preview</p>
                <p className="text-sm font-medium text-slate-200 mb-2">{parseSpintax(sequences[0].subject)}</p>
                <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans">{parseSpintax(sequences[0].body)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-3">
          <button onClick={() => router.push("/campaigns")} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-[#1f2d45] transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {step === 4 ? (
            <>
              <button onClick={handleSaveDraft} disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 rounded-lg border border-[#1f2d45] transition-colors">
                Save Draft
              </button>
              <button onClick={handleLaunch} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving…" : "Launch Campaign"}
              </button>
            </>
          ) : (
            <button onClick={handleNext} className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
