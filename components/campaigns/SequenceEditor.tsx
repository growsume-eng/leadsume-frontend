"use client";

import { useState, useCallback } from "react";
import type { Sequence, SequenceVariants } from "@/lib/types";
import type { Lead } from "@/lib/types";
import { generateId, renderEmail } from "@/lib/utils";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff,
  Shuffle, FlaskConical, Copy, Lightbulb, User,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPINTAX_EXAMPLES = [
  { pattern: "{Hi|Hello|Hey} {{first_name}}", desc: "Greeting variation" },
  { pattern: "{your company|your team}", desc: "Reference variation" },
  { pattern: "{a quick call|15 minutes}", desc: "CTA variation" },
  { pattern: "{I noticed|I saw|I came across}", desc: "Opener variation" },
  { pattern: "{Thanks|Appreciate it|Many thanks}", desc: "Sign-off variation" },
];

const VARIABLES: Array<{ token: string; label: string; field: keyof Lead }> = [
  { token: "{{first_name}}",  label: "First Name",  field: "firstName"  },
  { token: "{{last_name}}",   label: "Last Name",   field: "lastName"   },
  { token: "{{company}}",     label: "Company",     field: "company"    },
  { token: "{{website}}",     label: "Website",     field: "website"    },
  { token: "{{linkedin}}",    label: "LinkedIn",    field: "linkedin"   },
  { token: "{{email}}",       label: "Email",       field: "email"      },
];

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 bg-[#111827] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors";

// ─── Helper: default step ─────────────────────────────────────────────────────
function makeStep(index: number): Sequence {
  return {
    id: generateId(),
    subject: "",
    body: "",
    delayValue: index === 0 ? 0 : 2,
    delayUnit: "days",
    delayDays: index === 0 ? 0 : 2, // compat
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
    >
      {copied ? (
        <span className="text-[10px] text-emerald-400 font-medium">✓</span>
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

// ─── Help sidebar ─────────────────────────────────────────────────────────────

function HelpPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-56 shrink-0 bg-[#0d1424] border border-[#1f2d45] rounded-2xl overflow-hidden self-start sticky top-0">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Help
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="px-3 pb-4 space-y-4 border-t border-[#1f2d45]">
          {/* Spintax */}
          <div className="pt-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Spintax
            </p>
            <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">
              Randomises text per send. Click to copy.
            </p>
            <div className="space-y-1">
              {SPINTAX_EXAMPLES.map(ex => (
                <div
                  key={ex.pattern}
                  className="flex items-center justify-between bg-[#111827] border border-[#1f2d45] rounded-lg px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <code className="text-[10px] text-amber-400 block truncate">{ex.pattern}</code>
                    <span className="text-[9px] text-slate-700">{ex.desc}</span>
                  </div>
                  <CopyButton text={ex.pattern} />
                </div>
              ))}
            </div>
          </div>

          {/* Variables */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Variables
            </p>
            <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">
              Replaced with lead data. Click to copy.
            </p>
            <div className="space-y-1">
              {VARIABLES.map(v => (
                <div
                  key={v.token}
                  className="flex items-center justify-between bg-[#111827] border border-[#1f2d45] rounded-lg px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <code className="text-[10px] text-indigo-400 block truncate">{v.token}</code>
                    <span className="text-[9px] text-slate-700">{v.label}</span>
                  </div>
                  <CopyButton text={v.token} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview panel ────────────────────────────────────────────────────────────

function PreviewPanel({
  sequences,
  leads,
}: {
  sequences: Sequence[];
  leads: Lead[];
}) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id ?? "");
  const [activeSeqId, setActiveSeqId] = useState<string>(sequences[0]?.id ?? "");
  const [refreshKey, setRefreshKey] = useState(0);

  const lead = leads.find(l => l.id === selectedLeadId);
  const seq  = sequences.find(s => s.id === activeSeqId) ?? sequences[0];

  const leadMap: Record<string, string | undefined> = lead
    ? {
        first_name: lead.firstName,
        last_name:  lead.lastName,
        firstName:  lead.firstName,
        lastName:   lead.lastName,
        company:    lead.company ?? "",
        website:    lead.website ?? "",
        linkedin:   lead.linkedin ?? "",
        email:      lead.email,
      }
    : {};

  const previewSubject = seq ? renderEmail(seq.subject || "(no subject)", leadMap) : "";
  const previewBody    = seq ? renderEmail(seq.body    || "(empty body)", leadMap) : "";

  return (
    <div className="w-64 shrink-0 bg-[#0d1424] border border-[#1f2d45] rounded-2xl overflow-hidden self-start sticky top-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1f2d45] flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-indigo-400" /> Live Preview
        </span>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          title="Re-randomise spintax"
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
        >
          <Shuffle className="w-3 h-3" /> Re-roll
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Lead selector */}
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block font-medium uppercase tracking-wider">Lead</label>
          {leads.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic">No leads in state. Add leads first.</p>
          ) : (
            <select
              value={selectedLeadId}
              onChange={e => setSelectedLeadId(e.target.value)}
              className="w-full px-2 py-1.5 bg-[#111827] border border-[#1f2d45] rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {[l.firstName, l.lastName].filter(Boolean).join(" ") || l.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step selector */}
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block font-medium uppercase tracking-wider">Step</label>
          <select
            value={activeSeqId}
            onChange={e => setActiveSeqId(e.target.value)}
            className="w-full px-2 py-1.5 bg-[#111827] border border-[#1f2d45] rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {sequences.map((s, i) => (
              <option key={s.id} value={s.id}>Step {i + 1}</option>
            ))}
          </select>
        </div>

        {/* Rendered email */}
        <div key={refreshKey} className="bg-[#111827] border border-[#1f2d45] rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1f2d45]">
            <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Subject</p>
            <p className="text-xs font-medium text-slate-200 leading-snug">{previewSubject}</p>
          </div>
          <div className="px-3 py-2 max-h-52 overflow-y-auto">
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Body</p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {previewBody}
            </pre>
          </div>
        </div>

        {!lead && leads.length > 0 && (
          <p className="text-[10px] text-slate-600 flex items-center gap-1">
            <User className="w-3 h-3" /> Select a lead to fill variables
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Single sequence step editor ──────────────────────────────────────────────

function StepCard({
  seq,
  index,
  isOnly,
  onChange,
  onRemove,
}: {
  seq: Sequence;
  index: number;
  isOnly: boolean;
  onChange: (updated: Sequence) => void;
  onRemove: () => void;
}) {
  const [abEnabled, setAbEnabled] = useState(!!seq.variants);
  const [collapsed, setCollapsed]  = useState(false);

  function set<K extends keyof Sequence>(field: K, value: Sequence[K]) {
    onChange({ ...seq, [field]: value });
  }

  function setVariant(variant: "A" | "B", field: "subject" | "body", value: string) {
    const current = seq.variants ?? {
      A: { subject: seq.subject, body: seq.body },
      B: { subject: "",         body: "" },
      split: 50,
    };
    onChange({
      ...seq,
      variants: {
        ...current,
        [variant]: { ...current[variant], [field]: value },
      },
    });
  }

  function setSplit(split: number) {
    const current = seq.variants!;
    onChange({ ...seq, variants: { ...current, split } });
  }

  function toggleAB(enabled: boolean) {
    setAbEnabled(enabled);
    if (!enabled) {
      const { variants: _, ...rest } = seq;
      onChange({ ...rest });
    } else {
      onChange({
        ...seq,
        variants: {
          A: { subject: seq.subject, body: seq.body },
          B: { subject: "",         body: "" },
          split: 50,
        },
      });
    }
  }

  const splitVal = seq.variants?.split ?? 50;

  return (
    <div className="border border-[#1f2d45] rounded-2xl overflow-hidden bg-[#0d1424]">
      {/* Step header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0b0f1a]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600/25 flex items-center justify-center text-xs font-bold text-indigo-400">
            {index + 1}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">
              {index === 0 ? "Cold Email (Day 0)" : `Follow-up ${index}`}
            </p>
            {index > 0 && (
              <p className="text-[10px] text-slate-600">
                Send after {seq.delayValue ?? seq.delayDays ?? 0} {seq.delayUnit}
              </p>
            )}
          </div>
          {abEnabled && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400 text-[10px] font-medium">
              <FlaskConical className="w-2.5 h-2.5" /> A/B
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(p => !p)}
            className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {!isOnly && (
            <button onClick={onRemove} className="p-1 text-slate-600 hover:text-rose-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Timing */}
          {index > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">Send after</span>
              <input
                type="number"
                min={1}
                value={seq.delayValue ?? seq.delayDays ?? 1}
                onChange={e => {
                  const v = Math.max(1, parseInt(e.target.value) || 1);
                  set("delayValue", v);
                  set("delayDays", v);
                }}
                className="w-16 px-2 py-1.5 bg-[#111827] border border-[#1f2d45] rounded-lg text-sm text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={seq.delayUnit}
                onChange={e => set("delayUnit", e.target.value as Sequence["delayUnit"])}
                className="px-2 py-1.5 bg-[#111827] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          )}

          {/* A/B toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <FlaskConical className="w-3.5 h-3.5 text-violet-400" />
              Enable A/B Test
            </label>
            <button
              onClick={() => toggleAB(!abEnabled)}
              className={`relative w-8 h-4 rounded-full transition-colors ${abEnabled ? "bg-violet-600" : "bg-[#1f2d45]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${abEnabled ? "translate-x-4" : ""}`} />
            </button>
          </div>

          {/* ── Standard editor (no A/B) ─────────────────────────────────── */}
          {!abEnabled && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
                <input
                  value={seq.subject}
                  onChange={e => set("subject", e.target.value)}
                  placeholder="Subject line… use {spintax|options} or {{variables}}"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Body</label>
                <textarea
                  value={seq.body}
                  onChange={e => set("body", e.target.value)}
                  rows={7}
                  placeholder={"Hi {{{first_name}|there}},\n\nUse {spintax|variants} and {{variables}} for personalisation…"}
                  className={`${inputCls} resize-none font-mono`}
                />
              </div>
            </div>
          )}

          {/* ── A/B variant editor ───────────────────────────────────────── */}
          {abEnabled && seq.variants && (
            <div className="space-y-4">
              {/* Split slider */}
              <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Split</span>
                  <span className="text-xs font-semibold text-violet-400">
                    A {100 - splitVal}% · B {splitVal}%
                  </span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={splitVal}
                  onChange={e => setSplit(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-[#1f2d45] accent-violet-500 cursor-pointer"
                />
                {/* Visual split bar */}
                <div className="flex h-2 rounded-full overflow-hidden mt-2 gap-0.5">
                  <div className="bg-indigo-500 transition-all" style={{ width: `${100 - splitVal}%` }} />
                  <div className="bg-violet-500 transition-all" style={{ width: `${splitVal}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>Variant A</span><span>Variant B</span>
                </div>
              </div>

              {/* Variant A */}
              <div className="border border-indigo-500/30 rounded-xl p-3 space-y-2 bg-indigo-600/5">
                <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-indigo-600/30 flex items-center justify-center text-[9px]">A</span>
                  Variant A
                  <span className="text-[10px] text-indigo-600 font-normal">{100 - splitVal}% of sends</span>
                </p>
                <input
                  value={seq.variants.A.subject}
                  onChange={e => setVariant("A", "subject", e.target.value)}
                  placeholder="Variant A subject…"
                  className={inputCls}
                />
                <textarea
                  value={seq.variants.A.body}
                  onChange={e => setVariant("A", "body", e.target.value)}
                  rows={5}
                  placeholder="Variant A body…"
                  className={`${inputCls} resize-none font-mono`}
                />
              </div>

              {/* Variant B */}
              <div className="border border-violet-500/30 rounded-xl p-3 space-y-2 bg-violet-600/5">
                <p className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-violet-600/30 flex items-center justify-center text-[9px]">B</span>
                  Variant B
                  <span className="text-[10px] text-violet-600 font-normal">{splitVal}% of sends</span>
                </p>
                <input
                  value={seq.variants.B.subject}
                  onChange={e => setVariant("B", "subject", e.target.value)}
                  placeholder="Variant B subject…"
                  className={inputCls}
                />
                <textarea
                  value={seq.variants.B.body}
                  onChange={e => setVariant("B", "body", e.target.value)}
                  rows={5}
                  placeholder="Variant B body…"
                  className={`${inputCls} resize-none font-mono`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main SequenceEditor component ───────────────────────────────────────────

interface SequenceEditorProps {
  sequences: Sequence[];
  onChange: (sequences: Sequence[]) => void;
  leads?: Lead[];
}

export default function SequenceEditor({ sequences, onChange, leads = [] }: SequenceEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const add = useCallback(() => {
    onChange([...sequences, makeStep(sequences.length)]);
  }, [sequences, onChange]);

  const remove = useCallback((id: string) => {
    onChange(sequences.filter(s => s.id !== id));
  }, [sequences, onChange]);

  const update = useCallback((updated: Sequence) => {
    onChange(sequences.map(s => s.id === updated.id ? updated : s));
  }, [sequences, onChange]);

  return (
    <div className="flex gap-4">
      {/* ── Left help panel ─────────────────────────────────────────────── */}
      <HelpPanel onInsert={() => {}} />

      {/* ── Centre: sequence steps ──────────────────────────────────────── */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Email Sequences</h3>
            <p className="text-xs text-slate-500 mt-0.5">{sequences.length} step{sequences.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showPreview
                  ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                  : "bg-white/5 border-[#1f2d45] text-slate-400 hover:text-slate-200"
              }`}
            >
              {showPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Preview
            </button>
            <button
              onClick={add}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg border border-indigo-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>
        </div>

        {/* Steps */}
        {sequences.map((seq, idx) => (
          <StepCard
            key={seq.id}
            seq={seq}
            index={idx}
            isOnly={sequences.length === 1}
            onChange={update}
            onRemove={() => remove(seq.id)}
          />
        ))}

        {sequences.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-sm mb-3">No steps yet</p>
            <button onClick={add} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add First Step
            </button>
          </div>
        )}
      </div>

      {/* ── Right preview panel ─────────────────────────────────────────── */}
      {showPreview && (
        <PreviewPanel sequences={sequences} leads={leads} />
      )}
    </div>
  );
}
