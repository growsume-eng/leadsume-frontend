"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Lead } from "@/lib/types";
import {
  Search, Tag, Users, ChevronDown, ChevronRight,
  Filter, X, Check,
} from "lucide-react";
import CsvImportModal from "@/components/campaigns/CsvImportModal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecipientsTabProps {
  leads: Lead[];
  selectedLeadIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onLeadsImported: (newLeads: Lead[]) => void;
}

// ─── Filter state ─────────────────────────────────────────────────────────────

interface ActiveFilters {
  companies: string[];
  tags:      string[];
  cities:    string[];
  states:    string[];
}

const EMPTY_FILTERS: ActiveFilters = { companies: [], tags: [], cities: [], states: [] };

function countActiveFilters(f: ActiveFilters) {
  return f.companies.length + f.tags.length + f.cities.length + f.states.length;
}

// ─── Unique value extractors ─────────────────────────────────────────────────

function uniq(vals: (string | undefined)[]): string[] {
  const s = new Set<string>();
  vals.forEach(v => { if (v) s.add(v); });
  return Array.from(s).sort();
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function matchesFilters(lead: Lead, search: string, f: ActiveFilters): boolean {
  if (search) {
    const q = search.toLowerCase();
    const name = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    if (!name.includes(q) && !lead.email.toLowerCase().includes(q) && !(lead.company ?? "").toLowerCase().includes(q)) return false;
  }
  if (f.companies.length && !f.companies.includes(lead.company ?? ""))        return false;
  if (f.tags.length      && !f.tags.every(t => lead.tags?.includes(t)))       return false;
  if (f.cities.length    && !f.cities.includes(lead.city ?? ""))               return false;
  if (f.states.length    && !f.states.includes(lead.state ?? ""))              return false;
  return true;
}

// ─── Filter dropdown ─────────────────────────────────────────────────────────

interface FilterSection {
  key: keyof ActiveFilters;
  label: string;
  options: string[];
}

function CheckboxList({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  if (!options.length) return <p className="text-[10px] text-slate-600 px-1 py-2">No options available</p>;
  return (
    <div className="max-h-36 overflow-y-auto space-y-0.5">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <label
            key={opt}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/4 cursor-pointer transition-colors"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${active ? "bg-indigo-600 border-indigo-500" : "border-[#2d3f5c] bg-[#0b0f1a]"}`}>
              {active && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className={`text-xs truncate ${active ? "text-slate-200" : "text-slate-400"}`}>{opt}</span>
            <input
              type="checkbox"
              checked={active}
              onChange={e => onChange(e.target.checked ? [...selected, opt] : selected.filter(x => x !== opt))}
              className="sr-only"
            />
          </label>
        );
      })}
    </div>
  );
}

function FilterDropdown({
  sections,
  filters,
  onChange,
  onClear,
  onClose,
}: {
  sections: FilterSection[];
  filters: ActiveFilters;
  onChange: (key: keyof ActiveFilters, next: string[]) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [openSection, setOpenSection] = useState<keyof ActiveFilters | null>("companies");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const totalActive = countActiveFilters(filters);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1.5 z-40 w-72 bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2d45]">
        <span className="text-xs font-semibold text-slate-300">Filters</span>
        <div className="flex items-center gap-2">
          {totalActive > 0 && (
            <button onClick={onClear} className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors">
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-[#1f2d45]">
        {sections.map(sec => {
          const isOpen    = openSection === sec.key;
          const selCount  = filters[sec.key].length;
          return (
            <div key={sec.key}>
              <button
                onClick={() => setOpenSection(isOpen ? null : sec.key)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">{sec.label}</span>
                  {selCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-semibold">
                      {selCount}
                    </span>
                  )}
                </div>
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                }
              </button>
              {isOpen && (
                <div className="px-3 pb-3">
                  <CheckboxList
                    options={sec.options}
                    selected={filters[sec.key]}
                    onChange={next => onChange(sec.key, next)}
                  />
                  {filters[sec.key].length > 0 && (
                    <button
                      onClick={() => onChange(sec.key, [])}
                      className="mt-1.5 text-[10px] text-rose-400 hover:text-rose-300 pl-1 transition-colors"
                    >
                      Clear {sec.label.toLowerCase()}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Lead row ─────────────────────────────────────────────────────────────────

function LeadRow({ lead, checked, onChange }: { lead: Lead; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 cursor-pointer transition-colors">
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
            <span key={t} className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-indigo-600/15 text-indigo-400 border border-indigo-600/20">{t}</span>
          ))}
          {(lead.tags?.length ?? 0) > 2 && (
            <span className="text-[9px] text-slate-600">+{(lead.tags?.length ?? 0) - 2}</span>
          )}
        </div>
        <p className="text-xs text-slate-600 truncate">
          {lead.email}
          {lead.company  && ` · ${lead.company}`}
          {lead.city     && ` · ${lead.city}`}
          {lead.state    && `, ${lead.state}`}
        </p>
      </div>
      {lead.customFields && Object.keys(lead.customFields).length > 0 && (
        <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">custom</span>
      )}
    </label>
  );
}

// ─── Tag group ─────────────────────────────────────────────────────────────────

function TagGroup({ tag, leads, selectedIds, onToggle }: {
  tag: string; leads: Lead[]; selectedIds: string[]; onToggle: (id: string, v: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const allChecked  = leads.length > 0 && leads.every(l => selectedIds.includes(l.id));
  const someChecked = leads.some(l => selectedIds.includes(l.id));

  return (
    <div className="border border-[#1f2d45] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#0b0f1a] hover:bg-[#0d1424] transition-colors"
      >
        <input
          type="checkbox" checked={allChecked}
          ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
          onChange={e => { e.stopPropagation(); leads.forEach(l => onToggle(l.id, !allChecked)); }}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded accent-indigo-500"
        />
        <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-300">{tag}</span>
        <span className="text-[10px] text-slate-600 ml-1">({leads.length})</span>
        <span className="ml-auto">{open ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}</span>
      </button>
      {open && (
        <div className="divide-y divide-[#1f2d45]/50">
          {leads.map(l => (
            <LeadRow key={l.id} lead={l} checked={selectedIds.includes(l.id)} onChange={v => onToggle(l.id, v)} />
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
  const [search,      setSearch]      = useState("");
  const [filters,     setFilters]     = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFilter,  setShowFilter]  = useState(false);
  const [showCsv,     setShowCsv]     = useState(false);
  const [groupByTags, setGroupByTags] = useState(false);

  // ── Option lists ──────────────────────────────────────────────────────────────
  const companies = useMemo(() => uniq(leads.map(l => l.company)), [leads]);
  const tags      = useMemo(() => uniq(leads.flatMap(l => l.tags ?? [])), [leads]);
  const cities    = useMemo(() => uniq(leads.map(l => l.city)),    [leads]);
  const states    = useMemo(() => uniq(leads.map(l => l.state)),   [leads]);

  const filterSections: FilterSection[] = [
    { key: "companies", label: "Company", options: companies },
    { key: "tags",      label: "Tags",    options: tags      },
    { key: "cities",    label: "City",    options: cities    },
    { key: "states",    label: "State",   options: states    },
  ];

  // ── Filtered leads ────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(
    () => leads.filter(l => matchesFilters(l, search, filters)),
    [leads, search, filters],
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasFilter         = search || activeFilterCount > 0;

  // ── Filter update helper ──────────────────────────────────────────────────────
  function updateFilter(key: keyof ActiveFilters, next: string[]) {
    setFilters(prev => ({ ...prev, [key]: next }));
  }

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const toggle = useCallback((id: string, checked: boolean) => {
    onSelectionChange(
      checked
        ? [...selectedLeadIds, id].filter((v, i, a) => a.indexOf(v) === i)
        : selectedLeadIds.filter(x => x !== id),
    );
  }, [selectedLeadIds, onSelectionChange]);

  function selectAllFiltered() {
    const ids = filteredLeads.map(l => l.id);
    onSelectionChange([...selectedLeadIds, ...ids].filter((v, i, a) => a.indexOf(v) === i));
  }

  function deselectAllFiltered() {
    const ids = new Set(filteredLeads.map(l => l.id));
    onSelectionChange(selectedLeadIds.filter(id => !ids.has(id)));
  }

  const allFilteredSelected  = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));
  const someFilteredSelected = filteredLeads.some(l => selectedLeadIds.includes(l.id));

  // ── Tag groups ────────────────────────────────────────────────────────────────
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

  // ── Active filter chips (for display below search row) ────────────────────────
  const activeChips = useMemo(() => {
    const chips: { key: keyof ActiveFilters; value: string }[] = [];
    (Object.entries(filters) as [keyof ActiveFilters, string[]][]).forEach(([key, vals]) => {
      vals.forEach(v => chips.push({ key, value: v }));
    });
    return chips;
  }, [filters]);

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

      {/* ── Search + Filter row ── */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full pl-9 pr-3 py-2 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filter button + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              activeFilterCount > 0
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : "bg-[#0b0f1a] border-[#1f2d45] text-slate-400 hover:text-slate-200 hover:border-slate-500"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilter && (
            <FilterDropdown
              sections={filterSections}
              filters={filters}
              onChange={updateFilter}
              onClear={() => setFilters(EMPTY_FILTERS)}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>

        {/* Group by tags toggle */}
        {tags.length > 0 && (
          <button
            onClick={() => setGroupByTags(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${
              groupByTags
                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                : "bg-[#0b0f1a] border-[#1f2d45] text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tag className="w-3 h-3" /> Group
          </button>
        )}
      </div>

      {/* ── Active filter chips ── */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-slate-600">Filters applied: {activeFilterCount}</span>
          {activeChips.map(({ key, value }) => (
            <span
              key={`${key}-${value}`}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-300 border border-indigo-500/25"
            >
              {value}
              <button
                onClick={() => updateFilter(key, filters[key].filter(v => v !== value))}
                className="text-indigo-400 hover:text-rose-400 transition-colors ml-0.5"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Bulk select bar ── */}
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
              <button
                onClick={() => onSelectionChange([])}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
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
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-slate-600 text-sm">No leads match the current filters.</p>
          <button onClick={() => { setFilters(EMPTY_FILTERS); setSearch(""); }} className="text-xs text-indigo-400 hover:text-indigo-300">
            Clear filters
          </button>
        </div>
      ) : groupByTags && tagGroups ? (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {Array.from(tagGroups.groups.entries()).map(([tag, tagLeads]) => (
            <TagGroup key={tag} tag={tag} leads={tagLeads} selectedIds={selectedLeadIds} onToggle={toggle} />
          ))}
          {tagGroups.untagged.length > 0 && (
            <TagGroup tag="Untagged" leads={tagGroups.untagged} selectedIds={selectedLeadIds} onToggle={toggle} />
          )}
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto border border-[#1f2d45] rounded-xl divide-y divide-[#1f2d45]/60">
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
          onImported={newLeads => { onLeadsImported(newLeads); setShowCsv(false); }}
        />
      )}
    </div>
  );
}
