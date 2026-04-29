"use client";

import Link from "next/link";
import { useAppState } from "@/context/AppContext";
import StatCard from "@/components/shared/StatCard";
import {
  Send,
  Users,
  BarChart3,
  Mail,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle2,
  CircleDot,
  AlertCircle,
} from "lucide-react";
import { fmtPct } from "@/lib/utils";
import { format } from "date-fns";

export default function DashboardPage() {
  const state = useAppState();

  const totalEmailsSent = 2480;
  const openRate = 32.4;
  const replyRate = 11.2;

  const activeCampaigns = state.campaigns.filter(
    (c) => c.status === "Running"
  ).length;

  const recentActivity = [
    {
      id: 1,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      text: 'Campaign "SaaS Founders Outreach" is running',
      time: "2 hours ago",
    },
    {
      id: 2,
      icon: <Mail className="w-4 h-4 text-indigo-400" />,
      text: "Jordan Williams replied to your cold email",
      time: "3 hours ago",
    },
    {
      id: 3,
      icon: <Users className="w-4 h-4 text-violet-400" />,
      text: "20 new leads imported via CSV",
      time: "5 hours ago",
    },
    {
      id: 4,
      icon: <CircleDot className="w-4 h-4 text-amber-400" />,
      text: 'Campaign "Agency Partnership Drive" paused',
      time: "Yesterday",
    },
    {
      id: 5,
      icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
      text: "Inbox outreach@growsume.io connection error",
      time: "Yesterday",
    },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <h2 className="text-2xl font-bold text-slate-100">
            Hello, {state.profile.name.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Here&apos;s what&apos;s happening with your campaigns today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/campaigns/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
          <Link
            href="/leads"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-[#1f2d45] transition-colors"
          >
            <Users className="w-4 h-4" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          change={+20}
          icon={<Send className="w-5 h-5 text-indigo-400" />}
          accent="indigo"
        />
        <StatCard
          label="Total Leads"
          value={state.leads.length}
          change={+12}
          icon={<Users className="w-5 h-5 text-violet-400" />}
          accent="violet"
        />
        <StatCard
          label="Emails Sent"
          value={totalEmailsSent.toLocaleString()}
          change={+8}
          icon={<Mail className="w-5 h-5 text-cyan-400" />}
          accent="cyan"
        />
        <StatCard
          label="Open Rate"
          value={fmtPct(openRate)}
          change={+3.1}
          icon={<BarChart3 className="w-5 h-5 text-emerald-400" />}
          accent="emerald"
        />
        <StatCard
          label="Reply Rate"
          value={fmtPct(replyRate)}
          change={+1.5}
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent campaigns */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2d45]">
            <h3 className="text-sm font-semibold text-slate-200">
              Recent Campaigns
            </h3>
            <Link
              href="/campaigns"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#1f2d45]">
            {state.campaigns.slice(0, 5).map((campaign) => {
              const statusColors: Record<string, string> = {
                Running: "text-emerald-400 bg-emerald-400/10",
                Scheduled: "text-amber-400 bg-amber-400/10",
                Paused: "text-slate-400 bg-slate-400/10",
                Draft: "text-indigo-400 bg-indigo-400/10",
                Completed: "text-violet-400 bg-violet-400/10",
              };
              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                      <Send className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {campaign.leadIds.length} leads ·{" "}
                        {campaign.sequences.length} steps
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[campaign.status]}`}
                  >
                    {campaign.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1f2d45]">
            <h3 className="text-sm font-semibold text-slate-200">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-[#1f2d45]">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.text}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
