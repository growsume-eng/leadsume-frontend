"use client";

import { AlertCircle, Zap, Clock, Send, ArrowRight, CalendarDays, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleConfig {
  emailsPerDayPerInbox: number;
  batchDelayMinutes: number;
  startDate: string;
}

interface ScheduleTabProps {
  inboxCount: number;
  value: ScheduleConfig;
  onChange: (next: ScheduleConfig) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function set<K extends keyof ScheduleConfig>(
  prev: ScheduleConfig,
  key: K,
  val: ScheduleConfig[K],
): ScheduleConfig {
  return { ...prev, [key]: val };
}

function Slider({
  label,
  min,
  max,
  value,
  step = 1,
  unit = "",
  accent = "indigo",
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  unit?: string;
  accent?: "indigo" | "violet" | "emerald";
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const accentMap = {
    indigo:  "accent-indigo-500",
    violet:  "accent-violet-500",
    emerald: "accent-emerald-500",
  };
  const textMap = {
    indigo:  "text-indigo-400",
    violet:  "text-violet-400",
    emerald: "text-emerald-400",
  };
  const barMap = {
    indigo:  "bg-indigo-500",
    violet:  "bg-violet-500",
    emerald: "bg-emerald-500",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className={`text-sm font-bold ${textMap[accent]}`}>
          {value}{unit}
        </span>
      </div>
      {/* Track + fill */}
      <div className="relative h-2 rounded-full bg-[#1f2d45] overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barMap[accent]} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full -mt-2 h-2 appearance-none bg-transparent cursor-pointer ${accentMap[accent]}`}
      />
      <div className="flex justify-between text-[10px] text-slate-700 mt-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "indigo" | "emerald" | "violet" | "amber";
}) {
  const map = {
    indigo:  "bg-indigo-600/15 border-indigo-500/25 text-indigo-400",
    emerald: "bg-emerald-600/15 border-emerald-500/25 text-emerald-400",
    violet:  "bg-violet-600/15 border-violet-500/25 text-violet-400",
    amber:   "bg-amber-600/15 border-amber-500/25 text-amber-400",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-center ${map[color]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Batch flow visualiser ────────────────────────────────────────────────────

function BatchFlow({ inboxCount, delayMinutes }: { inboxCount: number; delayMinutes: number }) {
  const batches = [1, 2, 3];
  const delayLabel = delayMinutes === 0 ? "no delay" : `${delayMinutes} min`;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Sending Flow
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {batches.map((b, i) => (
          <div key={b} className="flex items-center gap-2 shrink-0">
            {/* Batch bubble */}
            <div className="bg-[#111827] border border-[#1f2d45] rounded-xl px-3 py-2.5 text-center min-w-[80px]">
              <p className="text-xs font-semibold text-indigo-400">Batch {b}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {inboxCount} email{inboxCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Arrow + delay */}
            {i < batches.length - 1 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-600 mb-0.5">{delayLabel}</span>
                  <div className="flex items-center gap-1 text-slate-600">
                    <div className="w-6 h-px bg-slate-700" />
                    <Clock className="w-3 h-3" />
                    <div className="w-6 h-px bg-slate-700" />
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Ellipsis */}
        <div className="flex items-center gap-1 text-slate-700 shrink-0 ml-1">
          <span className="text-xs">···</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
        <Info className="w-3 h-3" />
        Each batch sends one email per selected inbox simultaneously
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScheduleTab({ inboxCount, value, onChange }: ScheduleTabProps) {
  const { emailsPerDayPerInbox, batchDelayMinutes, startDate } = value;

  const totalDailyCapacity = inboxCount * emailsPerDayPerInbox;
  const batchSize          = inboxCount;
  const batchesPerDay      = emailsPerDayPerInbox;
  const minutesPerBatch    = batchDelayMinutes;
  const totalMinutesNeeded = (batchesPerDay - 1) * minutesPerBatch;
  const hoursNeeded        = Math.floor(totalMinutesNeeded / 60);
  const minsNeeded         = totalMinutesNeeded % 60;
  const windowLabel        =
    totalMinutesNeeded === 0
      ? "instantly"
      : hoursNeeded > 0
      ? `${hoursNeeded}h ${minsNeeded}m`
      : `${minsNeeded} min`;

  const noInboxes = inboxCount === 0;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-slate-200">Sending Schedule</h3>

      {/* ── No inbox warning ──────────────────────────────────────────────── */}
      {noInboxes && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/25 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">No inboxes selected</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Go back to the Details step and select at least one inbox to enable capacity calculations.
            </p>
          </div>
        </div>
      )}

      {/* ── Live stats ────────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${noInboxes ? "opacity-40 pointer-events-none" : ""}`}>
        <StatPill label="Inboxes"       value={`${inboxCount}`}             color="indigo"  />
        <StatPill label="Emails / Day"  value={`~${totalDailyCapacity}`}    color="emerald" />
        <StatPill label="Batch Size"    value={`${batchSize}`}              color="violet"  />
        <StatPill label="Sending Window" value={windowLabel}                color="amber"   />
      </div>

      {/* ── Capacity summary ──────────────────────────────────────────────── */}
      {!noInboxes && (
        <div className="flex items-center gap-3 bg-emerald-600/8 border border-emerald-500/20 rounded-xl px-4 py-3">
          <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-slate-300">
            You can send{" "}
            <span className="text-emerald-400 font-bold">~{totalDailyCapacity} emails per day</span>
            {" "}across{" "}
            <span className="font-semibold text-slate-200">{inboxCount} inbox{inboxCount !== 1 ? "es" : ""}</span>
            , at{" "}
            <span className="font-semibold text-slate-200">{emailsPerDayPerInbox} emails/inbox/day</span>.
          </p>
        </div>
      )}

      {/* ── Sliders ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Per-inbox cap */}
        <div className="bg-[#0d1424] border border-[#1f2d45] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-200">Emails per Inbox per Day</h4>
          </div>
          <Slider
            label="Daily limit per inbox"
            min={10}
            max={100}
            step={5}
            value={emailsPerDayPerInbox}
            unit=""
            accent="indigo"
            onChange={v => onChange(set(value, "emailsPerDayPerInbox", v))}
          />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Recommended: 30–50/day per inbox to stay within ESP limits and maintain deliverability.
          </p>
        </div>

        {/* Batch delay */}
        <div className="bg-[#0d1424] border border-[#1f2d45] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm font-semibold text-slate-200">Delay Between Batches</h4>
          </div>
          <Slider
            label="Delay between sending batches"
            min={0}
            max={15}
            step={1}
            value={batchDelayMinutes}
            unit=" min"
            accent="violet"
            onChange={v => onChange(set(value, "batchDelayMinutes", v))}
          />
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {batchDelayMinutes === 0
              ? "No delay — all batches send as fast as possible."
              : `Each batch will wait ${batchDelayMinutes} minute${batchDelayMinutes !== 1 ? "s" : ""} before the next one sends.`}
          </p>
        </div>
      </div>

      {/* ── Batch flow visualiser ─────────────────────────────────────────── */}
      <div className={`bg-[#0d1424] border border-[#1f2d45] rounded-2xl p-5 transition-opacity ${noInboxes ? "opacity-40 pointer-events-none" : ""}`}>
        <BatchFlow inboxCount={batchSize} delayMinutes={batchDelayMinutes} />
      </div>

      {/* ── Start date ───────────────────────────────────────────────────── */}
      <div className="bg-[#0d1424] border border-[#1f2d45] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-200">Start Date</h4>
        </div>
        <input
          type="date"
          value={startDate}
          onChange={e => onChange(set(value, "startDate", e.target.value))}
          className="w-full px-3 py-2.5 bg-[#111827] border border-[#1f2d45] rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <p className="text-[10px] text-slate-600">Leave blank to start immediately after launch.</p>
      </div>
    </div>
  );
}
