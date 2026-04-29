"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { Campaign } from "@/lib/types";
import {
  ArrowLeft, Play, Pause, Copy, TrendingUp, Mail, Reply,
  AlertCircle, ThumbsUp, ThumbsDown, Calendar, Users,
} from "lucide-react";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number | string;
  color: string; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2540] border border-[#1f2d45] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Running:   "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  Scheduled: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  Paused:    "text-slate-400 bg-slate-400/10 border border-slate-400/20",
  Draft:     "text-indigo-400 bg-indigo-400/10 border border-indigo-400/20",
  Completed: "text-violet-400 bg-violet-400/10 border border-violet-400/20",
};

export default function CampaignDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const campaign = state.campaigns.find(c => c.id === id);
  if (!campaign) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-slate-400">Campaign not found.</p>
        <button onClick={() => router.push("/campaigns")} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to Campaigns
        </button>
      </div>
    );
  }

  const a = campaign.analytics;

  function handleToggle() {
    const next: Campaign = { ...campaign!, status: campaign!.status === "Running" ? "Paused" : "Running" };
    dispatch({ type: "UPDATE_CAMPAIGN", payload: next });
    toast.success(next.status === "Running" ? "Campaign resumed" : "Campaign paused");
  }

  function handleDuplicate() {
    const { id: _id, createdAt: _ca, ...rest } = campaign!;
    dispatch({ type: "ADD_CAMPAIGN", payload: { ...rest, name: `${campaign!.name} (Copy)`, status: "Draft" } });
    toast.success("Campaign duplicated as Draft");
    router.push("/campaigns");
  }

  const sentTotal = a.sequenceStats.reduce((s, ss) => s + ss.sent, 0) || campaign.leadIds.length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/campaigns")} className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">{campaign.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {campaign.sendingEmail} · {campaign.sequences.length} steps · {campaign.leadIds.length} leads
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(campaign.status === "Running" || campaign.status === "Paused") && (
            <button onClick={handleToggle}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-[#1f2d45] transition-colors">
              {campaign.status === "Running" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
            </button>
          )}
          <button onClick={handleDuplicate}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-[#1f2d45] transition-colors">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
        </div>
      </div>

      {/* ── Overall Rate Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Open Rate"           value={`${a.openRate}%`}           color="bg-indigo-600/20 text-indigo-400"  icon={Mail} />
        <StatCard label="Reply Rate"          value={`${a.replyRate}%`}          color="bg-emerald-600/20 text-emerald-400" icon={Reply} />
        <StatCard label="Bounce Rate"         value={`${a.bounceRate}%`}         color="bg-rose-600/20 text-rose-400"       icon={AlertCircle} />
        <StatCard label="Interested"          value={`${a.interestedRate}%`}     color="bg-amber-600/20 text-amber-400"     icon={ThumbsUp} />
        <StatCard label="Not Interested"      value={`${a.notInterestedRate}%`}  color="bg-slate-600/20 text-slate-400"     icon={ThumbsDown} />
        <StatCard label="Booked"              value={`${a.bookedRate}%`}         color="bg-violet-600/20 text-violet-400"   icon={Calendar} />
        <StatCard label="Not Replied"         value={`${a.notRepliedRate}%`}     color="bg-zinc-600/20 text-zinc-400"       icon={Users} />
        <StatCard label="Total Sent"          value={sentTotal}                  color="bg-sky-600/20 text-sky-400"         icon={TrendingUp} />
      </div>

      {/* ── Time Series Chart ─────────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Sending Activity</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={a.timeSeries} margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gReply" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
            <Area type="monotone" dataKey="sent"    name="Sent"    stroke="#6366f1" fill="url(#gSent)"  strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="replies" name="Replies" stroke="#34d399" fill="url(#gReply)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Sequence-Level Stats ──────────────────────────────────────────── */}
      {a.sequenceStats.length > 0 && (
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1f2d45]">
            <h3 className="text-sm font-semibold text-slate-200">Sequence Performance</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2d45] text-left">
                {["Step", "Subject", "Sent", "Open Rate", "Reply Rate", "Bounce Rate"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {a.sequenceStats.map((ss, i) => {
                const seq = campaign.sequences.find(s => s.id === ss.sequenceId);
                return (
                  <tr key={ss.sequenceId} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate">{seq?.subject ?? "—"}</td>
                    <td className="px-4 py-3.5 text-slate-200 font-semibold">{ss.sent}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#1f2d45] rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ss.openRate}%` }} />
                        </div>
                        <span className="text-slate-300 text-xs">{ss.openRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#1f2d45] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ss.replyRate * 5}%` }} />
                        </div>
                        <span className="text-slate-300 text-xs">{ss.replyRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-rose-400 text-xs">{ss.bounceRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Campaign Info ─────────────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Campaign Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Sending Email</p>
            <p className="text-slate-200">{campaign.sendingEmail}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Inboxes</p>
            <p className="text-slate-200">{campaign.inboxIds?.length ?? 1} inbox{(campaign.inboxIds?.length ?? 1) !== 1 ? "es" : ""}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Per-Inbox Cap</p>
            <p className="text-slate-200">{campaign.emailsPerDayPerInbox ?? campaign.emailsPerDay} / day</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Capacity</p>
            <p className="text-indigo-400 font-semibold">
              {(campaign.inboxIds?.length ?? 1) * (campaign.emailsPerDayPerInbox ?? campaign.emailsPerDay)} / day
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Batch Delay</p>
            <p className="text-slate-200">{campaign.batchDelayMinutes ?? 0} min</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Start Date</p>
            <p className="text-slate-200">{campaign.startDate || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Ramp-Up</p>
            <p className="text-slate-200">{campaign.rampSettings.enabled ? `${campaign.rampSettings.start}→${campaign.rampSettings.max}` : "Disabled"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Inboxes</p>
            <p className="text-slate-200">{campaign.inboxIds?.length ?? 1} selected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
