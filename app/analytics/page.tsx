"use client";

import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import StatCard from "@/components/shared/StatCard";
import { Send, Mail, TrendingUp, BarChart2 } from "lucide-react";
import { mockTimeSeriesData, mockCampaignBarData, campaignBreakdown } from "@/lib/data";
import {
  ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { fmtPct } from "@/lib/utils";

const RANGES = ["7d", "30d", "90d"] as const;
type Range = typeof RANGES[number];

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#f59e0b", "#a855f7", "#22c55e", "#ef4444"];

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #1f2d45",
  borderRadius: "8px",
  color: "#f1f5f9",
  fontSize: "12px",
};

export default function AnalyticsPage() {
  const state = useAppState();
  const [range, setRange] = useState<Range>("30d");

  const sliceMap: Record<Range, number> = { "7d": 3, "30d": 8, "90d": 8 };
  const timeData = mockTimeSeriesData.slice(-sliceMap[range]);

  const leadsDistribution = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"].map(s => ({
    name: s, value: state.leads.filter(l => l.status === s).length,
  })).filter(d => d.value > 0);

  const totalSent = timeData.reduce((s, d) => s + d.sent, 0);
  const totalOpens = timeData.reduce((s, d) => s + d.opens, 0);
  const totalReplies = timeData.reduce((s, d) => s + d.replies, 0);

  // Static open rates from mock data — no Math.random(), no hydration mismatch
  const breakdownMap = Object.fromEntries(campaignBreakdown.map(b => [b.id, b.openRate]));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">Performance metrics across all campaigns</p>
        </div>
        <div className="flex bg-[#111827] border border-[#1f2d45] rounded-lg p-1 gap-1">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === r ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Emails Sent" value={totalSent.toLocaleString()} change={+8} icon={<Send className="w-5 h-5 text-indigo-400" />} accent="indigo" />
        <StatCard label="Total Opens" value={totalOpens.toLocaleString()} change={+3} icon={<Mail className="w-5 h-5 text-cyan-400" />} accent="cyan" />
        <StatCard label="Open Rate" value={fmtPct(totalSent > 0 ? (totalOpens / totalSent) * 100 : 0)} change={+1.5} icon={<BarChart2 className="w-5 h-5 text-emerald-400" />} accent="emerald" />
        <StatCard label="Reply Rate" value={fmtPct(totalSent > 0 ? (totalReplies / totalSent) * 100 : 0)} change={+0.8} icon={<TrendingUp className="w-5 h-5 text-amber-400" />} accent="amber" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Emails Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              <Line type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} dot={false} name="Sent" />
              <Line type="monotone" dataKey="opens" stroke="#22c55e" strokeWidth={2} dot={false} name="Opens" />
              <Line type="monotone" dataKey="replies" stroke="#f59e0b" strokeWidth={2} dot={false} name="Replies" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Responses by Campaign</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockCampaignBarData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="responses" fill="#6366f1" radius={[4, 4, 0, 0]} name="Responses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Campaign Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leadsDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                {leadsDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d45] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Campaign Breakdown</h3>
          <div className="space-y-3">
            {state.campaigns.map((c, i) => {
              // Use static lookup — no runtime random values
              const pct = breakdownMap[c.id] ?? c.analytics?.openRate ?? 0;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 truncate">{c.name}</span>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">{pct}% open rate</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
