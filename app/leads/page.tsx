"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppState } from "@/context/AppContext";
import type { Lead, LeadStatus } from "@/lib/types";
import { supabase, dbLeadToLocal } from "@/lib/supabase";
import LeadFormModal from "@/components/leads/LeadFormModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import EmptyState from "@/components/shared/EmptyState";
import Spinner from "@/components/shared/Spinner";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Upload, Users, Globe } from "lucide-react";

// ── Inline brand SVGs (lucide-react has no social brand icons) ───────────────
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  New:        "text-slate-400 bg-slate-400/10",
  Contacted:  "text-indigo-400 bg-indigo-400/10",
  Qualified:  "text-amber-400 bg-amber-400/10",
  Proposal:   "text-violet-400 bg-violet-400/10",
  Won:        "text-emerald-400 bg-emerald-400/10",
  Lost:       "text-rose-400 bg-rose-400/10",
};

const ALL_STATUSES: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

/** Returns the full display name and the two-character avatar initials */
function leadName(lead: Lead): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—";
}
function leadInitials(lead: Lead): string {
  return ((lead.firstName?.[0] ?? "") + (lead.lastName?.[0] ?? "")).toUpperCase() || "?";
}

export default function LeadsPage() {
  const { profile } = useAppState();

  // ── Local state ─────────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCsv, setShowCsv] = useState(false);
  const [csvText, setCsvText] = useState("");

  // ── Fetch all leads from Supabase ─────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Leads] fetch error:", error.message);
      toast.error("Failed to load leads");
    } else {
      setLeads((data ?? []).map(dbLeadToLocal));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    leads.filter(l => {
      const name = leadName(l).toLowerCase();
      const matchQ =
        query === "" ||
        name.includes(query.toLowerCase()) ||
        (l.email   || "").toLowerCase().includes(query.toLowerCase()) ||
        (l.company || "").toLowerCase().includes(query.toLowerCase());
      const matchS = statusFilter === "All" || l.status === statusFilter;
      return matchQ && matchS;
    }),
    [leads, query, statusFilter]
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from("leads").delete().eq("id", deleteId);
    if (error) {
      console.error("[Leads] delete error:", error.message);
      toast.error("Failed to delete lead");
    } else {
      setLeads(prev => prev.filter(l => l.id !== deleteId));
      toast.success("Lead deleted");
    }
    setDeleteId(null);
  }

  // ── CSV Import ────────────────────────────────────────────────────────────
  // Expected CSV columns: first_name, last_name, email, company, website
  async function handleImportCsv() {
    const lines = csvText.trim().split("\n").slice(1);
    const rows = lines
      .map(line => {
        const [first_name = "", last_name = "", email = "", company = "", website = ""] =
          line.split(",").map(s => s.trim());
        return { first_name, last_name, email, company: company || null, website: website || null, status: "New" };
      })
      .filter(r => r.email);

    if (rows.length === 0) {
      toast.error("No valid rows found. Check your CSV format.");
      return;
    }

    const { error } = await supabase.from("leads").insert(rows);
    if (error) {
      console.error("[Leads] CSV import error:", error.message);
      toast.error("Import failed: " + error.message);
    } else {
      toast.success(`${rows.length} leads imported`);
      await fetchLeads();
    }
    setCsvText("");
    setShowCsv(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Leads</h2>
          <p className="text-sm text-slate-400 mt-0.5">{leads.length} total leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCsv(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg border border-[#1f2d45] transition-colors"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search leads…"
            className="pl-9 pr-3 py-2 text-sm bg-[#111827] border border-[#1f2d45] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[#111827] border border-[#1f2d45] rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table / Loading / Empty */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No leads found"
          description="Try adjusting your search or create a new lead."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create First Lead
            </button>
          }
        />
      ) : (
        <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2d45] text-left">
                {["Name", "Email", "Company", "Website", "Socials", "Status", "Created", ""].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2d45]">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-white/2 transition-colors group">
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                        {leadInitials(lead)}
                      </div>
                      <p className="font-medium text-slate-200">{leadName(lead)}</p>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 text-slate-400 text-xs">{lead.email}</td>

                  {/* Company */}
                  <td className="px-4 py-3.5 text-slate-300">{lead.company || "—"}</td>

                  {/* Website */}
                  <td className="px-4 py-3.5">
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Socials */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {lead.linkedin && (
                        <a
                          href={lead.linkedin.startsWith("http") ? lead.linkedin : `https://${lead.linkedin}`}
                          target="_blank" rel="noopener noreferrer" title="LinkedIn"
                          className="text-[#0077b5] hover:opacity-75 transition-opacity"
                        >
                          <LinkedInIcon />
                        </a>
                      )}
                      {lead.instagram && (
                        <a
                          href={lead.instagram.startsWith("http") ? lead.instagram : `https://${lead.instagram}`}
                          target="_blank" rel="noopener noreferrer" title="Instagram"
                          className="text-[#e1306c] hover:opacity-75 transition-opacity"
                        >
                          <InstagramIcon />
                        </a>
                      )}
                      {lead.facebook && (
                        <a
                          href={lead.facebook.startsWith("http") ? lead.facebook : `https://${lead.facebook}`}
                          target="_blank" rel="noopener noreferrer" title="Facebook"
                          className="text-[#1877f2] hover:opacity-75 transition-opacity"
                        >
                          <FacebookIcon />
                        </a>
                      )}
                      {!lead.linkedin && !lead.instagram && !lead.facebook && (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[lead.status ?? "New"]}`}>
                      {lead.status}
                    </span>
                  </td>


                  {/* Created */}
                  <td className="px-4 py-3.5 text-slate-600 text-xs">
                    {lead.createdAt ? format(new Date(lead.createdAt), "MMM d") : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditLead(lead)}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(lead.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 transition-colors"
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

      {/* CSV Modal */}
      {showCsv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowCsv(false)}
        >
          <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl p-6 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Import Leads via CSV</h3>
            <p className="text-xs text-slate-400 mb-3">
              First row must be headers:{" "}
              <code className="bg-white/10 px-1 rounded">first_name,last_name,email,company,website</code>
            </p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={8}
              placeholder={"first_name,last_name,email,company,website\nJohn,Doe,john@example.com,Acme,https://acme.com"}
              className="w-full px-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCsv(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleImportCsv}
                disabled={!csvText.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && <LeadFormModal onClose={() => setShowCreate(false)} onSaved={fetchLeads} />}
      {editLead  && <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} onSaved={fetchLeads} />}
      <ConfirmModal
        open={!!deleteId}
        title="Delete Lead"
        description="Permanently remove this lead?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
