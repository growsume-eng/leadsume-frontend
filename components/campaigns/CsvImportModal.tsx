"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { X, Upload, AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/lib/types";
import { generateId } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Standard lead fields that map 1-to-1 with Supabase columns */
const STANDARD_FIELDS = [
  { value: "first_name",  label: "First Name"  },
  { value: "last_name",   label: "Last Name"   },
  { value: "email",       label: "Email"       },
  { value: "company",     label: "Company"     },
  { value: "website",     label: "Website"     },
  { value: "linkedin",    label: "LinkedIn"    },
  { value: "instagram",   label: "Instagram"   },
  { value: "facebook",    label: "Facebook"    },
  { value: "city",        label: "City"        },
  { value: "state",       label: "State"       },
  { value: "tags",        label: "Tags (comma-separated)" },
  { value: "__skip",      label: "— Skip this column —"  },
  { value: "__custom",    label: "→ Custom field ({{token}})" },
] as const;

type StandardField = typeof STANDARD_FIELDS[number]["value"];

/** Guess a field mapping from a CSV header string */
function guessField(header: string): StandardField {
  const h = header.toLowerCase().replace(/[\s_-]/g, "");
  if (h.includes("firstname") || h === "fname" || h === "first") return "first_name";
  if (h.includes("lastname")  || h === "lname" || h === "last")  return "last_name";
  if (h.includes("email"))    return "email";
  if (h.includes("company") || h.includes("org"))     return "company";
  if (h.includes("website") || h.includes("url"))     return "website";
  if (h.includes("linkedin")) return "linkedin";
  if (h.includes("instagram") || h === "ig")          return "instagram";
  if (h.includes("facebook")  || h === "fb")          return "facebook";
  if (h.includes("tag"))      return "tags";
  if (h.includes("city"))     return "city";
  if (h.includes("state") || h.includes("province"))  return "state";
  return "__custom";
}

/** Slugify a CSV header into a safe custom_field token */
function toToken(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColumnMapping {
  csvHeader:   string;
  mappedField: StandardField;
  customToken: string; // used when mappedField === "__custom"
}

interface CsvImportModalProps {
  onClose:    () => void;
  onImported: (leads: Lead[]) => void;
}

// ─── Row preview ─────────────────────────────────────────────────────────────

function MappingRow({
  mapping,
  sampleValue,
  onChange,
}: {
  mapping: ColumnMapping;
  sampleValue: string;
  onChange: (next: ColumnMapping) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-[#1f2d45] last:border-0">
      {/* CSV Column */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-300 truncate">{mapping.csvHeader}</p>
        <p className="text-[10px] text-slate-600 truncate">{sampleValue || "—"}</p>
      </div>

      {/* Arrow */}
      <ChevronDown className="w-3.5 h-3.5 text-slate-600 rotate-[-90deg] shrink-0" />

      {/* App field */}
      <div className="space-y-1.5">
        <select
          value={mapping.mappedField}
          onChange={e => onChange({ ...mapping, mappedField: e.target.value as StandardField })}
          className="w-full px-2 py-1.5 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STANDARD_FIELDS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {mapping.mappedField === "__custom" && (
          <input
            value={mapping.customToken}
            onChange={e => onChange({ ...mapping, customToken: toToken(e.target.value) })}
            placeholder="token_name"
            className="w-full px-2 py-1 bg-[#0b0f1a] border border-[#1f2d45] rounded-lg text-[10px] text-amber-400 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        )}
        {mapping.mappedField === "__custom" && mapping.customToken && (
          <p className="text-[9px] text-slate-600">Use as: <code className="text-amber-400">{`{{${mapping.customToken}}}`}</code></p>
        )}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function CsvImportModal({ onClose, onImported }: CsvImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows,         setRows]         = useState<Record<string, string>[]>([]);
  const [mappings,     setMappings]     = useState<ColumnMapping[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [phase,        setPhase]        = useState<"upload" | "map" | "done">("upload");
  const [insertedCount, setInsertedCount] = useState(0);

  // ── Parse CSV ───────────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setError(null);
    Papa.parse<Record<string, string>>(file, {
      header:         true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data.length) { setError("CSV has no rows."); return; }
        const hdrs = result.meta.fields ?? [];
        setRows(result.data);
        setMappings(hdrs.map(h => ({
          csvHeader:   h,
          mappedField: guessField(h),
          customToken: toToken(h),
        })));
        setPhase("map");
      },
      error: (err) => setError(err.message),
    });
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function updateMapping(i: number, next: ColumnMapping) {
    setMappings(prev => prev.map((m, idx) => idx === i ? next : m));
  }

  // ── Build lead objects ──────────────────────────────────────────────────────
  function buildLeads() {
    return rows
      .map(row => {
        const std:    Record<string, string> = {};
        const custom: Record<string, string> = {};

        for (const m of mappings) {
          const val = (row[m.csvHeader] ?? "").trim();
          if (m.mappedField === "__skip" || !val) continue;
          if (m.mappedField === "__custom") {
            if (m.customToken) custom[m.customToken] = val;
          } else {
            std[m.mappedField] = val;
          }
        }

        // Build the Supabase row payload directly (snake_case)
        const payload: Record<string, unknown> = {
          first_name:    std["first_name"]  || null,
          last_name:     std["last_name"]   || null,
          email:         std["email"]       || null,
          company:       std["company"]     || null,
          website:       std["website"]     || null,
          linkedin:      std["linkedin"]    || null,
          instagram:     std["instagram"]   || null,
          facebook:      std["facebook"]    || null,
          city:          std["city"]        || null,
          state:         std["state"]       || null,
          tags:          std["tags"] ? std["tags"].split(",").map(t => t.trim()).filter(Boolean).join(",") : null,
          status:        "New",
          custom_fields: Object.keys(custom).length ? custom : null,
        };

        return { payload, email: std["email"] || null };
      })
      .filter(r => !!r.email); // require email
  }

  // ── Save to Supabase ────────────────────────────────────────────────────────
  async function handleImport() {
    setSaving(true);
    setError(null);
    try {
      const built = buildLeads();

      if (!built.length) {
        setError("No valid leads found. Make sure 'Email' column is mapped and not empty.");
        setSaving(false);
        return;
      }

      const payload = built.map(r => r.payload);
      console.log("[CsvImport] inserting", payload.length, "leads:", payload);

      // Insert in batches of 100 to stay within Supabase row limits
      const BATCH = 100;
      let inserted: any[] = [];

      for (let i = 0; i < payload.length; i += BATCH) {
        const batch = payload.slice(i, i + BATCH);
        const { data, error: dbErr } = await supabase
          .from("leads")
          .insert(batch)
          .select();

        if (dbErr) {
          console.error("[CsvImport] Supabase error:", dbErr.code, dbErr.message, dbErr.details);
          throw new Error(`Supabase error (${dbErr.code}): ${dbErr.message}`);
        }

        console.log("[CsvImport] batch inserted:", data?.length, "rows");
        inserted = [...inserted, ...(data ?? [])];
      }

      // Map returned rows to Lead[]
      const importedLeads: Lead[] = inserted.map((row: any) => ({
        id:           row.id,
        firstName:    row.first_name  || "",
        lastName:     row.last_name   || "",
        email:        row.email       || "",
        company:      row.company     ?? undefined,
        website:      row.website     ?? undefined,
        linkedin:     row.linkedin    ?? undefined,
        instagram:    row.instagram   ?? undefined,
        facebook:     row.facebook    ?? undefined,
        city:         row.city        ?? undefined,
        state:        row.state       ?? undefined,
        tags:         (row.tags || "").split(",").filter(Boolean),
        status:       row.status      || "New",
        customFields: row.custom_fields ?? undefined,
        createdAt:    row.created_at,
      }));

      console.log("[CsvImport] done — inserted", importedLeads.length, "leads");
      setInsertedCount(importedLeads.length);
      setPhase("done");
      onImported(importedLeads);
    } catch (err: any) {
      console.error("[CsvImport] import failed:", err);
      setError(err?.message ?? "Import failed. Open DevTools console for details.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111827] border border-[#1f2d45] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2d45] shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">
            {phase === "upload" && "Import CSV"}
            {phase === "map"    && `Map Fields — ${rows.length} rows`}
            {phase === "done"   && "Import Complete"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Upload phase ── */}
          {phase === "upload" && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#1f2d45] hover:border-indigo-500/50 rounded-2xl p-10 cursor-pointer transition-colors group"
            >
              <Upload className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">Drop CSV file here</p>
                <p className="text-xs text-slate-600 mt-0.5">or click to browse</p>
              </div>
              <p className="text-[10px] text-slate-700">Supports: first_name, last_name, email, company, website, linkedin, and custom columns</p>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
            </div>
          )}

          {/* ── Map phase ── */}
          {phase === "map" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Map each CSV column to an app field. Unknown columns can be stored as <code className="text-amber-400 bg-amber-400/10 px-1 rounded">custom_fields</code> and used as <code className="text-amber-400">{"{{token}}"}</code> in emails.
              </p>

              <div className="bg-[#0d1424] border border-[#1f2d45] rounded-xl px-4">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 py-2 border-b border-[#1f2d45]">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CSV Column</span>
                  <span />
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">App Field</span>
                </div>
                {mappings.map((m, i) => (
                  <MappingRow
                    key={m.csvHeader}
                    mapping={m}
                    sampleValue={rows[0]?.[m.csvHeader] ?? ""}
                    onChange={next => updateMapping(i, next)}
                  />
                ))}
              </div>

              {/* Custom fields info */}
              {mappings.some(m => m.mappedField === "__custom" && m.customToken) && (
                <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Custom fields detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mappings.filter(m => m.mappedField === "__custom" && m.customToken).map(m => (
                        <code key={m.customToken} className="bg-amber-400/15 px-1.5 py-0.5 rounded text-[10px]">{`{{${m.customToken}}}`}</code>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">Use these tokens in your email sequences for personalisation.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {insertedCount} lead{insertedCount !== 1 ? "s" : ""} imported successfully
              </p>
              <p className="text-xs text-slate-500">Saved to Supabase and added to your recipients list.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase !== "done" && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1f2d45] shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            {phase === "map" && (
              <button
                onClick={handleImport}
                disabled={saving || !mappings.some(m => m.mappedField === "email")}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Importing…" : `Import ${rows.length} Leads`}
              </button>
            )}
          </div>
        )}
        {phase === "done" && (
          <div className="flex justify-end px-6 py-4 border-t border-[#1f2d45] shrink-0">
            <button onClick={onClose} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
