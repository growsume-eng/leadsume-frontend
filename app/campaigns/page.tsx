"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { Campaign } from "@/lib/types";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { generateId } from "@/lib/utils";
import {
  Plus, Send, Pencil, Trash2, Play, Pause, Copy, BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  Running:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Scheduled: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Paused:    "text-slate-400 bg-slate-400/10 border-slate-400/20",
  Draft:     "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Completed: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

export default function CampaignsPage() {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Pause / Resume ─────────────────────────────────────────────────────────
  function handleToggleStatus(campaign: Campaign) {
    const next: Campaign = {
      ...campaign,
      status: campaign.status === "Running" ? "Paused" : "Running",
    };
    dispatch({ type: "UPDATE_CAMPAIGN", payload: next });
    toast.success(next.status === "Running" ? "Campaign resumed" : "Campaign paused");
  }

  // ── Duplicate ──────────────────────────────────────────────────────────────
  function handleDuplicate(campaign: Campaign) {
    const { id, createdAt, ...rest } = campaign;
    dispatch({
      type: "ADD_CAMPAIGN",
      payload: {
        ...rest,
        name: `${campaign.name} (Copy)`,
        status: "Draft",
      },
    });
    toast.success("Campaign duplicated as Draft");
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteId) return;
    dispatch({ type: "DELETE_CAMPAIGN", payload: deleteId });
    toast.success("Campaign deleted");
    setDeleteId(null);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Campaigns</h2>
          <p className="text-sm text-slate-400 mt-0.5">{state.campaigns.length} campaigns total</p>
        </div>
        <Link
          href="/campaigns/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Campaign
        </Link>
      </div>

      {/* Table */}
      {state.campaigns.length === 0 ? (
        <EmptyState
          icon={<Send className="w-8 h-8" />}
          title="No campaigns yet"
          description="Create your first campaign to start sending cold emails at scale."
          action={
            <Link href="/campaigns/create" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              Create Campaign
            </Link>
          }
        />
      ) : (
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2d45] text-left">
                {["Name", "Status", "Inboxes", "Recipients", "Steps", "Capacity/day", "Created", ""].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {state.campaigns.map(campaign => {
                const totalCapacity = (campaign.inboxIds?.length || 1) * (campaign.emailsPerDayPerInbox || campaign.emailsPerDay);
                return (
                  <tr key={campaign.id} className="hover:bg-white/2 transition-colors group">
                    {/* Name */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left group/name"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/15 flex items-center justify-center shrink-0">
                          <Send className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 group-hover/name:text-indigo-400 transition-colors">{campaign.name}</p>
                          <p className="text-xs text-slate-500">{campaign.domain}</p>
                        </div>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </td>

                    {/* Inboxes */}
                    <td className="px-4 py-4 text-slate-300 font-medium">
                      {campaign.inboxIds?.length ?? 1}
                    </td>

                    {/* Recipients */}
                    <td className="px-4 py-4 text-slate-300 font-medium">{campaign.leadIds.length}</td>

                    {/* Steps */}
                    <td className="px-4 py-4 text-slate-300 font-medium">{campaign.sequences.length}</td>

                    {/* Capacity */}
                    <td className="px-4 py-4">
                      <span className="text-indigo-400 font-semibold">{totalCapacity}</span>
                      <span className="text-slate-600 text-xs ml-1">/ day</span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Analytics */}
                        <button
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/5 transition-colors"
                          aria-label="View analytics"
                          title="Analytics"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Pause / Resume */}
                        {(campaign.status === "Running" || campaign.status === "Paused") && (
                          <button
                            onClick={() => handleToggleStatus(campaign)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                            aria-label={campaign.status === "Running" ? "Pause" : "Resume"}
                          >
                            {campaign.status === "Running" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(campaign)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-amber-400/5 transition-colors"
                          aria-label="Duplicate campaign"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                          aria-label="Edit campaign"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteId(campaign.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-colors"
                          aria-label="Delete campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
