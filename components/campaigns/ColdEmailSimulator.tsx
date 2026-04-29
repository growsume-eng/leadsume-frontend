"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, TrendingUp, Zap, Info, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { runSimulation, type SequenceStep, type SimulationOutput } from "@/lib/simulator";

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_STEPS: SequenceStep[] = [
  { dayOffset: 0,  type: "cold",      label: "Cold Email"   },
  { dayOffset: 2,  type: "follow-up", label: "Follow-up 1"  },
  { dayOffset: 4,  type: "follow-up", label: "Follow-up 2"  },
  { dayOffset: 6,  type: "follow-up", label: "Follow-up 3"  },
  { dayOffset: 7,  type: "follow-up", label: "Follow-up 4"  },
  { dayOffset: 9,  type: "follow-up", label: "Follow-up 5"  },
  { dayOffset: 11, type: "follow-up", label: "Follow-up 6"  },
];

// ─── Small reusables ─────────────────────────────────────────────────────────

function Slider({ label, min, max, value, step = 1, unit = "", accent = "indigo", onChange }: {
  label: string; min: number; max: number; value: number;
  step?: number; unit?: string; accent?: "indigo"|"violet"|"emerald";
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const barCls   = { indigo:"bg-indigo-500",  violet:"bg-violet-500",  emerald:"bg-emerald-500"  }[accent];
  const textCls  = { indigo:"text-indigo-400",violet:"text-violet-400",emerald:"text-emerald-400" }[accent];
  const accentCls= { indigo:"accent-indigo-500",violet:"accent-violet-500",emerald:"accent-emerald-500" }[accent];
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className={`text-xs font-bold ${textCls}`}>{value}{unit}</span>
      </div>
      <div className="relative h-2 rounded-full bg-[#1f2d45] overflow-hidden mb-[-8px]">
        <div className={`absolute inset-y-0 left-0 ${barCls} rounded-full`} style={{ width:`${pct}%` }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full h-2 appearance-none bg-transparent cursor-pointer ${accentCls}`}
      />
      <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color: "indigo"|"emerald"|"amber"|"violet";
}) {
  const map = {
    indigo:  "border-indigo-500/25 bg-indigo-600/10 text-indigo-400",
    emerald: "border-emerald-500/25 bg-emerald-600/10 text-emerald-400",
    amber:   "border-amber-500/25 bg-amber-600/10 text-amber-400",
    violet:  "border-violet-500/25 bg-violet-600/10 text-violet-400",
  }[color];
  return (
    <div className={`border rounded-2xl p-4 ${map}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const phase = payload[0]?.payload?.phase;
  return (
    <div className="bg-[#1a2540] border border-[#1f2d45] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      <p className="text-[10px] text-slate-600 mb-2">{phase} Phase</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></span>
        </p>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ColdEmailSimulator() {
  const [numberOfInboxes,    setNumberOfInboxes]    = useState(3);
  const [dailyLimitPerInbox, setDailyLimitPerInbox] = useState(30);
  const [totalLeadsStr,      setTotalLeadsStr]      = useState("");
  const [excludeWeekends,    setExcludeWeekends]    = useState(false);
  const [simDays,            setSimDays]            = useState(60);
  const [steps,              setSteps]              = useState<SequenceStep[]>(DEFAULT_STEPS);

  const totalLeads = totalLeadsStr ? (parseInt(totalLeadsStr, 10) || null) : null;

  // ── Simulation (memoised) ─────────────────────────────────────────────────
  const result: SimulationOutput = useMemo(
    () => runSimulation({ numberOfInboxes, dailyLimitPerInbox, totalLeads, steps, excludeWeekends, simDays }),
    [numberOfInboxes, dailyLimitPerInbox, totalLeads, steps, excludeWeekends, simDays],
  );

  const { dailyData, equilibriumValue, monthlyLeadsEstimate, rampEndDay } = result;

  const capacity      = numberOfInboxes * dailyLimitPerInbox;
  const equilibDay    = dailyData.findIndex(d => d.phase === "Equilibrium");
  const equilibLabel  = equilibDay > 0 ? `Day ${equilibDay + 1}` : undefined;

  // ── Sequence helpers ──────────────────────────────────────────────────────
  const addStep = useCallback(() => {
    setSteps(prev => {
      const last = prev[prev.length - 1];
      return [...prev, { dayOffset: (last?.dayOffset ?? 0) + 2, type: "follow-up", label: `Follow-up ${prev.length}` }];
    });
  }, []);

  const removeStep  = (i: number) => setSteps(p => p.filter((_, idx) => idx !== i));
  const updateStep  = (i: number, field: keyof SequenceStep, val: string | number) =>
    setSteps(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const inputCls = "w-full px-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

  return (
    <div className="space-y-6">

      {/* ── Insights ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard icon={Zap}          color="indigo"  label="Daily Capacity"      value={`${capacity}`}               sub="emails per day" />
        <InsightCard icon={TrendingUp}   color="emerald" label="Steady-state leads"  value={`${equilibriumValue}`}        sub="new leads/day at equilibrium" />
        <InsightCard icon={BarChart3}    color="amber"   label="Stabilises at"       value={rampEndDay > 0 ? `Day ${rampEndDay + 1}` : "—"} sub="ramp phase ends" />
        <InsightCard icon={CheckCircle}  color="violet"  label="Monthly leads (est)" value={monthlyLeadsEstimate.toLocaleString()} sub="first 30 sim days" />
      </div>

      {/* ── Insight text banner ────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-indigo-600/8 border border-indigo-500/20 rounded-2xl px-5 py-4">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300 space-y-0.5">
          <p>
            Your system{" "}
            <strong className="text-indigo-400">stabilises after ~Day {rampEndDay + 1}</strong>.{" "}
            At steady state, <strong className="text-emerald-400">{equilibriumValue} new leads/day</strong> enter
            the sequence, with follow-ups filling the remaining capacity.
            Estimated{" "}
            <strong className="text-violet-400">{monthlyLeadsEstimate.toLocaleString()} new leads/month</strong>.
          </p>
          {numberOfInboxes === 0 && (
            <p className="flex items-center gap-1.5 text-amber-400 text-xs mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> Set at least 1 inbox to run the simulation.
            </p>
          )}
        </div>
      </div>

      {/* ── Inputs + Sequence builder ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Config panel */}
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" /> Configuration
          </h3>

          <Slider label="Number of Inboxes"     min={1}  max={50}  value={numberOfInboxes}    onChange={setNumberOfInboxes}    accent="indigo" />
          <Slider label="Daily Limit per Inbox" min={10} max={200} value={dailyLimitPerInbox}  onChange={setDailyLimitPerInbox} accent="violet" />
          <Slider label="Simulation Days"       min={14} max={90}  value={simDays}             onChange={setSimDays}            accent="emerald" />

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Total Lead Pool (optional)</label>
            <input type="number" value={totalLeadsStr} onChange={e => setTotalLeadsStr(e.target.value)}
              placeholder="Unlimited" className={inputCls} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">Skip Weekends</label>
            <button onClick={() => setExcludeWeekends(p => !p)}
              className={`relative w-9 h-5 rounded-full transition-colors ${excludeWeekends ? "bg-indigo-600" : "bg-[#1f2d45]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${excludeWeekends ? "translate-x-4" : ""}`} />
            </button>
          </div>

          <div className="border-t border-[#1f2d45] pt-4 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Total Capacity</span><span className="text-indigo-400 font-semibold">{capacity}/day</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Equilibrium New Leads</span><span className="text-emerald-400 font-semibold">{equilibriumValue}/day</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Ramp Ends</span><span className="text-amber-400 font-semibold">Day {rampEndDay + 1}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Monthly Estimate</span><span className="text-violet-400 font-semibold">{monthlyLeadsEstimate.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Sequence builder */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Sequence Steps</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{steps.length} steps · max offset Day {steps.reduce((m, s) => Math.max(m, s.dayOffset), 0)}</p>
            </div>
            <button onClick={addStep} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium rounded-lg border border-indigo-500/30 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#0d1424] border border-[#1f2d45] rounded-xl p-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.type === "cold" ? "bg-indigo-600/25 text-indigo-400" : "bg-violet-600/20 text-violet-400"}`}>
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-600">Day</span>
                    <input type="number" value={step.dayOffset} min={0}
                      onChange={e => updateStep(i, "dayOffset", parseInt(e.target.value) || 0)}
                      className="w-12 px-2 py-1 bg-[#111827] border border-[#1f2d45] rounded text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <select value={step.type} onChange={e => updateStep(i, "type", e.target.value)}
                    className="px-2 py-1 bg-[#111827] border border-[#1f2d45] rounded text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="cold">Cold</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                  <input type="text" value={step.label} onChange={e => updateStep(i, "label", e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#111827] border border-[#1f2d45] rounded text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0" />
                </div>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(i)} className="text-slate-600 hover:text-rose-400 transition-colors p-1 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 bg-indigo-600/5 border border-indigo-600/20 rounded-xl p-3 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Follow-ups are prioritised daily. Remaining capacity goes to new leads.
              After <strong className="text-slate-300">Day {rampEndDay + 1}</strong>, equilibrium reaches{" "}
              <strong className="text-emerald-400">{equilibriumValue} new leads/day</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Lead Flow Simulation
          </h3>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Ramp</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Equilibrium</span>
          </div>
        </div>

        {dailyData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
            Configure inboxes and sequence steps to run the simulation.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="simNew"    x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="simFollow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="simTotal"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2}  />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
              <XAxis dataKey="label" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:"11px", color:"#94a3b8" }} />
              {equilibLabel && (
                <ReferenceLine x={equilibLabel} stroke="#34d399" strokeDasharray="4 4"
                  label={{ value:"Equilibrium", fill:"#34d399", fontSize:9, position:"insideTopRight" }} />
              )}
              <Area type="monotone" dataKey="totalEmails" name="Total Emails" stroke="#34d399" fill="url(#simTotal)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="followUps"   name="Follow-Ups"   stroke="#f59e0b" fill="url(#simFollow)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="newLeads"    name="New Leads"    stroke="#6366f1" fill="url(#simNew)"    strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Day-by-day table ───────────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1f2d45] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Day-by-Day Breakdown</h3>
          <p className="text-xs text-slate-500">{dailyData.length} days simulated</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#111827]">
              <tr className="border-b border-[#1f2d45]">
                {["Day","Calendar Day","Phase","New Leads","Follow-Ups","Total Emails"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {dailyData.map(row => (
                <tr key={row.day} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-2.5 text-slate-400">{row.label}</td>
                  <td className="px-4 py-2.5 text-slate-600">{row.calendarDay}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${row.phase === "Ramp" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                      {row.phase}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-indigo-400 font-semibold">{row.newLeads}</td>
                  <td className="px-4 py-2.5 text-amber-400 font-semibold">{row.followUps}</td>
                  <td className="px-4 py-2.5 text-slate-200 font-semibold">{row.totalEmails}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
