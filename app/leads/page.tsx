"use client";

import { useState, useMemo } from "react";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import type { Lead, LeadStatus } from "@/lib/types";
import LeadFormModal from "@/components/leads/LeadFormModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Upload, Users } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  New: "text-slate-400 bg-slate-400/10",
  Contacted: "text-indigo-400 bg-indigo-400/10",
  Qualified: "text-amber-400 bg-amber-400/10",
  Proposal: "text-violet-400 bg-violet-400/10",
  Won: "text-emerald-400 bg-emerald-400/10",
  Lost: "text-rose-400 bg-rose-400/10",
};

const ALL_STATUSES: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export default function LeadsPage() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCsv, setShowCsv] = useState(false);
  const [csvText, setCsvText] = useState("");

  const filtered = useMemo(() => state.leads.filter(l => {
    const matchQ = query === "" || l.name.toLowerCase().includes(query.toLowerCase()) || l.email.toLowerCase().includes(query.toLowerCase()) || l.company.toLowerCase().includes(query.toLowerCase());
    const matchS = statusFilter === "All" || l.status === statusFilter;
    return matchQ && matchS;
  }), [state.leads, query, statusFilter]);

  function handleDelete() {
    if (!deleteId) return;
    dispatch({ type: "DELETE_LEAD", payload: deleteId });
    toast.success("Lead deleted");
    setDeleteId(null);
  }

  function handleImportCsv() {
    const lines = csvText.trim().split("\n").slice(1);
    const newLeads = lines.map(line => {
      const [name, email, company = "", title = ""] = line.split(",").map(s => s.trim());
      return { name: name || "Unknown", email: email || "", company, title, status: "New" as const, tags: [], owner: state.profile.name };
    }).filter(l => l.email);
    dispatch({ type: "ADD_LEADS_BULK", payload: newLeads });
    toast.success(`${newLeads.length} leads imported`);
    setCsvText(""); setShowCsv(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Leads</h2>
          <p className="text-sm text-slate-400 mt-0.5">{state.leads.length} total leads</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCsv(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-[#1f2d45] transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search leads…"
            className="pl-9 pr-3 py-2 text-sm bg-[#111827] border border-[#1f2d45] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[#111827] border border-[#1f2d45] rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No leads found" description="Try adjusting your search or create a new lead."
          action={<button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">Create First Lead</button>} />
      ) : (
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2d45] text-left">
                {["Name", "Email", "Company", "Status", "Tags", "Owner", "Created", ""].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                        {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{lead.email}</td>
                  <td className="px-4 py-3.5 text-slate-300">{lead.company}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[lead.status]}`}>{lead.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{lead.owner}</td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{format(new Date(lead.createdAt), "MMM d")}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditLead(lead)} className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(lead.id)} className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Modal */}
      {showCsv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowCsv(false)}>
          <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Import Leads via CSV</h3>
            <p className="text-xs text-slate-400 mb-3">First row must be headers: <code className="bg-white/10 px-1 rounded">name,email,company,title</code></p>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8} placeholder="name,email,company,title&#10;John Doe,john@example.com,Acme,CEO"
              className="w-full px-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-none mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCsv(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button onClick={handleImportCsv} disabled={!csvText.trim()} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <LeadFormModal onClose={() => setShowCreate(false)} />}
      {editLead && <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} />}
      <ConfirmModal open={!!deleteId} title="Delete Lead" description="Permanently remove this lead?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
