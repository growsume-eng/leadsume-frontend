"use client";

import { useState, useMemo, useCallback } from "react";
import type { Lead } from "@/lib/types";
import { Search, Tag, Building2, Users, CheckSquare, Square, ChevronDown, ChevronRight } from "lucide-react";
import CsvImportModal from "@/components/campaigns/CsvImportModal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipientsTabProps {
  leads: Lead[];                                // all available leads from Supabase
  selectedLeadIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onLeadsImported: (newLeads: Lead[]) => void;  // bubble imported leads up to parent
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function allTags(leads: Lead[]): string[] {
  const set = new Set<string>();
  leads.forEach(l => l.tags?.forEach(t => set.add(t)));
  return Array.from(set).sort();
}

function allCompanies(leads: Lead[]): string[] {
  const set = new Set<string>();
  leads.forEach(l => { if (l.company) set.add(l.company); });
  return Array.from(set).sort();
}

function matchesFilters(lead: Lead, search: string, tagFilter: string[], companyFilter: string): boolean {
  if (search) {
    const q = search.toLowerCase();
    const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    if (!fullName.includes(q) && !lead.email.toLowerCase().includes(q) && !(lead.company ?? "").toLowerCase().includes(q)) return false;
  }
  if (tagFilter.length) {
    if (!tagFilter.every(t => lead.tags?.includes(t))) return false;
  }
  if (companyFilter && lead.company !== companyFilter) return false;
  return true;
}

// ─── Lead row ─────────────────────────────────────────────────────────────────

function LeadRow({ lead, checked, onChange }: { lead: Lead; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 cursor-pointer transition-colors group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-indigo-500 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${checked ? "text-slate-200" : "text-slate-400"}`}>
            {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email}
          </p>
          {lead.tags?.slice(0, 2).map(t => (
            <span key={t} className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-indigo-600/15 text-indigo-400 border border-indigo-600/20">
              {t}
            </span>
          ))}
          {(lead.tags?.length ?? 0) > 2 && (
            <span className="text-[9px] text-slate-600">+{(lead.tags?.length ?? 0) - 2}</span>
          )}
        </div>
        <p className="text-xs text-slate-600 truncate">{lead.email} {lead.company ? `· ${lead.company}` : ""}</p>
      </div>
      {lead.customFields && Object.keys(lead.customFields).length > 0 && (
        <span title="Has custom fields" className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
          custom
        </span>
      )}
    </label>
  );
}

// ─── Tag group ────────────────────────────────────────────────────────────────

function TagGroup({ tag, leads, selectedIds, onToggle }: {
  tag: string;
  leads: Lead[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const allChecked = leads.length > 0 && leads.every(l => selectedIds.includes(l.id));
  const someChecked = leads.some(l => selectedIds.includes(l.id));

  function toggleAll() {
    if (allChecked) {
      leads.forEach(l => onToggle(l.id, false));
    } else {
      leads.forEach(l => onToggle(l.id, true));
    }
  }

  return (
    <div className="border border-[#1f2d45] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#0b0f1a] hover:bg-[#0d1424] transition-colors"
      >
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
          onChange={e => { e.stopPropagation(); toggleAll(); }}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded accent-indigo-500"
        />
        <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-300">{tag}</span>
        <span className="text-[10px] text-slate-600 ml-1">({leads.length})</span>
        <span className="ml-auto">
          {open ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-[#1f2d45]/50">
          {leads.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              checked={selectedIds.includes(lead.id)}
              onChange={v => onToggle(lead.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecipientsTab({
  leads,
  selectedLeadIds,
  onSelectionChange,
  onLeadsImported,
}: RecipientsTabProps) {
  const [search,        setSearch]        = useState("");
  const [tagFilter,     setTagFilter]     = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [showCsv,       setShowCsv]       = useState(false);
  const [groupByTags,   setGroupByTags]   = useState(false);

  const tags     = useMemo(() => allTags(leads),     [leads]);
  const companies = useMemo(() => allCompanies(leads), [leads]);

  // Apply filters
  const filteredLeads = useMemo(
    () => leads.filter(l => matchesFilters(l, search, tagFilter, companyFilter)),
    [leads, search, tagFilter, companyFilter],
  );

  const hasFilter = search || tagFilter.length > 0 || companyFilter;

  // ── Selection helpers ───────────────────────────────────────────────────────
  const toggle = useCallback((id: string, checked: boolean) => {
    onSelectionChange(
      checked
        ? [...selectedLeadIds, id].filter((v, i, a) => a.indexOf(v) === i)
        : selectedLeadIds.filter(x => x !== id),
    );
  }, [selectedLeadIds, onSelectionChange]);

  function selectAllFiltered() {
    const ids = filteredLeads.map(l => l.id);
    const merged = [...selectedLeadIds, ...ids].filter((v, i, a) => a.indexOf(v) === i);
    onSelectionChange(merged);
  }

  function deselectAllFiltered() {
    const ids = new Set(filteredLeads.map(l => l.id));
    onSelectionChange(selectedLeadIds.filter(id => !ids.has(id)));
  }

  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));
  const someFilteredSelected = filteredLeads.some(l => selectedLeadIds.includes(l.id));

  // ── Tag groups ──────────────────────────────────────────────────────────────
  const tagGroups = useMemo(() => {
    if (!groupByTags) return null;
    const groups = new Map<string, Lead[]>();
    const untagged: Lead[] = [];
    filteredLeads.forEach(l => {
      if (!l.tags?.length) { untagged.push(l); return; }
      l.tags.forEach(t => {
        if (!groups.has(t)) groups.set(t, []);
        groups.get(t)!.push(l);
      });
    });
    return { groups, untagged };
  }, [filteredLeads, groupByTags]);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-200">Select Recipients</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedLeadIds.length} of {leads.length} leads selected
            {hasFilter && ` · ${filteredLeads.length} matching filters`}
          </p>
        </div>
        <button
          onClick={() => setShowCsv(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/8 text-slate-300 border border-[#1f2d45] rounded-lg transition-colors"
        >
          Import CSV
        </button>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full pl-9 pr-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Company filter */}
        {companies.length > 0 && (
          <div className="relative">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              className="pl-7 pr-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
              <option value="">All companies</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Group by tags toggle */}
        {tags.length > 0 && (
          <button
            onClick={() => setGroupByTags(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${groupByTags ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400" : "bg-white/5 border-[#1f2d45] text-slate-400 hover:text-slate-200"}`}
          >
            <Tag className="w-3 h-3" /> Group by tags
          </button>
        )}
      </div>

      {/* ── Tag filter chips ── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => {
            const active = tagFilter.includes(t);
            return (
              <button
                key={t}
                onClick={() => setTagFilter(prev => active ? prev.filter(x => x !== t) : [...prev, t])}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${active ? "bg-indigo-600/25 border-indigo-500/40 text-indigo-300" : "bg-[#0b0f1a] border-[#1f2d45] text-slate-500 hover:text-slate-300"}`}
              >
                {t}
              </button>
            );
          })}
          {tagFilter.length > 0 && (
            <button onClick={() => setTagFilter([])} className="text-[10px] text-rose-400 hover:text-rose-300 px-1">
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Bulk select row ── */}
      {filteredLeads.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#0d1424] border border-[#1f2d45] rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={el => { if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected; }}
              onChange={allFilteredSelected ? deselectAllFiltered : selectAllFiltered}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            <span className="text-xs text-slate-400">
              {hasFilter ? `Select all ${filteredLeads.length} filtered` : `Select all ${leads.length} leads`}
            </span>
          </label>
          {selectedLeadIds.length > 0 && (
            <>
              <div className="w-px h-4 bg-[#1f2d45]" />
              <button onClick={() => onSelectionChange([])} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                Clear selection
              </button>
            </>
          )}
          <span className="ml-auto text-xs font-semibold text-indigo-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {selectedLeadIds.length} selected
          </span>
        </div>
      )}

      {/* ── Lead list ── */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-slate-500 text-sm mb-2">No leads yet</p>
          <button onClick={() => setShowCsv(true)} className="text-xs text-indigo-400 hover:text-indigo-300">
            Import leads via CSV →
          </button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-slate-600 text-sm">No leads match the current filters.</p>
        </div>
      ) : groupByTags && tagGroups ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {Array.from(tagGroups.groups.entries()).map(([tag, tagLeads]) => (
            <TagGroup
              key={tag}
              tag={tag}
              leads={tagLeads}
              selectedIds={selectedLeadIds}
              onToggle={toggle}
            />
          ))}
          {tagGroups.untagged.length > 0 && (
            <TagGroup
              tag="Untagged"
              leads={tagGroups.untagged}
              selectedIds={selectedLeadIds}
              onToggle={toggle}
            />
          )}
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-0.5 border border-[#1f2d45] rounded-xl divide-y divide-[#1f2d45]/60">
          {filteredLeads.map(lead => (
            <LeadRow
              key={lead.id}
              lead={lead}
              checked={selectedLeadIds.includes(lead.id)}
              onChange={v => toggle(lead.id, v)}
            />
          ))}
        </div>
      )}

      {/* ── CSV modal ── */}
      {showCsv && (
        <CsvImportModal
          onClose={() => setShowCsv(false)}
          onImported={newLeads => {
            onLeadsImported(newLeads);
            setShowCsv(false);
          }}
        />
      )}
    </div>
  );
}
