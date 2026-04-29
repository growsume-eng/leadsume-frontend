"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, TrendingUp, Zap, Info } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────────────
interface SequenceStep {
  dayOffset: number;
  label: string; // "Cold" | "Follow-up 1" etc.
}

interface SimDay {
  day: number;
  label: string;
  newLeads: number;
  followUps: number;
  total: number;
  phase: "Ramp" | "Equilibrium";
}

// ── Default sequence ─────────────────────────────────────────────────────────
const DEFAULT_STEPS: SequenceStep[] = [
  { dayOffset: 0,  label: "Cold Email"    },
  { dayOffset: 2,  label: "Follow-up 1"  },
  { dayOffset: 4,  label: "Follow-up 2"  },
  { dayOffset: 6,  label: "Follow-up 3"  },
  { dayOffset: 8,  label: "Follow-up 4"  },
  { dayOffset: 11, label: "Follow-up 5"  },
  { dayOffset: 14, label: "Follow-up 6"  },
];

// ── Simulation engine ────────────────────────────────────────────────────────
function simulate(
  numberOfInboxes: number,
  dailyLimitPerInbox: number,
  totalLeads: number | null,
  steps: SequenceStep[],
  excludeWeekends: boolean,
  simDays: number = 45,
): SimDay[] {
  const capacity = numberOfInboxes * dailyLimitPerInbox;
  if (capacity <= 0 || steps.length === 0) return [];

  const seqLen = Math.max(...steps.map(s => s.dayOffset)) + 1;
  const offsets = steps.map(s => s.dayOffset);

  // Track new leads started on each calendar day
  const newLeadsStarted: number[] = new Array(simDays + seqLen).fill(0);
  const results: SimDay[] = [];

  // Calendar day counter (skipping weekends if needed)
  let calendarDay = 0;

  for (let d = 0; d < simDays; d++) {
    calendarDay++;
    // Weekend skip: advance until Mon–Fri
    if (excludeWeekends) {
      const dow = ((calendarDay - 1) % 7); // 0=Mon … 6=Sun
      while (dow === 5 || dow === 6) { calendarDay++; }
    }

    // ── How many follow-ups are due today?
    let followUps = 0;
    for (let past = 0; past < d; past++) {
      const delta = d - past;
      if (offsets.includes(delta) && newLeadsStarted[past] > 0) {
        followUps += newLeadsStarted[past];
      }
    }
    followUps = Math.min(followUps, capacity);

    // ── Remaining capacity for new leads
    const remaining = Math.max(0, capacity - followUps);
    const equilibrium = Math.floor(capacity / steps.length);
    const isEquilibrium = d >= seqLen;
    const maxNew = isEquilibrium ? equilibrium : remaining;

    let newLeads = maxNew;
    if (totalLeads !== null) {
      const sent = newLeadsStarted.slice(0, d + 1).reduce((a, b) => a + b, 0);
      newLeads = Math.min(newLeads, Math.max(0, totalLeads - sent));
    }
    newLeads = Math.floor(newLeads);

    newLeadsStarted[d] = newLeads;

    results.push({
      day: d + 1,
      label: `Day ${d + 1}`,
      newLeads,
      followUps: Math.round(followUps),
      total: Math.round(newLeads + followUps),
      phase: isEquilibrium ? "Equilibrium" : "Ramp",
    });
  }

  return results;
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const phase = payload[0]?.payload?.phase;
  return (
    <div className="bg-[#1a2540] border border-[#1f2d45] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      <p className="text-xs text-slate-600 mb-2">{phase} Phase</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></span>
        </p>
      ))}
    </div>
  );
}

// ── Slider ────────────────────────────────────────────────────────────────────
function Slider({ label, min, max, value, step = 1, unit = "", onChange }: {
  label: string; min: number; max: number; value: number;
  step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-semibold text-indigo-400">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#1f2d45] accent-indigo-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CapacityCalculator() {
  const [numberOfInboxes,    setNumberOfInboxes]    = useState(3);
  const [dailyLimitPerInbox, setDailyLimitPerInbox] = useState(30);
  const [totalLeadsStr,      setTotalLeadsStr]      = useState("");
  const [excludeWeekends,    setExcludeWeekends]    = useState(false);
  const [steps,              setSteps]              = useState<SequenceStep[]>(DEFAULT_STEPS);
  const [simDays,            setSimDays]            = useState(30);

  const totalLeads = totalLeadsStr ? parseInt(totalLeadsStr, 10) || null : null;

  // ── Run simulation ─────────────────────────────────────────────────────────
  const simData = useMemo(
    () => simulate(numberOfInboxes, dailyLimitPerInbox, totalLeads, steps, excludeWeekends, simDays),
    [numberOfInboxes, dailyLimitPerInbox, totalLeads, steps, excludeWeekends, simDays],
  );

  const capacity     = numberOfInboxes * dailyLimitPerInbox;
  const equilibrium  = steps.length > 0 ? Math.floor(capacity / steps.length) : 0;
  const equilibDay   = simData.findIndex(d => d.phase === "Equilibrium");
  const monthlyNew   = simData.reduce((s, d) => s + d.newLeads, 0);
  const rampLastDay  = equilibDay > 0 ? equilibDay : simData.length;

  // ── Sequence step helpers ──────────────────────────────────────────────────
  const addStep = useCallback(() => {
    const last = steps[steps.length - 1];
    setSteps(prev => [...prev, { dayOffset: (last?.dayOffset ?? 0) + 2, label: `Follow-up ${prev.length}` }]);
  }, [steps]);

  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof SequenceStep, val: string | number) => {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const inputCls = "w-full px-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

  return (
    <div className="space-y-6">
      {/* ── Inputs + Sequence ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Config panel */}
        <div className="lg:col-span-1 space-y-5 bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" /> Configuration
          </h3>

          <Slider label="Number of Inboxes"      min={1}  max={50}  value={numberOfInboxes}    onChange={setNumberOfInboxes} />
          <Slider label="Daily Limit per Inbox"  min={10} max={200} value={dailyLimitPerInbox}  onChange={setDailyLimitPerInbox} />
          <Slider label="Simulation Days"        min={14} max={90}  value={simDays}             onChange={setSimDays} />

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Total Lead Pool (optional)</label>
            <input
              type="number" value={totalLeadsStr} onChange={e => setTotalLeadsStr(e.target.value)}
              placeholder="Unlimited" className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Skip Weekends</label>
            <button
              onClick={() => setExcludeWeekends(p => !p)}
              className={`relative w-9 h-5 rounded-full transition-colors ${excludeWeekends ? "bg-indigo-600" : "bg-[#1f2d45]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${excludeWeekends ? "translate-x-4" : ""}`} />
            </button>
          </div>

          {/* Key metrics */}
          <div className="border-t border-[#1f2d45] pt-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Total Capacity</span><span className="text-indigo-400 font-semibold">{capacity}/day</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Equilibrium New Leads</span><span className="text-emerald-400 font-semibold">{equilibrium}/day</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Stabilises at</span><span className="text-amber-400 font-semibold">~Day {rampLastDay + 1}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">New Leads ({simDays}d)</span><span className="text-slate-200 font-semibold">{monthlyNew.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Sequence builder */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Sequence Steps</h3>
            <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#0d1424] border border-[#1f2d45] rounded-xl p-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Day</span>
                    <input
                      type="number" value={step.dayOffset} min={0}
                      onChange={e => updateStep(i, "dayOffset", parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 bg-[#111827] border border-[#1f2d45] rounded-md text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <input
                    type="text" value={step.label}
                    onChange={e => updateStep(i, "label", e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#111827] border border-[#1f2d45] rounded-md text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(i)} className="text-slate-600 hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="mt-4 flex items-start gap-2 bg-indigo-600/5 border border-indigo-600/20 rounded-xl p-3 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              System sends emails in batches equal to your inbox count. Follow-ups are prioritised first;
              remaining capacity goes to new leads. After <strong className="text-slate-300">~Day {rampLastDay + 1}</strong>, the system reaches equilibrium at{" "}
              <strong className="text-emerald-400">{equilibrium} new leads/day</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Chart ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Lead Flow Simulation
          </h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Ramp Phase</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Equilibrium</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={simData} margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gNew"    x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFollow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gTotal"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
            {equilibDay > 0 && (
              <ReferenceLine x={`Day ${equilibDay + 1}`} stroke="#34d399" strokeDasharray="4 4" label={{ value: "Equilibrium", fill: "#34d399", fontSize: 10, position: "insideTopRight" }} />
            )}
            <Area type="monotone" dataKey="total"    name="Total Emails" stroke="#34d399" fill="url(#gTotal)"  strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="followUps" name="Follow-Ups"  stroke="#f59e0b" fill="url(#gFollow)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="newLeads"  name="New Leads"   stroke="#6366f1" fill="url(#gNew)"    strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Data table ─────────────────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1f2d45] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Day-by-Day Breakdown</h3>
          <p className="text-xs text-slate-500">First {Math.min(simDays, simData.length)} days</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#111827]">
              <tr className="border-b border-[#1f2d45]">
                {["Day", "Phase", "New Leads", "Follow-Ups", "Total"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {simData.map(row => (
                <tr key={row.day} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-2.5 text-slate-400">{row.label}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${row.phase === "Ramp" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                      {row.phase}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-indigo-400 font-semibold">{row.newLeads}</td>
                  <td className="px-4 py-2.5 text-amber-400 font-semibold">{row.followUps}</td>
                  <td className="px-4 py-2.5 text-slate-200 font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
