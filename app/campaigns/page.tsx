"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { Campaign } from "@/lib/types";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmModal from "@/components/shared/ConfirmModal";
import {
  Plus,
  Send,
  Pencil,
  Trash2,
  Play,
  Pause,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  Running: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Scheduled: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Paused: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  Draft: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Completed: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

export default function CampaignsPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteId) return;
    dispatch({ type: "DELETE_CAMPAIGN", payload: deleteId });
    toast.success("Campaign deleted");
    setDeleteId(null);
  }

  function handleToggleStatus(campaign: Campaign) {
    const next: Campaign = {
      ...campaign,
      status: campaign.status === "Running" ? "Paused" : "Running",
    };
    dispatch({ type: "UPDATE_CAMPAIGN", payload: next });
    toast.success(
      next.status === "Running" ? "Campaign resumed" : "Campaign paused"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Campaigns</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {state.campaigns.length} campaigns total
          </p>
        </div>
        <Link
          href="/campaigns/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Link>
      </div>

      {/* Table */}
      {state.campaigns.length === 0 ? (
        <EmptyState
          icon={<Send className="w-8 h-8" />}
          title="No campaigns yet"
          description="Create your first campaign to start sending cold emails at scale."
          action={
            <Link
              href="/campaigns/create"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Campaign
            </Link>
          }
        />
      ) : (
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2d45] text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sending From
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Steps
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {state.campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="hover:bg-white/2 transition-colors group"
                >
                  <td className="px-5 py-4">
                    <button
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      className="flex items-center gap-3 group/name hover:opacity-80 transition-opacity text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/15 flex items-center justify-center shrink-0">
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200 group-hover/name:text-indigo-400 transition-colors">
                          {campaign.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {campaign.domain}
                        </p>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[campaign.status]}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400 text-xs">
                    {campaign.sendingEmail}
                  </td>
                  <td className="px-4 py-4 text-slate-300 font-medium">
                    {campaign.leadIds.length}
                  </td>
                  <td className="px-4 py-4 text-slate-300 font-medium">
                    {campaign.sequences.length}
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(campaign.status === "Running" ||
                        campaign.status === "Paused") && (
                        <button
                          onClick={() => handleToggleStatus(campaign)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                          aria-label={
                            campaign.status === "Running"
                              ? "Pause campaign"
                              : "Resume campaign"
                          }
                        >
                          {campaign.status === "Running" ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          router.push(`/campaigns/${campaign.id}/edit`)
                        }
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                        aria-label="Edit campaign"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
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
              ))}
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
